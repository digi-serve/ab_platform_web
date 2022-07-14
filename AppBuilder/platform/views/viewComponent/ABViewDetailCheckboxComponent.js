const ABViewDetailItemComponent = require("./ABViewDetailItemComponent");

module.exports = class ABViewDetailCheckboxComponent extends (
   ABViewDetailItemComponent
) {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewDetailCheckboxComponent_${baseView.id}`;
      super(baseView, idBase);
   }

   ui() {
      let _ui = super.ui();

      let field = this.view.field();

      _ui.id = this.ids.component;
      _ui.on = {
         //Add data-cy attribute for Cypress Testing
         onAfterRender: () => {
            const dataCy = `detail checkbox ${field?.columnName} ${field?.id} ${
               this.view.parentDetailComponent()?.id ?? this.view.parent.id
            }`;
            $$(_ui.id)?.$view.setAttribute("data-cy", dataCy);
         },
      };

      return _ui;
   }

   setValue(val) {
      let checkbox = "";

      // Check
      if (val && JSON.parse(val))
         checkbox =
            '<span class="check webix_icon fa fa-check-square-o"></span>';
      // Uncheck
      else checkbox = '<span class="check webix_icon fa fa-square-o"></span>';

      super.setValue(checkbox);
   }
};
