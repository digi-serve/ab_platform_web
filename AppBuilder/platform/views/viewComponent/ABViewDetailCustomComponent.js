const ABViewDetailItemComponent = require("./ABViewDetailItemComponent");

module.exports = class ABViewDetailCustomComponent extends (
   ABViewDetailItemComponent
) {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewDetailCustomComponent_${baseView.id}`;
      super(baseView, idBase);
   }

   ui() {
      let _ui = super.ui();

      _ui.id = this.ids.component;

      let field = this.view.field();
      let detailView = this.view.detailComponent();

      let templateLabel = "";
      if (detailView?.settings?.showLabel == true) {
         if (detailView.settings.labelPosition == "top")
            templateLabel =
               "<label style='display:block; text-align: left;' class='webix_inp_top_label'>#label#</label>";
         else
            templateLabel =
               "<label style='width: #width#px; display: inline-block; float: left; line-height: 32px;'>#label#</label>";
      }

      let template = (templateLabel + "#result#")
         // let template = (templateLabel)
         .replace(/#width#/g, detailView.settings.labelWidth)
         .replace(/#label#/g, field ? field.label : "")
         .replace(/#result#/g, field ? field.columnHeader().template({}) : "");

      _ui.id = this.ids.component;
      _ui.view = "template";
      _ui.minHeight = 45;
      _ui.height = 60;
      _ui.borderless = true;
      _ui.template = template;

      _ui.on = {
         //Add data-cy attribute for Cypress Testing
         onAfterRender: () => {
            const dataCy = `detail custom ${field?.columnName} ${field?.id} ${
               this.view.parentDetailComponent()?.id || this.view.parent.id
            }`;
            $$(_ui.id)?.$view.setAttribute("data-cy", dataCy);
         },
      };

      return _ui;
   }

   onShow() {
      let field = this.view.field();
      if (!field) return;

      let elem = $$(this.ids.component);
      if (!elem) return;

      let detailCom = this.detailComponent(),
         rowData = detailCom.datacollection.getCursor() || {},
         node = elem.$view;

      field.customDisplay(rowData, null, node, {
         editable: false,
      });
   }

   setValue(val) {
      let field = this.view.field();
      if (!field) return;

      let elem = $$(this.ids.component);
      if (!elem) return;

      let rowData = {};
      rowData[field.columnName] = val;

      field.setValue(elem, rowData);
   }
};
