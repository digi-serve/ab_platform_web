const ABViewDetailSelectivityCore = require("../../core/views/ABViewDetailSelectivityCore");
const ABViewDetailSelectivityComponent = require("./viewComponent/ABViewDetailSelectivityComponent");

module.exports = class ABViewDetailSelectivity extends (
   ABViewDetailSelectivityCore
) {
   /**
    * @component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @param {string} idPrefix
    *
    * @return {obj} UI component
    */
   component(v1App = false) {
      let component = new ABViewDetailSelectivityComponent(this);

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
};
