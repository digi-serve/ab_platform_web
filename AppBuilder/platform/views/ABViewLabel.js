const ABViewLabelCore = require("../../core/views/ABViewLabelCore");
const ABViewLabelComponent = require("./viewComponent/ABViewLabelComponent");

module.exports = class ABViewLabel extends ABViewLabelCore {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues);
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false) {
      let component = new ABViewLabelComponent(this);

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
