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
    * @param {obj} App
    *
    * @return {obj} UI component
    */
   component(v1App) {
      let component = new ABViewDetailTextComponent(this);

      // if this is our v1Interface
      if (v1App) {
         var newComponent = component;
         component = {
            ui: newComponent.ui(),
            init: (options, accessLevel) => {
               return newComponent.init(this.AB, accessLevel);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
      }

      return component;
   }
};
