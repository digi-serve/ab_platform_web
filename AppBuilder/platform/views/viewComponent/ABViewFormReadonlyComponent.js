const ABViewFormItemComponent = require("./ABViewFormItemComponent");

module.exports = class ABViewFormReadonlyComponent extends (
   ABViewFormItemComponent
) {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewFormReadonly_${baseView.id}`,
         Object.assign(
            {
               template: "",
            },
            ids
         )
      );
   }

   ui() {
      const baseView = this.view;
      const field = baseView.field();

      const _ui = {
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

      const settings = baseView.parentFormComponent().settings || {};

      if (settings.showLabel == true && settings.labelPosition == "top") {
         _ui.body.height = 80;
      } else if (field.settings.useHeight) {
         _ui.body.height = parseInt(field.settings.imageHeight) || 38;
      } else _ui.body.height = 38;

      return super.ui(_ui);
   }

   async init(AB) {
      await super.init(AB);

      const $formItem = $$(this.ids.formItem);

      if (!$formItem) return;

      const $form = $formItem.getFormView();
      const rowData = $form?.getValues() ?? {};

      this.refresh(rowData);
      $form?.attachEvent("onChange", (newv, oldv) => {
         const rowData = $form?.getValues() ?? {};

         this.refresh(rowData);
      });
   }

   onShow() {
      const $formItem = $$(this.ids.formItem);

      if (!$formItem) return;

      const $form = $formItem.getFormView();
      const rowData = $form?.getValues() ?? {};

      this.refresh(rowData);
   }

   getValue(rowData) {
      const field = this.view.field();

      if (!field) return null;

      return rowData[field.columnName];
   }

   refresh(rowData) {
      const baseView = this.view;
      const form = baseView.parentFormComponent(),
         field = baseView.field();

      const formSettings = form.settings || {};

      let templateLabel = "";

      if (formSettings.showLabel) {
         if (formSettings.labelPosition === "top")
            templateLabel = `<label style="display:block; text-align: left; margin: 0; padding:1px 7.5px 0 3px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" class="webix_inp_top_label">${field.label}</label>`;
         else
            templateLabel = `<label style="width: ${formSettings.labelWidth}px; display: inline-block; line-height: 32px; float: left; margin: 0; padding:1px 7.5px 0 3px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${field.label}</label>`;
      }

      let newWidth = formSettings.labelWidth;

      if (this.settings.formView) newWidth += 40;
      else if (formSettings.showLabel && formSettings.labelPosition === "top")
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
