const ABViewDetailCore = require("../../core/views/ABViewDetailCore");
const ABViewDetailComponent = require("./viewComponent/ABViewDetailComponent");

module.exports = class ABViewDetail extends ABViewDetailCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj } v1App
    * @param {string} idPrefix - define to support in 'Datacollection' widget
    *
    * @return {obj } UI component
    */
   component(v1App, idPrefix) {
      let component = new ABViewDetailComponent(this);

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
