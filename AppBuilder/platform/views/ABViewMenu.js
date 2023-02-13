const ABViewMenuCore = require("../../core/views/ABViewMenuCore");
const ABViewMenuComponent = require("./viewComponent/ABViewMenuComponent");

module.exports = class ABViewMenu extends ABViewMenuCore {
   /**
    * @function component()
    * return a UI component based upon this view.
    * @param {obj} v1App
    * @return {obj} UI component
    */
   component(v1App) {
      let component = new ABViewMenuComponent(this);

      // if this is our v1Interface
      if (v1App) {
         const newComponent = component;
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
