const ABViewFormJsonCore = require("../../core/views/ABViewFormJsonCore");
const ABViewFormJsonComponent = require("./viewComponent/ABViewFormJsonComponent");

module.exports = class ABViewFormJson extends ABViewFormJsonCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewFormJsonComponent(this);
   }
};
