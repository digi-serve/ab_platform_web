const ABViewFormItemComponent = require("./ABViewFormItemComponent");
const ABViewFormSelectMultipleCore = require("../../../core/views/ABViewFormSelectMultipleCore");

const ABViewFormSelectMultiplePropertyComponentDefaults =
   ABViewFormSelectMultipleCore.defaultValues();

const L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewFormSelectMultipleComponentComponent extends (
   ABViewFormItemComponent
) {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewFormSelectMultipleComponent_${baseView.id}`;
      super(baseView, idBase, {});
   }

   ui() {
      const _ui = super.ui(),
         field = this.view.field(),
         settings = this.view.settings;

      _ui.view =
         settings.type ??
         ABViewFormSelectMultiplePropertyComponentDefaults.type;

      let options = [];

      if (field?.key == "user") options = field.getUsers();
      else if (field)
         options = field.settings.options ?? settings.options ?? [];

      _ui.id = this.ids.component;
      _ui.options = options.map((opt) => {
         return {
            id: opt.id,
            value: opt.text,
            hex: opt.hex,
         };
      });

      switch (_ui.view) {
         case "multicombo":
            _ui.tagMode = false;
            _ui.css = "hideWebixMulticomboTag";
            _ui.tagTemplate = (values) => {
               const selectedOptions = [];
               values.forEach((val) => {
                  const $component = $$(this.ids.component) ?? $$(_ui.id);
                  selectedOptions.push($component.getList().getItem(val));
               });
               let vals = selectedOptions;
               if (field.getSelectedOptions) {
                  vals = field.getSelectedOptions(field, selectedOptions);
               }

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
               value: L("Option"),
            });
            break;
      }

      return _ui;
   }

   getValue(rowData) {
      const field = this.view.field(),
         $elem = $$(this.ids.component);

      return field.getValue($elem, rowData);
   }
};
