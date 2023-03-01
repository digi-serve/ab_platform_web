const ABProcessTriggerTimerCore = require("../../../core/process/tasks/ABProcessTriggerTimerCore.js");

const START_URL = "/process/timer/#id#/start";
const STOP_URL = "/process/timer/#id#/stop";

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABProcessTriggerTimer extends ABProcessTriggerTimerCore {
   /**
    * @method save()
    * persist this instance of ABObject with it's parent ABApplication
    * @return {Promise}
    */
   save() {
      return (
         Promise.resolve()
            .then(() => super.save())
            // Restart the timer
            .then((result) => {
               return this.AB.Network.put({
                  url: (this.isEnabled ? START_URL : STOP_URL).replace(
                     "#id#",
                     this.id
                  ),
               });
            })
      );
   }
};
