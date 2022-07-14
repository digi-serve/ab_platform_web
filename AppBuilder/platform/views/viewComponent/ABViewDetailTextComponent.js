const ABViewDetailItemComponent = require("./ABViewDetailItemComponent");

module.exports = class ABViewDetailTextComponent extends (
   ABViewDetailItemComponent
) {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewDetailTextComponent_${baseView.id}`;
      super(baseView, idBase);
   }

   ui() {
      let _ui = super.ui();

      _ui.id = this.ids.component;
      _ui.css = "ab-text";
      if (this.settings.height) _ui.height = this.settings.height;

      let field = this.view.field();
      _ui.on = {
         //Add data-cy attribute for Cypress Testing
         onAfterRender: () => {
            const dataCy = `detail text ${field?.columnName} ${field?.id} ${
               this.view.parentDetailComponent()?.id || this.view.parent.id
            }`;
            $$(_ui.id)?.$view.setAttribute("data-cy", dataCy);
         },
      };

      return _ui;
   }
};
