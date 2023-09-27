const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewSchedulerComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewScheduler_${baseView.id}`,
         Object.assign(
            {
               scheduler: "",
            },
            ids
         )
      );
   }

   ui() {
      const ids = this.ids;
      const ab = this.AB;
      const self = this;
      const abWebix = this.AB.Webix;
      const settings = this.settings;
      const dc = this.datacollection;
      const fieldName = dc?.datasource.fieldByID(
         settings.dataviewFields.name
      )?.columnName;
      const fieldStart = dc?.datasource.fieldByID(
         settings.dataviewFields.start
      )?.columnName;
      const fieldEnd = dc?.datasource.fieldByID(
         settings.dataviewFields.end
      )?.columnName;
      const fieldAllDay = dc?.datasource.fieldByID(
         settings.dataviewFields.allDay
      )?.columnName;
      const fieldRepeat = dc?.datasource.fieldByID(
         settings.dataviewFields.repeat
      )?.columnName;
      const fieldCalendar = dc?.datasource.fieldByID(
         settings.dataviewFields.calendar
      )?.columnName;
      const fieldEventColor = dc?.datasource.fieldByID(
         settings.dataviewFields.color
      )?.columnName;
      const fieldNotes = dc?.datasource.fieldByID(
         settings.dataviewFields.notes
      )?.columnName;
      const fieldOriginID = dc?.datasource.fieldByID(
         settings.dataviewFields.originID
      )?.columnName;
      const fieldSectionID = dc?.datasource.fieldByID(
         settings.dataviewFields.sectionID
      )?.columnName;
      const fieldUnitID = dc?.datasource.fieldByID(
         settings.dataviewFields.unitID
      )?.columnName;
      const dcCalendar = ab.datacollectionByID(
         this.settings.calendarDataviewID
      );
      const fieldTitle = dcCalendar?.datasource.fieldByID(
         settings.calendarDataviewFields.title
      )?.columnName;
      const fieldCalendarColor = dcCalendar?.datasource.fieldByID(
         settings.calendarDataviewFields.color
      )?.columnName;
      const fieldActive = dcCalendar?.datasource.fieldByID(
         settings.calendarDataviewFields.active
      )?.columnName;
      const timelineOptions = [];

      Object.keys(settings.timeline).forEach((key) => {
         if (settings.timeline[key] === 0) return;

         timelineOptions.push({
            id: `${key}`,
            value: `${key.charAt(0).toUpperCase()}${key.slice(1)}`,
         });
      });

      const _ui = super.ui([
         {
            padding: 6,
            cols: [
               { view: "label", width: 150, label: "Export events data to: " },
               {
                  view: "button",
                  width: 100,
                  value: this.label("Excel"),
                  hidden: settings.export.excel === 0,
                  click: () => {
                     abWebix.toExcel(ids.scheduler);
                  },
               },
               {
                  view: "button",
                  width: 100,
                  value: this.label("CSV"),
                  hidden: settings.export.csv === 0,
                  click: () => {
                     abWebix.toCSV(ids.scheduler);
                  },
               },
               {
                  view: "button",
                  width: 100,
                  value: this.label("PDF"),
                  hidden: settings.export.pdf === 0,
                  click: () => {
                     abWebix.toPDF(ids.scheduler, { autowidth: true });
                  },
               },
               {},
            ],
         },
         {
            id: ids.scheduler,
            view: "scheduler",
            date: new Date(),
            readonly: settings.readonly === 1,
            timeline: settings.timeline.timeline === 1,
            override: new Map([
               [
                  scheduler.services.Backend,
                  class MyBackend extends reports.services.Backend {
                     async addCalendar(obj) {
                        if (dcCalendar == null) return {};

                        const data = {};

                        data[fieldTitle] = obj.text;
                        data[fieldCalendarColor] = obj.color;
                        data[fieldActive] = obj.active;

                        const response = await dcCalendar.model.create(data);

                        return { id: response.id };
                     }
                     async addEvent(obj) {
                        if (dc == null) return {};

                        const data = {};

                        data[fieldName] = obj.text;
                        data[fieldStart] = new Date(obj.start_date);
                        data[fieldEnd] = new Date(obj.end_date);
                        data[fieldAllDay] = obj.all_day;
                        data[fieldRepeat] = obj.recurring;
                        data[fieldCalendar] = obj.calendar;
                        data[fieldEventColor] = obj.color;
                        data[fieldSectionID] = obj.section || "No Section";
                        data[fieldUnitID] = obj.units || "No Unit";
                        data[fieldNotes] = obj.details;
                        data[fieldOriginID] = obj.origin_id;

                        const response = await dc.model.create(data);

                        return { id: response.id };
                     }
                     async calendars() {
                        // if we manage a datacollection, then make sure it has started
                        // loading it's data when we are showing our component.
                        if (dcCalendar == null) return [];

                        await self.waitInitializingDCEvery(1000, dcCalendar);

                        return dcCalendar.getData().map((e) => {
                           return {
                              id: e.id,
                              text: e[fieldTitle],
                              color: e[fieldCalendarColor],
                              active: e[fieldActive],
                           };
                        });
                     }
                     async events(params) {
                        // if we manage a datacollection, then make sure it has started
                        // loading it's data when we are showing our component.
                        if (dc == null) return [];

                        await self.waitInitializingDCEvery(1000, dc);

                        const units = await this.units();
                        const sections = await this.sections();

                        return dc.getData().map((e) => {
                           let unitID = units.find(
                              (u) => u.id === e[fieldUnitID]
                           )?.id;
                           let sectionID = sections.find(
                              (s) => s.id === e[fieldSectionID]
                           )?.id;

                           if (sectionID == null || unitID == null) {
                              sectionID = sectionID || "No Section";
                              unitID = unitID || "No Unit";

                              // const data = {};

                              // data[fieldSectionID] = sectionID;
                              // data[fieldUnitID] = unitID;

                              // dc.model.update(e.id, data);
                           }

                           return {
                              id: e.id,
                              text: e[fieldName],
                              start_date: abWebix.Date.dateToStr(
                                 "%Y-%m-%d %H:%i:%s"
                              )(e[fieldStart]),
                              end_date: abWebix.Date.dateToStr(
                                 "%Y-%m-%d %H:%i:%s"
                              )(e[fieldEnd]),
                              all_day: e[fieldAllDay],
                              recurring: e[fieldRepeat],
                              calendar: e[fieldCalendar],
                              color: e[fieldEventColor],
                              section: sectionID,
                              units: unitID,
                              details: e[fieldNotes],
                              origin_id: e[fieldOriginID],
                           };
                        });
                     }
                     async removeCalendar(id) {
                        await dcCalendar.model.delete(id);
                     }
                     async removeEvent(id) {
                        await dc.model.delete(id);
                     }
                     async sections() {
                        return [
                           { text: "No Section", id: "No Section" },
                        ].concat(
                           settings.timelineSectionList.split(", ").map((e) => {
                              return {
                                 id: e,
                                 text: e,
                              };
                           })
                        );
                     }
                     async units() {
                        return [{ id: "No Unit", value: "No Unit" }].concat(
                           settings.unitList.split(", ").map((e) => {
                              return {
                                 id: e,
                                 value: e,
                              };
                           })
                        );
                     }
                     async updateCalendar(id, obj) {
                        if (dcCalendar == null) return {};

                        const data = {};

                        data[fieldTitle] = obj.text;
                        data[fieldCalendarColor] = obj.color;
                        data[fieldActive] = obj.active;

                        await dcCalendar.model.update(id, data);
                     }
                     async updateEvent(id, obj, mode, date) {
                        if (dc == null) return {};

                        const data = {};

                        data[fieldName] = obj.text;
                        data[fieldStart] = new Date(obj.start_date);
                        data[fieldEnd] = new Date(obj.end_date);
                        data[fieldAllDay] = obj.all_day;
                        data[fieldRepeat] = obj.recurring;
                        data[fieldCalendar] = obj.calendar;
                        data[fieldEventColor] = obj.color;
                        data[fieldSectionID] = obj.section || "No Section";
                        data[fieldUnitID] = obj.units || "No Unit";
                        data[fieldNotes] = obj.details;
                        data[fieldOriginID] = obj.origin_id;

                        await dc.model.update(id, data);
                     }
                  },
               ],
               [
                  scheduler.views["bars/nav"],
                  class CustomBarsView extends scheduler.views["bars/nav"] {
                     config() {
                        const uiNav = super.config();
                        uiNav.width = 160;
                        uiNav.options = timelineOptions;
                        return uiNav;
                     }
                  },
               ],
               [
                  scheduler.views["bars/navpopup"],
                  class CustomNavPopupView extends scheduler.views[
                     "bars/navpopup"
                  ] {
                     config() {
                        const uiNavPopup = super.config();

                        const options = timelineOptions.map((e) =>
                           Object.assign({ icon: `shi-${e.id}` }, e)
                        );

                        if (this.app.config.calendars)
                           uiNavPopup.body.body.rows[0].data = options;
                        else uiNavPopup.body.data = options;

                        return uiNavPopup;
                     }
                  },
               ],
               [
                  scheduler.views["modes/day/multiday"],
                  class CustomModesDayMultiday extends scheduler.views[
                     "modes/day/multiday"
                  ] {
                     LimitData(data) {
                        // Get an error the case when the data parameter is undefined.
                        super.LimitData(data || []);
                     }
                  },
               ],
            ]),
         },
      ]);

      delete _ui.type;

      return _ui;
   }

   async onShow() {
      super.onShow();

      const ids = this.ids;
      const $component = $$(ids.component);

      if ($component != null && !this.__isShowing) {
         this.__isShowing = true;

         $component.reconstruct();
      }
   }
};
