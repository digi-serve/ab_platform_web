const ABViewCSVExporterCore = require("../../../core/views/ABViewCSVExporterCore");
const ClassUI = require("../../../../ui/ClassUI").default;

const ABViewCSVExporterPropertyComponentDefaults =
   ABViewCSVExporterCore.defaultValues();

module.exports = class ABViewCSVExporterComponent extends ClassUI {
   constructor(viewCSVExporter, idBase) {
      idBase = idBase || `ABCSVExporter_${viewCSVExporter.id}`;

      super(idBase, {
         button: "",
         buttonFilter: "",
         popupFilter: "",
      });

      this.idBase = idBase;
      this.view = viewCSVExporter;
   }

   ui() {
      const ids = this.ids;

      return {
         // TODO: We have to refactor becuase we need "id" on the very top level for each viewComponent.
         id: `${this.ids.component}_temp`,
         view: "layout",
         type: "clean",
         borderless: true,
         cols: [
            {
               id: ids.buttonFilter,
               view: "button",
               css: "webix_transparent",
               type: "icon",
               icon: "fa fa-filter",
               borderless: true,
               width: 50,
               label: "",
               click: () => {
                  this.showFilterPopup();
               },
            },
            {
               id: ids.button,
               view: "button",
               css: "webix_primary",
               type: "icon",
               icon: "fa fa-download",
               borderless: true,
               width:
                  this.view?.settings?.width ||
                  ABViewCSVExporterPropertyComponentDefaults.width,
               label:
                  this.view?.settings?.buttonLabel ??
                  ABViewCSVExporterPropertyComponentDefaults.buttonLabel,
               click: () => {
                  this.downloadCsvFile();
               },
            },
            { fillspace: true },
         ],
      };
   }

   init(AB) {
      this.AB = AB;
      this.clientFilter = this.AB.filterComplexNew(`${this.idBase}_filter`);

      const dc = this.view.datacollection;
      if (dc) {
         const obj = dc.datasource;

         this.clientFilter.fieldsLoad(obj?.fields?.() ?? []);
      }

      this.clientFilter.init();
      this.clientFilter.on("change", (val) => {
         this.onFilterChange(val);
      });
   }

   downloadCsvFile() {
      let url = `/appbuilder/csv-export/${this.view.id}`;
      const where = this.clientFilter.getValue();

      if (where && (where.rules || []).length) {
         let qsWhere = JSON.stringify(where);
         qsWhere = encodeURIComponent(qsWhere);
         url = `${url}?where=${qsWhere}`;
      }

      window.open(url);
   }

   showFilterPopup() {
      const $buttonFilter = $$(this.ids.buttonFilter);
      this.clientFilter.popUp($buttonFilter ? $buttonFilter.$view : null);
   }

   onFilterChange() {
      const $buttonFilter = $$(this.ids.buttonFilter);
      if (!$buttonFilter) return;

      const where = this.clientFilter.getValue();
      $buttonFilter.define("badge", (where.rules || []).length || null);
      $buttonFilter.refresh();
   }
};
