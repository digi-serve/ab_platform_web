const ABViewFormNumberCore = require("../../core/views/ABViewFormNumberCore");
const ABViewFormNumberComponent = require("./viewComponent/ABViewFormNumberComponent");

module.exports = class ABViewFormNumber extends ABViewFormNumberCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewFormNumberComponent(this);
   }
};
