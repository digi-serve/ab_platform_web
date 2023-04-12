/*
 * ABViewKanbanFormSidePanel
 *
 * Provide a form area for editing data in the Kan Ban view.
 *
 */

const ABViewComponent = require("./viewComponent/ABViewComponent").default;
const ABViewForm = require("./ABViewForm");
const ABViewFormButton = require("./ABViewFormButton");

var L = null;
// multilingual Label fn()

module.exports = class ABWorkObjectKanBan extends ABViewComponent {
   constructor(comKanBan, idBase, editFields) {
      idBase = idBase || `${comKanBan.view?.id}_formSidePanel`;
      super(idBase, {
         form: "",
      });

      if (!L) {
         L = (...params) => {
            return this.AB.Multilingual.label(...params);
         };
      }

      this.AB = comKanBan.AB;

      this.CurrentObjectID = null;
      // {string}
      // the ABObject.id of the object we are working with.

      this.editFields = editFields;
      // {array}
      // An array of {ABField.id} that determines which fields should show up
      // in the editor.

      this._mockApp = this.AB.applicationNew({});
      // {ABApplication}
      // Any ABViews we create are expected to be in relation to
      // an ABApplication, so we create a "mock" app for our
      // workspace views to use to display.
   }

   /**
    * @method CurrentObject()
    * A helper to return the current ABObject we are working with.
    * @return {ABObject}
    */
   get CurrentObject() {
      return this.AB.objectByID(this.CurrentObjectID);
   }

   ui() {
      var ids = this.ids;

      // Our webix UI definition:
      return {
         id: ids.component,
         width: 300,
         hidden: true,
         rows: [
            {
               view: "toolbar",
               css: "webix_dark",
               cols: [
                  {
                     view: "label",
                     label: L("Edit Record"),
                  },
                  {
                     view: "icon",
                     icon: "wxi-close",
                     align: "right",
                     click: (/* id */) => {
                        this.hide();
                     },
                  },
               ],
            },
            {
               view: "scrollview",
               body: {
                  rows: [
                     {
                        id: ids.form,
                        view: "form",
                        borderless: true,
                        rows: [],
                     },
                  ],
               },
            },
         ],
      };
   }

   async init(AB) {
      this.AB = AB;
   }

   /**
    * @method CurrentObject()
    * A helper to return the current ABObject we are working with.
    * @return {ABObject}
    */
   get CurrentObject() {
      return this.AB.objectByID(this.CurrentObjectID);
   }

   objectLoad(object) {
      this.CurrentObjectID = object.id;
   }

   hide() {
      $$(this.ids.component)?.hide();

      this.emit("close");
   }

   show(data) {
      $$(this.ids.component)?.show();

      this.refreshForm(data);
   }

   isVisible() {
      return $$(this.ids.component)?.isVisible() ?? false;
   }

   refreshForm(data) {
      var ids = this.ids;
      let $formView = $$(ids.form);
      let CurrentObject = this.CurrentObject;

      if (!CurrentObject || !$formView) return;

      data = data || {};

      let formAttrs = {
         id: `${this.ids.component}_sideform`,
         key: ABViewForm.common().key,
         settings: {
            columns: 1,
            labelPosition: "top",
            showLabel: 1,
            clearOnLoad: 0,
            clearOnSave: 0,
            labelWidth: 120,
            height: 0,
         },
      };

      // let form = new ABViewForm(formAttrs, this._mockApp);
      let form = this.AB.viewNewDetatched(formAttrs);

      form.objectLoad(CurrentObject);

      // Populate child elements
      CurrentObject.fields().forEach((f, index) => {
         // if this is one of our .editFields
         if (!this.editFields || this.editFields.indexOf(f.id) > -1) {
            form.addFieldToForm(f, index);
         }
      });

      // add default button (Save button)
      form._views.push(
         new ABViewFormButton(
            {
               settings: {
                  includeSave: true,
                  includeCancel: false,
                  includeReset: false,
               },
               position: {
                  y: CurrentObject.fields().length, // yPosition
               },
            },
            this._mockApp,
            form
         )
      );

      // add temp id to views
      form._views.forEach(
         (v, index) => (v.id = `${form.id}_${v.key}_${index}`)
      );

      let formCom = form.component(this.AB._App);

      // Rebuild form
      webix.ui(formCom.ui.rows.concat({}), $formView);
      webix.extend($formView, webix.ProgressBar);

      formCom.init(
         {
            onBeforeSaveData: () => {
               // get update data
               var formVals = form.getFormValues($formView, CurrentObject);

               // validate data
               if (!form.validateData($formView, CurrentObject, formVals))
                  return false;

               // show progress icon
               $formView?.showProgress({ type: "icon" });

               if (formVals.id) {
                  CurrentObject.model()
                     .update(formVals.id, formVals)
                     .then((updateVals) => {
                        this.emit("update", updateVals);
                        // _logic.callbacks.onUpdateData(updateVals);

                        $formView?.hideProgress({ type: "icon" });
                     })
                     .catch((err) => {
                        // TODO : error message
                        this.AB.notify.developer(err, {
                           context:
                              "ABViewKanbanFormSidePanel:onBeforeSaveData():update(): Error updating value",
                           formVals,
                        });
                        $formView?.hideProgress({ type: "icon" });
                     });
               }
               // else add new row
               else {
                  CurrentObject.model()
                     .create(formVals)
                     .then((newVals) => {
                        // _logic.callbacks.onAddData(newVals);
                        this.emit("add", newVals);

                        $formView?.hideProgress({ type: "icon" });
                     })
                     .catch((err) => {
                        // TODO : error message
                        this.AB.notify.developer(err, {
                           context:
                              "ABViewKanbanFormSidePanel:onBeforeSaveData():.create(): Error creating value",
                           formVals,
                        });

                        $formView?.hideProgress({ type: "icon" });
                     });
               }

               return false;
            },
         },
         2 /* NOTE: if you can see this KanBan, you should be able to see the side form? */
      );

      // display data
      $formView.clear();
      $formView.parse(data);

      formCom.onShow(data);
   }
};
