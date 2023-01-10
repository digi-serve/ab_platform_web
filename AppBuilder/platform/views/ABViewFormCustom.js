const ABViewFormCustomCore = require("../../core/views/ABViewFormCustomCore");
const ABViewFormCustomComponent = require("./viewComponent/ABViewFormCustomComponent");

module.exports = class ABViewFormCustom extends ABViewFormCustomCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false) {
      let component = new ABViewFormCustomComponent(this);

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
