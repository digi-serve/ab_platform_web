const ABViewDetailItemComponent = require("./ABViewDetailItemComponent");

module.exports = class ABViewDetailConnectComponent extends (
   ABViewDetailItemComponent
) {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewDetailConnect_${baseView.id}`, ids);
   }

   ui() {
      const baseView = this.view;
      const settings = this.settings;

      return super.ui({
         on: {
            //Add data-cy attribute for Cypress Testing
            onAfterRender: () => {
               const columnName =
                  baseView.field((fld) => fld.id === settings.fieldId)
                     ?.columnName ?? "";
               const dataCy = `detail connected ${columnName} ${
                  settings.fieldId
               } ${baseView.parentDetailComponent()?.id || baseView.parent.id}`;

               $$(this.ids.detailItem)?.$view.setAttribute("data-cy", dataCy);
            },
         },
      });
   }

   setValue(val) {
      const vals = [];

      if (Array.isArray(val))
         val.forEach((record) => {
            vals.push(
               `<span class="webix_multicombo_value">${record.text}</span>`
            );
         });
      else vals.push(`<span class="webix_multicombo_value">${val.text}</span>`);

      super.setValue(vals.join(""));
   }
};
