const ABViewLayoutCore = require("../../core/views/ABViewLayoutCore");
const ABViewLayoutComponent = require("./viewComponent/ABViewLayoutComponent");

module.exports = class ABViewLayout extends ABViewLayoutCore {
   /**
    * @function component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewLayoutComponent(this);
   }

   warningsEval() {
      super.warningsEval();

      if (this._views.length == 0) {
         this.warningsMessage("has no columns set.");
      }
   }
};
