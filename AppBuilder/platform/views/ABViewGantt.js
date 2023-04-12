import ABViewGanttComponent from "./viewComponent/ABViewGanttComponent";

const ABViewGanttCore = require("../../core/views/ABViewGanttCore");

export default class ABViewGantt extends ABViewGanttCore {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues);
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewGanttComponent(this);
   }

   warningsEval() {
      super.warningsEval();

      let DC = this.datacollection;
      if (!DC) {
         this.warningsMessage(
            `can't resolve it's datacollection[${this.settings.dataviewID}]`
         );
      } else {
         if (!this.settings.startDateFieldID) {
            this.warningsMessage(`doesn't have a start date field set.`);
         } else {
            let field = DC.datasource?.fieldByID(
               this.settings.startDateFieldID
            );
            if (!field) {
               this.warningsMessage(
                  `can't lookup field: startDate[${this.settings.startDateFieldID}]`
               );
            }
         }
      }
   }
}
