const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewFormItemComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewFormItem_${baseView.id}`,
         Object.assign({ formItem: "" }, ids)
      );
   }

   ui(uiFormItemComponent = {}) {
      // setup 'label' of the element
      const baseView = this.view;
      const form = baseView.parentFormComponent(),
         field = baseView.field?.() || null,
         label = "";
      const settings = form?.settings || {};
      const _uiFormItem = {
         id: this.ids.formItem,
         labelPosition: settings.labelPosition,
         labelWidth: settings.labelWidth,
         label,
      };

      if (field) {
         _uiFormItem.name = field.columnName;

         // default value
         const data = {};

         field.defaultValue(data);

         if (data[field.columnName]) _uiFormItem.value = data[field.columnName];

         if (settings.showLabel) _uiFormItem.label = field.label;

         if (field.settings.required || settings.required)
            _uiFormItem.required = 1;

         if (settings.disable === 1) _uiFormItem.disabled = true;

         // add data-cy to form element for better testing code
         _uiFormItem.on = {
            onAfterRender() {
               if (this.getList) {
                  const popup = this.getPopup();

                  if (!popup) return;

                  this.getList().data.each((option) => {
                     if (!option) return;

                     // our option.ids are based on builder input and can include the ' character
                     const node = popup.$view.querySelector(
                        `[webix_l_id='${(option?.id ?? "")
                           .toString()
                           .replaceAll("'", "\\'")}']`
                     );

                     if (!node) return;

                     node.setAttribute(
                        "data-cy",
                        `${field.key} options ${option.id} ${field.id} ${
                           form?.id || "nf"
                        }`
                     );
                  });
               }

               this.getInputNode?.().setAttribute?.(
                  "data-cy",
                  `${field.key} ${field.columnName} ${field.id} ${
                     form?.id || "nf"
                  }`
               );
            },
         };

         // this may be needed if we want to format data at this point
         // if (field.format) data = field.format(data);

         _uiFormItem.validate = (val, data, colName) => {
            const validator = this.AB.Validation.validator();

            field.isValidData(data, validator);

            return validator.pass();
         };
      }

      const _ui = super.ui([
         Object.assign({}, _uiFormItem, uiFormItemComponent),
      ]);

      delete _ui.type;

      return _ui;
   }
};
