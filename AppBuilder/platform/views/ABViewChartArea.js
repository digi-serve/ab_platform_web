const ABViewChartAreaCore = require("../../core/views/ABViewChartAreaCore");
const ABViewChartAreaComponent = require("./viewComponent/ABViewChartAreaComponent");

module.exports = class ABViewChartArea extends ABViewChartAreaCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewChartAreaComponent(this);
   }
};
