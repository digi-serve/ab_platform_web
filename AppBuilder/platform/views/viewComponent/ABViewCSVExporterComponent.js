const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewCSVExporterComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABCSVExporter_${baseView.id}`,
         Object.assign(
            {
               button: "",
               buttonFilter: "",
               filterComplex: "",
            },
            ids
         )
      );

      this.clientFilter = null;
   }

   ui() {
      const ids = this.ids;
      const settings = this.settings;
      const defaultSettings = this.view.constructor.defaultValues();
      const _ui = super.ui([
         {
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
                  width: settings.width || defaultSettings.width,
                  label: settings.buttonLabel ?? defaultSettings.buttonLabel,
                  click: () => {
                     this.downloadCsvFile();
                  },
               },
               { fillspace: true },
            ],
         },
      ]);

      delete _ui.type;

      return _ui;
   }

   async init(AB) {
      await super.init(AB);

      if (!this.clientFilter) {
         const clientFilter = AB.filterComplexNew(this.ids.filterComplex);

         const dc = this.datacollection;

         if (dc) {
            const obj = dc.datasource;

            if (!obj)
               AB.notify.developer(Error(`Object is ${obj}`), {
                  message: "This is an invalid object",
               });

            clientFilter.fieldsLoad(obj?.fields?.() ?? []);
         }

         clientFilter.init();
         clientFilter.on("change", (val) => {
            this.onFilterChange(val);
         });

         this.clientFilter = clientFilter;
      }
   }

   downloadCsvFile() {
      let url = `/appbuilder/csv-export/${this.view.id}`;

      const where = this.clientFilter.getValue();

      if ((where?.rules || []).length) {
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
