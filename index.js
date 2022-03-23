io.sails.reconnection = true;
// {bool}
// by default, sails.io will not reconnect.  setting this to true will
// tell it to auto reconnect.
// NOTE: this is usually TOO LATE in the boot up process to set this
// value.  The index.ejs file should have this as a parameter to the
// <script> tag that loads the socket library.
// (see api_sails/views/site/index.ejs)
// I'm including this here more for documentation purposes.

// Include these .css and .js files as part of our bundle.
/* eslint-disable no-unused-vars */
import cssLoader from "./styles/loader.css";

import webix from "./js/webix/webix.js";
import webixCSS from "./js/webix/webix.css";

import cssUI from "./styles/ui.css";

// NOTE: keep Font Awesome AFTER webix css so webix wont
// override our icon styles
import cssFontAwesome from "./styles/font-awesome.min.css";
/* eslint-enable no-unused-vars */

import Bootstrap from "./init/Bootstrap.js";
// Bootstrap is responsible for initializing the platform.

// Import webix components
const gantt = require("./js/webix/components/gantt/gantt.min.js");
import ganttCSS from "./js/webix/components/gantt/gantt.css";

import kanban from "./js/webix/components/kanban/kanban.js";
import pivot from "./js/webix/components/pivot/pivot.js";
import report from "./js/webix/components/reports/reports.js";
// import querybuilder from "./js/webix/components/querybuilder/querybuilder.js";
import queryCSS from "./js/webix/components/query/query.css";
const query = require("./js/webix/components/query/query.js");

// Make sure webix is global object
if (!window.webix) {
   window.webix = webix;
}

window.gantt = gantt;
window.query = query;

Bootstrap.init().catch((err) => {
   var errorMSG = err.toString();

   Bootstrap.alert({
      type: "alert-error",
      title: "Error initializing Portal:",
      text: errorMSG,
   });

   Bootstrap.error(err);
});

export default Bootstrap;
