const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewChartContainerComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewChartContainer_${baseView.id}`,
         Object.assign(
            {
               chartContainer: "",
            },
            ids
         )
      );
   }

   ui(uiChartComponent) {
      const _ui = super.ui([
         Object.assign({ id: this.ids.chartContainer }, uiChartComponent ?? {}),
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
      const $chartContainer = $$(this.ids.chartContainer);
      const $chartComponent = $$(this.ids.component);

      if ($chartContainer?.data) $chartContainer.data.sync(dcChart);

      setTimeout(() => {
         $chartComponent?.adjust();
         $chartContainer?.adjust();
      }, 160);
   }
};
