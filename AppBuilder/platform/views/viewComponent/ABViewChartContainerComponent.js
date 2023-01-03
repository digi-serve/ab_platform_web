const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewChartContainerComponent extends ABViewComponent {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewChartContainer_${baseView.id}`;

      super(baseView, idBase);

      this.view = baseView;
      this.AB = this.view.AB;
   }

   ui() {
      return {};
   }

   async init(AB) {
      super.init(AB);

      this.datacollection = this.view.parent.datacollection;
   }

   onShow() {
      super.onShow();
      // if (!this._isShow) {

      // Mark this widget is showing
      const baseView = this.view;

      baseView._isShow = true;

      const parentView = baseView.parent;

      this.refreshData(parentView.getDCChart());
      // }
   }

   refreshData(dcChart) {
      const $component = $$(this.ids.component);

      if ($component && $component.data) $component.data.sync(dcChart);
   }
};
