const ABViewConditionalContainerCore = require("../../core/views/ABViewConditionalContainerCore");
const ABViewConditionalContainerComponent = require("./viewComponent/ABViewConditionalContainerComponent");

module.exports = class ABViewConditionalContainer extends (
   ABViewConditionalContainerCore
) {
   /**
    * @function component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewConditionalContainerComponent(this);
   }

   async save() {
      const viewIf = this.views().find((v) => v.name === "If");
      const viewElse = this.views().find((v) => v.name === "Else");
      const pendingSave = [];

      if (viewIf) pendingSave.push(viewIf.save());

      if (viewElse) pendingSave.push(viewElse.save());

      await Promise.all(pendingSave);

      await super.save();
   }

   warningsEval() {
      super.warningsEval();

      let DC = this.datacollection;
      if (!DC) {
         this.warningsMessage(
            `can't resolve it's datacollection[${this.settings.dataviewID}]`
         );
      }

      if (
         !this.settings.filterConditions ||
         this.settings.filterConditions?.rules?.length == 0
      ) {
         this.warningsMessage("has no filter conditions set");
      }
   }
};
