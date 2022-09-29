const ABViewChartCore = require("../../core/views/ABViewChartCore");
const ABViewChartComponent = require("./viewComponent/ABViewChartComponent");

const ABViewChartPropertyComponentDefaults = ABViewChartCore.defaultValues();

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewChart extends ABViewChartCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false) {
      let component = new ABViewChartComponent(this);

      // if this is our v1Interface
      if (v1App) {
         const newComponent = component;

         component = {
            ui: newComponent.ui(),
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

   getDCChart() {
      if (!this._dcChart) this._dcChart = new webix.DataCollection();

      return this._dcChart;
   }

   refreshData() {
      const dc = this.datacollection;

      if (!dc) return;

      const labelCol = this.labelField();

      if (!labelCol) return;

      const columnName = this.valueField()?.columnName;

      if (!columnName) return;

      const colorList = [
         "#ee4339",
         "#ee9336",
         "#eed236",
         "#d3ee36",
         "#a7ee70",
         "#58dccd",
         "#36abee",
         "#476cee",
         "#a244ea",
         "#e33fc7",
      ];
      const dInfo = dc.getData();
      const results = [];

      dInfo.forEach((e, i) => {
         const label = labelCol.isConnection
            ? labelCol
                 .pullRelationValues(e)
                 .map?.((e) => e.text || "")
                 .join(", ") ?? labelCol.pullRelationValues(e).text
            : labelCol.format(e);
         const data = {};

         data.label = label;
         data.color = colorList[i % colorList.length];
         data.value = parseFloat(e[columnName] ?? 0);

         if (this.settings.isPercentage) {
            data.value = data.value
               ? // round decimal 2 digits
                 Math.round(
                    (data.value /
                       dInfo.reduce((sum, e) => sum + e[columnName], 0)) *
                       10000
                 ) / 100
               : 0;
         }

         if (this.settings.multipleSeries) {
            const columnName2 = this.valueField2()?.columnName;

            data.value2 = parseFloat(e[columnName2] ?? 0);

            if (this.settings.isPercentage)
               data.value2 = data.value2
                  ? // round decimal 2 digits
                    Math.round(
                       (data.value2 /
                          dInfo.reduce((sum, e) => sum + e[columnName2], 0)) *
                          10000
                    ) / 100
                  : 0;
         }

         results.push(data);
      });

      const dcChart = this.getDCChart();

      dcChart.clearAll();
      dcChart.parse(results);
   }

   componentOld() {}
};
