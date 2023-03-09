const ABViewComponent = require("./ABViewComponent").default;
const ABViewFormItem = require("../ABViewFormItem");
const ABViewFormConnect = require("../ABViewFormConnect");
const ABViewFormCustom = require("../ABViewFormCustom");
const ABViewFormTextbox = require("../ABViewFormTextbox");

async function timeout(ms) {
   return new Promise((resolve) => setTimeout(resolve, ms));
}

const fieldValidations = [];

module.exports = class ABViewFormComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewForm_${baseView.id}`,
         Object.assign(
            {
               form: "",

               layout: "",
               filterComplex: "",
               reloadView: `${
                  idBase || `ABViewForm_${baseView.id}`
               }_form_reloadView`,
            },
            ids
         )
      );

      this.timerId = null;

      this._showed = false;
   }

   ui() {
      const baseView = this.view;
      const superComponent = baseView.superComponent();
      const rows = superComponent.ui().rows ?? [];
      const fieldValidationsHolder = this.uiValidationHolder();
      const _ui = super.ui([
         {
            id: this.ids.form,
            view: "form",
            abid: baseView.id,
            rows: rows.concat(fieldValidationsHolder),
         },
      ]);

      delete _ui.type;

      return _ui;
   }

   uiValidationHolder() {
      const result = [
         {
            hidden: true,
            rows: [],
         },
      ];

      // NOTE: this._currentObject can be set in the KanBan Side Panel
      const baseView = this.view;
      const object = this.datacollection?.datasource ?? baseView._currentObject;

      if (!object) return result;

      const validationUI = [];
      const existsFields = baseView.fieldComponents();

      object
         // Pull fields that have validation rules
         .fields((f) => f?.settings?.validationRules)
         .forEach((f) => {
            const view = existsFields.find(
               (com) => f.id === com.settings.fieldId
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
               if (typeof Filter.ui === "function") {
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

   async init(AB, accessLevel, options = {}) {
      await super.init(AB);

      this.view.superComponent().init(AB, accessLevel, options);

      this.initCallbacks(options);
      this.initEvents();
      this.initValidationRules();
      this.loadDcDataOfRecordRules();

      const abWebix = this.AB.Webix;
      const $form = $$(this.ids.form);

      if ($form) {
         abWebix.extend($form, abWebix.ProgressBar);
      }

      if (accessLevel < 2) $form.disable();
   }

   initCallbacks(options = {}) {
      // ? We need to determine from these options whether to clear on load?
      if (options?.clearOnLoad) {
         // does this need to be a function?
         this.view.settings.clearOnLoad = options.clearOnLoad();
      }
      // Q: Should we use emit the event instead ?
      const baseView = this.view;

      if (options.onBeforeSaveData)
         baseView._callbacks.onBeforeSaveData = options.onBeforeSaveData;
      else baseView._callbacks.onBeforeSaveData = () => true;
   }

   initEvents() {
      // bind a data collection to form component
      const dc = this.datacollection;

      if (!dc) return;

      // listen DC events
      this.eventAdd({
         emitter: dc,
         eventName: "changeCursor",
         listener: (rowData) => {
            const baseView = this.view;
            const linkViaOneConnection = baseView.fieldComponents(
               (comp) => comp instanceof ABViewFormConnect
            );
            // clear previous xxx->one selections and add new from
            // cursor change
            linkViaOneConnection.forEach((f) => {
               const field = f.field();
               if (
                  field?.settings?.linkViaType == "one" &&
                  field?.linkViaOneValues
               ) {
                  delete field.linkViaOneValues;
                  if (rowData[field.columnName]) {
                     if (Array.isArray(rowData[field.columnName])) {
                        let valArray = [];
                        rowData[field.columnName].forEach((v) => {
                           valArray.push(v[field.object.PK()]);
                        });
                        field.linkViaOneValues = valArray.join();
                     } else {
                        field.linkViaOneValues = rowData[field.columnName];
                     }
                  }
               }
            });

            this.displayData(rowData);
         },
      });

      const ids = this.ids;

      this.eventAdd({
         emitter: dc,
         eventName: "initializingData",
         listener: () => {
            const $form = $$(ids.form);

            if ($form) {
               $form.disable();

               $form.showProgress?.({ type: "icon" });
            }
         },
      });

      this.eventAdd({
         emitter: dc,
         eventName: "initializedData",
         listener: () => {
            const $form = $$(ids.form);

            if ($form) {
               $form.enable();

               $form.hideProgress?.();
            }
         },
      });

      this.eventAdd({
         emitter: dc,
         eventName: "ab.datacollection.update",
         listener: (msg, data) => {
            if (!data?.objectId) return;

            const object = dc.datasource;

            if (!object) return;

            if (
               object.id === data.objectId ||
               object.fields((f) => f.settings.linkObject === data.objectId)
                  .length > 0
            ) {
               const currData = dc.getCursor();

               if (currData) this.displayData(currData);
            }
         },
      });

      // bind the cursor event of the parent DC
      const linkDv = dc.datacollectionLink;

      if (linkDv)
         // update the value of link field when data of the parent dc is changed
         this.eventAdd({
            emitter: linkDv,
            eventName: "changeCursor",
            listener: (rowData) => {
               this.displayParentData(rowData);
            },
         });
   }

   initValidationRules() {
      const dc = this.datacollection;

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
            // values: $$(ids.form).getValues(),
            invalidMessage: f.invalidMessage,
         });
      });

      const ids = this.ids;

      // use the lookup to build the validation rules
      Object.keys(complexValidations).forEach((key) => {
         // get our field that has validation rules
         const formField = $$(ids.form).queryView({
            name: key,
         });

         // store the rules in a data param to be used later
         formField.$view.complexValidations = complexValidations[key];
         // define validation rules
         formField.define("validate", function (nval, oval, field) {
            // get field now that we are validating
            const fieldValidating = $$(ids.form).queryView({
               name: field,
            });

            // default valid is true
            let isValid = true;

            // check each rule that was stored previously on the element
            fieldValidating.$view.complexValidations.forEach((filter) => {
               const object = dc.datasource;
               const data = this.getValues();

               // convert rowData from { colName : data } to { id : data }
               const newData = {};

               (object.fields() || []).forEach((field) => {
                  newData[field.id] = data[field.columnName];
               });

               // for the case of "this_object" conditions:
               if (data.uuid) newData["this_object"] = data.uuid;

               // use helper funtion to check if valid
               const ruleValid = filter.filters(newData);

               // if invalid we need to tell the field
               if (!ruleValid) {
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
      (this.settings?.recordRules ?? []).forEach((rule) => {
         (rule?.actionSettings?.valueRules?.fieldOperations ?? []).forEach(
            (op) => {
               if (op.valueType !== "exist") return;

               const pullDataDC = this.AB.datacollections(
                  (dc) => dc.id === op.value
               )[0];

               if (
                  pullDataDC &&
                  pullDataDC.dataStatus === pullDataDC.dataStatusFlag.notInitial
               )
                  pullDataDC.loadData();
            }
         );
      });
   }

   async onShow(data) {
      this._showed = true;

      const baseView = this.view;

      // call .onShow in the base component
      const superComponent = baseView.superComponent();

      await superComponent.onShow();

      const ids = this.ids;
      const $form = $$(this.ids.form);
      const dc = this.datacollection;

      if (dc) {
         // clear current cursor on load
         // if (this.settings.clearOnLoad || _logic.callbacks.clearOnLoad() ) {
         const settings = this.settings;

         if (settings.clearOnLoad) {
            dc.setCursor(null);
         }

         // if the cursor is cleared before or after we need to make
         // sure the reload view button does not appear
         if (settings.clearOnLoad || settings.clearOnSave)
            $$(ids.reloadView)?.getParentView()?.removeView(ids.reloadView);

         // pull data of current cursor
         const rowData = dc.getCursor();

         // do this for the initial form display so we can see defaults
         await this.displayData(rowData);

         if ($form) dc.bind($form);
      }
      // show blank data in the form
      else await this.displayData(data ?? {});

      //Focus on first focusable component
      this.focusOnFirst();

      if ($form) $form.adjust();
   }

   async displayData(rowData) {
      // If setTimeout is already scheduled, no need to do anything
      if (this.timerId) return;
      else this.timerId = await timeout(80);

      const baseView = this.view;
      const customFields = baseView.fieldComponents(
         (comp) =>
            comp instanceof ABViewFormCustom ||
            // rich text
            (comp instanceof ABViewFormTextbox && comp.settings.type === "rich")
      );

      // Set default values
      if (!rowData) {
         customFields.forEach((f) => {
            const field = f.field();

            if (!field) return;

            const comp = baseView.viewComponents[f.id];

            if (!comp) return;

            // var colName = field.columnName;
            if (this._showed) comp?.onShow?.();

            // set value to each components
            const defaultRowData = {};

            field.defaultValue(defaultRowData);
            field.setValue($$(comp.ids.formItem), defaultRowData);

            comp?.refresh?.(defaultRowData);
         });

         const normalFields = baseView.fieldComponents(
            (comp) =>
               comp instanceof ABViewFormItem &&
               !(comp instanceof ABViewFormCustom)
         );

         normalFields.forEach((f) => {
            const field = f.field();

            if (!field) return;

            const comp = baseView.viewComponents[f.id];

            if (!comp) return;

            if (f.key === "button") return;

            const colName = field.columnName;

            // set value to each components
            const values = {};

            field.defaultValue(values);
            $$(comp.ids.formItem)?.setValue(values[colName] ?? "");
         });

         // select parent data to default value
         const dc = this.datacollection;
         const linkDv = dc.datacollectionLink;

         if (linkDv) {
            const parentData = linkDv.getCursor();

            this.displayParentData(parentData);
         }
      }

      // Populate value to custom fields
      else
         customFields.forEach((f) => {
            const comp = baseView.viewComponents[f.id];

            if (!comp) return;

            if (this._showed) comp?.onShow?.();

            // set value to each components
            f?.field()?.setValue($$(comp.ids.formItem), rowData);

            comp?.refresh?.(rowData);
         });

      this.timerId = null;
   }

   displayParentData(rowData) {
      const dc = this.datacollection;

      // If the cursor is selected, then it will not update value of the parent field
      const currCursor = dc.getCursor();

      if (currCursor) return;

      const relationField = dc.fieldLink;

      if (!relationField) return;

      const baseView = this.view;
      // Pull a component of relation field
      const relationFieldCom = baseView.fieldComponents((comp) => {
         if (!(comp instanceof ABViewFormItem)) return false;

         return comp.field() && comp.field().id === relationField.id;
      })[0];

      if (!relationFieldCom) return;

      const relationFieldView = baseView.viewComponents[relationFieldCom.id];

      if (!relationFieldView) return;

      const $relationFieldView = $$(relationFieldView.ids.formItem),
         relationName = relationField.relationName();

      // pull data of parent's dc
      const formData = {};

      formData[relationName] = rowData;

      // set data of parent to default value
      relationField.setValue($relationFieldView, formData);
   }

   detatch() {
      // TODO: remove any handlers we have attached.
   }

   focusOnFirst() {
      const baseView = this.view;

      let topPosition = 0;
      let topPositionId = "";

      baseView.views().forEach((item) => {
         if (item.key === "textbox" || item.key === "numberbox")
            if (item.position.y === topPosition) {
               topPosition = item.position.y;
               topPositionId = item.id;
            }
      });

      const childComponent = baseView.viewComponents[topPositionId];

      if (childComponent && $$(childComponent.ids.formItem))
         $$(childComponent.ids.formItem).focus();
   }
};

