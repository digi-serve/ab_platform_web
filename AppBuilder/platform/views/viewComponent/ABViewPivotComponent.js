const ABViewComponent = require("./ABViewComponent").default;
const ABFieldCalculate = require("../../dataFields/ABFieldCalculate");
const ABFieldFormula = require("../../dataFields/ABFieldFormula");
const ABFieldNumber = require("../../dataFields/ABFieldNumber");

module.exports = class ABViewPivotComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewPivot_${baseView.id}`,
         Object.assign({ pivot: "" }, ids)
      );
   }

   ui() {
      const self = this;
      const settings = this.settings;
      const _ui = super.ui([
         {
            id: this.ids.pivot,
            view: "pivot",
            readonly: true,
            removeMissed: settings.removeMissed,
            totalColumn: settings.totalColumn,
            separateLabel: settings.separateLabel,
            min: settings.min,
            max: settings.max,
            height: settings.height,
            format: (value) => {
               const decimalPlaces = settings.decimalPlaces ?? 2;

               return value && value != "0"
                  ? parseFloat(value).toFixed(decimalPlaces || 0)
                  : value;
            },
            override: new Map([
               [
                  pivot.services.Backend,
                  class MyBackend extends pivot.services.Backend {
                     data() {
                        const dc = self.datacollection;
                        if (!dc) return webix.promise.resolve([]);

                        const object = dc.datasource;
                        if (!object) return webix.promise.resolve([]);

                        const data = dc.getData();
                        const dataMapped = data.map((d) => {
                           const result = {};

                           object.fields().forEach((f) => {
                              if (
                                 f instanceof ABFieldCalculate ||
                                 f instanceof ABFieldFormula ||
                                 f instanceof ABFieldNumber
                              )
                                 result[f.columnName] = d[f.columnName];
                              else result[f.columnName] = f.format(d);
                           });

                           return result;
                        });

                        // set pivot configuration
                        const settings = self.settings;
                        if (settings.structure)
                           this.setStructure(settings.structure);

                        return webix.promise.resolve(dataMapped);
                     }
                  },
               ],
            ]),
         },
      ]);

      delete _ui.type;

      return _ui;
   }

   async init(AB) {
      await super.init(AB);

      const ids = this.ids;

      const dc = this.datacollection;
      if (!dc) return;

      const object = dc.datasource;
      if (!object) return;

      const $pivot = $$(ids.pivot);

      const fields = object.fields().map((f) => {
         let fieldType = "text";

         switch (f.key) {
            case "calculate":
            case "formula":
            case "number":
               fieldType = "number";
               break;
            case "date":
            case "datetime":
               fieldType = "date";
               break;
         }

         return {
            id: f.columnName,
            value: f.label,
            type: fieldType,
         };
      });

      $pivot.define("fields", fields);
   }
};
