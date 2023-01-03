// import ABApplication from "./ABApplication"
// const ABApplication = require("./ABApplication"); // NOTE: change to require()
const ABProcessTaskEmailCore = require("../../../core/process/tasks/ABProcessTaskEmailCore.js");

module.exports = class ABProcessTaskEmail extends ABProcessTaskEmailCore {
   ////
   //// Process Instance Methods
   ////

   warningsEval() {
      super.warningsEval();
      this.onProcessReady();
   }
};
