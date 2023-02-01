import ABViewComponent from "./ABViewComponent";

export default class ABViewGanttComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewGantt_${baseView.id}`,
         Object.assign(
            {
               menu: "",
               gantt: "",
            },
            ids
         )
      );

      this._tempDC = null;
      // {ABDataCollection}
      // A link to a DC that was passed in.  NOTE: this is only for
      // the temp DCs created in the AppBuilder Designer and passed
      // in.  Normal DCs are handled by the default CurrentDatacollection
      // methods.

      this.TitleField = null;
      this.StartDateField = null;
      this.EndDateField = null;
      this.DurationField = null;
      this.ProgressField = null;
      this.NotesField = null;

      this.originalStartDate = null;
      this.originalEndDate = null;

      this.pendingAdds = {};
      // {Promise}  /* id : {Promise} */
      // In order to prevent a race condition where multiple adds can be
      // generated on the same item, we catch the repeats and just return
      // the same data for each.

      const idGantt = this.ids.gantt;

      this.ganttElement = {
         isExistsTask: (taskId) => {
            const localService = $$(idGantt).getService("local");
            if (!localService) return false;

            const tasksData = localService.tasks();

            if (!tasksData || !tasksData.exists) return false;

            return tasksData.exists(taskId);
         },
         removeTask: (taskId) => {
            if (!this.ganttElement.isExistsTask(taskId)) return;

            const opsService = $$(idGantt).getService("operations");

            if (!opsService) return;

            return opsService.removeTask(taskId);
         },
      };
   }

   ui() {
      const ids = this.ids;
      const self = this;
      const { YEAR_SCALE, MONTH_SCALE, DAY_SCALE } = this.getConstantScales;
      const _ui = super.ui([
         {
            cols: [
               { fillspace: true },
               {
                  view: "menu",
                  id: ids.menu,
                  layout: "x",
                  width: 300,
                  data: [
                     {
                        id: "day",
                        value: this.label("Day"),
                     },
                     {
                        id: "week",
                        value: this.label("Week"),
                     },
                     {
                        id: "month",
                        value: this.label("Month"),
                     },
                     {
                        id: "year",
                        value: this.label("Year"),
                     },
                  ],
                  on: {
                     onItemClick: (id /* , e, node */) => {
                        this.setScale(id);
                     },
                  },
               },
            ],
         },
         {
            id: ids.gantt,
            view: "gantt",
            scales: [YEAR_SCALE, MONTH_SCALE, DAY_SCALE],
            override: new Map([
               [
                  gantt.services.Backend,
                  // global webix gantt object
                  class MyBackend extends gantt.services.Backend {
                     async tasks() {
                        const DC = self.CurrentDatacollection;
                        if (!DC) return [];

                        // if (DC.dataStatus != DC.dataStatusFlag.initialized) {
                        //    await DC.loadData().catch((err) => {
                        //       console.error(err);
                        //    });
                        // }
                        return (DC.getData() || []).map((d, indx) =>
                           self.convertFormat(d, indx)
                        );
                     }
                     links() {
                        return Promise.resolve([]);
                     }
                     async addTask(obj, index, parent) {
                        if (!self.pendingAdds[obj.id]) {
                           self.pendingAdds[obj.id] = self.taskAdd(obj);
                        }
                        const newTask = await self.pendingAdds[obj.id];
                        delete self.pendingAdds[obj.id];
                        return {
                           id: (newTask || {}).id,
                        };
                     }
                     async updateTask(id, obj) {
                        return await self.taskUpdate(obj.id, obj);
                     }
                     async removeTask(id) {
                        return await self.taskRemove(id);
                     }
                  },
               ],
            ]),
         },
      ]);

      delete _ui.type;

      return _ui;
   }

   async init(AB) {
      await super.init(AB);

      // #HACK!: as of webix v.8.1.1 there is a visual glitch of the Gantt
      // object if you replace a gantt widget with a new definition (like in
      // the ABDesigner you can switch from Gantt1 to Gantt2 in the object
      // workspace).  In that one case, the menu would disappear even though
      // the data is present.  So this makes sure the menu is shown
      const $menu = $$(this.ids.menu);

      if ($menu) $menu.showItem("day");
   }

   /**
    * @method CurrentDatacollection()
    * A helper to return the current ABDataCollection we are working with.
    * @return {ABDataCollection}
    */
   get CurrentDatacollection() {
      return super.CurrentDatacollection || this._tempDC;
   }

   /**
    * @method convertFormat()
    * Convert an ABObject's row value into a gantt task data format.
    * @param {obj} row
    *        The current row of data returned from an ABObject.
    * @param {int} index
    *        The order of this task.
    * @return {obj}
    *         A key=>value hash corresponding to the gantt task that
    *         represents this row of data.
    */
   convertFormat(row = {}, index = null) {
      const data = {};
      const StartDateField = this.StartDateField;
      const EndDateField = this.EndDateField;
      const DurationField = this.DurationField;

      if (!StartDateField || (!EndDateField && !DurationField)) return data;

      const currDate = new Date();

      data["id"] = row.id || row.uuid;
      data["type"] = "task";
      data["parent"] = 0;
      data["open"] = true;

      // define label
      const TitleField = this.TitleField;
      const ProgressField = this.ProgressField;
      const NotesField = this.NotesField;

      data["text"] = TitleField
         ? row[TitleField.columnName] || ""
         : this.CurrentObject.displayData(row);
      data["start_date"] = row[StartDateField.columnName] || currDate;
      data["progress"] = ProgressField
         ? parseFloat(row[ProgressField.columnName] || 0)
         : 0;

      if (NotesField) data["details"] = row[NotesField.columnName] || "";

      if (EndDateField)
         data["end_date"] = row[EndDateField.columnName] || currDate;

      if (DurationField) data["duration"] = row[DurationField.columnName] || 1;

      // Default values
      if (!data["end_date"] && !data["duration"]) {
         data["end_date"] = currDate;
         data["duration"] = 1;
      }

      if (index) data["order"] = index;

      return data;
   }

   /**
    * @method convertValues()
    * Convert a Gantt task into a set of values for our ABObject.
    * @param {obj} task
    *        The current gantt task data.
    * @return {obj}
    *         A key=>value hash corresponding to the ABObject that
    *         is tied to this gantt.
    */
   convertValues(task) {
      const patch = {};
      const TitleField = this.TitleField;
      const StartDateField = this.StartDateField;
      const ProgressField = this.ProgressField;
      const NotesField = this.NotesField;
      const EndDateField = this.EndDateField;
      const DurationField = this.DurationField;

      if (TitleField) patch[TitleField.columnName] = task["text"] || "";

      if (StartDateField) patch[StartDateField.columnName] = task["start_date"];

      if (ProgressField)
         patch[ProgressField.columnName] = parseFloat(task["progress"] || 0);

      if (NotesField) patch[NotesField.columnName] = task["details"];

      if (EndDateField) patch[EndDateField.columnName] = task["end_date"];

      if (DurationField) patch[DurationField.columnName] = task["duration"];

      return patch;
   }

   /**
    * @method objectLoad
    * @param {ABObject} object
    */
   objectLoad(object) {
      super.objectLoad(object);

      const baseView = this.view;
      const settings = this.settings;

      if (object) {
         this.TitleField = object.fieldByID(settings.titleFieldID);
         this.StartDateField = object.fieldByID(settings.startDateFieldID);
         this.EndDateField = object.fieldByID(settings.endDateFieldID);
         this.DurationField = object.fieldByID(settings.durationFieldID);
         this.ProgressField = object.fieldByID(settings.progressFieldID);
         this.NotesField = object.fieldByID(settings.notesFieldID);
      }
   }

   /**
    * @method datacollectionLoad
    * @param {ABDatacollection} datacollection
    */
   datacollectionLoad(datacollection) {
      super.datacollectionLoad(datacollection);

      const dc = this.CurrentDatacollection || datacollection;

      if (!dc) return;

      // NOTE: this can happen in the ABDesigner object workspace.
      // we send in a temp DC with no .id
      this._tempDC = datacollection;

      // NOTE: keep .objectLoad() before any .initData() is called.
      this.objectLoad(dc.datasource);

      const eventNames = ["create", "update", "delete", "initializedData"];

      eventNames.forEach((e) => {
         if (
            e in dc._events &&
            this.__events.findIndex((eo) => eo.eventName === e) !== -1
         )
            return;

         switch (e) {
            case "delete":
               this.eventAdd({
                  emitter: dc,
                  eventName: "delete",
                  listener: (taskId) => {
                     // remove this task in gantt
                     if (this.ganttElement.isExistsTask(taskId))
                        this.ganttElement.removeTask(taskId);
                  },
               });

               break;

            default:
               this.eventAdd({
                  emitter: dc,
                  eventName: e,
                  listener: () => {
                     this.initData();
                  },
               });

               break;
         }
      });
   }

   /**
    * @function hide()
    * hide this component.
    */
   hide() {
      $$(this.ids.component)?.hide();
   }

   initData() {
      const ganttElem = $$(this.ids.gantt);

      if (!ganttElem) return;

      const dataService = ganttElem.getService("local");

      if (!dataService) return;

      const dcTasks = dataService.tasks();

      if (!dcTasks) return;

      // gantt v 8.1.1
      // Note: there is a race condition that can happen here.
      // dataService.tasks() calls the MyBackend.tasks() above which
      // returns a Promise.
      // when you call dcTasks.clearAll() before the promise
      // is resolved, the gantt internally throws an error.
      //
      // So give webix some time to internally complete it's process
      // before we do .clearAll();
      setTimeout(() => {
         dcTasks.clearAll();

         const DC = this.CurrentDatacollection;
         const gantt_data = {
            data: DC
               ? (DC.getData() || []).map((d, index) =>
                    this.convertFormat(d, index)
                 )
               : [],
         };

         // check required fields before parse
         if (this.StartDateField && (this.EndDateField || this.DurationField)) {
            dcTasks.parse(gantt_data);
         }

         // Keep original start and end dates for calculate scale to display
         const currScale = dataService.getScales();

         this.originalStartDate = currScale.start;
         this.originalEndDate = currScale.end;

         this.sort();
      }, 10);
   }

   get getConstantScales() {
      const DAY_SCALE = { unit: "day", format: "%d" },
         WEEK_SCALE = {
            unit: "week",
            format: (start) => {
               const parser = webix.Date.dateToStr("%d %M");
               const wstart = webix.Date.weekStart(start);
               const wend = webix.Date.add(
                  webix.Date.add(wstart, 1, "week", true),
                  -1,
                  "day",
                  true
               );

               return parser(wstart) + " - " + parser(wend);
            },
         },
         MONTH_SCALE = { unit: "month", format: "%F" },
         YEAR_SCALE = { unit: "year", format: "%Y" };

      return {
         DAY_SCALE,
         WEEK_SCALE,
         MONTH_SCALE,
         YEAR_SCALE,
      };
   }

   setScale(scale) {
      const ganttElem = $$(this.ids.gantt);

      if (!ganttElem) return;

      const ganttData = ganttElem.getService("local");

      if (!ganttData) return;

      const newScales = [];
      const { YEAR_SCALE, MONTH_SCALE, WEEK_SCALE, DAY_SCALE } =
         this.getConstantScales;

      switch (scale) {
         case "day":
            newScales.push(YEAR_SCALE, MONTH_SCALE, DAY_SCALE);

            break;
         case "week":
            newScales.push(YEAR_SCALE, MONTH_SCALE, WEEK_SCALE);

            break;
         case "month":
            newScales.push(YEAR_SCALE, MONTH_SCALE);

            break;
         case "year":
            newScales.push(YEAR_SCALE);

            break;
      }

      const abWebix = this.AB.Webix;
      const currScale = ganttElem.getService("local").getScales(),
         start = abWebix.Date.add(this.originalStartDate, -1, scale, true),
         end = abWebix.Date.add(this.originalEndDate, 1, scale, true);

      ganttData.setScales(
         start,
         end,
         currScale.precise,
         currScale.cellWidth,
         currScale.cellHeight,
         newScales
      );
      ganttElem.$app.refresh();
      ganttElem.getState().$batch({ top: 0, left: 0 });
   }

   /**
    * @function show()
    * Show this component.
    */
   onShow() {
      super.onShow();
      this.datacollectionLoad(this.datacollection);

      $$(this.ids.component)?.show();
   }

   sort() {
      // TODO: sorting;
      return;
      // const gantt = $$(ids.gantt).getGantt();
      // if (!gantt) return;

      // // default sort
      // const MAX_date = new Date(8640000000000000);
      // gantt.sort(function(a, b) {
      //    const aStartDate = a["start_date"],
      //       aEndDate = a["end_date"],
      //       aDuration = a["duration"] || 1,
      //       bStartDate = b["start_date"],
      //       bEndDate = b["end_date"],
      //       bDuration = b["duration"] || 1;

      //    // if no start date, then be a last item
      //    if (
      //       a[this.StartDateField.columnName] == null ||
      //       b[this.StartDateField.columnName] == null
      //    ) {
      //       return (
      //          (a[this.StartDateField.columnName] || MAX_date) -
      //          (b[this.StartDateField.columnName] || MAX_date)
      //       );
      //    } else if (aStartDate != bStartDate) {
      //       return aStartDate - bStartDate;
      //    } else if (aEndDate != bEndDate) {
      //       return aEndDate - bEndDate;
      //    } else if (aDuration != bDuration) {
      //       return bDuration - aDuration;
      //    }
      // }, false);
   }

   async taskAdd(taskData) {
      const patch = this.convertValues(taskData);
      const ab = this.AB;

      try {
         // this method is being used in MyBackend addTask() method
         // On Webix documents, the method addTask() have to return the added object so we have to pass the data we add through this method.
         return await this.CurrentObject?.model().create(patch);
      } catch (e) {
         ab.Webix.alert({
            title: this.label("Error Saving Item"),
            ok: this.label("Okay"),
            text: this.label("Unable to save this item."),
         });
         ab.notify.developer(e, {
            context: "ABViewGantt:taskAdd(): Error Saving Item",
            patch,
         });

         throw e;
      }
   }

   async taskRemove(rowId) {
      const ab = this.AB;

      try {
         // this method is being used in MyBackend removeTask() method
         // On Webix documents, the method removeTask() return {} (an empty object) so we return {} in removeTask() instead.
         await this.CurrentObject.model().delete(rowId);

         return {};
      } catch (e) {
         ab.Webix.alert({
            title: this.label("Error Removing Item"),
            ok: this.label("Okay"),
            text: this.label("Unable to remove this item."),
         });
         ab.notify.developer(e, {
            context: "ABViewGantt:taskRemove(): Error Removing Item",
            rowId,
         });

         throw e;
      }
   }

   async taskUpdate(rowId, updatedTask) {
      const patch = this.convertValues(updatedTask);
      const ab = this.AB;

      try {
         // this method is being used in MyBackend updateTask() method
         // On Webix documents, the method updateTask() return {} (an empty object) so we return {} in updateTask() instead.
         await this.CurrentObject.model().update(rowId, patch);

         return {};
      } catch (e) {
         ab.Webix.alert({
            title: this.label("Error Updating Item"),
            ok: this.label("Okay"),
            text: this.label("Unable to update this item."),
         });
         ab.notify.developer(e, {
            context: "ABViewGantt:taskUpdate(): Error Updating Item",
            patch,
         });

         throw e;
      }
   }
}
