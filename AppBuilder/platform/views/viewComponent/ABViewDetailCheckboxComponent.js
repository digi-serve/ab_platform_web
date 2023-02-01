const ABViewDetailItemComponent = require("./ABViewDetailItemComponent");

module.exports = class ABViewDetailCheckboxComponent extends (
   ABViewDetailItemComponent
) {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewDetailCheckbox_${baseView.id}`, ids);
   }

   ui() {
      const baseView = this.view;
      const field = baseView.field();

      return super.ui({
         on: {
            //Add data-cy attribute for Cypress Testing
            onAfterRender: () => {
               const dataCy = `detail checkbox ${field?.columnName} ${
                  field?.id
               } ${baseView.parentDetailComponent()?.id ?? baseView.parent.id}`;

               $$(this.ids.detailItem)?.$view.setAttribute("data-cy", dataCy);
            },
         },
      });
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
