// import ABApplication from "./ABApplication"
// const ABApplication = require("./ABApplication"); // NOTE: change to require()
const ABProcessTaskEmailCore = require("../../../core/process/tasks/ABProcessTaskEmailCore.js");

module.exports = class ABProcessTaskEmail extends ABProcessTaskEmailCore {
   ////
   //// Process Instance Methods
   ////

   warningsEval() {
      super.warningsEval();

      // check for warnings:

      if (!this.subject) {
         this.warningMessage("is missing a subject");
      }

      if (!this.message) {
         this.warningMessage("is missing a message");
      }

      this.verifySetting("to");
      this.verifySetting("from");
      this.verifyNextLane("to");
      if (this.from == "0") {
         let thisLane = this.myLane();
         if (!thisLane) {
            this.warningMessage(
               "can not resolve the lane participant for [.from] field."
            );
         }
      }
      this.verifyRoleAccount("to", "toUsers");
      this.verifyRoleAccount("from", "fromUsers");
   }

   /**
    * @method verifySetting()
    * make sure the given field key has a value assigned.
    * @param {string} key
    *        the property of this object to check. (to, from)
    */
   verifySetting(key) {
      if (this[key] == "") {
         this.warningMessage(`does not have a [${key}] setting.`);
      }
   }

   /**
    * @method verifyNextLane()
    * make sure we can access a Lane for the given property key.
    * The "to" field can reference the "Next Participant". This checks to
    * see if we can reference a lane for the next task.
    * @param {string} key
    *        the property that has the value for Next Participant. [to]
    */
   verifyNextLane(key) {
      if (this[key] === "0") {
         // Next Participant
         // we need to resolve our next task and see if we can pull the participant info from it.

         let nextTasks = this.process.connectionNextTask(this);
         let nextLanesResolved = true;
         nextTasks.forEach((t) => {
            let lane = t.myLane();
            if (!lane) {
               nextLanesResolved = false;
            }
         });
         if (!nextLanesResolved || nextTasks.length == 0) {
            this.warningMessage(
               `can not resolve next lane participant for [${key}] field.`
            );
         }
      }
   }

   /**
    * @method verifyRoleAccount()
    * Check to see if the provided property is set to use a Role/Account for
    * the email, and make sure there are values set for what is chosen.
    * @param {string} key
    *        the property we are currently validating.
    * @param {string} valKey
    *        the property that contains the specific value object.
    */
   verifyRoleAccount(key, valKey) {
      if (this[key] == "1") {
         if (this[valKey]) {
            if (this[valKey].useRole) {
               if (this[valKey].role.length == 0) {
                  this.warningMessage(`can not resolve [${key}] Role setting.`);
               }
            }
            if (this[valKey].useAccount) {
               if (this[valKey].account.length == 0) {
                  this.warningMessage(
                     `can not resolve [${key}] Account setting.`
                  );
               }
            }
            // TODO:
            // if (this[valKey].userFields.length > 0) {
            //    // how to know if this is a problem?
            // }
         }
      }
   }
};
