const ABViewFormItemCore = require("../../core/views/ABViewFormItemCore");
const ABViewFormItemComponent = require("./viewComponent/ABViewFormItemComponent");

const ABViewFormFieldPropertyComponentDefaults =
   ABViewFormItemCore.defaultValues();

module.exports = class ABViewFormItem extends ABViewFormItemCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   static get componentUI() {
      return ABViewFormItemComponent;
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false) {
      let component = new ABViewFormItemComponent(this);

      // if this is our v1Interface
      if (v1App) {
         var newComponent = component;
         component = {
            ui: newComponent.ui(),
            init: (options, accessLevel) => {
               return newComponent.init(this.AB, accessLevel);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
      }

      return component;
   }

   // componentV1(App) {
   //    // setup 'label' of the element
   //    var form = this.parentFormComponent(),
   //       field = this.field(),
   //       label = "";

   //    var settings = {};
   //    if (form) settings = form.settings;

   //    var _ui = {
   //       labelPosition: settings.labelPosition,
   //       labelWidth: settings.labelWidth,
   //       label: label,
   //    };

   //    if (field != null) {
   //       _ui.name = field.columnName;

   //       // default value
   //       var data = {};
   //       field.defaultValue(data);
   //       if (data[field.columnName]) _ui.value = data[field.columnName];

   //       if (settings.showLabel == true) {
   //          _ui.label = field.label;
   //       }

   //       if (
   //          field.settings.required == true ||
   //          this.settings.required == true
   //       ) {
   //          _ui.required = 1;
   //       }

   //       if (this.settings.disable == 1) {
   //          _ui.disabled = true;
   //       }

   //       // add data-cy to form element for better testing code
   //       _ui.on = {
   //          onAfterRender() {
   //             if (this.getList) {
   //                var popup = this.getPopup();
   //                if (!popup) return;
   //                this.getList().data.each((option) => {
   //                   if (!option) return;
   //                   var node = popup.$view.querySelector(
   //                      "[webix_l_id='" + option.id + "']"
   //                   );
   //                   if (!node) return;
   //                   node.setAttribute(
   //                      "data-cy",
   //                      `${field.key} options ${option.id} ${field.id} ${form.id}`
   //                   );
   //                });
   //             }
   //             this.getInputNode().setAttribute(
   //                "data-cy",
   //                `${field.key} ${field.columnName} ${field.id} ${form.id}`
   //             );
   //          },
   //       };

   //       // this may be needed if we want to format data at this point
   //       // if (field.format) data = field.format(data);

   //       _ui.validate = (val, data, colName) => {
   //          let validator = this.AB.Validation.validator();

   //          field.isValidData(data, validator);

   //          return validator.pass();
   //       };
   //    }

   //    var _init = () => {};

   //    return {
   //       ui: _ui,
   //       init: _init,
   //    };
   // }

   /**
    * @method parentFormUniqueID
    * return a unique ID based upon the closest form object this component is on.
    * @param {string} key  The basic id string we will try to make unique
    * @return {string}
    */
   parentFormUniqueID(key) {
      var form = this.parentFormComponent();
      var uniqueInstanceID;
      if (form) {
         uniqueInstanceID = form.uniqueInstanceID;
      } else {
         uniqueInstanceID = webix.uid();
      }

      return key + uniqueInstanceID;
   }
};
