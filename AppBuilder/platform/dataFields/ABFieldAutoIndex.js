var ABFieldAutoIndexCore = require("../../core/dataFields/ABFieldAutoIndexCore");

module.exports = class ABFieldAutoIndex extends ABFieldAutoIndexCore {
   // constructor(values, object) {
   //    super(values, object);
   // }

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

   // return the grid column header definition for this instance of ABFieldAutoIndex
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
