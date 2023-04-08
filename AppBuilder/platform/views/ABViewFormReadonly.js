const ABViewFormReadonlyCore = require("../../core/views/ABViewFormReadonlyCore");
const ABViewFormReadonlyComponent = require("./viewComponent/ABViewFormReadonlyComponent");

module.exports = class ABViewFormReadonly extends ABViewFormReadonlyCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewFormReadonlyComponent(this);
   }
};
