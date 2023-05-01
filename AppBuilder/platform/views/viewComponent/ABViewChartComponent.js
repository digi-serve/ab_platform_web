const ABViewContainerComponent = require("./ABViewContainerComponent");

module.exports = class ABViewChartComponent extends ABViewContainerComponent {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewChart_${baseView.id}`, ids);
   }

   async init(AB, accessLevel) {
      await super.init(AB, accessLevel);

      const $component = $$(this.ids.component);
      const abWebix = this.AB.Webix;

      if ($component) abWebix.extend($component, abWebix.ProgressBar);

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
            baseView.eventAdd({
               emitter: dc.datacollectionLink,
               eventName: "changeCursor",
               listener: () => {
                  baseView.refreshData();
               },
            });

         eventNames.forEach((evtName) => {
            baseView.eventAdd({
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
