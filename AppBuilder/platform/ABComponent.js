const ABEmitter = require("./ABEmitter");

const CustomComponentManager = require("../../webix_custom_components/customComponentManager");

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABComponent extends ABEmitter {
   /**
    * @param {object} App
    *      ?what is this?
    * @param {string} idBase
    *      Identifier for this component
    */
   constructor(App, idBase, AB) {
      super();

      // Transition Code:
      // make sure we have an this.AB
      if (App && App.AB) {
         this.AB = App.AB;
      }

      // passed in AB will override
      if (AB) {
         this.AB = AB;
         // {ABFactory} AB
      }

      if (!App) {
         if (AB._App) {
            App = AB._App;
         } else {
            App = {
               uuid: AB.Webix.uid(),

               /*
                * AB
                * the {ABFactory} for our interface.
                */
               AB: AB,

               /*
                * actions:
                * a hash of exposed application methods that are shared among our
                * components, so one component can invoke an action that updates
                * another component.
                */
               actions: {},

               /*
                * config
                * webix configuration settings for our current browser
                */
               config: AB.UISettings.config(),

               /*
                * custom
                * a collection of custom components for this App Instance.
                */
               custom: null,

               /*
                * Icons
                * this will provide you with the list of avaialbe font awesome 4.7.0 icons to use in interface building
                */
               icons: AB.UISettings.icons,

               Label: L,

               /*
                * labels
                * a collection of labels that are common for the Application.
                */
               labels: {
                  add: L("Add"),
                  create: L("Create"),
                  delete: L("Delete"),
                  edit: L("Edit"),
                  export: L("Export"),
                  formName: L("Name"),
                  import: L("Import"),
                  rename: L("Rename"),
                  ok: L("Ok"),

                  cancel: L("Cancel"),
                  save: L("Save"),

                  yes: L("Yes"),
                  no: L("No"),

                  none: L("None"),
                  close: L("Close"),

                  default: L("Default"),
                  defaultPlaceholder: L("Enter default value"),

                  disable: L("Disable"),

                  required: L("Required"),
                  unique: L("Unique"),

                  invalidMessage: {
                     required: L("This field is required"),
                  },

                  createErrorMessage: L("System could not create <b>{0}</b>."),
                  createSuccessMessage: L("<b>{0}</b> is created."),

                  updateErrorMessage: L("System could not update <b>{0}</b>."),
                  updateSucessMessage: L("<b>{0}</b> is updated."),

                  deleteErrorMessage: L("System could not delete <b>{0}</b>."),
                  deleteSuccessMessage: L("<b>{0}</b> is deleted."),

                  renameErrorMessage: L("System could not rename <b>{0}</b>."),
                  renameSuccessMessage: L("<b>{0}</b> is renamed."),

                  // Data Field  common Property labels:
                  dataFieldHeaderLabel: L("Section Title"),
                  dataFieldHeaderLabelPlaceholder: L("Section Name"),

                  dataFieldLabel: L("Label"),
                  dataFieldLabelPlaceholder: L("Label"),

                  dataFieldColumnName: L("Field Name"),
                  dataFieldColumnNamePlaceholder: L("Database field name"),

                  dataFieldShowIcon: L("show icon?"),

                  componentDropZone: L("add widgets here"),
               },

               /*
                * unique()
                * A function that returns a globally unique Key.
                * @param {string} key   The key to modify and return.
                * @return {string}
                */
               unique: function (key) {
                  return `${key}${this.uuid}`;
               },
            };
            AB._App = App;
         }
      }

      if (!App.custom) {
         if (!AB.custom) {
            var componentManager = new CustomComponentManager();
            componentManager.initComponents(App);
         } else {
            App.custom = AB.custom;
         }
      }

      this.App = App;

      this.idBase = idBase || "?idbase?";
   }

   actions(_actions) {
      console.error("!!! REFACTOR out .actions()");
      if (_actions) {
         for (var a in _actions) {
            this.App.actions[a] = _actions[a];
         }
      }
   }

   Label() {
      return (...params) => {
         // console.error("!! App.label() depreciated.");
         return this.AB.Multilingual.label(...params);
      };
   }

   unique(key) {
      return this.App.unique(`${this.idBase}_${key}`);
   }
};
