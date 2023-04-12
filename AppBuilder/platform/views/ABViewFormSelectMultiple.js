const ABViewFormSelectMultipleCore = require("../../core/views/ABViewFormSelectMultipleCore");
const ABViewFormSelectMultipleComponent = require("./viewComponent/ABViewFormSelectMultipleComponent");

module.exports = class ABViewFormSelectMultiple extends (
   ABViewFormSelectMultipleCore
) {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewFormSelectMultipleComponent(this);
   }
};
