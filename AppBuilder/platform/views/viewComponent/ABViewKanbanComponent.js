const ABViewComponent = require("./ABViewComponent").default;
const ABFormSidePanel = require("../ABViewKanbanFormSidePanel");

module.exports = class ABViewKanbanComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewKanBan_${baseView.id}`,
         Object.assign(
            {
               kanbanView: "",

               kanban: "",
               resizer: "",
               formSidePanel: "",
            },
            ids
         )
      );

      this.FormSide = new ABFormSidePanel(
         this,
         this.ids.formSidePanel,
         this.settings.editFields
      );

      this.CurrentVerticalField = null;
      this.CurrentHorizontalField = null;
      this.CurrentOwnerField = null;

      this.TextTemplate = baseView.TextTemplate;

      this._updatingOwnerRowId = null;
      this._ABFieldConnect = null;
      this._ABFieldUser = null;
      this._ABFieldList = null;
   }

   get ABFieldConnect() {
      return (this._ABFieldConnect =
         this._ABFieldConnect ||
         this.AB.Class.ABFieldManager.fieldByKey("connectObject"));
   }

   get ABFieldUser() {
      return (this._ABFieldUser =
         this._ABFieldUser || this.AB.Class.ABFieldManager.fieldByKey("user"));
   }

   get ABFieldList() {
      return (this._ABFieldList =
         this._ABFieldList || this.AB.Class.ABFieldManager.fieldByKey("list"));
   }

   ui() {
      const ids = this.ids;
      const self = this;
      const _ui = super.ui([
         {
            id: ids.kanbanView,
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
                           // get this row id from onAvatarClick event
                           if (!self._updatingOwnerRowId) return;

                           const userId = this.getSelectedId(false);
                           if (!userId) return;

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

                        const $resizer = $$(ids.resizer);

                        if (itemId) {
                           const data = $$(ids.kanban).getItem(itemId);

                           this.FormSide.show(data);

                           $resizer?.show();
                        } else {
                           this.FormSide.hide();

                           $resizer?.hide();
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
         },
      ]);

      delete _ui.type;

      return _ui;
   }

   async init(AB) {
      await super.init(AB);

      const abWebix = this.AB.Webix;

      if (this.$kb) abWebix.extend(this.$kb, abWebix.ProgressBar);

      this.FormSide.init(AB);
      this.FormSide.on("add", (newVals) => {
         this.saveData(newVals);
      });
      this.FormSide.on("update", (updateVals) => {
         this.saveData(updateVals);
      });

      let dc = this.view.datacollection;
      if (dc) this.datacollectionLoad(dc);

      this.show();
   }

   get $kb() {
      return (this._kb = this._kb || $$(this.ids.kanban));
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
            )
               return this.CurrentOwnerField.format(obj);
            else return "<span class='webix_icon fa fa-user'></span>";
         },
         // template for item body
         // show item image and text
         templateBody: (data) => {
            if (!this.settings.template)
               return this.CurrentObject?.displayData(data);

            // return our default text template
            return this.TextTemplate.displayText(data);
         },
      };
   }

   /**
    * @function hide()
    *
    * hide this component.
    */
   hide() {
      $$(this.ids.kanbanView)?.hide();
   }

   /**
    * @function show()
    * Show this component.
    */
   async show() {
      const ids = this.ids;

      $$(ids.kanbanView)?.show();

      this.FormSide.hide();

      $$(ids.resizer)?.hide();

      var CurrentObject = this.CurrentObject;
      if (!CurrentObject) {
         CurrentObject = this.datacollection?.datasource;
      }
      if (!CurrentObject) return;

      // Get vertical grouping field and populate to kanban list
      // NOTE: this field should be the select list type
      const CurrentVerticalField = CurrentObject.fieldByID(
         this.settings.verticalGroupingField
      );
      if (!CurrentVerticalField) return;

      this.CurrentVerticalField = CurrentVerticalField;

      let horizontalOptions = [];

      const CurrentHorizontalField = CurrentObject.fieldByID(
         this.settings.horizontalGroupingField
      );

      this.CurrentHorizontalField = CurrentHorizontalField;

      if (
         CurrentHorizontalField &&
         CurrentHorizontalField instanceof this.ABFieldConnect
      )
         // Pull horizontal options
         horizontalOptions = await CurrentHorizontalField.getOptions();

      // Option format -  { id: "1543563751920", text: "Normal", hex: "#4CAF50" }
      const verticalOptions = (CurrentVerticalField.settings.options || []).map(
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
               if (CurrentHorizontalField instanceof this.ABFieldList) {
                  // make a copy of the settings.
                  horizontalVals = (
                     CurrentHorizontalField.settings.options || []
                  ).map((o) => o);
               } else if (CurrentHorizontalField instanceof this.ABFieldUser) {
                  horizontalVals = CurrentHorizontalField.getUsers().map(
                     (u) => {
                        return {
                           id: u.id,
                           text: u.text || u.value,
                        };
                     }
                  );
               } else if (CurrentHorizontalField instanceof this.ABFieldConnect)
                  horizontalVals = horizontalOptions.map(({ id, text }) => ({
                     id,
                     text,
                  }));

               horizontalVals.push({
                  id: null,
                  text: this.label("Other"),
               });

               horizontalVals.forEach((val) => {
                  const statusOps = {};

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
               const statusOps = {};

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

      const ab = this.AB;
      const abWebix = ab.Webix;

      // Rebuild kanban that contains options
      // NOTE: webix kanban does not support dynamic vertical list
      abWebix.ui(verticalOptions, $$(ids.kanban));
      $$(ids.kanban).reconstruct();

      // Owner field
      const CurrentOwnerField = CurrentObject.fieldByID(
         this.settings.ownerField
      );

      this.CurrentOwnerField = CurrentOwnerField;

      if (CurrentOwnerField) {
         const $menuUser = $$(ids.kanban).getUserList();

         $menuUser.clearAll();

         if (CurrentOwnerField instanceof this.ABFieldUser) {
            const users = ab.Account.userList().map((u) => {
               return {
                  id: u.username,
                  value: u.username,
               };
            });

            $menuUser.parse(users);
         } else if (CurrentOwnerField instanceof this.ABFieldConnect) {
            const options = await CurrentOwnerField.getOptions();

            try {
               $menuUser.parse(
                  options.map((opt) => {
                     return {
                        id: opt.id,
                        value: opt.text,
                     };
                  })
               );
            } catch (e) {
               // TODO: remove this.  Trying to catch a random webix error:
               // Cannot read properties of null (reading 'driver')
               console.error(e);
               console.warn(options);
            }
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
      super.objectLoad(object);

      this.TextTemplate.objectLoad(object);
      this.FormSide.objectLoad(object);
   }

   /**
    * @method datacollectionLoad
    *
    * @param datacollection {ABDatacollection}
    */
   datacollectionLoad(datacollection) {
      super.datacollectionLoad(datacollection);

      const DC = this.CurrentDatacollection || datacollection;

      if (DC) {
         DC.bind(this.$kb);

         const obj = DC.datasource;

         if (obj) this.objectLoad(obj);

         return;
      }

      this.$kb.unbind();
   }

   async updateStatus(rowId, status) {
      if (!this.CurrentVerticalField) return;

      // Show loading cursor
      this.busy();

      let patch = {};

      // update multi-values
      if (status instanceof Object) patch = status;
      // update single value
      else patch[this.CurrentVerticalField.columnName] = status;

      // update empty value
      let needRefresh = false;

      for (const key in patch)
         if (!patch[key]) {
            patch[key] = "";

            // WORKAROUND: if update data is empty, then it will need to refresh
            // the kanban after update
            needRefresh = true;
         }

      try {
         await this.CurrentObject?.model().update(rowId, patch);

         this.ready();

         if (needRefresh) this.show();

         // update form data
         if (this.FormSide.isVisible()) {
            const data = $$(this.ids.kanban).getItem(rowId);

            this.FormSide.refresh(data);
         }
      } catch (err) {
         this.AB.notify.developer(err, {
            context: "ABViewKanban:updateStatus(): Error saving item:",
            rowId,
            patch,
         });
      }
   }

   async updateOwner(rowId, val) {
      if (!this.CurrentOwnerField) return;

      // Show loading cursor
      this.busy();

      const patch = {};

      patch[this.CurrentOwnerField.columnName] = val;

      try {
         const updatedRow = await this.CurrentObject?.model().update(
            rowId,
            patch
         );

         // update card
         this.$kb?.updateItem(rowId, updatedRow);

         // update form data
         if (this.FormSide.isVisible()) {
            const data = this.$kb.getItem(rowId);

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
      if (data.id && this.$kb.exists(data.id))
         this.$kb.updateItem(data.id, data);
      // insert
      else this.$kb.add(data);
   }

   unselect() {
      if (this.$kb)
         this.$kb.eachList((list /*, status*/) => {
            list?.unselect?.();
         });
   }

   addCard() {
      this.unselect();

      // show the side form
      this.FormSide.show();
      $$(this.ids.resizer).show();
   }

   async removeCard(rowId) {
      const ab = this.AB;
      const abWebix = ab.Webix;

      abWebix.confirm({
         title: this.label("Remove card"),
         text: this.label("Do you want to delete this card?"),
         callback: async (result) => {
            if (!result) return;

            this.busy();

            try {
               const response = await this.CurrentObject?.model().delete(rowId);

               if (response.numRows > 0) {
                  this.$kb.remove(rowId);
               } else {
                  abWebix.alert({
                     text: this.label(
                        "No rows were effected. This does not seem right."
                     ),
                  });
               }
            } catch (err) {
               ab.notify.developer(err, {
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
};
