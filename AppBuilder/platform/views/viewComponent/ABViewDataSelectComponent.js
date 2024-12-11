import ABViewComponent from "./ABViewComponent";
export default class ABViewDataSelectComponent extends ABViewComponent {
   constructor(baseView, idbase, ids) {
      super(
         baseView,
         idbase || `ABViewDataSelect_${baseView.id}`,
         Object.assign(
            {
               select: "",
            },
            ids
         )
      );
   }

   ui() {
      const _ui = super.ui([
         {
            view: "richselect",
            id: this.ids.select,
            on: {
               onChange: (n, o) => {
                  if (!o) return;
                  if (n !== o) this.cursorChange(n);
               },
            },
         },
      ]);
      delete _ui.type;

      return _ui;
   }

   async init(AB) {
      await super.init(AB);
      this.dc = AB.datacollectionByID(this.settings.dataviewID);
   }

   async onShow() {
      if (!this.dc) return;
      await this.dc.waitForDataCollectionToInitialize(this.dc);
      const labelField = this.AB.definitionByID(
         this.settings.labelField
      )?.columnName;
      const options = this.dc
         .getData()
         .map((o) => ({ id: o.id, value: o[labelField] }));
      $$(this.ids.select).define("options", options);
      $$(this.ids.select).refresh();
      $$(this.ids.select).setValue(this.dc.getCursor().id);
   }

   cursorChange(n) {
      this.dc.setCursor(n);
   }
}
