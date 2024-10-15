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
      const AB = this.AB;
      const chartData = AB.cloneDeep(this.chartData);
      const settings = baseView.settings;
      const draggable = settings.draggable === 1;
      const nodeObj = baseView.datacollection?.datasource;
      const nodeObjPK = nodeObj.PK();
      const contentField = nodeObj.fieldByID(settings.contentField);
      const contentFieldColumnName = contentField.columnName;
      const contentFieldLink = contentField.fieldLink;
      const contentObj = contentFieldLink.object;
      const contentObjPK = contentObj.PK();
      const contentDataRecordPKs = [];
      const getContentDataRecordPKs = (node) => {
         const contentFieldData = node._rawData[contentFieldColumnName];
         if (Array.isArray(contentFieldData))
            contentDataRecordPKs.push(...contentFieldData);
         else contentDataRecordPKs.push(contentFieldData);
         const children = node.children || [];
         for (const child of children) getContentDataRecordPKs(child);
      };
      getContentDataRecordPKs(chartData);
      const contentDataRecords = (
         await contentObj.model().findAll({
            where: {
               glue: "and",
               rules: [
                  {
                     key: contentObjPK,
                     rule: "in",
                     value: contentDataRecordPKs,
                  },
               ],
            },
            populate: true,
         })
      ).data;
      const contentGroupByField = contentObj.fieldByID(
         settings.contentGroupByField
      );
      const contentGroupOptions = contentGroupByField.settings.options;
      const contentGroupOptionsLength = contentGroupOptions.length;
      const contentGroupByFieldColumnName = contentGroupByField.columnName;
      const contentFieldLinkColumnName = contentFieldLink.columnName;
      const contentObjID = contentObj.id;
      const contentDisplayedFields = settings.contentDisplayedFields;
      const contentDisplayedFieldsKeys = Object.keys(contentDisplayedFields);
      const orgchart = new this.OrgChart({
         createNode: async ($node, data) => {
            const nodeWidth = 300;
            const nodeStyle = $node.style;
            nodeStyle["width"] = `${nodeWidth}px`;
            const $contentNode = $node.children.item(1);
            $contentNode.innerHTML = "";
            const contentNodeStyle = $contentNode.style;

            //  Team content buckets
            contentNodeStyle["height"] = `${
               // TODO (Guy): Fix the number later.
               contentGroupOptionsLength * 150
            }px`;
            const groupBorderWidth = 5;
            contentNodeStyle["width"] = `${nodeWidth - 2 * groupBorderWidth}px`;
            const averageHeight = 100 / contentGroupOptionsLength;
            const currentNodeDataRecordPK = data._rawData[nodeObjPK];
            for (const group of contentGroupOptions) {
               const $group = document.createElement("div");
               $contentNode.appendChild($group);
               const groupStyle = $group.style;
               groupStyle["height"] = `${averageHeight}%`;
               groupStyle["borderStyle"] = "solid";
               groupStyle["borderWidth"] = `${groupBorderWidth}px`;
               const groupColor = group.hex;
               groupStyle["borderColor"] = groupColor;
               const $groupTitle = document.createElement("div");
               const groupTitleStyle = $groupTitle.style;
               groupTitleStyle["backgroundColor"] = groupColor;
               groupTitleStyle["height"] = "20%";
               const groupText = group.text;
               $groupTitle.appendChild(document.createTextNode(groupText));
               $group.appendChild($groupTitle);
               const $groupContent = document.createElement("div");
               $group.appendChild($groupContent);
               const groupContentStyle = $groupContent.style;
               groupContentStyle["overflow"] = "auto";
               groupContentStyle["height"] = "80%";
               let contentDataRecordIndex = 0;
               while (
                  contentDataRecordIndex < contentDataRecords.length &&
                  contentDataRecords.length > 0
               ) {
                  const contentDataRecord =
                     contentDataRecords[contentDataRecordIndex];
                  if (
                     contentDataRecord[contentFieldLinkColumnName] !==
                        currentNodeDataRecordPK ||
                     contentDataRecord[contentGroupByFieldColumnName] !==
                        groupText
                  ) {
                     contentDataRecordIndex++;
                     continue;
                  }
                  contentDataRecords.splice(contentDataRecordIndex, 1);
                  const contentDataRecordPK = contentDataRecord[contentObjPK];
                  const rowDataID = `${currentNodeDataRecordPK}.${contentDataRecordPK}`;
                  const $rowData = document.createElement("div");
                  $groupContent.appendChild($rowData);
                  $rowData.setAttribute("id", rowDataID);
                  draggable && $rowData.setAttribute("draggable", "true");
                  const rowDataStyle = $rowData.style;
                  rowDataStyle["borderStyle"] = "solid";
                  rowDataStyle["borderColor"] = "black";
                  let currentDataRecords = [];
                  let currentField = null;
                  for (let j = 0; j < contentDisplayedFieldsKeys.length; j++) {
                     const displayedFieldKey = contentDisplayedFieldsKeys[j];
                     const [atDisplay, objID] = displayedFieldKey.split(".");
                     const displayedObj = AB.objectByID(objID);
                     const displayedObjPK = displayedObj.PK();
                     const displayedField = displayedObj.fieldByID(
                        contentDisplayedFields[displayedFieldKey]
                     );
                     switch (objID) {
                        case contentObjID:
                           currentDataRecords = [contentDataRecord];
                           break;
                        default:
                           if (currentField == null) break;
                           if (currentDataRecords.length > 0) {
                              const currentFieldColumnName =
                                 currentField.columnName;
                              const currentDataPKs = [];
                              do {
                                 const currentFieldData =
                                    currentDataRecords.pop()[
                                       currentFieldColumnName
                                    ];
                                 if (Array.isArray(currentFieldData)) {
                                    if (currentFieldData.length > 0)
                                       currentDataPKs.push(...currentFieldData);
                                 } else if (currentFieldData != null)
                                    currentDataPKs.push(currentFieldData);
                              } while (currentDataRecords.length > 0);
                              currentDataRecords = (
                                 await displayedObj.model().findAll({
                                    where: {
                                       glue: "and",
                                       rules: [
                                          {
                                             key: displayedObj.PK(),
                                             rule: "in",
                                             value: currentDataPKs,
                                          },
                                       ],
                                    },
                                    populate: true,
                                 })
                              ).data;
                           }
                           break;
                     }
                     if (
                        contentDisplayedFieldsKeys[j + 1]?.split(".")[0] ===
                        atDisplay
                     ) {
                        currentField = displayedField;
                        continue;
                     }
                     const $currentDisplay = document.createElement("div");
                     $rowData.appendChild($currentDisplay);
                     const displayedFieldColumnName = displayedField.columnName;
                     while (currentDataRecords.length > 0) {
                        const $currentDisplayData =
                           document.createElement("div");
                        $currentDisplay.appendChild($currentDisplayData);
                        const currentDataRecord = currentDataRecords.pop();
                        $currentDisplayData.setAttribute(
                           "id",
                           `${atDisplay}.${rowDataID}.${currentDataRecord[displayedObjPK]}`
                        );
                        $currentDisplayData.appendChild(
                           document.createTextNode(
                              currentDataRecord[displayedFieldColumnName]
                           )
                        );
                     }
                     currentField = null;
                  }
               }
            }
         },
         data: chartData,
         direction: baseView.settings.direction,
         // depth: baseView.settings.depth,
         pan: baseView.settings.pan == 1,
         zoom: baseView.settings.zoom == 1,
         draggable,
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
      if (draggable) {
         // On drop update the parent (dropZone) of the node
         orgchart.addEventListener("nodedropped.orgchart", (event) => {
            const dragNode = JSON.parse(
               event.detail.draggedNode.dataset.source
            );
            debugger;
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
      const orgchartStyle = orgchart.style;
      orgchartStyle["overflow"] = "auto";
      let $currentNode = chartDom;
      while ($currentNode.style["height"] === "")
         $currentNode = $currentNode.parentNode;
      orgchartStyle["height"] = $currentNode.style["height"];
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
      chartData.description = "...";
      // description:
      //    descriptionField?.format?.(f) ??
      //    f[descriptionField?.columnName] ??
      //    "",
      chartData._rawData = topNode;

      function pullChildData(node) {
         node.children = [];
         node._rawData[teamLink].forEach((id) => {
            const childData = dc.getData((e) => e.id === id)[0];
            if (childData == null) return;
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
