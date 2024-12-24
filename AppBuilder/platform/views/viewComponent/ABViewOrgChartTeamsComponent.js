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
               filterPopup: "",
               filterForm: "",
               contentForm: "",
               contentFormData: "",
               teamForm: "",
               teamFormPopup: "",
               teamFormSubmit: "",
               teamFormTitle: "",
               teamFormInactive: "",
            },
            ids
         )
      );
      this.__filters = {
         inactive: 0,
      };
      this._chartData = null;
      this._cachedContentDataRecords = null;
   }

   _parseDataPK(dataPK) {
      const intDataPk = parseInt(dataPK);
      return (
         ((isNaN(intDataPk) || intDataPk.toString().length !== dataPK.length) &&
            dataPK) ||
         intDataPk
      );
   }

   _parseFormValueByType(oldFormData, newFormData) {
      for (const key in newFormData) {
         const oldValue = oldFormData[key];
         const newValue = newFormData[key];
         switch (typeof oldValue) {
            case "boolean":
               if (newValue == 0) newFormData[key] = false;
               else newFormData[key] = true;
               break;
            case "number":
               newFormData[key] = parseInt(newValue);
               break;
            case "string":
               newFormData[key] = newValue?.toString();
               break;
            default:
               newFormData[key] = newValue;
               break;
         }
      }
      return newFormData;
   }

   ui() {
      const ids = this.ids;
      const _ui = super.ui([
         {
            id: ids.chartView,
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
      const OrgChart = (this.OrgChart = orgChartLoader.default);
      const _oldOnDragStart = OrgChart.prototype._onDragStart;
      OrgChart.prototype._onDragStart = (event) => {
         event.dataTransfer.setData("isnode", 1);
         _oldOnDragStart.call(this.__orgchart, event);
      };

      const ids = this.ids;

      // SKELETON CHART
      const orgchart = new OrgChart({
         data: { title: "", children: [{}, {}] },
         chartContainer: `#${ids.chartDom}`,
         nodeContent: "title",
         createNode: ($node) => {
            $node.querySelector(".title").remove();
            $node.querySelector(".content").innerHTML = "";

            $node.classList.add("team-node-skeleton");
         },
      });
      const chartDom = document.querySelector(`#${ids.chartDom}`);
      chartDom.textContent = "";
      chartDom.innerHTML = "";
      const ui = {
         cols: [
            {
               rows: [
                  {
                     view: "template",
                     height: 50,
                  },
                  {
                     view: "template",
                     scroll: "auto",
                  },
               ],
            },
         ],
      };
      const $chartContent = AB.Webix.ui(ui).$view;
      chartDom.appendChild($chartContent);
      const $chartContentLayout = $chartContent.children[0];
      $chartContentLayout.children[1].children[0].appendChild(orgchart);
   }

   async onShow() {
      this.AB.performance.mark("TeamChart.onShow");
      this.AB.performance.mark("TeamChart.load");
      const loadingJS = this.loadOrgChartJs();
      const loadingData = this.pullData();
      super.onShow();
      this.busy();
      this.generateStrategyCss();
      if (this.settings.entityDatacollection) {
         this.entityDC = this.AB.datacollectionByID(
            this.settings.entityDatacollection
         );
         if (!this._entityChangeListener) {
            // Reload the Chart if our Entity changes
            this._entityChangeListener = this.entityDC.on(
               "changeCursor",
               async () => {
                  $$(this.ids.teamFormPopup)?.destructor();
                  await this.refresh();
               }
            );
         }
      }
      // const loadingContent =
      this.loadContentDisplayData();
      await Promise.all([loadingJS, loadingData, this.entityDC.waitReady()]);
      this.AB.performance.measure("TeamChart.load");
      this.AB.performance.mark("TeamChart.display");
      await this.displayOrgChart();
      this.AB.performance.measure("TeamChart.display");
      this.ready();
      this.AB.performance.measure("TeamChart.onShow");
   }

   async displayOrgChart() {
      const baseView = this.view;
      const AB = this.AB;
      const chartData = AB.cloneDeep(this.chartData);
      const settings = baseView.settings;
      const showGroupTitle = settings.showGroupTitle === 1;
      const draggable = settings.draggable === 1;
      const nodeDC = baseView.datacollection;
      const nodeModel = baseView.datacollection.model;
      const nodeObj = nodeDC?.datasource;
      const nodeObjPK = nodeObj.PK();
      const contentFieldLink = nodeObj.fieldByID(
         settings.contentField
      )?.fieldLink;
      const contentObj = this.contentObject();
      const contentGroupByField = contentObj?.fieldByID(
         settings.contentGroupByField
      );
      this.AB.performance.mark("loadAssigmentType");
      const contentGroupObj = this.AB.objectByID(
         contentGroupByField?.settings.linkObject
      );
      const { data: contentGroupOptions } = await contentGroupObj
         .model()
         .findAll();
      const groupObjPKColumeName = contentGroupObj.PK();
      this.AB.performance.measure("loadAssigmentType");
      this.AB.performance.mark("misc");
      const contentGroupOptionsLength = contentGroupOptions.length;
      const contentGroupByFieldColumnName = contentGroupByField?.columnName;
      const contentFieldLinkColumnName = contentFieldLink?.columnName;
      const contentObjID = contentObj?.id;
      const strategyColors = settings.strategyColors;
      const ids = this.ids;
      const callAfterRender = (callback) => {
         requestAnimationFrame(() => {
            requestAnimationFrame(callback);
         });
      };

      const contentDataRecords = this._cachedContentDataRecords;
      this.AB.performance.measure("misc");
      this.AB.performance.mark("createOrgChart");
      const orgchart = new this.OrgChart({
         data: chartData,
         direction: baseView.settings.direction,
         // depth: baseView.settings.depth,
         chartContainer: `#${ids.chartDom}`,
         pan: true, // baseView.settings.pan == 1,
         zoom: false, //baseView.settings.zoom == 1,
         draggable,
         // visibleLevel: baseView.settings.visibleLevel,
         parentNodeSymbol: false,
         exportButton: baseView.settings.export,
         exportFilename: baseView.settings.exportFilename,
         createNode: async ($node, data) => {
            // remove built in icon
            $node.querySelector(".title > i")?.remove();

            // customize
            const $content = $node.children.item(1);
            $content.innerHTML = "";
            if (data.filteredOut || contentGroupOptionsLength === 0) {
               // This node doesn't pass the filter, but it's children do so
               // simplify the display.
               $content.style.display = "none";
               return;
            }
            const averageHeight = 80 / contentGroupOptionsLength;
            const currentNodeDataRecordPK = data._rawData[nodeObjPK];
            const $nodeSpacer = element("div", "spacer");
            $content.appendChild($nodeSpacer);
            const nodeSpacerStyle = $nodeSpacer.style;
            nodeSpacerStyle.backgroundColor = "";
            const strategyColor =
               strategyColors[$node.classList.item(1).replace("strategy-", "")];
            for (const group of contentGroupOptions) {
               const $group = element("div", "team-group-section");
               $content.appendChild($group);
               const groupStyle = $group.style;
               groupStyle["height"] = `${averageHeight}%`;

               // TODO: should this be a config option
               const groupColor =
                  group.name === "Leader" ? "#003366" : "#DDDDDD";
               groupStyle["backgroundColor"] = groupColor;
               nodeSpacerStyle.backgroundColor === "" &&
                  (nodeSpacerStyle.backgroundColor = groupColor);

               // TODO: should this be a config option
               const groupText = group.name;
               $group.setAttribute("data-pk", group[groupObjPKColumeName]);
               if (showGroupTitle) {
                  const $groupTitle = element("div", "team-group-title");
                  const groupTitleStyle = $groupTitle.style;
                  groupTitleStyle["backgroundColor"] = groupColor;
                  $groupTitle.appendChild(document.createTextNode(groupText));
                  $group.appendChild($groupTitle);
               }
               const $groupContent = element("div", "team-group-content");
               $group.appendChild($groupContent);
               if (draggable) {
                  $group.addEventListener("dragover", this.fnContentDragOver);
                  $group.addEventListener("drop", (e) => this.fnContentDrop(e));
               }
               let contentDataRecordIndex = 0;
               while (
                  contentDataRecordIndex < contentDataRecords.length &&
                  contentDataRecords.length > 0
               ) {
                  const contentDataRecord =
                     contentDataRecords[contentDataRecordIndex];
                  if (
                     contentDataRecord[contentFieldLinkColumnName] !=
                        currentNodeDataRecordPK ||
                     contentDataRecord[contentGroupByFieldColumnName] !=
                        group.id
                  ) {
                     contentDataRecordIndex++;
                     continue;
                  }
                  contentDataRecords.splice(contentDataRecordIndex, 1);
                  for (const key in contentDataRecord)
                     key.includes("__relation") &&
                        delete contentDataRecord[key];
                  const $rowData = await this.contentRecordUI(
                     contentDataRecord,
                     strategyColor
                  );
                  $groupContent.appendChild($rowData);
               }
            }
            const $buttons = element("div", "team-button-section");
            $content.appendChild($buttons);
            const $editButton = element("div", "team-button");
            $editButton.append(element("i", "fa fa-pencil"));
            const $addButton = element("div", "team-button");
            $addButton.append(element("i", "fa fa-plus"));
            $buttons.append($editButton, $addButton);
            const dataID = this.teamRecordID(data.id);
            const values = this.datacollection.getData(
               (e) => e.id == dataID
            )[0];
            $addButton.onclick = () => {
               this.teamForm("Add", { __parentID: dataID });
            };
            $editButton.onclick = () => this.teamForm("Edit", values);
            if (this.teamCanDelete(values)) {
               const $deleteButton = element("div", "team-button");
               $deleteButton.append(element("i", "fa fa-trash"));
               $deleteButton.onclick = () => this.teamDelete(values);
               $buttons.append($deleteButton);
            }
            if (this.__filters.inactive && this.__filters.inactive === 1) {
               const isInactive = data.isInactive;
               const activeClass = isInactive ? "is-inactive" : "is-active";
               const $active = element("div", `team-button ${activeClass}`);
               const $span = element("span", "active-text");
               $span.innerHTML = isInactive ? "INACTIVE" : "ACTIVE";
               $active.append($span);
               $buttons.append($active);
            }
            callAfterRender(() => {
               const groupHeightThreshold = (246.5 * averageHeight) / 100;
               const groupSections = $node.querySelectorAll(
                  ".team-group-section"
               );
               let isOverflow = false;
               for (const $groupSection of groupSections)
                  if (
                     $groupSection.getBoundingClientRect().height >
                     groupHeightThreshold
                  ) {
                     isOverflow = true;
                     break;
                  }
               if (!isOverflow) {
                  $node.style.height = "300px";
                  return;
               }
               groupSections.forEach(($groupSection) => {
                  const groupHeight =
                     $groupSection.getBoundingClientRect().height;
                  const groupStyle = $groupSection.style;
                  groupStyle.height =
                     (groupHeight < groupHeightThreshold &&
                        `${groupHeightThreshold}px`) ||
                     `${groupHeight}px`;
               });
               const nodeChildren = $node.children;
               nodeChildren.item(0).style.height = "43.5px";
               const $content = nodeChildren.item(1);
               $content.style.top = "-22.5px";
               $content.children.item(0).style.height = "24.65px";
            });
         },
         nodeContent: "description",
      });
      this.AB.performance.measure("createOrgChart");
      this.__orgchart = orgchart;
      if (draggable) {
         // On drop update the parent (dropZone) of the node
         orgchart.addEventListener("nodedropped.orgchart", async (event) => {
            const eventDetail = event.detail;
            const dragedRecord = JSON.parse(
               eventDetail.draggedNode.dataset.source
            )._rawData;
            dragedRecord[
               // Parent node definition.
               this.AB.definitionByID(
                  this.getSettingField("teamLink").settings.linkColumn
               ).columnName
            ] = JSON.parse(eventDetail.dropZone.dataset.source)._rawData.id;
            await nodeModel.update(dragedRecord.id, dragedRecord);
         });
      }
      const chartDom = document.querySelector(`#${ids.chartDom}`);
      if (chartDom) {
         chartDom.textContent = "";
         chartDom.innerHTML = "";
         const ui = {
            cols: [
               {
                  rows: [
                     {
                        view: "template",
                        height: 50,
                     },
                     {
                        view: "template",
                        scroll: "auto",
                     },
                  ],
               },
            ],
         };
         if (settings.showDataPanel === 1) {
            const dataPanelUIs = [];
            const dataPanelDCs = settings.dataPanelDCs;
            for (const key in dataPanelDCs) {
               const dc = AB.datacollectionByID(key.split(".")[1]);
               await dc.waitForDataCollectionToInitialize(dc);
               await dc.reloadData();
               const panelObj = dc.datasource;
               const contentFieldID = panelObj.connectFields(
                  (field) => field.datasourceLink.id == contentObjID
               )[0].fieldLink.id;
               const self = this;
               dataPanelUIs.push({
                  header: dataPanelDCs[key],
                  body: {
                     view: "list",
                     template: (data) =>
                        `<div style="text-align: center;">${panelObj.displayData(
                           data
                        )}</div>`,
                     css: { overflow: "auto" },
                     // TODO (Guy): Force to sort by firstName. the DC sort setting work but after calling DC.parse() in DC.queuedParse() method the sort is messy.
                     data: dc.getData().sort((a, b) => {
                        if (a.firstName < b.firstName) {
                           return -1;
                        }
                        if (a.firstName > b.firstName) {
                           return 1;
                        }
                        return 0;
                     }),
                     on: {
                        onAfterRender() {
                           callAfterRender(() => {
                              const $itemElements =
                                 this.$view.children.item(0).children;
                              for (const $itemElement of $itemElements) {
                                 $itemElement.setAttribute(
                                    "data-content-linked-field-id",
                                    contentFieldID
                                 );
                                 $itemElement.setAttribute(
                                    "data-pk",
                                    dc.getData(
                                       (e) =>
                                          e.id ==
                                          $itemElement.getAttribute(
                                             "webix_l_id"
                                          )
                                    )[0][panelObj.PK()]
                                 );
                                 $itemElement.setAttribute("draggable", "true");
                                 $itemElement.addEventListener(
                                    "dragstart",
                                    (e) => self.fnContentDragStart(e)
                                 );
                                 $itemElement.addEventListener("dragend", (e) =>
                                    self.fnContentDragEnd(e)
                                 );
                              }
                           });
                        },
                     },
                  },
               });
            }
            ui.cols.push({
               view: "tabview",
               width: 450,
               tabbar: {
                  height: 60,
                  type: "bottom",
                  css: "webix_dark",
               },
               cells: dataPanelUIs,
            });
         }
         const $chartContent = AB.Webix.ui(ui).$view;
         chartDom.appendChild($chartContent);
         const $chartContentLayout = $chartContent.children[0];
         this.initFilter($chartContentLayout.children[0].children[0]);
         $chartContentLayout.children[1].children[0].appendChild(orgchart);
      }
   }

   /**
    * load the data and format it for display
    */
   async pullData() {
      const filters = this.__filters;
      const settings = this.view.settings;
      const dc = this.view.datacollection;
      await dc?.waitReady(dc);
      let topNode = dc?.getCursor();
      if (settings.topTeam) {
         const topNodeColumn = this.getSettingField("topTeam").columnName;
         const topFromFeild = dc.getData((e) => e[topNodeColumn] === 1)[0];
         topNode = topFromFeild ? topFromFeild : topNode;
      }
      if (!topNode) return null;
      const teamLink = this.getSettingField("teamLink").columnName;
      const teamName = this.getSettingField("teamName").columnName;
      const teamInactive = this.getSettingField("teamInactive").columnName;
      const strategyField = this.getSettingField("teamStrategy").columnName;
      const strategyCode = this.getSettingField("strategyCode").columnName;
      const self = this;
      const contentField = dc?.datasource.fieldByID(settings.contentField);
      const contentFieldColumnName = contentField?.columnName;
      const contentObj = contentField?.fieldLink?.object;
      const contentObjPK = contentObj.PK();
      const contentFieldFilter = JSON.parse(settings.contentFieldFilter);
      const parsedContentFilterRules = [
         // TODO (Guy): Hardcode date start filter.
         {
            key: contentObj?.fieldByID(settings.contentFieldDateStart)?.id,
            rule: "is_not_null",
            value: "",
         },
         {
            glue: "or",
            rules:
               (contentFieldFilter.rules?.length > 0 && [
                  contentFieldFilter,

                  // TODO (Guy): Hardcode date end filter.
                  {
                     key: contentObj?.fieldByID(settings.contentFieldDateEnd)
                        ?.id,
                     rule: "is_null",
                     value: "",
                  },
               ]) ||
               [],
         },
      ];
      const contentDisplayedFields = settings.contentDisplayedFields;
      const contentDisplayFieldKeys = Object.keys(contentDisplayedFields);
      const contentDisplayedFieldFilters =
         settings.contentDisplayedFieldFilters;
      const contentDataRecords = (this._cachedContentDataRecords = []);
      let isContentFiltered = false;

      // TODO (Guy): Now, this approch is having so many requests.
      this.AB.performance.mark("loadFilteredContent");
      for (const key in contentDisplayedFieldFilters) {
         const [filterAtDisplay, filterObjID, filterFieldID, isFiltered] =
            key.split(".");
         const filterValue = filters[key];
         const contentAtDisplayFieldKeys = [contentDisplayFieldKeys.shift()];
         let currentAtDisplayFieldKey = contentAtDisplayFieldKeys[0];
         while (
            filterAtDisplay === currentAtDisplayFieldKey[0] &&
            contentDisplayedFields[currentAtDisplayFieldKey] !==
               filterFieldID &&
            contentDisplayFieldKeys.length > 0
         ) {
            currentAtDisplayFieldKey = contentDisplayFieldKeys.shift();
            contentAtDisplayFieldKeys.push(currentAtDisplayFieldKey);
         }
         if (
            isFiltered != 1 ||
            typeof filterValue !== "string" ||
            filterValue === "" ||
            contentAtDisplayFieldKeys.length === 0
         )
            continue;
         contentAtDisplayFieldKeys.pop();
         const contentAtDisplayFieldKeysLength =
            contentAtDisplayFieldKeys.length;
         let filterObj = AB.objectByID(filterObjID);
         const getContentDataRecords = async (obj, filterRule) => {
            switch (obj.fieldByID(filterRule.key)?.key) {
               case "connectObject":
               case "user":
                  break;
               default:
                  const dataRecords = (
                     await obj.model().findAll({
                        where: {
                           glue: "and",
                           rules: [filterRule, ...parsedContentFilterRules],
                        },
                        populate: true,
                     })
                  ).data;
                  for (const dataRecord of dataRecords) {
                     if (
                        contentDataRecords.findIndex(
                           (contentDataRecord) =>
                              contentDataRecord.id == dataRecord.id
                        ) > -1
                     )
                        continue;
                     contentDataRecords.push(dataRecord);
                  }
                  isContentFiltered = true;
                  break;
            }
         };
         if (contentAtDisplayFieldKeysLength === 0) {
            await getContentDataRecords(filterObj, {
               key: filterFieldID,
               rule: "contains",
               value: filterValue,
            });
            continue;
         }
         const prevDisplayFieldKey =
            contentAtDisplayFieldKeys[contentAtDisplayFieldKeysLength - 1];
         const prevContentDisplayLinkedField =
            (prevDisplayFieldKey !== "" &&
               AB.objectByID(prevDisplayFieldKey.split(".")[1]).fieldByID(
                  contentDisplayedFields[prevDisplayFieldKey]
               )?.fieldLink) ||
            null;
         let filteredRecordDataPKs = (
            await filterObj.model().findAll({
               where: {
                  glue: "and",
                  rules: [
                     {
                        key: filterFieldID,
                        rule: "contains",
                        value: filterValue,
                     },
                  ],
               },
               populate: true,
            })
         ).data.flatMap(
            (record) => record[prevContentDisplayLinkedField.columnName]
         );
         while (
            contentAtDisplayFieldKeys.length > 1 &&
            filteredRecordDataPKs.length > 0
         ) {
            filterObj = AB.objectByID(
               contentAtDisplayFieldKeys.pop().split(".")[1]
            );
            const filterObjPK = filterObj.PK();
            filteredRecordDataPKs = (
               await filterObj.model().findAll({
                  where: {
                     glue: "and",
                     rules: [
                        {
                           key: filterObjPK,
                           rule: "in",
                           value: filteredRecordDataPKs,
                        },
                     ],
                  },
                  populate: true,
               })
            ).data.map((record) => record[filterObjPK]);
         }
         if (filteredRecordDataPKs.length === 0) continue;
         filterObj = AB.objectByID(
            contentAtDisplayFieldKeys.pop().split(".")[1]
         );
         await getContentDataRecords(filterObj, {
            key: filterObj.PK(),
            rule: "in",
            value: filteredRecordDataPKs,
         });
         isContentFiltered = true;
      }
      this.AB.performance.measure("loadFilteredContent");
      const contentDataRecordPKs = [];
      const chartData = (this._chartData = {});
      chartData.name = topNode[teamName] ?? "";
      chartData.id = this.teamNodeID(topNode.id);
      const topNodeStrategy = topNode[`${strategyField}__relation`];
      const topNodeCode = topNodeStrategy?.[strategyCode];
      chartData.className = `strategy-${topNodeCode}`;
      chartData.isInactive = topNode[teamInactive];
      chartData._rawData = topNode;
      const topNodeContentFieldData = topNode[contentFieldColumnName];
      if (!isContentFiltered) {
         if (Array.isArray(topNodeContentFieldData))
            contentDataRecordPKs.push(...topNodeContentFieldData);
         else contentDataRecordPKs.push(topNodeContentFieldData);
      }
      chartData.filteredOut = isContentFiltered
         ? self.filterTeam(
              filters,
              chartData,
              topNodeCode,
              topNodeContentFieldData
           )
         : self.filterTeam(filters, chartData, topNodeCode);
      const maxDepth = 10; // prevent inifinite loop
      /**
       * Recursive function to prepare child node data
       * @param {object} node the current node
       * @param {number} [depth=0] a count of how many times we have recursed
       */
      function pullChildData(node, depth = 0) {
         if (depth >= maxDepth) return;
         node.children = [];
         node._rawData[teamLink].forEach((id) => {
            const childData = dc.getData((e) => e.id == id)[0];
            // Don't show inactive teams
            if (
               !childData ||
               (filters?.inactive !== 1 && childData[teamInactive])
            )
               return;
            const strategy = childData[`${strategyField}__relation`];
            const code = strategy?.[strategyCode];
            const child = {
               name: childData[teamName],
               id: self.teamNodeID(id),
               className: `strategy-${code}`,
               isInactive: childData[teamInactive],
               _rawData: childData,
            };
            const childContentFieldData = childData[contentFieldColumnName];
            if (!isContentFiltered) {
               if (Array.isArray(childContentFieldData))
                  contentDataRecordPKs.push(...childContentFieldData);
               else contentDataRecordPKs.push(childContentFieldData);
            }

            child.filteredOut = isContentFiltered
               ? self.filterTeam(filters, child, code, childContentFieldData)
               : self.filterTeam(filters, child, code);
            if (child.name === "External Support")
               child.className = `strategy-external`;
            if (childData[teamLink].length > 0) {
               pullChildData(child, depth + 1);
            }
            // If this node is filtered we still need it if it has children
            // that pass
            if (!child.filteredOut || child.children?.length > 0) {
               node.children.push(child);
            }
         });
         if (node.children.length === 0) {
            delete node.children;
         } else {
            // sort children alphaetically
            node.children = node.children.sort((a, b) =>
               a.name > b.name ? 1 : -1
            );
         }
         return;
      }
      pullChildData(chartData);
      if (contentField == null) return;
      if (
         Object.keys(chartData).length > 0 &&
         contentField != null &&
         contentObj != null &&
         !isContentFiltered
      ) {
         this.AB.performance.mark("loadAssignments");
         contentDataRecords.push(
            ...(
               await contentObj.model().findAll({
                  where: {
                     glue: "and",
                     rules: [
                        {
                           key: contentObjPK,
                           rule: "in",
                           value: contentDataRecordPKs,
                        },
                        ...parsedContentFilterRules,
                     ],
                  },
                  populate: true,
               })
            ).data
         );
         this.AB.performance.measure("loadAssignments");
      }
   }

   /**
    * creates a datacollection to hold the content data linked to the current
    * enitity;
    */
   loadContentData() {
      const contentObj = this.contentObject();
      const connectField = contentObj.connectFields(
         (f) => f.settings.linkObject === this.entityDC.datasource.id
      )[0];
      const contentDC = this.AB.datacollectionNew({
         datasourceID: contentObj.id,
         loadAll: true,
         linkDatacollectionID: this.settings.entityDatacollection,
         linkFieldID: connectField.id,
      });
      this.contentDC = contentDC;
      return contentDC.init();
   }

   contentObject() {
      return this.AB.objectByID(
         this.getSettingField("contentField").settings.linkObject
      );
   }

   async refresh() {
      this.busy();
      let orgchart = this.__orgchart;
      if (orgchart != null) {
         const dataPanStart = orgchart.dataset.panStart;
         const style = orgchart.getAttribute("style");
         await this.pullData();
         await this.displayOrgChart();
         orgchart = this.__orgchart;
         orgchart.dataset.panStart = dataPanStart;
         orgchart.setAttribute("style", style);
      } else {
         await this.pullData();
         await this.displayOrgChart();
      }
      this.ready();
   }

   get chartData() {
      if (this._chartData == null) {
         this._chartData = {};
      }
      return this._chartData;
   }

   /** Add the filter button to the UI */
   initFilter(domNode) {
      const filterButton = document.createElement("button");
      filterButton.innerHTML = `<i class="fa fa-filter"></i> Filter`;
      filterButton.classList.add("filter-button");
      filterButton.onclick = () => this.filterWindow(filterButton);
      domNode.append(filterButton);
   }

   /** Display the filter UI (popup) **/
   async filterWindow(buttonNode) {
      const contentDisplayedFieldFilters =
         this.settings.contentDisplayedFieldFilters;
      let $popup = $$(this.ids.filterPopup);
      if (!$popup) {
         const strategyID =
            this.getSettingField("teamStrategy").settings.linkObject;
         const strategyObj = this.AB.objectByID(strategyID);
         const strategyCodeFieldID = this.getSettingField("strategyCode").id;
         const strategyCodeField = strategyObj.fields(
            (f) => f.id === strategyCodeFieldID
         )[0];
         const strategyOptions = await strategyCodeField.getOptions();

         $popup = webix.ui({
            view: "popup",
            css: "filter-popup",
            id: this.ids.filterPopup,
            body: {
               view: "form",
               borderless: true,
               id: this.ids.filterForm,
               elements: [
                  {
                     view: "text",
                     label: this.label("Team Name"),
                     labelWidth: 90,
                     name: "teamName",
                     clear: true,
                  },
                  {
                     view: "combo",
                     label: this.label("Strategy"),
                     labelWidth: 90,
                     options: strategyOptions.map(fieldToOption),
                     name: "strategy",
                     clear: "replace",
                  },
                  {
                     view: "checkbox",
                     name: "inactive",
                     labelRight: this.label("Show Inactive Teams"),
                     labelWidth: 0,
                  },
                  ...(() => {
                     const contentDisplayedFieldFilterViews = [];
                     for (const contentDisplayedFieldFilterKey in contentDisplayedFieldFilters) {
                        if (contentDisplayedFieldFilterKey.split(".")[3] == 1) {
                           contentDisplayedFieldFilterViews.push({
                              view: "text",
                              label: contentDisplayedFieldFilters[
                                 contentDisplayedFieldFilterKey
                              ],
                              labelWidth: 90,
                              name: contentDisplayedFieldFilterKey,
                              clear: true,
                           });
                        }
                     }
                     return contentDisplayedFieldFilterViews;
                  })(),
                  {
                     cols: [
                        {},
                        {
                           view: "icon",
                           icon: "fa fa-check",
                           css: "filter-apply",
                           click: () => this.filterApply(),
                        },
                     ],
                  },
               ],
            },
         });
      }
      $popup.show(buttonNode);
   }

   async filterApply() {
      $$(this.ids.filterPopup).hide();
      this.__filters = $$(this.ids.filterForm).getValues();
      await this.refresh();
   }

   filterTeam(filters, team, code, contentFieldData) {
      // Apply filters (match using or)
      if (filters.strategy || filters.teamName || contentFieldData != null) {
         let filter = true;
         if (filters.strategy !== "" && filters.strategy == code) {
            filter = false;
         }
         if (
            filters.teamName !== "" &&
            team.name.toLowerCase().includes(filters.teamName.toLowerCase())
         ) {
            filter = false;
         }
         const contentObjPK = this.view.datacollection?.datasource
            .fieldByID(this.settings.contentField)
            ?.fieldLink?.object.PK();
         if (
            this._cachedContentDataRecords.findIndex((contentDataRecord) => {
               if (Array.isArray(contentFieldData))
                  return (
                     contentFieldData.indexOf(contentDataRecord[contentObjPK]) >
                     -1
                  );
               return contentFieldData == contentDataRecord[contentObjPK];
            }) > -1
         ) {
            filter = false;
         }
         return filter;
      }
   }

   /**
    * Get the ABField from settings
    * @param {string} setting key in this.view.settings - should be an id for an
    * ABField
    */
   getSettingField(setting) {
      return this.AB.definitionByID(this.view.settings[setting]);
   }

   generateStrategyCss() {
      const css = [
         "org-chart .strategy-external .title{background:#989898 !important;}",
      ];
      const colors = this.settings.strategyColors;
      for (let key in colors) {
         css.push(
            `org-chart .strategy-${key} .title{background:${colors[key]} !important;}`
         );
      }
      const style = document.createElement("style");
      style.innerHTML = css.join("");
      document.getElementsByTagName("head")[0].appendChild(style);
   }

   async teamAddChild(values, strategy) {
      // Add the entity value
      if (this.entityDC) {
         const connection = this.entityDC.datasource.connectFields(
            (f) => f.settings.linkObject === this.datacollection.datasource.id
         )[0];
         if (connection) {
            const entity = this.entityDC.getCursor();
            const cName = this.AB.definitionByID(
               connection.settings.linkColumn
            ).columnName;
            values[cName] = entity;
         }
      }
      const _rawData = await this.datacollection.model.create(values);
      const id = _rawData.id;

      const linkField = this.AB.definitionByID(
         this.getSettingField("teamLink").settings.linkColumn
      ).columnName;
      const nameField = this.getSettingField("teamName").columnName;
      const parent = document.querySelector(
         `#${this.teamNodeID(values[linkField])}`
      );

      const strategyLink = this.getSettingField("teamStrategy").columnName;
      const strategyField = this.getSettingField("strategyCode").columnName;
      const strategyCode = _rawData[`${strategyLink}__relation`][strategyField];

      const hasChild = parent.parentNode.colSpan > 1;
      const newChild = {
         name: values[nameField],
         id: this.teamNodeID(id),
         relationship: hasChild ? "110" : "100",
         className: `strategy-${strategyCode}`,
         _rawData,
      };

      // Need to add differently if the node already has child nodes
      if (hasChild) {
         const sibling = this.closest(parent, (el) => el.nodeName === "TABLE")
            .querySelector(".nodes")
            .querySelector(".node");
         this.__orgchart.addSiblings(sibling, { siblings: [newChild] });
      } else {
         this.__orgchart.addChildren(parent, { children: [newChild] });
      }
   }

   teamCanInactivate(values) {
      const isInactive = this.getSettingField("teamInactive").columnName;
      if (values[isInactive]) return true; // Allow activating inactive teams
      const canInactive = this.getSettingField("teamCanInactivate").columnName;
      if (!values[canInactive]) return false;
      const children = this.getSettingField("teamLink").columnName;
      if (
         values[children].some(
            (c) =>
               this.datacollection.getData((r) => r.id == c)[0]?.[isInactive] ==
               false
         )
      )
         return false;
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
      return this.AB.Webix.confirm({
         text: "This can't be undone, are you sure?",
      }).then(() => {
         this.datacollection.model.delete(values.id);
         const nodeID = this.teamNodeID(values.id);
         this.__orgchart.removeNodes(document.querySelector(`#${nodeID}`));
      });
   }

   async teamEdit(values, strategy) {
      const strategyLink = this.getSettingField("teamStrategy").columnName;
      const strategyField = this.getSettingField("strategyCode").columnName;
      const strategyCode = strategy[strategyField];
      values[strategyLink] = strategy.id;
      delete values[`${strategyLink}__relation`];
      await this.datacollection.model.update(values.id, values).catch((err) => {
         //TODO
      });
      const nodeID = this.teamNodeID(values.id);
      const node = document.querySelector(`#${nodeID}`);
      const currentStrategy = node.classList?.value?.match(/strategy-\S+/)[0];
      const newStrategy = `strategy-${strategyCode}`;
      if (currentStrategy !== newStrategy) {
         node.classList?.remove(currentStrategy);
         node.classList?.add(newStrategy);
      }

      const inactive = this.getSettingField("teamInactive").columnName;
      // Remove inactive node from display, unless the filter setting to show
      // inctive nodes is on.
      if (this.__filters?.inactive !== 1 && values[inactive] === 1) {
         this.__orgchart.removeNodes(node);
      }
      const nameCol = this.getSettingField("teamName").columnName;
      node.querySelector(".title").innerHTML = values[nameCol];
   }

   async teamForm(mode, values) {
      let $teamFormPopup = $$(this.ids.teamFormPopup);
      const inactive = this.getSettingField("teamInactive").columnName;
      const linkField = this.AB.definitionByID(
         this.getSettingField("teamLink").settings.linkColumn
      ).columnName;
      const ids = this.ids;
      if (!$teamFormPopup) {
         const teamObj = this.datacollection.datasource;
         const settings = this.settings;
         const nameField = teamObj.fieldByID(settings.teamName);
         const strategyField = teamObj.fieldByID(settings.teamStrategy);
         const strategyObj = this.AB.objectByID(
            strategyField.settings.linkObject
         );
         const entityLink = strategyObj.connectFields(
            (f) => f.settings.linkObject === this.entityDC.datasource.id
         )[0];
         const cond = {
            glue: "and",
            rules: [
               {
                  key: entityLink.columnName,
                  value: this.entityDC.getCursor().id,
                  rule: "equals",
               },
            ],
         };
         const subCol = this.getSettingField("subStrategy").columnName;
         this.entitySrategyOptions = await strategyField.getOptions(
            cond,
            null,
            null,
            null,
            [subCol]
         );

         const strategyOptions = this.entitySrategyOptions.map((o) => {
            return {
               id: o.id,
               value: o[`${subCol}__relation`].name,
            };
         });
         $teamFormPopup = webix.ui({
            view: "popup",
            id: ids.teamFormPopup,
            close: true,
            position: "center",
            css: { "border-radius": "10px" },
            body: {
               rows: [
                  {
                     view: "toolbar",
                     css: "webix_dark",
                     cols: [
                        { width: 5 },
                        {
                           id: ids.teamFormTitle,
                           view: "label",
                           align: "left",
                        },
                        {
                           view: "icon",
                           icon: "fa fa-times",
                           align: "right",
                           width: 60,
                           click: () => $teamFormPopup.hide(),
                        },
                     ],
                  },
                  {
                     view: "form",
                     id: ids.teamForm,
                     borderless: true,
                     elements: [
                        {
                           view: "text",
                           label: nameField.label,
                           name: nameField.columnName,
                           required: true,
                        },
                        {
                           view: "richselect",
                           label: strategyField.label,
                           name: strategyField.columnName,
                           options: strategyOptions,
                           required: true,
                        },
                        {
                           view: "switch",
                           id: ids.teamFormInactive,
                           name: inactive,
                           label: "Inactive",
                        },
                        { view: "text", name: "id", hidden: true },
                        { view: "text", name: linkField, hidden: true },
                        {
                           id: ids.teamFormSubmit,
                           view: "button",
                           value: this.label("Save"),
                           disabled: true,
                           css: "webix_primary",
                           click: () => {
                              const values = $$(ids.teamForm).getValues();
                              const strategy = strategyOptions.find(
                                 (f) =>
                                    f.id === values[strategyField.columnName]
                              );
                              if (values.id) {
                                 this.teamEdit(values, strategy);
                              } else {
                                 this.teamAddChild(values, strategy);
                              }
                              $teamFormPopup.hide();
                           },
                        },
                     ],
                     on: {
                        onChange: () => {
                           const values = $$(ids.teamForm).getValues();
                           const valid =
                              !!values[strategyField.columnName] &&
                              !!values[nameField.columnName];
                           const $teamFormSubmit = $$(ids.teamFormSubmit);
                           if (valid) $teamFormSubmit.enable();
                           else $teamFormSubmit.disable();
                        },
                     },
                  },
               ],
            },
         });
      }
      if (values.__parentID) {
         values[linkField] = values.__parentID;
         delete values.__parentID;
      }
      $$(ids.teamFormTitle).setValue(`${this.label(mode)} Team`);
      $$(ids.teamForm).setValues(values);
      $$(ids.teamFormSubmit).disable();

      this.teamCanInactivate(values)
         ? $$(ids.teamFormInactive).enable()
         : $$(ids.teamFormInactive).disable();
      if (mode === "Edit") {
         // Check if we can inactivate
      }
      $teamFormPopup.show();
   }

   async showContentForm(contentDataRecord) {
      const contentObj = this.contentObject();
      const contentModel = contentObj?.model();
      const settings = this.settings;
      const editContentFieldsToCreateNew =
         settings.editContentFieldsToCreateNew;
      const contentDateStartFieldColumnName = this.getSettingField(
         "contentFieldDateStart"
      )?.columnName;
      const contentDateEndFieldColumnName = this.getSettingField(
         "contentFieldDateEnd"
      )?.columnName;

      const rules = {};
      const labelWidth = 200;
      const ids = this.ids;
      const contentFormElements = settings.setEditableContentFields.map(
         (fieldID) => {
            const field = contentObj.fields((field) => field.id === fieldID)[0];
            if (field == null)
               return {
                  view: "label",
                  label: this.label("Missing Field"),
                  labelWidth,
               };
            const fieldKey = field.key;
            const fieldName = field.columnName;

            // TODO (Guy): Add validators.
            rules[fieldName] = () => true;
            const fieldLabel = field.label;
            const settings = field.settings;
            switch (fieldKey) {
               case "boolean":
                  return {
                     view: "checkbox",
                     name: fieldName,
                     label: fieldLabel,
                     labelWidth,
                  };
               case "number":
                  return {
                     view: "counter",
                     name: fieldName,
                     label: fieldLabel,
                     labelWidth,
                     type: "number",
                  };
               case "list":
                  return {
                     view:
                        (settings.isMultiple === 1 && "muticombo") || "combo",
                     name: fieldName,
                     label: fieldLabel,
                     labelWidth,
                     options: settings.options.map((option) => ({
                        id: option.id,
                        value: option.text,
                     })),
                  };
               case "user":
               case "connectObject":
                  const abWebix = this.AB.Webix;
                  const fieldLinkObj = field.datasourceLink;

                  // TODO (Guy): Hardcode for the employee field
                  if (fieldLabel === "NS Employee Record")
                     return {
                        view: "text",
                        label: "Name",
                        disabled: true,
                        labelWidth,
                        on: {
                           async onViewShow() {
                              abWebix.extend(this, abWebix.ProgressBar);
                              this.showProgress({ type: "icon" });
                              try {
                                 this.setValue(
                                    fieldLinkObj.displayData(
                                       (
                                          await fieldLinkObj.model().findAll({
                                             where: {
                                                glue: "and",
                                                rules: [
                                                   {
                                                      key: fieldLinkObj.PK(),
                                                      rule: "equals",
                                                      value: contentDataRecord[
                                                         fieldName
                                                      ],
                                                   },
                                                ],
                                             },
                                          })
                                       ).data[0]
                                    )
                                 );
                                 this.hideProgress();
                              } catch {
                                 // Close popup before response or possily response fail
                              }
                           },
                        },
                     };
                  const onViewShow = async function () {
                     abWebix.extend(this, abWebix.ProgressBar);
                     this.showProgress({ type: "icon" });
                     try {
                        // TODO (Guy): Add spinner.
                        this.define(
                           "options",
                           (await fieldLinkObj.model().findAll()).data.map(
                              (e) => ({
                                 id: e.id,
                                 value: fieldLinkObj.displayData(e),
                              })
                           )
                        );
                        this.hideProgress();
                        this.enable();
                        await this.refresh();
                     } catch {
                        // Close popup before response or possily response fail
                     }
                  };
                  return field.linkType() === "one"
                     ? {
                          view: "combo",
                          name: fieldName,
                          label: fieldLabel,
                          disabled: true,
                          labelWidth,
                          options: [],
                          on: {
                             onViewShow,
                          },
                       }
                     : {
                          view: "multicombo",
                          name: fieldName,
                          label: fieldLabel,
                          labelWidth,
                          stringResult: false,
                          labelAlign: "left",
                          options: [],
                          on: {
                             onViewShow,
                          },
                       };
               case "date":
               case "datetime":
                  return {
                     view: "datepicker",
                     name: fieldName,
                     label: fieldLabel,
                     labelWidth,
                     timepicker: fieldKey === "datetime",
                  };
               case "file":
               case "image":
                  // TODO (Guy): Add logic
                  return {
                     // view: "",
                     name: fieldName,
                     label: fieldLabel,
                     labelWidth,
                  };
               // case "json":
               // case "LongText":
               // case "string":
               // case "email":
               default:
                  return {
                     view: "text",
                     name: fieldName,
                     label: fieldLabel,
                     labelWidth,
                  };
            }
         }
      );
      contentFormElements.push({
         view: "button",
         value: this.label("Save"),
         css: "webix_primary",
         click: async () => {
            const $contentFormData = $$(ids.contentFormData);
            if (!$contentFormData.validate()) return;
            let isDataChanged = false;
            const newFormData = this._parseFormValueByType(
               contentDataRecord,
               $contentFormData.getValues()
            );
            for (const key in newFormData)
               if (
                  JSON.stringify(newFormData[key]) !==
                  JSON.stringify(contentDataRecord[key])
               ) {
                  isDataChanged = true;
                  break;
               }
            const $contentForm = $$(ids.contentForm);
            $contentForm.blockEvent();
            $contentForm.$view.remove();
            $contentForm.destructor();
            if (!isDataChanged) return;
            webix
               .confirm({
                  title: "Title",
                  ok: "Yes",
                  cancel: "No",
                  text: "You are about to confirm. Are you sure?",
               })
               .then(async () => {
                  delete newFormData["created_at"];
                  delete newFormData["updated_at"];
                  delete newFormData["properties"];
                  for (const editContentFieldToCreateNew of editContentFieldsToCreateNew) {
                     const editContentFieldToCreateNewColumnName =
                        contentObj.fieldByID(
                           editContentFieldToCreateNew
                        )?.columnName;
                     if (
                        JSON.stringify(
                           newFormData[editContentFieldToCreateNewColumnName] ??
                              ""
                        ) !==
                        JSON.stringify(
                           contentDataRecord[
                              editContentFieldToCreateNewColumnName
                           ] ?? ""
                        )
                     ) {
                        const pendingPromises = [];
                        const oldData = {};
                        oldData[contentDateEndFieldColumnName] = new Date();
                        pendingPromises.push(
                           contentModel.update(newFormData.id, oldData)
                        );
                        newFormData[contentDateStartFieldColumnName] =
                           oldData[contentDateEndFieldColumnName];
                        delete newFormData["id"];
                        delete newFormData["uuid"];
                        delete newFormData[contentDateEndFieldColumnName];
                        pendingPromises.push(contentModel.create(newFormData));
                        await Promise.all(pendingPromises);
                        await this.refresh();
                        return;
                     }
                  }
                  await contentModel.update(newFormData.id, newFormData);
                  await this.refresh();
               });
         },
      });
      AB.Webix.ui({
         view: "popup",
         id: ids.contentForm,
         close: true,
         position: "center",
         css: { "border-radius": "10px" },
         body: {
            width: 600,
            rows: [
               {
                  view: "toolbar",
                  css: "webix_dark",
                  cols: [
                     { width: 5 },
                     {
                        view: "label",
                        label: `${this.label("Edit")} ${contentObj.label}`,
                        align: "left",
                     },
                     {
                        view: "icon",
                        icon: "fa fa-times",
                        align: "right",
                        width: 60,
                        click: () => {
                           const $contentForm = $$(ids.contentForm);
                           $contentForm.blockEvent();
                           $contentForm.$view.remove();
                           $contentForm.destructor();
                        },
                     },
                  ],
               },
               {
                  view: "form",
                  id: ids.contentFormData,
                  hidden: true,
                  elements: contentFormElements,
                  rules,
               },
            ],
         },
         on: {
            onHide() {
               this.$view.remove();
               this.destructor();
            },
         },
      }).show();
      const $contentFormData = $$(ids.contentFormData);
      $contentFormData.setValues(contentDataRecord);
      $contentFormData.show();
   }

   loadContentDisplayData() {
      const contentID = this.contentObject().id;
      const displayedObjects = Object.keys(this.settings.contentDisplayedFields)
         .map((r) => r.split(".")[1])
         .filter((r) => r != contentID);
      this.contentDisplayDCs = {};
      displayedObjects.forEach(async (id) => {
         const abObj = this.AB.objectByID(id);
         const connectField = abObj.connectFields(
            (f) => f.settings.linkObject === this.entityDC.datasource.id
         )[0];
         this.contentDisplayDCs[id] = this.AB.datacollectionNew({
            id,
            name: id,
            settings: {
               datasourceID: id,
               // loadAll: true,
               linkDatacollectionID: connectField
                  ? this.settings.entityDatacollection
                  : undefined,
               linkFieldID: connectField?.id,
               fixSelect: "",
            },
         });
         await this.contentDisplayDCs[id].init();
         this.contentDisplayDCs[id].loadData();
      });
   }

   async contentRecordUI(data, color) {
      const $ui = element("div", "team-group-record");
      $ui.setAttribute("id", this.contentNodeID(data.id));
      $ui.setAttribute("data-source", JSON.stringify(data));
      $ui.style.borderColor = color;
      $ui.addEventListener("click", async () => {
         await this.showContentForm(data);
      });
      if (this.settings.draggable === 1) {
         $ui.setAttribute("draggable", "true");
         $ui.addEventListener("dragstart", this.fnContentDragStart);
         $ui.addEventListener("dragend", this.fnContentDragEnd);
      }
      // TODO (Guy): Now we are hardcoding for each display
      const hardcodedDisplays = [
         element("div", "display-block"),
         element("div", "display-block"),
         element("div", "display-block display-block-right"),
      ];
      const $hardcodedSpecialDisplay = element(
         "div",
         "team-group-record-display"
      );
      let currentDataRecords = [];
      let currentField = null;
      let currentDisplayIndex = 0;
      const contentObj = this.contentObject();
      const contentDisplayedFields = this.settings.contentDisplayedFields;
      const contentDisplayedFieldsKeys = Object.keys(contentDisplayedFields);

      for (let j = 0; j < contentDisplayedFieldsKeys.length; j++) {
         const displayedFieldKey = contentDisplayedFieldsKeys[j];
         const [atDisplay, objID] = displayedFieldKey.split(".");
         const displayedObj = AB.objectByID(objID);
         const displayedFieldID = contentDisplayedFields[displayedFieldKey];
         const displayedField = displayedObj.fieldByID(displayedFieldID);
         const displayDC = this.contentDisplayDCs[objID];
         switch (objID) {
            case contentObj.id:
               currentDataRecords = [data];
               break;
            default:
               if (currentField == null) break;
               if (currentDataRecords.length > 0) {
                  const currentFieldColumnName = currentField.columnName;
                  const currentDataPKs = [];
                  do {
                     const currentFieldData =
                        currentDataRecords.pop()[currentFieldColumnName];
                     if (Array.isArray(currentFieldData)) {
                        if (currentFieldData.length > 0)
                           currentDataPKs.push(...currentFieldData);
                     } else if (currentFieldData != null)
                        currentDataPKs.push(currentFieldData);
                  } while (currentDataRecords.length > 0);
                  currentDataRecords = displayDC.getData((r) => {
                     return currentDataPKs.some((id) => id == r.id);
                  });
                  //    await displayedObj.model().findAll({
                  //       where: {
                  //          glue: "and",
                  //          rules: [
                  //             {
                  //                key: displayedObj.PK(),
                  //                rule: "in",
                  //                value: currentDataPKs,
                  //             },
                  //          ],
                  //       },
                  //       populate: true,
                  //    })
                  // ).data;
               }
               break;
         }
         if (contentDisplayedFieldsKeys[j + 1]?.split(".")[0] === atDisplay) {
            currentField = displayedField;
            continue;
         }
         const $currentDisplay = element("div", "team-group-record-display");

         // TODO (Guy): Now we are hardcoding for each display.
         // $rowData.appendChild($currentDisplay);
         switch (currentDisplayIndex) {
            case 0:
               hardcodedDisplays[0].appendChild($currentDisplay);
               break;
            case 1:
               hardcodedDisplays[2].appendChild($currentDisplay);
               break;
            case 2:
               hardcodedDisplays[1].appendChild($hardcodedSpecialDisplay);
               $hardcodedSpecialDisplay.appendChild($currentDisplay);
               break;
            case 3:
               $hardcodedSpecialDisplay.appendChild($currentDisplay);
               break;
            default:
               hardcodedDisplays[1].appendChild($currentDisplay);
               break;
         }
         currentDisplayIndex++;
         const displayedFieldColumnName = displayedField.columnName;
         const contentDisplayedFieldTypePrefix = `${displayedFieldKey}.${displayedFieldID}`;
         const contentDisplayedFieldMappingDataObj =
            JSON.parse(
               this.settings.contentDisplayedFieldMappingData?.[
                  contentDisplayedFieldTypePrefix
               ] || null
            ) || {};
         if (
            this.settings.contentDisplayedFieldTypes[
               `${contentDisplayedFieldTypePrefix}.0`
            ] != null
         )
            $currentDisplay.style.display = "none";
         switch (
            this.settings.contentDisplayedFieldTypes[
               `${contentDisplayedFieldTypePrefix}.1`
            ]
         ) {
            case "icon":
               // TODO (Guy): Add logic.
               break;
            case "image":
               while (currentDataRecords.length > 0) {
                  const currentDataRecordValue =
                     currentDataRecords.pop()[displayedFieldColumnName];
                  const $img = document.createElement("img");
                  $currentDisplay.appendChild($img);
                  $img.setAttribute(
                     "src",
                     contentDisplayedFieldMappingDataObj[
                        currentDataRecordValue
                     ] ?? currentDataRecordValue
                  );
               }
               break;
            case "svg":
               while (currentDataRecords.length > 0) {
                  const currentDataRecord = currentDataRecords.pop();
                  const currentDataRecordID = currentDataRecord.id;
                  const currentDataRecordValue =
                     currentDataRecord[displayedFieldColumnName];
                  const SVG_NS = "http://www.w3.org/2000/svg";
                  const X_LINK_NS = "http://www.w3.org/1999/xlink";
                  const $svg = document.createElementNS(SVG_NS, "svg");
                  $currentDisplay.appendChild($svg);
                  $svg.setAttribute("viewBox", "0 0 6 6");
                  $svg.setAttribute("fill", "none");
                  $svg.setAttribute("xmlns", SVG_NS);
                  $svg.setAttribute("xmlns:xlink", X_LINK_NS);
                  const $rect = document.createElementNS(SVG_NS, "rect");
                  const $defs = document.createElementNS(SVG_NS, "defs");
                  $svg.append($rect, $defs);
                  $rect.setAttribute("width", "6");
                  $rect.setAttribute("height", "6");
                  const patternID = `display-svg.pattern.${currentDataRecordID}`;
                  $rect.setAttribute("fill", `url(#${patternID})`);
                  const $pattern = document.createElementNS(SVG_NS, "pattern");
                  const $image = document.createElementNS(SVG_NS, "image");
                  $defs.append($pattern, $image);
                  $pattern.id = patternID;
                  $pattern.setAttributeNS(
                     null,
                     "patternContentUnits",
                     "objectBoundingBox"
                  );
                  $pattern.setAttribute("width", "1");
                  $pattern.setAttribute("height", "1");
                  const imageID = `display-svg.image.${currentDataRecordID}`;
                  $image.id = imageID;
                  $image.setAttribute("width", "512");
                  $image.setAttribute("height", "512");
                  $image.setAttributeNS(
                     X_LINK_NS,
                     "xlink:href",
                     contentDisplayedFieldMappingDataObj[
                        currentDataRecordValue
                     ] ?? currentDataRecordValue
                  );
                  const $use = document.createElementNS(SVG_NS, "use");
                  $pattern.appendChild($use);
                  $use.setAttributeNS(X_LINK_NS, "xlink:href", `#${imageID}`);
                  $use.setAttribute("transform", "scale(0.002)");
               }
               break;
            default:
               while (currentDataRecords.length > 0) {
                  const currentDataRecordValue =
                     currentDataRecords.pop()[displayedFieldColumnName];
                  $currentDisplay.appendChild(
                     document.createTextNode(
                        contentDisplayedFieldMappingDataObj[
                           currentDataRecordValue
                        ] ?? currentDataRecordValue
                     )
                  );
               }
               break;
         }
         currentField = null;
      }
      // TODO (Guy): Now we are hardcoding for each display.
      const hardcodedDisplaysLength = hardcodedDisplays.length;
      for (let i = 0; i < hardcodedDisplaysLength; i++) {
         const $hardcodedDisplay = hardcodedDisplays[i];
         $ui.appendChild($hardcodedDisplay);
         const children = $hardcodedDisplay.children;
         let isShown = false;
         let j = 0;
         let child, grandChildren, grandChildrenLength;
         switch (i) {
            case 1:
               child = children.item(j);
               grandChildren = child.children;
               grandChildrenLength = grandChildren.length;
               for (; j < grandChildrenLength; j++)
                  if (grandChildren[j].style.display !== "none") {
                     isShown = true;
                     break;
                  }
               if (isShown) continue;
               child.style.display = "none";
               j = 1;
               break;
            default:
               break;
         }
         const childrenLength = children.length;
         const hardcodedDisplayStyle = $hardcodedDisplay.style;
         for (; j < childrenLength; j++)
            if (children.item(j).style.display !== "none") {
               isShown = true;
               break;
            }
         !isShown && (hardcodedDisplayStyle.display = "none");
      }
      return $ui;
   }

   // DRAG EVENTS
   fnContentDragStart(event) {
      event.stopPropagation();
      const $eventTarget = event.target;
      const dataset = $eventTarget.dataset;
      const dataTransfer = event.dataTransfer;
      const data = {};
      switch ($eventTarget.className) {
         case "webix_list_item":
            data.pk = dataset.pk;
            data.contentLinkedFieldID = dataset.contentLinkedFieldId;
            break;
         default:
            data.source = dataset.source;
            break;
      }
      dataTransfer.setData("text/plain", JSON.stringify(data));
      // $eventTarget.style.opacity = "0.5";
   }
   fnContentDragOver(event) {
      event.preventDefault();
      event.stopPropagation();
   }

   fnContentDragEnd(event) {
      // event.target.style.opacity = "1";
   }

   async fnContentDrop(event) {
      const settings = this.view.settings;
      const dropContentToCreate = settings.dropContentToCreate === 1;
      const nodeObj = this.view.datacollection?.datasource;
      const nodeObjPK = nodeObj.PK();
      const contentFieldLink = nodeObj.fieldByID(
         settings.contentField
      )?.fieldLink;
      const contentObj = contentFieldLink?.object;
      const contentDateStartFieldColumnName = contentObj?.fieldByID(
         settings.contentFieldDateStart
      )?.columnName;
      const contentDateEndFieldColumnName = contentObj?.fieldByID(
         settings.contentFieldDateEnd
      )?.columnName;
      const contentGroupByField = contentObj?.fieldByID(
         settings.contentGroupByField
      );
      const contentGroupByFieldColumnName = contentGroupByField?.columnName;
      const contentFieldLinkColumnName = contentFieldLink?.columnName;
      const contentModel = contentObj?.model();

      const dataTransfer = event.dataTransfer;
      if (dataTransfer.getData("isnode") == 1) return;
      event.stopPropagation();
      if (contentFieldLinkColumnName == null) return;
      const $group = event.currentTarget;
      const newGroupDataPK = $group.dataset.pk;
      const newNodeDataPK = JSON.parse(
         $group.parentElement.parentElement.dataset.source
      )._rawData[nodeObjPK];
      let {
         source: updatedData,
         pk: dataPK,
         contentLinkedFieldID,
      } = JSON.parse(dataTransfer.getData("text/plain"));
      const orgchart = this.__orgchart;
      if (!updatedData) {
         // This is a drop from Employee list (new assignment)
         const contentLinkedFieldColumnName =
            contentObj.fieldByID(contentLinkedFieldID).columnName;
         const pendingPromises = [];
         const newDate = new Date();
         orgchart.querySelectorAll(".team-group-record").forEach((e) => {
            const contentData = JSON.parse(e.dataset.source);
            if (contentData[contentLinkedFieldColumnName] == dataPK) {
               contentData[contentDateEndFieldColumnName] = newDate;
               pendingPromises.push(
                  contentModel.update(contentData.id, contentData)
               );
            }
         });
         updatedData = {};
         updatedData[contentDateStartFieldColumnName] = newDate;
         updatedData[contentLinkedFieldColumnName] = this._parseDataPK(dataPK);
         updatedData[contentFieldLinkColumnName] =
            this._parseDataPK(newNodeDataPK);
         updatedData[contentGroupByFieldColumnName] =
            this._parseDataPK(newGroupDataPK);
         if (this.entityDC) {
            const entityLink = this.entityDC?.datasource.connectFields(
               (f) => f.settings.linkObject === contentObj.id
            )[0].id;
            const entityCol = this.AB.definitionByID(entityLink).columnName;
            updatedData[entityCol] = this._parseDataPK(
               this.entityDC.getCursor()
            );
         }
         pendingPromises.push(
            contentModel.create(updatedData),
            (async () => {
               $group
                  .querySelector(".team-group-content")
                  .appendChild(await this.contentRecordUI(updatedData, "grey"));
            })()
         );
         await Promise.all(pendingPromises);
      } else {
         updatedData = JSON.parse(updatedData);

         // This is move form another team node
         // Move the child node to the target
         const dragged = document.querySelector(
            `#${this.contentNodeID(updatedData.id)}`
         );
         dragged.parentNode.removeChild(dragged);
         $group.querySelector(".team-group-content").appendChild(dragged);
         delete updatedData["created_at"];
         delete updatedData["updated_at"];
         delete updatedData["properties"];
         if (dropContentToCreate) {
            const pendingPromises = [];

            // TODO (Guy): Force update Date End with a current date.
            updatedData[contentDateEndFieldColumnName] = new Date();
            pendingPromises.push(
               contentModel.update(updatedData.id, updatedData)
            );
            updatedData[contentDateStartFieldColumnName] =
               updatedData[contentDateEndFieldColumnName];
            delete updatedData["id"];
            delete updatedData["uuid"];
            delete updatedData[contentDateEndFieldColumnName];
            updatedData[contentFieldLinkColumnName] = newNodeDataPK;
            updatedData[contentGroupByFieldColumnName] = newGroupDataPK;
            pendingPromises.push(contentModel.create(updatedData));
            await Promise.all(pendingPromises);
         } else {
            updatedData[contentFieldLinkColumnName] = newNodeDataPK;
            updatedData[contentGroupByFieldColumnName] = newGroupDataPK;
            await contentModel.update(updatedData.id, updatedData);
         }
      }
      await this.refresh();
   }

   // HELPERS

   /**
    * generate a id for the assignment dom node based on it's record id
    * @param {string} id record id
    */
   contentNodeID(id) {
      return `contentnode_${id}`;
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

/**
 * Creates a new HTML element with the given type and classes.
 * @param {string} type - The type of the HTML element to create.
 * @param {string} classes - A space-separated list of classes to add to the element.
 * @returns {Element} The newly created HTML element.
 */
function element(type, classes) {
   const elem = document.createElement(type);
   elem.classList.add(...classes.split(" "));
   return elem;
}

function fieldToOption(f) {
   return {
      id: f.id,
      value: f.text,
   };
}
