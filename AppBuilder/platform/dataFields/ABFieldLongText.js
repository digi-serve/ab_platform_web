var ABFieldLongTextCore = require("../../core/dataFields/ABFieldLongTextCore");

module.exports = class ABFieldLongText extends ABFieldLongTextCore {
   constructor(values, object) {
      super(values, object);

      /*
		{
			settings: {
				default: 'string',
				supportMultilingual: 1/0
			}
		}
		*/
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

   // return the grid column header definition for this instance of ABFieldLongText
   columnHeader(options) {
      var config = super.columnHeader(options);

      config.editor = "text"; // '[edit_type]'   for your unique situation
      // config.sort = 'string' // '[sort_type]'   for your unique situation
      config.template = (obj, common, value, col, ind) => {
         return (value || "").toString().replace(/[<]/g, "&lt;");
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
      // NOTE: what is being returned here needs to mimic an ABView CLASS.
      // primarily the .common() and .newInstance() methods.
      var formComponentSetting = super.formComponent();

      // .common() is used to create the display in the list
      formComponentSetting.common = () => {
         return {
            key: "textbox",
            settings: {
               type: "multiple",
            },
         };
      };

      return formComponentSetting;
   }

   detailComponent() {
      var detailComponentSetting = super.detailComponent();

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
