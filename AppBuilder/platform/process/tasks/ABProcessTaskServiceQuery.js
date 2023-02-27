const ABProcessTaskServiceQueryCore = require("../../../core/process/tasks/ABProcessTaskServiceQueryCore.js");

const ABQLManager = require("../../ql/ABQLManager.js");

module.exports = class ABProcessTaskServiceQuery extends (
   ABProcessTaskServiceQueryCore
) {
   constructor(attributes, process, AB) {
      super(attributes, process, AB);
   }

   ABQLManager() {
      return ABQLManager;
   }

   warnings() {
      // first get all our embedded QL Command warnings
      let qlWarnings = [];
      if (this.qlObj) {
         qlWarnings = qlWarnings.concat(this.qlObj.warnings());
      }
      // run the QL Warnings through our .warningMessage() to get a message
      // that includes this task's name:
      qlWarnings.forEach((w) => {
         if (w?.message) this.warningMessage(w.message);
      });
      let myWarnings = super.warnings();
      return myWarnings.filter((w) => w); // filter out any undefined.
   }

   warningsEval() {
      super.warningsEval();
      if (this.qlObj) {
         this.qlObj.warningsEval();
      } else {
         this.warningMessage(`has no Query defined.`);
      }

      if (!this.name) {
         this.warningMessage("does not have a name.", {
            attributes,
         });
      }

      let hasSave = false;
      let curr = this.qlObj;
      while (curr) {
         if (curr.key === "row_save" || curr.key === "set_save") {
            hasSave = true;
            curr = null; // just stop here.
         } else {
            curr = curr.next;
         }
      }

      if (!hasSave) {
         this.warningMessage("requires at least one Save operation.");
      }
   }
};
