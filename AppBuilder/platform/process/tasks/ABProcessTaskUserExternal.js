// import ABApplication from "./ABApplication"
// const ABApplication = require("./ABApplication"); // NOTE: change to require()
const ABProcessTaskUserExternalCore = require("../../../core/process/tasks/ABProcessTaskUserExternalCore.js");

module.exports = class ABProcessTaskUserExternal extends (
   ABProcessTaskUserExternalCore
) {
   constructor(attributes, process, AB) {
      super(attributes, process, AB);

      this.AB.on("ab.inbox.update", (item) => {
         this.AB.Network.put(
            {
               url: `/process/inbox/${item.uuid}`,
               data: { response: "external" },
            },
            {
               key: "inbox.update",
               context: { uuid: item.uuid, unitID: item.uuid },
            }
         );
      });
   }
};
