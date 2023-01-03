const ABViewDetailTextCore = require("../../core/views/ABViewDetailTextCore");
const ABViewDetailTextComponent = require("./viewComponent/ABViewDetailTextComponent");

// const ABViewDetailTextPropertyComponentDefaults = ABViewDetailTextCore.defaultValues();

// let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewDetailText extends ABViewDetailTextCore {
   /**
    * @param {obj} values  key=>value hash of ABView values
    * @param {ABApplication} application the application object this view is under
    * @param {ABView} parent the ABView this view is a child of. (can be null)
    */
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
   // editorComponent(App, mode) {
   //    var idBase = "ABViewDetailTextEditorComponent";
   //    var ids = {
   //       component: App.unique(`${idBase}_component`),
   //    };

   //    var textElem = this.component(App).ui;
   //    textElem.id = ids.component;

   //    var _ui = {
   //       rows: [textElem, {}],
   //    };

   //    var _init = (options) => {};

   //    var _logic = {};

   //    return {
   //       ui: _ui,
   //       init: _init,
   //       logic: _logic,
   //    };
   // }

   //
   // Property Editor
   //

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    *
    * @return {obj} UI component
    */
   component(v1App) {
      let component = new ABViewDetailTextComponent(this);

      // if this is our v1Interface
      if (v1App) {
         var newComponent = component;
         component = {
            ui: newComponent.ui(),
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

   componentOld(App, idPrefix) {
      var component = super.component(App);
      var field = this.field();
      var idBase = "ABViewDetailText_" + (idPrefix || "") + this.id;
      var ids = {
         component: App.unique(`${idBase}_component`),
         detail: this.parentDetailComponent()?.id || this.parent.id,
      };

      component.ui.id = ids.component;

      component.ui.css = "ab-text";

      if (this.settings.height) component.ui.height = this.settings.height;

      component.ui.on = {
         //Add data-cy attribute for Cypress Testing
         onAfterRender: () => {
            const dataCy = `detail text ${field?.columnName} ${field?.id} ${ids.detail}`;
            $$(ids.component)?.$view.setAttribute("data-cy", dataCy);
         },
      };

      return {
         ui: component.ui,
         init: component.init,

         logic: {
            setValue: (val) => {
               component.logic.setValue(ids.component, val);
            },
         },
      };
   }
};
