const ABViewDetailItemComponent = require("./ABViewDetailItemComponent");

module.exports = class ABViewDetailConnectComponent extends (
   ABViewDetailItemComponent
) {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewDetailConnectComponent_${baseView.id}`;
      super(baseView, idBase);
   }

   ui() {
      let _ui = super.ui();
      // let id = `ABViewDetailConnect_${this.id}`;

      _ui.id = this.ids.component;
      _ui.on = {
         //Add data-cy attribute for Cypress Testing
         onAfterRender: () => {
            let columnName = this.view.field(
               (fld) => fld.id == this.settings.fieldId
            )?.columnName;
            const dataCy = `detail connected ${columnName} ${
               this.settings.fieldId
            } ${this.view.parentDetailComponent()?.id || this.view.parent.id}`;
            $$(this.ids.component)?.$view.setAttribute("data-cy", dataCy);
         },
      };

      return _ui;
   }

   setValue(val) {
      let vals = [];
      if (Array.isArray(val)) {
         val.forEach((record) => {
            vals.push(
               `<span class="webix_multicombo_value">${record.text}</span>`
            );
         });
      } else {
         vals.push(`<span class="webix_multicombo_value">${val.text}</span>`);
      }

      super.setValue(vals.join(""));
   }
};
