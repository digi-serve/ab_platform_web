const ABViewFormItemComponent = require("./ABViewFormItemComponent");

module.exports = class ABViewFormTreeComponent extends ABViewFormItemComponent {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewFormTree_${baseView.id}`, ids);
   }

   ui() {
      const baseView = this.view;
      const field = baseView.field();

      const _ui = {};

      // this field may be deleted
      if (!field) return super.ui(_ui);

      const formSettings = baseView.parentFormComponent().settings || {};

      const requiredClass =
         field.settings.required === 1 ? "webix_required" : "";

      let templateLabel = "";

      if (formSettings.showLabel) {
         if (formSettings.labelPosition === "top")
            templateLabel = `<label style="display:block; text-align: left; margin: 0; padding:1px 7.5px 0 3px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" class="webix_inp_top_label ${requiredClass}">#label#</label>`;
         else
            templateLabel = `<label style="width: #width#px; display: inline-block; line-height: 32px; float: left; margin: 0; padding:1px 7.5px 0 3px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" class="${requiredClass}">#label#</label>`;
      }

      let newWidth = formSettings.labelWidth;

      if (this.settings.formView) newWidth += 40;

      const template = `${templateLabel}#template#`
         .replace(/#width#/g, formSettings.labelWidth)
         .replace(/#label#/g, field.label)
         .replace(
            /#template#/g,
            field.columnHeader({
               width: newWidth,
            }).template
         );

      _ui.view = "template";
      _ui.css = "webix_el_box";
      _ui.height =
         field.settings.useHeight === 1
            ? parseInt(field.settings.imageHeight)
            : 38;
      _ui.borderless = true;

      _ui.template = `<div class="customField">${template}</div>`;

      _ui.onClick = {
         customField: (id, e, trg) => {
            const rowData = {},
               node = $$(this.ids.formItem).$view;

            rowData[field.columnName] = this.getValue();
            field.customEdit(rowData, this.AB._App, node, this);
         },
      };

      return super.ui(_ui);
   }

   getValue(rowData) {
      let vals = $$(this.ids.formItem).getValues();

      // Pass empty string if the returned values is empty array
      if (Array.isArray(vals) && vals.length === 0) vals = "";

      return vals;
   }
};
