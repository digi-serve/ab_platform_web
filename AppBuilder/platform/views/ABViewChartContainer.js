const ABViewWidget = require("./ABViewWidget");
const ABViewChartContainerComponent = require("./viewComponent/ABViewChartContainerComponent");

module.exports = class ABViewChartContainer extends ABViewWidget {
   editorComponent(App, mode, options) {
      let component = this.component(App);
      let _ui = component.ui;
      _ui.id = options.componentId;

      let _init = () => {
         component.init({
            componentId: _ui.id,
         });
      };
      let _logic = component.logic;
      let _onShow = component.onShow;

      return {
         ui: _ui,
         init: _init,
         logic: _logic,
         onShow: _onShow,
      };
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App) {
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
   }

   componentOld() {}
};
