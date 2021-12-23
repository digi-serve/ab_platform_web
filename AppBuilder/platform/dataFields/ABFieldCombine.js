var ABFieldCombineCore = require("../../core/dataFields/ABFieldCombineCore");
var ABFieldComponent = require("./ABFieldComponent");

let L = (...params) => AB.Multilingual.label(...params);

var ids = {
   combinedFields: "ab-new-combined-combinedFields",
};

const defaultValues = ABFieldCombineCore.defaultValues();

/**
 * ABFieldCombineComponent
 *
 * Defines the UI Component for this Data Field.  The ui component is responsible
 * for displaying the properties editor, populating existing data, retrieving
 * property values, etc.
 *
 * @param {obj} App  the current Component Application instance for the current UI.
 * @return {obj} the Component object.
 */
var ABFieldCombineComponent = new ABFieldComponent({
   fieldDefaults: ABFieldCombineCore.defaults(),

   elements: (App, field) => {
      ids = field.idsUnique(ids, App);

      return [
         {
            id: ids.combinedFields,
            name: "combinedFields",
            view: "multicombo",
            label: L("Combined Fields"),
            labelWidth: this.AB.UISettings.config().labelWidthXLarge,
            disallowEdit: true,
            options: [],
         },
         {
            view: "richselect",
            name: "delimiter",
            label: L("Delimiter"),
            value: defaultValues.delimiter,
            labelWidth: this.AB.UISettings.config().labelWidthXLarge,
            disallowEdit: true,
            options: [
               { id: "plus", value: L("Plus ( + )") },
               { id: "dash", value: L("Dash ( - )") },
               { id: "period", value: L("Period ( . )") },
               { id: "space", value: L("Space ( )") },
            ],
         },
      ];
   },

   // defaultValues: the keys must match a .name of your elements to set it's default value.
   defaultValues: defaultValues,

   // rules: basic form validation rules for webix form entry.
   // the keys must match a .name of your .elements for it to apply
   rules: {
      // 'textDefault':webix.rules.isNotEmpty,
      // 'supportMultilingual':webix.rules.isNotEmpty
   },

   logic: {
      objectLoad: (object) => {
         ABFieldCombineComponent.CurrentObject = object;
      },

      show: () => {
         let fields = ABFieldCombineComponent.CurrentObject.fields((f) => {
            return (
               f.key == "string" ||
               f.key == "LongText" ||
               f.key == "number" ||
               f.key == "date" ||
               f.key == "datetime" ||
               f.key == "boolean" ||
               f.key == "list" ||
               f.key == "email" ||
               f.key == "user" ||
               f.key == "AutoIndex" ||
               f.key == "combined" ||
               (f.isConnection &&
                  // 1:M
                  ((f.settings.linkType == "one" &&
                     f.settings.linkViaType == "many") ||
                     // 1:1 isSource = true
                     (f.settings.linkType == "one" &&
                        f.settings.linkViaType == "one" &&
                        f.settings.isSource)))
            );
         }).map((f) => {
            return {
               id: f.id,
               value: f.label,
            };
         });

         let $combinedFields = $$(ids.combinedFields);
         if ($combinedFields) {
            $combinedFields.define("options", fields);
            $combinedFields.refresh();
         }
      },
   },

   // perform any additional setup actions here.
   // @param {obj} ids  the hash of id values for all the current form elements.
   //					 it should have your elements + the default Header elements:
   //						.label, .columnName, .fieldDescription, .showIcon
   init: function (ids) {},
});

module.exports = class ABFieldCombine extends ABFieldCombineCore {
   constructor(values, object) {
      super(values, object);
   }

   /*
    * @function propertiesComponent
    *
    * return a UI Component that contains the property definitions for this Field.
    *
    * @param {App} App the UI App instance passed around the Components.
    * @param {stirng} idBase
    * @return {Component}
    */
   static propertiesComponent(App, idBase) {
      return ABFieldCombineComponent.component(App, idBase);
   }

   ///
   /// Instance Methods
   ///
   isValid() {
      var validator = super.isValid();

      // validator.addError('columnName', L('ab.validation.object.name.unique', 'Field columnName must be unique (#name# already used in this Application)').replace('#name#', this.name) );

      return validator;
   }

   ///
   /// Working with Actual Object Values:
   ///

   // return the grid column header definition for this instance of ABFieldCombine
   columnHeader(options) {
      var config = super.columnHeader(options);

      config.editor = null; // read only
      config.css = "textCell";
      config.template = (rowData) => {
         return this.format(rowData);
      };

      return config;
   }

   /*
    * @funciton formComponent
    * returns a drag and droppable component that is used on the UI
    * interface builder to place form components related to this ABField.
    *
    * an ABField defines which form component is used to edit it's contents.
    * However, what is returned here, needs to be able to create an instance of
    * the component that will be stored with the ABViewForm.
    */
   formComponent() {
      return super.formComponent("fieldreadonly");
   }

   detailComponent() {
      let detailComponentSetting = super.detailComponent();

      detailComponentSetting.common = () => {
         return {
            key: "detailtext",
         };
      };

      return detailComponentSetting;
   }
};
