const ABViewSchedulerCore = require("../../core/views/ABViewSchedulerCore");
const ABViewSchedulerComponent = require("./viewComponent/ABViewSchedulerComponent");

module.exports = class ABViewScheduler extends ABViewSchedulerCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewSchedulerComponent(this);
   }

   warningsEval() {
      super.warningsEval();
   }
};
