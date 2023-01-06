const ABViewFormItemComponent = require("./ABViewFormItemComponent");
const NumberTextInput = require("../../../../webix_custom_components/numbertext");

module.exports = class ABViewFormNumberComponent extends (
   ABViewFormItemComponent
) {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewFormNumber_${baseView.id}`;
      super(baseView, idBase, {});
   }

   ui() {
      const _ui = super.ui();

      const viewType = this.view.settings.isStepper
         ? "counter"
         : new NumberTextInput(this.AB._App).key;

      _ui.id = this.ids.component;
      _ui.view = viewType;
      _ui.type = "number";
      _ui.validate = (val) => {
         return !isNaN(val * 1);
      };

      return _ui;
   }
};
