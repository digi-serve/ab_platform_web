const ABViewFormNumberCore = require("../../core/views/ABViewFormNumberCore");
const ABViewFormNumberComponent = require("./viewComponent/ABViewFormNumberComponent");

const ABViewFormNumberPropertyComponentDefaults = ABViewFormNumberCore.defaultValues();

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewFormNumber extends ABViewFormNumberCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(App) {
      var component = super.component(App);
      var field = this.field();

      var idBase = this.parentFormUniqueID(`ABViewFormNumber_${this.id}_f_`);
      var ids = {
         component: App.unique(`${idBase}_component`),
      };

      var viewType = this.settings.isStepper
         ? "counter"
         : App.custom.numbertext.view;

      component.ui.id = ids.component;
      component.ui.view = viewType;
      component.ui.type = "number";
      component.ui.validate = (val) => {
         return !isNaN(val * 1);
      };

      // make sure each of our child views get .init() called
      component.init = (options) => {};

      return component;
   }
};
