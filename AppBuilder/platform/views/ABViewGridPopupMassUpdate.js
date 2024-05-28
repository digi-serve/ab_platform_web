/*
 * ABViewGridPopupMassUpdate
 *
 * An ABViewGrid can offer a mass update feature.  This is a ui component
 * to help with the processing of the update.
 *
 */

import ClassUI from "../../../ui/ClassUI";
import RowUpdater from "../RowUpdater";

var L = null;

export default class ABViewGridPopupMassUpdate extends ClassUI {
   //.extend(idBase, function(App) {

   constructor(ABViewGridComponent, idBase) {
      idBase = idBase || "abviewgridpopupMassUpdate";

      super({
         component: `${idBase}_popupMassUpdate`,
         submit: `${idBase}_submitMassUpdate`,
      });

      this.CurrentObject = null;
      // {ABObject}
      // Which ABObject are we currently working with.

      this.GridComponent = ABViewGridComponent;
      // {ABViewGridComponent}
      // The current ABViewGridComponent we are working with.

      this.AB = ABViewGridComponent.AB;
      // {ABFactory}

      this.rowUpdater = new RowUpdater(idBase, this.AB);
      // {RowUpdater}
      // An instance of our RowUpdater form builder.

      if (!L) {
         L = (...params) => {
            return this.AB.Multilingual.label(...params);
         };
      }
   }

   ui() {
      var ids = this.ids;

      // Our webix UI definition:
      return {
         view: "popup",
         id: ids.component,
         // modal: true,
         body: {
            width: 500,
            rows: [
               // Update panel
               this.rowUpdater.ui(),
               { height: 15 },
               {
                  cols: [
                     {},
                     {
                        view: "button",
                        value: L("Cancel"),
                        width: 100,
                        click: () => {
                           this.hide();
                        },
                     },
                     {
                        id: ids.submit,
                        css: "webix_primary",
                        view: "button",
                        label: L("Update"),
                        type: "form",
                        width: 120,
                        click: () => {
                           this.submit();
                        },
                     },
                  ],
               },
            ],
         },
         on: {
            onShow: () => {
               this.onShow();
            },
         },
      };
   }

   async init(AB) {
      webix.ui(this.ui());
      this.rowUpdater.init(AB);

      return Promise.resolve();
   }

   /**
    * @method hide()
    * Hide the popup.
    */
   hide() {
      $$(this.ids.component).hide();
   }

   /**
    * @function objectLoad
    * Ready the Popup according to the current object & datatable
    * @param {ABObject} object
    *        the currently selected object.
    * @param {webix.datatable} dataTable
    *        the dataTable we need to run the mass update on...trust me this
    *        will be good
    */
   objectLoad(object, dataTable) {
      this.CurrentObject = object;
      this.rowUpdater.objectLoad(object);
      this.DataTable = dataTable;
   }

   onShow() {}

   /**
    * @method show()
    * Show this component.
    * @param {obj} $view
    *        the webix.$view to hover the popup around.
    * @param {json} options
    *        Additional webix options related to the .show() method.
    */
   show($view, options = null) {
      if (options != null) {
         $$(this.ids.component).show($view, options);
      } else {
         $$(this.ids.component).show($view);
      }
   }

   /**
    * @method submit()
    * Process the submit action by getting the values to change and then
    * running a batchUpdate() on the items in our datatable that were selected.
    */
   submit() {
      // Update values to records
      let update_button = $$(this.ids.submit),
         update_items = this.rowUpdater.getValue() || [];

      update_button.disable();

      if (!this.GridComponent) {
         // TODO : Message
         // console.log("no data collection to update");
         update_button.enable();
         return;
      } else if (update_items.length < 1) {
         // TODO : Message
         update_button.enable();
         return;
      }

      let $datatable = this.GridComponent.getDataTable(); // $$(DataTable.ui.id);
      let updatedRowIds = [];
      $datatable.data.each(function (row) {
         if (
            row &&
            Object.prototype.hasOwnProperty.call(
               row,
               "appbuilder_select_item"
            ) &&
            row.appbuilder_select_item == 1
         ) {
            updatedRowIds.push(row.id);
         }
      });

      let vals = {};
      update_items.forEach((item) => {
         let fieldInfo = this.CurrentObject.fieldByID(item.fieldId);
         if (!fieldInfo) return;

         vals[fieldInfo.columnName] = item.value;
      });

      if (updatedRowIds.length > 0) {
         webix.confirm({
            title: L("Updating Multiple Records"),
            text: L("Are you sure you want to update the selected records?"),
            callback: (result) => {
               if (result) {
                  if ($datatable && $datatable.showProgress)
                     $datatable.showProgress({ type: "icon" });

                  let objModel = this.CurrentObject.model();
                  objModel
                     .batchUpdate({
                        rowIds: updatedRowIds,
                        values: vals,
                     })
                     .then(() => {
                        // Update webix.datatable
                        (updatedRowIds ?? []).forEach((rowId) => {
                           $datatable.updateItem(rowId, vals);
                        });

                        // Anything we need to do after we are done.
                        update_button.enable();
                        this.hide();

                        if ($datatable && $datatable.hideProgress)
                           $datatable.hideProgress();
                     })
                     .catch((err) => {
                        this.AB.notify.developer(err, {
                           context:
                              "ABViewGridPopupMassUpdate:submit(): Error during batchUpdate",
                           rowIds: updatedRowIds,
                           values: vals,
                        });
                     });
               } else {
                  update_button.enable();
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
         update_button.enable();
         this.hide();
      }
   }
}
