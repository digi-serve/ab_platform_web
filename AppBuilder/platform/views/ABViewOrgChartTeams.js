const ABViewOrgChartTeamsCore = require("../../core/views/ABViewOrgChartTeamsCore");
const ABViewOrgChartTeamsComponent = require("./viewComponent/ABViewOrgChartTeamsComponent");

module.exports = class ABViewOrgChartTeams extends ABViewOrgChartTeamsCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewOrgChartTeamsComponent(this);
   }
};
