const InsertRecordTaskCore = require("../../../core/process/tasks/ABProcessTaskServiceInsertRecordCore.js");

module.exports = class InsertRecordTask extends InsertRecordTaskCore {
   warningsEval() {
      super.warningsEval();

      if (!this.objectID) {
         this.warningMessage("has no Object set.");
      }

      const fv = Object.keys(this.fieldValues || {}) || [];
      if (fv.length == 0) {
         this.warningMessage("has no fields set");
      } else {
         let isSet = false;
         fv.forEach((f) => {
            if (
               this.fieldValues[f]?.set != "0" &&
               this.fieldValues[f]?.value != null
            ) {
               isSet = true;
            }
         });
         if (!isSet) {
            this.warningMessage("has no fields set");
         }
      }
   }
};
