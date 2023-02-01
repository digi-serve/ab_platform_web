import ABViewComponent from "./ABViewComponent";

export default class ABViewConnectDataFilterComponent extends ABViewComponent {
   constructor(baseView, idbase, ids) {
      super(
         baseView,
         idbase || `ABViewConnectDataFilter_${baseView.id}`,
         Object.assign(
            {
               filter: "",
               reset: "",
            },
            ids
         )
      );

      this.field = null;
   }

   ui() {
      const ids = this.ids;
      const _ui = super.ui([
         {
            type: "space",
            borderless: true,
            cols: [
               {
                  view: "icon",
                  icon: "fa fa-filter",
                  align: "left",
                  disabled: true,
               },
               {
                  view: "combo",
                  id: ids.filter,
                  labelWidth: this.AB.UISettings.config().labelWidthXLarge,
                  disabled: true,
                  on: {
                     onChange: (id) => this.applyConnectFilter(id),
                  },
               },
               {
                  view: "icon",
                  id: ids.reset,
                  icon: "fa fa-times",
                  align: "left",
                  disabled: true,
                  tooltip: this.label("Renmove this filter"),
                  on: {
                     onItemClick: () => this.resetConnectFilter(),
                  },
               },
            ],
         },
      ]);

      delete _ui.type;

      return _ui;
   }

   async init(AB) {
      const dv = this.datacollection;

      if (!dv) return;

      const object = dv.datasource;

      if (!object) return;

      const [field] = object.fields(
         (f) => f.columnName === this.settings.field
      );

      if (!field) {
         this.AB.notify.developer(
            `Cannot find field "${this.settings.field}" in ${object.name}`,
            {
               context: "ABViewConnectDataFilterComponent.init()",
               data: { settings: this.settings },
            }
         );

         return;
      }

      this.field = field;

      const ids = this.ids;
      const suggest = webix.ui({
         view: "suggest",
         filter: ({ value }, search) =>
            value.toLowerCase().includes(search.toLowerCase()),
         on: {
            onShow: () => {
               field.populateOptionsDataCy($$(ids.filter), field, {});
            },
         },
      });
      field.getAndPopulateOptions(suggest, null, field);

      const $filter = $$(ids.filter);

      $filter.define("suggest", suggest);
      $filter.define("label", `${this.label("Filter by")} ${field.label}`);
      $filter.enable();
      $filter.refresh();
   }

   resetConnectFilter() {
      const ids = this.ids;
      const dc = this.datacollection;

      dc.filterCondition({ glue: "and", rules: [] });
      dc.reloadData();
      // Block applyConnectFields() from triggering

      const $filter = $$(ids.filter);

      $filter.blockEvent();
      $filter.setValue();
      $filter.unblockEvent();
      $filter.disable();
   }

   applyConnectFilter(connectId) {
      const filterRule = {
         key: this.field.id,
         rule: "equals",
         value: connectId,
      };
      const dc = this.datacollection;

      dc.filterCondition({ glue: "and", rules: [filterRule] });
      dc.reloadData();
      $$(this.ids.reset).enable();
   }
}
