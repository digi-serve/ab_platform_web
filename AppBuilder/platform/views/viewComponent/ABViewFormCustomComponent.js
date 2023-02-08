const ABViewFormItemComponent = require("./ABViewFormItemComponent");
const ABFieldImage = require("../../dataFields/ABFieldImage");
const FocusableTemplate = require("../../../../webix_custom_components/focusableTemplate");

const DEFAULT_HEIGHT = 80;

module.exports = class ABViewFormCustomComponent extends (
   ABViewFormItemComponent
) {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewFormCustom_${baseView.id}`;
      super(baseView, idBase, {});
   }

   get new_width() {
      const form = this.view.parentFormComponent();
      const form_settings = form?.settings ?? {};
      const settings = this.view.settings ?? {};

      let newWidth = form_settings.labelWidth;
      if (settings.formView) newWidth += 40;
      else if (
         form_settings.showLabel == true &&
         form_settings.labelPosition == "top"
      )
         newWidth = 0;

      return newWidth;
   }

   ui() {
      const base_ui = super.ui();
      const field = this.view.field();
      const form = this.view.parentFormComponent();
      const form_settings = form?.settings ?? {};
      const settings = field?.settings ?? this.view.settings ?? {};

      const requiredClass =
         field?.settings?.required || settings.required ? "webix_required" : "";

      let templateLabel = "";
      if (form_settings.showLabel) {
         if (form_settings.labelPosition == "top")
            templateLabel = `<label style="display:block; text-align: left; margin: 0; padding:1px 7.5px 0 3px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" class="webix_inp_top_label ${requiredClass}">#label#</label>`;
         else
            templateLabel = `<label style="width: #width#px; display: inline-block; line-height: 32px; float: left; margin: 0; padding:1px 7.5px 0 3px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" class="${requiredClass}">#label#</label>`;
      }

      let height = 38;
      if (field instanceof ABFieldImage) {
         if (settings.useHeight) {
            if (form_settings.labelPosition == "top") {
               height = parseInt(settings.imageHeight) || DEFAULT_HEIGHT;
               height += 38;
            } else {
               height = parseInt(settings.imageHeight) || DEFAULT_HEIGHT;
            }
         } else if (form_settings.labelPosition == "top") {
            height = DEFAULT_HEIGHT + 38;
         } else {
            if (DEFAULT_HEIGHT > 38) {
               height = DEFAULT_HEIGHT;
            }
         }
      } else if (
         form_settings.showLabel == true &&
         form_settings.labelPosition == "top"
      ) {
         height = DEFAULT_HEIGHT;
      }

      const template =
         `<div class="customField ${form_settings.labelPosition}">${templateLabel}#template#</div>`
            .replace(/#width#/g, form_settings.labelWidth)
            .replace(/#label#/g, field?.label ?? "")
            .replace(
               /#template#/g,
               field
                  ?.columnHeader({
                     width: this.new_width,
                     height: height,
                     editable: true,
                  })
                  .template({}) ?? ""
            );

      return {
         id: this.ids.component,
         view: "forminput",
         labelWidth: 0,
         paddingY: 0,
         paddingX: 0,
         css: "ab-custom-field",
         name: base_ui.name,
         // label:  field.label,
         // labelPosition: settings.labelPosition, // webix.forminput does not have .labelPosition T T
         // labelWidth: settings.labelWidth,
         body: {
            // id: ids.component,
            view: new FocusableTemplate(this.AB._App).key,
            css: "customFieldCls",
            borderless: true,
            template: template,
            height: height,
            onClick: {
               customField: (evt, e, trg) => {
                  if (settings.disable == 1) return;

                  let rowData = {};

                  const formView = this?.parentFormComponent() || this.view?.parentFormComponent();
                  if (formView) {
                     const dv = formView.datacollection;
                     if (dv) rowData = dv.getCursor() || {};
                  }

                  // var node = $$(ids.component).$view;
                  let node = $$(trg).getParentView().$view;
                  field?.customEdit(
                     rowData,
                     this.AB_App,
                     node,
                     this.ids.component,
                     evt
                  );
               },
            },
         },
      };
   }

   onShow() {
      const elem = $$(this.ids.component);
      if (!elem) return;

      const field = this.view.field(),
         rowData = {},
         node = elem.$view;

      // Add data-cy attributes
      const dataCy = `${this.view.key} ${field.key} ${field.columnName} ${this.view.id} ${this.view.parent.id}`;
      node.setAttribute("data-cy", dataCy);

      let options = {
         formId: this.ids.component,
         editable: this.view.settings.disable == 1 ? false : true,
      };

      if (field instanceof ABFieldImage) {
         options.height = field.settings.useHeight
            ? parseInt(field.settings.imageHeight) || DEFAULT_HEIGHT
            : DEFAULT_HEIGHT;
         options.width = field.settings.useWidth
            ? parseInt(field.settings.imageWidth) || this.new_width
            : this.new_width;
      }

      field.customDisplay(rowData, this.AB._App, node, options);
   }

   getValue(rowData) {
      const field = this.view.field();
      const elem = $$(this.ids.component);

      return field.getValue(elem, rowData);
   }
};
