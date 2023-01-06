const ABViewFormItemComponent = require("./ABViewFormItemComponent");

module.exports = class ABViewFormDatepickerComponent extends (
   ABViewFormItemComponent
) {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewFormDatepicker_${baseView.id}`;
      super(baseView, idBase, {});
   }

   ui() {
      const _ui = {};
      const field = this.view.field();

      _ui.id = this.ids.component;
      _ui.view = "datepicker";
      if (!field) return _ui;

      // Ignore date - Only time picker
      if (field.settings?.dateFormat == 1) {
         _ui.type = "time";
      }

      // Date & Time picker
      if (field.key == "datetime" && field.settings?.timeFormat != 1) {
         _ui.timepicker = true;
      }

      // allows entering characters in datepicker input, false by default
      _ui.editable = true;

      // default value
      if (_ui.value && !(_ui.value instanceof Date)) {
         _ui.value = new Date(_ui.value);
      }

      // if we have webix locale set, will use the date format form there.
      if (field != null && !window.webixLocale) {
         _ui.format = field.getFormat();
      }

      return _ui;
   }
};
