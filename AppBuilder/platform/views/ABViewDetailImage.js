const ABViewDetailImageCore = require("../../core/views/ABViewDetailImageCore");
const ABViewDetailImageComponent = require("./viewComponent/ABViewDetailImageComponent");

const ABViewDetailImagePropertyComponentDefaults = ABViewDetailImageCore.defaultValues();

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewDetailImage extends ABViewDetailImageCore {
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
      var idBase = "ABViewDetailImageEditorComponent";
      var ids = {
         component: App.unique(`${idBase}_component`),
      };

      var elem = this.component(App).ui;
      elem.id = ids.component;

      var _ui = {
         rows: [elem, {}],
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
    * @param {obj} v1App
    * @param {string} idPrefix
    *
    * @return {obj} UI component
    */
   component(v1App, idPrefix) {
      let component = new ABViewDetailImageComponent(this);

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
      }

      return component;
   }
};
