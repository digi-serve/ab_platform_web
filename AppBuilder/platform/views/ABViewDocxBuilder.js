const ABViewDocxBuilderCore = require("../../core/views/ABViewDocxBuilderCore");
const ABViewDocxBuilderComponent = require("./viewComponent/ABViewDocxBuilderComponent");

module.exports = class ABViewDocxBuilder extends ABViewDocxBuilderCore {
   /**
    * @function component()
    * return a UI component based upon this view.
    * @param {obj} v1App
    * @return {obj} UI component
    */
   component(v1App) {
      let component = new ABViewDocxBuilderComponent(this);

      // if this is our v1Interface
      if (v1App) {
         const newComponent = component;
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

   letUserDownload(blob, filename) {
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a); // we need to append the element to the dom -> otherwise it will not work in firefox
      a.click();
      a.remove(); //afterwards we remove the element again

      window.URL.revokeObjectURL(url);
   }
};
