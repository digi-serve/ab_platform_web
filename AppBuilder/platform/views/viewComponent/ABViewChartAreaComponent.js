const ABViewChartContainerComponent = require("./ABViewChartContainerComponent");

module.exports = class ABViewChartAreaComponent extends (
   ABViewChartContainerComponent
) {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewChartArea_${baseView.id}`;

      super(baseView, idBase);

      this.view = baseView;
      this.AB = this.view.AB;
   }

   ui() {
      const baseView = this.view;

      const _ui = {
         id: this.ids.component,
         view: "chart",
         type: baseView.settings.areaType,
         yAxis: {
            start: 0,
            step: baseView.settings.stepValue, //"#stepValue#",
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
         height: baseView.settings.chartHeight,
         // width: baseView.settings.chartWidth,
      };

      return _ui;
   }

   async init(AB) {
      super.init(AB);
   }

   onShow() {
      super.onShow();
   }
};
