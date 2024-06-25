const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewOrgChartComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewOrgChart_${baseView.id}`,
         Object.assign(
            {
               chartView: "",
               chartDom: "",
            },
            ids
         )
      );
   }

   ui() {
      const ids = this.ids;
      const _ui = super.ui([
         {
            view: "template",
            template: `<div id="${ids.chartDom}"></div>`,
         },
      ]);

      delete _ui.type;

      return _ui;
   }

   async init(AB, accessLevel) {
      await super.init(AB, accessLevel);

      const $chartView = $$(this.ids.chartView);
      if ($chartView)
         this.AB.Webix.extend($chartView, this.AB.Webix.ProgressBar);
   }

   async loadOrgChartJs() {
      this.busy();

      const [orgChartLoader] = await Promise.all([
         import(
            /* webpackPrefetch: true */
            "../../../../js/orgchart-webcomponents.js"
         ),
         import(
            /* webpackPrefetch: true */
            "../../../../styles/orgchart-webcomponents.css"
         ),
      ]);

      this.OrgChart = orgChartLoader.default;

      this.ready();
   }

   async onShow() {
      super.onShow();

      this.busy();
      await this.loadOrgChartJs();
      await this.displayOrgChart();
      this.ready();
   }

   async displayOrgChart() {
      const baseView = this.view;
      const data = await this.pullData();

      const orgchart = new this.OrgChart({
         data,
         direction: baseView.settings.direction,
         depth: baseView.settings.depth,
         pan: baseView.settings.pan,
         zoom: baseView.settings.zoom,
         // visibleLevel: baseView.settings.visibleLevel,

         exportButton: baseView.settings.export,
         exportFilename: baseView.settings.exportFilename,

         // ajaxURLs: {
         //    children: function (nodeData) {
         //       console.info("nodeData: ", nodeData);
         //       return null;
         //    },
         // },
         nodeContent: "description",
      });

      const chartDom = document.querySelector(`#${this.ids.chartDom}`);
      if (chartDom) {
         chartDom.textContent = "";
         chartDom.innerHTML = "";
         chartDom.appendChild(orgchart);
      }
   }

   async pullData() {
      const view = this.view;
      const dc = view.datacollection;
      const cursor = dc?.getCursor();
      if (!cursor) return null;

      const valueField = view.valueField();
      const descriptionField = view.descriptionField();

      const chartData = {};
      chartData.name = dc.datasource.displayData(cursor);
      chartData.description = "";
      chartData.children = (cursor[valueField?.relationName()] ?? []).map(
         (f) => {
            return {
               name: valueField.datasourceLink.displayData(f),
               description:
                  descriptionField.format(f) ??
                  f[descriptionField.columnName] ??
                  "",
            };
         }
      );

      return chartData;
   }

   busy() {
      const $chartView = $$(this.ids.chartView);
      $chartView?.disable?.();
      $chartView?.showProgress?.({ type: "icon" });
   }

   ready() {
      const $chartView = $$(this.ids.chartView);
      $chartView?.enable?.();
      $chartView?.hideProgress?.();
   }
};
