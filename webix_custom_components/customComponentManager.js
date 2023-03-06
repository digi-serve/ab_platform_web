/*
 * Custom Component Manager
 * Make sure our {ABComponent}s are initialized with our custom
 * Webix Components.
 */

// Import our Custom Components here:
var componentList = [
   require("./activelist"),
   require("./countfooter"),
   require("./datetimepicker"),
   require("./editlist"),
   require("./edittree"),
   require("./editunitlist"),
   require("./focusableTemplate"),
   require("./formioPreview"),
   require("./numbertext"),
   require("./timepicker"),
   require("./totalfooter"),
   require("./treesuggest"),
   // require('./savablelayout')
];

module.exports = class ABCustomComponentManager {
   constructor() {}

   initComponents(App) {
      App.custom = App.custom || {};

      componentList.forEach((Component) => {
         var component = new Component(App);
         App.custom[component.key] = component;
      });

      // Transition to v2:
      App.AB.custom = App.custom;
   }
};
