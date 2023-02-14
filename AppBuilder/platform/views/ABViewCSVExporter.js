const ABViewCSVExporterCore = require("../../core/views/ABViewCSVExporterCore");
const ABViewCSVExporterComponent = require("./viewComponent/ABViewCSVExporterComponent");

module.exports = class ABViewCSVExporter extends ABViewCSVExporterCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj } v1App
    * @param {string} idPrefix - define to support in 'Datacollection' widget
    *
    * @return {obj } UI component
    */
   component(v1App, idPrefix) {
      let component = new ABViewCSVExporterComponent(this);

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
