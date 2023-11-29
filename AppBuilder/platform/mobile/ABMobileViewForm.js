const ABMobileViewFormCore = require("../../core/mobile/ABMobileViewFormCore");

const ABMobileViewFormButton = require("./ABMobileViewFormButton");

module.exports = class ABMobileViewForm extends ABMobileViewFormCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @method refreshDefaultButton()
    * On the ABDesigner once a Form Field is added/removed from a form, we want
    * to make sure the default Form Button is pushed down to the bottom of the
    * list of form Items.
    * @param {obj} ids
    *        The id hash of the webix widgets that show the fields.
    * @return {ABMobileViewFormButton}
    */
   refreshDefaultButton(ids) {
      // If default button is not exists, then skip this
      let defaultButton = this.views(
         (v) => v instanceof ABMobileViewFormButton && v.settings.isDefault
      )[0];

      // Add a default button
      if (defaultButton == null) {
         defaultButton = ABMobileViewFormButton.newInstance(
            this.application,
            this
         );
         defaultButton.settings.isDefault = true;
      }
      // Remove default button from array, then we will add it to be the last item later (.push)
      else {
         this._views = this.views((v) => v.id != defaultButton.id);
      }

      // Calculate position Y of the default button
      let yList = this.views().map((v) => (v.position.y || 0) + 1);
      yList.push(this._views.length || 0);
      yList.push($$(ids.fields).length || 0);
      let posY = Math.max(...yList);

      // Update to be the last item
      defaultButton.position.y = posY;

      // Keep the default button is always the last item of array
      this._views.push(defaultButton);

      return defaultButton;
   }

   warningsEval() {
      super.warningsEval();

      if (!this.settings.dataviewID) {
         this.warningsMessage(`does not have a DataCollection assigned.`);
      } else {
         let DC = this.datacollection;
         if (!DC) {
            this.warningsMessage(
               `references an unknown DataCollection [${this.settings.dataviewID}].`
            );
         }
      }
   }
};
