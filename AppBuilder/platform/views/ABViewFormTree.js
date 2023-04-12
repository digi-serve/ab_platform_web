const ABViewFormTreeCore = require("../../core/views/ABViewFormTreeCore");
const ABViewFormTreeComponent = require("./viewComponent/ABViewFormTreeComponent");

module.exports = class ABViewFormTree extends ABViewFormTreeCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component() {
      return new ABViewFormTreeComponent(this);
   }
};
