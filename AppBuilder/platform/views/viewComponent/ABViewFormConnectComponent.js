const ABViewFormItemComponent = require("./ABViewFormItemComponent");

module.exports = class ABViewFormConnectComponent extends (
   ABViewFormItemComponent
) {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewFormConnect_${baseView.id}`,
         Object.assign(
            {
               popup: "",
               editpopup: "",
            },
            ids
         )
      );

      this.addPageComponent = null;
      this.editPageComponent = null;
   }

   get field() {
      return this.view.field();
   }

   get multiselect() {
      return this.field?.settings.linkType == "many";
   }

   ui() {
      const field = this.field;
      const baseView = this.view;
      const form = baseView.parentFormComponent();
      const settings = this.settings;

      if (!field) {
         console.error(`This field could not found : ${settings.fieldId}`);

         return super.ui({
            view: "label",
            label: "",
         });
      }

      const multiselect = this.multiselect; // field.settings.linkType == "many";
      const formSettings = form?.settings || {};
      const ids = this.ids;

      let _ui = {
         id: ids.formItem,
         view: multiselect ? "multicombo" : "combo",
         name: field.columnName,
         required:
            field?.settings?.required || parseInt(settings?.required) || false,
         // label: field.label,
         // labelWidth: settings.labelWidth,
         dataFieldId: field.id,
         on: {
            onItemClick: (id, e) => {
               if (
                  e.target.classList.contains("editConnectedPage") &&
                  e.target.dataset.itemId
               ) {
                  const rowId = e.target.dataset.itemId;
                  if (!rowId) return;
                  this.goToEditPage(rowId);
               }
            },
            onChange: (data) => {
               this._onChange(data);
            },
         },
      };

      if (formSettings.showLabel) {
         _ui.label = field.label;
         _ui.labelWidth = formSettings.labelWidth;
         _ui.labelPosition = formSettings.labelPosition;
      }

      this.initAddEditTool();

      _ui.suggest = {
         button: true,
         selectAll: multiselect ? true : false,
         body: {
            data: [],
            template: `${
               baseView?.settings?.editForm
                  ? '<i data-item-id="#id#" class="fa fa-cog editConnectedPage"></i>'
                  : ""
            }#value#`,
         },
         on: {
            onShow: () => {
               field.populateOptionsDataCy($$(ids.formItem), field, form);
            },
         },
         // Support partial matches
         filter: ({ value }, search) =>
            value.toLowerCase().includes(search.toLowerCase()),
      };

      _ui.onClick = {
         customField: (id, e, trg) => {
            if (settings.disable === 1) return;

            const rowData = {};
            const $formItem = $$(ids.formItem);

            if ($formItem) {
               const node = $formItem.$view;

               field.customEdit(rowData, /* App,*/ node);
            }
         },
      };

      let apcUI = this.addPageComponent?.ui;
      if (apcUI) {
         // reset some component vals to make room for button
         _ui.label = "";
         _ui.labelWidth = 0;

         // add click event to add new button
         apcUI.on = {
            onItemClick: (/*id, evt*/) => {
               // let $form = $$(id).getFormView();
               this.addPageComponent?.onClick(form.datacollection);

               return false;
            },
         };

         _ui = {
            inputId: ids.formItem,
            rows: [
               {
                  cols: [
                     {
                        view: "label",
                        label: field.label,
                        width: formSettings.labelWidth,
                        align: "left",
                     },
                     apcUI,
                     _ui,
                  ],
               },
            ],
         };

         _ui = super.ui(_ui);
      } else {
         _ui = {
            inputId: ids.formItem,
            rows: [_ui],
         };

         _ui = super.ui(_ui);

         delete _ui.rows[0].id;
      }

      return _ui;
   }

   async _onChange(data) {
      const ids = this.ids;
      const field = this.field;
      const baseView = this.view;

      if (this.multiselect) {
         if (typeof data == "string") {
            data = data.split(",");
         }
      }

      let selectedValues;
      if (Array.isArray(data)) {
         selectedValues = [];
         data.forEach((record) => {
            selectedValues.push(record.id || record);
            // let recordObj = record;
            // if (typeof record != "object") {
            //    // we need to convert either index or uuid to full data object
            //    recordObj = field.getItemFromVal(record);
            // }
            // if (recordObj?.id) selectedValues.push(recordObj.id);
         });
      } else {
         selectedValues = data;
         if (typeof data != "object") {
            // we need to convert either index or uuid to full data object
            selectedValues = field.getItemFromVal(data);
         }
         // selectedValues = field.pullRecordRelationValues(selectedValues);
         if (selectedValues?.id) {
            selectedValues = selectedValues.id;
         } else {
            selectedValues = data;
         }
      }

      // We can now set the new value but we need to block event listening
      // so it doesn't trigger onChange again
      const $formItem = $$(ids.formItem);

      // Q: if we don't have a $formItem, is any of the rest valid?
      if ($formItem) {
         // for xxx->one connections we need to populate again before setting
         // values because we need to use the selected values to add options
         // to the UI
         if (this?.field?.settings?.linkViaType == "one") {
            this.busy();
            await field.getAndPopulateOptions(
               $formItem,
               baseView.options,
               field,
               baseView.parentFormComponent()
            );
            this.ready();
         }

         $formItem.blockEvent();

         const prepedVals = selectedValues.join
            ? selectedValues.join()
            : selectedValues;

         $formItem.setValue(prepedVals);
         $formItem.unblockEvent();
      }
   }

   async init(AB, options) {
      await super.init(AB);

      const $formItem = $$(this.ids.formItem);
      if ($formItem) webix.extend($formItem, webix.ProgressBar);

      this.initAddEditTool();
   }

   initAddEditTool() {
      const baseView = this.view;

      // Initial add/edit page tools
      const addFormID = baseView?.settings?.formView;
      if (addFormID && baseView && !this.addPageComponent) {
         this.addPageComponent = baseView.addPageTool.component(
            this.AB,
            `${baseView.id}_${addFormID}`
         );
         this.addPageComponent.applicationLoad(baseView.application);
         this.addPageComponent.init({
            onSaveData: this.callbackSaveData.bind(this),
            onCancelClick: this.callbackCancel.bind(this),
            clearOnLoad: this.callbackClearOnLoad.bind(this),
         });
      }

      const editFormID = baseView?.settings?.editForm;
      if (editFormID && baseView && !this.editPageComponent) {
         this.editPageComponent = baseView.editPageTool.component(
            this.AB,
            `${baseView.id}_${editFormID}`
         );
         this.editPageComponent.applicationLoad(baseView.application);
         this.editPageComponent.init({
            onSaveData: this.callbackSaveData.bind(this),
            onCancelClick: this.callbackCancel.bind(this),
            clearOnLoad: this.callbackClearOnLoad.bind(this),
         });
      }
   }

   async callbackSaveData(saveData) {
      if (saveData == null) return;
      else if (!Array.isArray(saveData)) saveData = [saveData];

      const ids = this.ids;
      const field = this.field;

      // find the select component
      const $formItem = $$(ids.formItem);
      if (!$formItem) return;

      // Refresh option list
      this.busy();
      field.clearStorage(this.view.settings.filterConditions);
      const data = await field.getAndPopulateOptions(
         $formItem,
         this.view.options,
         field,
         this.view.parentFormComponent()
      );
      this.ready();

      // field.once("option.data", (data) => {
      data.forEach((item) => {
         item.value = item.text;
      });

      $formItem.getList().clearAll();
      $formItem.getList().define("data", data);

      if (field.settings.linkType === "many") {
         let selectedItems = $formItem.getValue();
         saveData.forEach((sData) => {
            if (selectedItems.indexOf(sData.id) === -1)
               selectedItems = selectedItems
                  ? `${selectedItems},${sData.id}`
                  : sData.id;
         });

         $formItem.setValue(selectedItems);
      } else {
         $formItem.setValue(saveData[0].id);
      }
      // close the popup when we are finished
      // $$(ids.popup)?.close();
      // $$(ids.editpopup)?.close();
      // });

      // field.getOptions(this.settings.filterConditions, "");
      // .then(function (data) {
      //    // we need new option that will be returned from server (above)
      //    // so we will not set this and then just reset it.
      // });
   }

   callbackCancel() {
      $$(this.ids?.popup)?.close?.();

      return false;
   }

   callbackClearOnLoad() {
      return true;
   }

   getValue(rowData) {
      return this.field.getValue($$(this.ids.formItem), rowData);
   }

   formBusy($form) {
      if (!$form) return;

      $form.disable?.();
      $form.showProgress?.({ type: "icon" });
   }

   formReady($form) {
      if (!$form) return;

      $form.enable?.();
      $form.hideProgress?.();
   }

   goToEditPage(rowId) {
      const settings = this.settings;

      if (!settings.editForm) return;

      const editForm = this.view.application.urlResolve(settings.editForm);

      if (!editForm) return;

      const $form = $$(this.ids.formItem).getFormView() || null;

      // Open the form popup
      this.editPageComponent.onClick().then(() => {
         const dc = editForm.datacollection;

         if (dc) {
            dc.setCursor(rowId);

            this.__editFormDcEvent =
               this.__editFormDcEvent ||
               dc.on("initializedData", () => {
                  dc.setCursor(rowId);
               });
         }
      });
   }

   async onShow() {
      const ids = this.ids;
      const $formItem = $$(ids.formItem);

      if (!$formItem) return;

      const field = this.field;

      if (!field) return;

      const node = $formItem.$view;

      if (!node) return;

      const $node = $$(node);

      if (!$node) return;

      const settings = this.settings;
      let filterConditions = {
         glue: "and",
         rules: [],
      };

      if (settings?.filterConditions?.rules?.length) {
         filterConditions = this.AB.cloneDeep(
            this.view.settings.filterConditions
         );
      }

      // NOTE: compatible with version 1. This code should not be here too long.
      if (
         !filterConditions?.rules?.length &&
         settings?.objectWorkspace?.filterConditions?.rules?.length
      ) {
         filterConditions = this.AB.cloneDeep(
            settings.objectWorkspace.filterConditions
         );
      }

      // Add the filter connected value
      if ((settings?.filterConnectedValue ?? "").indexOf(":") > -1) {
         const values = settings.filterConnectedValue.split(":"),
            uiConfigName = values[0],
            connectFieldId = values[1];

         filterConditions.rules.push({
            key: connectFieldId,
            rule: "filterByConnectValue",
            value: uiConfigName,
         });
      }

      const getFilterByConnectValues = (conditions, depth = 0) => {
         return [
            ...conditions.rules
               .filter((e) => e.rule === "filterByConnectValue")
               .map((e) => {
                  const filterByConnectValue = Object.assign({}, e);

                  filterByConnectValue.depth = depth;

                  return filterByConnectValue;
               }),
         ].concat(
            ...conditions.rules
               .filter((e) => e.glue)
               .map((e) => getFilterByConnectValues(e, depth + 1))
         );
      };

      const baseView = this.view;
      const filterByConnectValues = getFilterByConnectValues(
         filterConditions
      ).map((e) => {
         for (const key in baseView.parent.viewComponents) {
            if (
               !(
                  baseView.parent.viewComponents[key] instanceof
                  this.constructor
               )
            )
               continue;

            const $ui = $$(
               baseView.parent.viewComponents[key]
                  .ui()
                  .rows.find((vc) => vc.inputId)?.inputId
            );

            if ($ui?.config?.name === e.value) {
               // we need to use the element id stored in the settings to find out what the
               // ui component id is so later we can use it to look up its current value
               e.filterValue = $ui;

               break;
            }
         }

         const ab = this.AB;
         const field = ab
            .objectByID(settings.objectId)
            .fieldByID(settings.fieldId);
         const linkedObject = ab.objectByID(field.settings.linkObject);
         const linkedField = linkedObject.fieldByID(e.key);

         if (linkedField?.settings?.isCustomFK) {
            // finally if this is a custom foreign key we need the stored columnName by
            // default uuid is passed for all non CFK
            e.filterColumn = ab
               .objectByID(linkedField.settings.linkObject)
               .fields(
                  (filter) =>
                     filter.id === linkedField.settings.indexField ||
                     linkedField.settings.indexField2
               )[0].columnName;
         } else e.filterColumn = null;

         return e;
      });

      baseView.options = {
         formView: settings.formView,
         filters: filterConditions,
         // NOTE: settings.objectWorkspace.xxx is a depreciated setting.
         // We will be phasing this out.
         sort: settings.sortFields ?? settings.objectWorkspace?.sortFields,
         editable: settings.disable === 1 ? false : true,
         editPage:
            !settings.editForm || settings.editForm === "none" ? false : true,
         filterByConnectValues,
      };

      // if this field's options are filtered off another field's value we need
      // to make sure the UX helps the user know what to do.
      // fetch the options and set placeholder text for this view
      if (baseView.options.editable) {
         const parentFields = [];

         filterByConnectValues.forEach((fv) => {
            if (fv.filterValue && fv.key) {
               const $filterValueConfig = $$(fv.filterValue.config.id);

               let parentField = null;

               if (!$filterValueConfig) {
                  // this happens in the Interface Builder when only the single form UI is displayed
                  parentField = {
                     id: "perentElement",
                     label: this.label("PARENT ELEMENT"),
                  };
               } else {
                  const value = field.getValue($filterValueConfig);

                  if (!value) {
                     // if there isn't a value on the parent select element set this one to readonly and change placeholder text
                     parentField = {
                        id: fv.filterValue.config.id,
                        label: $filterValueConfig.config.label,
                     };
                  }

                  $filterValueConfig.attachEvent(
                     "onChange",
                     async (e) => {
                        const parentVal = $filterValueConfig.getValue();

                        if (parentVal) {
                           $node.define("disabled", false);
                           $node.define(
                              "placeholder",
                              this.label("Select items")
                           );
                           this.busy();
                           await field.getAndPopulateOptions(
                              $node,
                              baseView.options,
                              field,
                              baseView.parentFormComponent()
                           );
                           this.ready();
                        } else {
                           $node.define("disabled", true);
                           $node.define(
                              "placeholder",
                              this.label("Must select item from '{0}' first.", [
                                 $filterValueConfig.config.label,
                              ])
                           );
                        }

                        // TODO: Do we need to clear selected value?
                        // $node.setValue("");
                        $node.refresh();
                     },
                     false
                  );
               }

               if (
                  parentField &&
                  parentFields.findIndex((e) => e.id === parentField.id) < 0
               )
                  parentFields.push(parentField);
            }
         });

         if (parentFields.length && !$node.getValue()) {
            $node.define("disabled", true);
            $node.define(
               "placeholder",
               this.label(`Must select item from '{0}' first.`, [
                  parentFields.map((e) => e.label).join(", "),
               ])
            );
         } else {
            $node.define("disabled", false);
            $node.define("placeholder", this.label("Select items"));
         }
      } else {
         $node.define("placeholder", "");
         $node.define("disabled", true);
      }

      $node.refresh();

      // Add data-cy attributes
      const dataCy = `${field.key} ${field.columnName} ${field.id} ${baseView.parent.id}`;
      node.setAttribute("data-cy", dataCy);

      this.busy();
      try {
         await field.getAndPopulateOptions(
            // $node,
            $formItem,
            baseView.options,
            field,
            baseView.parentFormComponent()
         );
      } catch (err) {
         this.AB.notify.developer(err, {
            context:
               "ABViewFormConnectComponent > onShow() error calling field.getAndPopulateOptions",
         });
      }
      this.ready();

      // Need to refresh selected values when they are custom index
      this._onChange($formItem.getValue());
   }

   busy() {
      const $formItem = $$(this.ids.formItem);

      $formItem?.disable();
      $formItem?.showProgress?.({ type: "icon" });
   }

   ready() {
      const $formItem = $$(this.ids.formItem);

      $formItem?.enable();
      $formItem?.hideProgress?.();
   }
};
