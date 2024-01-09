const ABFieldNumberCore = require("../../core/dataFields/ABFieldNumberCore");

let INIT_EDITOR = false;
// {bool} INIT_EDITOR
// Transition code between previous Framework and current.
// we now need to wait until webix is declared or accessible globally.

module.exports = class ABFieldNumber extends ABFieldNumberCore {
   constructor(values, object) {
      if (!INIT_EDITOR) {
         // NOTE: if you need a unique [edit_type] by your returned config.editor above:
         webix.editors.number = webix.extend(
            {
               // TODO : Validate number only
            },
            webix.editors.text
         );
         INIT_EDITOR = true;
      }
      super(values, object);
   }

   ///
   /// Working with Actual Object Values:
   ///

   /**
    * @method formComponent
    * returns a drag and droppable component that is used on the UI
    * interface builder to place form components related to this ABField.
    *
    * an ABField defines which form component is used to edit it's contents.
    * However, what is returned here, needs to be able to create an instance of
    * the component that will be stored with the ABViewForm.
    */
   // return the grid column header definition for this instance of ABFieldNumber
   columnHeader(options) {
      const config = super.columnHeader(options);

      config.editor = "number"; // [edit_type] simple inline editing.

      config.format = (d) => {
         const rowData = {};
         rowData[this.columnName] = d;

         return this.format(rowData);
      };

      return config;
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
      return super.formComponent("numberbox");
   }

   formComponentMobile() {
      return super.formComponent("mobile-numberbox");
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
