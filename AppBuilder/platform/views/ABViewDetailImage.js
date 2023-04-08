const ABViewDetailImageCore = require("../../core/views/ABViewDetailImageCore");
const ABViewDetailImageComponent = require("./viewComponent/ABViewDetailImageComponent");

module.exports = class ABViewDetailImage extends ABViewDetailImageCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewDetailImageComponent(this);
   }
};
