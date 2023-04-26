const ABViewDetailCustomCore = require("../../core/views/ABViewDetailCustomCore");
const ABViewDetailCustomComponent = require("./viewComponent/ABViewDetailCustomComponent");

module.exports = class ABViewDetailCustom extends ABViewDetailCustomCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewDetailCustomComponent(this);
   }
};
