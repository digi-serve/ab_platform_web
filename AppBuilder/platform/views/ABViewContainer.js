const ABViewContainerCore = require("../../core/views/ABViewContainerCore");
const ABViewContainerComponent = require("./viewComponent/ABViewContainerComponent");

module.exports = class ABViewContainer extends ABViewContainerCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewContainerComponent(this);
   }

   warningsEval() {
      super.warningsEval();

      let allViews = this.views();

      if (allViews.length == 0) {
         this.warningsMessage("has no content");
      }

      // NOTE: this is done in ABView:
      // (allViews || []).forEach((v) => {
      //    v.warningsEval();
      // });
   }
};
