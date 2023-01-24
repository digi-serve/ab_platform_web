const ABViewFormDatepickerCore = require("../../core/views/ABViewFormDatepickerCore");
const ABViewFormDatepickerComponent = require("./viewComponent/ABViewFormDatepickerComponent");

module.exports = class ABViewFormDatepicker extends ABViewFormDatepickerCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false) {
      let component = new ABViewFormDatepickerComponent(this);

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
