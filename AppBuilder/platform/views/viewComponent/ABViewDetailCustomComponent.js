const ABViewDetailItemComponent = require("./ABViewDetailItemComponent");

module.exports = class ABViewDetailCustomComponent extends (
   ABViewDetailItemComponent
) {
   constructor(baseView, idBase) {
      super(baseView, idBase ?? `ABViewDetailCustom_${baseView.id}`);
   }

   ui() {
      const baseView = this.view;
      const field = baseView.field();
      const detailView = baseView.detailComponent();

      let templateLabel = "";

      if (detailView?.settings?.showLabel) {
         if (detailView.settings.labelPosition === "top")
            templateLabel =
               "<label style='display:block; text-align: left;' class='webix_inp_top_label'>#label#</label>";
         else
            templateLabel =
               "<label style='width: #width#px; display: inline-block; float: left; line-height: 32px;'>#label#</label>";
      }

      const template = (templateLabel + "#result#")
         // let template = (templateLabel)
         .replace(/#width#/g, detailView.settings.labelWidth)
         .replace(/#label#/g, field ? field.label : "")
         .replace(/#result#/g, field ? field.columnHeader().template({}) : "");

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

               $$(this.ids.detail)?.$view.setAttribute("data-cy", dataCy);
            },
         },
      });
   }

   onShow() {
      super.onShow;

      const baseView = this.view;
      const field = baseView.field();

      if (!field) return;

      const $detail = $$(this.ids.detail);

      if (!$detail) return;

      const detailCom = baseView.detailComponent(),
         rowData = detailCom.datacollection.getCursor() || {},
         node = $detail.$view;

      field.customDisplay(rowData, null, node, {
         editable: false,
      });
   }

   setValue(val) {
      const field = this.view.field();

      if (!field) return;

      const $detail = $$(this.ids.detail);

      if (!$detail) return;

      const rowData = {};

      rowData[field.columnName] = val;

      field.setValue($detail, rowData);
   }
};
