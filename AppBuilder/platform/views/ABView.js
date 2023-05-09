const ABViewCore = require("../../core/views/ABViewCore.js");
const ABViewComponent = require("./viewComponent/ABViewComponent").default;

module.exports = class ABView extends ABViewCore {
   // constructor(attributes, application, parent) {
   //    super(attributes, application, parent);
   // }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewComponent(this);
   }

   /*
    * @method componentList
    * return the list of components available on this view to display in the editor.
    * @param {bool} isEdited  is this component currently in the Interface Editor
    * @return {array} of ABView objects.
    */
   componentList(isEdited) {
      // views not allowed to drop onto this View:
      var viewsToIgnore = [
         "view",
         "page",
         "formpanel",
         "viewcontainer",
         // not allowed Detail's widgets
         "detailcheckbox",
         "detailcustom",
         "detailconnect",
         "detailimage",
         "detailselectivity",
         "detailtext",
         "detailtree",
         // not allowed Form's widgets
         "button",
         "checkbox",
         "connect",
         "datepicker",
         "fieldcustom",
         "textbox",
         "numberbox",
         "selectsingle",
         "selectmultiple",
         "formtree",
         "fieldreadonly",
         // not allowed Chart's Widgets
         "pie",
         "bar",
         "line",
         "area",
         // not allowed Report page
         "report",
         "reportPage",
         "reportPanel",
      ];

      var allComponents = this.application.viewAll(); // ABViewManager.allViews();
      var allowedComponents = allComponents.filter((c) => {
         return viewsToIgnore.indexOf(c.common().key) == -1;
      });

      return allowedComponents;
   }

   changePage(pageId) {
      this.emit("changePage", pageId);
   }

   warningsAll() {
      // report both OUR warnings, and any warnings from any of our fields
      var allWarnings = super.warningsAll();
      this.views().forEach((v) => {
         allWarnings = allWarnings.concat(v.warningsAll());
      });

      (this.pages?.() || []).forEach((p) => {
         allWarnings = allWarnings.concat(p.warningsAll());
      });

      return allWarnings.filter((w) => w);
   }

   warningsEval() {
      super.warningsEval();

      let allViews = this.views();

      (this.__missingViews || []).forEach((id) => {
         this.warningsMessage(`references unknown View[${id}]`);
      });

      allViews.forEach((v) => {
         v.warningsEval();
      });

      // if a datacollection is specified, verify it can be accessed.
      if (this.settings.dataviewID) {
         let dc = this.datacollections || this.datacollection;
         if (!dc) {
            this.warningsMessage(
               `references unknown dataviewID[${this.settings.dataviewID}]`
            );
         }
      }
   }

   warningsMessage(msg, data = {}) {
      let message = `${this.key}[${this.name}]: ${msg}`;
      this._warnings.push({ message, data });
   }
};
