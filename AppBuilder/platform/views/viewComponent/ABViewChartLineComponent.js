const ABViewChartContainerComponent = require("./ABViewChartContainerComponent");

module.exports = class ABViewChartLineComponent extends (
   ABViewChartContainerComponent
) {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewChartLine_${baseView.id}`, ids);
   }

   ui() {
      const settings = this.settings;

      return super.ui({
         view: "chart",
         type: settings.lineType,
         preset: settings.linePreset,
         value: "#value#",
         color: "#color#",
         yAxis: {
            start: 0,
            step: settings.stepValue,
            end: settings.maxValue, //"#maxValue#"
         },
         xAxis: {
            template: settings.isLegend
               ? `<div style='font-size:${settings.labelFontSize}px;'>#label#</div>`
               : "",
         },
         legend: settings.isLegend
            ? {
                 template: `<div style='font-size:${settings.labelFontSize}px;'>#label#</div>`,
                 values: [], // TODO : bug in webix 5.1.7
              }
            : null,
         height: settings.chartHeight,
         // width: settings.chartWidth,
      });
   }
};
