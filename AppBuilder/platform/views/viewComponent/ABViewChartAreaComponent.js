const ABViewChartContainerComponent = require("./ABViewChartContainerComponent");

module.exports = class ABViewChartAreaComponent extends (
   ABViewChartContainerComponent
) {
   constructor(baseView, idBase) {
      super(baseView, idBase ?? `ABViewChartArea_${baseView.id}`);
   }

   ui() {
      const settings = this.settings;

      return super.ui({
         view: "chart",
         type: settings.areaType,
         yAxis: {
            start: 0,
            step: settings.stepValue, //"#stepValue#",
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
         series: [
            {
               alpha: 0.7,
               value: "#value#",
               color: "#ee4339",
            },
            {
               alpha: 0.4,
               value: "#value2#",
               color: "#a7ee70",
            },
         ],
         height: settings.chartHeight,
         // width: settings.chartWidth,
      });
   }

   async init(AB) {
      await super.init(AB);
   }

   onShow() {
      super.onShow();
   }
};
