const ABViewFormSelectSingleCore = require("../../core/views/ABViewFormSelectSingleCore");
const ABViewFormSelectSingleComponent = require("./viewComponent/ABViewFormSelectSingleComponent");

module.exports = class ABViewFormSelectSingle extends (
   ABViewFormSelectSingleCore
) {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewFormSelectSingleComponent(this);
   }
};
