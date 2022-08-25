const ABViewLayoutCore = require("../../core/views/ABViewLayoutCore");
const ABViewLayoutComponent = require("./viewComponent/ABViewLayoutComponent");

module.exports = class ABViewLayout extends ABViewLayoutCore {
   /**
    * @function component()
    * return a UI component based upon this view.
    * @param {obj} v1App
    * @return {obj} UI component
    */
   component(v1App) {
      let component = new ABViewLayoutComponent(this);

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

   /**
    * @method componentOld()
    * return a UI component based upon this view.
    * @param {obj} App
    * @param {string} idPrefix
    *
    * @return {obj} UI component
    */
   componentOld(App, idPrefix) {
      let idBase = `ABViewLayout_${idPrefix || ""}${this.id}`;
      let ids = {
         component: App.unique(`${idBase}_component`),
      };

      this.viewComponents = this.viewComponents || {}; // { viewId: viewComponent, ..., viewIdn: viewComponent }

      let _ui = {
         id: ids.component,
         view: "layout",
         cols: [],
      };

      this.views().forEach((v) => {
         this.viewComponents[v.id] = v.component(App, idPrefix);
         _ui.cols.push(this.viewComponents[v.id].ui);

         // Trigger 'changePage' event to parent
         this.eventAdd({
            emitter: v,
            eventName: "changePage",
            listener: (pageId) => {
               this.changePage(pageId);
            },
         });
      });

      // make sure each of our child views get .init() called
      var _init = (options, accessLevel) => {
         this.views().forEach((v) => {
            var component = this.viewComponents[v.id];

            // initial sub-component
            if (component && component.init) {
               component.init(options, accessLevel);
            }
         });
      };

      var _onShow = () => {
         // calll .onShow in child components
         this.views().forEach((v) => {
            var component = this.viewComponents[v.id];

            if (component && component.onShow) {
               component.onShow();
            }
         });
      };

      return {
         ui: _ui,
         init: _init,
         // logic: _logic,

         onShow: _onShow,
      };
   }
};
