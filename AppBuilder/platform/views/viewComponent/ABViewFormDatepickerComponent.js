const ABViewFormItemComponent = require("./ABViewFormItemComponent");

module.exports = class ABViewFormDatepickerComponent extends (
   ABViewFormItemComponent
) {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewFormDatepicker_${baseView.id}`, ids);
   }

   ui() {
      const self = this;
      const field = this.view.field();

      const _ui = {
         view: "datepicker",
         suggest: {
            body: {
               view:
                  this.AB.Account?._config?.languageCode == "th"
                     ? "thaicalendar"
                     : "calendar",
               type: field.settings?.dateFormat === 1 ? "time" : "",
               timepicker:
                  field.key === "datetime" && field.settings?.timeFormat !== 1
                     ? true
                     : false,
               editable: true,
               on: {
                  onAfterDateSelect: function (date) {
                     this.getParentView().setMasterValue({
                        value: date,
                     });
                  },
                  onTodaySet: function (date) {
                     this.getParentView().setMasterValue({
                        value: date,
                     });
                  },
                  onDateClear: function (date) {
                     this.getParentView().setMasterValue({
                        value: date,
                     });
                  },
               },
            },
            on: {
               onShow: function () {
                  const text = this.getMasterValue();
                  const field = self.view.field();
                  if (!text || !field) return true;

                  const vals = {};
                  vals[field.columnName] = text;
                  const date = self.getValue(vals);

                  const $calendar = this.getChildViews()[0];
                  $calendar.setValue(date);
               },
            },
         },
      };

      if (!field) return _ui;

      // Ignore date - Only time picker
      if (field.settings?.dateFormat === 1) _ui.type = "time";

      // Date & Time picker
      if (field.key === "datetime" && field.settings?.timeFormat !== 1)
         _ui.timepicker = true;

      // allows entering characters in datepicker input, false by default
      _ui.editable = true;

      // default value
      if (_ui.value && !(_ui.value instanceof Date))
         _ui.value = new Date(_ui.value);

      // if we have webix locale set, will use the date format form there.
      if (!window.webixLocale) _ui.format = field.getFormat();

      return super.ui(_ui);
   }

   getValue(rowData) {
      const field = this.view.field();
      const text = rowData[field.columnName];
      if (!field || !text) return null;

      // Sentry Fix: caught an error where this.AB was not set, but this.view was...
      // attempt to catch this situation and post more data:
      if (!this.AB) {
         if (this.view.AB) {
            this.AB = this.view.AB;
         } else {
            let errNoAB = new Error(
               "ABViewFormDatePicerComponent:getValue(): AB was not set."
            );
            // sentry logs the console before the error, so dump the offending view here:
            console.log("view:", JSON.stringify(this.view.toObj()));
            throw errNoAB;
         }
      }
      // NOTE: if we are using the Thai language we force the format to be "%d/%m/%Y" in th-TH.js:13
      //       so we have to use that format here
      let dateVal = this.AB.Webix.Date.strToDate(field.getFormat())(text);
      if (this.AB.Account?._config?.languageCode == "th") {
         dateVal = this.AB.Webix.Date.strToDate("%j/%m/%Y")(text);
      }
      const date = dateVal;

      if (
         this.AB.Account?._config?.languageCode == "th" &&
         field.settings?.dateFormat !== 1
      )
         date.setFullYear(date.getFullYear() - 543);

      return date;
   }
};
