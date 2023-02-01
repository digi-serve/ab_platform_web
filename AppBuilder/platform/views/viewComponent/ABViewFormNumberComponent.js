const ABViewFormItemComponent = require("./ABViewFormItemComponent");
const NumberTextInput = require("../../../../webix_custom_components/numbertext");

module.exports = class ABViewFormNumberComponent extends (
   ABViewFormItemComponent
) {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewFormNumber_${baseView.id}`, ids);
   }

   ui() {
      return super.ui({
         view: this.settings.isStepper
            ? "counter"
            : new NumberTextInput(this.AB._App).key,
         type: "number",
         validate: (val) => !isNaN(val * 1),
      });
   }
};
