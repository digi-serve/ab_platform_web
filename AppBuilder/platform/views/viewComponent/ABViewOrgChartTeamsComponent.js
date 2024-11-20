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
            ids,
         ),
      );
      this.__filters = {};
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
      this.generateStrategyCss();
      await this.loadOrgChartJs();
      await this.pullData();
      await this.displayOrgChart();
      this.ready();
   }

   async displayOrgChart() {
      const baseView = this.view;
      const AB = this.AB;
      const L = AB.Label();
      const chartData = AB.cloneDeep(this.chartData);
      const settings = baseView.settings;
      const showGroupTitle = settings.showGroupTitle === 1;
      const draggable = settings.draggable === 1;
      const dropContentToCreate = settings.dropContentToCreate === 1;
      const nodeDC = baseView.datacollection;
      const nodeModel = baseView.datacollection.model;
      const nodeObj = nodeDC?.datasource;
      const nodeObjPK = nodeObj.PK();
      const contentField = nodeObj.fieldByID(settings.contentField);
      const contentFieldColumnName = contentField?.columnName;
      const contentFieldLink = contentField?.fieldLink;
      const contentObj = contentFieldLink?.object;
      const contentObjPK = contentObj?.PK();
      const contentDataRecordPKs = [];
      const contentDataRecords = [];
      if (contentField != null && contentObj != null) {
         const getContentDataRecordPKs = (node) => {
            const contentFieldData = node._rawData[contentFieldColumnName];
            if (Array.isArray(contentFieldData))
               contentDataRecordPKs.push(...contentFieldData);
            else contentDataRecordPKs.push(contentFieldData);
            const children = node.children || [];
            for (const child of children) getContentDataRecordPKs(child);
         };
         getContentDataRecordPKs(chartData);
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
                        JSON.parse(settings.contentFieldFilter),
                     ],
                  },
                  populate: true,
               })
            ).data,
         );
      }
      const contentGroupByField = contentObj?.fieldByID(
         settings.contentGroupByField,
      );
      const contentGroupOptions = contentGroupByField?.settings.options || [];
      const contentGroupOptionsLength = contentGroupOptions.length;
      const contentGroupByFieldColumnName = contentGroupByField?.columnName;
      const contentFieldLinkColumnName = contentFieldLink?.columnName;
      const contentObjID = contentObj?.id;
      const contentDisplayedFields = settings.contentDisplayedFields;
      const contentDisplayedFieldsKeys = Object.keys(contentDisplayedFields);
      const contentModel = contentObj?.model();
      const ids = this.ids;
      const callAfterRender = (callback) => {
         requestAnimationFrame(() => {
            requestAnimationFrame(callback);
         });
      };
      const fnContentDragStart = (event) => {
         event.stopPropagation();
         const $eventTarget = event.target;
         const dataset = $eventTarget.dataset;
         const dataTransfer = event.dataTransfer;
         switch ($eventTarget.className) {
            case "webix_list_item":
               dataTransfer.setData("dataPK", dataset.pk);
               dataTransfer.setData(
                  "contentLinkedFieldId",
                  dataset.contentLinkedFieldId,
               );
               break;
            default:
               dataTransfer.setData("source", dataset.source);
               break;
         }
         // $eventTarget.style.opacity = "0.5";
      };
      const fnContentDragOver = (event) => {
         event.preventDefault();
         event.stopPropagation();
      };
      const fnContentDragEnd = (event) => {
         // event.target.style.opacity = "1";
      };
      const fnContentDrop = async (event) => {
         event.stopPropagation();
         if (contentFieldLinkColumnName == null) return;
         const $group = event.currentTarget;
         const newGroupText = $group.dataset.text;
         const newNodeDataPK = JSON.parse(
            $group.parentElement.parentElement.dataset.source,
         )._rawData[nodeObjPK];
         const dataTransfer = event.dataTransfer;
         let updatedData = dataTransfer.getData("source");
         this.__orgchart.innerHTML = "";
         if (updatedData === "") {
            const dataPK = dataTransfer.getData("dataPK");
            const contentLinkedFieldID = dataTransfer.getData(
               "contentLinkedFieldId",
            );
            const contentLinkedField =
               contentObj.fieldByID(contentLinkedFieldID);
            updatedData = {};
            updatedData[contentLinkedField.columnName] = dataPK;
            updatedData[contentFieldLinkColumnName] = newNodeDataPK;
            updatedData[contentGroupByFieldColumnName] = newGroupText;
            await contentModel.create(updatedData);
         } else {
            delete updatedData["created_at"];
            delete updatedData["updated_at"];
            delete updatedData["properties"];
            if (dropContentToCreate) {
               updatedData = JSON.parse(updatedData);
               delete updatedData["id"];
               delete updatedData["uuid"];
               updatedData[contentFieldLinkColumnName] = newNodeDataPK;
               updatedData[contentGroupByFieldColumnName] = newGroupText;
               await contentModel.create(updatedData);
            } else {
               updatedData[contentFieldLinkColumnName] = newNodeDataPK;
               updatedData[contentGroupByFieldColumnName] = newGroupText;
               await contentModel.update(updatedData.id, updatedData);
            }
         }
         // TODO (Guy): This is refreshing the whole chart.
         await this.onShow();
         // setTimeout(async () => {
         //    await this.onShow();
         // }, 1000);
      };
      const editContentFieldsToCreateNew =
         settings.editContentFieldsToCreateNew;
      const showContentForm = async (contentDataRecord) => {
         const rules = {};
         const contentFormElements = await Promise.all(
            contentObj.fields().map(async (field) => {
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
                     };
                  case "number":
                     return {
                        view: "counter",
                        name: fieldName,
                        label: fieldLabel,
                        type: "number",
                     };
                  case "list":
                     return {
                        view:
                           (settings.isMultiple === 1 && "muticombo") ||
                           "combo",
                        name: fieldName,
                        label: fieldLabel,
                        options: settings.options.map((option) => ({
                           id: option.id,
                           value: option.text,
                        })),
                     };
                  case "user":
                  case "connectObject":
                     const fieldLinkObj = field.datasourceLink;

                     // TODO (Guy): Fix pulling all connections.
                     const options = (
                        await fieldLinkObj.model().findAll()
                     ).data.map((e) => ({
                        id: e.id,
                        value: fieldLinkObj.displayData(e),
                     }));
                     return field.linkType() === "one"
                        ? {
                             view: "combo",
                             name: fieldName,
                             label: fieldLabel,
                             options,
                          }
                        : {
                             view: "multicombo",
                             name: fieldName,
                             label: fieldLabel,
                             stringResult: false,
                             labelAlign: "left",
                             options,
                          };
                  case "date":
                  case "datetime":
                     return {
                        view: "datepicker",
                        name: fieldName,
                        label: fieldLabel,
                        timepicker: fieldKey === "datetime",
                        width: 300,
                     };
                  case "file":
                  case "image":
                     // TODO (Guy): Add logic
                     return {
                        // view: "",
                        name: fieldName,
                        label: fieldLabel,
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
                     };
               }
            }),
         );
         contentFormElements.push({
            view: "button",
            value: L("Submit"),
            css: "webix_primary",
            click: async () => {
               const $contentFormData = $$(ids.contentFormData);
               if (!$contentFormData.validate()) return;
               const newFormData = $contentFormData.getValues();
               let isDataChanged = false;
               for (const key in newFormData)
                  if (
                     JSON.stringify(newFormData[key]) !==
                     JSON.stringify(contentDataRecord[key])
                  ) {
                     isDataChanged = true;
                     break;
                  }
               const $contentForm = $$(ids.contentForm);
               if (!isDataChanged) {
                  $contentForm.hide();
                  return;
               }
               delete newFormData["created_at"];
               delete newFormData["updated_at"];
               delete newFormData["properties"];
               for (const editContentFieldToCreateNew of editContentFieldsToCreateNew) {
                  const editContentFieldToCreateNewColumnName =
                     contentObj.fieldByID(
                        editContentFieldToCreateNew,
                     ).columnName;
                  if (
                     JSON.stringify(
                        newFormData[editContentFieldToCreateNewColumnName] ??
                           "",
                     ) !== 
                     JSON.stringify(
                        contentDataRecord[
                           editContentFieldToCreateNewColumnName
                        ] ?? "",
                     )
                  ) {
                     this.__orgchart.innerHTML = "";
                     delete newFormData["id"];
                     delete newFormData["uuid"];
                     await contentModel.create(newFormData);
                     $contentForm.hide();
                     await this.onShow();
                     return;
                  }
               }
               this.__orgchart.innerHTML = "";
               await contentModel.update(newFormData.id, newFormData);
               $contentForm.hide();
               await this.onShow();
            },
         });
         AB.Webix.ui({
            view: "popup",
            id: ids.contentForm,
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
                           label: L("Edit Content"),
                           align: "left",
                        },
                        {
                           view: "button",
                           value: "X",
                           align: "right",
                           click: () => {
                              $$(ids.contentForm).hide();
                           },
                        },
                     ],
                  },
                  {
                     view: "form",
                     id: ids.contentFormData,
                     elements: contentFormElements,
                     rules,
                  },
               ],
            },
            on: {
               onHide() {
                  this.destructor();
               },
            },
         }).show();
         $$(ids.contentFormData).setValues(contentDataRecord);
      };
      const orgchart = new this.OrgChart({
         data: chartData,
         direction: baseView.settings.direction,
         // depth: baseView.settings.depth,
         chartContainer: `#${ids.chartDom}`,
         pan: true, // baseView.settings.pan == 1,
         zoom: true, //baseView.settings.zoom == 1,
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
               $node.style.height = "";
               $content.style.display = "none";
               return;
            }
            $node.style.height = "250px";
            const averageHeight = 80 / contentGroupOptionsLength;
            const currentNodeDataRecordPK = data._rawData[nodeObjPK];
            const $nodeSpacer = element("div", "spacer");
            $content.appendChild($nodeSpacer);
            $nodeSpacer.style.backgroundColor = contentGroupOptions[0].hex;
            for (const group of contentGroupOptions) {
               const $group = element("div", "team-group-section");
               $content.appendChild($group);
               const groupStyle = $group.style;
               groupStyle["height"] = `${averageHeight}%`;
               const groupColor = group.hex;
               groupStyle["backgroundColor"] = groupColor;
               const groupText = group.text;
               $group.setAttribute("data-text", groupText);
               if (showGroupTitle) {
                  const $groupTitle = element("div", "team-group-title");
                  const groupTitleStyle = $groupTitle.style;
                  groupTitleStyle["backgroundColor"] = groupColor;
                  groupTitleStyle["height"] = "20%";
                  $groupTitle.appendChild(document.createTextNode(groupText));
                  $group.appendChild($groupTitle);
               }
               const $groupContent = element("div", "team-group-content");
               $group.appendChild($groupContent);
               if (draggable) {
                  $group.addEventListener("dragover", fnContentDragOver);
                  $group.addEventListener("drop", fnContentDrop);
               }
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
                  for (const key in contentDataRecord)
                     key.includes("__relation") &&
                        delete contentDataRecord[key];
                  const $rowData = element("div", "team-group-record");
                  $rowData.setAttribute(
                     "data-source",
                     JSON.stringify(contentDataRecord),
                  );
                  $groupContent.appendChild($rowData);
                  $rowData.addEventListener("click", async () => {
                     await showContentForm(contentDataRecord);
                  });
                  if (draggable) {
                     $rowData.setAttribute("draggable", "true");
                     $rowData.addEventListener("dragstart", fnContentDragStart);
                     $rowData.addEventListener("dragend", fnContentDragEnd);
                  }
                  const rowDataStyle = $rowData.style;
                  rowDataStyle["borderColor"] = "#EF3340";
                  let currentDataRecords = [];
                  let currentField = null;
                  for (let j = 0; j < contentDisplayedFieldsKeys.length; j++) {
                     const displayedFieldKey = contentDisplayedFieldsKeys[j];
                     const [atDisplay, objID] = displayedFieldKey.split(".");
                     const displayedObj = AB.objectByID(objID);
                     const displayedObjPK = displayedObj.PK();
                     const displayedField = displayedObj.fieldByID(
                        contentDisplayedFields[displayedFieldKey],
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
                     const $currentDisplay = element(
                        "div",
                        "team-group-record-display",
                     );
                     $rowData.appendChild($currentDisplay);
                     const displayedFieldColumnName = displayedField.columnName;
                     while (currentDataRecords.length > 0)
                        $currentDisplay.appendChild(
                           document.createTextNode(
                              currentDataRecords.pop()[
                                 displayedFieldColumnName
                              ],
                           ),
                        );
                     currentField = null;
                  }
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
               (e) => e.id === dataID,
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
         },
         nodeContent: "description",
      });
      this.__orgchart = orgchart;
      if (draggable) {
         // On drop update the parent (dropZone) of the node
         orgchart.addEventListener("nodedropped.orgchart", async (event) => {
            const eventDetail = event.detail;
            const dragedRecord = JSON.parse(
               eventDetail.draggedNode.dataset.source,
            )._rawData;
            dragedRecord[
               // Parent node definition.
               this.AB.definitionByID(
                  this.getSettingField("teamLink").settings.linkColumn,
               ).columnName
            ] = JSON.parse(eventDetail.dropZone.dataset.source)._rawData.id;
            await nodeModel.update(dragedRecord.id, dragedRecord);
         });
      }
      const chartDom = document.querySelector(`#${ids.chartDom}`);
      if (chartDom) {
         chartDom.textContent = "";
         chartDom.innerHTML = "";
         this.initFilter(chartDom);
         const ui = {
            cols: [
               {
                  view: "template",
                  scroll: "auto",
               },
            ],
         };
         if (settings.showDataPanel === 1) {
            const dataPanelUIs = [];
            const dataPanelDCs = settings.dataPanelDCs;
            for (const key in dataPanelDCs) {
               const dc = AB.datacollectionByID(key.split(".")[1]);
               await dc.waitForDataCollectionToInitialize(dc);
               const panelObj = dc.datasource;
               const contentFieldID = panelObj.connectFields(
                  (field) => field.datasourceLink.id === contentObjID,
               )[0].fieldLink.id;
               dataPanelUIs.push({
                  header: dataPanelDCs[key],
                  body: {
                     view: "list",
                     template: `${panelObj
                        .fields()
                        .map((field) => `#${field.columnName}#`)
                        .join(" ")}`,
                     css: { overflow: "auto" },
                     data: dc.getData(),
                     on: {
                        onAfterRender() {
                           callAfterRender(() => {
                              const $itemElements =
                                 this.$view.children.item(0).children;
                              for (const $itemElement of $itemElements) {
                                 $itemElement.setAttribute(
                                    "data-content-linked-field-id",
                                    contentFieldID,
                                 );
                                 $itemElement.setAttribute(
                                    "data-pk",
                                    dc.getData(
                                       (e) =>
                                          e.id ===
                                          $itemElement.getAttribute(
                                             "webix_l_id",
                                          ),
                                    )[0][panelObj.PK()],
                                 );
                                 $itemElement.setAttribute("draggable", "true");
                                 $itemElement.addEventListener(
                                    "dragstart",
                                    fnContentDragStart,
                                 );
                                 $itemElement.addEventListener(
                                    "dragend",
                                    fnContentDragEnd,
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
         $chartContent.children[0].children[0].appendChild(orgchart);
         chartDom.appendChild($chartContent);
      }
   }

   async pullData() {
      const filters = this.__filters;
      const view = this.view;
      const dc = view.datacollection;
      await dc?.waitForDataCollectionToInitialize(dc);

      let topNode = dc?.getCursor();
      if (view.settings.topTeam) {
         const topNodeColumn = this.AB.definitionByID(
            view.settings.topTeam,
         ).columnName;
         const topFromFeild = dc.getData((e) => e[topNodeColumn] === 1)[0];
         topNode = topFromFeild ? topFromFeild : topNode;
      }
      if (!topNode) return null;

      const teamLink = this.getSettingField("teamLink").columnName;
      const teamName = this.getSettingField("teamName").columnName;
      const teamInactive = this.getSettingField("teamInactive").columnName;
      const strategy = this.getSettingField("teamStrategy").columnName;
      const strategyCode = this.getSettingField("strategyCode").columnName;

      const chartData = (this._chartData = {});
      chartData.name = topNode[teamName] ?? "";
      chartData.id = this.teamNodeID(topNode.id);
      chartData.className = `strategy-${
         topNode[`${strategy}__relation`]?.[strategyCode]
      }`;
      chartData.isInactive = topNode[teamInactive];
      chartData._rawData = topNode;

      const maxDepth = 10; // prevent inifinite loop
      const self = this;
      function pullChildData(node, depth = 0) {
         if (depth >= maxDepth) return;
         node.children = [];
         node._rawData[teamLink].forEach((id) => {
            const childData = dc.getData((e) => e.id === id)[0];
            // Don't show inactive teams
            if (
               (filters?.inactive !== 1 && childData[teamInactive]) ||
               childData == null
            )
               return;
            const code = childData[`${strategy}__relation`]?.[strategyCode];
            const strategyClass = `strategy-${code}`;
            const child = {
               name: childData[teamName],
               id: self.teamNodeID(id),
               className: strategyClass,
               isInactive: childData[teamInactive],
               _rawData: childData,
            };
            child.filteredOut = self.filterTeam(filters, child, code);
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
               a.name > b.name ? 1 : -1,
            );
         }
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

   initFilter(domNode) {
      const filterButton = document.createElement("button");
      filterButton.innerHTML = `<i class="fa fa-filter"></i> Filter`;
      filterButton.classList.add("filter-button");
      filterButton.onclick = () => this.filterWindow(filterButton);
      domNode.append(filterButton);
   }

   async filterWindow(buttonNode) {
      let $popup = $$(this.ids.filterPopup);
      if (!$popup) {
         const [strategyField] = this.datacollection.datasource.fields(
            (f) => f.id == this.view.settings["teamStrategy"],
         );
         const strategyOptions = await strategyField.getOptions();

         $popup = webix.ui({
            view: "popup",
            css: "filter-popup",
            id: this.ids.filterPopup,
            body: {
               view: "form",
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
                     options: strategyOptions.map((f) => f.text),
                     name: "strategy",
                     clear: "replace",
                  },
                  {
                     view: "checkbox",
                     name: "inactive",
                     labelRight: this.label("Show Inactive Teams"),
                     labelWidth: 0,
                  },
                  {
                     view: "button",
                     label: this.label("Apply"),
                     click: () => this.filterApply(),
                  },
               ],
            },
         });
      }
      $popup.show(buttonNode);
   }

   filterApply() {
      $$(this.ids.filterPopup).hide();
      this.__filters = $$(this.ids.filterForm).getValues();
      this.pullData().then(() => this.displayOrgChart());
   }

   filterTeam(filters, team, code) {
      // Apply filters (match using or)
      if (filters.strategy || filters.teamName) {
         let filter = true;
         if (filters.strategy !== "" && filters.strategy === code) {
            filter = false;
         }
         if (
            filters.teamName !== "" &&
            team.name.toLowerCase().includes(filters.teamName.toLowerCase())
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
            `org-chart .strategy-${key} .title{background:${colors[key]} !important;}`,
         );
      }
      const style = document.createElement("style");
      style.innerHTML = css.join("");
      document.getElementsByTagName("head")[0].appendChild(style);
   }

   async teamAddChild(values, strategy) {
      const { id } = await this.datacollection.model.create(values);

      const linkField = this.AB.definitionByID(
         this.getSettingField("teamLink").settings.linkColumn,
      ).columnName;
      const nameField = this.getSettingField("teamName").columnName;
      const parent = document.querySelector(
         `#${this.teamNodeID(values[linkField])}`,
      );
      const hasChild = parent.parentNode.colSpan > 1;
      const newChild = {
         name: values[nameField],
         id: this.teamNodeID(id),
         relationship: hasChild ? "110" : "100",
         className: `strategy-${strategy.text}`,
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
      return this.AB.Webix.confirm({
         text: "This can't be undone, are you sure?",
      }).then(() => {
         this.datacollection.model.delete(values.id);
         const nodeID = this.teamNodeID(values.id);
         this.__orgchart.removeNodes(document.querySelector(`#${nodeID}`));
      });
   }

   teamEdit(values, strategy) {
      this.datacollection.model.update(values.id, values).catch((err) => {
         //TODO
      });
      const nodeID = this.teamNodeID(values.id);
      const node = document.querySelector(`#${nodeID}`);
      const currentStrategy = node.classList?.value?.match(/strategy-\S+/)[0];
      const newStrategy = `strategy-${strategy.text}`;
      if (currentStrategy !== newStrategy) {
         node.classList?.remove(currentStrategy);
         node.classList?.add(newStrategy);
      }

      const inactive = this.getSettingField("teamInactive").columnName;
      if (
         this.__filters.inactive &&
         this.__filters.inactive === 0 &&
         values[inactive]
      ) {
         this.__orgchart.removeNodes(node);
      }
      const nameCol = this.getSettingField("teamName").columnName;
      node.querySelector(".title").innerHTML = values[nameCol];
   }

   async teamForm(mode, values) {
      let $teamFormPopup = $$(this.ids.teamFormPopup);
      const inactive = this.getSettingField("teamInactive").columnName;
      const linkField = this.AB.definitionByID(
         this.getSettingField("teamLink").settings.linkColumn,
      ).columnName;
      if (!$teamFormPopup) {
         const nameField = this.getSettingField("teamName");
         const [strategyField] = this.datacollection.datasource.fields(
            (f) => f.id == this.view.settings["teamStrategy"],
         );
         const strategyOptions = await strategyField.getOptions();
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
                           view: "richselect",
                           label:
                              strategyField.label ?? strategyField.columnName,
                           name: strategyField.columnName,
                           options: strategyOptions.map(fieldToOption),
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
                              const strategy = strategyOptions.find(
                                 (f) =>
                                    f.id === values[strategyField.columnName],
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
