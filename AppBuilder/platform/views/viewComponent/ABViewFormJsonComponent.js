const ABViewFormItemComponent = require("./ABViewFormItemComponent");

module.exports = class ABViewFormJsonComponent extends ABViewFormItemComponent {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewFormJson_${baseView.id}`, ids);
      if (this.settings.type == "filter") {
         this.rowFilter = this.AB.filterComplexNew(
            `${baseView.id}_filterComplex`,
            {
               isSaveHidden: true,
               height: 300,
               borderless: false,
               showObjectName: true,
            }
         );
      }
   }

   getFilterField(instance) {
      if (instance.settings.filterField) {
         let filterField = "";
         for (const [key, value] of Object.entries(
            instance.view.parent.viewComponents
         )) {
            if (value.settings.fieldId == instance.settings.filterField) {
               filterField = value;
            }
         }

         if (filterField?.ids?.formItem) {
            return filterField.ids.formItem;
         } else {
            return "";
         }
      } else {
         return "";
      }
   }

   get getSystemObjects() {
      // get list of all objects in the app
      let objects = this.AB.objects();
      // reformat objects into simple array for Webix multicombo
      // if you do not the data causes a maximum stack error
      let objectsArray = [];
      objects.forEach((obj) => {
         objectsArray.push({ id: obj.id, label: obj.label });
      });
      // return the simple array
      return objectsArray;
   }

   refreshFilter(values) {
      if (values) {
         let fieldDefs = [];
         values.forEach((obj) => {
            let object = this.AB.objectByID(obj);
            let fields = object.fields();
            if (fields.length) {
               fields.forEach((f) => {
                  fieldDefs.push(f);
               });
            }
         });
         this.rowFilter.fieldsLoad(fieldDefs);
         if ($$(this.ids.formItem).config.value)
            this.rowFilter.setValue($$(this.ids.formItem).config.value);
      } else {
         this.rowFilter.fieldsLoad([]);
         if ($$(this.ids.formItem).config.value)
            this.rowFilter.setValue($$(this.ids.formItem).config.value);
      }
   }

   getValue() {
      return this.rowFilter.getValue();
   }

   setValue(formVals) {
      $$(this.ids.formItem).config.value = formVals;
   }

   ui() {
      const _ui = {};

      switch (
         this.settings.type ||
         this.view.settings.type ||
         this.view.constructor.defaultValues().type
      ) {
         case "string":
            _ui.view = "textarea";
            _ui.height = 200;
            break;
         case "systemObject":
            _ui.view = "multicombo";
            _ui.placeholder = this.label("Select one or more system objects");
            _ui.button = false;
            _ui.suggest = {
               selectAll: true,
               body: {
                  data: this.getSystemObjects,
                  template: webix.template("#label#"),
               },
            };
            break;
         case "filter":
            _ui.view = "forminput";
            _ui.css = "ab-custom-field";
            _ui.body = this.rowFilter.ui;
            break;
      }

      return super.ui(_ui);
   }

   init() {
      // if (this.settings.type == "filter") {
      //    this.rowFilter.init({ showObjectName: true });
      // }
   }

   onShow() {
      const settings = this.view.settings ?? {};
      const _ui = this.ui();
      if (this.settings.type == "filter") {
         let filterField = this.getFilterField(this);
         if (!$$(filterField)) return;
         $$(filterField).detachEvent("onChange");
         $$(filterField).attachEvent("onChange", (values) => {
            this.refreshFilter(values);
         });
         this.rowFilter.init({ showObjectName: true });
         this.rowFilter.on("changed", (val) => {
            this.setValue(val);
         });
         if ($$(this.ids.formItem).config.value) {
            this.rowFilter.setValue($$(this.ids.formItem).config.value);
         } else {
            this.rowFilter.setValue("");
         }
      }
   }
};
