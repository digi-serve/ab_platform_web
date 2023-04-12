const ABViewWidgetCore = require("../../core/views/ABViewWidgetCore");

const ABPropertyComponentDefaults = ABViewWidgetCore.defaultValues();

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewWidget extends ABViewWidgetCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @function component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(App) {
      let base = super.component(App);

      base.onShow = (viewId) => {
         let dv = this.datacollection; // get from a function or a (get) property
         if (dv && dv.dataStatus == dv.dataStatusFlag.notInitial) {
            // load data when a widget is showing
            dv.loadData();
         }
      };

      return base;
   }
};
