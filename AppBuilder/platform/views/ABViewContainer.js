const ABViewContainerCore = require("../../core/views/ABViewContainerCore");
const ABViewContainerComponent = require("./viewComponent/ABViewContainerComponent");

module.exports = class ABViewContainer extends ABViewContainerCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @param {string} idPrefix
    *
    * @return {obj} UI component
    */

   component(v1App = false) {
      let component = new ABViewContainerComponent(this);

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
