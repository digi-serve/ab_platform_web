const ABFieldFormulaCore = require("../../core/dataFields/ABFieldFormulaCore");

module.exports = class ABFieldFormula extends ABFieldFormulaCore {
   // constructor(values, object) {
   //    super(values, object);
   // }

   ///
   /// Instance Methods
   ///

   // isValid() {
   //    const validator = super.isValid();

   //    // validator.addError('columnName', L('ab.validation.object.name.unique', 'Field columnName must be unique (#name# already used in this Application)').replace('#name#', this.name) );

   //    return validator;
   // }

   ///
   /// Working with Actual Object Values:
   ///

   // return the grid column header definition for this instance of ABFieldFormula
   columnHeader(options) {
      const config = super.columnHeader(options);

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
      // not support in the form widget
      return super.formComponent("fieldreadonly");
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
};
