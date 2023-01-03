const Docxtemplater = require("../../../../js/docxtemplater.v3.0.12.min.js");
const ImageModule = require("../../../../js/docxtemplater-image-module.v3.0.2.min.js");
const JSZipUtils = require("jszip-utils/dist/jszip-utils.min.js");
const JSZip = require("../../../../js/jszip.min.js");

const ABFieldConnect = require("../../dataFields/ABFieldConnect");
const ABFieldImage = require("../../dataFields/ABFieldImage");
const ABObjectQuery = require("../../ABObjectQuery");

const ABViewComponent = require("./ABViewComponent").default;
const ABViewDocxBuilderCore = require("../../../core/views/ABViewDocxBuilderCore");

const ABViewDocxBuilderPropertyComponentDefaults = ABViewDocxBuilderCore.defaultValues();
const L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewDocxBuilderComponent extends ABViewComponent {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewDocxBuilderComponent_${baseView.id}`;
      super(baseView, idBase, {
         button: "",
         noFile: "",
      });
   }

   ui() {
      const view = this.view;

      let autowidth = false;
      let buttonWidth =
         view.settings.width ??
         ABViewDocxBuilderPropertyComponentDefaults.width;
      if (buttonWidth == 0) {
         autowidth = true;
      }

      let leftSpacer = {
         type: "spacer",
         width: 1,
      };
      let rightSpacer = {
         type: "spacer",
         width: 1,
      };

      switch (
         view.settings.buttonPosition ??
         ABViewDocxBuilderPropertyComponentDefaults.buttonPosition
      ) {
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
         view.buttonlabel ||
         view.settings.buttonlabel ||
         ABViewDocxBuilderPropertyComponentDefaults.buttonlabel; // Use || to check empty string ""

      return {
         view: "toolbar",
         css:
            view.settings.toolbarBackground ??
            ABViewDocxBuilderPropertyComponentDefaults.toolbarBackground,
         cols: [
            leftSpacer,
            {
               id: this.ids.button,
               view: "button",
               css: "webix_primary",
               type: "icon",
               icon: "fa fa-file-word-o",
               label: buttonLabelText,
               width:
                  view.settings.width ??
                  ABViewDocxBuilderPropertyComponentDefaults.width,
               autowidth: autowidth,
               click: () => {
                  this.renderFile();
               },
               on: {
                  // Add data-cy attribute for cypress tests
                  onAfterRender: () => {
                     const name = view.name.replace(".docxBuilder", "");
                     const dataCy = `docx download ${name} ${view.id}`;
                     $$(this.ids.button)
                        ?.$view.querySelector("button")
                        .setAttribute("data-cy", dataCy);
                  },
               },
            },
            {
               id: this.ids.noFile,
               view: "label",
               label: L("No template file"),
            },
            {
               type: "spacer",
            },
            rightSpacer,
         ],
      };
   }

   init(options) {
      const DownloadButton = $$(this.ids.button);
      const NoFileLabel = $$(this.ids.noFile);

      if (this.view.settings.filename) {
         DownloadButton.show();
         NoFileLabel.hide();
      } else {
         DownloadButton.hide();
         NoFileLabel.show();
      }
   }

   async onShow() {
      let tasks = [];

      this.view.datacollections.forEach((dc) => {
         if (dc && dc.dataStatus == dc.dataStatusFlag.notInitial) {
            // load data when a widget is showing
            tasks.push(dc.loadData());
         }
      });

      // Show loading cursor
      if (tasks.length > 0) this.busy();

      await Promise.all(tasks);

      // Hide loading cursor
      this.ready();
   }

   busy() {
      const DownloadButton = $$(this.ids.button);
      if (!DownloadButton) return;

      DownloadButton.disable();

      DownloadButton.define("icon", "fa fa-refresh fa-spin");
      DownloadButton.refresh();
   }

   ready() {
      const DownloadButton = $$(this.ids.button);
      if (!DownloadButton) return;

      DownloadButton.enable();

      DownloadButton.define("icon", "fa fa-file-word-o");
      DownloadButton.refresh();
   }

   async renderFile() {
      this.busy();

      const reportValues = this.getReportData();

      console.log("DOCX data: ", reportValues);

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

      // Let user download the output file
      this.view.letUserDownload(blobFile, this.view.filelabel);

      // Final step
      this.ready();
   }

   getReportData() {
      let result = {};

      // Get current cursor
      const datacollections = this.view.datacollections;
      const isDcLabelAdded = datacollections.length > 1;

      datacollections
         .filter((dc) => dc && dc.datasource)
         .forEach((dc) => {
            const obj = dc.datasource;
            const dcCursor = dc.getCursor();

            let dcValues = [];
            let dataList = [];

            // merge cursor to support dc and tree cursor in the report
            if (dcCursor) {
               const treeCursor = dc.getCursor(true);
               dataList.push(this.AB.merge({}, dcCursor, treeCursor));
            } else dataList = this.AB.cloneDeep(dc.getData());

            // update property names to column labels to match format names in docx file
            const mlFields = obj.multilingualFields();

            dataList.forEach((data) => {
               let resultData;

               // For support label of columns every languages
               obj.fields().forEach((f) => {
                  let fieldLabels = [];

                  // Query Objects
                  if (obj instanceof ABObjectQuery) {
                     if (typeof f.object.translations == "string")
                        f.object.translations = JSON.parse(
                           f.object.translations
                        );

                     if (typeof f.translations == "string")
                        f.translations = JSON.parse(f.translations);

                     (f.object.translations || []).forEach((objTran) => {
                        let fieldTran = (f.translations || []).filter(
                           (fieldTran) =>
                              fieldTran.language_code == objTran.language_code
                        )[0];

                        if (!fieldTran) return;

                        let objectLabel = objTran.label;
                        let fieldLabel = fieldTran.label;

                        // Replace alias with label of object
                        fieldLabels.push(`${objectLabel}.${fieldLabel}`);
                     });
                  }
                  // Normal Objects
                  else {
                     if (typeof f.translations == "string")
                        f.translations = JSON.parse(f.translations);

                     f.translations.forEach((tran) => {
                        fieldLabels.push(tran.label);
                     });
                  }

                  resultData = this.setReportValues(
                     data,
                     f,
                     fieldLabels,
                     mlFields
                  );

                  // Keep id of ABObject into .scope of DOCX templater
                  resultData._object = obj;
               });

               dcValues.push(resultData);
            });

            // If data sources have more than 1 or the result data more than 1 items, then add label of data source
            let datacollectionData =
               dcValues.length > 1 ? dcValues : dcValues[0];
            if (
               isDcLabelAdded ||
               (Array.isArray(datacollectionData) &&
                  datacollectionData.length > 1)
            ) {
               (dc.translations || []).forEach((tran) => {
                  result[tran.label] = datacollectionData;
               });
            } else result = datacollectionData;
         });

      return result;
   }

   setReportValues(data, field, fieldLabels = [], multilinguageFields) {
      let result = {};
      let val = null;

      result.id = data.id;
      result[`${field.columnName}_ORIGIN`] = data[field.columnName]; // Keep origin value for compare value with custom index

      // Translate multilinguage fields
      if (multilinguageFields.length) {
         let transFields = (multilinguageFields || []).filter(
            (fieldName) => data[fieldName] != null
         );
         this.view.translate(data, data, transFields, this.view.languageCode);
      }

      // Pull value
      if (field instanceof ABFieldConnect) {
         // If field is connected field, then
         // {
         //		fieldName: {Object} or [Array]
         // }
         val = data[field.columnName];

         if (val && val.forEach) {
            val.forEach((v) => {
               if (v == null) return;

               // format relation data
               if (field.datasourceLink) {
                  field.datasourceLink
                     .fields((f) => !f.isConnection)
                     .forEach((f) => {
                        v[`${f.columnName}_ORIGIN`] = v[f.columnName];

                        v[f.columnName] = f.format(v, {
                           languageCode: this.view.languageCode,
                        });
                     });
               }

               // Keep ABObject to relation data
               if (v && typeof v == "object") v._object = field.datasourceLink;
            });
         }
         // TODO
         // data[label + '_label'] = field.format(baseData);
      } else {
         val = field.format(data, {
            languageCode: this.view.languageCode,
         });
      }

      // Set value to report with every languages of label
      fieldLabels.forEach((label) => {
         if (val) {
            result[label] = val;
         } else if (!result[label]) {
            result[label] = "";
         }
      });

      // normalize child items
      if (data.data && data.data.length) {
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
      let images = {};
      let tasks = [];

      let addDownloadTask = (fieldImage, data = []) => {
         data.forEach((d) => {
            let imageVal = fieldImage.format(d);
            if (imageVal && !images[imageVal]) {
               tasks.push(
                  new Promise((ok, bad) => {
                     let imgUrl = fieldImage.urlImage(imageVal); // `/opsportal/image/${this.application.name}/${imageVal}`;

                     JSZipUtils.getBinaryContent(
                        imgUrl,
                        function (error, content) {
                           if (error) return bad(error);
                           else {
                              // store binary of image
                              images[imageVal] = content;

                              ok();
                           }
                        }
                     );
                  })
               );
            }

            // download images of child items
            addDownloadTask(fieldImage, d.data || []);
         });
      };

      this.view.datacollections
         .filter((dc) => dc && dc.datasource)
         .forEach((dc) => {
            const obj = dc.datasource;

            let currCursor = dc.getCursor();
            if (currCursor) {
               // Current cursor
               let treeCursor = dc.getCursor(true);
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

   async downloadTemplateFile() {
      const url = this.view.downloadUrl();

      return new Promise((resolve, reject) => {
         JSZipUtils.getBinaryContent(url, (error, content) => {
            if (error) return reject(error);

            resolve(content);
         });
      });
   }

   generateDocxFile(contentFile, data, images) {
      let summaries = {}; // { varName: sum number, ..., varName2: number2 }
      let zip = new JSZip(contentFile);
      let doc = new Docxtemplater();

      let imageModule = new ImageModule({
         centered: false,
         getImage: (tagValue, tagName) => {
            // NOTE: .getImage of version 3.0.2 does not support async
            //			we can buy newer version to support it
            //			https://docxtemplater.com/modules/image/

            return images[tagValue] || "";
         },
         getSize: (imgBuffer, tagValue, tagName) => {
            let defaultVal = [300, 160];

            let dc = this.view.datacollection;
            if (!dc) {
               let dcs = this.view.datacollections;
               if (dcs) {
                  dcs.forEach((dc) => {
                     let obj = dc.datasource;
                     if (!obj) return false;

                     // This is a query object
                     if (tagName.indexOf(".") > -1) {
                        let tagNames = tagName.split(".");

                        if (!obj.objects) return false; // not a query
                        obj = obj.objects((o) => o.label == tagNames[0])[0]; // Label of object
                        if (!obj) return false;

                        tagName = tagNames[1]; // Field name
                     }

                     let imageField = obj.fields(
                        (f) => f.columnName == tagName
                     )[0];
                     if (!imageField || !imageField.settings) return false;

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
               } else {
                  return defaultVal;
               }
            } else {
               let obj = dc.datasource;
               if (!obj) return defaultVal;

               // This is a query object
               if (tagName.indexOf(".") > -1) {
                  let tagNames = tagName.split(".");

                  obj = obj.objects((o) => o.label == tagNames[0])[0]; // Label of object
                  if (!obj) return defaultVal;

                  tagName = tagNames[1]; // Field name
               }

               let imageField = obj.fields((f) => f.columnName == tagName)[0];
               if (!imageField || !imageField.settings) return defaultVal;

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
         // 	if (imgBuffer) {
         // 		var maxWidth = 300;
         // 		var maxHeight = 160;

         // 		// Find aspect ratio image dimensions
         // 		try {
         // 			var image = sizeOf(imgBuffer);
         // 			var ratio = Math.min(maxWidth / image.width, maxHeight / image.height);

         // 			return [image.width * ratio, image.height * ratio];
         // 		}
         // 		// if invalid image, then should return 0, 0 sizes
         // 		catch (err) {
         // 			return [0, 0];
         // 		}

         // 	}
         // 	else {
         // 		return [0, 0];
         // 	}
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
                        if (tag.indexOf("data|") == 0) {
                           let prop = (tag.split("|")[1] || "").trim();

                           return (scope["data"] || []).filter(function (item) {
                              return item[prop] ? true : false;
                           });
                        }
                        // Mark number to add to a variable
                        else if (tag.indexOf("|$sum?") > -1) {
                           let prop = tag.split("|$sum?")[0];
                           let varName = tag.split("|$sum?")[1];

                           let number = scope[prop];
                           if (typeof number == "string") {
                              number = number.replace(
                                 /[^\d.]/g, // return only number and dot
                                 ""
                              );
                           }

                           if (summaries[varName] == null)
                              summaries[varName] = 0.0;

                           summaries[varName] += parseFloat(number);

                           return scope[prop];
                        }
                        // Show sum value ^
                        else if (tag.indexOf("$sum?") == 0) {
                           let varName = tag.replace("$sum?", "");

                           return summaries[varName] || 0;
                        }
                        // // Sum number of .data (Grouped query)
                        // else if (tag.indexOf("$sum|") == 0) {
                        //    let prop = (
                        //       tag.split("|")[1] || ""
                        //    ).trim();

                        //    let sum = 0;
                        //    (scope["data"] || []).forEach(
                        //       (childItem) => {
                        //          if (!childItem[prop]) return;

                        //          let number = childItem[prop];
                        //          if (typeof number == "string") {
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
                        else if (tag.indexOf("$") == 0) {
                           let props = tag.replace("$", "").split("|");
                           let propSource = props[0].trim();
                           let propFilter = props[1].trim(); // column name of ABFieldConnect

                           if (!propSource || !propFilter) return "";

                           // Pull Index field of connect field
                           let indexColName;
                           let obj = scope._object;
                           if (obj) {
                              let connectedField = obj.fields(
                                 (f) => f.columnName == propFilter
                              )[0];
                              if (connectedField) {
                                 let indexField = connectedField.indexField;
                                 indexColName = indexField
                                    ? indexField.columnName
                                    : null;
                              }
                           }

                           let sourceVals = data[propSource];
                           if (sourceVals && !Array.isArray(sourceVals))
                              sourceVals = [sourceVals];

                           let getVal = (data) => {
                              return (
                                 data[`${indexColName}_ORIGIN`] || // Pull origin data to compare by custom index
                                 data[indexColName] ||
                                 data.id ||
                                 data
                              );
                           };

                           return (sourceVals || []).filter(function (item) {
                              // Pull data of parent to compare
                              let comparer = scope[propFilter];

                              if (Array.isArray(comparer))
                                 return (
                                    comparer.filter(
                                       (c) => getVal(c) == getVal(item)
                                    ).length > 0
                                 );
                              else {
                                 return getVal(item) == getVal(comparer);
                              }
                           });
                        }
                        // ์NOTE : Custom filter
                        else if (tag.indexOf("?") > -1) {
                           let result = scope;
                           let prop = tag.split("?")[0];
                           let condition = tag.split("?")[1];
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
                        } else if (tag === ".") {
                           return scope;
                        } else {
                           return scope[tag];
                        }
                     },
                  };
               },
            })
            .render(); // render the document
      } catch (error) {
         return err(error);
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
