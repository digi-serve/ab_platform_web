// import ABApplication from "./ABApplication"
// const ABApplication = require("./ABApplication"); // NOTE: change to require()
const ABProcessTriggerCore = require("../../../core/process/tasks/ABProcessTriggerCore.js");

let L = (...params) => AB.Label()("", ...params);

module.exports = class ABProcessTrigger extends ABProcessTriggerCore {
   propertyIDs(id) {
      return {
         name: `${id}_name`,
      };
   }

   /**
    * propertiesShow()
    * display the properties panel for this Process Element.
    * @param {string} id
    *        the webix $$(id) of the properties panel area.
    */
   propertiesShow(id) {
      var ids = this.propertyIDs(id);

      var ui = {
         id: id,
         rows: [
            {
               id: ids.name,
               view: "text",
               label: L("Name"),
               name: "name",
               value: this.name,
            },
         ],
      };

      webix.ui(ui, $$(id));

      $$(id).show();
   }

   /**
    * propertiesStash()
    * pull our values from our property panel.
    * @param {string} id
    *        the webix $$(id) of the properties panel area.
    */
   propertiesStash(id) {
      var ids = this.propertyIDs(id);
      this.name = this.property(ids.name);
   }
};
