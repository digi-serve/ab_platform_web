const ABViewGridCore = require("../../core/views/ABViewGridCore");
import ABViewComponent from "./ABViewComponent";

// const ABWorkspaceDatatable = require("../../../ABDesigner/ab_work_object_workspace_datatable");
// const ABPopupHideFields = require("../../../ABDesigner/ab_work_object_workspace_popupHideFields");
// const ABPopupFrozenColumns = require("../../../ABDesigner/ab_work_object_workspace_popupFrozenColumns");

// const ABPopupSummaryColumns = require("../../../ABDesigner/ab_work_object_workspace_popupSummaryColumns");
// const ABPopupCountColumns = require("../../../ABDesigner/ab_work_object_workspace_popupCountColumns");

// const ABFieldImage = require("../dataFields/ABFieldImage");

import ABPopupExport from "./ABViewGridPopupExport";
import ABPopupMassUpdateClass from "./ABViewGridPopupMassUpdate";
import ABPopupSortField from "./ABViewGridPopupSortFields";
import ABViewGridFilter from "./viewProperties/ABViewPropertyFilterData";
const ABViewPropertyLinkPage = require("./viewProperties/ABViewPropertyLinkPage")
   .default;

const KEY_STORAGE_SETTINGS = "abviewgrid_settings";
// {string}
// the unique key for ABViewGrids to store/retrieve their local settings

var GridSettings = null;
// {hash} { grid.id : [ {columnHeader}, {columnHeader} ...]}
// Keep a global copy of our local Grid settings, so we can optimize the header
// sizes.

let PopupHideFieldComponent = null;
let PopupFrozenColumnsComponent = null;
let PopupFilterProperty = null;
let PopupSummaryColumnsComponent = null;
let PopupCountColumnsComponent = null;

var L = null;
// multilingual Label fn()

class ABViewGridComponent extends ABViewComponent {
   constructor(viewGrid, idBase) {
      var base = idBase || `ABViewGrid_${viewGrid.id}`;

      super(base, {
         // component: `${base}_component`,
         toolbar: "",
         buttonDeleteSelected: "",

         buttonFilter: "",
         buttonMassUpdate: "",
         buttonSort: "",
         buttonExport: "",

         globalSearchToolbar: "",

         datatable: "",
      });

      this.viewGrid = viewGrid;
      this.viewGrid.filterHelper.on("filter.data", (fnFilter, filterRules) => {
         this.callbackFilterData(fnFilter, filterRules); // be notified when there is a change in the filter
      });

      // derive these from viewGrid
      this.AB = viewGrid.AB;
      this.id = viewGrid.id;
      this.settings = viewGrid.settings || {};

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

      this.datacollection = null;
      // {ABDataCollection}
      // The Webix DataCollection that manages the data we are displaying.

      this.validationError = false;
      // {bool}
      // Has a Validation Error occured?

      this.linkPage = this.viewGrid.linkPageHelper.component(
         this.AB._App,
         `${base}_gridlinkpage`
      );
      // {ABViewPropertyLinkPage}
      //

      this.PopupExport = new ABPopupExport(base);
      this.PopupExport.init(this.AB);
      // {ABViewGridPopupExport}
      // Popup for managing how to export our data.

      this.PopupMassUpdateComponent = new ABPopupMassUpdateClass(this, this.id);
      this.PopupMassUpdateComponent.init(this.AB);
      // this.PopupMassUpdateComponent.on("")
      // {}
      // The popup for performing a Mass Edit operation.

      this.PopupSortDataTableComponent = new ABPopupSortField(base);
      this.PopupSortDataTableComponent.init(this.AB);
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

      this.handler_select = (...params) => {
         this.selectRow(...params);
      };
      // {fn} .handler_select
      // the callback fn for our selectRow()
      // We want this called when the .datacollection we are linked to
      // emits an "onChange" event.

      if (!L) {
         L = (...params) => {
            return this.AB.Multilingual.label(...params);
         };
      }
   }

   /**
    * @method getColumnIndex()
    * return the Datatable.getColumnIndex() value
    * @param {string} id
    *        the uuid of the column we are referencing.
    * @return {integer}
    */
   getColumnIndex(id) {
      var indx = this.getDataTable().getColumnIndex(id);
      if (!this.settings.massUpdate) {
         // the index is 0 based. So if the massUpdate feature isn't
         // enabled, we need to add 1 to the result so they look like
         // a 1, 2, ...

         indx++;
      }
      return indx;
   }

   uiDatatable() {
      var ids = this.ids;
      var settings = this.settings;
      var self = this;

      var view = "datatable";
      if (settings.isTreeDatable || settings.groupBy) {
         // switch datatable to support tree
         view = "treetable";
      }

      var selectType = "cell";
      if (!settings.isEditable && (settings.detailsPage || settings.editPage)) {
         selectType = "row";
      }

      return {
         view: view,
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
                  var currObject = self.datacollection.datasource;
                  var selectField = currObject.fields((f) => {
                     return f.columnName == data.column;
                  })[0];

                  if (selectField == null) return true;

                  var cellNode = this.getItemNode({
                        row: data.row,
                        column: data.column,
                     }),
                     rowData = this.getItem(data.row);

                  console.error("TODO: field.customEdit() remove App param!");
                  return selectField.customEdit(
                     rowData,
                     self.AB._App,
                     cellNode
                  );
               } else if (!settings.detailsPage && !settings.editPage) {
                  return false;
               }
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
                  if (self.settings.isEditable) {
                     // if the colum is not the select item column move on to
                     // the next step to save
                     var state = {
                        value: val,
                     };

                     var editor = {
                        row: row,
                        column: col,
                        config: null,
                     };
                     self.onAfterEditStop(state, editor);
                  } else {
                     var node = this.getItemNode({
                        row: row,
                        column: col,
                     });
                     var checkbox = node.querySelector(
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
               var rightSplitItems = [
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
                  var column = self.getLastColumn();

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
            onBeforeColumnDrag: (sourceId, event) => {
               if (this.skippableColumns.indexOf(sourceId) != -1) return false;
               else return true;
            },
            onBeforeColumnDrop: (sourceId, targetId, event) => {
               // Make sure we are not trying to drop onto one of our special
               // columns ...
               if (this.skippableColumns.indexOf(targetId) != -1) return false;
            },
            onAfterColumnDrop: (sourceId, targetId, event) => {
               this.onAfterColumnDrop(sourceId, targetId, event);
            },
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
      return this.viewGrid.filterHelper.ui();

      // make sure onFilterData is now .emit()ed instead of passing in a callback.
   }

   /**
    * @method uiToolbar()
    * Return the webix definition for the toolbar row for our Grids.
    * @return {json}
    */
   uiToolbar() {
      var ids = this.ids;
      var self = this;

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
               label: L("Edit"),
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
               label: L("Delete"),
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
               label: L("Filters"),
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
               label: L("Sort"),
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
               label: L("Export"),
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
               placeholder: L("Search..."),
               on: {
                  onTimedKeyPress: () => {
                     let searchText = $$(ids.globalSearchToolbar).getValue();
                     this.viewGrid.filterHelper.externalSearchText(searchText);
                  },
               },
            },
         ],
      };
   }

   ui() {
      var tableUI = {
         type: "space",
         rows: [
            {},
            {
               view: "label",
               label: L("Select an object to load."),
               inputWidth: 200,
               align: "center",
            },
            {},
         ],
      };

      if (this.datacollection || this.settings.dataviewID != "") {
         tableUI.padding = this.settings.padding;
         tableUI.rows = [];
         if (this.settings.showToolbar) {
            tableUI.rows.push(this.uiToolbar());
         }
         if (this.settings.gridFilter.filterOption) {
            tableUI.rows.push(this.uiFilter());
         }

         tableUI.rows.push(this.uiDatatable());
      }

      return tableUI;
   }

   async init(AB, accessLevel = 2) {
      if (AB) {
         this.AB = AB;
      }
      var self = this;
      var ids = this.ids;

      // WORKAROUND : Where should we define this ??
      // For include PDF.js
      webix.codebase = "";
      webix.cdn = "/js/webix";

      // this shows the options to Hide, Filter, sort , etc...
      // only in Designer?
      // PopupHeaderEditComponent.init({
      //    onClick: _logic.callbackHeaderEdit, // be notified when there is a change in the hidden fields
      // });

      // NOTE: register the onAfterRender() here, so it only registers
      // one.
      var DataTable = this.getDataTable();
      var throttleCustomDisplay = null;
      var scrollStarted = null;

      webix.extend(DataTable, webix.ProgressBar);

      DataTable.config.accessLevel = accessLevel;
      if (accessLevel < 2) {
         DataTable.define("editable", false);
      }

      let customDisplays = (data) => {
         var CurrentObject = this.datacollection?.datasource;
         if (!CurrentObject || !DataTable.data) return;

         var displayRecords = [];

         let verticalScrollState = DataTable.getScrollState().y,
            rowHeight = DataTable.config.rowHeight,
            height = DataTable.$view.querySelector(".webix_ss_body")
               .clientHeight,
            startRecIndex = Math.floor(verticalScrollState / rowHeight),
            endRecIndex = startRecIndex + DataTable.getVisibleCount(),
            index = 0;

         DataTable.data.order.each(function (id) {
            if (id != null && startRecIndex <= index && index <= endRecIndex)
               displayRecords.push(id);

            index++;
         });

         var editable = this.settings.isEditable;
         if (DataTable.config.accessLevel < 2) {
            editable = false;
         }
         CurrentObject.customDisplays(
            data,
            this.AB._App,
            DataTable,
            displayRecords,
            editable
         );
      };

      DataTable.attachEvent("onAfterRender", function (data) {
         DataTable.resize();

         if (throttleCustomDisplay) clearTimeout(throttleCustomDisplay);
         throttleCustomDisplay = setTimeout(() => {
            if (scrollStarted) clearTimeout(scrollStarted);
            customDisplays(this.data);
         }, 350);

         AB.ClassUI.CYPRESS_REF(DataTable);
         Object.keys(ids).forEach((key) => {
            var $el = $$(ids[key]);
            if ($el) {
               AB.ClassUI.CYPRESS_REF($el);
            }
         });
      });

      // we have some data types that have custom displays that don't look
      // right after scrolling large data sets we need to call customDisplays
      // again
      DataTable.attachEvent("onScroll", function () {
         if (scrollStarted) clearTimeout(scrollStarted);
         if (throttleCustomDisplay) clearTimeout(throttleCustomDisplay);

         scrollStarted = setTimeout(() => {
            customDisplays(this.data);
         }, 1500);
      });
      DataTable.attachEvent("onAfterScroll", function () {
         if (throttleCustomDisplay) clearTimeout(throttleCustomDisplay);

         throttleCustomDisplay = setTimeout(() => {
            if (scrollStarted) clearTimeout(scrollStarted);
            customDisplays(this.data);
         }, 350);
      });

      // Process our onItemClick events.
      // this is a good place to check if our delete/trash icon was clicked.
      DataTable.attachEvent("onItemClick", function (id, e, node) {
         // make sure we have an object selected before processing this.
         var CurrentObject = self.datacollection?.datasource;
         if (!CurrentObject) {
            return;
         }

         if (self.settings.isEditable == 0) {
            var items = DataTable.getItem(id);
         }
         // if this was our edit icon:
         // console.log(e.target.className);
         if (e == "auto" || e.target.className.indexOf("eye") > -1) {
            // View a Details Page:
            self.changePage(dv, id, self.settings.detailsPage);
            self.toggleTab(self.settings.detailsTab, this);
         } else if (e.target.className.indexOf("pencil") > -1) {
            self.changePage(dv, id, self.settings.editPage);
            self.toggleTab(self.settings.editTab, this);
         } else if (e.target.className.indexOf("track") > -1) {
            self.emit("object.track", CurrentObject, id.row);
            // App.actions.openObjectTrack(CurrentObject, id.row);
         } else if (e.target.className.indexOf("trash") > -1) {
            // if this was our trash icon:

            webix.confirm({
               title: L("Delete data"),
               text: L("Do you want to delete this row?"),
               callback: function (result) {
                  if (result) {
                     CurrentObject.model()
                        .delete(id.row)
                        .then((response) => {
                           if (response.numRows > 0) {
                              DataTable.remove(id);
                              DataTable.clearSelection();
                           } else {
                              webix.alert({
                                 text: L(
                                    "No rows were effected.  This does not seem right."
                                 ),
                              });
                           }
                        })
                        .catch((err) => {
                           self.AB.notify.developer(err, {
                              context: "ABViewGridComponent.onItemClick",
                              message: "Error deleting item",
                              obj: CurrentObject.toObj(),
                              id: id.row,
                           });

                           //// TODO: what do we do here?
                        });
                  }

                  DataTable.clearSelection();
                  return true;
               },
            });
         } else if (self.settings.detailsPage.length) {
            // If an icon wasn't selected but a details page is set
            // view the details page
            self.changePage(dv, id, self.settings.detailsPage);
            self.toggleTab(self.settings.detailsTab, this);
         } else if (self.settings.editPage.length) {
            // If an icon wasn't selected but an edit page is set
            // view the edit page
            self.changePage(dv, id, self.settings.editPage);
            self.toggleTab(self.settings.editTab, this);
         }
      });

      // ABViewGrid Original init();

      if (this.settings.showToolbar) {
         if (
            this.settings.massUpdate ||
            this.settings.isSortable ||
            this.settings.isExportable ||
            (this.settings.gridFilter &&
               this.settings.gridFilter.filterOption &&
               this.settings.gridFilter.userFilterPosition == "toolbar")
         ) {
            $$(ids.toolbar).show();
         }

         if (this.settings.massUpdate == false) {
            $$(ids.buttonMassUpdate).hide();
            $$(ids.buttonDeleteSelected).hide();
         }

         if (this.settings.allowDelete == false) {
            $$(ids.buttonDeleteSelected).hide();
         }

         if (this.settings.gridFilter) {
            if (
               this.settings.gridFilter.filterOption != 1 ||
               this.settings.gridFilter.userFilterPosition != "toolbar"
            ) {
               $$(ids.buttonFilter).hide();
            }

            if (
               this.settings.gridFilter.filterOption == 3 &&
               this.settings.gridFilter.globalFilterPosition == "single"
            ) {
               DataTable.hide();
            }

            if (this.settings.gridFilter.isGlobalToolbar)
               $$(ids.globalSearchToolbar).show();
            else $$(ids.globalSearchToolbar).hide();

            if (this.settings.gridFilter.filterOption) {
               this.viewGrid.filterHelper.init(this.AB);
            }
         }

         if (this.settings.isSortable == false) {
            $$(ids.buttonSort).hide();
         }

         if (this.settings.isExportable == false) {
            $$(ids.buttonExport).hide();
         }
      }

      if (this.settings.hideHeader == true) {
         this.hideHeader();
      }

      if (!this.datacollection) {
         if (this.settings.dataviewID) {
            var dv = this.AB.datacollectionByID(this.settings.dataviewID);
            this.datacollectionLoad(dv);
         }
      }

      // Make sure
      if (!GridSettings) {
         GridSettings = (await this.AB.Storage.get(KEY_STORAGE_SETTINGS)) || {};
      }

      if (this.datacollection?.datasource) {
         // TRANSITION: ABViewGrid_orig line 862 ...

         this.linkPage.init({
            view: this.viewGrid,
            datacollection: this.datacollection,
         });

         this.refreshHeader();
      }

      return Promise.resolve();
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
      var ids = this.ids;
      var $ButtonFilter = $$(ids.buttonFilter);
      if ($ButtonFilter) {
         var badge = null;
         var onlyFilterRules = this.viewGrid.filterHelper.filterRules();
         if (onlyFilterRules?.rules?.length) {
            badge = 1;
         }
         $ButtonFilter.define("badge", badge);
         $ButtonFilter.refresh();
      }

      this.datacollection.filterCondition(filterRules);
      this.datacollection.reloadData();

      /*
      var $DataTable = $$(ids.datatable);
      Promise.resolve()
         .then(
            () =>
               new Promise((next, err) => {
                  // if (
                  //    !this.settings ||
                  //    !this.settings.gridFilter ||
                  //    this.settings.gridFilter.filterOption != 3
                  // )
                  //    // Global search
                  //    return next();

                  let dc = this.datacollection;
                  if (
                     !dc ||
                     (dc.settings.loadAll &&
                        dc.dataStatus != dc.dataStatusFlag.notInitial)
                  )
                     // Load all already
                     return next();

                  let limit = null;

                  // Load all data
                  // let gridElem = $$(this.ids.datatable);
                  if (
                     $DataTable.data.find({}).length < $DataTable.data.count()
                  ) {
                     dc.reloadData(0, limit)
                        .then(() => {
                           // Should set .loadAll to this data collection ?
                           if (limit == null) dc.settings.loadAll = true;

                           next();
                        })
                        .catch(err);
                  } else {
                     next();
                  }
               })
         )
         // client filter data
         .then(
            () =>
               new Promise((next, err) => {
                  if (!fnFilter) return next();

                  // wait the data are parsed into webix.datatable
                  setTimeout(() => {
                     $DataTable.filter((rowData) => {
                        // rowData is null when is not load from paging
                        if (rowData == null) return false;

                        return fnFilter(rowData);
                     });

                     if (
                        this.settings.gridFilter.globalFilterPosition ==
                        "single"
                     ) {
                        if ($DataTable.count() > 0) {
                           $DataTable.show();
                           $DataTable.select($DataTable.getFirstId(), false);
                           $DataTable.callEvent("onItemClick", [
                              $DataTable.getFirstId(),
                              "auto",
                              null,
                           ]);
                        } else {
                           $DataTable.hide();
                        }
                     }

                     next();
                  }, 500);
               })
         );
         */
   }

   async callbackSortData(sortRules = []) {
      $$(this.ids.buttonSort).define("badge", sortRules.length || null);
      $$(this.ids.buttonSort).refresh();

      let gridElem = this.getDataTable();
      if (gridElem.data.find({}).lesngth < gridElem.data.count()) {
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
         gridElem.sort(this.PopupSortDataTableComponent.sort);
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
      let rowId = rowItem?.row ?? null;

      // Set cursor to data view
      if (dv) {
         dv.setCursor(rowId);
      }

      // Pass settings to link page module
      // console.error("!!!! TODO: implement linkPageHelper() !!!!");
      if (this.linkPage) {
         this.linkPage.changePage(page, rowId);
      }

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
      var oldDC = this.datacollection;
      this.datacollection = dc;

      var CurrentObject = dc?.datasource;
      var $DataTable = this.getDataTable();
      if ($DataTable) {
         // preventing too many handlers
         if (!this.__handler_dc_busy) {
            this.__handler_dc_busy = () => {
               this.busy();
            };

            this.__handler_dc_ready = () => {
               this.ready();
            };

            this.__handler_dc_loadData = () => {
               if (
                  $DataTable.config.view == "treetable" &&
                  CurrentObject &&
                  !CurrentObject.isGroup
               ) {
                  $DataTable.clearAll();
                  $DataTable.parse(dc.getData());

                  this.grouping();
                  this.ready();
               }
            };
         }

         if (oldDC) {
            // remove our listeners from the previous DC
            oldDC.removeListener("initializingData", this.__handler_dc_busy);
            oldDC.removeListener("initializedData", this.__handler_dc_ready);
            oldDC.removeListener("loadData", this.__handler_dc_loadData);
         }

         if (dc) {
            if (dc.datacollectionLink && dc.fieldLink) {
               dc.bind($DataTable, dc.datacollectionLink, dc.fieldLink);
            } else {
               dc.bind($DataTable);
            }
            // making sure we only have 1 registered listener on this dc
            dc.removeListener("initializingData", this.__handler_dc_busy);
            dc.on("initializingData", this.__handler_dc_busy);
            dc.removeListener("initializedData", this.__handler_dc_ready);
            dc.on("initializedData", this.__handler_dc_ready);
            dc.removeListener("loadData", this.__handler_dc_loadData);
            dc.on("loadData", this.__handler_dc_loadData);
            this.grouping();
         } else {
            $DataTable.unbind();
         }

         // Be sure to pass on our CurrentObject to our dependent components.
         if (CurrentObject) {
            this.viewGrid.filterHelper.objectLoad(CurrentObject);
            this.PopupMassUpdateComponent.objectLoad(
               CurrentObject,
               this.getDataTable()
            );
            this.PopupSortDataTableComponent.objectLoad(CurrentObject);

            this.PopupExport.objectLoad(CurrentObject);
            this.PopupExport.dataCollectionLoad(dc);
            this.PopupExport.setGridComponent(this.getDataTable());
            this.PopupExport.setHiddenFields(this.settings.hiddenFields);
            this.PopupExport.setFilename(this.viewGrid.label);
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
      var DataTable = this.getDataTable();
      var lastColumn = {};

      // Loop through each columns config to find out if it is in the split 1 region and set it as the last item...then it will be overwritten by next in line
      DataTable.eachColumn(function (columnId) {
         var columnConfig = DataTable.getColumnConfig(columnId);
         if (columnConfig.split == 1) lastColumn = columnConfig;
      });

      return lastColumn;
   }

   /**
    * @method grouping()
    * perform any grouping operations
    */
   grouping() {
      if (!this.settings.groupBy) return;

      let $treetable = this.getDataTable();

      // map: {
      //     votes:["votes", "sum"],
      //     title:["year"]
      // }
      let baseGroupMap = {};
      let CurrentObject = this.datacollection.datasource;
      CurrentObject.fields().forEach((f) => {
         switch (f.key) {
            case "number":
               baseGroupMap[f.columnName] = [f.columnName, "sum"];
               break;
            case "calculate":
            case "formula":
               baseGroupMap[f.columnName] = [
                  f.columnName,
                  function (prop, listData) {
                     if (!listData) return 0;

                     let sum = 0;

                     listData.forEach((r) => {
                        sum += f.format(r) * 1;
                     });

                     return sum;
                  },
               ];
               break;
            case "connectObject":
               baseGroupMap[f.columnName] = [
                  f.columnName,
                  function (prop, listData) {
                     if (!listData || !listData.length) return 0;

                     let count = 0;

                     listData.forEach((r) => {
                        var valRelation = r[f.relationName()];

                        // array
                        if (valRelation && valRelation.length != null)
                           count += valRelation.length;
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
                        var val = prop(r);

                        // count only exists data
                        if (val) {
                           count += 1;
                        }
                     });

                     return count;
                  },
               ];
               break;
         }
      });

      // set group definition
      // DataTable.define("scheme", {
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
         let by;
         let groupMap = this.AB.cloneDeep(baseGroupMap);

         // Root
         if (gIndex == groupBys.length - 1) {
            by = colName;
         }
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
               if (gColName != colName) groupMap[gColName] = [gColName];
            });
         }

         $treetable.data.group({
            by: by,
            map: groupMap,
         });
      });
   }

   hideHeader() {
      var DataTable = this.getDataTable();
      DataTable.define("header", false);
      DataTable.refresh();
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
      var DataTable = this.getDataTable();
      let CurrentObject = this.datacollection.datasource;
      var settings = this.settings;
      var columnConfig = this.localSettings();

      // Reorder our current columnConfig
      // We know what was moved and what item it has replaced/pushed forward
      // so first we want to splice the item moved out of the array of fields
      // and store it so we can put it somewhere else
      let itemMoved = null;
      let oPos = 0; // original position
      for (var i = 0; i < columnConfig.length; i++) {
         if (columnConfig[i].id == sourceId) {
            itemMoved = columnConfig[i];
            columnConfig.splice(i, 1);
            oPos = i;
            break;
         }
      }
      // once we have removed/stored it we can find where its new position
      // will be by looping back through the array and finding the item it
      // is going to push forward
      for (var j = 0; j < columnConfig.length; j++) {
         if (columnConfig[j].id == targetId) {
            // if the original position was before the new position we will
            // follow webix's logic that the drop should go after the item
            // it was placed on
            if (oPos <= j) {
               j++;
            }
            columnConfig.splice(j, 0, itemMoved);
            break;
         }
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
      if (settings.saveLocal) {
         this.localSettingsSave();
      }

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
      //       if (DataTable.config.accessLevel < 2) {
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
      //          DataTable.define(
      //             "leftSplit",
      //             DataTable.getColumnIndex(frozenColumnID) + columnSplitLeft
      //          );
      //       } else {
      //          DataTable.define("leftSplit", columnSplitLeft);
      //       }
      //       _logic.freezeDeleteColumn();
      //       DataTable.refreshColumns();
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

      var DataTable = this.getDataTable();

      // if you don't edit an empty cell we just need to move on
      if (
         (state.old == null && state.value === "") ||
         (state.old === "" && state.value === "")
      ) {
         DataTable.clearSelection();
         return false;
      }

      if (editor.config) {
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
      }

      if (state.value != state.old) {
         var item = DataTable.getItem(editor.row);
         item[editor.column] = state.value;

         DataTable.removeCellCss(item.id, editor.column, "webix_invalid");
         DataTable.removeCellCss(item.id, editor.column, "webix_invalid_cell");

         var CurrentObject = this.datacollection.datasource;
         var validator = CurrentObject.isValidData(item);
         if (validator.pass()) {
            //// Question: do we submit full item updates?  or just patches?
            // IF Patch:
            // var patch = {};
            // patch.id = item.id;
            // patch[editor.column] = item[editor.column];
            // await CurrentObject.model().update(item.id, patch)

            try {
               await CurrentObject.model().update(item.id, item);
               if (DataTable.exists(editor.row)) {
                  DataTable.updateItem(editor.row, item);
                  DataTable.clearSelection();
                  DataTable.refresh(editor.row);
               }
            } catch (err) {
               this.AB.notify.developer(err, {
                  context: "ABViewGrid:onAfterEditStop(): Error saving item",
                  item,
                  editor,
                  state,
                  object: CurrentObject.toObj(),
               });

               DataTable.clearSelection();
               if (
                  this.AB.Validation.isGridValidationError(
                     err,
                     editor.row,
                     DataTable
                  )
               ) {
                  // Do we reset the value?
                  // item[editor.column] = state.old;
                  // DataTable.updateItem(editor.row, item);
               } else {
                  // this was some other Error!
               }
            }
            // CurrentObject.model()
            //    .update(item.id, item)
            //    .then(() => {
            //       if (DataTable.exists(editor.row)) {
            //          DataTable.updateItem(editor.row, item);
            //          DataTable.clearSelection();
            //          DataTable.refresh(editor.row);
            //       }
            //    })
            //    .catch((err) => {
            //       OP.Error.log("Error saving item:", {
            //          error: err
            //       });

            //       DataTable.clearSelection();
            //       if (
            //          OP.Validation.isGridValidationError(
            //             err,
            //             editor.row,
            //             DataTable
            //          )
            //       ) {
            //          // Do we reset the value?
            //          // item[editor.column] = state.old;
            //          // DataTable.updateItem(editor.row, item);
            //       } else {
            //          // this was some other Error!
            //       }
            //    });
         } else {
            validator.updateGrid(editor.row, DataTable);
         }
      } else {
         DataTable.clearSelection();
      }
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

      var requireRefresh = false;
      if (newWidth < 30) {
         newWidth = 30;
         requireRefresh = true;
         webix.message({
            type: "info",
            text: this.AB.Multilingual.label("minimum column width is {0}", [
               30,
            ]),
            expire: 1000,
         });
      }

      var localSettings = this.localSettings();
      if (localSettings) {
         var header = localSettings.find((h) => h.id == columnName);
         if (header) {
            header.width = newWidth;
            delete header.adjust;
         }
      }

      if (this.settings.saveLocal) {
         this.localSettings(localSettings);
         await this.AB.Storage.set(KEY_STORAGE_SETTINGS, GridSettings);
      }

      // refresh the display
      if (requireRefresh) {
         this.refreshHeader();
      }
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
      if (this.skippableColumns.indexOf(id.column) != -1) return false;

      // save our EditNode & EditField:
      // this.EditNode = node;

      var EditField = this.datacollection.datasource.fields(
         (f) => f.columnName == id.column
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

      var dv = this.datacollection;
      if (dv) {
         this.eventAdd({
            emitter: dv,
            eventName: "changeCursor",
            listener: this.handler_select,
         });
      }
   }

   /**
    * @method ready()
    * Indicate that our datatable is currently ready for operation.
    */
   ready() {
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
   refreshHeader(ignoreLocal = false) {
      // columnSplitRight = 0;
      // wait until we have an Object defined:
      var CurrentObject = this.datacollection.datasource;
      if (!CurrentObject) return;

      var ids = this.ids;
      var DataTable = $$(ids.datatable);
      if (!DataTable) return;

      var accessLevel = DataTable.config.accessLevel;
      DataTable.define("leftSplit", 0);
      DataTable.define("rightSplit", 0);

      let rowHeight = 0;
      CurrentObject.imageFields().forEach((image) => {
         if (
            image.settings.useHeight &&
            image.settings.imageHeight > rowHeight
         ) {
            rowHeight = image.settings.imageHeight;
         }
      });
      if (rowHeight) {
         DataTable.define("rowHeight", rowHeight);
      }

      // DataTable.clearAll();

      var settings = this.settings;
      var editable = settings.isEditable;
      if (DataTable.config.accessLevel < 2) {
         editable = false;
      }

      //// update DataTable structure:
      // get column list from our local settings
      var objColumnHeaders = CurrentObject.columnHeaders(
         true,
         editable,
         // TRANSITION: moving these from .columnHeaders() to here:
         [], //settings.summaryColumns,
         [], //settings.countColumns,
         [] //settings.hiddenFields
      );
      var columnHeaders = this.localSettings();
      if (!columnHeaders || ignoreLocal) {
         // if that is empty, pull from our settings.columnConfig
         columnHeaders = this.AB.cloneDeep(this.settings.columnConfig);
      }
      if (columnHeaders.length == 0) {
         // if that is empty for some reason, rebuild from our CurrentObject

         columnHeaders = objColumnHeaders;
      }

      // default our columnConfig values to our columnHeaders:
      columnHeaders.forEach((c) => {
         // we want to overwrite our default settings with anything stored
         // in local storage
         var origCol = objColumnHeaders.find((h) => h.fieldID == c.fieldID);

         // none of our functions can be stored in localStorage, so scan
         // the original column and attach any template functions to our
         // stashed copy.
         Object.keys(origCol).forEach((k) => {
            if (typeof origCol[k] == "function") {
               c[k] = origCol[k];
            }
         });

         var f = CurrentObject.fieldByID(c.fieldID);
         if (!f) return;

         // if it's a hidden field:
         if (settings.hiddenFields.indexOf(f.columnName) > -1) {
            c.hidden = true;
         }
         // add summary footer:
         if (settings.summaryColumns.indexOf(f.id) > -1) {
            if (f.key == "calculate" || f.key == "formula") {
               c.footer = { content: "totalColumn", field: f };
            } else {
               c.footer = { content: "summColumn" };
            }
         }
         // or add the count footer
         else if (settings.countColumns.indexOf(f.id) > -1)
            c.footer = { content: "countColumn" };
      });

      var localSettings = this.localSettings();
      if (!localSettings || ignoreLocal) {
         this.localSettings(columnHeaders);
         localSettings = columnHeaders;
      }
      columnHeaders = this.AB.cloneDeep(localSettings);

      var fieldValidations = [];
      var rulePops = [];

      columnHeaders.forEach((col) => {
         col.fillspace = false;

         // parse the rules because they were stored as a string
         // check if rules are still a string...if so lets parse them
         if (col.validationRules) {
            if (typeof col.validationRules === "string") {
               col.validationRules = JSON.parse(col.validationRules);
            }

            if (col.validationRules.length) {
               var validationUI = [];
               // there could be more than one so lets loop through and build the UI
               col.validationRules.forEach((rule) => {
                  var Filter = this.AB.filterComplexNew(
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
               var popUpId = ids.rules + "_" + col.id; /* + "_" + webix.uid() */
               // store the popup ids so we can remove the later
               rulePops.push(popUpId);
               // add the popup to the UI but don't show it
               webix.ui({
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
            var groupField = CurrentObject.fieldByID(col.id);
            if (groupField) {
               col.template = function (obj, common) {
                  // return common.treetable(obj, common) + obj.value;
                  if (obj.$group) {
                     let rowData = this.AB.cloneDeep(obj);
                     rowData[groupField.columnName] = rowData.value;

                     return (
                        common.treetable(obj, common) +
                        groupField.format(rowData)
                     );
                  } else return groupField.format(obj);
               };
            }
         }
      });

      if (fieldValidations.length) {
         // we need to store the rules for use later so lets build a container array
         var complexValidations = [];
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
               values: DataTable.getSelectedItem(),
               invalidMessage: f.invalidMessage,
            });
         });
         var rules = {};

         // store the rules in a data param to be used later
         DataTable.$view.complexValidations = complexValidations;
         // use the lookup to build the validation rules
         Object.keys(complexValidations).forEach(function (key) {
            rules[key] = function (value, data) {
               // default valid is true
               var isValid = true;
               var invalidMessage = "";
               DataTable.$view.complexValidations[key].forEach((filter) => {
                  // convert rowData from { colName : data } to { id : data }
                  var newData = {};
                  (CurrentObject.fields() || []).forEach((field) => {
                     newData[field.id] = data[field.columnName];
                  });
                  // for the case of "this_object" conditions:
                  if (data.uuid) {
                     newData["this_object"] = data.uuid;
                  }

                  // use helper funtion to check if valid
                  var ruleValid = filter.filters(newData);
                  // if invalid we need to tell the field
                  if (ruleValid == false) {
                     isValid = false;
                     invalidMessage = filter.invalidMessage;
                  }
               });
               if (isValid == false) {
                  // we also need to define an error message
                  webix.message({
                     type: "error",
                     text: invalidMessage,
                  });
               }
               return isValid;
            };
         });
         // define validation rules
         DataTable.define("rules", rules);
         // store the array of view ids on the webix object so we can get it later
         DataTable.config.rulePops = rulePops;
         DataTable.refresh();
      } else {
         // check if the previous datatable had rule popups and remove them
         if (DataTable.config.rulePops) {
            DataTable.config.rulePops.forEach((popup) => {
               if ($$(popup)) $$(popup).destructor();
            });
         }
         // remove any validation rules from the previous table
         DataTable.define("rules", {});
         DataTable.refresh();
      }

      var addedColumns = [];
      // {array} the .id of the columnHeaders we add based upon our settings.
      // this will help us pick the lastColumn that is part of the
      // object.

      if (settings.labelAsField) {
         // console.log(CurrentObject);
         columnHeaders.unshift({
            id: "appbuilder_label_field",
            header: "Label",
            fillspace: true,
            template: function (obj) {
               return CurrentObject.displayData(obj);
            },
            // css: { 'text-align': 'center' }
         });
         addedColumns.push("appbuilder_label_field");
      }

      if (settings.massUpdate && accessLevel == 2) {
         columnHeaders.unshift({
            id: "appbuilder_select_item",
            header: { content: "masterCheckbox", contentId: "mch" },
            width: 40,
            template: "<div class='singleSelect'>{common.checkbox()}</div>",
            css: { "text-align": "center" },
         });
         this.columnSplitLeft = 1;
         addedColumns.push("appbuilder_select_item");
      } else {
         this.columnSplitLeft = 0;
      }
      if (settings.detailsPage != "" && !settings.hideButtons) {
         columnHeaders.push({
            id: "appbuilder_view_detail",
            header: "",
            width: 40,
            template: function (obj, common) {
               return "<div class='detailsView'><span class='webix_icon fa fa-eye'></span></div>";
            },
            css: { "text-align": "center" },
         });
         // columnSplitRight++;
         addedColumns.push("appbuilder_view_detail");
      }
      if (settings.trackView != 0 && accessLevel == 2) {
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
         settings.editPage != "" &&
         !settings.hideButtons &&
         accessLevel == 2
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
      if (settings.allowDelete && accessLevel == 2) {
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
      var lastCol = null;
      for (var i = columnHeaders.length - 1; i >= 0; i--) {
         if (!lastCol) {
            var col = columnHeaders[i];
            if (!col.hidden && addedColumns.indexOf(col.id) == -1) {
               lastCol = col;
               break;
            }
         }
      }

      if (lastCol) {
         lastCol.fillspace = true;
         lastCol.minWidth = lastCol.width;
         lastCol.width = 150; // set a width for last column but by default it will fill the available space or use the minWidth to take up more
      }

      DataTable.refreshColumns(columnHeaders);

      // the addedColumns represent the additional icons that can be added.
      this.columnSplitRight = addedColumns.length;
      // the .massUpdate gets added to Left so don't include that in split right:
      if (addedColumns.indexOf("appbuilder_select_item") > -1)
         this.columnSplitRight -= 1;
      // .columnSplitRight can't be < 0
      if (this.columnSplitRight < 0) this.columnSplitRight = 0;

      // freeze columns:
      let frozenColumnID = settings.frozenColumnID;
      if (frozenColumnID != "") {
         DataTable.define(
            "leftSplit",
            DataTable.getColumnIndex(frozenColumnID) + 1
         );
      } else {
         DataTable.define("leftSplit", this.columnSplitLeft);
      }
      this.freezeDeleteColumn();
      DataTable.refreshColumns();

      // }
   }

   /**
    * localSettingsSave()
    * Persist our current working copy of our GridSettings to localStorage.
    * @return {Promise}
    */
   async localSettingsSave() {
      var savedLocalSettings =
         (await this.AB.Storage.get(KEY_STORAGE_SETTINGS)) || {};
      savedLocalSettings[this.settingsID()] = GridSettings[this.settingsID()];
      await this.AB.Storage.set(KEY_STORAGE_SETTINGS, savedLocalSettings);
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
      if (value) {
         GridSettings[this.settingsID()] = value;
      } else {
         return GridSettings[this.settingsID()];
      }
   }

   /**
    * @method selectRow()
    * Select the grid row that correspondes to the provided rowData.
    * @param {json} rowData
    *        A key=>value hash of data that matches an entry in the grid.
    *        rowData.id should match an existing entry.
    */
   selectRow(rowData) {
      let $DataTable = this.getDataTable();
      if (!$DataTable) return;

      if (rowData == null) $DataTable.unselect();
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
      var CurrentObject = this.datacollection.datasource;
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
      // find the tab
      var tab = wb.getTopParentView().queryView({ id: parentTab });
      // if we didn't pass and id we may have passed a domNode
      if (tab == null) {
         tab = $$(parentTab);
      }

      if (tab == null) return;

      // set the tabbar to to the tab
      var tabbar = tab.getParentView().getParentView();

      if (tabbar == null) return;

      if (tabbar.setValue) {
         // if we have reached the top we won't have a tab
         tabbar.setValue(parentTab);
      }

      // find if it is in a multiview of a tab
      var nextTab = tabbar.queryView({ view: "scrollview" }, "parent");
      // if so then do this again
      if (nextTab) {
         this.toggleTab(nextTab, wb);
      }
   }

   toggleUpdateDelete() {
      var DataTable = this.getDataTable();
      var checkedItems = 0;
      DataTable.data.each(function (obj) {
         if (
            typeof obj != "undefined" &&
            obj.hasOwnProperty("appbuilder_select_item") &&
            obj.appbuilder_select_item == 1
         ) {
            checkedItems++;
         }
      });
      if (checkedItems > 0) {
         this.enableUpdateDelete();
      } else {
         this.disableUpdateDelete();
      }
   }

   toolbarDeleteSelected($view) {
      var DataTable = this.getDataTable();
      let CurrentObject = this.datacollection.datasource;
      var deleteTasks = [];
      DataTable.data.each(function (row) {
         if (
            typeof row != "undefined" &&
            // row.hasOwnProperty("appbuilder_select_item") &&
            Object.prototype.hasOwnProperty.call(
               row,
               "appbuilder_select_item"
            ) &&
            row.appbuilder_select_item == 1
         ) {
            // NOTE: store a fn() to run later.
            deleteTasks.push(() => CurrentObject.model().delete(row.id));
         }
      });

      if (deleteTasks.length > 0) {
         webix.confirm({
            title: L("Delete Multiple Records"),
            text: L("Are you sure you want to delete the selected records?"),
            callback: async (result) => {
               if (result) {
                  // Now run those functions
                  await Promise.all(deleteTasks.map((t) => t()));

                  // Anything we need to do after we are done.
                  this.disableUpdateDelete();
               }
            },
         });
      } else {
         webix.alert({
            title: L("No Records Selected"),
            text: L(
               "You need to select at least one record...did you drink your coffee today?"
            ),
         });
      }
   }

   toolbarFilter($view) {
      this.viewGrid.filterHelper.showPopup($view);
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
      let CurrentObject = this.datacollection.datasource;
      var imageFieldColNames = CurrentObject.imageFields().map(
         (f) => f.columnName
      );
      var tip = "";
      var columnName = common.column.id.replace(" ", "");
      if (Array.isArray(obj[columnName])) {
         obj[columnName].forEach(function (o) {
            if (o.text) tip += o.text + "<br/>";
         });
      } else if (typeof obj[columnName + "__relation"] != "undefined") {
         var relationData = obj[columnName + "__relation"];
         if (!Array.isArray(relationData)) relationData = [relationData];

         (relationData || []).forEach(function (o) {
            if (o) tip += o.text + "<br/>";
         });
      } else if (
         typeof obj[columnName + "__relation"] != "undefined" &&
         typeof obj[columnName] == "number"
      ) {
         tip = obj[columnName + "__relation"].text;
      } else if (imageFieldColNames.indexOf(columnName) != -1) {
         if (obj[columnName] == null) {
            return "";
         } else {
            // TODO: we need to get this URL from the ABFieldImage object!
            tip = `<img style='max-width: 500px; max-height: 500px;' src='/file/${obj[columnName]}' />`;
         }
      } else if (common.column.editor == "date") {
         tip = common.column.format(obj[columnName]);
      } else if (common.column.editor == "richselect") {
         CurrentObject.fields().forEach(function (f) {
            if (f.columnName == columnName) {
               if (f.settings.options) {
                  f.settings.options.forEach(function (o) {
                     if (o.id == obj[columnName]) {
                        tip = o.text;
                     }
                  });
               }
            }
         });
      } else {
         tip = obj[columnName];
      }
      if (tip == null) {
         return "";
      } else {
         return tip;
      }
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
      if (node.firstChild != null && node.firstChild.nodeName == "IMG") {
         setTimeout(function () {
            var imgBottom = parseInt(node.style.top.replace("px", "")) + 500;
            var imgRight = parseInt(node.style.left.replace("px", "")) + 500;
            if (imgBottom > window.innerHeight) {
               var imgOffsetY = imgBottom - window.innerHeight;
               var newTop =
                  parseInt(node.style.top.replace("px", "")) - imgOffsetY;
               node.style.top = newTop + "px";
            }
            if (imgRight > window.innerWidth) {
               var imgOffsetX = imgRight - window.innerWidth;
               var newLeft =
                  parseInt(node.style.left.replace("px", "")) - imgOffsetX;
               node.style.left = newLeft + "px";
            }
            node.style.visibility = "visible";
         }, 250);
      } else {
         node.style.visibility = "visible";
      }
   }
}

export default class ABViewGrid extends ABViewGridCore {
   /**
    * @param {obj} values  key=>value hash of ABView values
    * @param {ABApplication} application the application object this view is under
    * @param {ABViewWidget} parent the ABViewWidget this view is a child of. (can be null)
    */
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   ///
   /// Instance Methods
   ///

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      // filter property
      this.filterHelper.fromSettings(this.settings.gridFilter);
   }

   //
   // Editor Related
   //

   /**
    * @method editorComponent
    * return the Editor for this UI component.
    * the editor should display either a "block" view or "preview" of
    * the current layout of the view.
    * @param {string} mode what mode are we in ['block', 'preview']
    * @return {Component}
    */
   // editorComponent(App, mode) {
   //    var idBase = "ABViewGridEditorComponent";

   //    var DataTable = this.component(App, idBase);

   //    return {
   //       ui: DataTable.ui,
   //       logic: DataTable.logic,
   //       onShow: DataTable.onShow,

   //       init: () => {
   //          // remove id of the component in caching for refresh .bind of the data collection
   //          let dv = this.datacollection;
   //          if (dv) dv.removeComponent(DataTable.ui.id);

   //          DataTable.init();
   //       },
   //    };
   // }

   //
   // Property Editor
   //

   // static propertyEditorDefaultElements(App, ids, _logic, ObjectDefaults) {
   //    var commonUI = super.propertyEditorDefaultElements(
   //       App,
   //       ids,
   //       _logic,
   //       ObjectDefaults
   //    );
   //    var L = App.Label;

   //    var idBase = "ABViewGridPropertyEditor";

   //    // initialize our popup editors with unique names so we don't overwrite the previous editor each time
   //    PopupHideFieldComponent = new ABPopupHideFields(App, idBase + "_hide");
   //    PopupFrozenColumnsComponent = new ABPopupFrozenColumns(
   //       App,
   //       idBase + "_freeze"
   //    );

   //    PopupSummaryColumnsComponent = new ABPopupSummaryColumns(
   //       App,
   //       idBase + "_summary"
   //    );
   //    PopupCountColumnsComponent = new ABPopupCountColumns(
   //       App,
   //       idBase + "_count"
   //    );

   //    PopupFilterProperty = ABViewPropertyFilterData.propertyComponent(
   //       App,
   //       idBase + "_gridfiltermenu"
   //    );
   //    this.linkPageComponent = ABViewPropertyLinkPage.propertyComponent(
   //       App,
   //       idBase + "_gridlinkpage"
   //    );

   //    let filter_property_popup = webix.ui({
   //       view: "window",
   //       modal: true,
   //       position: "center",
   //       resize: true,
   //       width: 700,
   //       height: 450,
   //       css: "ab-main-container",
   //       head: {
   //          view: "toolbar",
   //          cols: [
   //             {
   //                view: "label",
   //                label: L("ab.component.grid.filterMenu", "*Filter Menu"),
   //             },
   //          ],
   //       },
   //       body: PopupFilterProperty.ui,
   //    });

   //    _logic.newObject = () => {
   //       var currView = _logic.currentEditObject();
   //       currView.settings.objectWorkspace = {
   //          sortFields: [],
   //          filterConditions: [],
   //          frozenColumnID: "",
   //          hiddenFields: [],
   //          summaryColumns: [],
   //          countColumns: [],
   //       };
   //       currView.populatePopupEditors(currView);
   //    };

   //    // Open our popup editors when their settings button is clicked
   //    _logic.toolbarFieldsVisible = ($view) => {
   //       PopupHideFieldComponent.show($view, { pos: "top" });
   //    };

   //    _logic.toolbarFrozen = ($view) => {
   //       PopupFrozenColumnsComponent.show($view, { pos: "top" });
   //    };

   //    _logic.gridFilterMenuShow = () => {
   //       let currView = _logic.currentEditObject();

   //       // show filter popup
   //       filter_property_popup.show();
   //    };

   //    _logic.summaryColumns = ($view) => {
   //       PopupSummaryColumnsComponent.show($view, { pos: "top" });
   //    };

   //    _logic.countColumns = ($view) => {
   //       PopupCountColumnsComponent.show($view, { pos: "top" });
   //    };

   //    _logic.callbackHideFields = (settings) => {
   //       var currView = _logic.currentEditObject();

   //       currView.objectWorkspace = currView.objectWorkspace || {};
   //       currView.objectWorkspace.hiddenFields = settings;

   //       _logic.onChange();
   //    };

   //    _logic.callbackFrozenFields = (settings) => {
   //       var currView = _logic.currentEditObject();

   //       currView.objectWorkspace = currView.objectWorkspace || {};
   //       currView.objectWorkspace.frozenColumnID = settings || "";

   //       _logic.onChange();
   //    };

   //    _logic.callbackSaveWorkspace = (data) => {
   //       // when we make a change in the popups we want to make sure we save the new workspace to the properties to do so just fire an onChange event
   //       _logic.onChange();
   //    };

   //    _logic.gridFilterSave = () => {
   //       var currView = _logic.currentEditObject();
   //       // currView.settings.isFilterable = settings.filterOption == 1 ? true : false;

   //       // hide filter popup
   //       filter_property_popup.hide();

   //       // refresh settings
   //       this.propertyEditorValues(ids, currView);

   //       // trigger a save()
   //       this.propertyEditorSave(ids, currView);
   //    };

   //    _logic.gridFilterCancel = () => {
   //       // hide filter popup
   //       filter_property_popup.hide();
   //    };

   //    _logic.callbackSaveSummaryColumns = (data) => {
   //       var currObj = _logic.currentEditObject();
   //       currObj.settings.objectWorkspace.summaryColumns = data;

   //       // when we make a change in the popups we want to make sure we save the new workspace to the properties to do so just fire an onChange event
   //       _logic.onChange();
   //    };

   //    _logic.callbackSaveCountColumns = (data) => {
   //       var currObj = _logic.currentEditObject();
   //       currObj.settings.objectWorkspace.countColumns = data;

   //       // when we make a change in the popups we want to make sure we save the new workspace to the properties to do so just fire an onChange event
   //       _logic.onChange();
   //    };

   //    PopupHideFieldComponent.init({
   //       onChange: _logic.callbackHideFields, // be notified when there is a change in the hidden fields
   //    });

   //    PopupFrozenColumnsComponent.init({
   //       onChange: _logic.callbackFrozenFields, // be notified when there is a change in the hidden fields
   //    });

   //    PopupFilterProperty.init({
   //       onSave: _logic.gridFilterSave,
   //       onCancel: _logic.gridFilterCancel,
   //    });

   //    PopupSummaryColumnsComponent.init({
   //       onChange: _logic.callbackSaveSummaryColumns, // be notified when there is a change in the summary columns
   //    });

   //    PopupCountColumnsComponent.init({
   //       onChange: _logic.callbackSaveCountColumns, // be notified when there is a change in the count columns
   //    });

   //    var view = "button";
   //    // in addition to the common .label  values, we
   //    // ask for:
   //    return commonUI.concat([
   //       {
   //          view: "fieldset",
   //          label: L("ab.component.label.gridProperties", "*Grid Properties:"),
   //          labelWidth: App.config.labelWidthLarge,
   //          body: {
   //             type: "clean",
   //             padding: 10,
   //             rows: [
   //                {
   //                   view: "checkbox",
   //                   name: "isEditable",
   //                   labelRight: L(
   //                      "ab.component.label.isEditable",
   //                      "*User can edit in grid."
   //                   ),
   //                   labelWidth: App.config.labelWidthCheckbox,
   //                },
   //                {
   //                   view: "checkbox",
   //                   name: "massUpdate",
   //                   labelRight: L(
   //                      "ab.component.label.massUpdate",
   //                      "*User can edit multiple items at one time."
   //                   ),
   //                   labelWidth: App.config.labelWidthCheckbox,
   //                },
   //                {
   //                   view: "checkbox",
   //                   name: "allowDelete",
   //                   labelRight: L(
   //                      "ab.component.label.allowDelete",
   //                      "*User can delete records."
   //                   ),
   //                   labelWidth: App.config.labelWidthCheckbox,
   //                },
   //                {
   //                   view: "checkbox",
   //                   name: "isSortable",
   //                   labelRight: L(
   //                      "ab.component.label.isSortable",
   //                      "*User can sort records."
   //                   ),
   //                   labelWidth: App.config.labelWidthCheckbox,
   //                },
   //                {
   //                   view: "checkbox",
   //                   name: "isExportable",
   //                   labelRight: L(
   //                      "ab.component.label.isExportable",
   //                      "*User can export."
   //                   ),
   //                   labelWidth: App.config.labelWidthCheckbox,
   //                },
   //             ],
   //          },
   //       },
   //       {
   //          view: "fieldset",
   //          label: L("ab.component.label.dataSource", "*Grid Data:"),
   //          labelWidth: App.config.labelWidthLarge,
   //          body: {
   //             type: "clean",
   //             padding: 10,
   //             rows: [
   //                {
   //                   view: "select",
   //                   name: "datacollection",
   //                   label: L("ab.component.label.dataSource", "*Object:"),
   //                   labelWidth: App.config.labelWidthLarge,
   //                   on: {
   //                      onChange: (newv, oldv) => {
   //                         if (newv != oldv) {
   //                            $$(ids.detailsPage).setValue("");
   //                            $$(ids.editPage).setValue("");

   //                            let editingGrid = _logic.currentEditObject();
   //                            let currDC = editingGrid.AB.datacollections(
   //                               (dc) => dc.id == newv
   //                            )[0];
   //                            // disallow edit data of query
   //                            if (currDC && currDC.sourceType == "query") {
   //                               $$(ids.isEditable).setValue(false);
   //                               $$(ids.massUpdate).setValue(false);
   //                               $$(ids.allowDelete).setValue(false);
   //                               $$(ids.isEditable).disable();
   //                               $$(ids.massUpdate).disable();
   //                               $$(ids.allowDelete).disable();
   //                            } else {
   //                               $$(ids.isEditable).enable();
   //                               $$(ids.massUpdate).enable();
   //                               $$(ids.allowDelete).enable();
   //                            }
   //                         }
   //                      },
   //                   },
   //                },
   //             ],
   //          },
   //       },
   //       {
   //          view: "fieldset",
   //          label: L("ab.component.grid.group", "*Group:"),
   //          labelWidth: App.config.labelWidthLarge,
   //          body: {
   //             type: "clean",
   //             padding: 10,
   //             rows: [
   //                {
   //                   view: "multiselect",
   //                   name: "groupBy",
   //                   label: L("ab.component.grid.groupBy", "*Group by:"),
   //                   labelWidth: App.config.labelWidthLarge,
   //                   options: [],
   //                   on: {
   //                      onChange: (newV, oldV) => {
   //                         let currView = _logic.currentEditObject();
   //                         currView.propertyGroupByList(ids, newV);
   //                      },
   //                   },
   //                },
   //                {
   //                   view: "list",
   //                   name: "groupByList",
   //                   drag: true,
   //                   data: [],
   //                   height: 200,
   //                   template:
   //                      "<span class='fa fa-sort'></span>&nbsp;&nbsp; #value#",
   //                   on: {
   //                      onAfterDrop: () => {
   //                         let currView = _logic.currentEditObject();
   //                         this.propertyEditorSave(ids, currView);
   //                      },
   //                   },
   //                },
   //             ],
   //          },
   //       },
   //       this.linkPageComponent.ui,
   //       {
   //          view: "fieldset",
   //          label: L(
   //             "ab.component.label.customizeDisplay",
   //             "*Customize Display:"
   //          ),
   //          labelWidth: App.config.labelWidthLarge,
   //          body: {
   //             type: "clean",
   //             padding: 10,
   //             rows: [
   //                {
   //                   cols: [
   //                      {
   //                         view: "label",
   //                         label: L(
   //                            "ab.component.label.hiddenFields",
   //                            "*Hidden Fields:"
   //                         ),
   //                         css: "ab-text-bold",
   //                         width: App.config.labelWidthXLarge,
   //                      },
   //                      {
   //                         view: view,
   //                         name: "buttonFieldsVisible",
   //                         label: L("ab.component.label.settings", "*Settings"),
   //                         icon: "fa fa-gear",
   //                         type: "icon",
   //                         click: function () {
   //                            _logic.toolbarFieldsVisible(this.$view);
   //                         },
   //                      },
   //                   ],
   //                },
   //                {
   //                   cols: [
   //                      {
   //                         view: "label",
   //                         label: L(
   //                            "ab.component.label.filterData",
   //                            "*Filter Option:"
   //                         ),
   //                         css: "ab-text-bold",
   //                         width: App.config.labelWidthXLarge,
   //                      },
   //                      {
   //                         view: view,
   //                         name: "buttonFilterData",
   //                         label: L("ab.component.label.settings", "*Settings"),
   //                         icon: "fa fa-gear",
   //                         type: "icon",
   //                         click: function () {
   //                            _logic.gridFilterMenuShow(this.$view);
   //                         },
   //                      },
   //                   ],
   //                },
   //                {
   //                   cols: [
   //                      {
   //                         view: "label",
   //                         label: L(
   //                            "ab.component.label.freezeColumns",
   //                            "*Freeze Columns:"
   //                         ),
   //                         css: "ab-text-bold",
   //                         width: App.config.labelWidthXLarge,
   //                      },
   //                      {
   //                         view: view,
   //                         name: "buttonFieldsFreeze",
   //                         label: L("ab.component.label.settings", "*Settings"),
   //                         icon: "fa fa-gear",
   //                         type: "icon",
   //                         click: function () {
   //                            _logic.toolbarFrozen(this.$view);
   //                         },
   //                      },
   //                   ],
   //                },

   //                {
   //                   cols: [
   //                      {
   //                         view: "label",
   //                         label: L(
   //                            "ab.component.label.summaryFields",
   //                            "*Summary Fields:"
   //                         ),
   //                         css: "ab-text-bold",
   //                         width: App.config.labelWidthXLarge,
   //                      },
   //                      {
   //                         view: view,
   //                         name: "buttonSummaryFields",
   //                         label: L("ab.component.label.settings", "*Settings"),
   //                         icon: "fa fa-gear",
   //                         type: "icon",
   //                         click: function () {
   //                            _logic.summaryColumns(this.$view);
   //                         },
   //                      },
   //                   ],
   //                },

   //                {
   //                   cols: [
   //                      {
   //                         view: "label",
   //                         label: L(
   //                            "ab.component.label.countFields",
   //                            "*Count Fields:"
   //                         ),
   //                         css: "ab-text-bold",
   //                         width: App.config.labelWidthXLarge,
   //                      },
   //                      {
   //                         view: view,
   //                         name: "buttonCountFields",
   //                         label: L("ab.component.label.settings", "*Settings"),
   //                         icon: "fa fa-gear",
   //                         type: "icon",
   //                         click: function () {
   //                            _logic.countColumns(this.$view);
   //                         },
   //                      },
   //                   ],
   //                },

   //                {
   //                   view: "counter",
   //                   name: "height",
   //                   label: L("ab.component.grid.height", "*Height:"),
   //                   labelWidth: App.config.labelWidthXLarge,
   //                },

   //                {
   //                   view: "checkbox",
   //                   name: "hideHeader",
   //                   labelRight: L(
   //                      "ab.component.label.hideHeader",
   //                      "*Hide table header"
   //                   ),
   //                   labelWidth: App.config.labelWidthCheckbox,
   //                },

   //                {
   //                   view: "checkbox",
   //                   name: "labelAsField",
   //                   labelRight: L(
   //                      "ab.component.label.labelAsField",
   //                      "*Show a field using label template"
   //                   ),
   //                   labelWidth: App.config.labelWidthCheckbox,
   //                },

   //                {
   //                   view: "checkbox",
   //                   name: "hideButtons",
   //                   labelRight: L(
   //                      "ab.component.label.hideButtons",
   //                      "*Hide edit and view buttons"
   //                   ),
   //                   labelWidth: App.config.labelWidthCheckbox,
   //                },
   //             ],
   //          },
   //       },
   //       {},
   //    ]);
   // }

   // static propertyEditorPopulate(App, ids, view) {
   //    super.propertyEditorPopulate(App, ids, view);

   //    this.view = view;

   //    $$(ids.datacollection).setValue(view.settings.dataviewID);
   //    $$(ids.isEditable).setValue(view.settings.isEditable);
   //    $$(ids.massUpdate).setValue(view.settings.massUpdate);
   //    $$(ids.allowDelete).setValue(view.settings.allowDelete);
   //    $$(ids.isSortable).setValue(view.settings.isSortable);
   //    $$(ids.isExportable).setValue(view.settings.isExportable);
   //    var details = view.settings.detailsPage;
   //    if (view.settings.detailsTab != "") {
   //       details += ":" + view.settings.detailsTab;
   //    }
   //    $$(ids.detailsPage).setValue(details);
   //    var edit = view.settings.editPage;
   //    if (view.settings.editTab != "") {
   //       edit += ":" + view.settings.editTab;
   //    }
   //    $$(ids.editPage).setValue(edit);
   //    $$(ids.height).setValue(view.settings.height);
   //    $$(ids.hideHeader).setValue(view.settings.hideHeader);
   //    $$(ids.labelAsField).setValue(view.settings.labelAsField);
   //    $$(ids.hideButtons).setValue(view.settings.hideButtons);
   //    $$(ids.groupBy).setValue(view.settings.groupBy);

   //    // initial populate of properties and popups
   //    view.populateEditor(ids, view);
   //    view.populatePopupEditors(view);
   //    view.populateBadgeNumber(ids, view);

   //    // when a change is made in the properties the popups need to reflect the change
   //    this.updateEventIds = this.updateEventIds || {}; // { viewId: boolean, ..., viewIdn: boolean }
   //    if (!this.updateEventIds[view.id]) {
   //       this.updateEventIds[view.id] = true;

   //       view.addListener(
   //          "properties.updated",
   //          function () {
   //             view.populateEditor(ids, view);
   //             view.populatePopupEditors(view);
   //             view.populateBadgeNumber(ids, view);
   //          },
   //          this
   //       );
   //    }

   //    //Load ABDatacollection to QueryBuilder
   //    this.propertyUpdateGridFilterObject(ids, view);

   //    // Populate values to link page properties
   //    this.linkPageComponent.viewLoad(view);
   //    this.linkPageComponent.setSettings(view.settings);
   // }

   // static propertyEditorValues(ids, view) {
   //    super.propertyEditorValues(ids, view);

   //    // Retrive the values of your properties from Webix and store them in the view
   //    view.settings.dataviewID = $$(ids.datacollection).getValue();
   //    view.settings.isEditable = $$(ids.isEditable).getValue();
   //    view.settings.massUpdate = $$(ids.massUpdate).getValue();
   //    view.settings.allowDelete = $$(ids.allowDelete).getValue();
   //    view.settings.isSortable = $$(ids.isSortable).getValue();
   //    view.settings.isExportable = $$(ids.isExportable).getValue();

   //    var detailsPage = $$(ids.detailsPage).getValue();
   //    var detailsTab = "";
   //    if (detailsPage.split(":").length > 1) {
   //       var detailsVals = detailsPage.split(":");
   //       detailsPage = detailsVals[0];
   //       detailsTab = detailsVals[1];
   //    }
   //    view.settings.detailsPage = detailsPage;
   //    view.settings.detailsTab = detailsTab;

   //    var editPage = $$(ids.editPage).getValue();
   //    var editTab = "";
   //    if (editPage.split(":").length > 1) {
   //       var editVals = editPage.split(":");
   //       editPage = editVals[0];
   //       editTab = editVals[1];
   //    }
   //    view.settings.editPage = editPage;
   //    view.settings.editTab = editTab;

   //    view.settings.height = $$(ids.height).getValue();
   //    view.settings.hideHeader = $$(ids.hideHeader).getValue();
   //    view.settings.labelAsField = $$(ids.labelAsField).getValue();
   //    view.settings.hideButtons = $$(ids.hideButtons).getValue();
   //    // view.settings.groupBy = $$(ids.groupBy).getValue();

   //    // pull order groupBy list
   //    let groupByList = $$(ids.groupByList).serialize() || [];
   //    view.settings.groupBy = groupByList.map((item) => item.id).join(",");

   //    view.settings.gridFilter = PopupFilterProperty.getSettings();

   //    view.settings.objectWorkspace = view.settings.objectWorkspace || {};
   //    view.settings.objectWorkspace.hiddenFields = PopupHideFieldComponent.getValue();
   //    view.settings.objectWorkspace.frozenColumnID = PopupFrozenColumnsComponent.getValue();

   //    // link pages
   //    let linkSettings = this.linkPageComponent.getSettings();
   //    for (let key in linkSettings) {
   //       view.settings[key] = linkSettings[key];
   //    }

   //    // Populate values to link page properties
   //    this.linkPageComponent.viewLoad(view);
   //    this.linkPageComponent.setSettings(view.settings);
   // }

   // static propertyUpdateGridFilterObject(ids, view) {
   //    if (!view) return;

   //    // Populate values to QueryBuilder
   //    var selectedDv = view.datacollection;

   //    if (selectedDv) {
   //       let object = selectedDv.datasource;
   //       if (object) {
   //          PopupFilterProperty.objectLoad(object, selectedDv.settings.loadAll);
   //       }
   //    }
   // }

   propertyGroupByList(ids, groupBy) {
      let colNames = groupBy || [];
      if (typeof colNames == "string") {
         colNames = colNames.split(",");
      }

      let options = $$(ids.groupBy).getList().data.find({});

      $$(ids.groupByList).clearAll();
      colNames.forEach((colName) => {
         let opt = options.filter((o) => o.id == colName)[0];
         if (opt) {
            $$(ids.groupByList).add(opt);
         }
      });
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   // component(App, objId) {
   //    let baseCom = super.component(App);
   //    var L = App.Label;

   //    var idBase = objId || "ABViewGrid_" + this.id;
   //    var ids = {
   //       component: App.unique(idBase + "_component"),
   //       toolbar: App.unique(idBase + "_toolbar"),
   //       buttonDeleteSelected: App.unique(idBase + "_deleteSelected"),
   //       // buttonExport: App.unique('buttonExport'),
   //       buttonFilter: App.unique(idBase + "_buttonFilter"),
   //       buttonMassUpdate: App.unique(idBase + "_buttonMassUpdate"),
   //       buttonSort: App.unique(idBase + "_buttonSort"),
   //       buttonExport: App.unique(idBase + "_buttonExport"),

   //       globalSearchToolbar: App.unique(idBase + "_globalSearchToolbar"),
   //    };

   //    var labels = {
   //       common: App.labels,
   //    };

   //    var CurrentObject = null;

   //    var settings = {
   //       allowDelete: this.settings.allowDelete,
   //       detailsView: this.settings.detailsPage,
   //       editView: this.settings.editPage,
   //       isEditable: this.settings.isEditable,
   //       massUpdate: this.settings.massUpdate,
   //       configureHeaders: false,
   //       summaryColumns: this.settings.summaryColumns,
   //       countColumns: this.settings.countColumns,
   //       hideHeader: this.settings.hideHeader,
   //       labelAsField: this.settings.labelAsField,
   //       hideButtons: this.settings.hideButtons,
   //       groupBy: this.settings.groupBy,
   //       hiddenFields: this.settings.hiddenFields,
   //       frozenColumnID: this.settings.frozenColumnID || "",
   //       isTreeDatable: this.datacollection && this.datacollection.isGroup,
   //    };

   //    let DataTable = new ABWorkspaceDatatable(App, idBase, settings);
   //    let PopupMassUpdateComponent = new ABPopupMassUpdate(
   //       App,
   //       idBase + "_mass"
   //    );
   //    let PopupSortDataTableComponent = new ABPopupSortField(
   //       App,
   //       idBase + "_sort"
   //    );
   //    let exportPopup = new ABPopupExport(App, idBase + "_export");

   //    let filterUI = this.filterHelper.component(App, idBase + "_gridfilter");
   //    this.filterHelper.fromSettings(this.settings.gridFilter);

   //    let linkPage = this.linkPageHelper.component(
   //       App,
   //       idBase + "_gridlinkpage"
   //    );

   //    let _init = (options, accessLevel) => {
   //       if (this.settings.dataviewID != "") {
   //          DataTable.init(
   //             {
   //                onCheckboxChecked: _logic.callbackCheckboxChecked,
   //             },
   //             accessLevel
   //          );

   //          PopupMassUpdateComponent.init({
   //             // onSave:_logic.callbackAddFields        // be notified of something...who knows...
   //          });

   //          PopupSortDataTableComponent.init({
   //             onChange: _logic.callbackSortData,
   //          });

   //          filterUI.init({
   //             onFilterData: (fnFilter, filterRules) => {
   //                _logic.callbackFilterData(fnFilter, filterRules); // be notified when there is a change in the filter
   //             },
   //          });

   //          exportPopup.init({});

   //          if (
   //             this.settings.massUpdate ||
   //             this.settings.isSortable ||
   //             this.settings.isExportable ||
   //             (this.settings.gridFilter &&
   //                this.settings.gridFilter.filterOption &&
   //                this.settings.gridFilter.userFilterPosition == "toolbar")
   //          ) {
   //             $$(ids.toolbar).show();
   //          }

   //          if (this.settings.massUpdate == false) {
   //             $$(ids.buttonMassUpdate).hide();
   //             $$(ids.buttonDeleteSelected).hide();
   //          }

   //          if (this.settings.allowDelete == false) {
   //             $$(ids.buttonDeleteSelected).hide();
   //          }

   //          if (this.settings.gridFilter) {
   //             if (
   //                this.settings.gridFilter.filterOption != 1 ||
   //                this.settings.gridFilter.userFilterPosition != "toolbar"
   //             ) {
   //                $$(ids.buttonFilter).hide();
   //             }

   //             if (
   //                this.settings.gridFilter.filterOption == 3 &&
   //                this.settings.gridFilter.globalFilterPosition == "single"
   //             ) {
   //                $$(DataTable.ui.id).hide();
   //             }

   //             if (this.settings.gridFilter.isGlobalToolbar)
   //                $$(ids.globalSearchToolbar).show();
   //             else $$(ids.globalSearchToolbar).hide();
   //          }

   //          if (this.settings.isSortable == false) {
   //             $$(ids.buttonSort).hide();
   //          }

   //          if (this.settings.isExportable == false) {
   //             $$(ids.buttonExport).hide();
   //          }

   //          if (this.settings.hideHeader == true) {
   //             DataTable.hideHeader();
   //          }

   //          var dv = this.datacollection;
   //          if (dv && dv.datasource) {
   //             CurrentObject = dv.datasource;

   //             DataTable.objectLoad(CurrentObject);
   //             PopupMassUpdateComponent.objectLoad(CurrentObject, DataTable);
   //             PopupSortDataTableComponent.objectLoad(CurrentObject);
   //             PopupSortDataTableComponent.setValue(this.settings.sortFields);
   //             this.filterHelper.objectLoad(CurrentObject);
   //             this.filterHelper.viewLoad(this);
   //             exportPopup.objectLoad(CurrentObject);
   //             exportPopup.dataCollectionLoad(dv);
   //             exportPopup.setGridComponent($$(DataTable.ui.id));
   //             exportPopup.setHiddenFields(this.settings.hiddenFields);
   //             exportPopup.setFilename(this.label);
   //             DataTable.refreshHeader();

   //             // link page helper
   //             linkPage.init({
   //                view: this,
   //                datacollection: dv,
   //             });

   //             // dv.bind($$(DataTable.ui.id));
   //             DataTable.datacollectionLoad(dv);

   //             var editPage = this.settings.editPage;
   //             var detailsPage = this.settings.detailsPage;
   //             var editTab = this.settings.editTab;
   //             var detailsTab = this.settings.detailsTab;
   //             var isEditable = this.settings.isEditable;

   //             // we need to recursivly look backwards to toggle tabs into view when a user choosed to select a tab for edit or details views
   //             function toggleTab(parentTab, wb) {
   //                // find the tab
   //                var tab = wb.getTopParentView().queryView({ id: parentTab });
   //                // if we didn't pass and id we may have passed a domNode
   //                if (tab == null) {
   //                   tab = $$(parentTab);
   //                }

   //                if (tab == null) return;

   //                // set the tabbar to to the tab
   //                var tabbar = tab.getParentView().getParentView();

   //                if (tabbar == null) return;

   //                if (tabbar.setValue) {
   //                   // if we have reached the top we won't have a tab
   //                   tabbar.setValue(parentTab);
   //                }

   //                // find if it is in a multiview of a tab
   //                var nextTab = tabbar.queryView(
   //                   { view: "scrollview" },
   //                   "parent"
   //                );
   //                // if so then do this again
   //                if (nextTab) {
   //                   toggleTab(nextTab, wb);
   //                }
   //             }

   //             $$(DataTable.ui.id).attachEvent(
   //                "onItemClick",
   //                function (id, e, node) {
   //                   var item = id;

   //                   if (e == "auto") {
   //                      // automatically choose the details page if a record matches
   //                      // later on we can decide if we want to have the choice to select the edit page intead.
   //                      _logic.changePage(dv, item, detailsPage);
   //                      toggleTab(detailsTab, this);
   //                   } else if (e.target.className.indexOf("eye") > -1) {
   //                      _logic.changePage(dv, item, detailsPage);
   //                      toggleTab(detailsTab, this);
   //                   } else if (e.target.className.indexOf("pencil") > -1) {
   //                      _logic.changePage(dv, item, editPage);
   //                      toggleTab(editTab, this);
   //                   } else if (e.target.className.indexOf("trash") > -1) {
   //                      // don't do anything for delete it is handled elsewhere
   //                   } else if (!isEditable && detailsPage.length) {
   //                      _logic.changePage(dv, item, detailsPage);
   //                      toggleTab(detailsTab, this);
   //                   } else if (
   //                      !isEditable &&
   //                      !detailsPage.length &&
   //                      editPage.length &&
   //                      this.config.accessLevel == 2
   //                   ) {
   //                      _logic.changePage(dv, item, editPage);
   //                      toggleTab(editTab, this);
   //                   }
   //                }
   //             );

   //             $$(DataTable.ui.id).attachEvent(
   //                "onAfterRender",
   //                function (data) {
   //                   if ($$(DataTable.ui.id)) {
   //                      //set cy data
   //                      $$(DataTable.ui.id).$view.setAttribute(
   //                         "data-cy",
   //                         DataTable.idBase
   //                      );
   //                      for (const key in ids) {
   //                         if (Object.hasOwnProperty.call(ids, key)) {
   //                            let element = ids[key].toString();
   //                            if ($$(element)) {
   //                               $$(element).$view.setAttribute(
   //                                  "data-cy",
   //                                  element
   //                               );
   //                            }
   //                         }
   //                      }
   //                   }
   //                }
   //             );

   //             // $$(DataTable.ui.id).attachEvent('onBeforeRender', function (data) {
   //             //    _logic.clientSideDataFilter();
   //             // });

   //             $$(DataTable.ui.id).adjust();
   //          }

   //          // Adjust grid based off Access Level of parent view
   //          if (accessLevel < 2) {
   //             $$(ids.buttonMassUpdate).hide();
   //             $$(ids.buttonDeleteSelected).hide();
   //          }
   //       }
   //    };

   //    // specify height of the grid
   //    if (this.settings.height) DataTable.ui.height = this.settings.height;

   //    var tableUI = {
   //       type: "space",
   //       rows: [
   //          {
   //             view: "label",
   //             label: "Select an object to load.",
   //             inputWidth: 200,
   //             align: "center",
   //          },
   //          {},
   //       ],
   //    };
   //    if (this.settings.dataviewID != "") {
   //       tableUI = {
   //          type: "space",
   //          padding: 17,
   //          rows: [
   //             {
   //                view: "toolbar",
   //                id: ids.toolbar,
   //                hidden: true,
   //                css: "ab-data-toolbar",
   //                cols: [
   //                   {
   //                      view: "button",
   //                      id: ids.buttonMassUpdate,
   //                      css: "webix_transparent",
   //                      label: L("ab.object.toolbar.massUpdate", "*Edit"),
   //                      icon: "fa fa-pencil-square-o",
   //                      type: "icon",
   //                      disabled: true,
   //                      autowidth: true,
   //                      click: function () {
   //                         _logic.toolbarMassUpdate(this.$view);
   //                      },
   //                   },
   //                   {
   //                      view: "button",
   //                      id: ids.buttonDeleteSelected,
   //                      css: "webix_transparent",
   //                      label: L("ab.object.toolbar.deleteRecords", "*Delete"),
   //                      icon: "fa fa-trash",
   //                      type: "icon",
   //                      disabled: true,
   //                      autowidth: true,
   //                      click: function () {
   //                         _logic.toolbarDeleteSelected(this.$view);
   //                      },
   //                   },
   //                   {
   //                      view: "button",
   //                      id: ids.buttonFilter,
   //                      css: "webix_transparent",
   //                      label: L("ab.object.toolbar.filterFields", "*Filters"),
   //                      icon: "fa fa-filter",
   //                      type: "icon",
   //                      autowidth: true,
   //                      click: function () {
   //                         _logic.toolbarFilter(this.$view);
   //                      },
   //                   },
   //                   {
   //                      view: "button",
   //                      id: ids.buttonSort,
   //                      css: "webix_transparent",
   //                      label: L("ab.object.toolbar.sortFields", "*Sort"),
   //                      icon: "fa fa-sort",
   //                      type: "icon",
   //                      autowidth: true,
   //                      click: function () {
   //                         _logic.toolbarSort(this.$view);
   //                      },
   //                   },
   //                   {
   //                      view: "button",
   //                      id: ids.buttonExport,
   //                      css: "webix_transparent",
   //                      label: L("ab.object.toolbar.export", "*Export"),
   //                      icon: "fa fa-print",
   //                      type: "icon",
   //                      autowidth: true,
   //                      click: function () {
   //                         _logic.toolbarExport(this.$view);
   //                      },
   //                   },
   //                   /*
   //             {
   //                view: view,
   //                id: ids.buttonExport,
   //                label: labels.component.export,
   //                icon: "fa fa-download",
   //                type: "icon",
   //                click: function() {
   //                   _logic.toolbarButtonExport(this.$view);
   //                }
   //             }
   //                          */
   //                   {},
   //                   {
   //                      id: ids.globalSearchToolbar,
   //                      view: "search",
   //                      placeholder: "Search...",
   //                      on: {
   //                         onTimedKeyPress: () => {
   //                            let searchText = $$(
   //                               ids.globalSearchToolbar
   //                            ).getValue();

   //                            filterUI.searchText(searchText);
   //                         },
   //                      },
   //                   },
   //                ],
   //             },
   //             filterUI.ui,
   //             DataTable.ui,
   //          ],
   //       };
   //    }

   //    // our internal business logic
   //    var _logic = {
   //       callbackCheckboxChecked: (state) => {
   //          if (state == "enable") {
   //             _logic.enableUpdateDelete();
   //          } else {
   //             _logic.disableUpdateDelete();
   //          }
   //       },

   //       callbackSortData: (sort_settings) => {
   //          let sortRules = sort_settings || [];

   //          $$(ids.buttonSort).define("badge", sortRules.length || null);
   //          $$(ids.buttonSort).refresh();

   //          let gridElem = $$(DataTable.ui.id);
   //          Promise.resolve()
   //             // NOTE: Webix's client sorting does not support dynamic loading.
   //             // If the data does not be loaded, then load all data.
   //             .then(() => {
   //                if (gridElem.data.find({}).length < gridElem.data.count()) {
   //                   return new Promise((next, bad) => {
   //                      this.datacollection
   //                         .reloadData(0, 0)
   //                         .catch(bad)
   //                         .then(() => {
   //                            // wait until the grid component will done to repaint UI
   //                            setTimeout(() => {
   //                               next();
   //                            }, 777);
   //                         });
   //                   });
   //                } else {
   //                   return Promise.resolve();
   //                }
   //             })
   //             // client sort data
   //             .then(() => {
   //                gridElem.sort(PopupSortDataTableComponent.sort);
   //             });
   //       },

   //       callbackFilterData: (fnFilter, filterRules) => {
   //          filterRules = filterRules || [];

   //          if ($$(ids.buttonFilter)) {
   //             $$(ids.buttonFilter).define("badge", filterRules.length || null);
   //             $$(ids.buttonFilter).refresh();
   //          }

   //          Promise.resolve()
   //             .then(
   //                () =>
   //                   new Promise((next, err) => {
   //                      // if (
   //                      //    !this.settings ||
   //                      //    !this.settings.gridFilter ||
   //                      //    this.settings.gridFilter.filterOption != 3
   //                      // )
   //                      //    // Global search
   //                      //    return next();

   //                      let dc = this.datacollection;
   //                      if (
   //                         !dc ||
   //                         (dc.settings.loadAll &&
   //                            dc.dataStatus != dc.dataStatusFlag.notInitial)
   //                      )
   //                         // Load all already
   //                         return next();

   //                      let limit = null;

   //                      // limit pull data to reduce time and performance loading
   //                      // if (dc.__dataCollection.count() > 300) limit = 300;

   //                      // Load all data
   //                      let gridElem = $$(DataTable.ui.id);
   //                      if (
   //                         gridElem.data.find({}).length < gridElem.data.count()
   //                      ) {
   //                         dc.reloadData(0, limit)
   //                            .then(() => {
   //                               // Should set .loadAll to this data collection ?
   //                               if (limit == null) dc.settings.loadAll = true;

   //                               next();
   //                            })
   //                            .catch(err);
   //                      } else {
   //                         next();
   //                      }
   //                   })
   //             )
   //             // client filter data
   //             .then(
   //                () =>
   //                   new Promise((next, err) => {
   //                      if (!fnFilter) return next();

   //                      // wait the data are parsed into webix.datatable
   //                      setTimeout(() => {
   //                         let table = $$(DataTable.ui.id);
   //                         table.filter((rowData) => {
   //                            // rowData is null when is not load from paging
   //                            if (rowData == null) return false;

   //                            return fnFilter(rowData);
   //                         });

   //                         if (
   //                            this.settings.gridFilter.globalFilterPosition ==
   //                            "single"
   //                         ) {
   //                            if (table.count() > 0) {
   //                               table.show();
   //                               table.select(table.getFirstId(), false);
   //                               table.callEvent("onItemClick", [
   //                                  table.getFirstId(),
   //                                  "auto",
   //                                  null,
   //                               ]);
   //                            } else {
   //                               table.hide();
   //                            }
   //                         }

   //                         next();
   //                      }, 500);
   //                   })
   //             );
   //       },

   //       changePage: (dv, rowItem, page) => {
   //          let rowId = rowItem && rowItem.row ? rowItem.row : null;

   //          // Set cursor to data view
   //          if (dv) {
   //             dv.setCursor(rowId);
   //          }

   //          // Pass settings to link page module
   //          if (linkPage) {
   //             linkPage.changePage(page, rowId);
   //          }

   //          super.changePage(page);
   //       },

   //       selectRow: (rowData) => {
   //          if (!$$(DataTable.ui.id)) return;

   //          if (rowData == null) $$(DataTable.ui.id).unselect();
   //          else if (
   //             rowData &&
   //             rowData.id &&
   //             $$(DataTable.ui.id).exists(rowData.id)
   //          )
   //             $$(DataTable.ui.id).select(rowData.id, false);
   //          else $$(DataTable.ui.id).select(null, false);
   //       },

   //       /**
   //        * @function enableUpdateDelete
   //        *
   //        * enable the update or delete buttons in the toolbar if there are any items selected
   //        * we will make this externally accessible so we can call it from within the datatable component
   //        */
   //       enableUpdateDelete: function () {
   //          $$(ids.buttonMassUpdate).enable();
   //          $$(ids.buttonDeleteSelected).enable();
   //       },

   //       /**
   //        * @function enableUpdateDelete
   //        *
   //        * disable the update or delete buttons in the toolbar if there no items selected
   //        * we will make this externally accessible so we can call it from within the datatable component
   //        */
   //       disableUpdateDelete: function () {
   //          $$(ids.buttonMassUpdate).disable();
   //          $$(ids.buttonDeleteSelected).disable();
   //       },

   //       toolbarDeleteSelected: function ($view) {
   //          var deleteTasks = [];
   //          $$(DataTable.ui.id).data.each(function (obj) {
   //             if (
   //                typeof obj != "undefined" &&
   //                obj.hasOwnProperty("appbuilder_select_item") &&
   //                obj.appbuilder_select_item == 1
   //             ) {
   //                deleteTasks.push(function (next) {
   //                   CurrentObject.model()
   //                      .delete(obj.id)
   //                      .then((response) => {
   //                         next();
   //                      }, next);
   //                });
   //             }
   //          });

   //          if (deleteTasks.length > 0) {
   //             App.AB.Dialog.Confirm({
   //                title: L("ab.massDelete.title", "*Delete Multiple Records"),
   //                text: L(
   //                   "ab.massDelete.description",
   //                   "*Are you sure you want to delete the selected records?"
   //                ),
   //                callback: function (result) {
   //                   if (result) {
   //                      async.parallel(deleteTasks, function (err) {
   //                         if (err) {
   //                            // TODO : Error message
   //                         } else {
   //                            // Anything we need to do after we are done.
   //                            _logic.disableUpdateDelete();
   //                         }
   //                      });
   //                   }
   //                },
   //             });
   //          } else {
   //             App.AB.Dialog.Alert({
   //                title: L("key.no.records.selected", "No Records Selected"),
   //                text: L(
   //                   "key.select.one",
   //                   "You need to select at least one record...did you drink your coffee today?"
   //                ),
   //             });
   //          }
   //       },

   //       toolbarFilter: ($view) => {
   //          filterUI.showPopup($view);
   //       },

   //       toolbarSort: ($view) => {
   //          PopupSortDataTableComponent.show($view);
   //       },

   //       toolbarExport: ($view) => {
   //          exportPopup.show($view);
   //       },

   //       toolbarMassUpdate: function ($view) {
   //          PopupMassUpdateComponent.show($view);
   //       },
   //    };

   //    var _onShow = () => {
   //       baseCom.onShow();

   //       if ($$(DataTable.ui.id)) {
   //          $$(DataTable.ui.id).adjust();
   //       }

   //       var dv = this.datacollection;
   //       if (dv) {
   //          this.eventAdd({
   //             emitter: dv,
   //             eventName: "changeCursor",
   //             listener: _logic.selectRow,
   //          });
   //       }
   //    };

   //    return {
   //       ui: tableUI,
   //       init: _init,
   //       logic: _logic,

   //       onShow: _onShow,
   //    };
   // }

   component(v1App = false) {
      var component = new ABViewGridComponent(this);

      // if this is our v1Interface
      if (v1App) {
         var newComponent = component;
         component = {
            ui: component.ui(),
            init: (options, accessLevel) => {
               return newComponent.init(this.AB, accessLevel);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
      }

      return component;
   }

   populateEditor(ids, view) {
      // Pull data collections to options
      var objectOptions = view.propertyDatacollections();
      $$(ids.datacollection).define("options", objectOptions);
      $$(ids.datacollection).refresh();
      if (view.settings.datacollection != "") {
         $$(ids.datacollection).setValue(view.settings.dataviewID);
         // $$(ids.linkedObject).show();
      } else {
         $$(ids.datacollection).setValue("");
         // $$(ids.linkedObject).hide();
      }

      // Grouping options
      let groupFields = [];
      let dv = this.datacollection;
      if (dv && dv.datasource) {
         dv.datasource
            .fields((f) => {
               return (
                  !f.isConnection &&
                  view.settings.hiddenFields.indexOf(f.columnName) < 0
               );
            })
            .forEach((f) => {
               groupFields.push({
                  id: f.columnName,
                  value: f.label,
               });
            });
      }
      $$(ids.groupBy).define("options", groupFields);
      $$(ids.groupBy).refresh();

      this.propertyGroupByList(ids, view.settings.groupBy);
   }

   populatePopupEditors(view, dataSource) {
      var dv = this.datacollection;
      if (!dv) return;

      let object = dv.datasource;
      if (!object) return;

      PopupHideFieldComponent.objectLoad(object);
      PopupHideFieldComponent.setValue(view.settings.hiddenFields || []);
      PopupHideFieldComponent.setFrozenColumnID(
         view.settings.frozenColumnID || ""
      );
      PopupFrozenColumnsComponent.objectLoad(object);
      PopupFrozenColumnsComponent.setValue(view.settings.frozenColumnID || "");
      PopupFrozenColumnsComponent.setHiddenFields(
         view.settings.hiddenFields || []
      );

      PopupFilterProperty.objectLoad(object);
      PopupFilterProperty.setSettings(view.settings.gridFilter);

      PopupSummaryColumnsComponent.objectLoad(object, view);
      PopupSummaryColumnsComponent.setValue(view.settings.summaryColumns || []);

      PopupCountColumnsComponent.objectLoad(object, view);
      PopupCountColumnsComponent.setValue(view.settings.countColumns || []);
   }

   populateBadgeNumber(ids, view) {
      // set badge numbers to setting buttons
      if (view.settings.hiddenFields) {
         $$(ids.buttonFieldsVisible).define(
            "badge",
            view.settings.hiddenFields.length || null
         );
         $$(ids.buttonFieldsVisible).refresh();
      } else {
         $$(ids.buttonFieldsVisible).define("badge", null);
         $$(ids.buttonFieldsVisible).refresh();
      }

      if (view.settings.gridFilter && view.settings.gridFilter.filterOption) {
         $$(ids.buttonFilterData).define("badge", "Y");
         $$(ids.buttonFilterData).refresh();
      } else {
         $$(ids.buttonFilterData).define("badge", null);
         $$(ids.buttonFilterData).refresh();
      }

      if (view.settings && view.settings.frozenColumnID) {
         $$(ids.buttonFieldsFreeze).define("badge", "Y");
         $$(ids.buttonFieldsFreeze).refresh();
      } else {
         $$(ids.buttonFieldsFreeze).define("badge", null);
         $$(ids.buttonFieldsFreeze).refresh();
      }

      if (view.settings && view.settings.summaryColumns) {
         $$(ids.buttonSummaryFields).define(
            "badge",
            view.settings.summaryColumns.length || null
         );
         $$(ids.buttonSummaryFields).refresh();
      } else {
         $$(ids.buttonSummaryFields).define("badge", null);
         $$(ids.buttonSummaryFields).refresh();
      }

      if (view.settings && view.settings.countColumns) {
         $$(ids.buttonCountFields).define(
            "badge",
            view.settings.countColumns.length || null
         );
         $$(ids.buttonCountFields).refresh();
      } else {
         $$(ids.buttonCountFields).define("badge", null);
         $$(ids.buttonCountFields).refresh();
      }
   }

   get filterHelper() {
      if (this.__filterHelper == null) {
         this.__filterHelper = new ABViewGridFilter(
            this.AB,
            `${this.id}_filterHelper`
         );
      }

      return this.__filterHelper;
   }

   get linkPageHelper() {
      if (this.__linkPageHelper == null)
         this.__linkPageHelper = new ABViewPropertyLinkPage();

      return this.__linkPageHelper;
   }
}
