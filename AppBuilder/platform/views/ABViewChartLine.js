const ABViewChartLineCore = require("../../core/views/ABViewChartLineCore");
const ABViewChartLineComponent = require("./viewComponent/ABViewChartLineComponent");

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewChartLine extends ABViewChartLineCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false) {
      let component = new ABViewChartLineComponent(this);

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
