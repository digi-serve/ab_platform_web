const ABViewFormTextboxCore = require("../../core/views/ABViewFormTextboxCore");
const ABViewFormTextboxComponent = require("./viewComponent/ABViewFormTextboxComponent");

module.exports = class ABViewFormTextbox extends ABViewFormTextboxCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewFormTextboxComponent(this);
   }
};
