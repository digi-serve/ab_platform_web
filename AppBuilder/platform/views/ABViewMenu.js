const ABViewMenuCore = require("../../core/views/ABViewMenuCore");
const ABViewMenuComponent = require("./viewComponent/ABViewMenuComponent");

module.exports = class ABViewMenu extends ABViewMenuCore {
   /**
    * @function component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewMenuComponent(this);
   }
};
