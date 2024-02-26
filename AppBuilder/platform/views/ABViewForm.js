const ABViewFormCore = require("../../core/views/ABViewFormCore");
const ABViewFormComponent = require("./viewComponent/ABViewFormComponent");
const ABViewFormButton = require("./ABViewFormButton");
const ABViewFormCustom = require("./ABViewFormCustom");
const ABViewFormConnect = require("./ABViewFormConnect");
const ABViewFormDatepicker = require("./ABViewFormDatepicker");
const ABViewFormSelectMultiple = require("./ABViewFormSelectMultiple");
const ABViewFormTextbox = require("./ABViewFormTextbox");
const ABViewFormJson = require("./ABViewFormJson");

const L = (...params) => AB.Multilingual.label(...params);

// const ABRecordRule = require("../../rules/ABViewRuleListFormRecordRules");
// const ABSubmitRule = require("../../rules/ABViewRuleListFormSubmitRules");

// let PopupRecordRule = null;
// let PopupSubmitRule = null;

////
//// LEFT OFF HERE: Review and Refactor
////
const ABViewFormPropertyComponentDefaults = ABViewFormCore.defaultValues();

module.exports = class ABViewForm extends ABViewFormCore {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues);

      this._callbacks = {
         onBeforeSaveData: () => true,
      };
   }

   superComponent() {
      if (this._superComponent == null)
         this._superComponent = super.component();

      return this._superComponent;
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewFormComponent(this);
   }

   refreshDefaultButton(ids) {
      // If default button is not exists, then skip this
      let defaultButton = this.views(
         (v) => v instanceof ABViewFormButton && v.settings.isDefault
      )[0];

      // Add a default button
      if (defaultButton == null) {
         defaultButton = ABViewFormButton.newInstance(this.application, this);
         defaultButton.settings.isDefault = true;
      }
      // Remove default button from array, then we will add it to be the last item later (.push)
      else {
         this._views = this.views((v) => v.id != defaultButton.id);
      }

      // Calculate position Y of the default button
      let yList = this.views().map((v) => (v.position.y || 0) + 1);
      yList.push(this._views.length || 0);
      yList.push($$(ids.fields).length || 0);
      let posY = Math.max(...yList);

      // Update to be the last item
      defaultButton.position.y = posY;

      // Keep the default button is always the last item of array
      this._views.push(defaultButton);

      return defaultButton;
   }

   /**
    * @method getFormValues
    *
    * @param {webix form} formView
    * @param {ABObject} obj
    * @param {ABDatacollection} dc
    * @param {ABDatacollection} dcLink [optional]
    */
   getFormValues(formView, obj, dc, dcLink) {
      // get the fields that are on this form
      const visibleFields = ["id"]; // we always want the id so we can udpate records
      formView.getValues(function (obj) {
         visibleFields.push(obj.config.name);
      });

      // only get data passed from form
      const allVals = formView.getValues();
      const formVals = {};
      visibleFields.forEach((val) => {
         formVals[val] = allVals[val];
      });

      // get custom values
      this.fieldComponents(
         (comp) =>
            comp instanceof ABViewFormCustom ||
            comp instanceof ABViewFormConnect ||
            comp instanceof ABViewFormDatepicker ||
            comp instanceof ABViewFormSelectMultiple ||
            (comp instanceof ABViewFormJson && comp.settings.type == "filter")
      ).forEach((f) => {
         const vComponent = this.viewComponents[f.id];
         if (vComponent == null) return;

         const field = f.field();
         if (field) {
            const getValue = vComponent.getValue ?? vComponent.logic.getValue;
            if (getValue)
               formVals[field.columnName] = getValue.call(vComponent, formVals);
         }
      });

      // remove connected fields if they were not on the form and they are present in the formVals because it is a datacollection
      obj.connectFields().forEach((f) => {
         if (
            visibleFields.indexOf(f.columnName) == -1 &&
            formVals[f.columnName]
         ) {
            delete formVals[f.columnName];
            delete formVals[f.relationName()];
         }
      });

      // clear undefined values or empty arrays
      for (const prop in formVals) {
         if (formVals[prop] == null || formVals[prop].length == 0)
            formVals[prop] = "";
      }

      // Add parent's data collection cursor when a connect field does not show
      let linkValues;

      if (dcLink) {
         linkValues = dcLink.getCursor();
      }

      if (linkValues) {
         const objectLink = dcLink.datasource;

         const connectFields = obj.connectFields();
         connectFields.forEach((f) => {
            const formFieldCom = this.fieldComponents(
               (fComp) => fComp?.field?.()?.id === f?.id
            );

            if (
               objectLink.id == f.settings.linkObject &&
               formFieldCom.length < 1 && // check field does not show
               formVals[f.columnName] === undefined
            ) {
               const linkColName = f.indexField
                  ? f.indexField.columnName
                  : objectLink.PK();

               formVals[f.columnName] = {};
               formVals[f.columnName][linkColName] =
                  linkValues[linkColName] ?? linkValues.id;
            }
         });
      }

      // NOTE: need to pull data of current cursor to calculate Calculate & Formula fields
      // .formVals variable does not include data that does not display in the Form widget
      const cursorFormVals = Object.assign(dc.getCursor() ?? {}, formVals);

      // Set value of calculate or formula fields to use in record rule
      obj.fields((f) => f.key == "calculate" || f.key == "formula").forEach(
         (f) => {
            if (formVals[f.columnName] == null) {
               let reCalculate = true;

               // WORKAROUND: If "Formula" field will have Filter conditions,
               // Then it is not able to re-calculate on client side
               // because relational data is not full data so FilterComplex will not have data to check
               if (f.key == "formula" && f.settings?.where?.rules?.length > 0) {
                  reCalculate = false;
               }

               formVals[f.columnName] = f.format(cursorFormVals, reCalculate);
            }
         }
      );

      if (allVals.translations?.length > 0)
         formVals.translations = allVals.translations;

      return formVals;
   }

   /**
    * @method validateData
    *
    * @param {webix form} formView
    * @param {ABObject} object
    * @param {object} formVals
    *
    * @return {boolean} isValid
    */
   validateData($formView, object, formVals) {
      let list = "";

      // validate required fields
      const requiredFields = this.fieldComponents(
         (fComp) =>
            fComp?.field?.().settings?.required == true ||
            fComp?.settings?.required == true
      ).map((fComp) => fComp.field());

      // validate data
      const validator = object.isValidData(formVals);
      let isValid = validator.pass();

      // $$($formView).validate();
      $formView.validate();
      /**
       * helper function to fix the webix ui after adding an validation error
       * message.
       * @param {string} col - field.columnName
       */
      const fixInvalidMessageUI = (col) => {
         const $forminput = $formView.elements[col];
         if (!$forminput) return;
         // Y position
         const height = $forminput.$height;
         if (height < 56) {
            $forminput.define("height", 60);
            $forminput.resize();
         }

         // X position
         const domInvalidMessage = $forminput.$view.getElementsByClassName(
            "webix_inp_bottom_label"
         )[0];
         if (!domInvalidMessage?.style["margin-left"]) {
            domInvalidMessage.style.marginLeft = `${
               this.settings.labelWidth ??
               ABViewFormPropertyComponentDefaults.labelWidth
            }px`;
         }
      };

      // Display required messages
      requiredFields.forEach((f) => {
         if (!f) return;

         const fieldVal = formVals[f.columnName];
         if (fieldVal == "" || fieldVal == null || fieldVal.length < 1) {
            $formView.markInvalid(f.columnName, L("This is a required field."));
            list += `<li>${L("Missing Required Field")} ${f.columnName}</li>`;
            isValid = false;

            // Fix position of invalid message
            fixInvalidMessageUI(f.columnName);
         }
      });

      // if data is invalid
      if (!isValid) {
         const saveButton = $formView.queryView({
            view: "button",
            type: "form",
         });

         // error message
         if (validator?.errors?.length) {
            validator.errors.forEach((err) => {
               $formView.markInvalid(err.name, err.message);
               list += `<li>${err.name}: ${err.message}</li>`;
               fixInvalidMessageUI(err.name);
            });

            saveButton?.disable();
         } else {
            saveButton?.enable();
         }
      }
      if (list) {
         webix.alert({
            type: "alert-error",
            title: L("Problems Saving"),
            width: 400,
            text: `<ul style='text-align:left'>${list}</ul>`,
         });
      }

      return isValid;
   }

   /**
    * @method recordRulesReady()
    * This returns a Promise that gets resolved when all record rules report
    * that they are ready.
    * @return {Promise}
    */
   async recordRulesReady() {
      return this.RecordRule.rulesReady();
   }

   /**
    * @method saveData
    * save data in to database
    * @param $formView - webix's form element
    *
    * @return {Promise}
    */
   async saveData($formView) {
      // call .onBeforeSaveData event
      // if this function returns false, then it will not go on.
      if (!this._callbacks?.onBeforeSaveData?.()) return;

      $formView.clearValidation();

      // get ABDatacollection
      const dv = this.datacollection;
      if (dv == null) return;

      // get ABObject
      const obj = dv.datasource;
      if (obj == null) return;

      // get ABModel
      const model = dv.model;
      if (model == null) return;

      // show progress icon
      $formView.showProgress?.({ type: "icon" });

      // get update data
      const formVals = this.getFormValues(
         $formView,
         obj,
         dv,
         dv.datacollectionLink
      );

      // form ready function
      const formReady = (newFormVals) => {
         // clear cursor after saving.
         if (dv) {
            if (this.settings.clearOnSave) {
               dv.setCursor(null);
               $formView.clear();
            } else {
               if (newFormVals && newFormVals.id) dv.setCursor(newFormVals.id);
            }
         }

         $formView.hideProgress?.();

         // if there was saved data pass it up to the onSaveData callback
         // if (newFormVals) this._logic.callbacks.onSaveData(newFormVals);
         if (newFormVals) this.emit("saved", newFormVals); // Q? is this the right upgrade?
      };

      const formError = (err) => {
         const $saveButton = $formView.queryView({
            view: "button",
            type: "form",
         });

         // mark error
         if (err) {
            if (err.invalidAttributes) {
               for (const attr in err.invalidAttributes) {
                  let invalidAttrs = err.invalidAttributes[attr];
                  if (invalidAttrs && invalidAttrs[0])
                     invalidAttrs = invalidAttrs[0];

                  $formView.markInvalid(attr, invalidAttrs.message);
               }
            } else if (err.sqlMessage) {
               webix.message({
                  text: err.sqlMessage,
                  type: "error",
               });
            } else {
               webix.message({
                  text: L("System could not save your data"),
                  type: "error",
               });
               this.AB.notify.developer(err, {
                  message: "Could not save your data",
                  view: this.toObj(),
               });
            }
         }

         $saveButton?.enable();

         $formView?.hideProgress?.();
      };

      // Load data of DCs that use in record rules
      await this.loadDcDataOfRecordRules();

      // wait for our Record Rules to be ready before we continue.
      await this.recordRulesReady();

      // update value from the record rule (pre-update)
      this.doRecordRulesPre(formVals);

      // validate data
      if (!this.validateData($formView, obj, formVals)) {
         // console.warn("Data is invalid.");
         $formView.hideProgress?.();
         return;
      }

      let newFormVals;
      // {obj}
      // The fully populated values returned back from service call
      // We use this in our post processing Rules

      try {
         // is this an update or create?
         if (formVals.id) {
            newFormVals = await model.update(formVals.id, formVals);
         } else {
            newFormVals = await model.create(formVals);
         }
      } catch (err) {
         formError(err.data);
         throw err;
      }

      /*
      // OLD CODE:
      try {
         await this.doRecordRules(newFormVals);
         // make sure any updates from RecordRules get passed along here.
         this.doSubmitRules(newFormVals);
         formReady(newFormVals);
         return newFormVals;
      } catch (err) {
         this.AB.notify.developer(err, {
            message: "Error processing Record Rules.",
            view: this.toObj(),
            newFormVals: newFormVals,
         });
         // Question:  how do we respond to an error?
         // ?? just keep going ??
         this.doSubmitRules(newFormVals);
         formReady(newFormVals);
         return;
      }
      */

      try {
         await this.doRecordRules(newFormVals);
      } catch (err) {
         this.AB.notify.developer(err, {
            message: "Error processing Record Rules.",
            view: this.toObj(),
            newFormVals: newFormVals,
         });
      }

      // make sure any updates from RecordRules get passed along here.
      try {
         this.doSubmitRules(newFormVals);
      } catch (errs) {
         this.AB.notify.developer(errs, {
            message: "Error processing Submit Rules.",
            view: this.toObj(),
            newFormVals: newFormVals,
         });
      }

      formReady(newFormVals);
      return newFormVals;
   }

   focusOnFirst() {
      let topPosition = 0;
      let topPositionId = "";
      this.views().forEach((item) => {
         if (item.key == "textbox" || item.key == "numberbox") {
            if (item.position.y == topPosition) {
               // topPosition = item.position.y;
               topPositionId = item.id;
            }
         }
      });
      let childComponent = this.viewComponents[topPositionId];
      if (childComponent && $$(childComponent.ui.id)) {
         $$(childComponent.ui.id).focus();
      }
   }

   async loadDcDataOfRecordRules() {
      const tasks = [];

      (this.settings?.recordRules ?? []).forEach((rule) => {
         (rule?.actionSettings?.valueRules?.fieldOperations ?? []).forEach(
            (op) => {
               if (op.valueType !== "exist") return;

               const pullDataDC = this.AB.datacollectionByID(op.value);

               if (
                  pullDataDC?.dataStatus ===
                  pullDataDC.dataStatusFlag.notInitial
               )
                  tasks.push(pullDataDC.loadData());
            }
         );
      });

      await Promise.all(tasks)

      return true;
   }

   get viewComponents() {
      const superComponent = this.superComponent();
      return superComponent.viewComponents;
   }

   warningsEval() {
      super.warningsEval();

      let DC = this.datacollection;
      if (!DC) {
         this.warningsMessage(
            `can't resolve it's datacollection[${this.settings.dataviewID}]`
         );
      }

      if (this.settings.recordRules) {
         // TODO: scan recordRules for warnings
      }

      if (this.settings.submitRules) {
         // TODO: scan submitRules for warnings.
      }
   }

   /**
    * @method deleteData
    * delete data in to database
    * @param $formView - webix's form element
    *
    * @return {Promise}
    */
   async deleteData($formView) {
      // get ABDatacollection
      const dc = this.datacollection;
      if (dc == null) return;

      // get ABObject
      const obj = dc.datasource;
      if (obj == null) return;

      // get ABModel
      const model = dc.model;
      if (model == null) return;

      // get update data
      const formVals = $formView.getValues();

      if (formVals?.id) {
         const result = await model.delete(formVals.id);

         // clear form
         if (result) {
            dc.setCursor(null);
            $formView.clear();
         }

         return result;
      }
   }
};
