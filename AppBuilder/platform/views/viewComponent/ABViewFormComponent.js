const ABViewComponent = require("./ABViewComponent").default;
const ABViewFormItem = require("../ABViewFormItem");
const ABViewFormCustom = require("../ABViewFormCustom");
const ABViewFormTextbox = require("../ABViewFormTextbox");

async function timeout(ms) {
   return new Promise((resolve) => setTimeout(resolve, ms));
}

const fieldValidations = [];

module.exports = class ABViewFormComponent extends ABViewComponent {
   constructor(baseView, idBase) {
      idBase = idBase || `ABViewForm_${baseView.id}`;
      super(baseView, idBase, {
         layout: "",
         filterComplex: "",
      });
   }

   ui() {
      const superComponent = this.view.superComponent();
      const rows = superComponent.ui().rows ?? [];
      const fieldValidationsHolder = this.uiValidationHolder();

      return {
         id: this.ids.component,
         view: "form",
         abid: this.view.id,
         rows: rows.concat(fieldValidationsHolder),
      };
   }

   uiValidationHolder() {
      const result = [
         {
            hidden: true,
            rows: [],
         },
      ];
      // NOTE: this._currentObject can be set in the KanBan Side Panel
      const object =
         this.view.datacollection?.datasource ?? this.view._currentObject;
      if (!object) return result;

      const validationUI = [];
      const existsFields = this.view.fieldComponents();

      object
         // Pull fields that have validation rules
         .fields((f) => f?.settings?.validationRules)
         .forEach((f) => {
            const view = existsFields.find(
               (com) => f.id == com.settings.fieldId
            );
            if (!view) return;

            // parse the rules because they were stored as a string
            // check if rules are still a string...if so lets parse them
            if (typeof f.settings.validationRules === "string") {
               f.settings.validationRules = JSON.parse(
                  f.settings.validationRules
               );
            }

            // there could be more than one so lets loop through and build the UI
            f.settings.validationRules.forEach((rule, indx) => {
               const Filter = this.AB.filterComplexNew(
                  `${f.columnName}_${indx}`
               );
               // add the new ui to an array so we can add them all at the same time
               if (typeof Filter.ui == "function") {
                  validationUI.push(Filter.ui());
               } else {
                  // Legacy v1 method:
                  validationUI.push(Filter.ui);
               }

               // store the filter's info so we can assign values and settings after the ui is rendered
               fieldValidations.push({
                  filter: Filter,
                  view: Filter.ids.querybuilder,
                  columnName: f.columnName,
                  validationRules: rule.rules,
                  invalidMessage: rule.invalidMessage,
               });
            });
         });

      result.rows = validationUI;

      return result;
   }

   init(AB, accessLevel, options = {}) {
      this.AB = AB;
      this.view.superComponent().init(AB, accessLevel, options);

      this.initCallbacks(options);
      this.initEvents();
      this.initValidationRules();
      this.loadDcDataOfRecordRules();

      const $Form = $$(this.ids.component);
      if ($Form) {
         webix.extend($Form, this.AB.Webix.ProgressBar);
      }

      if (accessLevel < 2) {
         $Form.disable();
      }
   }

   initCallbacks(options = {}) {
      // Q: Should we use emit the event instead ?
      if (options.onBeforeSaveData) {
         this.view._callbacks.onBeforeSaveData = options.onBeforeSaveData;
      } else {
         this.view._callbacks.onBeforeSaveData = () => true;
      }
   }

   initEvents() {
      // bind a data collection to form component
      const dc = this.view.datacollection;
      if (!dc) return;
      // listen DC events
      this.eventAdd({
         emitter: dc,
         eventName: "changeCursor",
         listener: (rowData) => {
            this.displayData(rowData);
         },
      });

      this.eventAdd({
         emitter: dc,
         eventName: "initializingData",
         listener: () => {
            const $Form = $$(this.ids.component);
            if ($Form) {
               $Form.disable();
               if ($Form.showProgress) $Form.showProgress({ type: "icon" });
            }
         },
      });

      this.eventAdd({
         emitter: dc,
         eventName: "initializedData",
         listener: () => {
            const $Form = $$(this.ids.component);
            if ($Form) {
               $Form.enable();
               if ($Form.hideProgress) $Form.hideProgress();
            }
         },
      });

      this.eventAdd({
         emitter: dc,
         eventName: "ab.datacollection.update",
         listener: (msg, data) => {
            if (!data || !data.objectId) return;

            const object = dc.datasource;
            if (!object) return;

            if (
               object.id == data.objectId ||
               object.fields((f) => f.settings.linkObject == data.objectId)
                  .length > 0
            ) {
               const currData = dc.getCursor();
               if (currData) this.displayData(currData);
            }
         },
      });

      // bind the cursor event of the parent DC
      const linkDv = dc.datacollectionLink;
      if (linkDv) {
         // update the value of link field when data of the parent dc is changed
         this.eventAdd({
            emitter: linkDv,
            eventName: "changeCursor",
            listener: (rowData) => {
               this.displayParentData(rowData);
            },
         });
      }
   }

   initValidationRules() {
      const dc = this.view.datacollection;
      if (!dc) return;

      if (!fieldValidations.length) return;

      // we need to store the rules for use later so lets build a container array
      const complexValidations = [];
      fieldValidations.forEach((f) => {
         // init each ui to have the properties (app and fields) of the object we are editing
         f.filter.applicationLoad(dc.datasource.application);
         f.filter.fieldsLoad(dc.datasource.fields());
         // now we can set the value because the fields are properly initialized
         f.filter.setValue(f.validationRules);
         // if there are validation rules present we need to store them in a lookup hash
         // so multiple rules can be stored on a single field
         if (!Array.isArray(complexValidations[f.columnName]))
            complexValidations[f.columnName] = [];

         // now we can push the rules into the hash
         complexValidations[f.columnName].push({
            filters: $$(f.view).getFilterHelper(),
            // values: $$(ids.component).getValues(),
            invalidMessage: f.invalidMessage,
         });
      });

      // use the lookup to build the validation rules
      Object.keys(complexValidations).forEach(function (key) {
         // get our field that has validation rules
         const formField = $$(this.ids.component).queryView({
            name: key,
         });
         // store the rules in a data param to be used later
         formField.$view.complexValidations = complexValidations[key];
         // define validation rules
         formField.define("validate", function (nval, oval, field) {
            // get field now that we are validating
            const fieldValidating = $$(this.ids.component).queryView({
               name: field,
            });
            // default valid is true
            let isValid = true;
            // check each rule that was stored previously on the element
            fieldValidating.$view.complexValidations.forEach((filter) => {
               let object = dc.datasource;
               let data = this.getValues();
               // convert rowData from { colName : data } to { id : data }
               const newData = {};
               (object.fields() || []).forEach((field) => {
                  newData[field.id] = data[field.columnName];
               });
               // for the case of "this_object" conditions:
               if (data.uuid) {
                  newData["this_object"] = data.uuid;
               }

               // use helper funtion to check if valid
               const ruleValid = filter.filters(newData);
               // if invalid we need to tell the field
               if (ruleValid == false) {
                  isValid = false;
                  // we also need to define an error message
                  fieldValidating.define(
                     "invalidMessage",
                     filter.invalidMessage
                  );
               }
            });
            return isValid;
         });
         formField.refresh();
      });
   }

   loadDcDataOfRecordRules() {
      (this.view?.settings?.recordRules ?? []).forEach((rule) => {
         (rule?.actionSettings?.valueRules?.fieldOperations ?? []).forEach(
            (op) => {
               if (op.valueType != "exist") return;

               const pullDataDC = this.AB.datacollections(
                  (dc) => dc.id == op.value
               )[0];

               if (
                  pullDataDC?.dataStatus ==
                  pullDataDC?.dataStatusFlag.notInitial
               ) {
                  pullDataDC.loadData();
               }
            }
         );
      });
   }

   onShow(data) {
      this._showed = true;

      const view = this.view;

      // call .onShow in the base component
      const superComponent = view.superComponent();
      superComponent.onShow();

      const $form = $$(this.ids.component);
      const dc = view.datacollection;
      if (dc) {
         if ($form) dc.bind($form);

         // clear current cursor on load
         // if (this.settings.clearOnLoad || _logic.callbacks.clearOnLoad() ) {
         if (view.settings.clearOnLoad) {
            dc.setCursor(null);
            this.displayData(null);
         }
         // if the cursor is cleared before or after we need to make
         // sure the reload view button does not appear
         if (view.settings.clearOnLoad || view.settings.clearOnSave) {
            const reloadViewId = `${this.ids.component}_reloadView`;
            $$(reloadViewId)?.getParentView()?.removeView(reloadViewId);
         }

         // pull data of current cursor
         const rowData = dc.getCursor();

         // do this for the initial form display so we can see defaults
         this.displayData(rowData);

         // select parent data to default value
         const linkDv = dc.datacollectionLink;
         if (linkDv && rowData == null) {
            const parentData = linkDv.getCursor();
            this.displayParentData(parentData);
         }
      } else {
         // show blank data in the form
         this.displayData(data ?? {});
      }

      //Focus on first focusable component
      this.focusOnFirst();

      if ($form) $form.adjust();
   }

   async displayData(rowData) {
      // If setTimeout is already scheduled, no need to do anything
      if (this.timerId) {
         return;
      } else {
         this.timerId = await timeout(80);
      }

      const customFields = this.view.fieldComponents(
         (comp) =>
            comp instanceof ABViewFormCustom ||
            // rich text
            (comp instanceof ABViewFormTextbox && comp.settings.type == "rich")
      );

      // Set default values
      if (rowData == null) {
         customFields.forEach((f) => {
            const field = f.field();
            if (!field) return;

            const comp = this.view.viewComponents[f.id];
            if (comp == null) return;

            // var colName = field.columnName;
            if (this._showed) comp?.onShow?.();

            // set value to each components
            const defaultRowData = {};
            field.defaultValue(defaultRowData);
            field.setValue($$(comp.ui.id), defaultRowData);

            comp?.refresh?.(defaultRowData);
         });
         const normalFields = this.view.fieldComponents(
            (comp) =>
               comp instanceof ABViewFormItem &&
               !(comp instanceof ABViewFormCustom)
         );
         normalFields.forEach((f) => {
            const field = f.field();
            if (!field) return;

            const comp = this.view.viewComponents[f.id];
            if (comp == null) return;

            if (f.key == "button") return;

            const colName = field.columnName;

            // set value to each components
            const values = {};
            field.defaultValue(values);
            $$(comp.ui.id)?.setValue(values[colName] ?? "");
         });
      }

      // Populate value to custom fields
      else {
         customFields.forEach((f) => {
            var comp = this.view.viewComponents[f.id];
            if (comp == null) return;

            if (this._showed) comp?.onShow?.();

            // set value to each components
            f?.field()?.setValue($$(comp.ui.id), rowData);

            comp?.refresh?.(rowData);
         });
      }

      this.timerId = undefined;
   }

   displayParentData(rowData) {
      const dc = this.view.datacollection;

      // If the cursor is selected, then it will not update value of the parent field
      const currCursor = dc.getCursor();
      if (currCursor != null) return;

      const relationField = dc.fieldLink;
      if (relationField == null) return;

      // Pull a component of relation field
      const relationFieldCom = this.view.fieldComponents((comp) => {
         if (!(comp instanceof ABViewFormItem)) return false;

         return comp.field() && comp.field().id == relationField.id;
      })[0];
      if (relationFieldCom == null) return;

      const relationFieldView = this.view.viewComponents[relationFieldCom.id];
      if (relationFieldView == null) return;

      const relationElem = $$(relationFieldView.ui.id),
         relationName = relationField.relationName();

      // pull data of parent's dc
      const formData = {};
      formData[relationName] = rowData;

      // set data of parent to default value
      relationField.setValue(relationElem, formData);
   }

   detatch() {
      // TODO: remove any handlers we have attached.
   }

   focusOnFirst() {
      let topPosition = 0;
      let topPositionId = "";
      this.view.views().forEach((item) => {
         if (item.key == "textbox" || item.key == "numberbox") {
            if (item.position.y == topPosition) {
               topPosition = item.position.y;
               topPositionId = item.id;
            }
         }
      });
      const childComponent = this.view.viewComponents[topPositionId];
      if (childComponent && $$(childComponent.ui.id)) {
         $$(childComponent.ui.id).focus();
      }
   }
};
