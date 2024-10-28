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
      await this.displayOrgChart();
      this.ready();
   }

   async displayOrgChart() {
      const baseView = this.view;
      const AB = this.AB;
      const chartData = AB.cloneDeep(this.chartData);
      const settings = baseView.settings;
      const draggable = settings.draggable === 1;
      const dropContentToCreate = settings.$dropContentToCreate === 1;
      const nodeDC = baseView.datacollection;
      const nodeModel = baseView.datacollection.model;
      const nodeObj = nodeDC?.datasource;
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
                  JSON.parse(settings.contentFieldFilter),
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
      const contentModel = contentObj.model();
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
         createNode: async ($node, data) => {
            // remove built in icon
            $node.querySelector(".title > i")?.remove();

            // customize
            const $contentNode = $node.children.item(1);
            $contentNode.innerHTML = "";
            const averageHeight = 80 / contentGroupOptionsLength;
            const currentNodeDataRecordPK = data._rawData[nodeObjPK];
            const $nodeSpacer = element("div", "spacer");
            $contentNode.appendChild($nodeSpacer);
            $nodeSpacer.style.backgroundColor = contentGroupOptions[0].hex;
            for (const group of contentGroupOptions) {
               const $group = element("div", "team-group-section");
               $contentNode.appendChild($group);
               const groupStyle = $group.style;
               groupStyle["height"] = `${averageHeight}%`;
               const groupColor = group.hex;
               groupStyle["backgroundColor"] = groupColor;
               const $groupTitle = element("div", "team-group-title");
               // const groupTitleStyle = $groupTitle.style;
               // groupTitleStyle["backgroundColor"] = groupColor;
               // groupTitleStyle["height"] = "20%";
               const groupText = group.text;
               // $groupTitle.setAttribute(
               //    "id",
               //    `${currentNodeDataRecordPK}.${groupText}`
               // );
               // $groupTitle.appendChild(document.createTextNode(groupText));
               // $group.appendChild($groupTitle);
               const $groupContent = element("div", "team-group-content");
               $group.appendChild($groupContent);
               if (draggable) {
                  $group.addEventListener("drop", async (event) => {
                     const elementID = event.dataTransfer.getData("element-id");
                     if (elementID.includes("teamnode")) return;
                     const draggedContentDataRecord = JSON.parse(
                        document.getElementById(elementID).dataset.source
                     );
                     if (dropContentToCreate) {
                        // Trigger a process manager.
                        await contentModel.update(
                           draggedContentDataRecord.id,
                           draggedContentDataRecord
                        );
                        delete draggedContentDataRecord["id"];
                        delete draggedContentDataRecord["uuid"];
                        delete draggedContentDataRecord["created_at"];
                        delete draggedContentDataRecord["updated_at"];
                        draggedContentDataRecord[contentFieldLinkColumnName] =
                           currentNodeDataRecordPK;
                        draggedContentDataRecord[
                           contentGroupByFieldColumnName
                        ] = groupText;
                        await contentModel.create(draggedContentDataRecord);
                     } else {
                        draggedContentDataRecord[contentFieldLinkColumnName] =
                           currentNodeDataRecordPK;
                        draggedContentDataRecord[
                           contentGroupByFieldColumnName
                        ] = groupText;
                        await contentModel.update(
                           draggedContentDataRecord.id,
                           draggedContentDataRecord
                        );
                     }

                     // TODO (Guy): This is refreshing the whole chart.
                     await this.onShow();
                  });
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
                  const contentDataRecordPK = contentDataRecord[contentObjPK];
                  const rowDataID = `${currentNodeDataRecordPK}.${contentDataRecordPK}`;
                  const $rowData = element("div", "team-group-record");
                  $rowData.setAttribute(
                     "data-source",
                     JSON.stringify(contentDataRecord)
                  );
                  $groupContent.appendChild($rowData);
                  $rowData.setAttribute("id", rowDataID);
                  if (draggable) {
                     $rowData.setAttribute("draggable", "true");
                     $rowData.addEventListener("dragstart", (e) => {
                        e.dataTransfer.setData("element-id", e.target.id);
                        e.target.style.opacity = "0.5";
                     });
                     $rowData.addEventListener("dragend", (e) => {
                        e.target.style.opacity = "1";
                     });
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
                     const $currentDisplay = element(
                        "div",
                        "team-group-record-display"
                     );
                     $rowData.appendChild($currentDisplay);
                     const displayedFieldColumnName = displayedField.columnName;
                     while (currentDataRecords.length > 0) {
                        const $currentDisplayData = element(
                           "div",
                           "team-group-record-display-data"
                        );
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
            // const $leaderSection = element("div", "team-leader-section");
            // const $memberSection = element("div", "team-member-section");
            const $buttons = element("div", "team-button-section");
            const $editButton = element("div", "team-button");
            $editButton.append(element("i", "fa fa-pencil"));
            const $addButton = element("div", "team-button");
            $addButton.append(element("i", "fa fa-plus"));
            $buttons.append($editButton, $addButton);
            const dataID = this.teamRecordID(data.id);
            const values = this.datacollection.getData(
               (e) => e.id === dataID
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
            // $contentNode.append($leaderSection, $memberSection, $buttons);
            $contentNode.appendChild($buttons);
         },

         nodeContent: "description",
      });

      this.__orgchart = orgchart;

      if (draggable) {
         // On drop update the parent (dropZone) of the node
         orgchart.addEventListener("nodedropped.orgchart", async (event) => {
            const eventDetail = event.detail;
            const $draggedNode = eventDetail.draggedNode;
            if (!$draggedNode.getAttribute("id").includes("teamnode")) return;
            const dragNode = JSON.parse($draggedNode.dataset.source);
            const dropNode = JSON.parse(eventDetail.dropZone.dataset.source);
            const dragRecord = dragNode._rawData;
            const dropID = dropNode._rawData.id;

            const linkField = this.getSettingField("teamLink");
            const parent = this.AB.definitionByID(
               linkField.settings.linkColumn
            );
            dragRecord[parent.columnName] = dropID;
            await nodeModel.update(dragRecord.id, dragRecord);
         });
      }
      const chartDom = document.querySelector(`#${this.ids.chartDom}`);
      // const orgchartStyle = orgchart.style;
      // orgchartStyle["overflow"] = "auto";
      // let $currentNode = chartDom;
      // while ($currentNode.style["height"] === "")
      //    $currentNode = $currentNode.parentNode;
      // orgchartStyle["height"] = $currentNode.style["height"];
      if (chartDom) {
         chartDom.textContent = "";
         chartDom.innerHTML = "";
         chartDom.appendChild(orgchart);
         // this.toolbarUi(chartDom);
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

      const chartData = (this._chartData = {});
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
            if (childData[teamInactive] || childData == null) return;
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
      return this.AB.Webix.confirm({
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
                              if (values.id) {
                                 this.teamEdit(values);
                              } else {
                                 this.teamAddChild(values);
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
