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
    * @return {obj} UI component
    */
   component() {
      return new ABViewFormItemComponent(this);
   }

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
