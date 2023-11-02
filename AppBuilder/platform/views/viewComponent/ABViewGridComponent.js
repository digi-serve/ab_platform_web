import ABViewComponent from "./ABViewComponent";
import ABPopupExport from "../ABViewGridPopupExport";
import ABPopupMassUpdateClass from "../ABViewGridPopupMassUpdate";
import ABPopupSortField from "../ABViewGridPopupSortFields";

function timeout(ms) {
   return new Promise((resolve) => setTimeout(resolve, ms));
}

export default class ABViewGridComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewGrid_${baseView.id}`,
         Object.assign(
            {
               table: "",

               // component: `${base}_component`,
               toolbar: "",
               buttonDeleteSelected: "",

               buttonFilter: "",
               buttonMassUpdate: "",
               buttonSort: "",
               buttonExport: "",

               globalSearchToolbar: "",

               datatable: "",
            },
            ids
         )
      );

      this._handler_filterData = (fnFilter, filterRules) => {
         this.callbackFilterData(fnFilter, filterRules); // be notified when there is a change in the filter
      };

      this.handler_select = (...params) => {
         this.selectRow(...params);
      };
      // {fn} .handler_select
      // the callback fn for our selectRow()
      // We want this called when the .datacollection we are linked to
      // emits an "onChange" event.

      this.detatch();
      baseView.filterHelper.on("filter.data", this._handler_filterData);

      // derive these from viewGrid
      this.id = baseView.id;

      /////
      ///// For TEsting:
      /////
      // this.settings.showToolbar = 1;
      // this.settings.isEditable = 1;
      // this.settings.isExportable = 1;
      // this.settings.gridFilter = {
      //    filterOption: 1,
      //    userFilterPosition: "form",
      //    isGlobalToolbar: 1,
      // };

      // this.settings.detailsPage = "some-uuid";
      // this.settings.detailTab = "some_uuid_2";
      // this.settings.trackView = 1;
      /////
      ///// end testing
      /////

      this.columnSplitLeft = 0;
      // {integer}
      // Which column to "split"/"freeze" from the left side of the grid.

      this.columnSplitRight = 0;
      // {integer}
      // The # columns to the right to freeze.

      // this.datacollection = null;
      // // {ABDataCollection}
      // // The Webix DataCollection that manages the data we are displaying.

      this.validationError = false;
      // {bool}
      // Has a Validation Error occured?

      this.linkPage = baseView.linkPageHelper.component();
      // {ABViewPropertyLinkPage}
      //

      const idTable = this.ids.table;
      const ab = this.AB;

      this.PopupExport = new ABPopupExport(idTable);
      this.PopupExport.init(ab);
      // {ABViewGridPopupExport}
      // Popup for managing how to export our data.

      this.PopupMassUpdateComponent = new ABPopupMassUpdateClass(this, idTable);
      this.PopupMassUpdateComponent.init(ab);
      // this.PopupMassUpdateComponent.on("")
      // {}
      // The popup for performing a Mass Edit operation.

      this.PopupSortDataTableComponent = new ABPopupSortField(idTable);
      this.PopupSortDataTableComponent.init(ab);
      this.PopupSortDataTableComponent.on("changed", (sortOptions) => {
         this.callbackSortData(sortOptions);
      });
      // {ABViewGridPopupSortFields}
      // The popup for adding sort criteria to our grid.

      this.skippableColumns = [
         "appbuilder_select_item",
         "appbuilder_view_detail",
         "appbuilder_view_track",
         "appbuilder_view_edit",
         "appbuilder_trash",
      ];
      // {array}
      // An array of column names that should be skipped from some of our
      // event handlers.

      // this.EditField = null;
      // // {ABFieldXXX}
      // // Which ABField is the focus of our PopupHeader menu?

      // this.EditNode = null;
      // // {HTML DOM}
      // // The webix.$node where the ABField Header is that our PopupHeader
      // // should be displayed at.

      this.ignoreLocalSettings = false;
      // {bool}
      // should we ignore our local settings in our current context?
      // (used in ABDesigner when our settings will change as we need to
      // use those instead of the saved settings.)

      this._gridSettings = null;
      // {hash} { grid.id : [ {columnHeader}, {columnHeader} ...]}
      // Keep a global copy of our local Grid settings, so we can optimize the header
      // sizes.

      this._isDatacollectionLoaded = false;
   }

   // {string}
   // the unique key for ABViewGrids to store/retrieve their local settings
   get keyStorageSettings() {
      return "abviewgrid_settings";
   }

   detatch() {
      this.view.filterHelper.removeAllListeners("filter.data");
      this.datacollection?.removeListener("changeCursor", this.handler_select);
   }

   /**
    * @method getColumnIndex()
    * return the Datatable.getColumnIndex() value
    * @param {string} id
    *        the uuid of the column we are referencing.
    * @return {integer}
    */
   getColumnIndex(id) {
      let indx = this.getDataTable().getColumnIndex(id);
      if (!this.settings.massUpdate) {
         // the index is 0 based. So if the massUpdate feature isn't
         // enabled, we need to add 1 to the result so they look like
         // a 1, 2, ...

         indx++;
      }
      return indx;
   }

   uiDatatable() {
      const ids = this.ids;
      const settings = this.settings;
      const self = this;

      let view = "datatable";

      if (settings.isTreeDatable || settings.groupBy)
         // switch datatable to support tree
         view = "treetable";

      let selectType = "cell";

      if (!settings.isEditable && (settings.detailsPage || settings.editPage))
         selectType = "row";

      return {
         view,
         id: ids.datatable,
         resizeColumn: { size: 10 },
         resizeRow: { size: 10 },
         prerender: false,
         editable: settings.isEditable,
         fixedRowHeight: false,
         height: settings.height || 0,
         editaction: "custom",
         select: selectType,
         footer:
            // show footer when there are summary columns
            settings.summaryColumns.length > 0 ||
            settings.countColumns.length > 0,
         tooltip: true,
         // tooltip: {
         //    // id: ids.tooltip,
         //    template: (obj, common) => {
         //       return this.toolTip(obj, common);
         //    },
         //    on: {
         //       // When showing a larger image preview the tooltip sometime displays part of the image off the screen...this attempts to fix that problem
         //       onBeforeRender: function () {
         //          self.toolTipOnBeforeRender(this.getNode());
         //       },
         //       onAfterRender: function (data) {
         //          self.toolTipOnAfterRender(this.getNode());
         //       },
         //    },
         // },
         dragColumn: true,
         on: {
            onBeforeSelect: function (data, preserve) {
               if (self.skippableColumns.indexOf(data.column) != -1) {
                  return false;
               } else if (settings.isEditable) {
                  const currObject = self.datacollection.datasource;
                  const selectField = currObject.fields(
                     (f) => f.columnName === data.column
                  )[0];

                  if (selectField == null) return true;

                  const cellNode = this.getItemNode({
                        row: data.row,
                        column: data.column,
                     }),
                     rowData = this.getItem(data.row);

                  return selectField.customEdit(rowData, null, cellNode);
               } else if (!settings.detailsPage && !settings.editPage)
                  return false;
            },
            onAfterSelect: (data, preserve) => {
               // {ABObject} data
               //            the selected object
               // {bool} prevent
               //        indicates whether the previous selection state should
               //        be saved. (is multiselect and they are holding SHIFT)
               if (this.settings.isEditable) {
                  this.onAfterSelect(data, preserve);
               }
            },
            onBeforeEditStart: function (id) {
               if (!this.getItem(id) == "appbuilder_select_item") return false;
            },
            onCheck: function (row, col, val) {
               // Update checkbox data
               if (col == "appbuilder_select_item") {
                  // do nothing because we will parse the table once we decide
                  // if we are deleting or updating rows
                  self.toggleUpdateDelete();
               } else {
                  if (settings.isEditable) {
                     // if the colum is not the select item column move on to
                     // the next step to save
                     const state = {
                        value: val,
                     };
                     const editor = {
                        row: row,
                        column: col,
                        config: null,
                     };

                     self.onAfterEditStop(state, editor);
                  } else {
                     const node = this.getItemNode({
                        row: row,
                        column: col,
                     });
                     const checkbox = node.querySelector(
                        'input[type="checkbox"]'
                     );

                     if (val == 1) {
                        checkbox.checked = false;
                     } else {
                        checkbox.checked = true;
                     }
                  }
               }
            },
            onBeforeEditStop: function (state, editor) {
               // console.warn("!! ToDo: onBeforeEditStop()");
            },
            onAfterEditStop: (state, editor, ignoreUpdate) => {
               if (this.validationError == false)
                  this.onAfterEditStop(state, editor, ignoreUpdate);
            },
            onValidationError: function () {
               this.validationError = true;
            },
            onValidationSuccess: function () {
               this.validationError = false;
            },

            // We are sorting with server side requests now so we can remove this
            // onAfterLoad: function () {
            //    _logic.onAfterLoad();
            // },
            onColumnResize: function (
               columnName,
               newWidth,
               oldWidth,
               user_action
            ) {
               // if we resize the delete column we want to resize the last
               // column but Webix will not allow since the column is split
               const rightSplitItems = [
                  "appbuilder_view_detail",
                  "appbuilder_view_track",
                  "appbuilder_view_edit",
                  "appbuilder_trash",
               ];

               if (rightSplitItems.indexOf(columnName) != -1) {
                  // Block events so we can leave the delete column alone
                  this.blockEvent();
                  // keeps original width
                  this.setColumnWidth(columnName, oldWidth);
                  this.unblockEvent();
                  // Listen to events again

                  // find the last column's config
                  const column = self.getLastColumn();

                  columnName = column.id;

                  // determine if we are making the column larger or smaller
                  if (newWidth < oldWidth) {
                     newWidth = column.width + 40;
                     // add 40 because there is not any more space to drag so we
                     // will allow 40px increments
                  } else {
                     newWidth = column.width - (newWidth - 40);
                     // take the column's width and subtrack the difference of
                     // the expanded delet column drag
                  }
                  // we don't want columns to be smaller than 50 ?? do we ??
                  // I could be wrong maybe a checkbox could be smaller so this
                  // could change
                  if (newWidth < 50) {
                     newWidth = 50;
                  }
                  // minWidth is important because we are using fillspace:true
                  column.minWidth = newWidth;
                  // Sets the UI
                  this.setColumnWidth(columnName, newWidth);
               }
               // Saves the new width
               if (user_action) {
                  self.onColumnResize(
                     columnName,
                     newWidth,
                     oldWidth,
                     user_action
                  );
               }
            },
            onRowResize: (rowId) => {
               // V2: we no longer do anything onRowResize()
               // before we saved the row height in the record.
               // this.onRowResize(rowId);
            },
            onBeforeColumnDrag: (sourceId, event) =>
               !(this.skippableColumns.indexOf(sourceId) !== -1),
            onBeforeColumnDrop: (sourceId, targetId, event) =>
               // Make sure we are not trying to drop onto one of our special
               // columns ...
               !(this.skippableColumns.indexOf(targetId) !== -1),
            onAfterColumnDrop: (sourceId, targetId, event) =>
               this.onAfterColumnDrop(sourceId, targetId, event),
            // onAfterColumnShow: function (id) {
            //    // console.warn("!! ToDo: onAfterColumnShow()");
            //    // $$(self.webixUiId.visibleFieldsPopup).showField(id);
            // },
            // onAfterColumnHide: function (id) {
            //    // console.warn("!! ToDo: onAfterColumnHide()");
            //    // $$(self.webixUiId.visibleFieldsPopup).hideField(id);
            // },

            onHeaderClick: (id, e, node) => {
               /* if (settings.configureHeaders) */
               this.onHeaderClick(id, e, node);
            },
         },
      };
   }

   uiFilter() {
      return this.view.filterHelper.ui();

      // make sure onFilterData is now .emit()ed instead of passing in a callback.
   }

   /**
    * @method uiToolbar()
    * Return the webix definition for the toolbar row for our Grids.
    * @return {json}
    */
   uiToolbar() {
      const ids = this.ids;
      const self = this;

      return {
         view: "toolbar",
         id: ids.toolbar,
         hidden: true,
         css: "ab-data-toolbar",
         cols: [
            {
               view: "button",
               id: ids.buttonMassUpdate,
               css: "webix_transparent",
               label: this.label("Edit"),
               icon: "fa fa-pencil-square-o",
               type: "icon",
               disabled: true,
               autowidth: true,
               click: function () {
                  self.toolbarMassUpdate(this.$view);
               },
            },
            {
               view: "button",
               id: ids.buttonDeleteSelected,
               css: "webix_transparent",
               label: this.label("Delete"),
               icon: "fa fa-trash",
               type: "icon",
               disabled: true,
               autowidth: true,
               click: function () {
                  self.toolbarDeleteSelected(this.$view);
               },
            },
            {
               view: "button",
               id: ids.buttonFilter,
               css: "webix_transparent",
               label: this.label("Filters"),
               icon: "fa fa-filter",
               type: "icon",
               autowidth: true,
               click: function () {
                  self.toolbarFilter(this.$view);
               },
            },
            {
               view: "button",
               id: ids.buttonSort,
               css: "webix_transparent",
               label: this.label("Sort"),
               icon: "fa fa-sort",
               type: "icon",
               autowidth: true,
               click: function () {
                  self.toolbarSort(this.$view);
               },
            },
            {
               view: "button",
               id: ids.buttonExport,
               css: "webix_transparent",
               label: this.label("Export"),
               icon: "fa fa-print",
               type: "icon",
               autowidth: true,
               click: function () {
                  self.toolbarExport(this.$view);
               },
            },
            {},
            {
               id: ids.globalSearchToolbar,
               view: "search",
               placeholder: this.label("Search..."),
               on: {
                  onTimedKeyPress: () => {
                     const searchText = $$(ids.globalSearchToolbar).getValue();

                     this.view.filterHelper.externalSearchText(searchText);
                  },
               },
            },
         ],
      };
   }

   ui() {
      const _uiGrid = {
         id: this.ids.table,
         type: "space",
         borderless: true,
         rows: [
            {},
            {
               view: "label",
               label: this.label("Select an object to load."),
               inputWidth: 200,
               align: "center",
            },
            {},
         ],
      };

      const settings = this.settings;

      if (this.datacollection || settings.dataviewID !== "") {
         _uiGrid.padding = settings.padding;
         _uiGrid.rows = [];
         if (settings.showToolbar) {
            _uiGrid.rows.push(this.uiToolbar());
         }
         if (this.settings.gridFilter.filterOption) {
            _uiGrid.rows.push(this.uiFilter());
         }

         _uiGrid.rows.push(this.uiDatatable());
      }

      const _ui = super.ui([_uiGrid]);

      delete _ui.type;

      return _ui;
   }

   async init(AB, accessLevel = 2) {
      if (AB) await super.init(AB);

      const self = this;
      const ids = this.ids;

      // WORKAROUND : Where should we define this ??
      // For include PDF.js
      const abWebix = AB.Webix;

      abWebix.codebase = "";
      abWebix.cdn = "/js/webix";

      // this shows the options to Hide, Filter, sort , etc...
      // only in Designer?
      // PopupHeaderEditComponent.init({
      //    onClick: _logic.callbackHeaderEdit, // be notified when there is a change in the hidden fields
      // });

      // NOTE: register the onAfterRender() here, so it only registers
      // one.
      const $DataTable = this.getDataTable();

      let throttleCustomDisplay = null;
      let scrollStarted = null;

      if (!$DataTable) return;

      abWebix.extend($DataTable, abWebix.ProgressBar);

      $DataTable.config.accessLevel = accessLevel;

      if (accessLevel < 2) $DataTable.define("editable", false);

      const settings = this.settings;

      const customDisplays = (data) => {
         const CurrentObject = this.datacollection?.datasource;

         if (!CurrentObject || !$DataTable.data) return;

         const displayRecords = [];

         const verticalScrollState = $DataTable.getScrollState().y,
            rowHeight = $DataTable.config.rowHeight,
            height =
               $DataTable.$view.querySelector(".webix_ss_body").clientHeight,
            startRecIndex = Math.floor(verticalScrollState / rowHeight),
            endRecIndex = startRecIndex + $DataTable.getVisibleCount();

         let index = 0;

         $DataTable.data.order.each((id) => {
            if (id != null && startRecIndex <= index && index <= endRecIndex)
               displayRecords.push(id);

            index++;
         });

         let editable = settings.isEditable;

         if ($DataTable.config.accessLevel < 2) editable = false;

         CurrentObject.customDisplays(
            data,
            this.AB._App,
            $DataTable,
            displayRecords,
            editable
         );
      };

      $DataTable.attachEvent("onAfterRender", function (data) {
         $DataTable.resize();

         if (throttleCustomDisplay) clearTimeout(throttleCustomDisplay);

         throttleCustomDisplay = setTimeout(() => {
            if (scrollStarted) clearTimeout(scrollStarted);
            customDisplays(this.data);
         }, 350);

         AB.ClassUI.CYPRESS_REF($DataTable);
         Object.keys(ids).forEach((key) => {
            const $el = $$(ids[key]);
            if ($el) {
               AB.ClassUI.CYPRESS_REF($el);
            }
         });
      });

      // we have some data types that have custom displays that don't look
      // right after scrolling large data sets we need to call customDisplays
      // again
      $DataTable.attachEvent("onScroll", function () {
         if (scrollStarted) clearTimeout(scrollStarted);

         if (throttleCustomDisplay) clearTimeout(throttleCustomDisplay);

         scrollStarted = setTimeout(() => {
            customDisplays(this.data);
         }, 1500);
      });
      $DataTable.attachEvent("onAfterScroll", function () {
         if (throttleCustomDisplay) clearTimeout(throttleCustomDisplay);

         throttleCustomDisplay = setTimeout(() => {
            if (scrollStarted) clearTimeout(scrollStarted);
            customDisplays(this.data);
         }, 350);
      });

      // Process our onItemClick events.
      // this is a good place to check if our delete/trash icon was clicked.
      $DataTable.attachEvent("onItemClick", function (id, e, node) {
         // make sure we have an object selected before processing this.
         const dc = self.datacollection;
         const CurrentObject = dc?.datasource;

         if (!CurrentObject) return;

         if (settings.isEditable === 0) {
            const items = $DataTable.getItem(id);
         }
         // if this was our edit icon:
         // console.log(e.target.className);
         if (e === "auto" || e.target.className.indexOf("eye") > -1) {
            // View a Details Page:
            self.changePage(dc, id, settings.detailsPage);
            self.toggleTab(settings.detailsTab, this);
         } else if (e.target.className.indexOf("pencil") > -1) {
            self.changePage(dc, id, settings.editPage);
            self.toggleTab(settings.editTab, this);
         } else if (e.target.className.indexOf("track") > -1)
            self.emit("object.track", CurrentObject, id.row);
         // App.actions.openObjectTrack(CurrentObject, id.row);
         else if (e.target.className.indexOf("clear-combo-value") > -1) {
            const clearValue = {};

            clearValue[id.column] = "";

            const updateRow = async () => {
               try {
                  const response = await CurrentObject.model().update(
                     id.row,
                     clearValue
                  );

                  // console.log(response);
               } catch (err) {
                  self.AB.notify.developer(err, {
                     context: "ABViewGridComponent.onItemClick",
                     message: "Error updating item",
                     obj: CurrentObject.toObj(),
                     id: id.row,
                  });
               }
            };

            updateRow();
         }
         // if this was our trash icon:
         else if (e.target.className.indexOf("trash") > -1) {
            // If the confirm popup is showing, then skip to show a new one
            if (!this._deleteConfirmPopup) {
               this._deleteConfirmPopup = abWebix.confirm({
                  title: self.label("Delete data"),
                  text: self.label("Do you want to delete this row?"),
                  callback: (result) => {
                     delete this._deleteConfirmPopup;
                     if (result) {
                        const deleteRow = async () => {
                           try {
                              const response =
                                 await CurrentObject.model().delete(id.row);

                              if (response.numRows > 0) {
                                 $DataTable.remove(id);
                                 $DataTable.clearSelection();
                              } else
                                 abWebix.alert({
                                    text: self.label(
                                       "No rows were effected.  This does not seem right."
                                    ),
                                 });
                           } catch (err) {
                              self.AB.notify.developer(err, {
                                 context: "ABViewGridComponent.onItemClick",
                                 message: "Error deleting item",
                                 obj: CurrentObject.toObj(),
                                 id: id.row,
                              });

                              //// TODO: what do we do here?
                           }
                        };

                        deleteRow();
                     }

                     $DataTable.clearSelection();

                     return true;
                  },
               });
            }
         } else if (settings.detailsPage.length) {
            // If an icon wasn't selected but a details page is set
            // view the details page
            self.changePage(dc, id, settings.detailsPage);
            self.toggleTab(settings.detailsTab, this);
         } else if (settings.editPage.length) {
            // If an icon wasn't selected but an edit page is set
            // view the edit page
            self.changePage(dc, id, settings.editPage);
            self.toggleTab(settings.editTab, this);
         }
      });

      // ABViewGrid Original init();
      if (settings.showToolbar) {
         if (
            settings.massUpdate ||
            settings.isSortable ||
            settings.isExportable ||
            (settings.gridFilter &&
               settings.gridFilter.filterOption &&
               settings.gridFilter.userFilterPosition === "toolbar")
         )
            $$(ids.toolbar).show();

         if (!settings.massUpdate) {
            $$(ids.buttonMassUpdate).hide();
            $$(ids.buttonDeleteSelected).hide();
         }

         if (!settings.allowDelete) $$(ids.buttonDeleteSelected).hide();

         if (settings.gridFilter) {
            if (
               settings.gridFilter.filterOption !== 1 ||
               settings.gridFilter.userFilterPosition !== "toolbar"
            )
               $$(ids.buttonFilter).hide();

            if (
               settings.gridFilter.filterOption === 3 &&
               settings.gridFilter.globalFilterPosition === "single"
            )
               $DataTable.hide();

            if (settings.gridFilter.isGlobalToolbar)
               $$(ids.globalSearchToolbar).show();
            else $$(ids.globalSearchToolbar).hide();

            if (settings.gridFilter.filterOption)
               this.view.filterHelper.init(this.AB);
         }

         if (!settings.isSortable) $$(ids.buttonSort).hide();

         if (!settings.isExportable) $$(ids.buttonExport).hide();
      }

      if (settings.hideHeader) this.hideHeader();

      const dc =
         this.datacollection || this.AB.datacollectionByID(settings.dataviewID);

      if (!this._isDatacollectionLoaded) this.datacollectionLoad(dc);

      // Make sure
      this._gridSettings =
         this._gridSettings ||
         (await this.AB.Storage.get(this.keyStorageSettings)) ||
         {};

      if (dc?.datasource) {
         // TRANSITION: ABViewGrid_orig line 862 ...

         this.linkPage.init({
            view: this.view,
            datacollection: dc,
         });

         this.refreshHeader();
      }
   }

   /**
    * @method busy()
    * Indicate that our datatable is currently busy loading/processing
    * data.
    */
   busy() {
      this.getDataTable()?.showProgress?.({ type: "icon" });
   }

   /**
    * @method callbackFilterData()
    * Process the provided filter options from our filterHelper.
    * @param {fn} fnFilter
    *        A function that returns true/false for each row of data
    *        to determine if is should exist.
    * @param {array} filterRules
    *        Any Filter Rules added by the user.
    */
   callbackFilterData(fnFilter, filterRules = []) {
      const ids = this.ids;
      const $ButtonFilter = $$(ids.buttonFilter);

      if ($ButtonFilter) {
         const onlyFilterRules = this.view.filterHelper.filterRules();

         $ButtonFilter.define("badge", onlyFilterRules?.rules?.length ?? 0);
         $ButtonFilter.refresh();
      }

      const dc = this.datacollection;

      dc.filterCondition(filterRules);
      dc.reloadData();
   }

   async callbackSortData(sortRules = []) {
      const $buttonSort = $$(this.ids.buttonSort);

      $buttonSort.define("badge", sortRules.length || null);
      $buttonSort.refresh();

      const gridElem = this.getDataTable();

      if (gridElem.data.find({}).length < gridElem.data.count()) {
         try {
            // NOTE: Webix's client sorting does not support dynamic loading.
            // If the data does not be loaded, then load all data.
            await this.datacollection.reloadData(0, 0);
         } catch (err) {
            this.AB.notify.developer(err, {
               context:
                  "ABViewGrid:callbackSortData(): Error perform datacollection.reloadData()",
            });
         }
      }

      // wait until the grid component will done to repaint UI
      setTimeout(() => {
         gridElem.sort((a, b) => this.PopupSortDataTableComponent.sort(a, b));
      }, 777);
   }

   /**
    * @method changePage()
    * Helper method to switch to another View.
    * @param {ABDataCollection} dv
    *        The DataCollection we are working with.
    * @param {obj} rowItem
    *        the { row:#, column:{string} } of the item that was clicked.
    * @param {ABViewPage.uuid} page
    *        The .uuid of the ABViewPage/ABViewTab we are to swtich to.
    *
    */
   changePage(dv, rowItem, page) {
      const rowId = rowItem?.row ?? null;

      // Set cursor to data view
      if (dv) dv.setCursor(rowId);

      // Pass settings to link page module
      if (this.linkPage) this.linkPage.changePage(page, rowId);

      super.changePage(page);
   }

   columnConfig(headers = []) {
      this.settings.columnConfig = headers;
   }
   /**
    * @method datacollectionLoad()
    * Assign an ABDataCollection to this component to use instead of any
    * provided .dataviewID in our settings.
    * NOTE: this primarily happens in the ABDesigner's Object Workspace.
    * @param {ABDataCollection} dc
    */
   datacollectionLoad(dc) {
      const oldDC = this.datacollection;
      this.datacollection = dc;

      const CurrentObject = dc?.datasource;
      const $DataTable = this.getDataTable();

      if ($DataTable) {
         // preventing too many handlers
         if (!this.__handler_dc_busy) {
            this.__handler_dc_busy = () => {
               this.busy();
            };

            this.__handler_dc_ready = () => {
               this.ready();
               this.populateGroupData();
            };

            this.__handler_dc_loadData = () => {
               this.populateGroupData();
            };
         }

         if (oldDC) {
            // remove our listeners from the previous DC
            oldDC.removeListener("initializingData", this.__handler_dc_busy);
            oldDC.removeListener("initializedData", this.__handler_dc_ready);
            oldDC.removeListener("loadData", this.__handler_dc_loadData);
         }

         if (dc) {
            if (dc.datacollectionLink && dc.fieldLink)
               dc.bind($DataTable, dc.datacollectionLink, dc.fieldLink);
            else dc.bind($DataTable);

            // making sure we only have 1 registered listener on this dc
            dc.removeListener("initializingData", this.__handler_dc_busy);
            dc.on("initializingData", this.__handler_dc_busy);
            dc.removeListener("initializedData", this.__handler_dc_ready);
            dc.on("initializedData", this.__handler_dc_ready);
            dc.removeListener("loadData", this.__handler_dc_loadData);
            dc.on("loadData", this.__handler_dc_loadData);
            this.grouping();

            this._isDatacollectionLoad = true;
         } else $DataTable.unbind();

         // Be sure to pass on our CurrentObject to our dependent components.
         if (CurrentObject) {
            this.view.filterHelper.objectLoad(CurrentObject);
            this.PopupMassUpdateComponent.objectLoad(
               CurrentObject,
               this.getDataTable()
            );
            this.PopupSortDataTableComponent.objectLoad(CurrentObject);

            this.PopupExport.objectLoad(CurrentObject);
            this.PopupExport.dataCollectionLoad(dc);
            this.PopupExport.setGridComponent(this.getDataTable());
            this.PopupExport.setHiddenFields(this.settings.hiddenFields);
            this.PopupExport.setFilename(this.view.label);
         }
      }
   }

   /**
    * @function enableUpdateDelete
    *
    * disable the update or delete buttons in the toolbar if there no items selected
    * we will make this externally accessible so we can call it from within the datatable component
    */
   disableUpdateDelete() {
      $$(this.ids.buttonMassUpdate)?.disable();
      $$(this.ids.buttonDeleteSelected)?.disable();
      // externally indicate that no rows are selected
      this.emit("selection.cleared");
   }

   /**
    * @function enableUpdateDelete
    *
    * enable the update or delete buttons in the toolbar if there are any items selected
    * we will make this externally accessible so we can call it from within the datatable component
    */
   enableUpdateDelete() {
      $$(this.ids.buttonMassUpdate)?.enable();
      $$(this.ids.buttonDeleteSelected)?.enable();
      // externally indicate that a row has been selected
      this.emit("selection");
   }

   freezeDeleteColumn() {
      // we are going to always freeze the delete column if the datatable
      // is wider than the container so it is easy to get to
      return this.getDataTable().define("rightSplit", this.columnSplitRight);
   }

   /**
    * @method getDataTable()
    * return the webix grid component.
    * @return {webix.grid}
    */
   getDataTable() {
      return $$(this.ids.datatable);
   }

   /**
    * @method getLastColumn
    * return the last column of a datagrid that is resizeable
    */
   getLastColumn() {
      const $DataTable = this.getDataTable();

      let lastColumn = {};

      // Loop through each columns config to find out if it is in the split 1 region and set it as the last item...then it will be overwritten by next in line
      $DataTable.eachColumn((columnId) => {
         const columnConfig = $DataTable.getColumnConfig(columnId);

         if (columnConfig.split === 1) lastColumn = columnConfig;
      });

      return lastColumn;
   }

   /**
    * @method grouping()
    * perform any grouping operations
    */
   grouping() {
      if (!this.settings.groupBy) return;

      const $treetable = this.getDataTable();

      // map: {
      //     votes:["votes", "sum"],
      //     title:["year"]
      // }
      const baseGroupMap = {};
      const CurrentObject = this.datacollection.datasource;

      CurrentObject.fields().forEach((f) => {
         switch (f.key) {
            case "number":
               baseGroupMap[f.columnName] = [f.columnName, "sum"];

               break;

            case "calculate":
            case "formula":
               baseGroupMap[f.columnName] = [
                  f.columnName,
                  (prop, listData) => {
                     if (!listData) return 0;

                     let sum = 0;

                     listData.forEach((r) => {
                        // we only want numbers returned so pass `true` as third param
                        // to signify that this is part of a grouping row
                        sum += f.format(r, false, true) * 1;
                     });

                     // simulate reformat from ABFieldFormulaCore
                     if (!f.fieldLink || f.fieldLink.key === "calculate")
                        return sum;
                     else {
                        const rowDataFormat = {};

                        rowDataFormat[f.fieldLink.columnName] = sum;

                        return f.fieldLink.format(rowDataFormat);
                     }
                  },
               ];

               break;

            case "connectObject":
               baseGroupMap[f.columnName] = [
                  f.columnName,
                  (prop, listData) => {
                     if (!listData || !listData.length) return 0;

                     let count = 0;

                     listData.forEach((r) => {
                        const valRelation = r[f.relationName()];

                        // array
                        if (valRelation?.length) count += valRelation.length;
                        // object
                        else if (valRelation) count += 1;
                     });

                     return count;
                  },
               ];

               break;

            default:
               baseGroupMap[f.columnName] = [
                  f.columnName,
                  function (prop, listData) {
                     if (!listData || !listData.length) return 0;

                     let count = 0;

                     listData.forEach((r) => {
                        const val = prop(r);

                        // count only exists data
                        if (val) count += 1;
                     });

                     return count;
                  },
               ];

               break;
         }
      });

      // set group definition
      // $DataTable.define("scheme", {
      //    $group: {
      //       by: settings.groupBy,
      //       map: groupMap
      //    }
      // });

      // NOTE: https://snippet.webix.com/e3a2bf60
      let groupBys = (this.settings.groupBy || "")
         .split(",")
         .map((g) => g.trim());
      // Reverse the array NOTE: call .group from child to root
      groupBys = groupBys.reverse();

      groupBys.forEach((colName, gIndex) => {
         const groupMap = this.AB.cloneDeep(baseGroupMap);

         let by;

         // Root
         if (gIndex === groupBys.length - 1) by = colName;
         // Sub groups
         else {
            by = (row) => {
               let byValue = row[colName];

               for (let i = gIndex + 1; i < groupBys.length; i++) {
                  byValue = `${row[groupBys[i]]} - ${byValue}`;
               }

               return byValue;
            };

            // remove parent group data
            groupBys.forEach((gColName) => {
               if (gColName !== colName) groupMap[gColName] = [gColName];
            });
         }

         $treetable.data.group({
            by: by,
            map: groupMap,
         });
      });
   }

   hideHeader() {
      const $DataTable = this.getDataTable();

      $DataTable.define("header", false);
      $DataTable.refresh();
   }

   /**
    * @function onAfterColumnDrop
    * When an editor drops a column to save a new column order
    * @param {string} sourceId
    *        the columnName of the item dragged
    * @param {string} targetId
    *        the columnName of the item dropped on
    * @param {event} event
    */
   async onAfterColumnDrop(sourceId, targetId, event) {
      const $DataTable = this.getDataTable();
      const CurrentObject = this.datacollection.datasource;
      const settings = this.settings;
      const columnConfig = this.localSettings();

      // Reorder our current columnConfig
      // We know what was moved and what item it has replaced/pushed forward
      // so first we want to splice the item moved out of the array of fields
      // and store it so we can put it somewhere else
      let itemMoved = null;
      let oPos = 0; // original position

      for (let i = 0; i < columnConfig.length; i++)
         if (columnConfig[i].id == sourceId) {
            itemMoved = columnConfig[i];
            columnConfig.splice(i, 1);
            oPos = i;

            break;
         }
      // once we have removed/stored it we can find where its new position
      // will be by looping back through the array and finding the item it
      // is going to push forward
      for (let j = 0; j < columnConfig.length; j++)
         if (columnConfig[j].id == targetId) {
            // if the original position was before the new position we will
            // follow webix's logic that the drop should go after the item
            // it was placed on
            if (oPos <= j) j++;

            columnConfig.splice(j, 0, itemMoved);

            break;
         }

      // special case: dropped on end and need to update .fillspace
      // if (j == columnConfig.length - 1) {
      //    if (columnConfig[j - 1].fillspace) {
      //       columnConfig[j - 1].fillspace = false;
      //       columnConfig[j].fillspace = true;
      //    }
      // }

      // if we allow local changes
      this.localSettings(columnConfig);

      if (settings.saveLocal) this.localSettingsSave();

      // Now emit this event, in case an external object is wanting to
      // respond to this: ABDesigner.objectBuilder, Interface  Designer,
      // we send back an array[ ABField.id, ...] in the order we have
      // them.
      this.emit(
         "column.order",
         columnConfig.map((c) => c.fieldID)
      );

      this.refreshHeader();

      // CurrentObject.fieldReorder(sourceId, targetId)
      //    .then(() => {
      //       // reset each column after a drop so we do not have multiple fillspace and minWidth settings
      //       var editiable = settings.isEditable;
      //       if ($DataTable.config.accessLevel < 2) {
      //          editiable = false;
      //       }
      //       var columnHeaders = CurrentObject.columnHeaders(true, editiable);
      //       columnHeaders.forEach(function (col) {
      //          if (col.id == sourceId && col.fillspace == true) {
      //             columnHeader.fillspace = false;
      //             columnHeader.minWidth = columnHeader.width;
      //          }
      //       });

      //       _logic.callbacks.onColumnOrderChange(CurrentObject);
      //       // freeze columns:
      //       let frozenColumnID =
      //          settings.frozenColumnID != null
      //             ? settings.frozenColumnID
      //             : CurrentObject.workspaceFrozenColumnID;
      //       if (frozenColumnID != "") {
      //          $DataTable.define(
      //             "leftSplit",
      //             $DataTable.getColumnIndex(frozenColumnID) + columnSplitLeft
      //          );
      //       } else {
      //          $DataTable.define("leftSplit", columnSplitLeft);
      //       }
      //       _logic.freezeDeleteColumn();
      //       $DataTable.refreshColumns();
      //    })
      //    .catch((err) => {
      //       OP.Error.log("Error saving new column order:", {
      //          error: err,
      //       });
      //    });
   }

   /**
    * @function onAfterEditStop
    * When an editor is finished.
    * @param {json} state
    * @param {} editor
    * @param {} ignoreUpdate
    * @return
    */
   async onAfterEditStop(state, editor, ignoreUpdate) {
      // state:   {value: "new value", old: "old value"}
      // editor:  { column:"columnName", row:ID, value:'value', getInputNode:fn(), config:{}, focus: fn(), getValue: fn(), setValue: function, getInputNode: function, render: function…}

      const $DataTable = this.getDataTable();

      // if you don't edit an empty cell we just need to move on
      if (
         (!state.old && state.value === "") ||
         (state.old === "" && state.value === "")
      ) {
         $DataTable.clearSelection();

         return false;
      }

      if (editor.config)
         switch (editor.config.editor) {
            case "number":
               state.value = parseFloat(state.value);

               break;

            case "datetime":
               state.value = state.value.getTime();

               if (state && state.old && state.old.getTime)
                  state.old = state.old.getTime();

               break;

            default:
            // code block
         }

      if (state.value !== state.old) {
         const item = $DataTable.getItem(editor.row);

         item[editor.column] = state.value;

         $DataTable.removeCellCss(item.id, editor.column, "webix_invalid");
         $DataTable.removeCellCss(item.id, editor.column, "webix_invalid_cell");

         const CurrentObject = this.datacollection.datasource;
         const validator = CurrentObject.isValidData(item);

         if (validator.pass()) {
            //// Question: do we submit full item updates?  or just patches?
            // IF Patch:
            // var patch = {};
            // patch.id = item.id;
            // patch[editor.column] = item[editor.column];
            // await CurrentObject.model().update(item.id, patch)

            const ab = this.AB;

            try {
               await CurrentObject.model().update(item.id, item);

               if ($DataTable.exists(editor.row)) {
                  $DataTable.updateItem(editor.row, item);
                  $DataTable.clearSelection();
                  $DataTable.refresh(editor.row);
               }
            } catch (err) {
               ab.notify.developer(err, {
                  context: "ABViewGrid:onAfterEditStop(): Error saving item",
                  item,
                  editor,
                  state,
                  object: CurrentObject.toObj(),
               });

               $DataTable.clearSelection();

               if (
                  ab.Validation.isGridValidationError(
                     err,
                     editor.row,
                     $DataTable
                  )
               ) {
                  // Do we reset the value?
                  // item[editor.column] = state.old;
                  // $DataTable.updateItem(editor.row, item);
               } else {
                  // this was some other Error!
               }
            }
            // CurrentObject.model()
            //    .update(item.id, item)
            //    .then(() => {
            //       if ($DataTable.exists(editor.row)) {
            //          $DataTable.updateItem(editor.row, item);
            //          $DataTable.clearSelection();
            //          $DataTable.refresh(editor.row);
            //       }
            //    })
            //    .catch((err) => {
            //       OP.Error.log("Error saving item:", {
            //          error: err
            //       });

            //       $DataTable.clearSelection();
            //       if (
            //          OP.Validation.isGridValidationError(
            //             err,
            //             editor.row,
            //             $DataTable
            //          )
            //       ) {
            //          // Do we reset the value?
            //          // item[editor.column] = state.old;
            //          // $DataTable.updateItem(editor.row, item);
            //       } else {
            //          // this was some other Error!
            //       }
            //    });
         } else validator.updateGrid(editor.row, $DataTable);
      } else $DataTable.clearSelection();

      return false;

      // var item = $$(self.webixUiId.objectDatatable).getItem(editor.row);

      // self.updateRowData(state, editor, ignoreUpdate)
      //    .fail(function (err) { // Cached
      //       item[editor.column] = state.old;
      //       $$(self.webixUiId.objectDatatable).updateItem(editor.row, item);
      //       $$(self.webixUiId.objectDatatable).refresh(editor.row);

      //       // TODO : Message

      //       $$(self.webixUiId.objectDatatable).hideProgress();
      //    })
      //    .then(function (result) {
      //       if (item) {
      //          item[editor.column] = state.value;

      //          if (result && result.constructor.name === 'Cached' && result.isUnsync())
      //             item.isUnsync = true;

      //          $$(self.webixUiId.objectDatatable).updateItem(editor.row, item);
      //       }

      //       // TODO : Message

      //       $$(self.webixUiId.objectDatatable).hideProgress();
      //    });
   }

   /**
    * @function onAfterSelect
    * This is when a user clicks on a cell.  We use the onAfterSelect to
    * trigger a normal .editCell() if there isn't a custom editor for this field.
    * @param {json} data webix cell data
    * @return
    */
   onAfterSelect(data /*, preserve */) {
      // data: {row: 1, column: "name", id: "1_name", toString: function}
      // data.row: ABObject.id
      // data.column => columnName of the field

      // Normal update data
      this.getDataTable()?.editCell(data.row, data.column);
   }

   /**
    * @function onColumnResizeResize
    * This is when a user adjusts the size of a column
    * @param {} columnName
    * @param {int} newWidth
    * @param {int} oldWidth
    * @param {} user_action
    * @return
    */
   async onColumnResize(columnName, newWidth, oldWidth, user_action) {
      // update the settings

      let requireRefresh = false;

      const ab = this.AB;

      if (newWidth < 30) {
         newWidth = 30;
         requireRefresh = true;

         ab.Webix.message({
            type: "info",
            text: this.label("minimum column width is {0}", [30]),
            expire: 1000,
         });
      }

      const localSettings = this.localSettings();

      if (localSettings) {
         const header = localSettings.find((h) => h.id == columnName);

         if (header) {
            header.width = newWidth;

            delete header.adjust;
         }
      }

      this.localSettings(localSettings);

      if (this.settings.saveLocal) {
         await this.localSettingsSave();
         // for (const item in GridSettings) {
         //    GridSettings[item].forEach((item) => {
         //       // we cannot include field info because of the cicular structure
         //       if (item?.footer?.field) {
         //          delete item.footer.field;
         //       }
         //    });
         // }
         // await this.AB.Storage.set(this.keyStorageSettings, GridSettings);
      }

      // refresh the display
      if (requireRefresh) this.refreshHeader();

      this.freezeDeleteColumn();

      // this.getDataTable().refreshColumns();

      // TODO: allow external app to respond in special cases:
      // eg: ABDesigner object workspace, interface builder, etc...
      this.emit("column.resize", columnName, newWidth, oldWidth);
   }

   /**
    * @method onHeaderClick
    * process the user clicking on the header for one of our columns.
    */
   onHeaderClick(id, e, node) {
      if (this.skippableColumns.indexOf(id.column) !== -1) return false;

      // save our EditNode & EditField:
      // this.EditNode = node;

      const EditField = this.datacollection.datasource.fields(
         (f) => f.columnName === id.column
      )[0];
      // if (this.EditField) {
      //    // show the popup
      //    PopupHeaderEditComponent.show(node, this.EditField);
      // }

      this.emit("column.header.clicked", node, EditField);

      return false;
   }

   /**
    * @method onShow()
    * perform any preparations necessary when showing this component.
    */
   onShow() {
      super.onShow();

      // make sure our grid is properly .adjust()ed to the screen.
      this.getDataTable()?.adjust();

      const dv = this.datacollection;

      if (dv)
         this.eventAdd({
            emitter: dv,
            eventName: "changeCursor",
            listener: this.handler_select.bind(this),
         });
   }

   /**
    * @method ready()
    * Indicate that our datatable is currently ready for operation.
    */
   ready() {
      const dc = this.datacollection;
      if (
         this.isCustomGroup &&
         dc?.dataStatus != dc?.dataStatusFlag.initialized
      )
         return;

      this.getDataTable()?.hideProgress?.();
   }

   /**
    * @function refreshHeader()
    *
    * refresh the header for the table apart from the refresh() command
    * @param {bool} ignoreLocal
    *        Should we ignore our local settings and build directly from
    *        our config settings?
    */
   refreshHeader(ignoreLocal = this.ignoreLocal) {
      // columnSplitRight = 0;
      // wait until we have an Object defined:
      const CurrentObject = this.datacollection.datasource;

      if (!CurrentObject) return;

      const ids = this.ids;
      const $DataTable = $$(ids.datatable);

      if (!$DataTable) return;

      const accessLevel = $DataTable.config.accessLevel;

      $DataTable.define("leftSplit", 0);
      $DataTable.define("rightSplit", 0);

      let rowHeight = 0;

      CurrentObject.imageFields().forEach((image) => {
         const settings = image.getSettings();

         if (settings.useHeight && settings.imageHeight > rowHeight)
            rowHeight = settings.imageHeight;
      });

      if (rowHeight) $DataTable.define("rowHeight", rowHeight);

      // $DataTable.clearAll();

      const settings = this.settings;

      let editable = settings.isEditable;

      if ($DataTable.config.accessLevel < 2) editable = false;

      //// update DataTable structure:
      // get column list from our local settings
      const objColumnHeaders = CurrentObject.columnHeaders(
         true,
         editable,
         // TRANSITION: moving these from .columnHeaders() to here:
         [], //settings.summaryColumns,
         [], //settings.countColumns,
         [] //settings.hiddenFields
      );

      let columnHeaders = this.localSettings();

      const ab = this.AB;

      // if that is empty, pull from our settings.columnConfig
      if (!columnHeaders || ignoreLocal)
         columnHeaders = ab.cloneDeep(this.settings.columnConfig);

      // if that is empty for some reason, rebuild from our CurrentObject
      if (columnHeaders.length === 0) columnHeaders = objColumnHeaders;

      // sanity check:
      // columnHeaders can't contain a column that doesn't exist in objColumHeaders:
      // (eg: a field might have been removed but localStorage doesn't know that )
      const objColumnHeaderIDs = objColumnHeaders.map((h) => h.fieldID);

      columnHeaders = columnHeaders.filter(
         (c) => objColumnHeaderIDs.indexOf(c.fieldID) > -1
      );

      // default our columnConfig values to our columnHeaders:
      columnHeaders.forEach((c) => {
         // we want to overwrite our default settings with anything stored
         // in local storage
         const origCol = objColumnHeaders.find((h) => h.fieldID === c.fieldID);

         // none of our functions can be stored in localStorage, so scan
         // the original column and attach any template functions to our
         // stashed copy.
         // also the suggest for selects and connected fields may contain a
         // function so go ahead and copy the original suggest to the column
         Object.keys(origCol).forEach((k) => {
            if (typeof origCol[k] === "function" || k === "suggest") {
               c[k] = origCol[k];
            }
         });

         const f = CurrentObject.fieldByID(c.fieldID);

         if (!f) return;

         // if it's a hidden field:
         if (settings.hiddenFields.indexOf(f.columnName) > -1) {
            c.hidden = true;
         }

         // add summary footer:
         if (settings.summaryColumns.indexOf(f.id) > -1) {
            if (f.key == "calculate" || f.key == "formula")
               c.footer = { content: "totalColumn", field: f };
            else c.footer = { content: "summColumn" };
         }
         // or add the count footer
         else if (settings.countColumns.indexOf(f.id) > -1)
            c.footer = { content: "countColumn" };
      });

      let localSettings = this.localSettings();

      if (!localSettings || ignoreLocal) {
         this.localSettings(columnHeaders);

         localSettings = columnHeaders;
      }

      columnHeaders = ab.cloneDeep(localSettings);

      const fieldValidations = [];
      const rulePops = [];

      columnHeaders.forEach((col) => {
         col.fillspace = false;

         // parse the rules because they were stored as a string
         // check if rules are still a string...if so lets parse them
         if (col.validationRules) {
            if (typeof col.validationRules === "string") {
               col.validationRules = JSON.parse(col.validationRules);
            }

            if (col.validationRules.length) {
               const validationUI = [];

               // there could be more than one so lets loop through and build the UI
               col.validationRules.forEach((rule) => {
                  const Filter = ab.filterComplexNew(
                     col.id /*+ "_" + webix.uid()*/
                  );
                  // add the new ui to an array so we can add them all at the same time
                  validationUI.push(Filter.ui);
                  // store the filter's info so we can assign values and settings after the ui is rendered
                  fieldValidations.push({
                     filter: Filter,
                     view: Filter.ids.querybuilder,
                     columnName: col.id,
                     validationRules: rule.rules,
                     invalidMessage: rule.invalidMessage,
                  });
               });

               // create a unique view id for popup
               const popUpId =
                  ids.rules + "_" + col.id; /* + "_" + webix.uid() */

               // store the popup ids so we can remove the later
               rulePops.push(popUpId);
               // add the popup to the UI but don't show it
               ab.Webix.ui({
                  view: "popup",
                  css: "ab-rules-popup",
                  id: popUpId,
                  body: {
                     rows: validationUI,
                  },
               });
            }
         }

         // group header
         if (
            settings.groupBy &&
            (settings.groupBy || "").indexOf(col.id) > -1
         ) {
            const groupField = CurrentObject.fieldByID(col.fieldID);

            if (groupField)
               col.template = (obj, common) => {
                  // return common.treetable(obj, common) + obj.value;
                  if (obj.$group) {
                     const rowData = ab.cloneDeep(obj);

                     rowData[groupField.columnName] = rowData.value;

                     return (
                        common.treetable(obj, common) +
                        groupField.format(rowData)
                     );
                  } else return groupField.format(obj);
               };
         }
      });

      if (fieldValidations.length) {
         // we need to store the rules for use later so lets build a container array
         const complexValidations = [];

         fieldValidations.forEach((f) => {
            // init each ui to have the properties (app and fields) of the object we are editing
            // f.filter.applicationLoad(CurrentObject.application);
            f.filter.fieldsLoad(CurrentObject.fields());
            // now we can set the value because the fields are properly initialized
            f.filter.setValue(f.validationRules);
            // if there are validation rules present we need to store them in a lookup hash
            // so multiple rules can be stored on a single field
            if (!Array.isArray(complexValidations[f.columnName]))
               complexValidations[f.columnName] = [];

            // now we can push the rules into the hash
            complexValidations[f.columnName].push({
               filters: $$(f.view).getFilterHelper(),
               values: $DataTable.getSelectedItem(),
               invalidMessage: f.invalidMessage,
            });
         });

         const rules = {};

         // store the rules in a data param to be used later
         $DataTable.$view.complexValidations = complexValidations;
         // use the lookup to build the validation rules
         Object.keys(complexValidations).forEach((key) => {
            rules[key] = (value, data) => {
               // default valid is true
               let isValid = true;
               let invalidMessage = "";

               $DataTable.$view.complexValidations[key].forEach((filter) => {
                  // convert rowData from { colName : data } to { id : data }
                  const newData = {};

                  (CurrentObject.fields() || []).forEach((field) => {
                     newData[field.id] = data[field.columnName];
                  });

                  // for the case of "this_object" conditions:
                  if (data.uuid) newData["this_object"] = data.uuid;

                  // use helper funtion to check if valid
                  const ruleValid = filter.filters(newData);

                  // if invalid we need to tell the field
                  if (!ruleValid) {
                     isValid = false;
                     invalidMessage = filter.invalidMessage;
                  }
               });

               // we also need to define an error message
               if (!isValid)
                  ab.Webix.message({
                     type: "error",
                     text: invalidMessage,
                  });

               return isValid;
            };
         });
         // define validation rules
         $DataTable.define("rules", rules);
         // store the array of view ids on the webix object so we can get it later
         $DataTable.config.rulePops = rulePops;
         $DataTable.refresh();
      } else {
         // check if the previous datatable had rule popups and remove them
         if ($DataTable.config.rulePops)
            $DataTable.config.rulePops.forEach((popup) => {
               if ($$(popup)) $$(popup).destructor();
            });
         // remove any validation rules from the previous table
         $DataTable.define("rules", {});
         $DataTable.refresh();
      }

      const addedColumns = [];
      // {array} the .id of the columnHeaders we add based upon our settings.
      // this will help us pick the lastColumn that is part of the
      // object.

      if (settings.labelAsField) {
         // console.log(CurrentObject);
         columnHeaders.unshift({
            id: "appbuilder_label_field",
            header: "Label",
            fillspace: true,
            template: (obj) => CurrentObject.displayData(obj),
            // css: { 'text-align': 'center' }
         });
         addedColumns.push("appbuilder_label_field");
      }

      if (settings.massUpdate && accessLevel === 2) {
         columnHeaders.unshift({
            id: "appbuilder_select_item",
            header: { content: "masterCheckbox", contentId: "mch" },
            width: 40,
            template: "<div class='singleSelect'>{common.checkbox()}</div>",
            css: { "text-align": "center" },
         });
         this.columnSplitLeft = 1;
         addedColumns.push("appbuilder_select_item");
      } else this.columnSplitLeft = 0;

      if (settings.detailsPage !== "" && !settings.hideButtons) {
         columnHeaders.push({
            id: "appbuilder_view_detail",
            header: "",
            width: 40,
            template: (obj, common) =>
               "<div class='detailsView'><span class='webix_icon fa fa-eye'></span></div>",
            css: { "text-align": "center" },
         });
         // columnSplitRight++;
         addedColumns.push("appbuilder_view_detail");
      }

      if (settings.trackView !== 0 && accessLevel === 2) {
         columnHeaders.push({
            id: "appbuilder_view_track",
            header: "",
            width: 40,
            template:
               "<div class='track'><span class='track fa fa-history'></span></div>",
            css: { "text-align": "center", cursor: "pointer" },
         });
         // columnSplitRight++;
         addedColumns.push("appbuilder_view_track");
      }

      if (
         settings.editPage !== "" &&
         !settings.hideButtons &&
         accessLevel === 2
      ) {
         columnHeaders.push({
            id: "appbuilder_view_edit",
            header: "",
            width: 40,
            template: "<div class='edit'>{common.editIcon()}</div>",
            css: { "text-align": "center" },
         });
         // columnSplitRight++;
         addedColumns.push("appbuilder_view_edit");
      }

      if (settings.allowDelete && accessLevel === 2) {
         columnHeaders.push({
            id: "appbuilder_trash",
            header: "",
            width: 40,
            template: "<div class='trash'>{common.trashIcon()}</div>",
            css: { "text-align": "center" },
         });
         // columnSplitRight++;
         addedColumns.push("appbuilder_trash");
      }

      // find our last displayed column (that isn't one we added);
      let lastCol = null;

      for (let i = columnHeaders.length - 1; i >= 0; i--)
         if (!lastCol) {
            const col = columnHeaders[i];

            if (!col.hidden && addedColumns.indexOf(col.id) === -1) {
               lastCol = col;

               break;
            }
         }

      if (lastCol) {
         lastCol.fillspace = true;
         lastCol.minWidth = lastCol.width;
         lastCol.width = 150; // set a width for last column but by default it will fill the available space or use the minWidth to take up more
      }

      $DataTable.refreshColumns(columnHeaders);

      // the addedColumns represent the additional icons that can be added.
      this.columnSplitRight = addedColumns.length;

      // the .massUpdate gets added to Left so don't include that in split right:
      if (addedColumns.indexOf("appbuilder_select_item") > -1)
         this.columnSplitRight -= 1;
      // .columnSplitRight can't be < 0
      if (this.columnSplitRight < 0) this.columnSplitRight = 0;

      // freeze columns:
      const frozenColumnID = settings.frozenColumnID;

      if (frozenColumnID != "")
         $DataTable.define(
            "leftSplit",
            $DataTable.getColumnIndex(frozenColumnID) + 1
         );
      else $DataTable.define("leftSplit", this.columnSplitLeft);

      this.freezeDeleteColumn();
      $DataTable.refreshColumns();
      // }
   }

   /**
    * localSettingsSave()
    * Persist our current working copy of our GridSettings to localStorage.
    * @return {Promise}
    */
   async localSettingsSave() {
      const ab = this.AB;
      const savedLocalSettings =
         (await ab.Storage.get(this.keyStorageSettings)) || {};
      const _gridSettings = this._gridSettings;

      savedLocalSettings[this.settingsID()] = _gridSettings[this.settingsID()]
         ? _gridSettings[this.settingsID()]
         : [];

      for (const item in savedLocalSettings) {
         savedLocalSettings[item].forEach((item) => {
            // we cannot include field info because of the cicular structure
            if (item?.footer?.field) delete item.footer.field;
         });
      }

      await ab.Storage.set(this.keyStorageSettings, savedLocalSettings);
   }

   /**
    * @method localSettings()
    * An interface method to handle get/set operations on our local GridSettings
    * storage.
    * .localStorage() : a getter to return the current value
    * .localStorage(value) : a setter to save value as our current value.
    * @param {various} value
    *        the value to set to our settings.
    * @return {various}
    */
   localSettings(value = null) {
      const _gridSettings = this._gridSettings;

      if (value) _gridSettings[this.settingsID()] = value;
      else return _gridSettings[this.settingsID()];
   }

   /**
    * @method selectRow()
    * Select the grid row that correspondes to the provided rowData.
    * @param {json} rowData
    *        A key=>value hash of data that matches an entry in the grid.
    *        rowData.id should match an existing entry.
    */
   selectRow(rowData) {
      const $DataTable = this.getDataTable();

      if (!$DataTable) return;

      if (!rowData) $DataTable.unselect();
      else if (rowData?.id && $DataTable.exists(rowData.id))
         $DataTable.select(rowData.id, false);
      else $DataTable.select(null, false);
   }

   /**
    * @method settingsID()
    * return the unique key for this Grid + object combo to store data
    * in our localStorage.
    * @return {string}
    */
   settingsID() {
      const CurrentObject = this.datacollection.datasource;

      return `${this.id}-${CurrentObject ? CurrentObject.id : "0"}`;
   }

   /**
    * @method toggleTab()
    * recursively toggle tabs into view once a user chooses a detail/edit view
    * to display.
    * @param {ABView.id} parentTab
    * @param {webix.view} wb
    */
   toggleTab(parentTab, wb) {
      // find the tab || if we didn't pass and id we may have passed a domNode
      const tab =
         wb.getTopParentView().queryView({ id: parentTab }) || $$(parentTab);

      if (!tab) return;

      // set the tabbar to to the tab
      const tabbar = tab.getParentView().getParentView();

      if (!tabbar) return;

      // if we have reached the top we won't have a tab
      if (tabbar.setValue) tabbar.setValue(parentTab);

      // find if it is in a multiview of a tab
      const nextTab = tabbar.queryView({ view: "scrollview" }, "parent");

      // if so then do this again
      if (nextTab) this.toggleTab(nextTab, wb);
   }

   toggleUpdateDelete() {
      const $DataTable = this.getDataTable();

      let checkedItems = 0;

      $DataTable.data.each((obj) => {
         if (
            typeof obj !== "undefined" &&
            Object.prototype.hasOwnProperty.call(
               obj,
               "appbuilder_select_item"
            ) &&
            obj.appbuilder_select_item === 1
         )
            checkedItems++;
      });

      if (checkedItems > 0) this.enableUpdateDelete();
      else this.disableUpdateDelete();
   }

   toolbarDeleteSelected($view) {
      const $DataTable = this.getDataTable();
      const CurrentObject = this.datacollection.datasource;
      const deleteTasks = [];

      $DataTable.data.each((row) => {
         if (
            typeof row !== "undefined" &&
            // row.hasOwnProperty("appbuilder_select_item") &&
            Object.prototype.hasOwnProperty.call(
               row,
               "appbuilder_select_item"
            ) &&
            row.appbuilder_select_item === 1
         ) {
            // NOTE: store a fn() to run later.
            deleteTasks.push(() => CurrentObject.model().delete(row.id));
         }
      });

      const abWebix = this.AB.Webix;

      if (deleteTasks.length > 0)
         abWebix.confirm({
            title: this.label("Delete Multiple Records"),
            text: this.label(
               "Are you sure you want to delete the selected records?"
            ),
            callback: async (result) => {
               if (result) {
                  // Now run those functions
                  await Promise.all(deleteTasks.map((t) => t()));

                  // Anything we need to do after we are done.
                  this.disableUpdateDelete();
               }
            },
         });
      else
         abWebix.alert({
            title: this.label("No Records Selected"),
            text: this.label(
               "You need to select at least one record...did you drink your coffee today?"
            ),
         });
   }

   toolbarFilter($view) {
      this.view.filterHelper.showPopup($view);
   }

   toolbarSort($view) {
      this.PopupSortDataTableComponent.show($view);
   }

   toolbarExport($view) {
      this.PopupExport.show($view);
   }

   toolbarMassUpdate($view) {
      this.PopupMassUpdateComponent.show($view);
   }

   /**
    * @function toolTip()
    *
    * Retrieve the items toolTip
    */
   toolTip(obj, common) {
      const CurrentObject = this.datacollection.datasource;
      const imageFieldColNames = CurrentObject.imageFields().map(
         (f) => f.columnName
      );

      let tip = "";

      const columnName = common.column.id.replace(" ", "");

      if (Array.isArray(obj[columnName])) {
         obj[columnName].forEach(function (o) {
            if (o.text) tip += o.text + "<br/>";
         });
      } else if (
         typeof obj[columnName + "__relation"] !== "undefined" &&
         typeof obj[columnName] === "number"
      )
         tip = obj[columnName + "__relation"].text;
      else if (typeof obj[columnName + "__relation"] !== "undefined") {
         let relationData = obj[columnName + "__relation"];

         if (!Array.isArray(relationData)) relationData = [relationData];

         (relationData || []).forEach(function (o) {
            if (o) tip += o.text + "<br/>";
         });
      } else if (imageFieldColNames.indexOf(columnName) !== -1) {
         if (!obj[columnName]) {
            return "";
         } else {
            // TODO: we need to get this URL from the ABFieldImage object!
            tip = `<img style='max-width: 500px; max-height: 500px;' src='/file/${obj[columnName]}' />`;
         }
      } else if (common.column.editor === "date")
         tip = common.column.format(obj[columnName]);
      else if (common.column.editor === "richselect")
         CurrentObject.fields().forEach((f) => {
            if (f.columnName === columnName) {
               if (f.settings.options) {
                  f.settings.options.forEach((o) => {
                     if (o.id === obj[columnName]) {
                        tip = o.text;
                     }
                  });
               }
            }
         });
      else tip = obj[columnName];

      if (!tip) return "";
      else return tip;
   }

   /**
    * @function toolTipOnBeforeRender()
    *
    * Add visibility "hidden" to all tooltips before render so we can move to a new location without the visual jump
    */
   toolTipOnBeforeRender(node) {
      // var node = $$(ids.tooltip).getNode();
      node.style.visibility = "hidden";
   }

   /**
    * @function toolTipOnAfterRender()
    *
    * If the tooltip is displaying off the screen we want to try to reposition it for a better experience
    */
   toolTipOnAfterRender(node) {
      // var node = $$(ids.tooltip).getNode();
      if (node.firstChild?.nodeName === "IMG") {
         setTimeout(() => {
            const imgBottom = parseInt(node.style.top.replace("px", "")) + 500;
            const imgRight = parseInt(node.style.left.replace("px", "")) + 500;

            if (imgBottom > window.innerHeight) {
               const imgOffsetY = imgBottom - window.innerHeight;
               const newTop =
                  parseInt(node.style.top.replace("px", "")) - imgOffsetY;
               node.style.top = newTop + "px";
            }

            if (imgRight > window.innerWidth) {
               const imgOffsetX = imgRight - window.innerWidth;
               const newLeft =
                  parseInt(node.style.left.replace("px", "")) - imgOffsetX;
               node.style.left = newLeft + "px";
            }

            node.style.visibility = "visible";
         }, 250);
      } else node.style.visibility = "visible";
   }

   get isCustomGroup() {
      const dc = this.datacollection;
      const CurrentObject = dc?.datasource;
      const $DataTable = this.getDataTable();

      return (
         $DataTable?.config?.view === "treetable" && !CurrentObject?.isGroup
      );
   }

   populateGroupData() {
      if (!this.isCustomGroup) return;

      this.busy();

      const dc = this.datacollection;
      const $DataTable = this.getDataTable();

      $DataTable.clearAll();
      $DataTable.parse(dc.getData() || []);

      this.grouping();
      this.ready();
   }
}
