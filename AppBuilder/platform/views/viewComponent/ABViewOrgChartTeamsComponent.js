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
               teamForm: "",
               teamFormPopup: "",
               teamFormSubmit: "",
               teamFormTitle: "",
               teamFormInactive: "",
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
         parentNodeSymbol: false,
         exportButton: baseView.settings.export,
         exportFilename: baseView.settings.exportFilename,
         createNode: ($node /*, data*/) => {
            $node.onclick = (e) => this.nodeClick(e);
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

      this.__orgchart = orgchart;

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
         this.toolbarUi(chartDom);
      }
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
      const teamInactive = this.getSettingField("teamInactive").columnName;

      const chartData = this.chartData;
      chartData.name = topNode[teamName] ?? "";
      chartData.id = this.teamNodeID(topNode.id);
      chartData._rawData = topNode;

      const maxDepth = 10; // prevent inifinite loop
      function pullChildData(node, prefixFn, depth = 0) {
         if (depth >= maxDepth) return;
         node.children = [];
         node._rawData[teamLink].forEach((id) => {
            const childData = dc.getData((e) => e.id === id)[0];
            // Don't show inactive teams
            // @TODO this should be a default filter option
            if (childData[teamInactive]) return;
            const child = {
               name: childData[teamName],
               id: prefixFn(id),
               description: "...",
               _rawData: childData,
            };
            if (childData[teamLink].length > 0) {
               pullChildData(child, prefixFn, depth + 1);
            }
            node.children.push(child);
         });
         // sort children alphabetically
         node.children = node.children.sort((a, b) =>
            a.name > b.name ? 1 : -1
         );
         return;
      }
      pullChildData(chartData, this.teamNodeID);
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

   nodeClick(event) {
      const recordID = this.teamRecordID(event.currentTarget.id);
      if (this.tool === "add") {
         this.teamForm("Add", { __parentID: recordID });
      } else if (this.tool === "edit") {
         const [values] = this.datacollection.getData((e) => e.id === recordID);
         this.teamForm("Edit", values);
      } else if (this.tool === "delete") {
         const [values] = this.datacollection.getData((e) => e.id === recordID);
         this.teamDelete(values);
      }
   }

   async teamAddChild(values) {
      const { id } = await this.datacollection.model.create(values);

      const linkField = this.AB.definitionByID(
         this.getSettingField("teamLink").settings.linkColumn
      ).columnName;
      const nameField = this.getSettingField("teamName").columnName;
      const parent = document.querySelector(
         `#${this.teamNodeID(values[linkField])}`
      );
      const hasChild = parent.parentNode.colSpan > 1;
      const newChild = {
         name: values[nameField],
         id: this.teamNodeID(id),
         relationship: hasChild ? "110" : "100",
      };
      // Need to add differently if the node already has child nodes
      if (hasChild) {
         const sibling = this.closest(parent, (el) => el.nodeName === "TABLE")
            .querySelector(".nodes")
            .querySelector(".node");
         this.__orgchart.addSiblings(sibling, { siblings: [newChild] });
      } else {
         this.__orgchart.addChildren(parent, {
            children: [newChild],
         });
      }
   }

   teamCanInactivate(values) {
      const isInactive = this.getSettingField("teamInactive").columnName;
      if (values[isInactive]) return true; // Allow activating inactive teams
      const canInactive = this.getSettingField("teamCanInactivate").columnName;
      if (!values[canInactive]) return false;
      const children = this.getSettingField("teamLink").columnName;
      if (values[children].length > 0) return false;
      // @TODO check for active assignment
      // if (hasActiveAssignment) return false;
      return true;
   }

   teamCanDelete(values) {
      const canInactive = this.getSettingField("teamCanInactivate").columnName;
      if (!values[canInactive]) return false;
      const children = this.getSettingField("teamLink").columnName;
      if (values[children].length > 0) return false;
      // @TODO check for any assignment
      // if (hasAssignment) return false;
      return true;
   }

   teamDelete(values) {
      if (!this.teamCanDelete(values)) {
         this.AB.Webix.message({
            text: "This team cannot be deleted",
            type: "error",
            expire: 1001,
         });
         return;
      }
      this.AB.Webix.confirm({
         text: "This can't be undone, are you sure?",
      }).then(() => {
         this.datacollection.model.delete(values.id);
         const nodeID = this.teamNodeID(values.id);
         this.__orgchart.removeNodes(document.querySelector(`#${nodeID}`));
      });
   }

   teamEdit(values) {
      this.datacollection.model.update(values.id, values).catch((err) => {
         //TODO
      });
      const nodeID = this.teamNodeID(values.id);
      const node = document.querySelector(`#${nodeID}`);
      const inactive = this.getSettingField("teamInactive").columnName;
      // @TODO this will need to check against active filters
      if (values[inactive]) {
         this.__orgchart.removeNodes(node);
      }
      const nameCol = this.getSettingField("teamName").columnName;
      node.querySelector(".title").innerHTML = values[nameCol];
   }

   teamForm(mode, values) {
      let $teamFormPopup = $$(this.ids.teamFormPopup);
      const inactive = this.getSettingField("teamInactive").columnName;
      const linkField = this.AB.definitionByID(
         this.getSettingField("teamLink").settings.linkColumn
      ).columnName;
      if (!$teamFormPopup) {
         const nameField = this.getSettingField("teamName");
         $teamFormPopup = webix.ui({
            view: "popup",
            id: this.ids.teamFormPopup,
            close: true,
            position: "center",
            body: {
               rows: [
                  {
                     view: "toolbar",
                     id: "myToolbar",
                     cols: [
                        {
                           view: "label",
                           label: `Edit Team`,
                           align: "left",
                           id: this.ids.teamFormTitle,
                        },
                        {
                           view: "button",
                           value: "X",
                           align: "right",
                           click: () => $teamFormPopup.hide(),
                        },
                     ],
                  },
                  {
                     view: "form",
                     id: this.ids.teamForm,
                     elements: [
                        {
                           view: "text",
                           label: nameField.label ?? nameField.columnName,
                           name: nameField.columnName,
                        },
                        {
                           view: "switch",
                           id: this.ids.teamFormInactive,
                           name: inactive,
                           label: "Inactive",
                        },
                        { view: "text", name: "id", hidden: true },
                        { view: "text", name: linkField, hidden: true },
                        {
                           view: "button",
                           id: this.ids.teamFormSubmit,
                           value: "Add",
                           css: "webix_primary",
                           click: () => {
                              const values = $$(this.ids.teamForm).getValues();
                              if (this.tool === "add") {
                                 this.teamAddChild(values);
                              } else if (this.tool === "edit") {
                                 this.teamEdit(values);
                              }
                              $teamFormPopup.hide();
                           },
                        },
                     ],
                  },
               ],
            },
         });
      }
      if (values.__parentID) {
         values[linkField] = values.__parentID;
         delete values.__parentID;
      }
      $$(this.ids.teamFormTitle).define("label", `${mode} Team`);
      $$(this.ids.teamFormTitle).refresh();
      $$(this.ids.teamFormSubmit).setValue(mode);
      $$(this.ids.teamForm).setValues(values);
      this.teamCanInactivate(values)
         ? $$(this.ids.teamFormInactive).enable()
         : $$(this.ids.teamFormInactive).disable();
      if (mode === "Edit") {
         // Check if we can inactivate
      }
      $teamFormPopup.show();
   }

   /**
    * generate a id for the team dom node based on it's record id
    * @param {string} id record id
    */
   teamNodeID(id) {
      return `teamnode_${id}`;
   }

   /**
    * extract the record id from the team dom node id
    * @param {string} id dom node id
    */
   teamRecordID(id) {
      return id.split("_")[1];
   }

   /**
    * Create toolbar ui
    * @param {HTMLElement} dom node
    */
   toolbarUi(dom) {
      const toolbar = document.createElement("div");
      toolbar.classList.add("team-chart-toolbar");
      ["add", "edit", "delete"].forEach((m) => {
         const button = document.createElement("button");
         button.classList.add("team-chart-button");
         button.textContent = m;
         button.onclick = () => (this.tool = m);
         toolbar.appendChild(button);
      });
      dom.appendChild(toolbar);
   }

   /**
    * Recursively finds the closest ancestor element that matches the provided function.
    * @param {Element} el - The starting element.
    * @param {Function} fn - The function to test against.
    * @return {Element|null} The closest matching ancestor element or null if no match is found.
    */
   closest(el, fn) {
      return (
         el &&
         (fn(el) && el !== document.querySelector(`#${this.ids.chartDom}`)
            ? el
            : this.closest(el.parentNode, fn))
      );
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
