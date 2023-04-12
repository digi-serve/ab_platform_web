const ABViewDetailSelectivityCore = require("../../core/views/ABViewDetailSelectivityCore");
const ABViewDetailSelectivityComponent = require("./viewComponent/ABViewDetailSelectivityComponent");

module.exports = class ABViewDetailSelectivity extends (
   ABViewDetailSelectivityCore
) {
   /**
    * @component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewDetailSelectivityComponent(this);
   }
};
