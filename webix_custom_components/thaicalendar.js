/*
 * Thai Calendar
 *
 * Create a custom webix component.
 *
 */

module.exports = class ABCustomThaiCalendar {
   get key() {
      return "thaicalendar";
   }

   constructor(App) {
      // App 	{obj}	our application instance object.
      // componentKey {string}	the destination key in App.custom[componentKey] for the instance of this component:

      this.view = this.key;

      const i18n = webix.i18n;

      // Our webix UI definition:
      const _ui = {
         name: this.key,
         defaults: {
            calendarHeader: function (d) {
               return `${i18n.calendar.monthFull[d.getMonth()]} ${
                  d.getFullYear() + 543
               }`;
            },
         },
      };

      if (webix.ui.calendar.$protoWait[0]._zoom_logic) {
         _ui._zoom_logic = AB.cloneDeep(
            webix.ui.calendar.$protoWait[0]._zoom_logic
         );
         _ui._zoom_logic[1] = Object.assign(_ui._zoom_logic[1], {
            _getTitle: this._getYearTitle,
         });
         _ui._zoom_logic[2] = Object.assign(_ui._zoom_logic[2], {
            _getTitle: this._getYearRangeTitle,
            _getContent: this._getYearContent,
            _setContent: this._setYear,
         });
      }

      if (webix.ui.calendar.$protoWait[0].jd) {
         _ui.jd = AB.cloneDeep(webix.ui.calendar.$protoWait[0].jd);
         _ui.jd[1] = Object.assign(_ui.jd[1], {
            Ap: this._getYearTitle,
         });
         _ui.jd[2] = Object.assign(_ui.jd[2], {
            Ap: this._getYearRangeTitle,
            Tp: this._getYearContent,
            Dp: this._setYear,
         });
      }

      // Tell Webix to create an INSTANCE of our custom component:
      webix.protoUI(_ui, webix.ui.calendar);

      webix.editors.$popup.thaidate = {
         view: "popup",
         width: 250,
         height: 250,
         padding: 0,
         body: {
            view: this.key,
            icons: true,
            borderless: true,
            timepicker: false,
         },
      };

      webix.editors.$popup.thaidatetime = {
         view: "popup",
         width: 250,
         height: 250,
         padding: 0,
         body: {
            view: this.key,
            icons: true,
            borderless: true,
            timepicker: true,
         },
      };

      webix.editors.thaidate = webix.extend(
         {
            popupType: "thaidate",
         },
         webix.editors.date
      );

      webix.editors.thaidatetime = webix.extend(
         {
            popupType: "thaidatetime",
         },
         webix.editors.date
      );
   }

   _getYearTitle(date) {
      return date.getFullYear() + 543;
   }

   _getYearRangeTitle(date, calendar) {
      let start = date.getFullYear() + 543;
      calendar._zoom_start_date = start = start - (start % 10) - 1;
      return start + " - " + (start + 10 + 1);
   }

   _getYearContent(i, calendar) {
      return calendar._zoom_start_date + i;
   }

   _setYear(next, i, calendar) {
      next.setFullYear(calendar._zoom_start_date - 543 + i);
   }
};
