const ABViewComponent = require("./ABViewComponent").default;
const DC_OFFSET = 20;
const RECORD_LIMIT = 20;
module.exports = class ABViewOrgChartTeamsComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewOrgChart_${baseView.id}`,
         Object.assign(
            {
               chartView: "",
               chartDom: "",
               chartContent: "",
               dataPanel: "",
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
      this._resources = [
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
      ];
      this.__filters = {
         inactive: 0,
      };
      this._OrgChart = null;
      this._resolveInit = null;
      this._promiseInit = new Promise((resolve) => {
         this._resolveInit = resolve;
      });
      this._promisePageData = null;
      this._contentDC = null;
      this._contentGroupDC = null;
      this._contentDisplayDCs = [];
      this._dataPanelDCs = [];
      this._entityDC = null;
      this._chartData = null;

      // DRAG EVENTS
      this._fnContentDragEnd = (event) => {
         // event.target.style.opacity = "1";
      };
      this._fnContentDragOver = (event) => {
         event.preventDefault();
         event.stopPropagation();
      };
      this._fnContentDragStart = (event) => {
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
      };
      this._fnContentDrop = async (event) => {
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
         this.busy();
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
         const draggedNodes = [];
         try {
            if (!updatedData) {
               // This is a drop from Employee list (new assignment)
               const contentLinkedFieldColumnName =
                  contentObj.fieldByID(contentLinkedFieldID).columnName;
               const pendingPromises = [];
               const newDate = new Date();
               const $contentRecords =
                  document.getElementsByClassName("team-group-record");
               for (const $contentRecord of $contentRecords) {
                  const contentData = JSON.parse($contentRecord.dataset.source);
                  if (contentData[contentLinkedFieldColumnName] == dataPK) {
                     contentData[contentDateEndFieldColumnName] = newDate;
                     pendingPromises.push(
                        contentModel.update(contentData.id, contentData)
                     );
                     draggedNodes.push($contentRecord);
                  }
               }
               updatedData = {};
               updatedData[contentDateStartFieldColumnName] = newDate;
               updatedData[contentLinkedFieldColumnName] =
                  this._parseDataPK(dataPK);
               updatedData[contentFieldLinkColumnName] =
                  this._parseDataPK(newNodeDataPK);
               updatedData[contentGroupByFieldColumnName] =
                  this._parseDataPK(newGroupDataPK);
               const entityDC = this._entityDC;
               if (entityDC) {
                  const entityLink = entityDC.datasource.connectFields(
                     (f) => f.settings.linkObject === contentObj.id
                  )[0].id;
                  const entityCol =
                     this.AB.definitionByID(entityLink).columnName;
                  updatedData[entityCol] = this._parseDataPK(
                     entityDC.getCursor()
                  );
               }
               pendingPromises.push(
                  contentModel.create(updatedData),
                  (async () => {
                     const $draggedNode = await this._createUIContentRecord(
                        updatedData,
                        "grey"
                     );
                     $group
                        .querySelector(".team-group-content")
                        .appendChild($draggedNode);
                     draggedNodes.push($draggedNode);
                  })()
               );
               await Promise.all(pendingPromises);
            } else {
               updatedData = JSON.parse(updatedData);

               // This is move form another team node
               // Move the child node to the target
               const $draggedNode = document.querySelector(
                  `#${this.contentNodeID(updatedData.id)}`
               );
               $draggedNode.parentNode.removeChild($draggedNode);
               $group
                  .querySelector(".team-group-content")
                  .appendChild($draggedNode);
               draggedNodes.push($draggedNode);
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
         } catch (err) {
            // TODO (Guy): The update data error.
            console.log(err);
         }
         try {
            await Promise.all([
               this._reloadDCData(this.datacollection),
               this._reloadDCData(this._contentDC),
            ]);
            // await this._reloadAllDC();
         } catch (err) {
            // TODO (Guy): The reload DCs error.
            console.error(err);
         }
         await this.refresh();
         draggedNodes.forEach(($draggedNode) => {
            $draggedNode.remove();
         });
         this.ready();
      };
      this._fnCreateNode = async ($node, data) => {
         // remove built in icon
         $node.querySelector(".title > i")?.remove();

         // customize
         const $content = $node.children.item(1);
         $content.innerHTML = "";
         const contentGroupDC = this._contentGroupDC;
         const groupObjPKColumeName = contentGroupDC.datasource.PK();
         await this._waitDCReady(contentGroupDC);
         const contentGroupOptions = contentGroupDC.getData();
         const contentGroupOptionsLength = contentGroupOptions.length;
         if (data.filteredOut || contentGroupOptionsLength === 0) {
            // This node doesn't pass the filter, but it's children do so
            // simplify the display.
            $content.style.display = "none";
            return;
         }
         const settings = this.settings;
         const $nodeSpacer = element("div", "spacer");
         $content.appendChild($nodeSpacer);
         const nodeSpacerStyle = $nodeSpacer.style;
         nodeSpacerStyle.backgroundColor = "";
         for (const group of contentGroupOptions) {
            const $group = element("div", "team-group-section");
            $content.appendChild($group);
            const groupStyle = $group.style;
            groupStyle["minHeight"] = `${225 / contentGroupOptionsLength}px`;

            // TODO: should this be a config option
            const groupColor = group.name === "Leader" ? "#003366" : "#DDDDDD";
            groupStyle["backgroundColor"] = groupColor;
            nodeSpacerStyle.backgroundColor === "" &&
               (nodeSpacerStyle.backgroundColor = groupColor);

            // TODO: should this be a config option
            const groupText = group.name;
            $group.setAttribute("data-pk", group[groupObjPKColumeName]);
            if (settings.showGroupTitle === 1) {
               const $groupTitle = element("div", "team-group-title");
               const groupTitleStyle = $groupTitle.style;
               groupTitleStyle["backgroundColor"] = groupColor;
               $groupTitle.appendChild(document.createTextNode(groupText));
               $group.appendChild($groupTitle);
            }
            const $groupContent = element("div", "team-group-content");
            $group.appendChild($groupContent);
            if (settings.draggable === 1) {
               $group.addEventListener("dragover", this._fnContentDragOver);
               $group.addEventListener("drop", this._fnContentDrop);
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
         const values = this.datacollection.getData((e) => e.id == dataID)[0];
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
         if (this.__filters.inactive === 1) {
            const isInactive = data.isInactive;
            const activeClass = isInactive ? "is-inactive" : "is-active";
            const $active = element("div", `team-button ${activeClass}`);
            const $span = element("span", "active-text");
            $span.innerHTML = isInactive ? "INACTIVE" : "ACTIVE";
            $active.append($span);
            $buttons.append($active);
         }
      };
      this._fnNodeDrop = async (event) => {
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
         const dc = this.datacollection;
         this.busy();
         try {
            await dc.model.update(dragedRecord.id, dragedRecord);
         } catch (err) {
            // TODO (Guy): The update data error.
            console.error(err);
         }
         try {
            await Promise.all([
               this._reloadDCData(dc),
               this._reloadDCData(this._contentDC),
            ]);
            // await this._reloadAllDC();
         } catch (err) {
            // TODO (Guy): The reload DCs error.
            console.error(err);
         }
         await this.refresh();
         this.ready();
      };
      this._fnPageContentCallback = (
         contentRecords,
         isContentDone,
         contentDC,
         resolve
      ) => {
         const linkedContentFieldColumnName = this.AB.definitionByID(
            this.getSettingField("contentField").settings.linkColumn
         ).columnName;
         for (const contentRecord of contentRecords) {
            const $teamNode = document.getElementById(
               this.teamNodeID(contentRecord[linkedContentFieldColumnName])
            );
            if ($teamNode == null) continue;
            this._addContentRecordToGroup($teamNode, contentRecord);
         }

         // TODO (Guy): Hardcode data panel DCs for Employee.
         $$(this.ids.dataPanel)
            .getChildViews()[1]
            .getChildViews()
            .forEach(($childView) => $childView.callEvent("onViewShow"));
         if (isContentDone) resolve();
         else
            this._callPagingEvent(
               contentDC,
               this._fnPageContentCallback,
               resolve
            );
      };
      (this._fnPageContentGroupCallback = async (
         contentGroupRecords,
         isContentGroupDone,
         contentGroupDC,
         resolve
      ) => {
         const teamDC = this.datacollection;
         this._fnPageTeamCallback(teamDC.getData(), true, teamDC, () => {});
         if (isContentGroupDone) resolve();
         else
            this._callPagingEvent(
               contentGroupDC,
               this._fnPageContentGroupCallback,
               resolve
            );
      }),
         (this._fnPageContentDisplayCallback = (
            contentDisplayRecords,
            isContentDisplayDone,
            contentDisplayDC,
            resolve
         ) => {
            const contentDC = this._contentDC;
            this._fnPageContentCallback(
               contentDC.getData(),
               true,
               contentDC,
               () => {}
            );
            if (isContentDisplayDone) resolve();
            else
               this._callPagingEvent(
                  contentDisplayDC,
                  this._fnPageContentDisplayCallback,
                  resolve
               );
         });
      this._fnPageData = async (dc, callback, resolve) => {
         await this._waitDCReady(dc);
         let records = dc.getData();
         try {
            if (
               records.length < DC_OFFSET ||
               (records.length - DC_OFFSET) % RECORD_LIMIT > 0
            )
               throw null;
            try {
               await dc.loadData(
                  RECORD_LIMIT * parseInt(records.length / RECORD_LIMIT),
                  RECORD_LIMIT
               );
            } catch {}
            if (dc.getData().length === records.length) throw null;
            records = dc.getData();
            if ((records.length - DC_OFFSET) % RECORD_LIMIT > 0) throw null;
            callback && (await callback(records, false, dc, resolve));
         } catch {
            callback && (await callback(records, true, dc, resolve));
         }
      };
      this._fnPageTeamCallback = async (
         teamRecords,
         isTeamDone,
         teamDC,
         resolve
      ) => {
         const contentFieldColumnName =
            this.getSettingField("contentField").columnName;
         const contentDC = this._contentDC;
         const contentRecordPK = contentDC.datasource.PK();
         for (const teamRecord of teamRecords) {
            const teamNodeID = this.teamNodeID(teamRecord.id);
            let $teamNode = document.getElementById(teamNodeID);
            if ($teamNode == null) {
               await this.teamAddChild(teamRecord, false);
               $teamNode = document.getElementById(teamNodeID);
               if ($teamNode == null) continue;
            } else await this.teamEdit(teamRecord, null, false);
            const contentRecords = contentDC.getData(
               (contentRecord) =>
                  teamRecord[contentFieldColumnName].indexOf(
                     contentRecord[contentRecordPK]
                  ) > -1
            );
            for (const contentRecord of contentRecords)
               this._addContentRecordToGroup($teamNode, contentRecord);
         }
         if (isTeamDone) resolve();
         else
            this._callPagingEvent(
               this.datacollection,
               this._fnPageTeamCallback,
               resolve
            );
      };
      this._fnRefresh = async () => {
         this.busy();
         const entityDC = this._entityDC;
         const teamDC = this.datacollection;
         const contentDC = this._contentDC;
         const contentGroupDC = this._contentGroupDC;
         await Promise.all([
            teamDC.datacollectionLink != null && this._waitDCPending(teamDC),
            contentDC.datacollectionLink != null &&
               this._waitDCPending(contentDC),
            contentGroupDC.datacollectionLink != null &&
               this._waitDCPending(contentGroupDC),
            ...this._contentDisplayDCs
               .filter(
                  (contentDisplayDC) =>
                     contentDisplayDC !== entityDC &&
                     contentDisplayDC !== teamDC &&
                     contentDisplayDC !== contentDC &&
                     contentDisplayDC !== contentGroupDC
               )
               .map(
                  (contentDisplayDC) =>
                     contentDisplayDC.datacollectionLink != null &&
                     this._waitDCPending(contentDisplayDC)
               ),
         ]);
         this.__orgchart.remove();
         this.__orgchart = null;
         await this.refresh();
         this.ready();
      };
      this._fnShowContentForm = (event) => {
         const contentDC = this._contentDC;
         const contentObj = contentDC.datasource;
         const contentModel = contentDC.model;
         const settings = this.settings;
         const editContentFieldsToCreateNew =
            settings.editContentFieldsToCreateNew;
         const contentDateStartFieldColumnName = this.getSettingField(
            "contentFieldDateStart"
         )?.columnName;
         const contentDateEndFieldColumnName = this.getSettingField(
            "contentFieldDateEnd"
         )?.columnName;
         const contentDataRecord = JSON.parse(
            event.currentTarget.dataset.source
         );
         const rules = {};
         const labelWidth = 200;
         const ids = this.ids;
         const contentFormElements = settings.setEditableContentFields.map(
            (fieldID) => {
               const field = contentObj.fields(
                  (field) => field.id === fieldID
               )[0];
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
                           (settings.isMultiple === 1 && "muticombo") ||
                           "combo",
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
                                             await fieldLinkObj
                                                .model()
                                                .findAll({
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
                           this.refresh();
                           this.enable();
                           this.hideProgress();
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
                     title: "Warning",
                     ok: "Yes",
                     cancel: "No",
                     text: "You are about to confirm. Are you sure?",
                  })
                  .then(async () => {
                     this.busy();
                     const teamDC = this.datacollection;
                     const contentDC = this._contentDC;
                     const dataID = newFormData.id;
                     const $contentNode = document.getElementById(
                        this.contentNodeID(dataID)
                     );
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
                              newFormData[
                                 editContentFieldToCreateNewColumnName
                              ] ?? ""
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
                              contentModel.update(dataID, oldData)
                           );
                           newFormData[contentDateStartFieldColumnName] =
                              oldData[contentDateEndFieldColumnName];
                           delete newFormData["id"];
                           delete newFormData["uuid"];
                           delete newFormData[contentDateEndFieldColumnName];
                           pendingPromises.push(
                              contentModel.create(newFormData)
                           );
                           try {
                              await Promise.all(pendingPromises);
                           } catch (err) {
                              // TODO (Guy): The update data error.
                              console.error(err);
                           }
                           try {
                              await Promise.all([
                                 this._reloadDCData(teamDC),
                                 this._reloadDCData(contentDC),
                              ]);
                              // await this._reloadAllDC();
                           } catch (err) {
                              // TODO (Guy): The reload DCs error.
                              console.error(err);
                           }
                           await this.refresh();
                           $contentNode.remove();
                           this.ready();
                           return;
                        }
                     }
                     try {
                        await contentModel.update(dataID, newFormData);
                     } catch (err) {
                        // TODO (Guy): The update data error.
                        console.error(err);
                     }
                     try {
                        await Promise.all([
                           this._reloadDCData(teamDC),
                           this._reloadDCData(contentDC),
                        ]);
                        // await this._reloadAllDC();
                     } catch (err) {
                        // TODO (Guy): The reload DCs error.
                        console.error(err);
                     }
                     await this.refresh();
                     $contentNode.remove();
                     this.ready();
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
      };
      this._fnShowFilterPopup = async (event) => {
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
                           if (
                              contentDisplayedFieldFilterKey.split(".")[3] == 1
                           ) {
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
         $popup.show(event.currentTarget);
      };

      // Generate strategy css
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
      this.on("pageData", this._fnPageData);
   }

   _addContentRecordToGroup($teamNode, contentRecord) {
      const contentGroupDC = this._contentGroupDC;
      const contentGroupDataPK =
         contentRecord[this.getSettingField("contentGroupByField").columnName];
      const contentGroupPKField = contentGroupDC.datasource.PK();
      if (
         contentGroupDC.getData(
            (e) => e[contentGroupPKField] == contentGroupDataPK
         )[0] == null
      )
         return;
      const $groupSection = $teamNode.querySelector(
         `.team-group-section[data-pk="${contentGroupDataPK}"] > .team-group-content`
      );
      if ($groupSection == null) return;
      (async () => {
         await this._callAfterRender(async () => {
            const contentNodeID = this.contentNodeID(contentRecord.id);
            let $contentNode = document.getElementById(contentNodeID);
            while ($contentNode != null) {
               $contentNode.remove();
               $contentNode = document.getElementById(contentNodeID);
            }
            $groupSection.appendChild(
               await this._createUIContentRecord(
                  contentRecord,
                  this.settings.strategyColors[
                     $teamNode.classList.item(1).replace("strategy-", "")
                  ]
               )
            );
         });
      })();
   }

   async _createUIContentRecord(data, color) {
      const $ui = element("div", "team-group-record");
      $ui.setAttribute("id", this.contentNodeID(data.id));
      $ui.setAttribute("data-source", JSON.stringify(data));
      $ui.style.borderColor = color;
      $ui.addEventListener("click", this._fnShowContentForm);
      if (this.settings.draggable === 1) {
         $ui.setAttribute("draggable", "true");
         $ui.addEventListener("dragstart", this._fnContentDragStart);
         $ui.addEventListener("dragend", this._fnContentDragEnd);
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
      const contentDC = this._contentDC;
      const contentObjID = contentDC.datasource.id;
      const contentDisplayedFields = this.settings.contentDisplayedFields;
      const contentDisplayedFieldsKeys = Object.keys(contentDisplayedFields);
      const contentDisplayDCs = this._contentDisplayDCs;
      for (let j = 0; j < contentDisplayedFieldsKeys.length; j++) {
         const displayedFieldKey = contentDisplayedFieldsKeys[j];
         const [atDisplay, objID] = displayedFieldKey.split(".");
         const displayedObj = AB.objectByID(objID);
         const displayedFieldID = contentDisplayedFields[displayedFieldKey];
         const displayedField = displayedObj.fieldByID(displayedFieldID);
         const displayDC = contentDisplayDCs.find(
            (contentDisplayDC) => contentDisplayDC.datasource.id === objID
         );
         switch (objID) {
            case contentObjID:
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
                  await this._waitDCReady(displayDC);
                  currentDataRecords = displayDC.getData((r) => {
                     return currentDataPKs.some((id) => id == r.id);
                  });
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

   async _callAfterRender(callback, ...params) {
      await new Promise((resolve, reject) => {
         requestAnimationFrame(() => {
            requestAnimationFrame(async () => {
               try {
                  await callback(...params);
                  resolve();
               } catch (err) {
                  reject(err);
               }
            });
         });
      });
   }

   _callPagingEvent(dc, callback, resolve) {
      this.emit("pageData", dc, callback, resolve);
   }

   _initDC(dc) {
      dc.init();
      if (dc.dataStatus === dc.dataStatusFlag.notInitial) dc.loadData();
   }

   _pageData() {
      if (this._promisePageData != null) return;
      let resolvePageData = null;
      this._promisePageData = new Promise((resolve) => {
         resolvePageData = resolve;
      });
      const entityDC = this._entityDC;
      const teamDC = this.datacollection;
      const contentDC = this._contentDC;
      const contentGroupDC = this._contentGroupDC;
      (async () => {
         try {
            await Promise.all([
               new Promise((resolve) => {
                  this._callPagingEvent(
                     teamDC,
                     this._fnPageTeamCallback,
                     resolve
                  );
               }),
               new Promise((resolve) => {
                  this._callPagingEvent(
                     contentDC,
                     this._fnPageContentCallback,
                     resolve
                  );
               }),
               new Promise((resolve) => {
                  this._callPagingEvent(
                     contentGroupDC,
                     this._fnPageContentGroupCallback,
                     resolve
                  );
               }),
               ...this._contentDisplayDCs
                  .filter(
                     (contentDisplayDC) =>
                        contentDisplayDC !== entityDC &&
                        contentDisplayDC !== teamDC &&
                        contentDisplayDC !== contentDC &&
                        contentDisplayDC !== contentGroupDC
                  )
                  .map(
                     (contentDisplayDC) =>
                        new Promise((resolve) => {
                           this._callPagingEvent(
                              contentDisplayDC,
                              this._fnPageContentDisplayCallback,
                              resolve
                           );
                        })
                  ),
            ]);
         } catch (err) {
            // TODO (Guy): The paging error.
            console.error(err);
         }
         resolvePageData();
         this._promisePageData = null;
      })();
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

   async _reloadAllDC() {
      const entityDC = this._entityDC;
      const teamDC = this.datacollection;
      const contentDC = this._contentDC;
      const contentGroupDC = this._contentGroupDC;
      await Promise.all([
         this._reloadDCData(teamDC),
         ...this._dataPanelDCs.map((dataPanelDC) =>
            this._reloadDCData(dataPanelDC)
         ),
         this._reloadDCData(contentDC),
         ...this._contentDisplayDCs
            .filter(
               (contentDisplayDC) =>
                  contentDisplayDC !== entityDC &&
                  contentDisplayDC !== teamDC &&
                  contentDisplayDC !== contentDC &&
                  contentDisplayDC !== contentGroupDC
            )
            .map((contentDisplayDC) => this._reloadDCData(contentDisplayDC)),
      ]);
   }

   async _reloadDCData(dc) {
      await this._promisePageData;
      if (dc.dataStatus === dc.dataStatusFlag.initializing)
         await this._waitDCReady(dc);
      dc.clearAll();
      this._initDC(dc);
      await this._waitDCReady(dc);
   }

   _showDataPanel() {
      this.AB.Webix.ui(this._uiDataPanel(), $$(this.ids.dataPanel)).show();
   }

   _showOrgChart() {
      const settings = this.settings;
      const AB = this.AB;
      const draggable = settings.draggable === 1;
      const ids = this.ids;
      const orgchart = new this._OrgChart({
         data: AB.cloneDeep(this._chartData),
         direction: settings.direction,
         // depth: settings.depth,
         chartContainer: `#${ids.chartDom}`,
         pan: true, // settings.pan == 1,
         zoom: false, // settings.zoom == 1,
         draggable,
         // visibleLevel: settings.visibleLevel,
         parentNodeSymbol: false,
         exportButton: settings.export,
         exportFilename: settings.exportFilename,
         createNode: this._fnCreateNode,
         nodeContent: "description",
      });

      // On drop update the parent (dropZone) of the node
      if (draggable)
         orgchart.addEventListener("nodedropped.orgchart", this._fnNodeDrop);
      if (this.__orgchart != null) {
         const oldOrgchart = this.__orgchart;
         orgchart.dataset.panStart = oldOrgchart.dataset.panStart;
         orgchart.setAttribute("style", oldOrgchart.getAttribute("style"));
         oldOrgchart.remove();
      }
      $$(ids.chartContent).$view.children[0].appendChild(
         (this.__orgchart = orgchart)
      );
   }

   _uiDataPanel() {
      const self = this;
      const _dataPanelDCs = self._dataPanelDCs;
      const dataPanelDCs = self.settings.dataPanelDCs;
      const contentObjID = this._contentDC?.datasource?.id;
      const cells = [];
      for (const key in dataPanelDCs) {
         const dataPanelDCID = key.split(".")[1];

         // TODO (Guy): Hardcode data panel DCs for Employee.
         // const _dataPanelDC = _dataPanelDCs.find(
         //    (dataPanelDC) => dataPanelDC.id === dataPanelDCID
         // );
         const _dataPanelDC = self._contentDisplayDCs.find(
            (contentDisplayDC) =>
               contentDisplayDC.datasource.id ===
               _dataPanelDCs.find(
                  (dataPanelDC) => dataPanelDC.id === dataPanelDCID
               ).datasource.id
         );
         const contentDC = this._contentDC;
         const header = dataPanelDCs[key];
         if (_dataPanelDC == null)
            cells.push({
               header,
               body: {
                  view: "list",
                  css: { overflow: "auto", "max-height": "85%" },
                  data: [],
               },
            });
         else {
            const panelObj = _dataPanelDC.datasource;
            cells.push({
               header,
               body: {
                  view: "list",
                  template: (data) =>
                     `<div style="text-align: center;">${panelObj.displayData(
                        data
                     )}</div>`,
                  css: { overflow: "auto", "max-height": "85%" },
                  data: [],
                  on: {
                     async onViewShow() {
                        await self._waitDCReady(_dataPanelDC);
                        const contentLinkedField = panelObj.connectFields(
                           (field) => field.datasourceLink.id == contentObjID
                        )[0].fieldLink;
                        const contentLinkedFieldColumnName =
                           contentLinkedField.columnName;
                        this.clearAll();
                        this.define(
                           "data",
                           // _dataPanelDC.getData()
                           // TODO (Guy): Hardcode Employee DC.
                           _dataPanelDC
                              .getData((panelRecord) =>
                                 header === "Unassigned"
                                    ? contentDC.getData(
                                         (contentRecord) =>
                                            contentRecord[
                                               contentLinkedFieldColumnName
                                            ] == panelRecord.id
                                      )[0] == null
                                    : contentDC.getData(
                                         (contentRecord) =>
                                            contentRecord[
                                               contentLinkedFieldColumnName
                                            ] == panelRecord.id
                                      )[0] != null
                              )
                              .sort((a, b) => {
                                 if (a.firstName < b.firstName) {
                                    return -1;
                                 }
                                 if (a.firstName > b.firstName) {
                                    return 1;
                                 }
                                 return 0;
                              })
                        );
                        await self._callAfterRender(() => {
                           const $itemElements =
                              this.$view.children.item(0).children;
                           const itemElementsLength = $itemElements.length;
                           const contentFieldID = contentLinkedField.id;
                           let count = 0;
                           while (count < itemElementsLength) {
                              const $itemElement = $itemElements.item(count++);
                              $itemElement.setAttribute(
                                 "data-content-linked-field-id",
                                 contentFieldID
                              );
                              $itemElement.setAttribute(
                                 "data-pk",
                                 _dataPanelDC.getData(
                                    (e) =>
                                       e.id ==
                                       $itemElement.getAttribute("webix_l_id")
                                 )[0][panelObj.PK()]
                              );
                              $itemElement.setAttribute("draggable", "true");
                              $itemElement.addEventListener(
                                 "dragstart",
                                 self._fnContentDragStart
                              );
                              $itemElement.addEventListener(
                                 "dragend",
                                 self._fnContentDragEnd
                              );
                           }
                        });
                     },
                  },
               },
            });
         }
      }
      return {
         id: this.ids.dataPanel,
         hidden: true,
         view: "tabview",
         width: 450,
         tabbar: {
            height: 60,
            type: "bottom",
            css: "webix_dark",
         },
         cells,
      };
   }

   async _waitDCPending(dc) {
      switch (dc.dataStatus) {
         case dc.dataStatusFlag.notInitial:
         case dc.dataStatusFlag.initialized:
            await new Promise((resolve) => {
               dc.once("initializingData", resolve);
            });
            break;
         default:
            break;
      }
   }

   // TODO (Guy): Some DC.waitReady() won't be resolved.
   async _waitDCReady(dc) {
      const dataStatusFlag = dc.dataStatusFlag;
      switch (dc.dataStatus) {
         case dataStatusFlag.notInitial:
         case dataStatusFlag.initializing:
            await new Promise((resolve) => {
               dc.once("initializedData", resolve);
            });
            break;
         default:
            break;
      }
   }

   ui() {
      const self = this;
      const ids = self.ids;
      const AB = self.AB;
      const Webix = AB.Webix;
      const _ui = super.ui([
         {
            id: ids.chartView,
            view: "template",
            template: `<div id="${ids.chartDom}"></div>`,
            css: {
               position: "relative",
            },
            on: {
               onAfterRender() {
                  Webix.extend(this, Webix.ProgressBar);
                  const chartDom = document.querySelector(`#${ids.chartDom}`);
                  chartDom.textContent = "";
                  chartDom.innerHTML = "";
                  const $chartDomComponents = AB.Webix.ui({
                     cols: [
                        {
                           rows: [
                              {
                                 view: "template",
                                 height: 50,
                              },
                              {
                                 id: ids.chartContent,
                                 view: "template",
                                 scroll: "auto",
                              },
                           ],
                        },
                        self._uiDataPanel(),
                     ],
                  }).$view;
                  chartDom.appendChild($chartDomComponents);

                  // Add the filter button to the UI
                  const $filterButton = document.createElement("button");
                  $filterButton.innerHTML = `<i class="fa fa-filter"></i> Filter`;
                  $filterButton.classList.add("filter-button");
                  $filterButton.onclick = self._fnShowFilterPopup;
                  $chartDomComponents.children[0].children[0].children[0].append(
                     $filterButton
                  );
                  $$(ids.dataPanel).show();
               },
            },
         },
      ]);
      delete _ui.type;
      return _ui;
   }

   async init(AB, accessLevel) {
      await super.init(AB, accessLevel);
      const settings = this.settings;
      this._resources = await Promise.all(this._resources);
      this._OrgChart ||
         (this._OrgChart = (() => {
            const OrgChart = this._resources[0].default;
            const _oldOnDragStart = OrgChart.prototype._onDragStart;
            OrgChart.prototype._onDragStart = (event) => {
               event.dataTransfer.setData("isnode", 1);
               _oldOnDragStart.call(this.__orgchart, event);
            };
            return OrgChart;
         })());

      // Preparing for the entity DC and wait for setting a cursor.
      const entityDC =
         (() => {
            const entityDC = this._entityDC;
            if (entityDC != null) this._initDC(entityDC);
            return entityDC;
         })() ||
         (this._entityDC = await (async () => {
            const entityDC = this.AB.datacollectionByID(
               settings.entityDatacollection
            );
            if (entityDC != null) {
               this._initDC(entityDC);
               await Promise.all([
                  this._waitDCReady(entityDC),
                  new Promise((resolve) => {
                     const CHANGE_CURSOR = "changeCursor";
                     entityDC.off(CHANGE_CURSOR, this._fnRefresh);
                     if (entityDC.getCursor() != null) {
                        entityDC.on(CHANGE_CURSOR, this._fnRefresh);
                        resolve();
                     } else
                        entityDC.once(CHANGE_CURSOR, () => {
                           entityDC.on(CHANGE_CURSOR, this._fnRefresh);
                           resolve();
                        });
                  }),
               ]);
            }
            return entityDC;
         })());

      // Preparing for the data panel DCs.
      if (settings.showDataPanel === 1) {
         const _dataPanelDCs = this._dataPanelDCs;
         const dataPanelDCs = settings.dataPanelDCs;
         for (const key in dataPanelDCs) {
            const [, dataPanelDCID] = key.split(".");
            const _dataPanelDC = AB.datacollectionByID(dataPanelDCID);
            _dataPanelDCs.findIndex(
               (_dataPanelDC) => _dataPanelDC.id === dataPanelDCID
            ) < 0 && _dataPanelDCs.push(_dataPanelDC);
            this._initDC(_dataPanelDC);
         }
      }

      // Preparing for the content DC.
      const contentDC =
         this._contentDC ||
         (this._contentDC = (() => {
            const contentObj = this.AB.objectByID(
               this.getSettingField("contentField").settings.linkObject
            );
            const contentObjID = contentObj.id;
            const contentFieldFilter = JSON.parse(settings.contentFieldFilter);
            const contentDCSettings = {
               datasourceID: contentObjID,
               linkDatacollectionID: null,
               linkFieldID: null,
               objectWorkspace: {
                  filterConditions: {
                     glue: "and",
                     rules: [
                        // TODO (Guy): Hardcode date start filter.
                        {
                           key: contentObj.fieldByID(
                              settings.contentFieldDateStart
                           )?.id,
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
                                    key: contentObj.fieldByID(
                                       settings.contentFieldDateEnd
                                    )?.id,
                                    rule: "is_null",
                                    value: "",
                                 },
                              ]) ||
                              [],
                        },
                     ],
                  },
               },
            };
            if (entityDC != null) {
               const entityObjID = entityDC.datasource.id;
               (contentDCSettings.linkFieldID = contentObj.connectFields(
                  (f) => f.settings.linkObject === entityObjID
               )[0]?.id) &&
                  (contentDCSettings.linkDatacollectionID = entityDC.id);
            }
            const contentDC = AB.datacollectionNew({
               id: `dc.${contentObjID}`,
               settings: contentDCSettings,
            });
            contentDC.$dc.__prevLinkDcCursor = entityDC
               ?.getCursor()
               ?.id?.toString();
            this._initDC(contentDC);
            return contentDC;
         })());

      // Preparing for the content group DC.
      const contentGroupDC =
         this._contentGroupDC ||
         (this._contentGroupDC = (() => {
            const contentGroupObjID = contentDC.datasource.fieldByID(
               settings.contentGroupByField
            ).settings.linkObject;
            const contentGroupDCSettings = {
               datasourceID: contentGroupObjID,
               linkDatacollectionID: null,
               linkFieldID: null,
            };
            if (entityDC != null) {
               const entityObjID = entityDC.datasource.id;
               (contentGroupDCSettings.linkFieldID = this.AB.objectByID(
                  contentGroupObjID
               ).connectFields(
                  (f) => f.settings.linkObject === entityObjID
               )[0]?.id) &&
                  (contentGroupDCSettings.linkDatacollectionID = entityDC.id);
            }
            const contentGroupDC = this.AB.datacollectionNew({
               id: `dc.${contentGroupObjID}`,
               settings: contentGroupDCSettings,
            });
            contentGroupDC.$dc.__prevLinkDcCursor = entityDC
               ?.getCursor()
               ?.id?.toString();
            this._initDC(contentGroupDC);
            return contentGroupDC;
         })());

      // Prepare display DCs.
      const contentDisplayedFieldKeys = Object.keys(
         settings.contentDisplayedFields
      );
      if (contentDisplayedFieldKeys.length > 0) {
         const teamDC = this.datacollection;
         const teamObjID = teamDC.datasource.id;
         const contentObjID = contentDC.datasource.id;
         const contentGroupObjID = contentGroupDC.datasource.id;
         const contentDisplayDCSettings = {
            datasourceID: null,
            linkDatacollectionID: null,
            linkFieldID: null,
            fixSelect: "",
         };
         const contentDisplayDCs = this._contentDisplayDCs;
         let [, objID] = contentDisplayedFieldKeys.pop().split(".");
         while (contentDisplayedFieldKeys.length > 0) {
            if (
               contentDisplayDCs.findIndex(
                  (contentDisplayDC) => contentDisplayDC.datasource.id === objID
               ) < 0
            )
               switch (objID) {
                  case teamObjID:
                     this._initDC(teamDC);
                     contentDisplayDCs.push(teamDC);
                     break;
                  case contentObjID:
                     this._initDC(contentDC);
                     contentDisplayDCs.push(contentDC);
                     break;
                  case contentGroupObjID:
                     contentDisplayDCs.push(contentGroupDC);
                     this._initDC(contentGroupDC);
                     break;
                  default:
                     if (entityDC?.datasource.id === objID) {
                        this._initDC(entityDC);
                        contentDisplayDCs.push(entityDC);
                     } else {
                        contentDisplayDCSettings.datasourceID = objID;
                        if (entityDC != null) {
                           const entityObjID = entityDC.datasource.id;
                           (contentDisplayDCSettings.linkFieldID =
                              AB.objectByID(objID).connectFields(
                                 (f) => f.settings.linkObject === entityObjID
                              )[0]?.id) &&
                              (contentDisplayDCSettings.linkDatacollectionID =
                                 entityDC.id);
                        }
                        const contentDisplayDC = AB.datacollectionNew({
                           id: `dc.${objID}`,
                           settings: contentDisplayDCSettings,
                        });
                        contentDisplayDC.$dc.__prevLinkDcCursor = entityDC
                           ?.getCursor()
                           ?.id?.toString();
                        this._initDC(contentDisplayDC);
                        contentDisplayDCs.push(contentDisplayDC);
                     }
                     break;
               }
            [, objID] = contentDisplayedFieldKeys.pop().split(".");
         }
      }
      this._resolveInit();
   }

   async onShow() {
      this.busy();
      this.AB.performance.mark("TeamChart.onShow");
      await this._promiseInit;
      super.onShow();
      this.AB.performance.mark("TeamChart.load");
      await this.refresh();
      this.AB.performance.measure("TeamChart.load");
      this.AB.performance.measure("TeamChart.onShow");
      this.ready();
   }

   /**
    * load the data and format it for display
    */
   async pullData() {
      const dc = this.datacollection;
      if (dc == null) return;
      const filters = this.__filters;
      const settings = this.settings;
      await this._waitDCReady(dc);
      let topNode = dc.getCursor();
      const topNodeColumn = this.getSettingField("topTeam").columnName;
      if (settings.topTeam) {
         const topFromField = dc.getData((e) => e[topNodeColumn] == 1)[0];
         topNode = topFromField ? topFromField : topNode;
      }
      if (!topNode) return null;
      const teamLink = this.getSettingField("teamLink").columnName;
      const teamName = this.getSettingField("teamName").columnName;
      const teamInactive = this.getSettingField("teamInactive").columnName;
      const strategyField = this.getSettingField("teamStrategy").columnName;
      const strategyCode = this.getSettingField("strategyCode").columnName;
      const MAX_DEPTH = 10; // prevent inifinite loop

      /**
       * Recursive function to prepare child node data
       * @param {object} node the current node
       * @param {number} [depth=0] a count of how many times we have recursed
       */
      const pullChildData = (node, depth = 0) => {
         if (depth >= MAX_DEPTH) return;
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
               id: this.teamNodeID(id),
               className: `strategy-${code}`,
               isInactive: childData[teamInactive],
               _rawData: childData,
            };

            child.filteredOut = this.filterTeam(filters, child, code);
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
      };
      const topNodeCode = topNode[`${strategyField}__relation`]?.[strategyCode];
      const chartData = (this._chartData = {
         id: this.teamNodeID(topNode.id),
         name: topNode[teamName] ?? "",
         className: `strategy-${topNodeCode}`,
         isInactive: topNode[teamInactive],
         _rawData: topNode,
         filteredOut: false,
      });
      chartData.filteredOut = this.filterTeam(filters, chartData, topNodeCode);
      pullChildData(chartData);
   }

   async refresh() {
      const ids = this.ids;
      $$(ids.teamFormPopup)?.destructor();
      $$(ids.contentForm)?.destructor();
      await this.pullData();
      this._showDataPanel();
      this._showOrgChart();
      this._pageData();
   }

   async filterApply() {
      this.busy();
      const ids = this.ids;
      $$(ids.filterPopup).hide();
      this.__filters = $$(ids.filterForm).getValues();
      await this.refresh();
      this.ready();
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
         const contentObjPK = this._contentDC.datasource.PK();
         if (
            this._contentDC.getData((contentDataRecord) => {
               if (Array.isArray(contentFieldData))
                  return (
                     contentFieldData.indexOf(contentDataRecord[contentObjPK]) >
                     -1
                  );
               return contentFieldData == contentDataRecord[contentObjPK];
            }).length > 0
         )
            filter = false;
         return filter;
      }
   }

   /**
    * Get the ABField from settings
    * @param {string} setting key in this.view.settings - should be an id for an
    * ABField
    */
   getSettingField(setting) {
      return this.AB.definitionByID(this.settings[setting]);
   }

   async teamAddChild(values, isServerSideUpdate = true) {
      const entityDC = this._entityDC;

      // Add the entity value
      if (entityDC) {
         const connection =
            isServerSideUpdate &&
            entityDC.datasource.connectFields(
               (f) => f.settings.linkObject === datacollection.datasource.id
            )[0];
         if (connection) {
            const entity = entityDC.getCursor();
            const cName = this.AB.definitionByID(
               connection.settings.linkColumn
            ).columnName;
            values[cName] = entity;
         }
      }
      const _rawData =
         (isServerSideUpdate &&
            (await this.datacollection.model.create(values))) ||
         values;
      const id = _rawData.id;
      const linkField = this.AB.definitionByID(
         this.getSettingField("teamLink").settings.linkColumn
      ).columnName;
      const nameField = this.getSettingField("teamName").columnName;
      const parent = document.querySelector(
         `#${this.teamNodeID(values[linkField])}`
      );
      if (parent == null) return;
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

   async teamEdit(values, strategy, isServerSideUpdate = true) {
      const strategyLink = this.getSettingField("teamStrategy").columnName;
      const strategyField = this.getSettingField("strategyCode").columnName;
      const strategyCode = strategy?.[strategyField];
      values[strategyLink] = strategy?.id || values[strategyLink];
      delete values[`${strategyLink}__relation`];
      isServerSideUpdate &&
         (await this.datacollection.model
            .update(values.id, values)
            .catch((err) => {
               //TODO
            }));
      const nodeID = this.teamNodeID(values.id);
      const node = document.querySelector(`#${nodeID}`);
      const currentStrategy = node.classList?.value?.match(/strategy-\S+/)[0];
      const newStrategy =
         (strategyCode && `strategy-${strategyCode}`) || currentStrategy;
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
         const entityDC = this._entityDC;
         const entityLink = strategyObj.connectFields(
            (f) => f.settings.linkObject === entityDC.datasource.id
         )[0];
         const cond = {
            glue: "and",
            rules: [
               {
                  key: entityLink.columnName,
                  value: entityDC.getCursor().id,
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
      $chartView.disable();
      $chartView.showProgress({ type: "icon" });
   }

   ready() {
      const $chartView = $$(this.ids.chartView);
      $chartView.enable();
      $chartView.hideProgress();
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
