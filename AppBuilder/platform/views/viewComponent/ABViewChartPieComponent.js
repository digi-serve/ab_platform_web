const ABViewChartContainerComponent = require("./ABViewChartContainerComponent");

module.exports = class ABViewChartPieComponent extends (
   ABViewChartContainerComponent
) {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewChartPie_${baseView.id}`;

      super(baseView, idBase);

      this.view = baseView;
      this.AB = this.view.AB;
   }

   ui() {
      const baseView = this.view;

      return {
         id: this.ids.component,
         view: "chart",
         type: baseView.settings.pieType,
         value: "#value#",
         color: "#color#",
         legend: baseView.settings.isLegend
            ? {
                 width: baseView.parent.settings.labelWidth,
                 template: `<div style='font-size: ${baseView.settings.labelFontSize}px;'>#label#</div>`,
              }
            : null,
         pieInnerText: `<div style='font-size: ${baseView.settings.innerFontSize}px;'>#value#</div>`,
         shadow: 1,
         height: baseView.settings.height,
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
