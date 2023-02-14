const ABViewFormItemComponent = require("./ABViewFormItemComponent");

module.exports = class ABViewFormCheckboxComponent extends (
   ABViewFormItemComponent
) {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewFormCheckbox_${baseView.id}`, ids);
   }

   ui() {
      return super.ui({
         view: "checkbox",
      });
   }
};
