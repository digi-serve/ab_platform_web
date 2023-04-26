const ABViewCSVExporterCore = require("../../core/views/ABViewCSVExporterCore");
const ABViewCSVExporterComponent = require("./viewComponent/ABViewCSVExporterComponent");

module.exports = class ABViewCSVExporter extends ABViewCSVExporterCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj } UI component
    */
   component() {
      return new ABViewCSVExporterComponent(this);
   }

   warningsEval() {
      super.warningsEval();

      let DC = this.datacollection;
      if (!DC) {
         this.warningsMessage(
            `can't resolve it's datacollection[${this.settings.dataviewID}]`
         );
      }
   }
};
