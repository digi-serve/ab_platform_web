const ABViewDataviewCore = require("../../core/views/ABViewDataviewCore");
const ABViewDataviewComponent = require("./viewComponent/ABViewDataviewComponent");

const ABViewDataviewDefaults = ABViewDataviewCore.defaultValues();

const L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewDataview extends ABViewDataviewCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      this.settings.detailsPage =
         this.settings.detailsPage ?? ABViewDataviewDefaults.detailsPage;
      this.settings.editPage =
         this.settings.editPage ?? ABViewDataviewDefaults.editPage;
      this.settings.detailsTab =
         this.settings.detailsTab ?? ABViewDataviewDefaults.detailsTab;
      this.settings.editTab =
         this.settings.editTab ?? ABViewDataviewDefaults.editTab;
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj } v1App
    * @param {string} idPrefix - define to support in 'Datacollection' widget
    *
    * @return {obj } UI component
    */
   component() {
      return new ABViewDataviewComponent(this);
   }
};
