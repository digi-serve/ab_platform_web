const ABViewDetailConnectCore = require("../../core/views/ABViewDetailConnectCore");
const ABViewPropertyAddPage =
   require("./viewProperties/ABViewPropertyAddPage").default;

const ABViewDetailConnectComponent = require("./viewComponent/ABViewDetailConnectComponent");

module.exports = class ABViewDetailConnect extends ABViewDetailConnectCore {
   ///
   /// Instance Methods
   ///

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      this.addPageTool.fromSettings(this.settings);
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} v1App
    * @param {string} idPrefix
    *
    * @return {obj} UI component
    */
   component(v1App, idPrefix) {
      let component = new ABViewDetailConnectComponent(this);

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

   get addPageTool() {
      if (this.__addPageTool == null)
         this.__addPageTool = new ABViewPropertyAddPage();

      return this.__addPageTool;
   }
};
