const ABViewDetailTextCore = require("../../core/views/ABViewDetailTextCore");
const ABViewDetailTextComponent = require("./viewComponent/ABViewDetailTextComponent");

module.exports = class ABViewDetailText extends ABViewDetailTextCore {
   /**
    * @param {obj} values  key=>value hash of ABView values
    * @param {ABApplication} application the application object this view is under
    * @param {ABView} parent the ABView this view is a child of. (can be null)
    */
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewDetailTextComponent(this);
   }
};
