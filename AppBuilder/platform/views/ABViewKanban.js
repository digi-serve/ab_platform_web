const ABViewKanbanCore = require("../../core/views/ABViewKanbanCore");
const ABViewKanbanComponent = require("./viewComponent/ABViewKanbanComponent");

const ABViewPropertyLinkPage =
   require("./viewProperties/ABViewPropertyLinkPage").default;

export default class ABViewKanban extends ABViewKanbanCore {
   //
   //	Editor Related
   //

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */

   component() {
      return new ABViewKanbanComponent(this);
   }

   get linkPageHelper() {
      return (this.__linkPageHelper =
         this.__linkPageHelper || new ABViewPropertyLinkPage());
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
}
