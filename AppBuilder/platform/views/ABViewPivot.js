const ABViewPivotCore = require("../../core/views/ABViewPivotCore");
const ABViewPivotComponent = require("./viewComponent/ABViewPivotComponent");

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewPivot extends ABViewPivotCore {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues);
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewPivotComponent(this);
   }

   warningsEval() {
      super.warningsEval();

      let DC = this.datacollection;
      if (!DC) {
         this.warningsMessage(
            `can't resolve it's datacollection[${this.settings.dataviewID}]`
         );
      }
   }
};
