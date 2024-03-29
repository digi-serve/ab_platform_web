const ABViewTabCore = require("../../core/views/ABViewTabCore");

const ABViewTabComponent = require("./viewComponent/ABViewTabComponent");

module.exports = class ABViewTab extends ABViewTabCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false) {
      let component = new ABViewTabComponent(this);

      // if this is our v1Interface
      if (v1App) {
         const newComponent = component;

         component = {
            ui: newComponent.ui(),
            init: (options, accessLevel) => {
               return newComponent.init(this.AB);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
      }

      return component;
   }

   warningsEval() {
      super.warningsEval();

      let allViews = this.views();

      if (allViews.length == 0) {
         this.warningsMessage("has no tabs set");
      }

      // NOTE: this is done in ABView:
      // (this.views() || []).forEach((v) => {
      //    v.warningsEval();
      // });
   }
};
