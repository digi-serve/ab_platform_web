const ABViewLabelCore = require("../../core/views/ABViewLabelCore");
const ABViewLabelComponent = require("./viewComponent/ABViewLabelComponent");

module.exports = class ABViewLabel extends ABViewLabelCore {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues);
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewLabelComponent(this);
   }

   warningsEval() {
      super.warningsEval();

      if (!this.text) {
         this.warningsMessage("has no text value set.");
      }
   }
};
