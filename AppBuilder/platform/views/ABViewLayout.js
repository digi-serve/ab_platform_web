const ABViewLayoutCore = require("../../core/views/ABViewLayoutCore");
const ABViewLayoutComponent = require("./viewComponent/ABViewLayoutComponent");

module.exports = class ABViewLayout extends ABViewLayoutCore {
   /**
    * @function component()
    * return a UI component based upon this view.
    * @param {obj} v1App
    * @return {obj} UI component
    */
   component(v1App) {
      let component = new ABViewLayoutComponent(this);

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
