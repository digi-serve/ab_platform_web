const ABViewComponent = require("./ABViewComponent").default;
const DC_OFFSET = 20;
const RECORD_LIMIT = 20;
const TEAM_CHART_MAX_DEPTH = 10; // prevent inifinite loop
module.exports = class ABViewOrgChartTeamsComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewOrgChart_${baseView.id}`,
         Object.assign(
            {
               chartView: "",
               // chartDom: "",
               chartContent: "",
               chartHeader: "",
               dataPanel: "",
               dataPanelButton: "",
               dataPanelPopup: "",
               filterButton: "",
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
            // TODO (Guy): Logic to not reload dcs.
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
            groupStyle["minHeight"] = `${325 / contentGroupOptionsLength}px`;

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
         $node.querySelector(".title").ondblclick = () =>
            this.teamForm("Edit", values);
         if (this.teamCanDelete(values)) {
            const $deleteButton = element("div", "team-button");
            $deleteButton.append(element("i", "fa fa-trash"));
            $deleteButton.onclick = () => this.teamDelete(values);
            $buttons.append($deleteButton);
         }
         if (this.__filters.inactive == 1) {
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
            // TODO (Guy): Logic to not reload dcs.
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
            ?.getChildViews()[1]
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
      this._fnPageContentGroupCallback = async (
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
      };
      this._fnPageContentDisplayCallback = (
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
      };
      this._fnPageData = async (dc, callback, resolve) => {
         await this._waitDCReady(dc);
         let records = dc.getData();
         try {
            // TODO (Guy): Figure out later why the employee dc which is not reloaded lost the data.
            if (records.length < DC_OFFSET) await dc.loadData();
            records = dc.getData();
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
            } else await this.teamEdit(teamRecord, false);
            const contentRecords = contentDC.getData(
               (contentRecord) =>
                  teamRecord[contentFieldColumnName].indexOf(
                     contentRecord[contentRecordPK]
                  ) > -1
            );
            for (const contentRecord of contentRecords)
               this._addContentRecordToGroup($teamNode, contentRecord);
         }
         if (isTeamDone) {
            await this.pullData();
            resolve();
         } else
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
         this.__orgchart?.remove();
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
            event.currentTarget.dataset.source ||
               event.currentTarget.parentElement.dataset.source
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
               let invalidMessage = "";
               switch (fieldName) {
                  case contentDateEndFieldColumnName:
                     invalidMessage = `The ${field.label} must be today or earlier.`;
                     rules[fieldName] = (value) => value <= new Date();
                     break;
                  default:
                     rules[fieldName] = () => true;
                     break;
               }
               const fieldLabel = field.label;
               const settings = field.settings;
               switch (fieldKey) {
                  case "boolean":
                     return {
                        view: "checkbox",
                        name: fieldName,
                        label: fieldLabel,
                        labelWidth,
                        invalidMessage,
                     };
                  case "number":
                     return {
                        view: "counter",
                        name: fieldName,
                        label: fieldLabel,
                        labelWidth,
                        type: "number",
                        invalidMessage,
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
                        invalidMessage,
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
                           invalidMessage,
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
                             invalidMessage,
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
                             invalidMessage,
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
                        invalidMessage,
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
                        invalidMessage,
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
                        invalidMessage,
                     };
               }
            }
         );
         const Webix = AB.Webix;
         contentFormElements.push({
            view: "button",
            value: this.label("Save"),
            css: "webix_primary",
            click: async () => {
               const $contentFormData = $$(ids.contentFormData);
               if (!$contentFormData.validate()) return;
               const newFormData = this._parseFormValueByType(
                  contentObj,
                  contentDataRecord,
                  $contentFormData.getValues()
               );
               const $contentForm = $$(ids.contentForm);
               $contentForm.blockEvent();
               $contentForm.$view.remove();
               $contentForm.destructor();
               if (!this._checkDataIsChanged(contentDataRecord, newFormData))
                  return;
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
                        newFormData[editContentFieldToCreateNewColumnName] ?? ""
                     ) !==
                     JSON.stringify(
                        contentDataRecord[
                           editContentFieldToCreateNewColumnName
                        ] ?? ""
                     )
                  ) {
                     Webix.confirm({
                        title: this.label("Caution: Creating New Assignment"),
                        ok: this.label("Continue with new assignment"),
                        cancel: this.label("Cancel"),
                        text: this.label(
                           "When you change the Role type or Job title, then the current assignment is closed with the current date and a new assignment is created for this team."
                        ),
                        css: "orgchart-teams-edit-content-confirm-popup",
                     }).then(async () => {
                        this.busy();
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
                        pendingPromises.push(contentModel.create(newFormData));
                        try {
                           await Promise.all(pendingPromises);
                        } catch (err) {
                           // TODO (Guy): The update data error.
                           console.error(err);
                        }
                        try {
                           // TODO (Guy): Logic to not reload dcs.
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
                     return;
                  }
               }
               if (
                  new Date(newFormData[contentDateEndFieldColumnName]) <=
                  new Date()
               ) {
                  Webix.confirm({
                     title: this.label("Caution: Ending Current Assignment"),
                     ok: this.label("Continue with ending this assignment"),
                     cancel: this.label("Cancel"),
                     text: [
                        this.label(
                           "When you provide an End Date, the current assignment is ended when the date = the current date and the assignment will no longer show on this team."
                        ),
                        this.label(
                           "This will put the team member back into the unassigned list box if they have no other active assignments."
                        ),
                     ].join("\n"),
                     css: "orgchart-teams-edit-content-confirm-popup",
                  }).then(async () => {
                     this.busy();
                     try {
                        await contentModel.update(dataID, newFormData);
                     } catch (err) {
                        // TODO (Guy): The update data error.
                        console.error(err);
                     }
                     try {
                        // TODO (Guy): Logic to not reload dcs.
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
                  return;
               }
               this.busy();
               try {
                  await contentModel.update(dataID, newFormData);
               } catch (err) {
                  // TODO (Guy): The update data error.
                  console.error(err);
               }
               try {
                  // TODO (Guy): Logic to not reload dcs.
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
            },
         });
         Webix.ui({
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
         $contentFormData.setValues(
            this._convertToFormValueByType(structuredClone(contentDataRecord))
         );
         $contentFormData.show();
      };
      this._fnShowFilterPopup = async (event) => {
         const contentDisplayedFieldFilters =
            this.settings.contentDisplayedFieldFilters;
         const ids = this.ids;
         let $popup = $$(ids.filterPopup);
         if (!$popup) {
            const strategyID =
               this.getSettingField("teamStrategy").settings.linkObject;
            const strategyObj = this.AB.objectByID(strategyID);
            const strategyCodeFieldID = this.getSettingField("strategyCode").id;
            const strategyCodeField = strategyObj.fields(
               (f) => f.id === strategyCodeFieldID
            )[0];
            $popup = webix.ui({
               view: "popup",
               css: "filter-popup",
               id: ids.filterPopup,
               body: {
                  rows: [
                     {
                        view: "form",
                        borderless: true,
                        hidden: true,
                        id: ids.filterForm,
                        elements: [
                           {
                              view: "text",
                              label: this.label("Team Name"),
                              labelWidth: 100,
                              name: "teamName",
                              clear: true,
                           },
                           {
                              view: "combo",
                              label: this.label("Strategy"),
                              labelWidth: 100,
                              options: [],
                              name: "strategy",
                              clear: "replace",
                              on: {
                                 async onViewShow() {
                                    webix.extend(this, webix.ProgressBar);
                                    this.showProgress({ type: "icon" });
                                    try {
                                       this.define(
                                          "options",
                                          (
                                             await strategyCodeField.getOptions()
                                          ).map(fieldToOption)
                                       );
                                       this.refresh();
                                       this.enable();
                                       this.hideProgress();
                                    } catch {
                                       // Close popup before response or possily response fail
                                    }
                                 },
                              },
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
                                 const [, objID, fieldID, isActive] =
                                    contentDisplayedFieldFilterKey.split(".");
                                 if (isActive == 1)
                                    switch (fieldID) {
                                       // TODO (Guy): Hardcode for the role type filter.
                                       case "96dc0d8d-7fb4-4bb1-8b80-a262aae41eed":
                                          const obj = this.AB.objectByID(objID);
                                          const model = obj.model();
                                          const fieldColumnName =
                                             obj.fieldByID(fieldID).columnName;
                                          contentDisplayedFieldFilterViews.push(
                                             {
                                                view: "combo",
                                                label: contentDisplayedFieldFilters[
                                                   contentDisplayedFieldFilterKey
                                                ],
                                                labelWidth: 100,
                                                options: [],
                                                name: contentDisplayedFieldFilterKey,
                                                clear: "replace",
                                                on: {
                                                   async onViewShow() {
                                                      webix.extend(
                                                         this,
                                                         webix.ProgressBar
                                                      );
                                                      this.showProgress({
                                                         type: "icon",
                                                      });
                                                      try {
                                                         this.define(
                                                            "options",
                                                            (
                                                               await model.findAll()
                                                            ).data.map((e) => ({
                                                               id: e[
                                                                  fieldColumnName
                                                               ],
                                                               value: e[
                                                                  fieldColumnName
                                                               ],
                                                            }))
                                                         );
                                                         this.refresh();
                                                         this.enable();
                                                         this.hideProgress();
                                                      } catch {
                                                         // Close popup before response or possily response fail
                                                      }
                                                   },
                                                },
                                             }
                                          );
                                          break;
                                       default:
                                          contentDisplayedFieldFilterViews.push(
                                             {
                                                view: "text",
                                                label: contentDisplayedFieldFilters[
                                                   contentDisplayedFieldFilterKey
                                                ],
                                                labelWidth: 100,
                                                name: contentDisplayedFieldFilterKey,
                                                clear: true,
                                             }
                                          );
                                          break;
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
                  ],
               },
               on: {
                  onShow() {
                     $$(ids.filterForm).show();
                  },
                  onHide() {
                     $$(ids.filterForm).hide();
                  },
               },
            });
         }
         $popup.show($$(ids.filterButton).$view);
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

      // Hide a trash can when there is at least one assignment.
      const $trashCan = $teamNode.querySelectorAll(".team-button").item(2);
      $trashCan && ($trashCan.style.display = "none");
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

   _convertToFormValueByType(contentRecord) {
      const contentAllFields = this._contentDC.datasource.fields();
      for (const field of contentAllFields) {
         const columnName = field.columnName;
         const value = contentRecord[columnName];
         switch (field.key) {
            case "boolean":
               if (value === true) contentRecord[columnName] = 1;
               else if (value === false) contentRecord[columnName] = 0;
               else {
                  const parsedValue = parseInt(value);
                  contentRecord[columnName] = isNaN(parsedValue)
                     ? 0
                     : parsedValue;
               }
               break;
            case "date":
            case "datetime":
               contentRecord[columnName] = new Date(value);
               break;
            default:
               break;
         }
      }
      return contentRecord;
   }

   async _createUIContentRecord(data, color) {
      const $ui = element("div", "team-group-record");
      $ui.setAttribute("id", this.contentNodeID(data.id));
      $ui.setAttribute("data-source", JSON.stringify(data));
      $ui.style.borderColor = color;
      $ui.addEventListener("dblclick", this._fnShowContentForm);
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
      const $editIcon = element("div", "team-group-record-edit-icon");
      $editIcon.appendChild(element("i", "fa fa-pencil"));
      $editIcon.addEventListener("click", this._fnShowContentForm);
      $ui.appendChild($editIcon);
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

   _checkDataIsChanged(olaValues, newValues) {
      // TODO (Guy): Check array in the future.
      for (const key in newValues)
         if (JSON.stringify(newValues[key]) !== JSON.stringify(olaValues[key]))
            return true;
      return false;
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

   _parseFormValueByType(obj, oldFormData, newFormData) {
      const allFields = obj.fields();
      for (const field of allFields) {
         const fieldKey = field.key;
         const columnName = field.columnName;
         const oldValue = oldFormData?.[columnName];
         const newValue = newFormData[columnName];
         switch (fieldKey) {
            case "date":
            case "datetime":
               if (oldValue === undefined && newValue == null)
                  delete newFormData[columnName];
               try {
                  newValue instanceof Date &&
                     (newFormData[columnName] = newValue.toISOString());
               } catch {
                  delete newFormData[columnName];
               }
               break;
            case "connectObject":
               delete newFormData[`${columnName}__relation`];
               if (field.linkType() === "one")
                  switch (typeof oldValue) {
                     case "number":
                        newFormData[columnName] = parseInt(newValue) || null;
                        break;
                     default:
                        newFormData[columnName] = newValue?.toString() || null;
                        if (
                           oldValue === undefined &&
                           newFormData[columnName] == null
                        )
                           delete newFormData[columnName];
                        break;
                  }
               // TODO (Guy): Many logic in the future. Now we don't have an array data changed.
               else delete newFormData[columnName];
               break;
            default:
               if (newValue == null || newValue === "")
                  if (oldValue === undefined) {
                     delete newFormData[columnName];
                     break;
                  } else if (oldValue === "") {
                     newFormData[columnName] = "";
                     break;
                  }
               switch (fieldKey) {
                  case "boolean":
                     switch (typeof oldValue) {
                        case "number":
                           newFormData[columnName] = newValue;
                           break;
                        case "string":
                           newFormData[columnName] = newValue === 1 ? "1" : "0";
                           break;
                        default:
                           newFormData[columnName] = newValue == 1;
                           break;
                     }
                     break;
                  case "number":
                     const paredNewValue = parseInt(newValue);
                     if (isNaN(parseInt(newValue))) {
                        if (oldValue === undefined)
                           delete newFormData[columnName];
                        else newFormData[columnName] = oldValue;
                        break;
                     }
                     switch (typeof oldValue) {
                        case "string":
                           newFormData[columnName] = paredNewValue.toString();
                           break;
                        default:
                           newFormData[columnName] = paredNewValue;
                           break;
                     }
                     break;
                  case "string":
                     newFormData[columnName] = newValue?.toString() || "";
                     break;
                  default:
                     break;
               }
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
      let $panel = $$(this.ids.dataPanelPopup);
      if (!$panel) {
         $panel = this.AB.Webix.ui({
            id: this.ids.dataPanelPopup,
            view: "popup",
            width: 250,
            body: this._uiDataPanel(),
            css: "data-panel-popup",
            modal: true,
         });
      }
      const $dpButtonWebix = $$(this.ids.dataPanelButton).$view;
      const $dpButtonElem = $dpButtonWebix.querySelector(".data-panel-button");
      // Ensure the popup will stay to the right when resizing
      if (!this._resizeObserver) {
         this._resizeObserver = new ResizeObserver(([e]) => {
            // Hide the panel when the widget is hidden (ex. switched to another App)
            if (e.contentRect.width == 0 && e.contentRect.height == 0) {
               return $panel.hide();
            }
            $panel.show($dpButtonElem, { x: -30, y: -35 });
         });
      }
      this._resizeObserver.observe($dpButtonWebix);
      $panel.show($dpButtonElem, { x: -30, y: -35 });
      $$(this.ids.dataPanel)
         .getChildViews()[1]
         .getChildViews()
         .forEach(($childView) => $childView.callEvent("onViewShow"));
   }

   _showOrgChart() {
      const settings = this.settings;
      const AB = this.AB;
      const draggable = settings.draggable === 1;
      const ids = this.ids;
      const chartData = this._chartData;
      if (chartData == null) {
         this.__orgchart = null;
         return;
      }
      const orgchart = new this._OrgChart({
         data: AB.cloneDeep(chartData),
         direction: settings.direction,
         // depth: settings.depth,
         // chartContainer: `#${ids.chartDom}`,
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
      $$(ids.chartContent).$view.appendChild((this.__orgchart = orgchart));
   }

   _uiDataPanel() {
      const self = this;
      const _dataPanelDCs = self._dataPanelDCs;
      const dataPanelDCs = self.settings.dataPanelDCs;
      const contentObjID = this._contentDC?.datasource?.id;
      const cells = [];
      for (const key in dataPanelDCs) {
         const [tabIndex, dataPanelDCID] = key.split(".");

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
                  css: { overflow: "auto", "max-height": "90%" },
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
                     `<div class="data-panel-employee">${panelObj.displayData(
                        data
                     )}</div>`,
                  borderless: true,
                  css: "data-panel-employee-list",
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
                           // TODO (Guy): Hardcode Employee DC.
                           (parseInt(tabIndex) < 2
                              ? _dataPanelDC.getData(
                                   (panelRecord) =>
                                      panelRecord.isinactive !== "T" &&
                                      (tabIndex === "0"
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
                                           )[0] != null)
                                )
                              : _dataPanelDCs
                                   .find(
                                      (dataPanelDC) =>
                                         dataPanelDC.id === dataPanelDCID
                                   )
                                   .getData()
                           ).sort((a, b) => {
                              if (
                                 a.lastName.toLowerCase() <
                                 b.lastName.toLowerCase()
                              ) {
                                 return -1;
                              }
                              if (
                                 a.lastName.toLowerCase() >
                                 b.lastName.toLowerCase()
                              ) {
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
         height: 600,
         type: "clean",
         rows: [
            {
               view: "template",
               borderless: true,
               template: `<div style="color:#2F27CE;font-family:'Roboto';font-size:17px;font-weight:900">
                     ${this.label("Staff Assignment")}
                     <span class="fa fa-compress data-panel-close"></span>
                  </div>`,
               height: 35,
               onClick: {
                  "data-panel-close": () => {
                     $$(this.ids.dataPanelPopup).hide();
                     this._resizeObserver?.unobserve(
                        $$(this.ids.dataPanelButton).$view
                     );
                     return false;
                  },
               },
            },
            {
               id: this.ids.dataPanel,
               view: "tabview",
               css: "data-panel-tabview",
               width: 250,
               borderless: true,
               tabbar: {
                  height: 25,
                  // width: 300,
                  align: "left",
                  // type: "bottom",
                  css: "data-panel-tabbar",
               },
               cells,
            },
         ],
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
            // view: "template",
            responsive: true,
            type: "clean",
            rows: [
               {
                  responsive: true,
                  id: ids.chartHeader,
                  view: "toolbar",
                  height: 50,
                  type: "clean",
                  cols: [
                     {
                        view: "template",
                        id: this.ids.filterButton,
                        template: `<button class="filter-button">
                              <i class="fa fa-filter"></i> ${self.label(
                                 "Filter"
                              )}</button>`,
                        align: "left",
                        onClick: {
                           "filter-button": (ev) => self._fnShowFilterPopup(ev),
                        },
                     },
                     {
                        view: "template",
                        id: this.ids.dataPanelButton,
                        template: `<div class="data-panel-button">
                              <span class="fa fa-2x fa-users"></span>
                              <div class="data-panel-open">
                                 ${self.label("Staff Assignment")}
                                 <span class="fa fa-expand" style="float:right;"></span>
                              </div>
                           </div>`,
                        align: "right",
                        onClick: {
                           "data-panel-open": (ev) => self._showDataPanel(ev),
                        },
                     },
                  ],
               },
               {
                  responsive: true,
                  id: ids.chartContent,
                  view: "template",
                  scroll: "auto",

                  on: {
                     onAfterRender() {
                        Webix.extend(this, Webix.ProgressBar);
                     },
                  },
               },
            ],
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
               this.__orgchart != null &&
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

   getChartData(id, chartData = this._chartData) {
      if (this.teamNodeID(id) === chartData.id) return chartData;
      if (chartData.children?.length > 0) {
         for (let child of chartData.children) {
            child = this.getChartData(id, child);
            if (child != null) return child;
         }
      }
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
      this._chartData = null;
      const dc = this.datacollection;
      if (dc == null) return;
      const settings = this.settings;
      await this._waitDCReady(dc);
      let topNode = dc.getCursor();
      const topNodeColumn = this.getSettingField("topTeam").columnName;
      if (settings.topTeam) {
         const topFromField = dc.getData((e) => e[topNodeColumn] == 1)[0];
         topNode = topFromField ? topFromField : topNode;
      }
      if (!topNode) return;

      /**
       * Recursive function to prepare child node data
       * @param {object} node the current node
       * @param {number} [depth=0] a count of how many times we have recursed
       */
      const pullChildData = (node, depth = 0) => {
         if (depth >= TEAM_CHART_MAX_DEPTH) return;
         node.children = [];
         node._rawData[this.getSettingField("teamLink").columnName].forEach(
            (id) => {
               const childData = dc.getData((e) => e.id == id)[0];
               // Don't show inactive teams
               if (
                  !childData ||
                  (this.__filters?.inactive == 0 &&
                     childData[this.getSettingField("teamInactive").columnName])
               )
                  return;
               const child = {
                  name: childData[this.getSettingField("teamName").columnName],
                  id: this.teamNodeID(id),
                  className: `strategy-${
                     childData[
                        `${
                           this.getSettingField("teamStrategy").columnName
                        }__relation`
                     ]?.[this.getSettingField("strategyCode").columnName]
                  }`,
                  isInactive:
                     childData[this.getSettingField("teamInactive").columnName],
                  _rawData: childData,
               };
               child.filteredOut = this.filterTeam(child);
               if (child.name === "External Support")
                  child.className = `strategy-external`;
               if (
                  childData[this.getSettingField("teamLink").columnName]
                     .length > 0
               ) {
                  pullChildData(child, depth + 1);
               }
               // If this node is filtered we still need it if it has children
               // that pass
               if (!child.filteredOut || child.children?.length > 0) {
                  node.children.push(child);
               }
            }
         );
         if (node.children.length === 0) {
            delete node.children;
         } else {
            // sort children alphaetically
            node.children = node.children.sort((a, b) =>
               a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
            );
         }
      };
      const chartData = (this._chartData = {
         id: this.teamNodeID(topNode.id),
         name: topNode[this.getSettingField("teamName").columnName] ?? "",
         className: `strategy-${
            topNode[
               `${this.getSettingField("teamStrategy").columnName}__relation`
            ]?.[this.getSettingField("strategyCode").columnName]
         }`,
         isInactive: topNode[this.getSettingField("teamInactive").columnName],
         _rawData: topNode,
         filteredOut: false,
      });
      chartData.filteredOut = this.filterTeam(chartData);
      pullChildData(chartData);
   }

   async refresh() {
      const ids = this.ids;
      $$(ids.teamFormPopup)?.destructor();
      $$(ids.contentForm)?.destructor();
      await this.pullData();
      // this._showDataPanel();
      this._showOrgChart();
      this._pageData();
   }

   async filterApply() {
      this.busy();
      await this._promisePageData;
      const ids = this.ids;
      $$(ids.filterPopup).hide();
      this.__filters = $$(ids.filterForm).getValues();
      this.__orgchart?.remove();
      this.__orgchart = null;
      await this.pullData();
      this._showOrgChart();
      await this._callAfterRender(() => {
         const contentDC = this._contentDC;
         this._fnPageContentCallback(
            contentDC.getData(),
            true,
            contentDC,
            () => {}
         );
      });
      this.ready();
   }

   filterTeam(team) {
      const filters = this.__filters;
      let filter = false;
      filters.strategy = filters.strategy ?? "";
      filters.teamName = filters.teamName ?? "";

      // Apply filters (match using or)
      if (filters.strategy || filters.teamName) {
         filter = true;
         if (
            filters.strategy !== "" &&
            filters.strategy == team.className.replace("strategy-", "")
         )
            filter = false;
         if (
            filters.teamName !== "" &&
            team.name.toLowerCase().includes(filters.teamName.toLowerCase())
         )
            filter = false;
         if (!filter) return filter;
      }
      const AB = this.AB;
      const settings = this.settings;
      const contentDisplayFieldFilters = settings.contentDisplayedFieldFilters;
      for (const key in contentDisplayFieldFilters) {
         filters[key] = filters[key] ?? "";
         if (filters[key] !== "") filter = true;
      }
      if (!filter) return filter;
      const contentField = settings.contentField;
      const teamObj = this.datacollection.datasource;
      const contentFieldLinkColumnName = teamObj.connectFields(
         (connectField) => connectField.id === contentField
      )[0].fieldLink.columnName;
      const contentDC = this._contentDC;
      const contentObj = contentDC.datasource;
      const contentObjID = contentObj.id;
      const contentObjPK = contentObj.PK();
      const teamRecordPK = team._rawData[teamObj.PK()];
      const contentDisplayedFields = settings.contentDisplayedFields;
      const contentDisplayedFieldKeys = Object.keys(contentDisplayedFields);
      const contentDisplayDCs = this._contentDisplayDCs;
      let currentContentDisplayFieldKey = null;
      let currentContentDisplayDC = null;
      let currentContentDisplayObjID = null;
      let currentContentDisplayObjPK = null;
      let currentContentDisplayFieldColumnName = null;
      let currentContentDisplayFilterValue = null;
      let currentContentDisplayRecords = [];
      while (contentDisplayedFieldKeys.length > 0) {
         currentContentDisplayFieldKey = contentDisplayedFieldKeys.pop();
         currentContentDisplayObjID =
            currentContentDisplayFieldKey.split(".")[1];
         currentContentDisplayFilterValue =
            filters[
               `${currentContentDisplayFieldKey}.${contentDisplayedFields[currentContentDisplayFieldKey]}.0`
            ];
         if (currentContentDisplayFilterValue == null)
            currentContentDisplayFilterValue =
               filters[
                  `${currentContentDisplayFieldKey}.${contentDisplayedFields[currentContentDisplayFieldKey]}.1`
               ];
         if (currentContentDisplayFilterValue != null) {
            if (currentContentDisplayFilterValue === "") continue;
            currentContentDisplayFilterValue = currentContentDisplayFilterValue
               .toString()
               .toLowerCase();
            currentContentDisplayFieldColumnName = AB.definitionByID(
               contentDisplayedFields[currentContentDisplayFieldKey]
            ).columnName;
            currentContentDisplayDC = contentDisplayDCs.find(
               (contentDisplayDC) =>
                  contentDisplayDC.datasource.id === currentContentDisplayObjID
            );
            currentContentDisplayObjPK =
               currentContentDisplayDC.datasource.PK();
            currentContentDisplayRecords = currentContentDisplayDC
               .getData(
                  (contentDisplayRecord) =>
                     contentDisplayRecord[currentContentDisplayFieldColumnName]
                        ?.toString()
                        .toLowerCase()
                        .indexOf(currentContentDisplayFilterValue) > -1
               )
               .map((contentDisplayRecord) =>
                  contentDisplayRecord[currentContentDisplayObjPK]?.toString()
               );
         } else if (currentContentDisplayRecords.length > 0) {
            currentContentDisplayFieldColumnName = AB.definitionByID(
               contentDisplayedFields[currentContentDisplayFieldKey]
            ).columnName;
            currentContentDisplayDC = contentDisplayDCs.find(
               (contentDisplayDC) =>
                  contentDisplayDC.datasource.id === currentContentDisplayObjID
            );
            currentContentDisplayObjPK =
               currentContentDisplayDC.datasource.PK();
            currentContentDisplayRecords = currentContentDisplayDC
               .getData((contentDisplayRecord) => {
                  const contentDisplayRecordData =
                     contentDisplayRecord[currentContentDisplayFieldColumnName];
                  return Array.isArray(contentDisplayRecordData)
                     ? contentDisplayRecordData.findIndex(
                          (e) =>
                             currentContentDisplayRecords.indexOf(
                                e.toString()
                             ) > -1
                       ) > -1
                     : currentContentDisplayRecords.indexOf(
                          contentDisplayRecordData?.toString()
                       ) > -1;
               })
               .map((contentDisplayRecord) =>
                  contentDisplayRecord[currentContentDisplayObjPK].toString()
               );
         }
         if (
            currentContentDisplayObjID === contentObjID &&
            currentContentDisplayRecords.length > 0 &&
            contentDC
               .getData(
                  (contentRecord) =>
                     contentRecord[contentFieldLinkColumnName] == teamRecordPK
               )
               .findIndex(
                  (contentRecord) =>
                     currentContentDisplayRecords.indexOf(
                        contentRecord[contentObjPK].toString()
                     ) > -1
               ) > -1
         ) {
            filter = false;
            break;
         }
      }
      return filter;
   }

   /**
    * Get the ABField from settings
    * @param {string} setting key in this.view.settings - should be an id for an
    * ABField
    */
   getSettingField(setting) {
      return this.AB.definitionByID(this.settings[setting]);
   }

   async teamAddChild(values, isServerSideUpdate = true, children = []) {
      const entityDC = this._entityDC;
      const teamDC = this.datacollection;
      const teamObj = teamDC.datasource;
      const teamObjID = teamDC.datasource.id;

      // Add the entity value
      if (entityDC) {
         const connection =
            isServerSideUpdate &&
            entityDC.datasource.connectFields(
               (f) => f.settings.linkObject === teamObjID
            )[0];
         if (connection) {
            const entity = entityDC.getCursor();
            const cName = this.AB.definitionByID(
               connection.settings.linkColumn
            ).columnName;
            values[cName] = entity;
         }
      }
      let _rawData = values;
      if (isServerSideUpdate) {
         this.busy();
         try {
            _rawData = await teamDC.model.create(values);
         } catch (err) {
            // TODO (Guy): The update error.
            console.error(err);
         }
         this.ready();
      }
      if (
         this.__filters?.inactive == 0 &&
         (_rawData == null ||
            _rawData[this.getSettingField("teamInactive").columnName])
      )
         return;
      const parent = document.querySelector(
         `#${this.teamNodeID(
            _rawData[
               this.AB.definitionByID(
                  this.getSettingField("teamLink").settings.linkColumn
               ).columnName
            ]
         )}`
      );
      if (parent == null) return;
      const hasChild = parent.parentNode.colSpan > 1;
      const teamID = _rawData.id;
      const newChild = {
         name: _rawData[this.getSettingField("teamName").columnName],
         filteredOut: false,
         isInactive: _rawData[this.getSettingField("teamInactive").columnName],
         id: this.teamNodeID(teamID),
         relationship: hasChild ? "110" : "100",
         className: `strategy-${
            _rawData[
               `${this.getSettingField("teamStrategy").columnName}__relation`
            ]?.[this.getSettingField("strategyCode").columnName]
         }`,
         _rawData,
      };
      newChild.filteredOut = this.filterTeam(newChild);

      // Need to add differently if the node already has child nodes
      if (hasChild)
         this.__orgchart.addSiblings(
            // Sibling
            this.closest(parent, (el) => el.nodeName === "TABLE")
               .querySelector(".nodes")
               .querySelector(".node"),
            { siblings: [newChild] }
         );
      else this.__orgchart.addChildren(parent, { children: [newChild] });

      // TODO(Guy): Render assignment for specific node later.
      // const contentDC = this._contentDC;
      // const contentFieldLinkColumnName = teamObj.fieldByID(
      //    this.settings.contentField
      // ).fieldLink.columnName;
      // await this._callAfterRender(async () => {
      //    this._fnPageContentCallback(
      //       contentDC.getData((e) => e[contentFieldLinkColumnName] == teamID),
      //       true,
      //       contentDC,
      //       () => {}
      //    );
      //    await Promise.all(
      //       children.map((child) =>
      //          this.teamAddChild(child._rawData, false, child.children)
      //       )
      //    );
      // });
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
      if (
         document
            .getElementById(this.teamNodeID(values.id))
            .querySelectorAll(".team-group-record").length > 0
      )
         return false;
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

   teamDelete(values, isServerSideUpdate = true) {
      if (!this.teamCanDelete(values)) {
         this.AB.Webix.message({
            text: "This team cannot be deleted",
            type: "error",
            expire: 1001,
         });
         return;
      }
      const nodeID = this.teamNodeID(values.id);
      const $teamNode = document.querySelector(`#${nodeID}`);
      if ($teamNode.querySelectorAll(".team-group-record").length > 0)
         this.AB.Webix.alert({
            text: this.label(
               "Since there are assignments or teams associated with this team, this action cannot be done until all of its assignments are made inactive"
            ),
         });
      else
         this.AB.Webix.confirm({
            text: this.label(
               "This will permanently remove this team. Click OK to continue or Cancel to not remove the team."
            ),
         }).then(() => {
            isServerSideUpdate && this.datacollection.model.delete(values.id);
            this.__orgchart.removeNodes(document.querySelector(`#${nodeID}`));
         });
   }

   async teamEdit(values, isServerSideUpdate = true) {
      let _rawData = values;
      if (isServerSideUpdate) {
         this.busy();
         try {
            _rawData = await this.datacollection.model.update(
               values.id,
               values
            );
         } catch (err) {
            // TODO (Guy): the update error
            console.error(err);
         }
         this.ready();
      }
      const $node = document.querySelector(`#${this.teamNodeID(_rawData.id)}`);

      // Remove inactive node from display, unless the filter setting to show
      // inctive nodes is on.
      if (
         this.__filters?.inactive == 0 &&
         _rawData[this.getSettingField("teamInactive").columnName]
      ) {
         this.__orgchart.removeNodes($node);
         return;
      }
      const oldChartData = JSON.parse($node.dataset.source);
      const linkFieldColumnName = this.datacollection.datasource.fieldByID(
         this.getSettingField("teamLink").settings.linkColumn
      ).columnName;
      if (
         oldChartData._rawData[linkFieldColumnName] !=
         _rawData[linkFieldColumnName]
      ) {
         // TODO (Guy): Fix refresh the only updated node and those children and assignments later.
         await this.refresh();
         // this.__orgchart.removeNodes($node);
         // this.teamAddChild(
         //    _rawData,
         //    false,
         //    this.getChartData(_rawData.id)?.children
         // );
         return;
      }
      const currentStrategy = $node.classList?.value?.match(/strategy-\S+/)[0];
      const strategyCode =
         _rawData[
            `${this.getSettingField("teamStrategy").columnName}__relation`
         ]?.[this.getSettingField("strategyCode").columnName];
      const newStrategy =
         (strategyCode && `strategy-${strategyCode}`) || currentStrategy;
      if (currentStrategy !== newStrategy) {
         $node.classList?.remove(currentStrategy);
         $node.classList?.add(newStrategy);
      }
      const teamName = _rawData[this.getSettingField("teamName").columnName];
      $node.querySelector(".title").innerHTML = teamName;
      const newChartData = {
         className: newStrategy,
         filteredOut: false,
         id: this.teamNodeID(_rawData.id),
         isInactive: _rawData[this.getSettingField("teamInactive").columnName],
         name: teamName,
         relationship: oldChartData.relationship,
         _rawData,
      };
      newChartData.filteredOut = this.filterTeam(newChartData);
      $node.dataset.source = JSON.stringify(newChartData);
   }

   async teamForm(mode, values) {
      const teamObj = this.datacollection.datasource;
      const linkField = teamObj.fieldByID(
         this.getSettingField("teamLink").settings.linkColumn
      );
      const ids = this.ids;
      let $teamFormPopup = $$(ids.teamFormPopup);
      if (!$teamFormPopup) {
         const settings = this.settings;
         const nameField = teamObj.fieldByID(settings.teamName);
         const entityDC = this._entityDC;
         const entityObjID = entityDC.datasource.id;
         const entityDCCursorID = entityDC.getCursor().id;
         const strategyField = teamObj.fieldByID(settings.teamStrategy);
         const strategyObj = this.AB.objectByID(
            strategyField.settings.linkObject
         );
         const teamCond = {
            glue: "and",
            rules: [
               {
                  key: teamObj.connectFields(
                     (f) => f.settings.linkObject === entityObjID
                  )[0].columnName,
                  value: entityDCCursorID,
                  rule: "equals",
               },
            ],
         };
         const strategyCond = {
            glue: "and",
            rules: [
               {
                  key: strategyObj.connectFields(
                     (f) => f.settings.linkObject === entityObjID
                  )[0].columnName,
                  value: entityDCCursorID,
                  rule: "equals",
               },
            ],
         };
         const subStrategyCol = this.getSettingField("subStrategy").columnName;
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
                     hidden: true,
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
                           options: [],
                           required: true,
                           on: {
                              async onViewShow() {
                                 webix.extend(this, webix.ProgressBar);
                                 this.showProgress({ type: "icon" });
                                 try {
                                    this.disable();
                                    this.define(
                                       "options",
                                       (
                                          await strategyField.getOptions(
                                             strategyCond,
                                             null,
                                             null,
                                             null,
                                             [subStrategyCol]
                                          )
                                       ).map((e) => ({
                                          id: e.id,
                                          value: e[
                                             `${subStrategyCol}__relation`
                                          ].name,
                                          // value: strategyObj.displayData(e),
                                       }))
                                    );
                                    this.refresh();
                                    this.enable();
                                    this.hideProgress();
                                 } catch {
                                    // Close popup before response or possily response fail
                                 }
                              },
                           },
                        },
                        {
                           view: "combo",
                           label: linkField.label,
                           name: linkField.columnName,
                           options: [],
                           required: true,
                           on: {
                              async onViewShow() {
                                 webix.extend(this, webix.ProgressBar);
                                 this.showProgress({ type: "icon" });
                                 try {
                                    this.disable();
                                    this.define(
                                       "options",
                                       (
                                          await linkField.getOptions(teamCond)
                                       ).map((e) => ({
                                          id: e.id,
                                          value: teamObj.displayData(e),
                                       }))
                                    );
                                    this.refresh();
                                    this.enable();
                                    this.hideProgress();
                                 } catch {
                                    // Close popup before response or possily response fail
                                 }
                              },
                           },
                        },
                        {
                           view: "switch",
                           id: ids.teamFormInactive,
                           name: this.getSettingField("teamInactive")
                              .columnName,
                           label: "Inactive",
                        },
                        { view: "text", name: "id", hidden: true },
                        {
                           id: ids.teamFormSubmit,
                           view: "button",
                           value: this.label("Save"),
                           disabled: true,
                           css: "webix_primary",
                           click: async () => {
                              let newValues = $$(ids.teamForm).getValues();
                              if (newValues.id) {
                                 const $node = document.getElementById(
                                    this.teamNodeID(newValues.id)
                                 );
                                 const oldValues = JSON.parse(
                                    $node.dataset.source
                                 )._rawData;
                                 newValues = this._parseFormValueByType(
                                    teamObj,
                                    oldValues,
                                    newValues
                                 );
                                 if (
                                    !this._checkDataIsChanged(
                                       oldValues,
                                       newValues
                                    )
                                 )
                                    return;
                                 this.teamEdit(newValues);
                              } else {
                                 newValues = this._parseFormValueByType(
                                    teamObj,
                                    null,
                                    newValues
                                 );
                                 this.teamAddChild(newValues);
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
                              !!values[nameField.columnName] &&
                              !!values[linkField.columnName];
                           const $teamFormSubmit = $$(ids.teamFormSubmit);
                           if (valid) $teamFormSubmit.enable();
                           else $teamFormSubmit.disable();
                        },
                     },
                  },
               ],
            },
            on: {
               onShow() {
                  $$(ids.teamForm).show();
               },
               onHide() {
                  $$(ids.teamForm).hide();
               },
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
         (fn(el) && el !== document.querySelector(`#${this.ids.chartContent}`)
            ? el
            : this.closest(el.parentNode, fn))
      );
   }

   busy() {
      const $chartView = $$(this.ids.chartContent);
      $chartView.disable();
      $chartView.showProgress({ type: "icon" });
   }

   ready() {
      const $chartView = $$(this.ids.chartContent);
      $chartView.enable();
      $chartView.hideProgress();
   }
};

/**
 * Creates a new HTML element with the given type and classes
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
