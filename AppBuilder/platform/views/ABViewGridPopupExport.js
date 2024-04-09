/*
 * ABViewGridPopupExport.js
 * Manage the Popup that allows you to export data into one of our supported
 * formats.
 */

import ClassUI from "../../../ui/ClassUI";

export default class ABWorkObjectPopupExport extends ClassUI {
   constructor(idBase) {
      idBase = idBase || "abviewgridpopupExport";

      super({
         popupExport: `${idBase}_popupExport`,
         list: `${idBase}_popupExport_list`,
      });

      this._currentObject = null;
      // {ABObject}
      // The ABObject of the data we will export.  We can find out the fields
      // from the object.

      this._dataCollection = null;
      // {ABDatacCollection}
      // The ABDataCollection that contains the data we are going to export.

      this._grid = null;
      // {webix.grid}
      // the current webix.grid that contains the data we are going to export.

      this._filename = null;
      // {string}
      // the name of the desired output file.

      this._hiddenFields = [];
      // {array}
      // An array of ABField.columnName(s) that we are not wanting to export
   }

   ui() {
      var self = this;

      // webix UI definition:
      return {
         view: "popup",
         id: this.ids.popupExport,
         width: 160,
         height: 0, //150,
         select: false,
         hidden: true,
         body: {
            id: this.ids.list,
            view: "list",
            autoheight: true,
            data: [
               { name: "CSV", icon: "file-excel-o" },
               { name: "Excel", icon: "file-excel-o" },
               { name: "PDF", icon: "file-pdf-o" },
               { name: "PNG", icon: "file-image-o" },
            ],
            template:
               "<div><i class='fa fa-#icon# webix_icon_btn' aria-hidden='true'></i> #name#</div>",
            on: {
               onItemClick: function (id /*, e, node */) {
                  var component = this.getItem(id);
                  self.export(component.name);
               },
            },
         },
      };
   }

   async init(AB) {
      if (AB) {
         this.AB = AB;
      }
      webix.ui(this.ui());
      $$(this.ids.popupExport).resize();
   }

   // internal business logic

   /**
    * @method dataCollectionLoad()
    * the current ABDataCollection we are working with.
    * @param {ABDataCollection} dc
    */
   dataCollectionLoad(dc) {
      this._dataCollection = dc;
   }

   /**
    * @method objectLoad()
    * The current ABObject we are working with.
    * @param {ABObject} object
    */
   objectLoad(object) {
      this._currentObject = object;
   }

   /**
    * @method setHiddenFields
    * Register Fields we don't want exported in our data.
    * @param {array} fields
    *        An array of ABField.columnName(s) to exclude from our export.
    */
   setHiddenFields(fields = []) {
      this._hiddenFields = fields ?? [];
   }

   /**
    * @method setFilename()
    * Register the name of the file we want our data to export as.
    * @param {string} filename
    */
   setFilename(filename) {
      this._filename = filename;
   }

   /**
    * @method setGridComponent()
    * Register the webix.grid that currently stores the data we are
    * exporting.
    * @param {webix.grid} $grid
    */
   setGridComponent($grid) {
      this._grid = $grid;
   }

   /**
    * @function show()
    * Show this component.
    * @param {obj} $view
    *        the webix.$view to hover the popup around.
    */
   show($view) {
      $$(this.ids.popupExport).show($view);
   }

   async export(name) {
      let fnExport;

      let columns = {};

      let dc = this._dataCollection;
      let _currentObject = this._currentObject;
      let _grid = this._grid;
      let _filename = this._filename;

      if (
         dc &&
         (!dc.settings.loadAll || dc.dataStatus == dc.dataStatusFlag.notInitial)
      ) {
         // Load all data
         await dc.reloadData(0, null);
         dc.settings.loadAll = true;
      }

      // client filter data
      // template of report
      if (_currentObject) {
         _currentObject.fields().forEach((f) => {
            // hidden fields
            if (this._hiddenFields.indexOf(f.columnName) > -1) return;

            columns[f.columnName] = {
               template: (rowData) => {
                  return f.format(rowData);
               },
            };
         });
      }

      // If there are checked items, then export them only
      // Otherwise export all items
      const noCheckedRow =
         _grid.data.find({ appbuilder_select_item: 1 }).length < 1;
      const filterRow = (row) =>
         noCheckedRow || row?.appbuilder_select_item == 1;

      switch (name) {
         case "CSV":
            webix.csv.delimiter.cols = ",";

            fnExport = webix.toCSV(_grid, {
               filename:
                  _filename || (_currentObject ? _currentObject.label : null),
               columns: columns,
               filter: filterRow,
            });
            break;
         case "Excel":
            fnExport = webix.toExcel(_grid, {
               filename:
                  _filename || (_currentObject ? _currentObject.label : null),
               name:
                  _filename || (_currentObject ? _currentObject.label : null),
               columns: columns,
               filterHTML: true,
               filter: filterRow,
            });
            break;
         case "PDF":
            fnExport = webix.toPDF(_grid, {
               filename:
                  _filename || (_currentObject ? _currentObject.label : null),
               filterHTML: true,
               filter: filterRow,
            });
            break;
         case "PNG":
            fnExport = webix.toPNG(_grid, {
               filename:
                  _filename || (_currentObject ? _currentObject.label : null),
               // filter: NOT SUPPORT
            });
            break;
      }

      try {
         await fnExport;
         $$(this.ids.popupExport).hide();
      } catch (err) {
         this.AB.notify.developer(err, {
            message: `ABViewGridPopupExport:export(): System could not export: ${name}`,
            exportType: name,
            columns,
            fileName: _filename,
         });
      }
   }

   // this.dataCollectionLoad = _logic.dataCollectionLoad;
   // this.objectLoad = _logic.objectLoad;
   // this.setGridComponent = _logic.setGridComponent;
   // this.setFilename = _logic.setFilename;
   // this.setHiddenFields = _logic.setHiddenFields;
   // this.show = _logic.show;
}
