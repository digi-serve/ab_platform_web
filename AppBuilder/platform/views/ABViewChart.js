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
      if (dc == null) return this.dcChart;

      const labelCol = this.labelField();
      const valueCol = this.valueField();
      const valueCol2 = this.valueField2();

      if (!labelCol || !valueCol) return this.dcChart;

      // const labelColName = labelCol.columnName;
      const numberColName = valueCol.columnName;

      let numberColName2 = "";

      if (this.settings.multipleSeries && valueCol2) {
         numberColName2 = valueCol2.columnName;
      }

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

      let results = [];
      let sumData = {};
      let sumNumber = 0;
      let sumNumber2 = 0;
      let countNumber = dInfo.length;

      dInfo.forEach((item) => {
         const labelKey = labelCol.format(item) || item.id;

         let numberVal = parseFloat(item[numberColName] || 0);
         let numberVal2 = null;

         if (this.settings.multipleSeries)
            numberVal2 = parseFloat(item[numberColName2]) || 0;

         switch (valueCol.key) {
            //Formula Datatype
            case "formula":
               numberVal = valueCol.format(item);

               break;

            //Calcualte Datatype
            case "calculate":
               numberVal = parseFloat(
                  valueCol.constructor.convertToJs(
                     valueCol.object,
                     valueCol.settings.formula,
                     item,
                     valueCol.settings.decimalPlaces
                  )
               );

               break;

            default:
               break;
         }

         if (sumData[labelKey] == null) {
            let label = labelKey;

            // Get label of the connect field
            if (labelCol.isConnection) {
               let relateValues = labelCol.pullRelationValues(item);
               if (relateValues != null) {
                  if (Array.isArray(relateValues))
                     label = relateValues
                        .map((val) => val.text || "")
                        .join(", ");
                  else label = relateValues.text;
               }
            }

            if (this.settings.multipleSeries) {
               sumData[labelKey] = {
                  label: label || item.id,
                  value: 0,
                  value2: 0,
               };
            } else {
               sumData[labelKey] = {
                  label: label || item.id,
                  value: 0,
               };
            }
         }

         sumData[labelKey].value += numberVal;
         sumNumber += numberVal;

         if (this.settings.multipleSeries) {
            sumData[labelKey].value2 += numberVal2;
            sumNumber2 += numberVal2;
         }
      });

      let index = 0;

      for (const key in sumData) {
         let val = sumData[key].value;

         if (val <= 0) continue;

         // Display to percent values
         if (this.settings.isPercentage) {
            val = (val / sumNumber) * 100;
            val = Math.round(val * 100) / 100; // round decimal 2 digits
            val = val + " %";
         }

         if (this.settings.multipleSeries) {
            let val2 = sumData[key].value2;

            if (val2 <= 0) continue;

            // Display to percent values
            if (this.settings.isPercentage) {
               val2 = (val2 / sumNumber2) * 100;
               val2 = Math.round(val2 * 100) / 100; // round decimal 2 digits
               val2 = val2 + " %";
            }

            results.push({
               label: sumData[key].label,
               value: val,
               value2: val2,
               color: colorList[index % colorList.length],
               count: countNumber,
            });
         } else {
            results.push({
               label: sumData[key].label,
               value: val,
               color: colorList[index % colorList.length],
               count: countNumber,
            });
         }

         index += 1;
      }

      const dcChart = this.getDCChart();

      dcChart.clearAll();
      dcChart.parse(results);
   }

   // refreshData() {
   //    const dc = this.datacollection;

   //    if (!dc) return;

   //    const labelCol = this.labelField();

   //    if (!labelCol) return;

   //    const columnName = this.valueField()?.columnName;

   //    if (!columnName) return;

   //    const colorList = [
   //       "#ee4339",
   //       "#ee9336",
   //       "#eed236",
   //       "#d3ee36",
   //       "#a7ee70",
   //       "#58dccd",
   //       "#36abee",
   //       "#476cee",
   //       "#a244ea",
   //       "#e33fc7",
   //    ];
   //    const dInfo = dc.getData();
   //    const results = [];

   //    dInfo.forEach((e, i) => {
   //       const label = labelCol.isConnection
   //          ? labelCol
   //               .pullRelationValues(e)
   //               .map?.((e) => e.text || "")
   //               .join(", ") ?? labelCol.pullRelationValues(e).text
   //          : labelCol.format(e);
   //       const data = {};

   //       data.label = label;
   //       data.color = colorList[i % colorList.length];
   //       data.value = parseFloat(e[columnName] ?? 0);

   //       if (this.settings.isPercentage) {
   //          data.value = data.value
   //             ? // round decimal 2 digits
   //               Math.round(
   //                  (data.value /
   //                     dInfo.reduce((sum, e) => sum + e[columnName], 0)) *
   //                     10000
   //               ) / 100
   //             : 0;
   //       }

   //       if (this.settings.multipleSeries) {
   //          const columnName2 = this.valueField2()?.columnName;

   //          data.value2 = parseFloat(e[columnName2] ?? 0);

   //          if (this.settings.isPercentage)
   //             data.value2 = data.value2
   //                ? // round decimal 2 digits
   //                  Math.round(
   //                     (data.value2 /
   //                        dInfo.reduce((sum, e) => sum + e[columnName2], 0)) *
   //                        10000
   //                  ) / 100
   //                : 0;
   //       }

   //       results.push(data);
   //    });

   //    const dcChart = this.getDCChart();

   //    dcChart.clearAll();
   //    dcChart.parse(results);
   // }

   componentOld() {}
};
