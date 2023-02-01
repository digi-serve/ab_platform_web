const ABViewFormItemComponent = require("./ABViewFormItemComponent");

module.exports = class ABViewFormSelectMultipleComponentComponent extends (
   ABViewFormItemComponent
) {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewFormSelectMultiple_${baseView.id}`, ids);
   }

   ui() {
      const baseView = this.view;
      const field = baseView.field(),
         settings = this.settings;
      const options = [];

      if (field?.key === "user") options.push(...field.getUsers());
      else if (field)
         options.push(...(field.settings.options ?? settings.options ?? []));

      const ids = this.ids;
      const _ui = {
         id: ids.formItem,
         view: settings.type || baseView.constructor.defaultValues().type,
         options: options.map((opt) => {
            return {
               id: opt.id,
               value: opt.text,
               hex: opt.hex,
            };
         }),
      };

      switch (_ui.view) {
         case "multicombo":
            _ui.tagMode = false;
            _ui.css = "hideWebixMulticomboTag";
            _ui.tagTemplate = (values) => {
               const selectedOptions = [];

               values.forEach((val) => {
                  const $formItem = $$(ids.formItem) ?? $$(_ui.id);

                  selectedOptions.push($formItem.getList().getItem(val));
               });

               let vals = selectedOptions;

               if (field.getSelectedOptions)
                  vals = field.getSelectedOptions(field, selectedOptions);

               const items = [];

               vals.forEach((val) => {
                  let hasCustomColor = "";
                  let optionHex = "";

                  if (field.settings.hasColors && val.hex) {
                     hasCustomColor = "hascustomcolor";
                     optionHex = `background: ${val.hex};`;
                  }

                  const text = val.text ? val.text : val.value;

                  items.push(
                     `<span class="webix_multicombo_value ${hasCustomColor}" style="${optionHex}" optvalue="${val.id}"><span>${text}</span><span class="webix_multicombo_delete" role="button" aria-label="Remove item"></span></span>`
                  );
               });

               return items.join("");
            };

            break;

         case "checkbox":
            // radio element could not be empty options
            _ui.options.push({
               id: "temp",
               value: this.label("Option"),
            });

            break;
      }

      return super.ui(_ui);
   }

   getValue(rowData) {
      const field = this.view.field(),
         $formItem = $$(this.ids.formItem);

      return field.getValue($formItem, rowData);
   }
};
