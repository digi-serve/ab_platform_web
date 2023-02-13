const ABViewDetailCheckboxCore = require("../../core/views/ABViewDetailCheckboxCore");
const ABViewDetailCheckboxComponent = require("./viewComponent/ABViewDetailCheckboxComponent");

module.exports = class ABViewDetailCheckbox extends ABViewDetailCheckboxCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} v1App
    *
    * @return {obj} UI component
    */
   component(v1App) {
      let component = new ABViewDetailCheckboxComponent(this);

      // if this is our v1Interface
      if (v1App) {
         var newComponent = component;
         component = {
            ui: component.ui(),
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
