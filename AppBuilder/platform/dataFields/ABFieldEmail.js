var ABFieldEmailCore = require("../../core/dataFields/ABFieldEmailCore");

module.exports = class ABFieldEmail extends ABFieldEmailCore {
   // constructor(values, object) {
   //    super(values, object);
   // }

   ///
   /// Instance Methods
   ///

   // isValid() {
   //    var validator = super.isValid();

   //    // validator.addError('columnName', L('ab.validation.object.name.unique', 'Field columnName must be unique (#name# already used in this Application)').replace('#name#', this.name) );

   //    return validator;
   // }

   ///
   /// Working with Actual Object Values:
   ///

   // return the grid column header definition for this instance of ABFieldBoolean
   columnHeader(options) {
      var config = super.columnHeader(options);

      config.editor = "text";

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
               type: "single",
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
};
