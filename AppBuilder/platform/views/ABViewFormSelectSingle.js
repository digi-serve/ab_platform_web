const ABViewFormSelectSingleCore = require("../../core/views/ABViewFormSelectSingleCore");
const ABViewFormSelectSingleComponent = require("./viewComponent/ABViewFormSelectSingleComponent");

module.exports = class ABViewFormSelectSingle extends (
   ABViewFormSelectSingleCore
) {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false) {
      let component = new ABViewFormSelectSingleComponent(this);

      // if this is our v1Interface
      if (v1App) {
         const newComponent = component;
         component = {
            ui: newComponent.ui(),
            init: (options, accessLevel) => {
               return newComponent.init(this.AB, accessLevel);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
      }

      return component;
   }
};
