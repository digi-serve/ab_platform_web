const ABViewFormCustomCore = require("../../core/views/ABViewFormCustomCore");
const ABViewFormCustomComponent = require("./viewComponent/ABViewFormCustomComponent");

module.exports = class ABViewFormCustom extends ABViewFormCustomCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewFormCustomComponent(this);
   }
};
