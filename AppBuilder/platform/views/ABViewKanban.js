const ABViewKanbanCore = require("../../core/views/ABViewKanbanCore");
import ABViewComponent from "./ABViewComponent";

const ABWorkspaceKanban = require("../../../ABDesigner/ab_work_object_workspace_kanban");
const ABWorkspaceViewKanban = require("../workspaceViews/ABObjectWorkspaceViewKanban");

const ABViewPropertyLinkPage = require("./viewProperties/ABViewPropertyLinkPage");

const ABFormSidePanel = require("./ABViewKanbanFormSidePanel");

var L = null;
// multilingual Label fn()

var ABFieldConnect = null;
var ABFieldUser = null;
var ABFieldList = null;

class ABViewKanBanComponent extends ABViewComponent {
   constructor(viewKanBan, idBase) {
      var base = idBase || `ABViewKanBan_${viewKanBan.id}`;

      super(base, {
         // component: "",
         kanban: "",
         resizer: "",
      });

      this.viewKanBan = viewKanBan;
      this.AB = viewKanBan.AB;

      this.settings = viewKanBan.settings;

      this.FormSide = new ABFormSidePanel(this, `${base}_formSidePanel`);

      this.CurrentObjectID = null;
      // {string}
      // the ABObject.id of the object we are working with.

      this.CurrentDatacollectionID = null;
      // {string}
      // the ABDataCollection.id of the DC we are working with

      this.CurrentVerticalField = null;
      this.CurrentHorizontalField = null;
      this.CurrentOwnerField = null;

      this._updatingOwnerRowId = null;

      if (!L) {
         L = (...params) => {
            return this.AB.Multilingual.label(...params);
         };

         ABFieldConnect = this.AB.Class.ABFieldManager.fieldByKey(
            "connectObject"
         );
         ABFieldUser = this.AB.Class.ABFieldManager.fieldByKey("user");
         ABFieldList = this.AB.Class.ABFieldManager.fieldByKey("list");
      }
   }

   ui() {
      var ids = this.ids;
      var self = this;

      return {
         id: ids.component,
         cols: [
            {
               id: ids.kanban,
               view: "kanban",
               cols: [],
               userList: {
                  view: "menu",
                  // yCount: 8,
                  // scroll: false,
                  template: '<i class="fa fa-user"></i> #value#',
                  width: 150,
                  on: {
                     onSelectChange: function () {
                        if (self._updatingOwnerRowId == null)
                           // get this row id from onAvatarClick event
                           return;

                        let userId = this.getSelectedId(false);
                        if (userId == null) return;

                        self.updateOwner(self._updatingOwnerRowId, userId);
                     },
                  },
               },
               editor: false, // we use side bar
               users: [],
               tags: [],
               data: [],
               on: {
                  onListAfterSelect: (itemId, list) => {
                     this.CurrentDatacollection?.setCursor(itemId);
                     this.emit("select", itemId);

                     if (itemId) {
                        let data = $$(ids.kanban).getItem(itemId);
                        this.FormSide.show(data);

                        $$(ids.resizer)?.show();
                     } else {
                        this.FormSide.hide();

                        $$(ids.resizer)?.hide();
                     }
                  },
                  onAfterStatusChange: (rowId, status /*, list */) => {
                     this.updateStatus(rowId, status);
                  },
                  onAvatarClick: (rowId /*, ev, node, list */) => {
                     // keep this row id for update owner data in .userList
                     this._updatingOwnerRowId = rowId;
                  },
               },
            },
            {
               id: ids.resizer,
               view: "resizer",
               css: "bg_gray",
               width: 11,
               hidden: true,
            },
            this.FormSide.ui(),
         ],
      };
   }

   init(AB) {
      this.AB = AB;

      if (this.$kb) webix.extend(this.$kb, webix.ProgressBar);

      this.FormSide.init(AB);
      this.FormSide.on("add", (newVals) => {
         this.saveData(newVals);
      });
      this.FormSide.on("update", (updateVals) => {
         this.saveData(updateVals);
      });
   }

   get $kb() {
      if (!this._kb) {
         this._kb = $$(this.ids.kanban);
      }
      return this._kb;
   }

   /**
    * @method CurrentObject()
    * A helper to return the current ABObject we are working with.
    * @return {ABObject}
    */
   get CurrentObject() {
      return this.AB.objectByID(this.CurrentObjectID);
   }
   /**
    * @method CurrentDatacollection()
    * A helper to return the current ABDataCollection we are working with.
    * @return {ABDataCollection}
    */
   get CurrentDatacollection() {
      return this.AB.datacollectionByID(this.CurrentDatacollectionID);
   }

   kanbanListTemplate() {
      return {
         icons: [
            // { icon: "mdi mdi-comment", show: function (obj) { return !!obj.comments }, template: "#comments.length#" },
            {
               icon: "fa fa-trash-o",
               click: (rowId /*, e */) => {
                  this.removeCard(rowId);
               },
            },
         ],
         // avatar template
         templateAvatar: (obj) => {
            if (
               this.CurrentOwnerField &&
               obj[this.CurrentOwnerField.columnName]
            ) {
               return this.CurrentOwnerField.format(obj);
            } else {
               return "<span class='webix_icon fa fa-user'></span>";
            }
         },
         // template for item body
         // show item image and text
         templateBody: (data) => {
            return this.CurrentObject?.displayData(data);

            // var html = "";
            // if (obj.image)
            //    html += "<img class='image' src='../common/imgs/attachments/" + obj.image + "'/>";
            // html += "<div>" + obj.text + "</div>";
            // return html;
         },
      };
   }

   /**
    * @function hide()
    *
    * hide this component.
    */
   hide() {
      $$(this.ids.component)?.hide();
   }

   /**
    * @function show()
    * Show this component.
    */
   async show() {
      var ids = this.ids;
      $$(ids.component)?.show();

      this.FormSide.hide();

      $$(ids.resizer)?.hide();

      var CurrentObject = this.CurrentObject;
      if (!CurrentObject) return;

      // Get vertical grouping field and populate to kanban list
      // NOTE: this field should be the select list type
      // CurrentVerticalField = _logic.getVerticalGroupingField();
      var CurrentVerticalField = CurrentObject.fieldByID(
         this.settings.verticalGroupingField
      );
      if (!CurrentVerticalField) return;
      this.CurrentVerticalField = CurrentVerticalField;

      let horizontalOptions = [];
      var CurrentHorizontalField = CurrentObject.fieldByID(
         this.settings.horizontalGroupingField
      );
      this.CurrentHorizontalField = CurrentHorizontalField;

      if (
         CurrentHorizontalField &&
         CurrentHorizontalField instanceof ABFieldConnect
      ) {
         // Pull horizontal options
         horizontalOptions = await CurrentHorizontalField.getOptions();
      }

      // Option format -  { id: "1543563751920", text: "Normal", hex: "#4CAF50" }
      let verticalOptions = (CurrentVerticalField.settings.options || []).map(
         (opt) => {
            // Vertical & Horizontal fields
            if (CurrentVerticalField && CurrentHorizontalField) {
               let rows = [],
                  // [{
                  //    id: '',
                  //    text: ''
                  // }]
                  horizontalVals = [];

               // pull options of the Horizontal field
               if (CurrentHorizontalField instanceof ABFieldList) {
                  // make a copy of the settings.
                  horizontalVals = (
                     CurrentHorizontalField.settings.options || []
                  ).map((o) => o);
               } else if (CurrentHorizontalField instanceof ABFieldUser) {
                  horizontalVals = CurrentHorizontalField.getUsers().map(
                     (u) => {
                        return {
                           id: u.id,
                           text: u.text || u.value,
                        };
                     }
                  );
               } else if (CurrentHorizontalField instanceof ABFieldConnect) {
                  horizontalVals = horizontalOptions.map(({ id, text }) => ({
                     id,
                     text,
                  }));
               }

               horizontalVals.push({
                  id: null,
                  text: L("Other"),
               });

               horizontalVals.forEach((val) => {
                  let statusOps = {};
                  statusOps[CurrentVerticalField.columnName] = opt.id;
                  statusOps[CurrentHorizontalField.columnName] = val.id;

                  // Header
                  rows.push({
                     template: val.text,
                     height: 20,
                     css: "progress_header",
                  });

                  // Kanban list
                  rows.push({
                     view: "kanbanlist",
                     status: statusOps,
                     type: this.kanbanListTemplate(),
                  });
               });

               return {
                  header: opt.text,
                  body: {
                     margin: 0,
                     rows: rows,
                  },
               };
            }
            // Vertical field only
            else if (CurrentVerticalField) {
               let statusOps = {};
               statusOps[CurrentVerticalField.columnName] = opt.id;

               return {
                  header: opt.text,
                  body: {
                     view: "kanbanlist",
                     status: statusOps,
                     type: this.kanbanListTemplate(),
                  },
               };
            }
         }
      );

      // Rebuild kanban that contains options
      // NOTE: webix kanban does not support dynamic vertical list
      webix.ui(verticalOptions, $$(ids.kanban));
      $$(ids.kanban).reconstruct();

      // Owner field
      var CurrentOwnerField = CurrentObject.fieldByID(this.settings.ownerField);
      this.CurrentOwnerField = CurrentOwnerField;
      if (CurrentOwnerField) {
         let $menuUser = $$(ids.kanban).getUserList();
         $menuUser.clearAll();

         if (CurrentOwnerField instanceof ABFieldUser) {
            let users = this.AB.Account.userlist().map((u) => {
               return {
                  id: u.username,
                  value: u.username,
               };
            });

            $menuUser.parse(users);
         } else if (CurrentOwnerField instanceof ABFieldConnect) {
            let options = await CurrentOwnerField.getOptions();

            $menuUser.parse(
               options.map((opt) => {
                  return {
                     id: opt.id,
                     value: opt.text,
                  };
               })
            );
         }
      }
   }

   busy() {
      this.$kb?.showProgress?.({ type: "icon" });
   }

   ready() {
      this.$kb?.hideProgress?.();
   }

   objectLoad(object) {
      this.CurrentObjectID = object.id;

      this.FormSide.objectLoad(object);
   }

   /**
    * @method datacollectionLoad
    *
    * @param datacollection {ABDatacollection}
    */
   datacollectionLoad(datacollection) {
      this.CurrentDatacollectionID = datacollection.id;

      var DC = this.CurrentDatacollection;
      if (DC) DC.bind(this.$kb);
      else if (datacollection) datacollection.bind(this.$kb);
      else this.$kb.unbind();

      var obj = datacollection.datasource;
      if (obj) this.objectLoad(obj);
   }

   async updateStatus(rowId, status) {
      if (!this.CurrentVerticalField) return;

      // Show loading cursor
      this.busy();

      let patch = {};

      // update multi-values
      if (status instanceof Object) {
         patch = status;
      }
      // update single value
      else {
         patch[this.CurrentVerticalField.columnName] = status;
      }

      // update empty value
      let needRefresh = false;
      for (let key in patch) {
         if (patch[key] == null) {
            patch[key] = "";

            // WORKAROUND: if update data is empty, then it will need to refresh the kanban after update
            needRefresh = true;
         }
      }

      try {
         await this.CurrentObject?.model().update(rowId, patch);

         this.ready();

         if (needRefresh) this.show();

         // update form data
         if (this.FormSide.isVisible()) {
            let data = $$(ids.kanban).getItem(rowId);
            this.FormSide.refresh(data);
         }
      } catch (err) {
         this.AB.notify.developer(err, {
            context: "ABViewKanban:updateStatus(): Error saving item:",
            rowId,
            patch,
         });
         this.ready();
      }
   }

   async updateOwner(rowId, val) {
      if (!this.CurrentOwnerField) return;

      // Show loading cursor
      this.busy();

      let patch = {};
      patch[this.CurrentOwnerField.columnName] = val;

      try {
         let updatedRow = await this.CurrentObject?.model().update(
            rowId,
            patch
         );

         // update card
         this.$kb?.updateItem(rowId, updatedRow);

         // update form data
         if (this.FormSide.isVisible()) {
            let data = this.$kb.getItem(rowId);
            this.FormSide.refresh(data);
         }

         this.ready();
      } catch (err) {
         this.AB.notify.developer(err, {
            context: "ABViewKanban:updateOwner(): Error saving item:",
            rowId,
            val,
         });

         this.ready();
      }
   }

   saveData(data) {
      // update
      if (data.id && this.$kb.exists(data.id)) {
         this.$kb.updateItem(data.id, data);
      }
      // insert
      else {
         this.$kb.add(data);
      }
   }

   unselect() {
      if (this.$kb) {
         this.$kb.eachList(function (list /*, status*/) {
            list?.unselect?.();
         });
      }
   }

   addCard() {
      this.unselect();

      // show the side form
      this.FormSide.show();
      $$(this.ids.resizer).show();
   }

   async removeCard(rowId) {
      webix.confirm({
         title: L("Remove card"),
         text: L("Do you want to delete this card?"),
         callback: async (result) => {
            if (!result) return;

            this.busy();

            try {
               let response = await this.CurrentObject?.model().delete(rowId);

               if (response.numRows > 0) {
                  this.$kb.remove(rowId);
               } else {
                  webix.alert({
                     text: L(
                        "No rows were effected. This does not seem right."
                     ),
                  });
               }
            } catch (err) {
               this.AB.notify.developer(err, {
                  message: "ABViewKanban:removeCard(): Error deleting item:",
                  rowId,
               });
            }
            this.ready();
         },
      });
   }

   /**
    * @method setFields()
    * Save the current view options.
    * @param options - {
    *       verticalGrouping:    {ABField} - required
    *       horizontalGrouping:  {ABField} - optional
    *       ownerField:          {ABField} - optional
    * }
    */
   setFields(options) {
      this.CurrentVerticalField = options.verticalGrouping;
      this.CurrentHorizontalField = options.horizontalGrouping;
      this.CurrentOwnerField = options.ownerField;
   }
}

export default class ABViewKanban extends ABViewKanbanCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   //
   //	Editor Related
   //

   /**
    * @method editorComponent
    * return the Editor for this UI component.
    * the editor should display either a "block" view or "preview" of
    * the current layout of the view.
    * @param {string} mode what mode are we in ['block', 'preview']
    * @return {Component}
    */
   editorComponent(App, mode) {
      var idBase = "ABViewKanbanEditorComponent";

      var Kanban = this.component(App, idBase);

      return {
         ui: Kanban.ui,
         logic: Kanban.logic,
         onShow: Kanban.onShow,

         init: () => {
            // remove id of the component in caching for refresh .bind of the data collection
            let dv = this.datacollection;
            if (dv) dv.removeComponent(Kanban.ui.id);

            Kanban.init();
         },
      };
   }

   //
   // Property Editor
   //

   static propertyEditorDefaultElements(App, ids, _logic, ObjectDefaults) {
      let commonUI = super.propertyEditorDefaultElements(
         App,
         ids,
         _logic,
         ObjectDefaults
      );
      let idBase = "ABViewKanbanPropertyEditor";

      if (this._kanbanViewComponent == null)
         this._kanbanViewComponent = ABWorkspaceViewKanban.component(
            App,
            idBase
         );

      if (this._linkPageComponent == null)
         this._linkPageComponent = ABViewPropertyLinkPage.propertyComponent(
            App,
            `${idBase}_gridlinkpage`
         );

      // _logic functions

      _logic.selectSource = (dcId, oldDcId) => {
         var currView = _logic.currentEditObject();

         // Update field options in property
         this.propertyUpdateFieldOptions(ids, currView, dcId);
      };

      return commonUI.concat([
         {
            view: "fieldset",
            label: L("Kanban Data:"),
            labelWidth: this.AB.UISettings.config().labelWidthLarge,
            body: {
               type: "clean",
               padding: 10,
               rows: [
                  {
                     name: "datacollection",
                     view: "select",
                     label: L("Data Source"),
                     labelWidth: this.AB.UISettings.config().labelWidthXLarge,
                     value: null,
                     on: {
                        onChange: _logic.selectSource,
                     },
                  },
                  {
                     name: "vGroup",
                     view: "select",
                     label: L("Vertical Grouping"),
                     placeholder: L("Select a field"),
                     labelWidth: this.AB.UISettings.config().labelWidthXLarge,
                     options: [],
                  },
                  {
                     name: "hGroup",
                     view: "select",
                     label: L("Horizontal Grouping"),
                     placeholder: L("Select a field"),
                     labelWidth: this.AB.UISettings.config().labelWidthXLarge,
                     options: [],
                  },
                  {
                     name: "owner",
                     view: "select",
                     label: L("Card Owner"),
                     placeholder: L("Select a user field"),
                     labelWidth: this.AB.UISettings.config().labelWidthXLarge,
                     options: [],
                  },
               ],
            },
         },
         this._linkPageComponent.ui,
      ]);
   }

   /**
    * @method propertyUpdateFieldOptions
    * Populate fields of object to select list in property
    *
    * @param {Object} ids
    * @param {ABViewForm} view - the current component
    * @param {string} dvId - id of ABDatacollection
    */
   static propertyUpdateFieldOptions(ids, view, dvId) {
      let datacollection = view.AB.datacollectionByID(dvId);
      let object = datacollection ? datacollection.datasource : null;

      // Refresh options of fields by call ABObjectWorkspaceViewKanban's function
      if (this._kanbanViewComponent) {
         this._kanbanViewComponent.logic.refreshOptions(
            object,
            view ? view.settings : null,
            {
               vGroupInput: $$(ids.vGroup),
               hGroupInput: $$(ids.hGroup),
               ownerInput: $$(ids.owner),
            }
         );
      }
   }

   static propertyEditorPopulate(App, ids, view) {
      super.propertyEditorPopulate(App, ids, view);

      let datacollectionId = view.settings.dataviewID
         ? view.settings.dataviewID
         : null;
      let SourceSelector = $$(ids.datacollection);

      // Pull data collections to options
      let dcOptions = view.propertyDatacollections(
         (dc) => dc.settings && !dc.settings.isQuery
      );
      SourceSelector.define("options", dcOptions);
      SourceSelector.define("value", datacollectionId);
      SourceSelector.refresh();

      this.propertyUpdateFieldOptions(ids, view, datacollectionId);

      $$(ids.vGroup).setValue(view.settings.verticalGroupingField);
      $$(ids.hGroup).setValue(view.settings.horizontalGroupingField);
      $$(ids.owner).setValue(view.settings.ownerField);

      this._linkPageComponent.viewLoad(view);
      this._linkPageComponent.setSettings(view.settings);
   }

   static propertyEditorValues(ids, view) {
      super.propertyEditorValues(ids, view);

      view.settings.dataviewID = $$(ids.datacollection).getValue();
      view.settings.verticalGroupingField = $$(ids.vGroup).getValue() || null;
      view.settings.horizontalGroupingField = $$(ids.hGroup).getValue() || null;
      view.settings.ownerField = $$(ids.owner).getValue() || null;

      // link pages
      let linkSettings = this._linkPageComponent.getSettings();
      for (let key in linkSettings) {
         view.settings[key] = linkSettings[key];
      }
   }

   ///// LEFT OFF HERE:

   component(v1App = false) {
      var component = new ABViewKanBanComponent(this);

      // if this is our v1Interface
      if (v1App) {
         var newComponent = component;
         component = {
            ui: component.ui(),
            init: (options, accessLevel) => {
               return newComponent.init(this.AB);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
      }

      return component;
   }

   componentOld(App, idBase) {
      let baseCom = super.component(App);

      idBase = idBase || `ABViewKanban_${this.id}`;

      // let ids = {
      // 	component: App.unique(idBase + '_component')
      // }

      // let labels = {
      // 	common: App.labels
      // };

      let Kanban = new ABWorkspaceKanban(App, idBase);
      let LinkPage = this.linkPageHelper.component(
         App,
         `${idBase}_kanbanlinkpage`
      );
      let datacollection = this.datacollection;

      // Show empty data source UI
      let kanbanUI = {
         type: "space",
         rows: [
            {
               view: "label",
               label: L("Select an object to load."),
               inputWidth: 200,
               align: "center",
            },
            {},
         ],
      };

      if (datacollection) {
         kanbanUI = Kanban.ui.cols[0];
      }

      let _init = () => {
         Kanban.init({
            onSelect: _logic.onSelect,
         });

         if (datacollection) {
            Kanban.datacollectionLoad(datacollection);

            // set fields
            let fieldSettings = {};
            let object = datacollection.datasource;
            if (object) {
               Kanban.objectLoad(object);

               let verticalGrouping = object.fieldByID(
                  this.settings.verticalGroupingField
               );
               if (verticalGrouping)
                  fieldSettings.verticalGrouping = verticalGrouping;

               let horizontalGrouping = object.fieldByID(
                  this.settings.horizontalGroupingField
               );
               if (horizontalGrouping)
                  fieldSettings.horizontalGrouping = horizontalGrouping;

               let ownerField = object.fieldByID(this.settings.ownerField);
               if (ownerField) fieldSettings.ownerField = ownerField;
            }

            Kanban.setFields(fieldSettings);
         }

         // link page helper
         LinkPage.init({
            view: this,
            datacollection: datacollection,
         });
      };

      // our internal business logic
      let _logic = {
         onSelect: (itemId) => {
            let page;
            if (this.settings.editPage) page = this.settings.editPage;
            else if (this.settings.detailsPage)
               page = this.settings.detailsPage;

            if (!page) return;

            // Pass settings to link page module
            if (LinkPage) {
               LinkPage.changePage(page, itemId);
            }

            super.changePage(page);
         },
      };

      let _onShow = () => {
         baseCom.onShow();

         Kanban.show();
      };

      return {
         ui: kanbanUI,
         init: _init,
         logic: _logic,

         onShow: _onShow,
      };
   }

   get linkPageHelper() {
      if (this.__linkPageHelper == null)
         this.__linkPageHelper = new ABViewPropertyLinkPage();

      return this.__linkPageHelper;
   }
}
