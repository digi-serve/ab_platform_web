// const ABViewComponent = require("./ABViewComponent").default;
import ABViewComponent from "./ABViewComponent";

let L = null;

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

export default class ABViewGanttComponent extends ABViewComponent {
   constructor(baseView, idBase) {
      idBase = idBase || `ABViewGantt_${baseView.id}`;

      super(baseView, idBase, {
         menu: "",
         gantt: "",
      });

      this.view = baseView;
      this.AB = this.view.AB;

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

      this.ganttElement = {
         isExistsTask: (taskId) => {
            const localService = $$(this.ids.gantt).getService("local");
            if (!localService) return false;

            const tasksData = localService.tasks();
            if (!tasksData || !tasksData.exists) return false;

            return tasksData.exists(taskId);
         },
         removeTask: (taskId) => {
            if (!this.ganttElement.isExistsTask(taskId)) return;

            const opsService = $$(this.ids.gantt).getService("operations");
            if (!opsService) return;

            return opsService.removeTask(taskId);
         },
      };

      if (!L) {
         L = (...params) => {
            return this.AB.Multilingual.label(...params);
         };
      }
   }

   ui() {
      const ids = this.ids;
      const _this = this;

      return {
         id: ids.component,
         rows: [
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
                           value: L("Day"),
                        },
                        {
                           id: "week",
                           value: L("Week"),
                        },
                        {
                           id: "month",
                           value: L("Month"),
                        },
                        {
                           id: "year",
                           value: L("Year"),
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
                           const DC = _this.CurrentDatacollection;
                           if (!DC) return [];

                           // if (DC.dataStatus != DC.dataStatusFlag.initialized) {
                           //    await DC.loadData().catch((err) => {
                           //       console.error(err);
                           //    });
                           // }
                           return (DC.getData() || []).map((d, indx) =>
                              _this.convertFormat(d, indx)
                           );
                        }
                        links() {
                           return Promise.resolve([]);
                        }
                        async addTask(obj, index, parent) {
                           if (!_this.pendingAdds[obj.id]) {
                              _this.pendingAdds[obj.id] = _this.taskAdd(obj);
                           }
                           const newTask = await _this.pendingAdds[obj.id];
                           delete _this.pendingAdds[obj.id];
                           return {
                              id: (newTask || {}).id,
                           };
                        }
                        async updateTask(id, obj) {
                           await _this.taskUpdate(obj.id, obj);
                           return {};
                        }
                        async removeTask(id) {
                           await _this.taskRemove(id);
                           return {};
                        }
                     },
                  ],
               ]),
            },
         ],
      };
   }

   async init(AB) {
      this.AB = AB;

      // #HACK!: as of webix v.8.1.1 there is a visual glitch of the Gantt
      // object if you replace a gantt widget with a new definition (like in
      // the ABDesigner you can switch from Gantt1 to Gantt2 in the object
      // workspace).  In that one case, the menu would disappear even though
      // the data is present.  So this makes sure the menu is shown
      const $menu = $$(this.ids.menu);
      if ($menu) {
         $menu.showItem("day");
      }
   }

   /**
    * @method CurrentDatacollection()
    * A helper to return the current ABDataCollection we are working with.
    * @return {ABDataCollection}
    */
   get CurrentDatacollection() {
      let DC = super.CurrentDatacollection;
      if (!DC) {
         DC = this._tempDC;
      }
      return DC;
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
   convertFormat(row, index = null) {
      const data = {};
      row = row || {};

      if (!this.StartDateField || (!this.EndDateField && !this.DurationField))
         return data;

      const currDate = new Date();
      data["id"] = row.id || row.uuid;
      data["type"] = "task";
      data["parent"] = 0;
      data["open"] = true;
      // define label
      data["text"] = this.TitleField
         ? row[this.TitleField.columnName] || ""
         : this.CurrentObject.displayData(row);
      data["start_date"] = row[this.StartDateField.columnName] || currDate;
      data["progress"] = this.ProgressField
         ? parseFloat(row[this.ProgressField.columnName] || 0)
         : 0;

      if (this.NotesField)
         data["details"] = row[this.NotesField.columnName] || "";

      if (this.EndDateField)
         data["end_date"] = row[this.EndDateField.columnName] || currDate;

      if (this.DurationField)
         data["duration"] = row[this.DurationField.columnName] || 1;

      // Default values
      if (!data["end_date"] && !data["duration"]) {
         data["end_date"] = currDate;
         data["duration"] = 1;
      }

      if (index != null) data["order"] = index;

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

      if (this.TitleField)
         patch[this.TitleField.columnName] = task["text"] || "";

      if (this.StartDateField)
         patch[this.StartDateField.columnName] = task["start_date"];

      if (this.ProgressField)
         patch[this.ProgressField.columnName] = parseFloat(
            task["progress"] || 0
         );

      if (this.NotesField) patch[this.NotesField.columnName] = task["details"];

      if (this.EndDateField)
         patch[this.EndDateField.columnName] = task["end_date"];

      if (this.DurationField)
         patch[this.DurationField.columnName] = task["duration"];

      return patch;
   }

   /**
    * @method objectLoad
    * @param {ABObject} object
    */
   objectLoad(object) {
      super.objectLoad(object);

      const baseView = this.view;

      if (object) {
         this.TitleField = object.fieldByID(baseView.settings.titleFieldID);
         this.StartDateField = object.fieldByID(
            baseView.settings.startDateFieldID
         );
         this.EndDateField = object.fieldByID(baseView.settings.endDateFieldID);
         this.DurationField = object.fieldByID(
            baseView.settings.durationFieldID
         );
         this.ProgressField = object.fieldByID(
            baseView.settings.progressFieldID
         );
         this.NotesField = object.fieldByID(baseView.settings.notesFieldID);
      }
   }

   /**
    * @method datacollectionLoad
    * @param {ABDatacollection} datacollection
    */
   datacollectionLoad(datacollection) {
      super.datacollectionLoad(datacollection);

      let DC = this.CurrentDatacollection;
      if (!DC && datacollection) {
         // NOTE: this can happen in the ABDesigner object workspace.
         // we send in a temp DC with no .id
         this._tempDC = datacollection;
         DC = datacollection;
      }

      // NOTE: keep .objectLoad() before any .initData() is called.
      this.objectLoad(DC.datasource);

      const eventNames = ["create", "update", "delete", "initializedData"];

      eventNames.forEach((e) => {
         if (e in DC._events) return;

         switch (e) {
            case "delete":
               this.eventAdd({
                  emitter: DC,
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
                  emitter: DC,
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

   setScale(scale) {
      const ganttElem = $$(this.ids.gantt);
      if (!ganttElem) return;

      const ganttData = ganttElem.getService("local");
      if (!ganttData) return;

      let newScales = [];

      switch (scale) {
         case "day":
            newScales = [YEAR_SCALE, MONTH_SCALE, DAY_SCALE];
            break;
         case "week":
            newScales = [YEAR_SCALE, MONTH_SCALE, WEEK_SCALE];
            break;
         case "month":
            newScales = [YEAR_SCALE, MONTH_SCALE];
            break;
         case "year":
            newScales = [YEAR_SCALE];
            break;
      }

      const currScale = ganttElem.getService("local").getScales(),
         start = webix.Date.add(this.originalStartDate, -1, scale, true),
         end = webix.Date.add(this.originalEndDate, 1, scale, true);

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
      const datacollection = this.view.datacollection;

      this.datacollectionLoad(datacollection);
      datacollection.loadData(0);

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

      try {
         // this method is being used in MyBackend addTask() method
         // On Webix documents, the method addTask() have to return the added object so we have to pass the data we add through this method.
         return await this.CurrentObject?.model().create(patch);
      } catch (e) {
         webix.alert({
            title: L("Error Saving Item"),
            ok: L("Okay"),
            text: L("Unable to save this item."),
         });
         this.AB.notify.developer(e, {
            context: "ABViewGantt:taskAdd(): Error Saving Item",
            patch,
         });
         throw e;
      }
   }

   async taskRemove(rowId) {
      try {
         // this method is being used in MyBackend removeTask() method
         // On Webix documents, the method removeTask() return {} (an empty object) so we return {} in removeTask() instead.
         await this.CurrentObject.model().delete(rowId);
      } catch (e) {
         webix.alert({
            title: L("Error Removing Item"),
            ok: L("Okay"),
            text: L("Unable to remove this item."),
         });
         this.AB.notify.developer(e, {
            context: "ABViewGantt:taskRemove(): Error Removing Item",
            rowId,
         });
         throw e;
      }
   }

   async taskUpdate(rowId, updatedTask) {
      const patch = this.convertValues(updatedTask);
      try {
         // this method is being used in MyBackend updateTask() method
         // On Webix documents, the method updateTask() return {} (an empty object) so we return {} in updateTask() instead.
         await this.CurrentObject.model().update(rowId, patch);
      } catch (e) {
         webix.alert({
            title: L("Error Updating Item"),
            ok: L("Okay"),
            text: L("Unable to update this item."),
         });
         this.AB.notify.developer(e, {
            context: "ABViewGantt:taskUpdate(): Error Updating Item",
            patch,
         });
         throw e;
      }
   }
}
