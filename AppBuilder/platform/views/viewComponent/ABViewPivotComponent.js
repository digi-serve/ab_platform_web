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
      const uiPivot = {
         id: this.ids.pivot,
         view: "pivot",
         readonly: true,
         removeMissed: settings.removeMissed,
         totalColumn: settings.totalColumn,
         separateLabel: settings.separateLabel,
         min: settings.min,
         max: settings.max,
         height: settings.height,
         fields: this._getFields(),
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
                  async data() {
                     const dc = self.datacollection;
                     if (!dc) return webix.promise.resolve([]);

                     const object = dc.datasource;
                     if (!object) return webix.promise.resolve([]);

                     switch (dc.dataStatus) {
                        case dc.dataStatusFlag.notInitial:
                           await dc.loadData();
                           break;
                     }

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

                     return webix.promise.resolve(dataMapped);
                  }
               },
            ],
            [
               pivot.views.table,
               class CustomTable extends pivot.views.table {
                  CellFormat(value) {
                     const decimalPlaces = settings.decimalPlaces ?? 2;
                     if (!value) value = value === 0 ? "0" : "";
                     return value
                        ? parseFloat(value).toFixed(decimalPlaces)
                        : value;
                  }
               },
            ],
         ]),
      };

      if (settings.structure) uiPivot.structure = settings.structure;

      const _ui = super.ui([uiPivot]);
      delete _ui.type;

      return _ui;
   }

   _getFields() {
      const dc = this.datacollection;
      if (!dc) return [];

      const object = dc.datasource;
      if (!object) return [];

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

      return fields;
   }
};
