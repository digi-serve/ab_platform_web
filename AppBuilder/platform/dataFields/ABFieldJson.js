var ABFieldJsonCore = require("../../core/dataFields/ABFieldJsonCore");

module.exports = class ABFieldJson extends ABFieldJsonCore {
   // constructor(values, object) {
   //    super(values, object);
   // }

   ///
   /// Working with Actual Object Values:
   ///

   // return the grid column header definition for this instance of ABFieldJson
   columnHeader(options) {
      var config = super.columnHeader(options);

      // config.editor = null; // read only for now
      config.editor = "text";
      config.css = "textCell";

      // when called by ABViewFormCustom, will need a .template() fn.
      // currently we don't need to return anything so ...
      config.template = () => "";

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
      // read-only for now
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
