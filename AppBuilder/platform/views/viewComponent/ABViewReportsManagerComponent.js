const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewReportsManagerComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewReportManager_${baseView.id}`,
         Object.assign(
            {
               reportManager: "",
               reports: "",
            },
            ids
         )
      );

      this.readonly = false;
   }

   ui() {
      const self = this;
      const baseView = this.view;
      const settings = this.settings;
      const ab = this.AB;
      const abWebix = ab.Webix;
      const dc = this.datacollection;
      const fieldName = dc?.datasource.fieldByID(
         settings.dataviewFields.name
      )?.columnName;
      const fieldText = dc?.datasource.fieldByID(
         settings.dataviewFields.text
      )?.columnName;
      const fieldQueries = dc?.datasource.fieldByID(
         settings.dataviewFields.queries
      )?.columnName;
      const ids = this.ids;
      class MyBackend extends reports.services.Backend {
         async getModules() {
            if (dc == null) return [];

            await self.waitInitializingDCEvery(1000, dc);

            return dc.getData().map((e) => {
               return {
                  id: e.id,
                  name: e[fieldName],
                  text: JSON.stringify(e[fieldText]),
                  updated: e["updated_at"],
               };
            });
         }

         async addModule(data) {
            const parsedData = {};

            parsedData[fieldName] = data.name;
            parsedData[fieldText] = data.text;

            const response = await dc.model.create(parsedData);

            return {
               id: response.id,
            };
         }

         async updateModule(id, data) {
            const parsedData = {};

            parsedData[fieldName] = data.name;
            parsedData[fieldText] = data.text;

            let response = {};

            response = await dc.model.update(id, parsedData);

            return { id: response.id };
         }

         async deleteModule(id) {
            await dc.model.delete(id);

            return { id: id };
         }

         async getModels() {
            const reportModels = {};

            if (baseView.settings.datacollectionIDs.length === 0)
               return reportModels;

            baseView.settings.datacollectionIDs.forEach((dcID) => {
               const dc = ab.datacollectionByID(dcID);

               if (!dc) return;

               const obj = dc.datasource;

               if (!obj) return;

               const reportFields = self.getReportFields(dc);

               // get connected data collections
               // let linkedFields = [];
               // (obj.connectFields() || []).forEach((f, index) => {
               //    let connectedDcs = ab.datacollections(
               //       (dColl) =>
               //          dColl &&
               //          dColl.datasource &&
               //          dColl.datasource.id === f.settings.linkObject
               //    );
               //    (connectedDcs || []).forEach((linkedDc) => {
               //       linkedFields.push({
               //          id: index + 1,
               //          name: linkedDc.label,
               //          source: dc.id,
               //          target: linkedDc.id
               //       });
               //    });
               // });

               // // MOCK UP for testing
               // let linkedFields = [
               //    {
               //       id: "id",
               //       name: "id",
               //       source: "39378ee0-38f0-4b9d-a5aa-dddc61137fcd", // Player
               //       target: "0de82362-4ab5-4f0f-8cfa-d1288d173cba" // Team
               //    }
               // ];

               reportModels[dc.id] = {
                  id: dc.id,
                  name: dc.label,
                  data: reportFields,
                  refs: [],
               };
            });

            return reportModels;
         }

         async getQueries() {
            const moduleID = $$(ids.reportManager).getState().moduleId || "";

            if (moduleID === "") return [];

            return (
               (
                  await dc.model.findAll({
                     where: {
                        uuid: moduleID,
                     },
                  })
               ).data[0][fieldQueries] || []
            );
         }

         async addQuery(data) {
            const moduleID = $$(ids.reportManager).getState().moduleId || "";

            if (moduleID === "") return {};

            const moduleData = (
               await dc.model.findAll({
                  where: {
                     uuid: moduleID,
                  },
               })
            ).data[0];

            if (moduleData == null) return {};

            const queries = [...(moduleData[fieldQueries] || [])];
            const queryID = abWebix.uid();

            queries.push(Object.assign({ id: queryID }, data));

            const parsedData = {};

            parsedData[fieldQueries] = queries.sort((a, b) => {
               if (a.name < b.name) return -1;

               if (a.name > b.name) return 1;

               return 0;
            });

            await dc.model.update(moduleID, parsedData);

            return { id: queryID };
         }

         async updateQuery(id, data) {
            const moduleID = $$(ids.reportManager).getState().moduleId || "";

            if (moduleID === "") return {};

            const moduleData = (
               await dc.model.findAll({
                  where: {
                     uuid: moduleID,
                  },
               })
            ).data[0];

            if (moduleData == null) return {};

            const queries = [...(moduleData[fieldQueries] || [])];
            const queryIndex = queries.findIndex((e) => e.id === id);

            queries[queryIndex] = Object.assign({ id }, data);

            const parsedData = {};

            parsedData[fieldQueries] = queries.sort((a, b) => {
               if (a.name < b.name) return -1;

               if (a.name > b.name) return 1;

               return 0;
            });

            await dc.model.update(moduleID, parsedData);

            return { id };
         }

         async deleteQuery(id) {
            const moduleID = $$(ids.reportManager).getState().moduleId || "";

            if (moduleID === "") return {};

            const moduleData = (
               await dc.model.findAll({
                  where: {
                     uuid: moduleID,
                  },
               })
            ).data[0];

            if (moduleData == null) return {};

            const queries = moduleData[fieldQueries] || [];
            const queryIndex = queries.findIndex((e) => e.id === id);

            if (queryIndex >= 0) {
               const parsedData = {};

               parsedData[fieldQueries] = queries
                  .filter((e, i) => i !== queryIndex)
                  .sort((a, b) => {
                     if (a.name < b.name) return -1;

                     if (a.name > b.name) return 1;

                     return 0;
                  });

               await dc.model.update(moduleID, parsedData);
            }

            return { id: id };
         }

         async getData(config) {
            let result = [];
            let pullDataTasks = [];
            let dcIds = [];
            let dcData = {};
            let reportFields = [];

            // pull data of the base and join DCs
            dcIds.push(config.data);
            (config.joins || []).forEach((j) => {
               dcIds.push(j.sid);
               dcIds.push(j.tid);
            });
            dcIds = ab.uniq(dcIds);
            dcIds.forEach((dcId) => {
               pullDataTasks.push(
                  new Promise((resolve, reject) => {
                     const getData = async () => {
                        try {
                           dcData[dcId] = (await self.getData(dcId)) || [];

                           resolve();
                        } catch (err) {
                           reject(err);
                        }
                     };

                     getData();
                  })
               );
            });

            dcIds.forEach((dcId) => {
               const dataCol = ab.datacollectionByID(dcId);

               if (!dataCol) return;

               reportFields = reportFields.concat(
                  self.getReportFields(dataCol).map((f) => {
                     // change format of id to match the report widget
                     f.id = `${dcId}.${f.id}`; // dc_id.field_id
                     return f;
                  })
               );
            });

            await Promise.all(pullDataTasks);

            // the data result equals data of the base DC
            result = dcData[config.data] || [];

            if (config.joins?.length)
               (config.joins || []).forEach((j) => {
                  const sourceDc = ab.datacollectionByID(j.sid);
                  if (!sourceDc) return;

                  const sourceObj = sourceDc.datasource;
                  if (!sourceObj) return;

                  const targetDc = ab.datacollectionByID(j.tid);
                  if (!targetDc) return;

                  const targetObj = targetDc.datasource;
                  if (!targetObj) return;

                  const sourceLinkField = sourceObj.fieldByID(j.sf);
                  const targetLinkField = targetObj.fieldByID(j.tf);
                  if (!sourceLinkField && !targetLinkField) return;

                  const sourceData = dcData[j.sid] || [];
                  const targetData = dcData[j.tid] || [];

                  sourceData.forEach((sData) => {
                     targetData.forEach((tData) => {
                        let sVal =
                           sData[
                              sourceLinkField
                                 ? `${j.sid}.${sourceLinkField.columnName}.id`
                                 : `${j.sid}.id`
                           ] || [];

                        let tVal =
                           tData[
                              targetLinkField
                                 ? `${j.tid}.${targetLinkField.columnName}.id`
                                 : `${j.tid}.id`
                           ] || [];

                        if (!Array.isArray(sVal)) sVal = [sVal];

                        if (!Array.isArray(tVal)) tVal = [tVal];

                        // Add joined row to the result array
                        const matchedVal = sVal.filter(
                           (val) => tVal.indexOf(val) > -1
                        );

                        if (matchedVal?.length) {
                           const updateRows =
                              result.filter(
                                 (r) =>
                                    r[`${j.sid}.id`] === sData[`${j.sid}.id`] &&
                                    !r[`${j.tid}.id`]
                              ) || [];

                           if (updateRows?.length)
                              (updateRows || []).forEach((r) => {
                                 for (const key in tData)
                                    if (key !== "id") r[key] = tData[key];
                              });
                           else
                              result.push(
                                 Object.assign(
                                    ab.cloneDeep(sData),
                                    ab.cloneDeep(tData)
                                 )
                              );
                        }
                     });
                  });
               });

            // filter & sort
            const queryVal = JSON.parse(config.query || "{}");

            if (queryVal?.rules?.length)
               queryVal.rules.forEach((r) => {
                  if (!r || !r.type || !r.condition) return;

                  switch (r.type) {
                     case "date":
                     case "datetime":
                        // Convert string to Date object
                        if (r.condition.filter) {
                           if (typeof r.condition.filter === "string")
                              r.condition.filter = ab.rules.toDate(
                                 r.condition.filter
                              );

                           if (
                              r.condition.filter.start &&
                              typeof r.condition.filter.start === "string"
                           )
                              r.condition.filter.start = ab.rules.toDate(
                                 r.condition.filter.start
                              );

                           if (
                              r.condition.filter.end &&
                              typeof r.condition.filter.end === "string"
                           )
                              r.condition.filter.end = ab.rules.toDate(
                                 r.condition.filter.end
                              );
                        }

                        break;
                  }
               });

            // create a new query widget to get the filter function
            const filterElem = abWebix.ui({
               view: "query",
               fields: reportFields,
               value: queryVal,
            });

            // create a new data collection and apply the query filter
            const tempDc = new abWebix.DataCollection();

            tempDc.parse(result);

            // filter
            let filterFn;

            try {
               filterFn = filterElem.getFilterFunction();
            } catch (error) {
               // continue regardless of error
            }

            if (filterFn) tempDc.filter(filterFn);

            // sorting
            (config.sort || []).forEach((sort) => {
               if (sort.id)
                  tempDc.sort({
                     as: "string",
                     dir: sort.mod || "asc",
                     by: `#${sort.id}#`,
                  });
            });

            result = tempDc.serialize();

            // clear
            filterElem.destructor();
            tempDc.destructor();

            // group by
            if (config?.group?.length) {
               (config.group || []).forEach((groupProp) => {
                  result = _(result).groupBy(groupProp);
               });

               result = result
                  .map((groupedData, id) => {
                     const groupedResult = {};

                     (config.columns || []).forEach((col) => {
                        const agg = col.split(".")[0];
                        const rawCol = col.replace(
                           /sum.|avg.|count.|max.|min./g,
                           ""
                        );

                        switch (agg) {
                           case "sum":
                              groupedResult[col] = ab.sumBy(
                                 groupedData,
                                 rawCol
                              );
                              break;
                           case "avg":
                              groupedResult[col] = ab.meanBy(
                                 groupedData,
                                 rawCol
                              );
                              break;
                           case "count":
                              groupedResult[col] = (groupedData || []).length;
                              break;
                           case "max":
                              groupedResult[col] =
                                 (ab.maxBy(groupedData, rawCol) || {})[
                                    rawCol
                                 ] || "";
                              break;
                           case "min":
                              groupedResult[col] =
                                 (ab.minBy(groupedData, rawCol) || {})[
                                    rawCol
                                 ] || "";
                              break;
                           default:
                              groupedResult[col] = groupedData[0][col];
                              break;
                        }
                     });

                     return groupedResult;
                  })
                  .value();
            }

            return result;
         }

         async getOptions(fields) {
            return [];
         }
         async getFieldData(fieldId) {
            return [];
         }
      }
      class MyLocal extends reports.services.Local {
         constructor(app) {
            super(app);

            this._currentModuleID = "";
         }

         getQueries() {
            const currentModuleID = $$(ids.reportManager).getState().moduleId;

            if (this._currentModuleID !== currentModuleID) {
               this._currentModuleID = currentModuleID;
               this._queries = null;
            }

            return super.getQueries();
         }
      }
      class MyEditor extends reports.views.editor {
         init() {
            super.init();

            if (!self.readonly || settings.editMode === 1) return;

            const $tabbar = this.$$("tabbar");

            if (settings.hideCommonTab === 1) {
               const listener = () => {
                  $tabbar.callEvent("onChange", ["data"]);
                  $tabbar.disableOption("common");
                  self.removeListener("editMode.tabbar.query", listener);
               };

               self.on("editMode.tabbar.query", listener);
            }

            if (settings.hideDataTab === 1) $tabbar.disableOption("other");

            if (settings.hideViewTab === 1) $tabbar.disableOption("structure");

            this.on(this.app, "editMode.button.back", () => {
               this.Reset(true);
            });
         }

         Reset(forceReset = false) {
            const id = this.AppState.moduleId;
            const condition = self.readonly && !(settings.editMode === 1);

            if (!condition || id == null || forceReset) super.Reset();

            this.Local.getModule(id);
         }

         TrackChanges() {
            super.TrackChanges();

            if (settings.hideCommonTab) self.emit("editMode.tabbar.query");
         }
      }
      class MyToolBar extends reports.views.toolbar {
         config() {
            const ui = super.config();

            if (self.readonly && !(settings.editMode === 1)) {
               ui.elements[5].cols = ui.elements[5].cols.map((e) =>
                  Object.assign(e, {
                     hidden: self.readonly && !(settings.editMode === 1),
                  })
               );

               ui.elements[5].cols.push(
                  {},
                  {
                     view: "button",
                     type: "icon",
                     icon: "wxi-angle-double-left",
                     label: self.label("Back"),
                     localId: "forceReset",
                     click: () => {
                        return this.app.callEvent("editMode.button.back", []);
                     },
                  }
               );
            }

            return ui;
         }
      }
      class MyEditorCommon extends reports.views["editor/common"] {
         config() {
            const ui = super.config();

            if (!self.readonly) return ui;

            return Object.assign({}, ui, {
               elements: ui.elements.map((e, i) =>
                  Object.assign(
                     {
                        hidden: !(i >= 2 && i < 5),
                     },
                     e
                  )
               ),
            });
         }

         ShowDeleteButton() {
            super.ShowDeleteButton();

            if (self.readonly) this.$$("delete").hide();
         }
      }
      class MyEditorData extends reports.views["editor/data"] {
         config() {
            const ui = super.config();

            if (self.readonly) {
               ui.rows[0].rows[0].hidden = true;

               ui.rows[0].rows.unshift({
                  label: "Filtering query",
                  view: "label",
                  width: 120,
               });
            }

            return ui;
         }
      }
      class MyTable extends reports.views.table {
         // NOTE: fix format of date column type
         GetColumnConfig(a) {
            let config = {
               id: a.id,
               header:
                  !a.meta.header || a.meta.header === "none"
                     ? a.meta.name || a.name
                     : [
                          a.meta.name || a.name,
                          {
                             content:
                                a.header === "text"
                                   ? "textFilter"
                                   : "richSelectFilter",
                          },
                       ],
               type: a.type,
               sort: "date",
               width: a.width || 200,
            };

            switch (a.type) {
               case "date":
                  config.format = (val) => {
                     // check valid date
                     if (val?.getTime && !isNaN(val.getTime()))
                        return abWebix.i18n.dateFormatStr(val);
                     else return "";
                  };

                  break;

               case "datetime":
                  config.format = (val) => {
                     // check valid date
                     if (val?.getTime && !isNaN(val.getTime()))
                        return abWebix.i18n.fullDateFormatStr(val);
                     else return "";
                  };

                  break;

               default:
                  config = super.GetColumnConfig(a);

                  break;
            }

            return config;
         }
      }

      const _ui = super.ui([
         {
            id: ids.reportManager,
            view: "reports",
            toolbar: true,
            override: new Map([
               [reports.services.Backend, MyBackend],
               [reports.services.Local, MyLocal],
               [reports.views.editor, MyEditor],
               [reports.views.toolbar, MyToolBar],
               [reports.views["editor/common"], MyEditorCommon],
               [reports.views["editor/data"], MyEditorData],
               [reports.views.table, MyTable],
            ]),
         },
      ]);

      delete _ui.type;
      delete _ui.height;

      return _ui;
   }

   async init(AB, accessLevel) {
      this.AB = AB;
      this.readonly = accessLevel < 2;

      const $reportManager = $$(this.ids.reportManager);
      const state = $reportManager.getState();

      state.readonly = this.readonly;
      state.mode =
         this.readonly && this.settings.editMode === 1 ? "edit" : "list";
   }

   getReportFields(dc) {
      if (!dc) return [];

      const object = dc.datasource;
      if (!object) return [];

      const fields = [];

      object.fields().forEach((f) => {
         const columnFormat = f.columnHeader();

         if (!f.isConnection) {
            let type = "text";

            switch (f.key) {
               case "boolean":
               case "number":
               case "date":
                  type = f.key;

                  break;

               default:
                  break;
            }

            fields.push({
               id: f.columnName,
               name: f.label,
               filter: f.fieldIsFilterable(),
               edit: false,
               type: type,
               format: columnFormat.format,
               options: columnFormat.options,
               ref: "",
               key: false,
               show: true,
               abField: f,
            });

            return;
         }

         if (f.isSource()) {
            const linkedDcs = this.view.application.datacollectionsIncluded(
               (dc) =>
                  this.settings.datacollectionIDs.includes(dc.id) &&
                  dc.settings.datasourceID === f.settings.linkObject
            );

            (linkedDcs || []).forEach((linkDc) => {
               fields.push({
                  id: f.id,
                  name: f.label,
                  filter: false,
                  edit: false,
                  type: "reference",
                  ref: linkDc.id,
                  key: false,
                  show: false,
               });
            });
         }
      });

      return fields;
   }

   async getData(datacollectionId) {
      const datacollection = this.AB.datacollectionByID(datacollectionId);
      if (!datacollection) return [];

      const object = datacollection.datasource;
      if (!object) return [];

      await this.waitInitializingDCEvery(1000, datacollection);

      const reportFields = this.getReportFields(datacollection);
      const reportData = [];
      const rawData = datacollection.getData();

      (rawData || []).forEach((row) => {
         const reportRow = { id: row.id };

         reportRow[`${datacollection.id}.id`] = row.id;

         object.fields().forEach((field) => {
            const columnName = field.columnName;
            const col = `${datacollection.id}.${columnName}`;

            if (field) {
               // FK value of the connect field
               if (field.isConnection) {
                  let $pk = field.datasourceLink.PK();
                  if (Array.isArray(row[columnName]))
                     reportRow[`${col}.id`] = row[columnName].map(
                        (link) => link[$pk] || link.id || link
                     );
                  else if (row[columnName])
                     reportRow[`${col}.id`] =
                        row[columnName][$pk] ||
                        row[columnName].id ||
                        row[columnName];
               } else reportRow[col] = field.format(row);
            } else reportRow[col] = row[columnName];

            const rField = reportFields.find(
               (f) => f.id === columnName || f.id === field.id
            );

            if (!rField) return;

            switch (rField.type) {
               case "text":
               case "reference":
                  reportRow[col] = (reportRow[col] || "").toString();
                  break;

               case "number":
                  reportRow[col] = parseFloat(
                     (reportRow[col] || 0).toString().replace(/[^\d.-]/g, "")
                  );
                  break;

               case "date":
               case "datetime":
                  reportRow[col] = row[columnName];
                  if (reportRow[col]) {
                     if (!(reportRow[col] instanceof Date))
                        reportRow[col] = this.AB.rules.toDate(row[columnName]);
                  } else reportRow[col] = "";
                  break;
            }
         });

         reportData.push(reportRow);
      });

      return reportData;
   }

   async waitInitializingDCEvery(milliSeconds, dc) {
      if (dc == null) return;
      // if we manage a datacollection, then make sure it has started
      // loading it's data when we are showing our component.
      // load data when a widget is showing
      if (dc.dataStatus === dc.dataStatusFlag.notInitial) await dc.loadData();

      return await new Promise((resolve) => {
         if (dc.dataStatus === dc.dataStatusFlag.initialized) {
            resolve();

            return;
         }

         const interval = setInterval(() => {
            if (dc.dataStatus === dc.dataStatusFlag.initialized) {
               clearInterval(interval);

               resolve();
            }
         }, milliSeconds);
      });
   }
};
