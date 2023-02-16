const ABViewDetailItemComponent = require("./ABViewDetailItemComponent");

module.exports = class ABViewDetailSelectivityComponent extends (
   ABViewDetailItemComponent
) {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewDetailSelectivityComponent_${baseView.id}`,
         ids
      );
   }

   ui() {
      const baseView = this.view;
      const settings = this.settings;
      const field = baseView.field();
      const _ui = {
         on: {
            //Add data-cy attribute for Cypress Testing
            onAfterRender: () => {
               const dataCy = `detail selectivity ${field?.columnName} ${
                  field?.id
               } ${baseView.parentDetailComponent()?.id || baseView.parent.id}`;

               $$(this.ids.detailItem)?.$view.setAttribute("data-cy", dataCy);
            },
         },
      };

      if (settings.height) _ui.height = settings.height;

      return super.ui(_ui);
   }

   async init(AB) {
      await super.init(AB);

      // add div of selectivity to detail
      this.setValue(
         this.ids.detailItem,
         `<div class="ab-detail-selectivity"></div>`
      );
   }

   getDomSelectivity() {
      const elem = $$(this.ids.component);

      if (!elem) return;

      return elem.$view.getElementsByClassName("ab-detail-selectivity")[0];
   }

   setValue(val) {
      // convert value to array
      if (val && !(val instanceof Array)) val = [val];

      setTimeout(() => {
         // get selectivity dom
         const domSelectivity = this.getDomSelectivity();
         const isUsers = this.ui().isUsers ?? false;

         // render selectivity to html dom
         const selectivitySettings = {
            multiple: true,
            readOnly: true,
            isUsers: isUsers,
         };
         const field = this.view.field();

         field.selectivityRender(
            domSelectivity,
            selectivitySettings,
            // App
            null,
            {}
         );

         // set value to selectivity
         field.selectivitySet(domSelectivity, val, /*App*/ null);
      }, 50);
   }
};
