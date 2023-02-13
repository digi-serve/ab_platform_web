const ABViewDetailImageCore = require("../../core/views/ABViewDetailImageCore");
const ABViewDetailImageComponent = require("./viewComponent/ABViewDetailImageComponent");

module.exports = class ABViewDetailImage extends ABViewDetailImageCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} v1App
    * @param {string} idPrefix
    *
    * @return {obj} UI component
    */
   component(v1App, idPrefix) {
      let component = new ABViewDetailImageComponent(this);

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
      }

      return component;
   }
};
