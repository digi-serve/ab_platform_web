import ABViewConnectDataFilterCore from "../../core/views/ABViewConnectDataFilterCore";
import ABViewComponent from "./viewComponent/ABViewComponent";

const L = (...params) => AB.Multilingual.label(...params);

class ABViewConnectDataFilterComponent extends ABViewComponent {
   constructor(view, idbase) {
      super(idbase ?? `ABViewConnectDataFilter_${view.id}`, {
         reset: "",
      });

      this.view = view;
      this.AB = view.AB;
      this.datacollection = this.view.datacollection;
      this.settings = view.settings;
   }

   ui() {
      return {
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
               id: this.ids.component,
               labelWidth: this.AB.UISettings.config().labelWidthXLarge,
               disabled: true,
               on: {
                  onChange: (id) => this.applyConnectFilter(id),
               },
            },
            {
               view: "icon",
               id: this.ids.reset,
               icon: "fa fa-times",
               align: "left",
               disabled: true,
               tooltip: L("Renmove this filter"),
               on: {
                  onItemClick: () => this.resetConnectFilter(),
               },
            },
         ],
      };
   }

   async init(options) {
      const dv = this.datacollection;
      if (!dv) return;

      const object = dv.datasource;
      if (!object) return;

      const [field] = object.fields((f) => f.columnName == this.settings.field);
      if (!field) {
         console.warn(
            `Cannot find field "${this.settings.field}" in ${object.name}`
         );
         return;
      }
      this.field = field;

      const suggest = {
         on: {
            onBeforeShow: function () {
               field.getAndPopulateOptions(this, null, field);
            },
         },
      };
      $$(this.ids.component).define("suggest", suggest);
      $$(this.ids.component).define(
         "label",
         `${L("Filter by")} ${field.label}`
      );
      $$(this.ids.component).enable();
      $$(this.ids.component).refresh();
   }

   resetConnectFilter() {
      this.datacollection.filterCondition({ glue: "and", rules: [] });
      this.datacollection.reloadData();
      // Block applyConnectFields() from triggering
      $$(this.ids.component).blockEvent();
      $$(this.ids.component).setValue();
      $$(this.ids.component).unblockEvent();
      $$(this.ids.reset).disable();
   }

   applyConnectFilter(connectId) {
      const filterRule = {
         key: this.field.id,
         rule: "equals",
         value: connectId,
      };

      this.datacollection.filterCondition({ glue: "and", rules: [filterRule] });
      this.datacollection.reloadData();
      $$(this.ids.reset).enable();
   }
}

export default class ABViewConnectDataFilter extends ABViewConnectDataFilterCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false) {
      let component = new ABViewConnectDataFilterComponent(this);

      // if this is our v1Interface
      if (v1App) {
         var newComponent = component;
         component = {
            ui: newComponent.ui(),
            init: (options, accessLevel) => {
               return newComponent.init(this.AB, accessLevel);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
      }
      return component;
   }
}
