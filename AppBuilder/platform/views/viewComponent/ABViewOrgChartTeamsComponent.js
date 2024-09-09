const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewOrgChartTeamsComponent extends ABViewComponent {
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
            css: {
               position: "relative",
            },
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
      await this.pullData();
      this.displayOrgChart();
      this.ready();
   }

   async displayOrgChart() {
      const baseView = this.view;
      const chartData = this.AB.cloneDeep(this.chartData);

      const orgchart = new this.OrgChart({
         data: chartData,
         direction: baseView.settings.direction,
         // depth: baseView.settings.depth,
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

      setTimeout(() => {
         this._setColor();
      }, 1);
   }

   async pullData() {
      const view = this.view;
      const dc = view.datacollection;

      const cursor = dc?.getCursor();
      if (!cursor) return null;

      // TODO refactor props to only support one field (self linking)
      const valueField = view.valueFields()[0].columnName;
      // const descriptionField = view.descriptionField?.();

      const chartData = this.chartData;
      (chartData.name = cursor.Name), (chartData.description = "...");
      // description:
      //    descriptionField?.format?.(f) ??
      //    f[descriptionField?.columnName] ??
      //    "",
      chartData._rawData = cursor;

      function pullChildData(node) {
         node.children = [];
         node._rawData[valueField].forEach((id) => {
            const childData = dc.getData((e) => e.id === id)[0];
            const child = {
               name: childData.Name,
               description: "...",
               _rawData: childData,
            };
            if (childData[valueField].length > 0) {
               pullChildData(child);
            }
            node.children.push(child);
         });
         return;
      }

      pullChildData(chartData);
      //
      // let parentChartData = [chartData];
      // let currChildren;
      //
      // valueFields.forEach((field) => {
      //    let _tempParentChartData = [];
      //
      //    parentChartData.forEach(async (chartItem) => {
      //       if (!chartItem) return;
      //
      //       const rawData = chartItem?._rawData;
      //       currChildren = rawData?.[field?.relationName()];
      //
      //       // Pull data from the server
      //       if (!currChildren) {
      //          const objLink = field.object;
      //          const where = {
      //             glue: "and",
      //             rules: [],
      //          };
      //          where.rules.push({
      //             key: objLink.PK(),
      //             rule: "equals",
      //             value: rawData[objLink.PK()],
      //          });
      //          const returnData = await objLink
      //             .model()
      //             .findAll({ where, populate: true });
      //          chartItem._rawData = returnData?.data[0];
      //          currChildren = chartItem._rawData?.[field?.relationName()];
      //
      //          this.displayOrgChart();
      //       }
      //
      //       chartItem.children = [];
      //       if (currChildren?.length) {
      //          currChildren.forEach((childData) => {
      //             chartItem.children.push({
      //                name: field.datasourceLink.displayData(childData),
      //                description: "",
      //                _rawData: childData,
      //             });
      //          });
      //       }
      //
      //       _tempParentChartData = _tempParentChartData.concat(
      //          chartItem.children
      //       );
      //    });
      //
      //    parentChartData = _tempParentChartData;
      // });
   }

   get chartData() {
      if (this._chartData == null) {
         this._chartData = {};
      }
      return this._chartData;
   }

   _setColor() {
      const view = this.view;
      let doms = document.querySelectorAll(`org-chart`);
      doms.forEach((dom) => {
         dom.style.backgroundImage = "none";
      });

      doms = document.querySelectorAll(`
         org-chart .verticalNodes>td::before,
         org-chart .verticalNodes ul>li::before,
         org-chart .verticalNodes ul>li::after,
         org-chart .node .content,
         org-chart tr.lines .topLine,
         org-chart tr.lines .rightLine,
         org-chart tr.lines .leftLine`);
      doms.forEach((dom) => {
         dom.style.borderColor = view.settings.color;
      });

      doms = document.querySelectorAll(`
         org-chart tr.lines .downLine,
         org-chart .node .title`);
      doms.forEach((dom) => {
         dom.style.backgroundColor = view.settings.color;
      });
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
