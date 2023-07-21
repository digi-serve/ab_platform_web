const Docxtemplater = require("../../../../js/docxtemplater.v3.0.12.min.js");
const ImageModule = require("../../../../js/docxtemplater-image-module.v3.0.2.min.js");
const JSZipUtils = require("jszip-utils/dist/jszip-utils.min.js");
const JSZip = require("../../../../js/jszip.min.js");

const ABFieldConnect = require("../../dataFields/ABFieldConnect");
const ABFieldImage = require("../../dataFields/ABFieldImage");
const ABObjectQuery = require("../../ABObjectQuery");

const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewDocxBuilderComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewDocxBuilder_${baseView.id}`,
         Object.assign(
            {
               downloadButton: "",
               noFileLabel: "",
            },
            ids
         )
      );
   }

   ui() {
      const baseView = this.view;
      const settings = this.settings;
      const defaultSettings = baseView.constructor.defaultValues();
      const buttonWidth = settings.width ?? defaultSettings.width;

      let autowidth = false;

      if (buttonWidth === 0) autowidth = true;

      let leftSpacer = {
         type: "spacer",
         width: 1,
      };
      let rightSpacer = {
         type: "spacer",
         width: 1,
      };

      switch (settings.buttonPosition ?? defaultSettings.buttonPosition) {
         case "left":
            break;
         case "center":
            leftSpacer = {
               type: "spacer",
            };
            rightSpacer = {
               type: "spacer",
            };
            break;
         case "right":
            leftSpacer = {
               type: "spacer",
            };
            break;
      }

      const buttonLabelText =
         baseView.buttonlabel ||
         settings.buttonlabel ||
         defaultSettings.buttonlabel; // Use || to check empty string ""
      const ids = this.ids;
      const _ui = super.ui([
         {
            view: "toolbar",
            css:
               settings.toolbarBackground ?? defaultSettings.toolbarBackground,
            cols: [
               leftSpacer,
               {
                  id: ids.downloadButton,
                  view: "button",
                  css: "webix_primary",
                  type: "icon",
                  icon: "fa fa-file-word-o",
                  label: buttonLabelText,
                  width: settings.width || defaultSettings.width,
                  autowidth: autowidth,
                  click: () => {
                     this.renderFile();
                  },
                  on: {
                     // Add data-cy attribute for cypress tests
                     onAfterRender: () => {
                        const name = baseView.name?.replace(".docxBuilder", "");
                        const dataCy = `docx download ${name} ${baseView.id}`;
                        $$(ids.downloadButton)
                           ?.$view.querySelector("button")
                           .setAttribute("data-cy", dataCy);
                     },
                  },
               },
               {
                  id: ids.noFileLabel,
                  view: "label",
                  label: this.label("No template file"),
               },
               {
                  type: "spacer",
               },
               rightSpacer,
            ],
         },
      ]);

      delete _ui.type;

      return _ui;
   }

   async init(AB) {
      await super.init(AB);

      const ids = this.ids;
      const $downloadButton = $$(ids.downloadButton);
      const $noFileLabel = $$(ids.noFileLabel);

      if (this.view.settings.filename) {
         $downloadButton.show();
         $noFileLabel.hide();
      } else {
         $downloadButton.hide();
         $noFileLabel.show();
      }
   }

   async onShow() {
      super.onShow;

      const tasks = [];

      this.view.datacollections.forEach((dc) => {
         if (dc.dataStatus === dc.dataStatusFlag.notInitial)
            // load data when a widget is showing
            tasks.push(dc.loadData());
      });

      // Show loading cursor
      if (tasks.length > 0) this.busy();

      await Promise.all(tasks);

      // Hide loading cursor
      this.ready();
   }

   busy() {
      const $downloadButton = $$(this.ids.downloadButton);

      if (!$downloadButton) return;

      $downloadButton.disable();
      $downloadButton.define("icon", "fa fa-refresh fa-spin");
      $downloadButton.refresh();
   }

   ready() {
      const $downloadButton = $$(this.ids.downloadButton);

      if (!$downloadButton) return;

      $downloadButton.enable();
      $downloadButton.define("icon", "fa fa-file-word-o");
      $downloadButton.refresh();
   }

   async renderFile() {
      this.busy();

      const reportValues = this.getReportData();

      // console.log("DOCX data: ", reportValues);

      // Download images
      const images = await this.downloadImages();

      // Download the template file
      const contentTemplateFile = await this.downloadTemplateFile();

      // Generate Docx file
      const blobFile = this.generateDocxFile(
         contentTemplateFile,
         reportValues,
         images
      );

      const baseView = this.view;

      // Let user download the output file
      baseView.letUserDownload(blobFile, baseView.filelabel);

      // Final step
      this.ready();
   }

   getReportData() {
      const result = {};

      // Get current cursor
      const datacollections = this.view.datacollections;
      const isDcLabelAdded = datacollections.length > 1;

      datacollections
         .filter((dc) => dc?.datasource)
         .forEach(async (dc) => {
            const obj = dc.datasource;
            const objModel = obj.model();
            const dcCursor = dc.getCursor();
            const dcValues = [];
            // const dataList = [];

            // merge cursor to support dc and tree cursor in the report
            // if (dcCursor) {
            //    const treeCursor = dc.getCursor(true);

            //    dataList.push(this.AB.merge({}, dcCursor, treeCursor));
            // } else {
            //    dataList.push(...this.AB.cloneDeep(dc.getData()));
            // }

            let where = {};
            if (dcCursor) {
               where = {
                  glue: "and",
                  rules: [
                     {
                        key: obj.PK(),
                        rule: "equals",
                        value: dcCursor[obj.PK()],
                     },
                  ],
               };
            } else {
               where = this.AB.merge(
                  where,
                  dc.settings?.objectWorkspace?.filterConditions ?? {}
               );
            }

            // Pull data that have full relation values.
            // NOTE: When get data from DataCollection, those data is pruned.
            const dataList = (
               await objModel.findAll({
                  disableMinifyRelation: true,
                  populate: true,
                  skip: 0,
                  where,
               })
            ).data;

            // update property names to column labels to match format names in docx file
            const mlFields = obj.multilingualFields();

            dataList.forEach((data) => {
               let resultData;

               // For support label of columns every languages
               obj.fields().forEach((f) => {
                  const fieldLabels = [];

                  // Query Objects
                  if (obj instanceof ABObjectQuery) {
                     if (typeof f.object.translations === "string")
                        f.object.translations = JSON.parse(
                           f.object.translations
                        );

                     if (typeof f.translations === "string")
                        f.translations = JSON.parse(f.translations);

                     (f.object.translations || []).forEach((objTran) => {
                        const fieldTran = (f.translations || []).filter(
                           (fieldTran) =>
                              fieldTran.language_code === objTran.language_code
                        )[0];

                        if (!fieldTran) return;

                        const objectLabel = objTran.label;
                        const fieldLabel = fieldTran.label;

                        // Replace alias with label of object
                        fieldLabels.push(`${objectLabel}.${fieldLabel}`);
                     });
                  }
                  // Normal Objects
                  else if (typeof f.translations === "string")
                     f.translations = JSON.parse(f.translations);

                  f.translations.forEach((tran) => {
                     fieldLabels.push(tran.label);
                  });

                  resultData = Object.assign(
                     resultData ?? {},
                     this.setReportValues(data, f, fieldLabels, mlFields) ?? {}
                  );

                  // Keep ABObject into .scope of DOCX templater
                  resultData._object = obj;
               });

               dcValues.push(resultData);
            });

            // If data sources have more than 1 or the result data more than 1 items, then add label of data source
            const datacollectionData =
               dcValues.length > 1 ? dcValues : dcValues[0];

            if (
               isDcLabelAdded ||
               (Array.isArray(datacollectionData) &&
                  datacollectionData.length > 1)
            )
               (dc.translations || []).forEach((tran) => {
                  result[tran.label] = datacollectionData;
               });
            else Object.assign(result, datacollectionData);
         });

      return result;
   }

   setReportValues(data, field, fieldLabels = [], multilinguageFields) {
      const result = {};

      let val = null;

      result.id = data.id;
      result[`${field.columnName}_ORIGIN`] = data[field.columnName]; // Keep origin value for compare value with custom index

      const baseView = this.view;

      // Translate multilinguage fields
      if (multilinguageFields.length) {
         const transFields = (multilinguageFields || []).filter(
            (fieldName) => data[fieldName] != null
         );

         baseView.translate(data, data, transFields, baseView.languageCode);
      }

      // Pull value
      if (field instanceof ABFieldConnect) {
         // If field is connected field, then
         // {
         //    fieldName: {Object} or [Array]
         // }
         val = data[field.columnName];

         if (val?.forEach)
            val.forEach((v) => {
               if (!v) return;

               // format relation data
               if (field.datasourceLink) {
                  field.datasourceLink
                     .fields((f) => !f.isConnection)
                     .forEach((f) => {
                        v[`${f.columnName}_ORIGIN`] = v[f.columnName];

                        v[f.columnName] = f.format(v, {
                           languageCode: baseView.languageCode,
                        });
                     });
               }

               // Keep ABObject to relation data
               if (v && typeof v === "object") v._object = field.datasourceLink;
            });

         // TODO
         // data[label + '_label'] = field.format(baseData);
      } else
         val = field.format(data, {
            languageCode: baseView.languageCode,
         });

      // Set value to report with every languages of label
      fieldLabels.forEach((label) => {
         if (val) result[label] = val;
         else if (!result[label]) result[label] = "";
      });

      // normalize child items
      if (data.data?.length) {
         result.data = result.data || [];

         (data.data || []).forEach((childItem, index) => {
            // add new data item
            result.data[index] = this.setReportValues(
               childItem,
               field,
               fieldLabels,
               multilinguageFields
            );
         });
      }

      return result;
   }

   async downloadImages() {
      const images = {};
      const tasks = [];
      const addDownloadTask = (fieldImage, data = []) => {
         data.forEach((d) => {
            const imageVal = fieldImage.format(d);

            if (imageVal && !images[imageVal]) {
               tasks.push(
                  new Promise((resolve, reject) => {
                     const imgUrl = fieldImage.urlImage(imageVal); // `/opsportal/image/${this.application.name}/${imageVal}`;

                     JSZipUtils.getBinaryContent(imgUrl, (error, content) => {
                        if (error) return reject(error);

                        // store binary of image
                        images[imageVal] = content;

                        resolve();
                     });
                  })
               );
            }

            // download images of child items
            addDownloadTask(fieldImage, d.data || []);
         });
      };

      this.view.datacollections
         .filter((dc) => dc?.datasource)
         .forEach((dc) => {
            const obj = dc.datasource;

            let currCursor = dc.getCursor();

            if (currCursor) {
               // Current cursor
               const treeCursor = dc.getCursor(true);

               currCursor = [this.AB.merge({}, currCursor, treeCursor)];
            } // List of data
            else currCursor = dc.getData();

            obj.fields((f) => f instanceof ABFieldImage).forEach((f) => {
               addDownloadTask(f, currCursor);
            });
         });

      await Promise.all(tasks);

      return images;
   }

   downloadTemplateFile() {
      const url = this.view.downloadUrl();

      return new Promise((resolve, reject) => {
         JSZipUtils.getBinaryContent(url, (error, content) => {
            if (error) return reject(error);

            resolve(content);
         });
      });
   }

   generateDocxFile(contentFile, data, images) {
      const summaries = {}; // { varName: sum number, ..., varName2: number2 }
      const zip = new JSZip(contentFile);
      const doc = new Docxtemplater();
      const imageModule = new ImageModule({
         centered: false,
         getImage: (tagValue, tagName) => {
            // NOTE: .getImage of version 3.0.2 does not support async
            //       we can buy newer version to support it
            //       https://docxtemplater.com/modules/image/

            return images[tagValue] || "";
         },
         getSize: (imgBuffer, tagValue, tagName) => {
            const defaultVal = [300, 160];
            const baseView = this.view;
            const dc = baseView.datacollection;

            if (!dc) {
               const dcs = baseView.datacollections;

               if (dcs) {
                  dcs.forEach((dc) => {
                     let obj = dc.datasource;

                     if (!obj) return false;

                     // This is a query object
                     if (tagName.indexOf(".") > -1) {
                        let tagNames = tagName.split(".");

                        if (!obj.objects) return false; // not a query

                        obj = obj.objects((o) => o.label === tagNames[0])[0]; // Label of object

                        if (!obj) return false;

                        tagName = tagNames[1]; // Field name
                     }

                     const imageField = obj.fields(
                        (f) => f.columnName === tagName
                     )[0];

                     if (!imageField?.settings) return false;

                     if (
                        imageField.settings.useWidth &&
                        imageField.settings.imageWidth
                     )
                        defaultVal[0] = imageField.settings.imageWidth;

                     if (
                        imageField.settings.useHeight &&
                        imageField.settings.imageHeight
                     )
                        defaultVal[1] = imageField.settings.imageHeight;

                     return false;
                  });

                  return defaultVal;
               } else return defaultVal;
            } else {
               let obj = dc.datasource;

               if (!obj) return defaultVal;

               // This is a query object
               if (tagName.indexOf(".") > -1) {
                  const tagNames = tagName.split(".");

                  obj = obj.objects((o) => o.label === tagNames[0])[0]; // Label of object

                  if (!obj) return defaultVal;

                  tagName = tagNames[1]; // Field name
               }

               const imageField = obj.fields(
                  (f) => f.columnName === tagName
               )[0];

               if (!imageField?.settings) return defaultVal;

               if (
                  imageField.settings.useWidth &&
                  imageField.settings.imageWidth
               )
                  defaultVal[0] = imageField.settings.imageWidth;

               if (
                  imageField.settings.useHeight &&
                  imageField.settings.imageHeight
               )
                  defaultVal[1] = imageField.settings.imageHeight;

               return defaultVal;
            }
         },
         // getSize: function (imgBuffer, tagValue, tagName) {
         //    if (imgBuffer) {
         //       var maxWidth = 300;
         //       var maxHeight = 160;

         //       // Find aspect ratio image dimensions
         //       try {
         //          var image = sizeOf(imgBuffer);
         //          var ratio = Math.min(maxWidth / image.width, maxHeight / image.height);

         //          return [image.width * ratio, image.height * ratio];
         //       }
         //       // if invalid image, then should return 0, 0 sizes
         //       catch (err) {
         //          return [0, 0];
         //       }

         //    }
         //    else {
         //       return [0, 0];
         //    }
         // }
      });

      try {
         doc.attachModule(imageModule)
            .loadZip(zip)
            .setData(data)
            .setOptions({
               parser: function (tag) {
                  return {
                     get: function (scope, context) {
                        // NOTE: AppBuilder custom filter : no return empty items
                        if (tag.indexOf("data|") === 0) {
                           const prop = (tag.split("|")[1] || "").trim();

                           return (scope["data"] || []).filter(function (item) {
                              return item[prop] ? true : false;
                           });
                        }
                        // Mark number to add to a variable
                        else if (tag.indexOf("|$sum?") > -1) {
                           const prop = tag.split("|$sum?")[0];
                           const varName = tag.split("|$sum?")[1];

                           let number = scope[prop];

                           if (typeof number === "string")
                              number = number.replace(
                                 /[^\d.]/g, // return only number and dot
                                 ""
                              );

                           if (!summaries[varName]) summaries[varName] = 0.0;

                           summaries[varName] += parseFloat(number);

                           return scope[prop];
                        }
                        // Show sum value ^
                        else if (tag.indexOf("$sum?") === 0) {
                           const varName = tag.replace("$sum?", "");

                           return summaries[varName] || 0;
                        }
                        // // Sum number of .data (Grouped query)
                        // else if (tag.indexOf("$sum|") === 0) {
                        //    const prop = (
                        //       tag.split("|")[1] || ""
                        //    ).trim();

                        //    let sum = 0;
                        //    (scope["data"] || []).forEach(
                        //       (childItem) => {
                        //          if (!childItem[prop]) return;

                        //          let number = childItem[prop];
                        //          if (typeof number === "string") {
                        //             number = number.replace(
                        //                /[^\d.]/g, // return only number and dot
                        //                ""
                        //             );
                        //          }

                        //          try {
                        //             sum += parseFloat(
                        //                number || 0
                        //             );
                        //          } catch (e) {}
                        //       }
                        //    );

                        //    // Print number with commas
                        //    if (sum) {
                        //       sum = sum
                        //          .toString()
                        //          .replace(
                        //             /\B(?=(\d{3})+(?!\d))/g,
                        //             ","
                        //          );
                        //    }

                        //    return sum;
                        // }
                        // NOTE: AppBuilder custom filter of another data source
                        else if (tag.indexOf("$") === 0) {
                           const props = tag.replace("$", "").split("|");
                           const propSource = props[0].trim();
                           const propFilter = props[1].trim(); // column name of ABFieldConnect

                           if (!propSource || !propFilter) return "";

                           // Pull Index field of connect field
                           let indexColName;

                           const obj = scope._object;

                           if (obj) {
                              const connectedField = obj.fields(
                                 (f) => f.columnName === propFilter
                              )[0];

                              if (connectedField) {
                                 const indexField = connectedField.indexField;

                                 indexColName = indexField
                                    ? indexField.columnName
                                    : null;
                              }
                           }

                           let sourceVals = data[propSource];

                           if (sourceVals && !Array.isArray(sourceVals))
                              sourceVals = [sourceVals];

                           const getVal = (data) =>
                              data[`${indexColName}_ORIGIN`] || // Pull origin data to compare by custom index
                              data[indexColName] ||
                              data.id ||
                              data;

                           return (sourceVals || []).filter(function (item) {
                              // Pull data of parent to compare
                              let comparer = scope[propFilter];

                              if (Array.isArray(comparer))
                                 return (
                                    comparer.filter(
                                       (c) => getVal(c) === getVal(item)
                                    ).length > 0
                                 );
                              else return getVal(item) === getVal(comparer);
                           });
                        }
                        // ์NOTE : Custom filter
                        else if (tag.indexOf("?") > -1) {
                           const result = scope;
                           const prop = tag.split("?")[0];
                           const condition = tag.split("?")[1];

                           if (prop && condition) {
                              let data = scope[prop];

                              if (data) {
                                 if (!Array.isArray(data)) data = [data];

                                 return data.filter((d) =>
                                    eval(condition.replace(/\./g, "d."))
                                 );
                              }
                           }
                           return result;
                        } else if (tag === ".") return scope;
                        else return scope[tag];
                     },
                  };
               },
            })
            .render(); // render the document
      } catch (error) {
         return error;
      }

      // Output the document using Data-URI
      const docxFile = doc.getZip().generate({
         type: "blob",
         mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      return docxFile;
   }
};
