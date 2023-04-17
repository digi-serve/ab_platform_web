const ABViewChartBarCore = require("../../core/views/ABViewChartBarCore");
const ABViewChartBarComponent = require("./viewComponent/ABViewChartBarComponent");

module.exports = class ABViewChartBar extends ABViewChartBarCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewChartBarComponent(this);
   }
};
