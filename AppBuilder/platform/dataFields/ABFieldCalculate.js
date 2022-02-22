var ABFieldCalculateCore = require("../../core/dataFields/ABFieldCalculateCore");

module.exports = class ABFieldCalculate extends ABFieldCalculateCore {
   constructor(values, object) {
      super(values, object);
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

   // return the grid column header definition for this instance of ABFieldCalculate
   columnHeader(options) {
      var config = super.columnHeader(options);

      config.editor = null; // read only
      config.css = "textCell";
      config.template = (rowData) => {
         if (rowData.$group) return rowData[this.columnName];

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
      var detailComponentSetting = super.detailComponent();

      detailComponentSetting.common = () => {
         return {
            key: "detailtext",
         };
      };

      return detailComponentSetting;
   }
};
