const ABViewChartContainerComponent = require("./ABViewChartContainerComponent");

module.exports = class ABViewChartBarComponent extends (
   ABViewChartContainerComponent
) {
   constructor(baseView, idBase) {
      super(baseView, idBase ?? `ABViewChartBar_${baseView.id}`);
   }

   ui() {
      const settings = this.settings;

      return super.ui({
         view: "chart",
         type: settings.barType,
         preset: settings.barPreset,
         value: "#value#",
         color: "#color#",
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
         legend:
            settings.barType === "bar" || !settings.barType
               ? settings.isLegend
                  ? `<div style='font-size:${settings.labelFontSize}px;'>#label#</div>`
                  : ""
               : settings.isLegend
               ? {
                    template: `<div style='font-size:${settings.labelFontSize}px;'>#label#</div>`,
                    values: [], // TODO : bug in webix 5.1.7
                 }
               : null,
         height: settings.height,
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
