const ABViewPageCore = require("../../core/views/ABViewPageCore");

const ABPropertyComponentDefaults = ABViewPageCore.defaultValues();

module.exports = class ABViewPage extends ABViewPageCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @function component()
    * return a UI component based upon this view.
    * @param {obj} v1App
    * @return {obj} UI component
    */
   component(v1App = false) {
      var component = super.component();

      component._ui = component.ui();

      // wrap our ABViewContainer in our Page scrollview
      component.ui = () => {
         return {
            view: "scrollview",
            borderless: true,
            css:
               this.settings.pageBackground ||
               ABPropertyComponentDefaults.pageBackground,
            body: component._ui,
         };
      };

      // if this is our v1Interface
      if (v1App) {
         var newComponent = component;
         component = {
            ui: component.ui(),
            init: (options, accessLevel) => {
               accessLevel = accessLevel ?? this.getUserAccess();
               return newComponent.init(this.AB, accessLevel, options);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
      }

      return component;
   }

   warningsEval() {
      super.warningsEval();

      let allViews = this.views();

      if (allViews.length == 0) {
         this.warningsMessage("has no sub views");
      }

      (this.pages() || []).forEach((p) => {
         p.warningsEval();
      });
   }
};
