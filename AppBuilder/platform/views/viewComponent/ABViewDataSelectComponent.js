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
            view: "combo",
            id: this.ids.select,
            on: {
               onChange: (n, o) => {
                  if (n !== o) this.cursorChange(n);
               },
            },
         },
      ]);
      delete _ui.type;

      return _ui;
   }

   async onShow() {
      super.onShow();
      const dc = this.datacollection;
      if (!dc) return;
      await dc.waitReady();
      const labelField = this.AB.definitionByID(
         this.settings.labelField
      )?.columnName;
      const options = dc
         .getData()
         .map((o) => ({ id: o.id, value: o[labelField] }))
         .sort((a, b) => (a.value > b.value ? 1 : -1));
      const $select = $$(this.ids.select);
      $select.define("options", options);
      $select.refresh();
      $select.setValue(dc.getCursor().id);
   }

   cursorChange(n) {
      this.datacollection.setCursor(n);
   }
}
