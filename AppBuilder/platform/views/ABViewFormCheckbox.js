const ABViewFormCheckboxCore = require("../../core/views/ABViewFormCheckboxCore");
const ABViewFormCheckboxComponent = require("./viewComponent/ABViewFormCheckboxComponent");

module.exports = class ABViewFormCheckbox extends ABViewFormCheckboxCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewFormCheckboxComponent(this);
   }
};
