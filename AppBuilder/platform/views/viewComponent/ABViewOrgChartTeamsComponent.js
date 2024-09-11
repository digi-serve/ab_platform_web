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
         import(
            /* webpackPrefetch: true */
            "../../../../styles/team-widget.css"
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
      const draggable = baseView.settings.draggable == 1;

      const orgchart = new this.OrgChart({
         data: chartData,
         direction: baseView.settings.direction,
         // depth: baseView.settings.depth,
         chartContainer: `#${this.ids.chartDom}`,
         pan: true, // baseView.settings.pan == 1,
         zoom: true, //baseView.settings.zoom == 1,
         draggable,
         // visibleLevel: baseView.settings.visibleLevel,

         exportButton: baseView.settings.export,
         exportFilename: baseView.settings.exportFilename,
         createNode: ($node /*, data*/) => {
            // remove built in icon
            $node.querySelector(".title > i")?.remove();
            // customize
            const $content = $node.querySelector(".content");
            $content.innerHTML = "";
            const $leaderSection = document.createElement("div");
            $leaderSection.classList.add("team-leader-section");
            $content.append($leaderSection);
         },

         nodeContent: "description",
      });

      if (draggable) {
         // On drop update the parent (dropZone) of the node
         orgchart.addEventListener("nodedropped.orgchart", (event) => {
            const dragNode = JSON.parse(
               event.detail.draggedNode.dataset.source
            );
            const dropNode = JSON.parse(event.detail.dropZone.dataset.source);
            const dragRecord = dragNode._rawData;
            const dropID = dropNode._rawData.id;

            const linkField = this.getSettingField("teamLink");
            const parent = this.AB.definitionByID(
               linkField.settings.linkColumn
            );
            dragRecord[parent.columnName] = dropID;

            this.datacollection.model.update(dragRecord.id, dragRecord);
         });
      }

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
      await dc?.waitForDataCollectionToInitialize(dc);

      let topNode = dc?.getCursor();
      if (view.settings.topTeam) {
         const topNodeColumn = this.AB.definitionByID(
            view.settings.topTeam
         ).columnName;
         const topFromFeild = dc.getData((e) => e[topNodeColumn] === 1)[0];
         topNode = topFromFeild ? topFromFeild : topNode;
      }
      if (!topNode) return null;

      const teamLink = this.getSettingField("teamLink").columnName;
      const teamName = this.getSettingField("teamName").columnName;

      const chartData = this.chartData;
      chartData.name = topNode[teamName] ?? "";
      chartData._rawData = topNode;

      function pullChildData(node) {
         console.log(node.name, node._rawData[teamLink]);
         node.children = [];
         node._rawData[teamLink].forEach((id) => {
            const childData = dc.getData((e) => e.id === id)[0];
            const child = {
               name: childData[teamName],
               description: "...",
               _rawData: childData,
            };
            if (childData[teamLink].length > 0) {
               pullChildData(child);
            }
            node.children.push(child);
         });
         return;
      }
      pullChildData(chartData);
   }

   get chartData() {
      if (this._chartData == null) {
         this._chartData = {};
      }
      return this._chartData;
   }

   /**
    * Get the ABField from settings
    * @param {string} setting key in this.view.settings - should be an id for an
    * ABField
    */
   getSettingField(setting) {
      return this.AB.definitionByID(this.view.settings[setting]);
   }

   _setColor() {
      return;
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
