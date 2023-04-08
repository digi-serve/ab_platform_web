const ABViewChartLineCore = require("../../core/views/ABViewChartLineCore");
const ABViewChartLineComponent = require("./viewComponent/ABViewChartLineComponent");

module.exports = class ABViewChartLine extends ABViewChartLineCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewChartLineComponent(this);
   }
};
