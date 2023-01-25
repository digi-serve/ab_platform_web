const ABViewDetailItemComponent = require("./ABViewDetailItemComponent");

module.exports = class ABViewDetailTextComponent extends (
   ABViewDetailItemComponent
) {
   constructor(baseView, idBase) {
      super(baseView, idBase ?? `ABViewDetailText_${baseView.id}`);
   }

   ui() {
      const field = this.view.field();
      const _ui = {
         css: "ab-text",
         on: {
            //Add data-cy attribute for Cypress Testing
            onAfterRender: () => {
               const dataCy = `detail text ${field?.columnName} ${field?.id} ${
                  this.view.parentDetailComponent()?.id || this.view.parent.id
               }`;

               $$(this.ids.detail)?.$view.setAttribute("data-cy", dataCy);
            },
         },
      };
      const settings = this.settings;

      if (settings.height) _ui.height = settings.height;

      return super.ui(_ui);
   }
};
