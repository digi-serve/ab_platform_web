const ABViewComponent = require("./ABViewComponent").default;
const ABFieldCalculate = require("../../dataFields/ABFieldCalculate");
const ABFieldFormula = require("../../dataFields/ABFieldFormula");
const ABFieldNumber = require("../../dataFields/ABFieldNumber");
const ABObjectQuery = require("../../ABObjectQuery");

module.exports = class ABViewPivotComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewPivot_${baseView.id}`,
         Object.assign({ pivot: "" }, ids)
      );
   }

   ui() {
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

      if ($pivot && object instanceof ABObjectQuery) {
         const customLabels = {};

         object.fields().forEach((f) => {
            customLabels[f.columnName] = f.label;
         });

         $pivot.define("fieldMap", customLabels);
      }

      const populateData = () => {
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

         $pivot.parse(dataMapped);

         const settings = this.settings;

         // set pivot configuration
         if (settings.structure) $pivot.setStructure(settings.structure);
      };

      this.view.eventAdd({
         emitter: dc,
         eventName: "initializedData",
         listener: () => {
            populateData();
         },
      });

      switch (dc.dataStatus) {
         case dc.dataStatusFlag.notInitial:
            dc.loadData();
            break;

         case dc.dataStatusFlag.initialized:
            populateData();
            break;
      }
   }
};
