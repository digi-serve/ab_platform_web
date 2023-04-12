import ABViewDataFilterCore from "../../core/views/ABViewDataFilterCore";
import ABViewDataFilterComponent from "./viewComponent/ABViewDataFilterComponent";

export default class ABViewDataFilter extends ABViewDataFilterCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component() {
      return new ABViewDataFilterComponent(this);
   }

   warningsEval() {
      super.warningsEval();

      let DC = this.datacollection;
      if (!DC) {
         this.warningsMessage(
            `can't resolve it's datacollection[${this.settings.dataviewID}]`
         );
      } else {
         if (this.settings.viewType == "connected") {
            const object = DC.datasource;
            const [field] = object.fields(
               (f) => f.columnName === this.settings.field
            );
            if (!field) {
               this.warningsMessage(`can't resolve field reference`);
            }
         }
      }
   }
}
