const ABViewFormItemComponent = require("./ABViewFormItemComponent");
const ABFieldImage = require("../../dataFields/ABFieldImage");
const FocusableTemplate = require("../../../../webix_custom_components/focusableTemplate");

const DEFAULT_HEIGHT = 80;

module.exports = class ABViewFormCustomComponent extends (
   ABViewFormItemComponent
) {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewFormCustom_${baseView.id}`, ids);
   }

   get new_width() {
      const baseView = this.view;
      const form = baseView.parentFormComponent();
      const formSettings = form?.settings ?? {};
      const settings = baseView.settings ?? {};

      let newWidth = formSettings.labelWidth;

      if (settings.formView) newWidth += 40;
      else if (formSettings.showLabel && formSettings.labelPosition === "top")
         newWidth = 0;

      return newWidth;
   }

   ui() {
      const baseView = this.view;
      const field = baseView.field();
      const form = baseView.parentFormComponent();
      const formSettings = form?.settings ?? {};
      const settings = field?.settings ?? baseView.settings ?? {};

      const requiredClass =
         field?.settings?.required || settings.required ? "webix_required" : "";

      let templateLabel = "";

      if (formSettings.showLabel) {
         if (formSettings.labelPosition === "top")
            templateLabel = `<label style="display:block; text-align: left; margin: 0; padding:1px 7.5px 0 3px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" class="webix_inp_top_label ${requiredClass}">#label#</label>`;
         else
            templateLabel = `<label style="width: #width#px; display: inline-block; line-height: 32px; float: left; margin: 0; padding:1px 7.5px 0 3px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" class="${requiredClass}">#label#</label>`;
      }

      let height = 38;

      if (field instanceof ABFieldImage) {
         if (settings.useHeight) {
            if (formSettings.labelPosition === "top") {
               height = parseInt(settings.imageHeight) || DEFAULT_HEIGHT;
               height += 38;
            } else {
               height = parseInt(settings.imageHeight) || DEFAULT_HEIGHT;
            }
         } else if (formSettings.labelPosition === "top") {
            height = DEFAULT_HEIGHT + 38;
         } else {
            if (DEFAULT_HEIGHT > 38) {
               height = DEFAULT_HEIGHT;
            }
         }
      } else if (formSettings.showLabel && formSettings.labelPosition === "top")
         height = DEFAULT_HEIGHT;

      const template =
         `<div class="customField ${formSettings.labelPosition}">${templateLabel}#template#</div>`
            .replace(/#width#/g, formSettings.labelWidth)
            .replace(/#label#/g, field.label)
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

      return super.ui({
         view: "forminput",
         labelWidth: 0,
         paddingY: 0,
         paddingX: 0,
         css: "ab-custom-field",
         // label:  field.label,
         // labelPosition: settings.labelPosition, // webix.forminput does not have .labelPosition T T
         // labelWidth: settings.labelWidth,
         body: {
            view: new FocusableTemplate(this.AB._App).key,
            css: "customFieldCls",
            borderless: true,
            template: template,
            height: height,
            onClick: {
               customField: (evt, e, trg) => {
                  if (settings.disable === 1) return;

                  let rowData = {};

                  const formView = this.parentFormComponent();
                  if (formView) {
                     const dv = formView.datacollection;
                     if (dv) rowData = dv.getCursor() || {};
                  }

                  // var node = $$(ids.formItem).$view;
                  let node = $$(trg).getParentView().$view;
                  field?.customEdit(
                     rowData,
                     this.AB_App,
                     node,
                     this.ids.formItem,
                     evt
                  );
               },
            },
         },
      });
   }

   onShow() {
      const ids = this.ids;
      const $formItem = $$(ids.formItem);

      if (!$formItem) return;

      const baseView = this.view;
      const field = baseView.field(),
         rowData = {},
         node = $formItem.$view;

      // Add data-cy attributes
      const dataCy = `${baseView.key} ${field.key} ${field.columnName} ${baseView.id} ${baseView.parent.id}`;
      node.setAttribute("data-cy", dataCy);

      const options = {
         formId: ids.formItem,
         editable: baseView.settings.disable === 1 ? false : true,
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
      const $formItem = $$(this.ids.formItem);

      return field.getValue($formItem, rowData);
   }
};
