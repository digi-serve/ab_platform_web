const ABViewKanbanCore = require("../../core/views/ABViewKanbanCore");
import ABViewKanBanComponent from "./viewComponent/ABViewKanBanComponent";

const ABViewPropertyLinkPage =
   require("./viewProperties/ABViewPropertyLinkPage").default;

export default class ABViewKanban extends ABViewKanbanCore {
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
      var idBase = "ABViewKanbanEditorComponent";

      var Kanban = this.component(App, idBase);

      return {
         ui: Kanban.ui,
         logic: Kanban.logic,
         onShow: Kanban.onShow,

         init: () => {
            // remove id of the component in caching for refresh .bind of the data collection
            let dv = this.datacollection;
            if (dv) dv.removeComponent(Kanban.ui.id);

            Kanban.init();
         },
      };
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */

   component(v1App = false) {
      let component = new ABViewKanBanComponent(this);

      // if this is our v1Interface
      if (v1App) {
         const newComponent = component;

         component = {
            ui: component.ui(),
            init: (options, accessLevel) => {
               return newComponent.init(this.AB);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
      }

      return component;
   }

   get linkPageHelper() {
      return (this.__linkPageHelper =
         this.__linkPageHelper || new ABViewPropertyLinkPage());
   }
}
