const ABViewComponent = require("./ABViewComponent").default;
const CSVImporter = require("../../CSVImporter");

module.exports = class ABViewCSVImporterComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABCSVImporter_${baseView.id}`,
         Object.assign(
            {
               button: "",
               popup: "",

               form: "",
               uploader: "",
               uploadFileList: "",
               separatedBy: "",
               headerOnFirstLine: "",
               columnList: "",

               search: "",
               datatable: "",

               statusMessage: "",
               progressBar: "",

               importButton: "",
               rules: "",
            },
            ids
         )
      );

      this.csvImporter = new CSVImporter((...args) => this.label(...args));
      // {CSVImporter}
      // An instance of the object that imports the CSV data.

      this.validationError = false;

      this._dataRows = null;
      this._csvFileInfo = null;
   }

   ui() {
      const settings = this.settings;
      const defaultSettings = this.view.constructor.defaultValues();
      const _ui = super.ui([
         {
            cols: [
               {
                  view: "button",
                  css: "webix_primary",
                  type: "icon",
                  icon: "fa fa-upload",
                  label: this.label(
                     settings.buttonLabel || defaultSettings.buttonLabel
                  ),
                  width: settings.width || defaultSettings.width,
                  click: () => {
                     this.showPopup();
                  },
               },
               {
                  fillspace: true,
               },
            ],
         },
      ]);

      delete _ui.type;

      return _ui;
   }

   uiConfig() {
      const ids = this.ids;

      return {
         id: ids.form,
         view: "form",
         type: "clean",
         borderless: true,
         minWidth: 400,
         gravity: 1,
         elements: [
            {
               rows: [
                  {
                     id: ids.uploader,
                     view: "uploader",
                     name: "csvFile",
                     css: "webix_primary",
                     value: this.label("Choose a CSV file"),
                     accept: "text/csv",
                     multiple: false,
                     autosend: false,
                     link: ids.uploadFileList,
                     on: {
                        onBeforeFileAdd: (fileInfo) => {
                           this._csvFileInfo = fileInfo;

                           return this.loadCsvFile();
                        },
                     },
                  },
                  {
                     id: ids.uploadFileList,
                     name: "uploadedFile",
                     view: "list",
                     type: "uploader",
                     autoheight: true,
                     borderless: true,
                     onClick: {
                        webix_remove_upload: (e, id /*, trg */) => {
                           this.removeCsvFile(id);
                        },
                     },
                  },
                  {
                     padding: 10,
                     rows: [
                        {
                           id: ids.separatedBy,
                           view: "richselect",
                           name: "separatedBy",
                           label: this.label("Separated by"),
                           labelWidth: 140,
                           options: this.csvImporter.getSeparateItems(),
                           value: ",",
                           on: {
                              onChange: () => {
                                 this.loadCsvFile();
                              },
                           },
                        },
                        {
                           id: ids.headerOnFirstLine,
                           view: "checkbox",
                           name: "headerOnFirstLine",
                           label: this.label("Header on first line"),
                           labelWidth: 140,
                           disabled: true,
                           value: true,
                           on: {
                              onChange: (/*newVal, oldVal*/) => {
                                 this.populateColumnList();
                              },
                           },
                        },
                     ],
                  },
                  {
                     type: "space",
                     rows: [
                        {
                           view: "scrollview",
                           minHeight: 300,
                           body: {
                              padding: 10,
                              id: ids.columnList,
                              rows: [],
                           },
                        },
                     ],
                  },
               ],
            },
         ],
      };
   }

   uiRecordsView() {
      const ids = this.ids;

      return {
         gravity: 2,
         rows: [
            {
               view: "toolbar",
               css: "bg_gray",
               cols: [
                  { width: 5 },
                  {
                     id: ids.search,
                     view: "search",
                     value: "",
                     label: "",
                     placeholder: this.label("Search records..."),
                     keyPressTimeout: 200,
                     on: {
                        onTimedKeyPress: () => {
                           this.search($$(ids.search).getValue());
                        },
                     },
                  },
                  { width: 2 },
               ],
            },
            {
               id: ids.datatable,
               view: "datatable",
               resizeColumn: true,
               editable: true,
               editaction: "dblclick",
               css: "ab-csv-importer",
               borderless: false,
               tooltip: (obj) => {
                  const tooltip = obj._errorMsg
                     ? obj._errorMsg
                     : "No validation errors";
                  return tooltip;
               },
               minWidth: 650,
               columns: [],
               on: {
                  onValidationError: (id, obj, details) => {
                     // console.log(`item ${id} invalid`);
                     let errors = "";

                     Object.keys(details).forEach((key) => {
                        this.$view.complexValidations[key].forEach((err) => {
                           errors += err.invalidMessage + "</br>";
                        });
                     });

                     const $dt = $$(ids.datatable);

                     $dt.blockEvent();
                     $dt.updateItem(id, {
                        _status: "invalid",
                        _errorMsg: errors,
                     });
                     $dt.unblockEvent();

                     this.validationError = true;
                  },
                  onValidationSuccess: (id, obj, details) => {
                     // console.log(`item ${id} valid`);
                     const $dt = $$(ids.datatable);

                     $dt.blockEvent();
                     $dt.updateItem(id, {
                        _status: "valid",
                        _errorMsg: "",
                     });
                     $dt.unblockEvent();
                     this.validationError = false;
                  },
                  onCheck: () => {
                     const selected = $$(ids.datatable).find({
                        _included: true,
                     });
                     const $importButton = $$(ids.importButton);

                     $importButton.setValue(this.labelImport(selected));

                     if (this.overLimitAlert(selected)) $importButton.disable();
                     else $importButton.enable();
                  },
               },
            },
            {
               id: ids.progressBar,
               height: 6,
            },
            {
               view: "button",
               name: "import",
               id: ids.importButton,
               value: this.label("Import"),
               css: "webix_primary",
               disabled: true,
               click: () => {
                  this.import();
               },
            },
         ],
      };
   }

   uiPopup() {
      const ids = this.ids;

      return {
         id: ids.popup,
         view: "window",
         hidden: true,
         position: "center",
         modal: true,
         resize: true,
         head: {
            view: "toolbar",
            css: "webix_dark",
            cols: [
               {},
               {
                  view: "label",
                  label: this.label("CSV Importer"),
                  autowidth: true,
               },
               {},
               {
                  view: "button",
                  width: 35,
                  css: "webix_transparent",
                  type: "icon",
                  icon: "nomargin fa fa-times",
                  click: () => {
                     this.hide();
                  },
               },
            ],
         },
         body: {
            type: "form",
            rows: [
               {
                  type: "line",
                  cols: [
                     this.uiConfig(),
                     { width: 20 },
                     this.uiRecordsView(),
                     { width: 1 },
                  ],
               },
               {
                  id: ids.statusMessage,
                  view: "label",
                  align: "right",
                  hidden: true,
               },
               {
                  hidden: true,
                  margin: 5,
                  cols: [
                     { fillspace: true },
                     {
                        view: "button",
                        name: "cancel",
                        value: this.label("Cancel"),
                        css: "ab-cancel-button",
                        autowidth: true,
                        click: () => {
                           this.hide();
                        },
                     },
                     /*,
                        {
                           view: "button",
                           name: "import",
                           id: ids.importButton,
                           value: labels.component.import,
                           css: "webix_primary",
                           disabled: true,
                           autowidth: true,
                           type: "form",
                           click: () => {
                              _logic.import();
                           }
                        }*/
                  ],
               },
            ],
         },
      };
   }

   async init(AB) {
      await super.init(AB);

      const ids = this.ids;

      // Populate values to rules

      const dc = this.datacollection;

      if (dc) this.objectLoad(dc.datasource);

      const abWebix = AB.Webix;

      abWebix.ui(this.uiPopup());

      const $form = $$(ids.form);

      if ($form) abWebix.extend($form, abWebix.ProgressBar);

      const $progressBar = $$(ids.progressBar);

      if ($progressBar) abWebix.extend($progressBar, abWebix.ProgressBar);
   }

   showPopup() {
      const ids = this.ids;

      $$(ids.popup)?.show();

      this.formClear();

      // open file dialog to upload
      $$(ids.uploader).fileDialog();
   }

   hide() {
      $$(this.ids.popup)?.hide();
   }

   formClear() {
      const ids = this.ids;

      this._dataRows = null;
      this._csvFileInfo = null;

      const $form = $$(ids.form);

      $form.clearValidation();
      $form.clear();

      $$(ids.separatedBy).setValue(",");

      this.AB.Webix.ui([], $$(ids.columnList));

      $$(ids.headerOnFirstLine).disable();
      $$(ids.importButton).disable();

      $$(ids.search).setValue("");
      $$(ids.uploadFileList).clearAll();
      $$(ids.datatable).clearAll();

      const $statusMessage = $$(ids.statusMessage);

      $statusMessage.setValue("");
      $statusMessage.hide();
   }

   search(searchText) {
      const $datatable = $$(this.ids.datatable);

      if (!$datatable) return;

      searchText = (searchText || "").toLowerCase();

      const matchFields = this.getMatchFields();

      $datatable.filter((row) => {
         let exists = false;

         (matchFields || []).forEach((f) => {
            if (exists) return;

            exists =
               (row[`${f.columnIndex}`] || "")
                  .toString()
                  .toLowerCase()
                  .indexOf(searchText) > -1;
         });

         return exists;
      });
   }

   statusTemplate(item) {
      let template = "";

      if (!item) return template;

      switch (item._status) {
         case "in-progress":
            template = "<span class='fa fa-refresh'></span>";
            break;
         case "invalid":
            template = "<span class='fa fa-exclamation-triangle'></span>";
            break;
         case "valid":
            template = "<span class='fa fa-check'></span>";
            break;
         case "done":
            template = "<span class='fa fa-check'></span>";
            break;
         case "fail":
            template = "<span class='fa fa-remove'></span>";
            break;
      }

      return template;
   }

   async loadCsvFile() {
      const _csvFileInfo = this._csvFileInfo;

      if (!_csvFileInfo) return false;

      const csvImporter = this.csvImporter;

      if (!csvImporter.validateFile(_csvFileInfo)) {
         this.AB.Webix.alert({
            title: this.label("This file extension is not allowed"),
            text: this.label("Please only upload CSV files"),
            ok: this.label("Ok"),
         });

         return false;
      }

      const ids = this.ids;

      // show loading cursor
      const $form = $$(ids.form);

      $form?.showProgress?.({ type: "icon" });

      // read CSV file
      const $headerOnFirstLine = $$(ids.headerOnFirstLine);
      const $importButton = $$(ids.importButton);

      $headerOnFirstLine.enable();
      $importButton.enable();

      this._dataRows = await csvImporter.getDataRows(
         _csvFileInfo,
         $$(ids.separatedBy).getValue()
      );

      const _dataRows = this._dataRows;

      let length = _dataRows.length;

      if ($headerOnFirstLine.getValue()) length = _dataRows.length - 1;

      $importButton.setValue(this.labelImport(length));
      this.populateColumnList();
      $form?.hideProgress?.();

      return true;
   }

   removeCsvFile(fileId) {
      $$(this.ids.uploadFileList).remove(fileId);
      this.formClear();

      return true;
   }

   populateColumnList() {
      const self = this;
      const ids = this.ids;
      const abWebix = this.AB.Webix;

      // clear list
      const $columnList = $$(ids.columnList);

      abWebix.ui([], $columnList);

      const _dataRows = this._dataRows;

      if (!_dataRows) return;

      // check first line of CSV
      const firstLine = _dataRows[0];

      if (!firstLine) return;

      const csvColumnList = [];
      const fieldList = [];
      const currentObject = this.CurrentObject;

      if (currentObject)
         fieldList.push(
            ...currentObject.fields((f) => {
               // available fields
               if (
                  this.settings.availableFieldIds?.length &&
                  this.settings.availableFieldIds.indexOf(f.id) < 0
               ) {
                  return false;
               }

               // filter editable fields
               const formComp = f.formComponent();

               if (!formComp) return true;

               const formConfig = formComp.common();

               if (!formConfig) return true;

               return formConfig.key != "fieldreadonly";
            })
         );

      const csvImporter = this.csvImporter;

      // check first line be header columns
      if ($$(ids.headerOnFirstLine).getValue())
         csvColumnList.push(
            ...firstLine.map((colName, index) => {
               return {
                  id: index + 1, // webix .options list disallow value 0
                  value: colName,
                  key: csvImporter.getGuessDataType(_dataRows, index),
               };
            })
         );
      else
         firstLine.forEach((e, i) => {
            csvColumnList.push({
               id: i + 1, // webix .options list disallow value 0
               value: this.label("Column {0}", [i + 1]),
               key: csvImporter.getGuessDataType(_dataRows, i),
            });
         });

      // Add unselect item
      csvColumnList.unshift({
         id: "none",
         value: this.label("None"),
      });

      // populate columns to UI
      const uiColumns = [];
      const selectedCsvCols = [];

      fieldList.forEach((f) => {
         // match up by data type
         const matchCol = csvColumnList.filter(
            (c) => c.key == f.key && selectedCsvCols.indexOf(c.id) < 0
         )[0];

         let selectVal = "none";

         if (matchCol) {
            selectVal = matchCol.id;

            // cache
            selectedCsvCols.push(selectVal);
         }

         let columnOptUI = {
            view: "richselect",
            gravity: 2,
            options: csvColumnList,
            fieldId: f.id,
            abName: "columnIndex",
            value: selectVal,
            on: {
               onChange: function () {
                  self.toggleLinkFields(this);
                  self.loadDataToGrid();
               },
            },
         };

         // Add date format options
         if (f.key === "date") {
            const dateSeparatorOptions = ["/", "-", ".", ",", " "];
            const dayFormatOptions = [
               { value: this.label("1 to 31"), id: "D" },
               { value: this.label("01 to 31"), id: "DD" },
            ];
            const monthFormatOptions = [
               { value: this.label("1 to 12"), id: "M" },
               { value: this.label("01 to 12"), id: "MM" },
            ];
            const yearFormatOptions = [
               { value: this.label("00 to 99"), id: "YY" },
               { value: this.label("2000 to 2099"), id: "YYYY" },
            ];
            const dateOrderOptions = [
               {
                  value: this.label("D-M-Y"),
                  id: 1,
               },
               {
                  value: this.label("M-D-Y"),
                  id: 2,
               },
               {
                  value: this.label("Y-M-D"),
                  id: 3,
               },
               {
                  value: this.label("Y-D-M"),
                  id: 4,
               },
            ];

            columnOptUI = {
               gravity: 2,
               rows: [
                  columnOptUI,
                  {
                     view: "richselect",
                     label: this.label("Separator"),
                     labelWidth: 100,
                     on: {
                        onChange: () => {
                           this.loadDataToGrid();
                        },
                     },
                     name: "separator",
                     abName: "columnDateFormat",
                     options: dateSeparatorOptions,
                     value: "/",
                  },
                  {
                     view: "richselect",
                     label: this.label("Day"),
                     labelWidth: 100,
                     on: {
                        onChange: () => {
                           this.loadDataToGrid();
                        },
                     },
                     name: "day",
                     abName: "columnDateFormat",
                     options: dayFormatOptions,
                     value: "D",
                  },
                  {
                     view: "richselect",
                     label: this.label("Month"),
                     labelWidth: 100,
                     on: {
                        onChange: () => {
                           this.loadDataToGrid();
                        },
                     },
                     name: "month",
                     abName: "columnDateFormat",
                     options: monthFormatOptions,
                     value: "M",
                  },
                  {
                     view: "richselect",
                     label: this.label("Year"),
                     labelWidth: 100,
                     on: {
                        onChange: () => {
                           this.loadDataToGrid();
                        },
                     },
                     name: "year",
                     abName: "columnDateFormat",
                     options: yearFormatOptions,
                     value: "YY",
                  },
                  {
                     view: "richselect",
                     label: this.label("Order"),
                     labelWidth: 100,
                     on: {
                        onChange: () => {
                           this.loadDataToGrid();
                        },
                     },
                     name: "order",
                     abName: "columnDateFormat",
                     options: dateOrderOptions,
                     value: 1,
                  },
               ],
            };
         }

         // Add connected field options
         if (f.isConnection) {
            let linkFieldOptions = [];

            if (f.datasourceLink) {
               linkFieldOptions = f.datasourceLink
                  .fields((fld) => !fld.isConnection)
                  .map((fld) => {
                     return {
                        id: fld.id,
                        value: fld.label,
                     };
                  });
            }

            columnOptUI = {
               gravity: 2,
               rows: [
                  columnOptUI,
                  {
                     view: "richselect",
                     label: "=",
                     labelWidth: 20,
                     abName: "columnLinkData",
                     hidden: true,
                     options: linkFieldOptions,
                     value: linkFieldOptions[0] ? linkFieldOptions[0].id : null,
                  },
               ],
            };
         }

         uiColumns.push({
            view: "layout",
            borderless: true,
            cols: [
               {
                  view: "template",
                  gravity: 1,
                  borderless: true,
                  css: { "padding-top": 10 },
                  template: `<span class="fa fa-${f.icon}"></span> ${f.label}`,
               },
               columnOptUI,
            ],
         });
      });
      abWebix.ui(uiColumns, $columnList);

      this.loadDataToGrid();
   }

   toggleLinkFields($columnOption) {
      if (!$columnOption) return;

      const $optionPanel = $columnOption.getParentView();
      const $linkFieldOption = $optionPanel.queryView(
         { abName: "columnLinkData" },
         "all"
      )[0];

      if (!$linkFieldOption) return;

      if ($columnOption.getValue() === "none") $linkFieldOption.hide();
      else $linkFieldOption.show();
   }

   overLimitAlert(data) {
      const limit = 1000;

      if (data.length > limit) {
         // we only allow 1000 record imports
         this.AB.Webix.alert({
            title: this.label("Too many records"),
            ok: this.label("Ok"),
            text: this.label(
               "Due to browser limitations we only allow imports of {0} records. Please upload a new CSV or deselect records to import.",
               [limit]
            ),
         });

         return true;
      }

      return false;
   }

   loadDataToGrid() {
      const ids = this.ids;
      const $datatable = $$(ids.datatable);
      const ab = this.AB;

      if (!$datatable) return;

      $datatable.clearAll();

      // show loading cursor
      $datatable.showProgress?.({ type: "icon" });

      /** Prepare Columns */
      const matchFields = this.getMatchFields();
      const columns = [];

      // add "status" column
      columns.push({
         id: "_status",
         header: "",
         template: this.statusTemplate,
         width: 30,
      });

      // add "checkbox" column
      columns.push({
         id: "_included",
         header: { content: "masterCheckbox" },
         template: "{common.checkbox()}",
         width: 30,
      });

      const fieldValidations = [];
      const rulePops = [];

      // populate columns
      (matchFields || []).forEach((f) => {
         let validationRules = f.field.settings.validationRules;
         // parse the rules because they were stored as a string
         // check if rules are still a string...if so lets parse them
         if (validationRules && typeof validationRules === "string")
            validationRules = JSON.parse(validationRules);

         if (validationRules?.length) {
            const validationUI = [];

            // there could be more than one so lets loop through and build the UI
            validationRules.forEach((rule) => {
               const Filter = ab.filterComplexNew(
                  `${f.field.id}_${ab.Webix.uid()}`
               );
               // add the new ui to an array so we can add them all at the same time
               validationUI.push(Filter.ui);
               // store the filter's info so we can assign values and settings after the ui is rendered
               fieldValidations.push({
                  filter: Filter,
                  view: Filter.ids.querybuilder,
                  columnName: f.field.id,
                  validationRules: rule.rules,
                  invalidMessage: rule.invalidMessage,
                  columnIndex: f.columnIndex,
               });
            });

            // create a unique view id for popup
            const popUpId = `${ids.rules}_${f.field.id}_${ab.Webix.uid()}`;

            // store the popup ids so we can remove the later
            rulePops.push(popUpId);
            // add the popup to the UI but don't show it
            ab.Webix.ui({
               view: "popup",
               css: "ab-rules-popup",
               id: popUpId,
               body: {
                  rows: validationUI,
               },
            });
         }

         const editor = f.field?.key == "number" ? "number" : "text";

         columns.push({
            id: f.columnIndex,
            header: f.field.label,
            editor: editor,
            template: (obj, common, value /*, col, ind */) =>
               value.replace(/[<]/g, "&lt;"),
            minWidth: 150,
            fillspace: true,
         });
      });

      if (fieldValidations.length) {
         // we need to store the rules for use later so lets build a container array
         const complexValidations = [];

         fieldValidations.forEach((f) => {
            // init each ui to have the properties (app and fields) of the object we are editing
            // f.filter.applicationLoad(App);
            f.filter.fieldsLoad(this.CurrentObject.fields());
            // now we can set the value because the fields are properly initialized
            f.filter.setValue(f.validationRules);
            // if there are validation rules present we need to store them in a lookup hash
            // so multiple rules can be stored on a single field
            if (!Array.isArray(complexValidations[f.columnName]))
               complexValidations[f.columnName] = [];

            // now we can push the rules into the hash
            complexValidations[f.columnName].push({
               filters: $$(f.view).getFilterHelper(),
               values: $datatable.getSelectedItem(),
               invalidMessage: f.invalidMessage,
               columnIndex: f.columnIndex,
            });
         });

         const rules = {};

         // store the rules in a data param to be used later
         $datatable.$view.complexValidations = complexValidations;

         // use the lookup to build the validation rules
         Object.keys(complexValidations).forEach((key) => {
            rules[key] = (value, data) => {
               // default valid is true
               let isValid = true;

               $datatable.$view.complexValidations[key].forEach((filter) => {
                  const rowValue = {};
                  // use helper funtion to check if valid
                  // map the column names to the index numbers of data
                  // reformat data to display

                  (matchFields || []).forEach((f) => {
                     const record = data[f.columnIndex];

                     if (
                        f.field.key === "date" &&
                        record.includes("Invalid date")
                     )
                        isValid = false;

                     rowValue[f.field.id] = record;
                  });

                  const ruleValid = filter.filters(rowValue);

                  // if invalid we need to tell the field
                  if (!ruleValid) {
                     isValid = false;
                     // this.AB.Webix.message({
                     //    type: "error",
                     //    text: invalidMessage
                     // });
                  }
               });

               return isValid;
            };
         });
         // define validation rules
         $datatable.define("rules", rules);
         // store the array of view ids on the webix object so we can get it later
         $datatable.config.rulePops = rulePops;
         $datatable.refresh();
      } else {
         // check if the previous datatable had rule popups and remove them
         if ($datatable.config.rulePops) {
            $datatable.config.rulePops.forEach((popup) => {
               const $popup = $$(popup);

               if (!$popup) return;

               $popup.destructor();
            });
         }

         // remove any validation rules from the previous table
         $datatable.define("rules", {});
         $datatable.refresh();
      }

      /** Prepare Data */
      const parsedData = [];

      (this._dataRows || []).forEach((row, index) => {
         const rowValue = {
            id: index + 1,
         };

         // reformat data to display
         (matchFields || []).forEach((f) => {
            const data = row[f.columnIndex - 1];

            if (f.field.key === "date") {
               // let dateFormat = moment(data, f.format).format(
               //    "YYYY-MM-DD"
               // );
               // debugger;
               let dateFormat = ab.rules.toDate(data, {
                  format: f.format,
               });
               dateFormat = ab.rules.toDateFormat(dateFormat, {
                  format: "YYYY-MM-DD",
               });

               if (dateFormat === "Invalid date")
                  dateFormat = dateFormat + " - " + data;

               rowValue[f.columnIndex] = dateFormat;
            } else rowValue[f.columnIndex] = data; // array to object
         });

         // insert "true" value of checkbox
         rowValue["_included"] = true;

         parsedData.push(rowValue);
      });

      // skip the first line
      const isSkipFirstLine = $$(ids.headerOnFirstLine).getValue();

      if (isSkipFirstLine && parsedData.length > 1) parsedData.shift();

      const $importButton = $$(ids.importButton);

      $importButton.setValue(this.labelImport(parsedData));
      $datatable.refreshColumns(columns);
      $datatable.parse(parsedData);

      if (this.overLimitAlert(parsedData)) $importButton.disable();
      else $importButton.enable();

      // hide loading cursor
      $datatable.hideProgress?.();
   }

   refreshRemainingTimeText(startUpdateTime, total, index) {
      const ids = this.ids;

      // Calculate remaining time
      const spentTime = new Date() - startUpdateTime; // milliseconds that has passed since last completed record since start

      const averageRenderTime = spentTime / index; // average milliseconds per single render at this point

      const remainTime = averageRenderTime * (total - index);

      let result = "";

      // Convert milliseconds to a readable string
      const days = (remainTime / 86400000).toFixed(0);
      const hours = (remainTime / 3600000).toFixed(0);
      const minutes = (remainTime / 60000).toFixed(0);
      const seconds = (remainTime / 1000).toFixed(0);

      if (seconds < 1) result = "";
      else if (seconds < 60)
         result = this.label("Approximately {0} second(s) remaining", [
            seconds,
         ]);
      // result = `Approximately ${seconds} second${
      //    seconds > 1 ? "s" : ""
      // }`;
      else if (minutes == 1)
         result = this.label("Approximately 1 minute {0} seconds remaining", [
            seconds - 60,
         ]);
      // result = `Approximately 1 minute ${seconds - 60} seconds`;
      else if (minutes < 60)
         result = this.label("Approximately {0} minutes remaining", [minutes]);
      else if (hours < 24)
         result = this.label("Approximately {0} hour(s) remaining", [hours]);
      else result = this.label("Approximately {0} day(s) remaining", [days]);

      if (result) {
         $$(ids.importButton)?.setValue(result);
      } else {
         const selected = $$(ids.datatable)?.find({ _included: true });
         $$(ids.importButton)?.setValue(this.labelImport(selected));
      }
   }

   /**
    * @method getMatchFields
    *
    * @return {Object} - [
    *                      {
    *                         columnIndex: {number},
    *                         field: {ABField},
    *                         searchField: {ABField} [optional]
    *                      },
    *                      ...
    *                    ]
    */
   getMatchFields() {
      const result = [];
      const ids = this.ids;

      // get richselect components
      const $selectorViews = $$(ids.columnList)
         .queryView({ abName: "columnIndex" }, "all")
         .filter((selector) => selector.getValue() != "none");

      ($selectorViews || []).forEach(($selector) => {
         const currentObject = this.CurrentObject;

         if (!currentObject) return;

         // webix .options list disallow value 0
         const field = currentObject.fieldByID($selector.config.fieldId);

         if (!field) return;

         const colIndex = $selector.getValue();
         const fieldData = {
            columnIndex: colIndex,
            field: field,
         };

         if (field.key === "date") {
            const $optionPanel = $selector.getParentView();
            const $dateFormatSelectors = $optionPanel.queryView(
               { abName: "columnDateFormat" },
               "all"
            );

            // define the column to compare data to search .id
            if ($dateFormatSelectors) {
               $dateFormatSelectors.forEach((selector) => {
                  fieldData[selector.config.name] = selector.getValue();
               });

               // convert all dates into mysql date format YYYY-DD-MM
               let format;

               switch (fieldData.order) {
                  case "1":
                     format =
                        fieldData.day +
                        fieldData.separator +
                        fieldData.month +
                        fieldData.separator +
                        fieldData.year;
                     break;
                  case "2":
                     format =
                        fieldData.month +
                        fieldData.separator +
                        fieldData.day +
                        fieldData.separator +
                        fieldData.year;
                     break;
                  case "3":
                     format =
                        fieldData.year +
                        fieldData.separator +
                        fieldData.month +
                        fieldData.separator +
                        fieldData.day;
                     break;
                  case "4":
                     format =
                        fieldData.year +
                        fieldData.separator +
                        fieldData.day +
                        fieldData.separator +
                        fieldData.month;
               }

               fieldData.format = format;
            }
         }

         if (field.isConnection) {
            const $optionPanel = $selector.getParentView();
            const $linkDataSelector = $optionPanel.queryView(
               { abName: "columnLinkData" },
               "all"
            )[0];

            // define the column to compare data to search .id
            if ($linkDataSelector) {
               const searchField = field.datasourceLink.fieldByID(
                  $linkDataSelector.getValue()
               );

               fieldData.searchField = searchField;
            }
         }

         result.push(fieldData);
      });

      return result;
   }

   labelImport(selected) {
      let length = selected;

      if (Array.isArray(selected)) length = selected.length;

      return this.label("Import {0} Records", [length]);
   }

   /**
    * @method import
    *
    * @return {Promise}
    */
   async import() {
      // get ABDatacollection
      const dc = this.datacollection;
      // if (dv == null) return Promise.resolve();

      // // get ABObject
      // let obj = dv.datasource;

      // Make sure we are connected to an Object
      const currentObject = this.CurrentObject;

      if (!currentObject) return;

      // get ABModel
      // let model = dv.model;
      // if (model == null) return Promise.resolve();

      const ids = this.ids;
      const $importButton = $$(ids.importButton);

      $importButton.disable();

      // Show loading cursor
      const $form = $$(ids.form);
      const $progressBar = $$(ids.progressBar);

      $form.showProgress({ type: "icon" });
      $progressBar.showProgress({
         type: "top",
         position: 0.0001,
      });

      // get richselect components
      const matchFields = this.getMatchFields();

      // Get object's model
      const objModel = currentObject.model();
      const $datatable = $$(ids.datatable);
      const selectedRows = $datatable.find({ _included: true });

      let _currProgress = 0;

      const increaseProgressing = () => {
         _currProgress += 1;
         $progressBar.showProgress({
            type: "bottom",
            position: _currProgress / selectedRows.length,
         });
      };
      const itemFailed = (itemId, errMessage) => {
         if ($datatable) {
            // set "fail" status
            $datatable.addRowCss(itemId, "row-fail");
            $datatable.blockEvent();
            $datatable.updateItem(itemId, {
               _status: "fail",
               _errorMsg: errMessage,
            });
            $datatable.unblockEvent();
         }

         increaseProgressing();

         console.error(errMessage);
      };
      const abWebix = this.AB.Webix;
      const itemInvalid = (itemId, errors = []) => {
         if ($datatable) {
            // combine all error messages to display in tooltip
            const errorMsg = [];
            // mark which column are invalid
            errors.forEach((err) => {
               if (!err?.name) return;

               const fieldInfo = matchFields.filter(
                  (f) => f.field && f.field.columnName == err.name
               )[0];

               errorMsg.push(err.name + ": " + err.message);
               // we also need to define an error message
               // abWebix.message({
               //    type: "error",
               //    text: err.name + ": " + err.message
               // });
            });

            // set "fail" status
            $datatable.blockEvent();
            $datatable.updateItem(itemId, {
               _status: "invalid",
               _errorMsg: errorMsg.join("</br>"),
            });
            $datatable.unblockEvent();
            $datatable.addRowCss(itemId, "webix_invalid");
         }
         // increaseProgressing();
      };
      const itemPass = (itemId) => {
         if ($datatable) {
            // set "done" status
            $datatable.removeRowCss(itemId, "row-fail");
            $datatable.addRowCss(itemId, "row-pass");
            $datatable.blockEvent();
            $datatable.updateItem(itemId, {
               _status: "done",
               _errorMsg: "",
            });
            $datatable.unblockEvent();
         }

         increaseProgressing();
      };
      const itemValid = (itemId) => {
         if ($datatable) {
            // mark all columns valid (just in case they were invalid before)
            // matchFields.forEach((f) => {
            //    $datatable.removeCellCss(
            //       itemId,
            //       f.columnIndex,
            //       "webix_invalid_cell"
            //    );
            // });
            // highlight the row
            $datatable.removeRowCss(itemId, "webix_invalid");
            $datatable.blockEvent();
            $datatable.updateItem(itemId, {
               _status: "",
               _errorMsg: "",
            });
            $datatable.unblockEvent();
            // $datatable.addRowCss(itemId, "row-pass");
         }
      };
      const $statusMessage = $$(ids.statusMessage);
      const uiCleanUp = () => {
         // To Do anyUI updates
         // console.log("ui clean up now");
         $importButton.enable();

         // Hide loading cursor
         $form.hideProgress();
         $progressBar.hideProgress();

         $statusMessage.setValue("");
         $statusMessage.hide();

         const selected = $datatable.find({ _included: true });

         $importButton.setValue(this.labelImport(selected));
         this.emit("done");
      };

      // Set parent's data collection cursor
      const dcLink = dc?.datacollectionLink;
      const linkConnectFields = [];

      let objectLink;
      let linkValues;

      if (dcLink?.getCursor()) {
         objectLink = dcLink.datasource;

         linkConnectFields.push(
            ...currentObject.fields(
               (f) => f.isConnection && f.settings.linkObject === objectLink.id
            )
         );

         linkValues = dcLink.getCursor();
      }

      const validRows = [];

      let allValid = true;

      // Pre Check Validations of whole CSV import
      // update row to green if valid
      // update row to red if !valid
      (selectedRows || []).forEach((data, index) => {
         const newRowData = {};

         // Set parent's data collection cursor
         if (objectLink && linkConnectFields.length && linkValues) {
            linkConnectFields.forEach((f) => {
               const linkColName = f.indexField
                  ? f.indexField.columnName
                  : objectLink.PK();

               newRowData[f.columnName] = {};
               newRowData[f.columnName][linkColName] =
                  linkValues[linkColName] || linkValues.id;
            });
         }

         matchFields.forEach((f) => {
            if (!f.field?.key) return;

            switch (f.field.key) {
               // case "connectObject":
               //    // skip
               //    break;
               case "number":
                  if (typeof data[f.columnIndex] !== "number") {
                     newRowData[f.field.columnName] = (
                        data[f.columnIndex] || ""
                     ).replace(/[^-0-9.]/gi, "");

                     break;
                  }

                  newRowData[f.field.columnName] = data[f.columnIndex];

                  break;

               default:
                  newRowData[f.field.columnName] = data[f.columnIndex];

                  break;
            }
         });

         let isValid = false;
         let errorMsg = "";

         // first check legacy and server side validation
         const validator = currentObject.isValidData(newRowData);

         isValid = validator.pass();
         errorMsg = validator.errors;

         if (isValid)
            // now check complex field validation rules
            isValid = $datatable.validate(data.id);
         else {
            allValid = false;

            itemInvalid(data.id, errorMsg);
         }

         if (isValid) {
            itemValid(data.id);
            validRows.push({ id: data.id, data: newRowData });
         } else allValid = false;

         // $datatable.unblockEvent();
      });

      if (!allValid) {
         // To Do anyUI updates
         // $importButton.enable();
         //
         // // Hide loading cursor
         // $form.hideProgress();
         // $progressBar.hideProgress();
         // $statusMessage.setValue("");
         // $statusMessage.hide();
         //
         // // _logic.hide();
         //
         // if (_logic.callbacks && _logic.callbacks.onDone)
         //    _logic.callbacks.onDone();
         uiCleanUp();

         abWebix.alert({
            title: this.label("Invalid Data"),
            ok: this.label("Ok"),
            text: this.label(
               "The highlighted row has invalid data. Please edit in the window or update the CSV and try again."
            ),
         });

         return;
      }

      // if pass, then continue to process each row
      // ?? : can we process in Parallel?
      // ?? : implement hash Lookups for connected Fields
      const hashLookups = {};
      // {obj}  /*  { connectField.id : { 'searchWord' : "uuid"}}
      // use this hash to reduce the # of lookups needed to fill in our
      // connected entries

      const connectedFields = matchFields.filter(
         (f) => f && f.field?.isConnection && f.searchField
      );

      let startUpdateTime;
      let numDone = 0;

      try {
         // forEach connectedFields in csv
         const allLookups = [];

         (connectedFields || []).forEach((f) => {
            const connectField = f.field;
            // const searchWord = newRowData[f.columnIndex];
            const connectObject = connectField.datasourceLink;

            if (!connectObject) return;

            const connectModel = connectObject.model();

            if (!connectModel) return;

            const linkIdKey = connectField.indexField
               ? connectField.indexField.columnName
               : connectField.object.PK();

            // prepare default hash entry:
            hashLookups[connectField.id] = {};

            // load all values of connectedField entries
            const gethashLookup = async () => {
               try {
                  const list = await connectModel.findAll({
                     where: {}, // !!!
                     populate: false,
                  });
                  const data = list.data || list;

                  (data || []).forEach((row) => {
                     // store in hash[field.id] = { 'searchKey' : "uuid" }

                     hashLookups[connectField.id][
                        row[f.searchField.columnName]
                     ] = row[linkIdKey];
                  });
               } catch (err) {
                  console.error(err);
               }
            };

            allLookups.push(gethashLookup());
         });

         await Promise.all(allLookups);

         // forEach validRow
         validRows.forEach((data) => {
            const newRowData = data.data;

            // update the datagrid row to in-progress
            $datatable.blockEvent();
            $datatable.updateItem(data.id, {
               _status: "in-progress",
               _errorMsg: "",
            });
            $datatable.unblockEvent();

            // forEach ConnectedField
            (connectedFields || []).forEach((f) => {
               // find newRowData[field.columnName] = { field.PK : hash[field.id][searchWord] }
               const connectField = f.field;
               const linkIdKey = connectField.indexField
                  ? connectField.indexField.columnName
                  : connectField.object.PK();
               const uuid =
                  hashLookups[connectField.id][
                     newRowData[connectField.columnName]
                  ];

               if (!uuid) {
                  itemInvalid(data.id, [{ name: connectField.columnName }]);
                  allValid = false;
               }

               newRowData[connectField.columnName] = {};
               newRowData[connectField.columnName][linkIdKey] = uuid;
            });
         });

         if (!allValid) {
            abWebix.alert({
               title: this.label("Invalid Data"),
               ok: this.label("Ok"),
               text: this.label(
                  "The highlighted row has invalid data. Please edit in the window or update the CSV and try again."
               ),
            });
            uiCleanUp();

            return;
         }

         // NOTE: Parallel exectuion of all these:
         const allSaves = [];
         const createRecord = (objModel, newRowsData, element, total) =>
            new Promise((resolve, reject) => {
               element.doRecordRulesPre(newRowsData);

               const processResult = async () => {
                  try {
                     const result = await objModel.batchCreate({
                        batch: newRowsData,
                     });
                     const resultErrors = result.errors;

                     // Show errors of each row
                     Object.keys(resultErrors).forEach((rowIndex) => {
                        const error = resultErrors[rowIndex];

                        if (error) {
                           itemFailed(
                              rowIndex,
                              error.message || error.sqlMessage || error
                           );
                        }
                     });

                     const resultData = result.data;
                     const penddingRecordRules = [];

                     Object.keys(resultData).forEach((rowIndex) => {
                        penddingRecordRules.push(
                           new Promise((resolve, reject) => {
                              // Process Record Rule
                              const processRowData = async () => {
                                 try {
                                    await element.doRecordRules(
                                       resultData[rowIndex]
                                    );

                                    itemPass(rowIndex);
                                    resolve();
                                 } catch (err) {
                                    itemFailed(rowIndex, err);
                                    reject("that didn't work");
                                 }
                              };

                              processRowData();
                           })
                        );
                     });

                     const waitPenddingRecordRules = async () => {
                        try {
                           await Promise.all(penddingRecordRules);

                           newRowsData.forEach((row) => {
                              // itemPass(row.id);
                              numDone++;
                              if (numDone % 50 == 0) {
                                 this.refreshRemainingTimeText(
                                    startUpdateTime,
                                    validRows.length,
                                    numDone
                                 );
                              }
                           });

                           if (numDone === total) {
                              uiCleanUp();
                              $importButton.disable();
                           }

                           resolve();
                        } catch (err) {
                           // newRowsData.forEach((row) => {
                           //    itemFailed(row.id, err);
                           // });
                           // throw err;
                           reject(err);
                        }
                     };

                     await waitPenddingRecordRules();
                  } catch (err) {
                     console.error(err);
                     reject(err);
                  }
               };

               processResult();
            });

         validRows.forEach((data) => {
            allSaves.push({ id: data.id, data: data.data });
         });

         // we are going to store these promises in an array of
         // arrays with 50 in each sub array
         const throttledSaves = [];
         const total = allSaves.length;

         let index = 0;

         while (allSaves.length) {
            throttledSaves[index] = allSaves.splice(0, 50);

            index++;
         }

         // execute the array of array of 100 promises one at at time
         const performThrottledSaves = (
            currentRecords,
            remainingRecords,
            importer,
            total
         ) =>
            new Promise((resolve, reject) => {
               // execute the next 100
               // const requests = currentRecords.map((data) => {
               //    return createRecord(
               //       objModel,
               //       data.record,
               //       data.data,
               //       importer
               //    );
               // });

               const processRequest = async () => {
                  try {
                     await createRecord(
                        objModel,
                        currentRecords,
                        importer,
                        total
                     );

                     // when done get the next 10
                     const nextRecords = remainingRecords.shift();

                     // if there are any remaining in the group call performThrottledSaves
                     if (nextRecords?.length) {
                        await performThrottledSaves(
                           nextRecords,
                           remainingRecords,
                           importer,
                           total
                        );
                     } else {
                        // uiCleanUp();
                        resolve();
                     }
                  } catch (err) {
                     // Handle errors here
                     reject(err);
                  }
               };

               processRequest();
            });

         // now we are going to processes these new containers one at a time
         // $datatable.blockEvent();
         // this is when the real work starts so lets begin our countdown timer now
         startUpdateTime = new Date();
         // get the first group of Promises out of the collection
         const next = throttledSaves.shift();

         // execute our Promise iterator
         await performThrottledSaves(next, throttledSaves, this.view, total);
      } catch (err) {
         // resolve Error UI
         abWebix.alert({
            title: this.label("Error Creating Records"),
            ok: this.label("Ok"),
            text: this.label("One or more records failed upon creation."),
         });
         // $datatable.unblockEvent();
         uiCleanUp();
         console.error(err);
      }
   }
};
