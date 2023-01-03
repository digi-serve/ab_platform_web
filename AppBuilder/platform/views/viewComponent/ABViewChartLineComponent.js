const ABViewChartContainerComponent = require("./ABViewChartContainerComponent");

module.exports = class ABViewChartLineComponent extends (
   ABViewChartContainerComponent
) {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewChartLine_${baseView.id}`;

      super(baseView, idBase);

      this.view = baseView;
      this.AB = this.view.AB;
   }

   ui() {
      const baseView = this.view;

      return {
         id: this.ids.component,
         view: "chart",
         type: baseView.settings.lineType,
         preset: baseView.settings.linePreset,
         value: "#value#",
         color: "#color#",
         yAxis: {
            start: 0,
            step: baseView.settings.stepValue,
            end: baseView.settings.maxValue, //"#maxValue#"
         },
         xAxis: {
            template: baseView.settings.isLegend
               ? `<div style='font-size:${baseView.settings.labelFontSize}px;'>#label#</div>`
               : "",
         },
         legend: baseView.settings.isLegend
            ? {
                 template: `<div style='font-size:${baseView.settings.labelFontSize}px;'>#label#</div>`,
                 values: [], // TODO : bug in webix 5.1.7
              }
            : null,
         height: baseView.settings.chartHeight,
         // width: baseView.settings.chartWidth,
      };
   }

   async init(AB) {
      super.init(AB);
   }

   onShow() {
      super.onShow();
   }
};
