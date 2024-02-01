const ABMobileViewLabelCore = require("../../core/mobile/ABMobileViewLabelCore");
// const ABViewLabelComponent = require("./viewComponent/ABViewLabelComponent");

module.exports = class ABMobileViewLabel extends ABMobileViewLabelCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   // component() {

   //    // return new ABViewLabelComponent(this);
   // }

   warningsEval() {
      super.warningsEval();

      if (!this.text) {
         this.warningsMessage("has no text value set.");
      }
   }
};
