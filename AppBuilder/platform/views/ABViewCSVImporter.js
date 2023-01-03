const ABViewCSVImporterCore = require("../../core/views/ABViewCSVImporterCore");
const ABViewCSVImporterComponent = require("./viewComponent/ABViewCSVImporterComponent");

module.exports = class ABViewCSVImporter extends ABViewCSVImporterCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false, idBase) {
      var component = new ABViewCSVImporterComponent(this, idBase);

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
