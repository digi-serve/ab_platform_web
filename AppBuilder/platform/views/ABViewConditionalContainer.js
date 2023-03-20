const ABViewConditionalContainerCore = require("../../core/views/ABViewConditionalContainerCore");
const ABViewConditionalContainerComponent = require("./viewComponent/ABViewConditionalContainerComponent");

module.exports = class ABViewConditionalContainer extends (
   ABViewConditionalContainerCore
) {
   /**
    * @function component()
    * return a UI component based upon this view.
    * @param {obj} v1App
    * @return {obj} UI component
    */
   component(v1App) {
      let component = new ABViewConditionalContainerComponent(this);

      // if this is our v1Interface
      if (v1App) {
         const newComponent = component;
         component = {
            ui: component.ui(),
            init: (options, accessLevel) => {
               return newComponent.init(this.AB, accessLevel);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
      }

      return component;
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

      if (!this.settings.filterConditions) {
         this.warningsMessage("has no filter conditions set");
      }
   }
};
