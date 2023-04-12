const ABViewListCore = require("../../core/views/ABViewListCore");
const ABViewListComponent = require("./viewComponent/ABViewListComponent");

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewList extends ABViewListCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewListComponent(this);
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
