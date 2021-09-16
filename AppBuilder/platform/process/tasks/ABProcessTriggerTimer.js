const ABProcessTriggerTimerCore = require("../../../core/process/tasks/ABProcessTriggerTimerCore.js");

const START_URL = "/process/timer/#id#/start";
const STOP_URL = "/process/timer/#id#/stop";

let L = (...params) => AB.Label("", ...params);

module.exports = class ABProcessTriggerTimer extends ABProcessTriggerTimerCore {
   propertyIDs(id) {
      return {
         name: `${id}_name`,
         repeatEvery: `${id}_repeatEvery`,
         repeatTime: `${id}_repeatTime`,
         repeatOnPanel: `${id}_repeatOnPanel`,
         repeatDaily: `${id}_repeatDaily`,
         repeatWeekly: `${id}_repeatWeekly`,
         repeatMonthly: `${id}_repeatMonthly`,
         isEnabled: `${id}_isEnabled`,
      };
   }

   /**
    * @function propertiesShow()
    * display the properties panel for this Process Element.
    * @param {string} id
    *        the webix $$(id) of the properties panel area.
    */
   propertiesShow(id) {
      let ids = this.propertyIDs(id);
      let defaultValues = ABProcessTriggerTimer.defaults();

      let dayOptions = [];
      for (let day = 1; day <= 31; day++) {
         dayOptions.push({
            id: day,
            value: day,
         });
      }
      // dayOptions.push({
      //    id: "L",
      //    value: "Last"
      // });

      const LABEL_WIDTH = 120;
      let ui = {
         view: "form",
         id: id,
         elements: [
            {
               id: ids.name,
               view: "text",
               label: L("Name"),
               labelWidth: LABEL_WIDTH,
               name: "name",
               value: this.name,
            },
            {
               id: ids.repeatEvery,
               view: "richselect",
               name: "repeatEvery",
               label: L("Repeat every"),
               labelWidth: LABEL_WIDTH,
               value: this.repeatEvery || defaultValues.repeatEvery,
               options: [
                  { id: "daily", value: L("Daily") },
                  {
                     id: "weekly",
                     value: L("Weekly"),
                  },
                  {
                     id: "monthly",
                     value: L("Monthly"),
                  },
               ],
               on: {
                  onChange: (repeatEvery) => {
                     $$(ids.repeatOnPanel).showBatch(repeatEvery);
                  },
               },
            },
            {
               id: ids.repeatTime,
               view: "datepicker",
               name: "repeatTime",
               label: L("Time"),
               labelWidth: LABEL_WIDTH,
               value: this.repeatTime || defaultValues.repeatTime,
               timepicker: true,
               type: "time",
               multiselect: false,
            },
            {
               view: "multiview",
               id: ids.repeatOnPanel,
               cells: [
                  {
                     view: "radio",
                     id: ids.repeatDaily,
                     label: " ",
                     labelWidth: LABEL_WIDTH,
                     batch: "daily",
                     vertical: true,
                     value: this.repeatDaily || defaultValues.repeatDaily,
                     options: [
                        { id: "day", value: L("Day") },
                        { id: "weekday", value: L("Weekday") },
                     ],
                  },
                  {
                     view: "multiselect",
                     id: ids.repeatWeekly,
                     labelWidth: LABEL_WIDTH,
                     label: L("Every week on:"),
                     batch: "weekly",
                     value: this.repeatWeekly || defaultValues.repeatWeekly,
                     options: [
                        {
                           id: "SUN",
                           value: L("Sunday"),
                        },
                        {
                           id: "MON",
                           value: L("Monday"),
                        },
                        {
                           id: "TUE",
                           value: L("Tuesday"),
                        },
                        {
                           id: "WED",
                           value: L("Wednesday"),
                        },
                        {
                           id: "THU",
                           value: L("Thursday"),
                        },
                        {
                           id: "FRI",
                           value: L("Friday"),
                        },
                        {
                           id: "SAT",
                           value: L("Saturday"),
                        },
                     ],
                  },
                  {
                     view: "layout",
                     batch: "monthly",
                     rows: [
                        {
                           id: ids.repeatMonthly,
                           view: "richselect",
                           labelWidth: LABEL_WIDTH,
                           label: L("Monthly on day"),
                           options: dayOptions,
                           value:
                              this.repeatMonthly || defaultValues.repeatMonthly,
                        },
                     ],
                  },
               ],
            },
            {
               id: ids.isEnabled,
               view: "switch",
               label: L("Enable"),
               labelWidth: LABEL_WIDTH,
               value: this.isEnabled,
            },
         ],
      };

      webix.ui(ui, $$(id));

      $$(id).show();
      $$(ids.repeatOnPanel).showBatch(
         this.repeatEvery || defaultValues.repeatEvery
      );
   }

   /**
    * @function propertiesStash()
    * pull our values from our property panel.
    * @param {string} id
    *        the webix $$(id) of the properties panel area.
    */
   propertiesStash(id) {
      let ids = this.propertyIDs(id);
      this.name = $$(ids.name).getValue();
      this.repeatEvery = $$(ids.repeatEvery).getValue();
      this.repeatTime = $$(ids.repeatTime).getValue();
      this.repeatDaily = $$(ids.repeatDaily).getValue();
      this.repeatWeekly = $$(ids.repeatWeekly).getValue();
      this.repeatMonthly = $$(ids.repeatMonthly).getValue();
      this.isEnabled = $$(ids.isEnabled).getValue();
      this.triggerKey =
         this.triggerKey == null || this.triggerKey == "triggerKey.??"
            ? `timer.${this.id || AB.uuid()}`
            : this.triggerKey;
   }

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
               return OP.Comm.Service.put({
                  url: (this.isEnabled ? START_URL : STOP_URL).replace(
                     "#id#",
                     this.id
                  ),
               });
            })
      );
   }
};
