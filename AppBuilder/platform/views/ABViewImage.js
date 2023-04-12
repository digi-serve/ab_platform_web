const ABViewImageCore = require("../../core/views/ABViewImageCore");
const ABViewImageComponent = require("./viewComponent/ABViewImageComponent");

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewImage extends ABViewImageCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   //
   //	Editor Related
   //

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewImageComponent(this);
   }

   warningsEval() {
      super.warningsEval();

      if (!this.settings.filename) {
         this.warningsMessage(`has no image set`);
      }
   }
};
