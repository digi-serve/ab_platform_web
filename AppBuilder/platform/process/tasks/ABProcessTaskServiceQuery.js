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
};
