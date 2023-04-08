const ABViewGridCore = require("../../core/views/ABViewGridCore");
import ABViewGridComponent from "./viewComponent/ABViewGridComponent";
import ABViewGridFilter from "./viewProperties/ABViewPropertyFilterData";
const ABViewPropertyLinkPage =
   require("./viewProperties/ABViewPropertyLinkPage").default;

export default class ABViewGrid extends ABViewGridCore {
   /**
    * @param {obj} values  key=>value hash of ABView values
    * @param {ABApplication} application the application object this view is under
    * @param {ABViewWidget} parent the ABViewWidget this view is a child of. (can be null)
    */
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   ///
   /// Instance Methods
   ///

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      // filter property
      this.filterHelper.fromSettings(this.settings.gridFilter);
   }

   propertyGroupByList(ids, groupBy) {
      let colNames = groupBy || [];
      if (typeof colNames == "string") {
         colNames = colNames.split(",");
      }

      let options = $$(ids.groupBy).getList().data.find({});

      $$(ids.groupByList).clearAll();
      colNames.forEach((colName) => {
         let opt = options.filter((o) => o.id == colName)[0];
         if (opt) {
            $$(ids.groupByList).add(opt);
         }
      });
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewGridComponent(this);
   }

   get filterHelper() {
      if (this.__filterHelper == null) {
         this.__filterHelper = new ABViewGridFilter(
            this.AB,
            `${this.id}_filterHelper`
         );
      }

      return this.__filterHelper;
   }

   get linkPageHelper() {
      if (this.__linkPageHelper == null)
         this.__linkPageHelper = new ABViewPropertyLinkPage();

      return this.__linkPageHelper;
   }

   warningsEval() {
      super.warningsEval();
      let origWS = this.warningsSilent;
      this.warningsSilent = true;
      let DC = this.datacollection;
      this.warningsSilent = origWS;
      if (!DC) {
         this.warningsMessage(
            `can't resolve it's datacollection[${this.settings.dataviewID}]`
         );
      }
   }
}
