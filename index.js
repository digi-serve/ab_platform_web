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
import "./styles/loader.css";

import webix from "./js/webix/webix.min.js";
import "./js/webix/webix.min.css";

import "./styles/ui.css";

import "./init/sentry.js";

// NOTE: keep Font Awesome AFTER webix css so webix wont
// override our icon styles
import "./styles/font-awesome.min.css";
/* eslint-enable no-unused-vars */

import Bootstrap from "./init/Bootstrap.js";
// Bootstrap is responsible for initializing the platform.

// Import webix components
import * as gantt from "./js/webix/components/gantt/gantt.min.js";
import "./js/webix/components/gantt/gantt.min.css";

import * as kanban from "./js/webix/components/kanban/kanban.min.js";
import * as pivot from "./js/webix/components/pivot/pivot.min.js";
import * as report from "./js/webix/components/reports/reports.min.js";
import "./js/webix/components/reports/reports.min.css";
import "./js/webix/components/query/query.min.css";
import query from "./js/webix/components/query/query.min.js";
import * as scheduler from "./js/webix/components/scheduler/scheduler.min.js";
import "./js/webix/components/scheduler/scheduler.min.css";

// Make sure webix is global object
if (!window.webix) {
   window.webix = webix;
}

window.gantt = gantt;
window.kanban = kanban;
window.pivot = pivot;
window.reports = report;
window.scheduler = scheduler;

Bootstrap.init().catch((err) => {
   // This is a known error that has already been handled.
   if (err.code == "ENODEFS") return;

   var errorMSG = err.toString();

   Bootstrap.alert({
      type: "alert-error",
      title: "Error initializing Portal:",
      text: errorMSG,
   });

   Bootstrap.error(err);
});

export default Bootstrap;
