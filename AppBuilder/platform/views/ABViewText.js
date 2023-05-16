const ABViewTextCore = require("../../core/views/ABViewTextCore");

const ABViewTextComponent = require("./viewComponent/ABViewTextComponent");

module.exports = class ABViewText extends ABViewTextCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component(parentId) {
      return new ABViewTextComponent(this, parentId);
   }
};
