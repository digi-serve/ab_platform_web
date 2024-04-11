const ABViewDetailItemComponent = require("./ABViewDetailItemComponent");

module.exports = class ABViewDetailCustomComponent extends (
   ABViewDetailItemComponent
) {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewDetailCustom_${baseView.id}`, ids);
   }

   ui() {
      const baseView = this.view;
      const field = baseView.field();
      const detailView = baseView.detailComponent();

      let template = field ? field.columnHeader().template({}) : "";

      return super.ui({
         minHeight: 45,
         height: 60,
         template,
         on: {
            //Add data-cy attribute for Cypress Testing
            onAfterRender: () => {
               const dataCy = `detail custom ${field?.columnName} ${
                  field?.id
               } ${baseView.parentDetailComponent()?.id || baseView.parent.id}`;

               $$(this.ids.detailItem)?.$view.setAttribute("data-cy", dataCy);
            },
         },
      });
   }

   onShow() {
      super.onShow;

      const baseView = this.view;
      const field = baseView.field();

      if (!field) return;

      const $detailItem = $$(this.ids.detailItem);

      if (!$detailItem) return;

      const detailCom = baseView.detailComponent(),
         rowData = detailCom.datacollection.getCursor() || {},
         node = $detailItem.$view;

      field.customDisplay(rowData, null, node, {
         editable: false,
      });
      // Hack: remove the extra webix_template class here, which adds padding so
      // the item is not alligned with the others
      node
         .getElementsByClassName("webix_template")[1]
         ?.removeAttribute("class");
   }

   setValue(val) {
      const field = this.view.field();

      if (!field) return;

      const $detailItem = $$(this.ids.detailItem);

      if (!$detailItem) return;

      const rowData = {};

      rowData[field.columnName] = val;

      field.setValue($detailItem, rowData);
   }
};
