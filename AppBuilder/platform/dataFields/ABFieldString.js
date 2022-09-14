const ABFieldStringCore = require("../../core/dataFields/ABFieldStringCore");

module.exports = class ABFieldString extends ABFieldStringCore {
   // constructor(values, object) {
   //    super(values, object);

   // {
   //   settings: {
   // 	  default: 'string',
   // 	  supportMultilingual: 1/0
   //   }
   // }

   // }

   ///
   /// Working with Actual Object Values:
   ///

   // return the grid column header definition for this instance of ABFieldString
   columnHeader(options) {
      const config = super.columnHeader(options);

      config.editor = "text";
      config.css = "textCell";
      // config.sort   = 'string'
      config.template = (obj, common, value /* , col, ind */) => {
         // if this isn't part of a group header display the default format
         if (!obj.$group) {
            return (value || "").toString().replace(/[<]/g, "&lt;");
         } else {
            return "";
         }
      };

      return config;
   }

   /**
    * @method defaultValue
    * insert a key=>value pair that represent the default value
    * for this field.
    * @param {obj} values a key=>value hash of the current values.
    */
   defaultValue(values) {
      // if no default value is set, then don't insert a value.
      if (!values[this.columnName]) {
         // Set default string
         if (this.settings.default) {
            if (this.settings.default.indexOf("{uuid}") >= 0) {
               values[this.columnName] = this.AB.uuid();
            } else {
               values[this.columnName] = this.settings.default;
            }
         }
      }
   }

   /**
    * @method isValidData
    * Parse through the given data and return an error if this field's
    * data seems invalid.
    * @param {obj} data  a key=>value hash of the inputs to parse.
    * @param {OPValidator} validator  provided Validator fn
    * @return {array}
    */
   isValidData(data, validator) {
      super.isValidData(data, validator);

      if (data && data[this.columnName]) {
         const max_length = this.constructor.defaults().MAX_CHAR_LENGTH;

         if (data[this.columnName].length > max_length) {
            const L = this.AB.Label();
            validator.addError(
               this.columnName,
               L("should NOT be longer than {0} characters", [max_length])
            );
         }
      }
   }

   /*
    * @property isMultilingual
    * does this field represent multilingual data?
    * @return {bool}
    */
   get isMultilingual() {
      return this.settings.supportMultilingual == 1;
   }

   /**
    * @method formComponent
    * returns a drag and droppable component that is used on the UI
    * interface builder to place form components related to this ABField.
    *
    * an ABField defines which form component is used to edit it's contents.
    * However, what is returned here, needs to be able to create an instance of
    * the component that will be stored with the ABViewForm.
    */
   formComponent() {
      // NOTE: what is being returned here needs to mimic an ABView CLASS.
      // primarily the .common() and .newInstance() methods.
      const formComponentSetting = super.formComponent();

      // .common() is used to create the display in the list
      formComponentSetting.common = () => {
         return {
            key: "textbox",
            settings: {
               type: "single",
            },
         };
      };

      return formComponentSetting;
   }

   detailComponent() {
      const detailComponentSetting = super.detailComponent();

      detailComponentSetting.common = () => {
         return {
            key: "detailtext",
         };
      };

      return detailComponentSetting;
   }

   /**
    * @method setValue
    * this function uses for form component and mass update popup
    * to get value of fields that apply custom editor
    *
    * @param {Object} item - Webix element
    * @param {Object} rowData - data of row
    *
    * @return {Object}
    */
   setValue(item, rowData) {
      super.setValue(item, rowData, "");
   }
};
