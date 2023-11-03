/**
 * webixResources.js
 * This file should include all extra webix resources (components, locales, etc.)
 * This will be bundeled by webpack into a single file and loaded as a dynamic
 * import after webix is loaded.
 *
 * Notes:
 * - use `webpackMode: "eager"` comment to include the dynamic import in this
 *   package
 * - use unminified js - webpack will handle minifying in production mode,
 *   and will create sourcemaps to help when debugging
 */

// CSS
import "./components/gantt/gantt.min.css";
import "./components/reports/reports.min.css";
import "./components/query/query.min.css";
import "./components/scheduler/scheduler.min.css";
import "./components/querybuilder/querybuilder.min.css";
import "./components/hint/hint.css";

// Components
import(
   /* webpackMode: "eager" */
   "./components/gantt/gantt.js"
).then((gantt) => (window.gantt = gantt));
import "./components/hint/hint.js";
import(
   /* webpackMode: "eager" */
   "./components/kanban/kanban.js"
).then((kanban) => (window.kanban = kanban));
import(
   /* webpackMode: "eager" */
   "./components/pivot/pivot.js"
).then((pivot) => (window.pivot = pivot));
import "./components/query/query.js";
// Should use webix/query, querybuilder no longer maintained
// But we still use this in some places (processing record rules, etc)
import "./components/querybuilder/querybuilder.js";
import(
   /* webpackMode: "eager" */
   "./components/reports/reports.js"
).then((report) => (window.reports = report));
import(
   /* webpackMode: "eager" */
   "./components/scheduler/scheduler.js"
).then((scheduler) => (window.scheduler = scheduler));

// Extras
import "./extras/tinymce";

// Locales
import "./locales/th-TH.js";
