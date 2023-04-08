const ABViewFormButtonCore = require("../../core/views/ABViewFormButtonCore");
const ABViewFormButtonComponent = require("./viewComponent/ABViewFormButtonComponent");

module.exports = class ABViewFormButton extends ABViewFormButtonCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewFormButtonComponent(this);
   }
};
