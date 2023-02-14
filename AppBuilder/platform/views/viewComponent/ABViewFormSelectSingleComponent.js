const ABViewFormItemComponent = require("./ABViewFormItemComponent");

module.exports = class ABViewFormSelectSingleComponentComponent extends (
   ABViewFormItemComponent
) {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewFormSelectSingle_${baseView.id}`, ids);
   }

   ui() {
      const baseView = this.view;
      const field = baseView.field(),
         settings = baseView.settings;
      const options = [];

      if (field?.key === "user") options.push(...field.getUsers());
      else if (field)
         options.push(...(field.settings.options ?? settings.options ?? []));
      else options.push(...(settings.options ?? []));

      const _ui = {
         view: settings.type || baseView.constructor.defaultValues().type,
      };

      if (field?.settings.hasColors) {
         _ui.css = "combowithcolors";
         _ui.options = {
            view: "suggest",
            body: {
               view: "list",
               data: options.map((opt) => {
                  return {
                     id: opt.id,
                     value: opt.text || opt.value,
                     hex: field.settings.hasColors ? opt.hex : "",
                  };
               }),
               template: function (value) {
                  const items = [];

                  let hasCustomColor = "";
                  let optionHex = "";

                  if (value.hex) {
                     hasCustomColor = "hascustomcolor";
                     optionHex = `background: ${value.hex};`;
                  }

                  items.push(
                     `<span class="webix_multicombo_value ${hasCustomColor}" style="${optionHex}" optvalue="${value.id}"><span>${value.value}</span></span>`
                  );

                  return items.join("");
               },
            },
         };
      } else
         _ui.options = options.map((opt) => {
            return {
               id: opt.id,
               value: opt.text || opt.value,
            };
         });

      // radio element could not be empty options
      if (_ui.view === "radio" && _ui.options.length < 1)
         _ui.options.push({
            id: "temp",
            value: this.label("Option"),
         });

      return super.ui(_ui);
   }
};
