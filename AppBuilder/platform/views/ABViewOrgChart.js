const ABViewOrgChartCore = require("../../core/views/ABViewOrgChartCore");
const ABViewOrgChartComponent = require("./viewComponent/ABViewOrgChartComponent");

module.exports = class ABViewOrgChart extends ABViewOrgChartCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewOrgChartComponent(this);
   }

   fromValues(values) {
      super.fromValues(values);
      // this.refreshData();
   }
};
