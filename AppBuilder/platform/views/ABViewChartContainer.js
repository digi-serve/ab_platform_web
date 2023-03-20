const ABViewWidget = require("./ABViewWidget");
const ABViewChartContainerComponent = require("./viewComponent/ABViewChartContainerComponent");

module.exports = class ABViewChartContainer extends ABViewWidget {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(/* v1App */) {
      return new ABViewChartContainerComponent(this);
      /*
      let component = new ABViewChartContainerComponent(this);

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
      */
   }

   get datacollection() {
      return this.parent.datacollection;
   }
};
