const ABViewCSVImporterCore = require("../../core/views/ABViewCSVImporterCore");
const ABViewCSVImporterComponent = require("./viewComponent/ABViewCSVImporterComponent");

module.exports = class ABViewCSVImporter extends ABViewCSVImporterCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component(idBase) {
      return new ABViewCSVImporterComponent(this, idBase);
   }

   warningsEval() {
      super.warningsEval();

      let DC = this.datacollection;
      if (!DC) {
         this.warningsMessage(
            `can't resolve it's datacollection[${this.settings.dataviewID}]`
         );
      }

      if (!this.settings.availableFieldIds?.length) {
         this.warningsMessage("has no fields set for matching import data");
      }
   }
};
