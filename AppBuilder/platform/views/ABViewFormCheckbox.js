const ABViewFormCheckboxCore = require("../../core/views/ABViewFormCheckboxCore");
const ABViewFormCheckboxComponent = require("./viewComponent/ABViewFormCheckboxComponent");

module.exports = class ABViewFormCheckbox extends ABViewFormCheckboxCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App) {
      let component = new ABViewFormCheckboxComponent(this);

      // if this is our v1Interface
      if (v1App) {
         let newComponent = component;
         component = {
            ui: component.ui(),
            init: (options, accessLevel) => {
               return newComponent.init(this.AB, accessLevel);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
         component._ui = newComponent._ui;
      }

      return component;
   }

   componentOld(App) {
      // var component = super.component(App);

      // var idBase = this.parentFormUniqueID(`ABViewFormCheckbox_${this.id}_f_`);
      // var ids = {
      //    component: App.unique(`${idBase}_component`),
      // };

      // component.ui.id = ids.component;
      // component.ui.view = "checkbox";

      // // make sure each of our child views get .init() called
      // component.init = (options) => {};

      // return component;
   }
};
