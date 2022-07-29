const ABViewFormCheckboxCore = require("../../core/views/ABViewFormCheckboxCore");

const ABViewComponent = require("./viewComponent/ABViewComponent").default;

module.exports = class ABViewFormCheckbox extends ABViewFormCheckboxCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   //
   //	Editor Related
   //

   /**
    * @method editorComponent
    * return the Editor for this UI component.
    * the editor should display either a "block" view or "preview" of
    * the current layout of the view.
    * @param {string} mode what mode are we in ['block', 'preview']
    * @return {Component}
    */
   editorComponent(App, mode) {
      var idBase = "ABViewFormCheckboxEditorComponent";
      var ids = {
         component: App.unique(`${idBase}_component`),
      };

      var checkboxElem = this.component(App).ui;
      checkboxElem.id = ids.component;

      var _ui = {
         rows: [checkboxElem, {}],
      };

      var _init = (options) => {};

      var _logic = {};

      return {
         ui: _ui,
         init: _init,
         logic: _logic,
      };
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App) {
      let component = super.component();

      component._ui = component.ui();
      component._ui.id = `ABViewFormCheckbox_${this.id}_f_`;

      component.ui = () => {
         component._ui.view = "checkbox";

         return component._ui;
      };

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
      var component = super.component(App);

      var idBase = this.parentFormUniqueID(`ABViewFormCheckbox_${this.id}_f_`);
      var ids = {
         component: App.unique(`${idBase}_component`),
      };

      component.ui.id = ids.component;
      component.ui.view = "checkbox";

      // make sure each of our child views get .init() called
      component.init = (options) => {};

      return component;
   }
};
