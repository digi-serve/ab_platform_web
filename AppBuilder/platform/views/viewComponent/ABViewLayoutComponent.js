const ABViewComponent = require("./ABViewComponent").default;
const ABViewLayoutCore = require("../../../core/views/ABViewLayoutCore");

const ABViewLayoutPropertyComponentDefaults = ABViewLayoutCore.defaultValues();

const L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewLayoutComponent extends ABViewComponent {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewLayout_${baseView.id}`;
      super(baseView, idBase, {
         component: "",
      });

      this.viewComponents = this.viewComponents ?? {}; // { viewId: viewComponent, ..., viewIdn: viewComponent }
      this.view.views().forEach((v) => {
         try {
            this.viewComponents[v.id] = v.component();
         } catch (err) {
            // NOTE: The 'Layout' component supports only view component v2
            console.error(
               `View: [${v.key}] might need to be updated to new version`,
               err
            );
         }
      });
   }

   ui() {
      const uiComponents = Object.keys(this.viewComponents ?? {})
         .map((vId) => this.viewComponents[vId].ui())
         .filter((ui) => ui);

      return {
         id: this.ids.component,
         view: "layout",
         cols: uiComponents,
      };
   }

   init(options, accessLevel) {
      // make sure each of our child views get .init() called
      this.view.views().forEach((v) => {
         const component = this.viewComponents[v.id];

         // initial sub-component
         component?.init(options, accessLevel);

         // Trigger 'changePage' event to parent
         this.view.eventAdd({
            emitter: v,
            eventName: "changePage",
            listener: (pageId) => {
               this.view.changePage(pageId);
            },
         });
      });
   }

   onShow() {
      // calll .onShow in child components
      this.view.views().forEach((v) => {
         const component = this.viewComponents[v.id];
         component?.onShow();
      });
   }
};
