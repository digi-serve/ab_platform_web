const ABViewDetailCheckboxCore = require("../../core/views/ABViewDetailCheckboxCore");
const ABViewDetailCheckboxComponent = require("./viewComponent/ABViewDetailCheckboxComponent");

module.exports = class ABViewDetailCheckbox extends ABViewDetailCheckboxCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewDetailCheckboxComponent(this);
   }
};
