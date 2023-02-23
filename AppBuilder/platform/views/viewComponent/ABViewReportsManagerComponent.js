const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewReportsManagerComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewReportManager_${baseView.id}`,
         Object.assign({ reportManager: "" }, ids)
      );
   }

   ui() {
      const self = this;
      const baseView = this.view;
      const settings = this.settings;
      const ab = this.AB;
      const abWebix = ab.Webix;

      const _uiReportManager = {
         id: this.ids.reportManager,
         view: "reports",
         toolbar: true,
         override: new Map([
            [
               reports.services.Backend,
               class MyBackend extends reports.services.Backend {
                  async getModules() {
                     return settings.moduleList || [];
                  }

                  saveModule(id = abWebix.uid(), data) {
                     settings.moduleList = settings.moduleList || [];

                     let indexOfModule = null;

                     const module = settings.moduleList.filter((m, index) => {
                        const isExists = m.id === id;

                        if (isExists) indexOfModule = index;

                        return isExists;
                     })[0];

                     // Update
                     if (module) settings.moduleList[indexOfModule] = data;
                     // Add
                     else settings.moduleList.push(data);

                     return new Promise((resolve, reject) => {
                        const viewSave = async () => {
                           try {
                              await baseView.save();

                              resolve({ id: id });
                           } catch (err) {
                              reject(err);
                           }
                        };

                        viewSave();
                     });
                  }

                  deleteModule(id) {
                     settings.moduleList = settings.moduleList || [];

                     settings.moduleList = settings.moduleList.filter(
                        (m) => m.id !== id
                     );

                     return new Promise((resolve, reject) => {
                        const viewSave = async () => {
                           try {
                              await baseView.save();

                              resolve({ id: id });
                           } catch (err) {
                              reject(err);
                           }
                        };

                        viewSave();
                     });
                  }

                  async getModels() {
                     const reportModels = {};

                     (ab.datacollections() || []).forEach((dc) => {
                        const obj = dc.datasource;

                        if (!obj) return;

                        const reportFields = this.getReportFields(dc);

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
                     return settings.queryList || [];
                  }

                  saveQuery(id = abWebix.uid(), data) {
                     settings.queryList = settings.queryList || [];

                     let indexOfQuery = null;

                     const query = settings.queryList.filter((m, index) => {
                        const isExists = m.id === id;

                        if (isExists) indexOfQuery = index;

                        return isExists;
                     })[0];

                     // Update
                     if (query) settings.queryList[indexOfQuery] = data;
                     // Add
                     else settings.queryList.push(data);

                     return new Promise((resolve, reject) => {
                        const viewSave = async () => {
                           try {
                              await baseView.save();

                              resolve({ id: id });
                           } catch (err) {
                              reject(err);
                           }
                        };

                        viewSave();
                     });
                  }

                  deleteQuery(id) {
                     settings.queryList = settings.queryList || [];
                     settings.queryList = settings.queryList.filter(
                        (m) => m.id !== id
                     );

                     return new Promise((resolve, reject) => {
                        const viewSave = async () => {
                           try {
                              await baseView.save();

                              resolve({ id: id });
                           } catch (err) {
                              reject(err);
                           }
                        };

                        viewSave();
                     });
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
                                    dcData[dcId] =
                                       (await self.getData(dcId)) || [];

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
                           this.getReportFields(dataCol).map((f) => {
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
                                             r[`${j.sid}.id`] ===
                                                sData[`${j.sid}.id`] &&
                                             !r[`${j.tid}.id`]
                                       ) || [];

                                    if (updateRows?.length)
                                       (updateRows || []).forEach((r) => {
                                          for (const key in tData)
                                             if (key !== "id")
                                                r[key] = tData[key];
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
                                    if (ab.isString(r.condition.filter))
                                       r.condition.filter = ab.rules.toDate(
                                          r.condition.filter
                                       );

                                    if (
                                       r.condition.filter.start &&
                                       ab.isString(r.condition.filter.start)
                                    )
                                       r.condition.filter.start =
                                          ab.rules.toDate(
                                             r.condition.filter.start
                                          );

                                    if (
                                       r.condition.filter.end &&
                                       ab.isString(r.condition.filter.end)
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
                                       groupedResult[col] = (
                                          groupedData || []
                                       ).length;
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
               },
            ],
            [
               reports.views.table,
               class MyTable extends reports.views.table {
                  // NOTE: fix format of date column type
                  GetColumnConfig(a) {
                     if (a.type === "date") {
                        return {
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
                           format: (val) => {
                              // check valid date
                              if (val?.getTime && !isNaN(val.getTime()))
                                 return abWebix.i18n.dateFormatStr(val);
                              else return "";
                           },
                        };
                     } else return super.GetColumnConfig(a);
                  }
               },
            ],
         ]),
      };

      const _ui = super.ui([_uiReportManager]);

      delete _ui.type;
      delete _ui.height;

      return _ui;
   }

   getReportFields(dc) {
      if (!dc) return [];

      const object = dc.datasource;

      if (!object) return [];

      const fields = [];

      object.fields().forEach((f) => {
         const columnFormat = f.columnHeader();

         fields.push({
            id: f.columnName,
            name: f.label,
            filter: f.fieldIsFilterable(),
            edit: false,
            type: columnFormat.editor || "text",
            format: columnFormat.format,
            options: columnFormat.options,
            ref: "",
            key: false,
            show: true,
            abField: f,
         });

         if (f.isConnection && f.settings.isSource) {
            const linkedDcs = this.AB.datacollectionByID(f.settings.linkObject);

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

      if (
         datacollection.dataStatus === datacollection.dataStatusFlag.notInitial
      )
         await datacollection.loadData();

      const reportFields = this.getReportFields(datacollection);
      const reportData = [];
      const rawData = datacollection.getData();

      (rawData || []).forEach((row) => {
         const reportRow = { id: row.id };

         reportRow[`${datacollection.id}.id`] = row.id;

         object.fields().forEach((field) => {
            const columnName = field.columnName;
            const col = `${datacollection.id}.${columnName}`;

            reportRow[col] = field ? field.format(row) : row[columnName];

            // FK value of the connect field
            if (field && field.isConnection) {
               if (Array.isArray(row[columnName]))
                  reportRow[`${col}.id`] = row[columnName].map(
                     (link) =>
                        link[field.datasourceLink.PK()] || link.id || link
                  );
               else if (row[columnName])
                  reportRow[`${col}.id`] =
                     row[columnName][field.datasourceLink.PK()] ||
                     row[columnName].id ||
                     row[columnName];
            }

            const rField = reportFields.filter((f) => f.id === columnName)[0];

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
};
