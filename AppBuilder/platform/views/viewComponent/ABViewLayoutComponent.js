const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewLayoutComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewLayout_${baseView.id}`, ids);

      const viewComponents = this.viewComponents ?? {}; // { viewId: viewComponent, ..., viewIdn: viewComponent }

      baseView.views().forEach((v) => {
         try {
            viewComponents[v.id] = v.component();
         } catch (err) {
            // NOTE: The 'Layout' component supports only view component v2
            console.error(
               `View: [${v.key}] might need to be updated to new version`,
               err
            );
         }
      });

      this.viewComponents = viewComponents;
   }

   ui() {
      const viewComponents = this.viewComponents;
      const uiComponents = Object.keys(viewComponents)
         .map((vId) => viewComponents[vId].ui())
         .filter((ui) => ui);
      const _ui = super.ui([
         {
            view: "layout",
            cols: uiComponents,
         },
      ]);

      delete _ui.type;

      return _ui;
   }

   async init(AB, accessLevel) {
      await super.init(AB);

      const baseView = this.view;

      // make sure each of our child views get .init() called
      baseView.views().forEach((v) => {
         const component = this.viewComponents[v.id];

         // initial sub-component
         component?.init(AB, accessLevel);

         // Trigger 'changePage' event to parent
         baseView.eventAdd({
            emitter: v,
            eventName: "changePage",
            listener: (pageId) => {
               baseView.changePage(pageId);
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
