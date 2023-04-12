const ABViewReportsManagerCore = require("../../core/views/ABViewReportsManagerCore");
const ABViewReportsManagerComponent = require("./viewComponent/ABViewReportsManagerComponent");

module.exports = class ABViewReportsManager extends ABViewReportsManagerCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   //
   //	Editor Related
   //

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewReportsManagerComponent(this);
   }
};
