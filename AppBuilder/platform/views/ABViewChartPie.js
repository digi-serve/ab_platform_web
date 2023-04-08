const ABViewChartPieCore = require("../../core/views/ABViewChartPieCore");
const ABViewChartPieComponent = require("./viewComponent/ABViewChartPieComponent");

module.exports = class ABViewChartPie extends ABViewChartPieCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewChartPieComponent(this);
   }
};
