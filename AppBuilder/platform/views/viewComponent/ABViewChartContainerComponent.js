const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewChartContainerComponent extends ABViewComponent {
   constructor(baseView, idBase) {
      super(baseView, idBase ?? `ABViewChartContainer_${baseView.id}`, {
         chart: "",
      });
   }

   ui(uiChartComponent) {
      const _ui = super.ui([
         Object.assign({ id: this.ids.chart }, uiChartComponent ?? {}),
      ]);

      delete _ui.type;

      return _ui;
   }

   async init(AB) {
      await super.init(AB);
   }

   onShow() {
      super.onShow();
      // if (!this._isShow) {

      // Mark this widget is showing
      const baseView = this.view;

      baseView._isShow = true;

      this.refreshData(baseView.parent.getDCChart());
      // }
   }

   refreshData(dcChart) {
      const $chart = $$(this.ids.chart);

      if ($chart?.data) $chart.data.sync(dcChart);
   }
};
