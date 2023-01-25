const ABViewContainerComponent = require("./ABViewContainerComponent");

module.exports = class ABViewChartComponent extends ABViewContainerComponent {
   constructor(baseView, idBase) {
      super(baseView, idBase ?? `ABViewChart_${baseView.id}`);
   }

   ui() {
      return super.ui();
   }

   async init(AB, accessLevel) {
      await super.init(AB, accessLevel);

      const $component = $$(this.ids.component);

      if ($component) webix.extend($component, webix.ProgressBar);

      const baseView = this.view;
      const dc = this.datacollection;

      if (dc) {
         const eventNames = [
            "changeCursor",
            "create",
            "update",
            "delete",
            "initializedData",
         ];

         if (
            dc.datacollectionLink &&
            !("changeCursor" in (dc.datacollectionLink._events ?? []))
         )
            this.eventAdd({
               emitter: dc.datacollectionLink,
               eventName: "changeCursor",
               listener: () => {
                  baseView.refreshData();
               },
            });

         eventNames.forEach((evtName) => {
            this.eventAdd({
               emitter: dc,
               eventName: evtName,
               listener: () => {
                  baseView.refreshData();
               },
            });
         });
      }

      baseView.refreshData();
   }

   onShow() {
      super.onShow();
   }
};
