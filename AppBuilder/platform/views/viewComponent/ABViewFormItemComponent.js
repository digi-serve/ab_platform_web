let L = (...params) => AB.Multilingual.label(...params);

const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewFormItemComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      var base = idBase || `ABViewFormComponent_${baseView.id}`;
      super(baseView, base, ids);

      this.view = baseView;
      this.settings = baseView.settings;
      this.AB = baseView.AB;
   }

   ui() {
      // setup 'label' of the element

      var form = this.view.parentFormComponent(),
         field = this.view.field(),
         label = "";

      var settings = {};
      if (form) settings = form.settings;

      var _ui = {
         // TODO: We have to refactor becuase we need "id" on the very top level for each viewComponent.
         id: `${this.ids.component}_temp`,
         labelPosition: settings.labelPosition,
         labelWidth: settings.labelWidth,
         label: label,
      };

      if (field != null) {
         _ui.name = field.columnName;

         // default value
         var data = {};
         field.defaultValue(data);
         if (data[field.columnName]) _ui.value = data[field.columnName];

         if (settings.showLabel == true) {
            _ui.label = field.label;
         }

         if (
            field.settings.required == true ||
            this.settings.required == true
         ) {
            _ui.required = 1;
         }

         if (this.settings.disable == 1) {
            _ui.disabled = true;
         }

         // add data-cy to form element for better testing code
         _ui.on = {
            onAfterRender() {
               if (this.getList) {
                  var popup = this.getPopup();
                  if (!popup) return;
                  this.getList().data.each((option) => {
                     if (!option) return;
                     var node = popup.$view.querySelector(
                        "[webix_l_id='" + option.id + "']"
                     );
                     if (!node) return;
                     node.setAttribute(
                        "data-cy",
                        `${field.key} options ${option.id} ${field.id} ${
                           form ? form.id : "nf"
                        }`
                     );
                  });
               }
               this.getInputNode?.().setAttribute?.(
                  "data-cy",
                  `${field.key} ${field.columnName} ${field.id} ${
                     form ? form.id : "nf"
                  }`
               );
            },
         };

         // this may be needed if we want to format data at this point
         // if (field.format) data = field.format(data);

         _ui.validate = (val, data, colName) => {
            let validator = this.AB.Validation.validator();

            field.isValidData(data, validator);

            return validator.pass();
         };
      }
      return _ui;
   }

   init(AB) {
      this.AB = AB;
      return Promise.resolve();
   }
};
