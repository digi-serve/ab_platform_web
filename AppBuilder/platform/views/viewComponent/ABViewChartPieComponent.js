const ABViewChartContainerComponent = require("./ABViewChartContainerComponent");

module.exports = class ABViewChartPieComponent extends (
   ABViewChartContainerComponent
) {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewChartPie_${baseView.id}`, ids);
   }

   ui() {
      const settings = this.settings;

      return super.ui({
         view: "chart",
         type: settings.pieType,
         value: "#value#",
         color: "#color#",
         legend: settings.isLegend
            ? {
                 width: this.view.parent.settings.labelWidth,
                 template: `<div style='font-size: ${settings.labelFontSize}px;'>#label#</div>`,
              }
            : null,
         pieInnerText: `<div style='font-size: ${settings.innerFontSize}px;'>#value#</div>`,
         shadow: 1,
         height: settings.height,
         // width: settings.chartWidth,
      });
   }


};
