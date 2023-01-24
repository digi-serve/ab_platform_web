const ABViewFormItemComponent = require("./ABViewFormItemComponent");

module.exports = class ABViewFormReadonlyComponent extends (
   ABViewFormItemComponent
) {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewFormReadonly_${baseView.id}`;
      super(baseView, idBase, {
         template: "",
      });
   }

   ui() {
      const form = this.view.parentFormComponent(),
         field = this.view.field();

      const _ui = {
         id: this.ids.component,
         view: "forminput",
         labelWidth: 0,
         paddingY: 0,
         paddingX: 0,
         readonly: true,
         css: "ab-readonly-field",
         // name: component.ui.name,
         // label:  field.label,
         // labelPosition: settings.labelPosition, // webix.forminput does not have .labelPosition T T
         // labelWidth: settings.labelWidth,
         body: {
            id: this.ids.template,
            view: "label",
            borderless: true,
            css: { "background-color": "#fff" },
            label: "",
         },
      };

      let settings = {};
      if (form) settings = form.settings;

      if (settings.showLabel == true && settings.labelPosition == "top") {
         _ui.body.height = 80;
      } else if (field.settings.useHeight) {
         _ui.body.height = parseInt(field.settings.imageHeight) || 38;
      } else {
         _ui.body.height = 38;
      }

      return _ui;
   }

   init() {
      const $elem = $$(this.ids.component);
      if (!$elem) return;

      const $form = $elem.getFormView();
      const rowData = $form?.getValues() ?? {};
      this.refresh(rowData);

      $form?.attachEvent("onChange", (newv, oldv) => {
         const rowData = $form?.getValues() ?? {};
         this.refresh(rowData);
      });
   }

   onShow() {
      const $elem = $$(this.ids.component);
      if (!$elem) return;

      const $form = $elem.getFormView();
      const rowData = $form?.getValues() ?? {};

      this.refresh(rowData);
   }

   getValue(rowData) {
      const field = this.view.field();
      if (!field) return null;

      return rowData[field.columnName];
   }

   refresh(rowData) {
      const form = this.view.parentFormComponent(),
         field = this.view.field();

      let settings = {};
      if (form) settings = form.settings;

      let templateLabel = "";
      if (settings.showLabel == true) {
         if (settings.labelPosition == "top")
            templateLabel = `<label style="display:block; text-align: left; margin: 0; padding:1px 7.5px 0 3px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" class="webix_inp_top_label">${field.label}</label>`;
         else
            templateLabel = `<label style="width: ${settings.labelWidth}px; display: inline-block; line-height: 32px; float: left; margin: 0; padding:1px 7.5px 0 3px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${field.label}</label>`;
      }

      let newWidth = settings.labelWidth;
      if (this.settings.formView) newWidth += 40;
      else if (settings.showLabel == true && settings.labelPosition == "top")
         newWidth = 0;

      const template =
         `<div class="readonlyField">${templateLabel}#template#</div>`.replace(
            /#template#/g,
            field
               .columnHeader({
                  width: newWidth,
                  editable: true,
               })
               .template(rowData)
         );

      // Re-build template element
      $$(this.ids.template)?.setHTML(template);
   }
};
