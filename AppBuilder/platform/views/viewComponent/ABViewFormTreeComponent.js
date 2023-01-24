const ABViewFormItemComponent = require("./ABViewFormItemComponent");

module.exports = class ABViewFormTreeComponent extends ABViewFormItemComponent {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewFormTree_${baseView.id}`;
      super(baseView, idBase, {});
   }

   ui() {
      const _ui = super.ui(),
         form = this.view.parentFormComponent(),
         field = this.view.field();

      // this field may be deleted
      if (!field) return _ui;

      let settings = {};
      if (form) settings = form.settings;

      const requiredClass =
         field.settings.required == 1 ? "webix_required" : "";

      let templateLabel = "";
      if (settings.showLabel == true) {
         if (settings.labelPosition == "top")
            templateLabel = `<label style="display:block; text-align: left; margin: 0; padding:1px 7.5px 0 3px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" class="webix_inp_top_label ${requiredClass}">#label#</label>`;
         else
            templateLabel = `<label style="width: #width#px; display: inline-block; line-height: 32px; float: left; margin: 0; padding:1px 7.5px 0 3px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" class="${requiredClass}">#label#</label>`;
      }

      let newWidth = settings.labelWidth;
      if (this.settings.formView != null) newWidth += 40;

      let template = `${templateLabel}#template#`
         .replace(/#width#/g, settings.labelWidth)
         .replace(/#label#/g, field.label)
         .replace(
            /#template#/g,
            field.columnHeader({
               width: newWidth,
            }).template
         );

      _ui.id = this.ids.component;
      _ui.view = "template";
      _ui.css = "webix_el_box";
      _ui.height =
         field.settings.useHeight == 1
            ? parseInt(field.settings.imageHeight)
            : 38;
      _ui.borderless = true;

      _ui.template = `<div class="customField">${template}</div>`;

      _ui.onClick = {
         customField: (id, e, trg) => {
            const rowData = {},
               node = $$(this.ids.component).$view;

            rowData[field.columnName] = this.getValue();
            field.customEdit(rowData, this.AB._App, node, this);
         },
      };

      return _ui;
   }

   getValue(rowData) {
      let vals = $$(this.ids.component).getValues();

      // Pass empty string if the returned values is empty array
      if (Array.isArray(vals) && vals.length == 0) vals = "";
      return vals;
   }
};
