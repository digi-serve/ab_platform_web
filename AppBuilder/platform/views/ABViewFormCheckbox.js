const ABViewFormCheckboxCore = require("../../core/views/ABViewFormCheckboxCore");
const ABViewFormCheckboxComponent = require("./viewComponent/ABViewFormCheckboxComponent");

module.exports = class ABViewFormCheckbox extends ABViewFormCheckboxCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App) {
      let component = new ABViewFormCheckboxComponent(this);

      // if this is our v1Interface
      if (v1App) {
         let newComponent = component;
         component = {
            ui: component.ui(),
            init: (options, accessLevel) => {
               return newComponent.init(this.AB, accessLevel);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
         component._ui = newComponent._ui;
      }

      return component;
   }
};
