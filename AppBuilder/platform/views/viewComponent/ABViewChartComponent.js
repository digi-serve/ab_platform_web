const ABViewContainerComponent = require("./ABViewContainerComponent");

module.exports = class ABViewChartComponent extends ABViewContainerComponent {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewChart_${baseView.id}`;

      super(baseView, idBase);

      this.view = baseView;
      this.AB = this.view.AB;
   }

   ui() {
      return {
         type: "form",
         borderless: true,
         rows: [
            {
               // view: "scrollview",
               body: super.ui(),
            },
         ],
      };
   }

   async init(AB) {
      this.AB = AB;

      // get webix.dashboard
      await super.init(AB, 2);

      const $component = $$(this.ids.component);

      if ($component) {
         webix.extend($component, webix.ProgressBar);
      }

      const baseView = this.view;
      const dc = baseView.datacollection;

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
            !("changeCursor" in dc.datacollectionLink._events)
         )
            baseView.eventAdd({
               emitter: dc.datacollectionLink,
               eventName: "changeCursor",
               listener: () => {
                  baseView.refreshData();
               },
            });

         eventNames.forEach((e) => {
            // Do we need this ? .eventAdd should check exists listener below
            // if (e in dc._events) return;

            baseView.eventAdd({
               emitter: dc,
               eventName: e,
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
