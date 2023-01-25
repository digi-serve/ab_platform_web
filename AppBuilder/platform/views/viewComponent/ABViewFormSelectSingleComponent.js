const ABViewFormItemComponent = require("./ABViewFormItemComponent");
const ABViewFormSelectSingleCore = require("../../../core/views/ABViewFormSelectSingleCore");

const ABViewFormSelectSinglePropertyComponentDefaults =
   ABViewFormSelectSingleCore.defaultValues();

const L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewFormSelectSingleComponentComponent extends (
   ABViewFormItemComponent
) {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewFormSelectSingle_${baseView.id}`;
      super(baseView, idBase, {});
   }

   ui() {
      const _ui = super.ui(),
         field = this.view.field(),
         settings = this.view.settings;

      _ui.view =
         settings.type ?? ABViewFormSelectSinglePropertyComponentDefaults.type;

      let options = [];

      if (field?.key == "user") options = field.getUsers();
      else if (field)
         options = field.settings.options ?? settings.options ?? [];
      else options = settings.options ?? [];

      _ui.id = this.ids.component;

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
      } else {
         _ui.options = options.map((opt) => {
            return {
               id: opt.id,
               value: opt.text || opt.value,
            };
         });
      }

      // radio element could not be empty options
      if (_ui.view == "radio" && _ui.options.length < 1) {
         _ui.options.push({
            id: "temp",
            value: L("Option"),
         });
      }

      return _ui;
   }
};
