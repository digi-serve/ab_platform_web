import { JSDOM } from "jsdom";
import webix from "./_mock/webix";
import webixElement from "./_mock/webix_element";
import webixGantt from "./_mock/webix_gantt";

// Set web browser environment
const dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>");
global.window = dom.window;
global.document = dom.window.document;
global.FileReader = global.window.FileReader;
global.Blob = global.window.Blob;
global.navigator = {
   userAgent: "node.js",
};

// Set webix globally
global.$$ = webixElement;
global.webix = webix;
global.gantt = webixGantt;
class Stub {
   constructor() {}
}
global.pivot = {
   services: { Backend: Stub },
   views: { table: Stub },
};
global.reports = {
   services: { Backend: Stub, Local: Stub },
   views: {
      editor: Stub,
      "editor/common": Stub,
      "editor/data": Stub,
      table: Stub,
      toolbar: Stub,
   },
};
global.scheduler = {
   services: { Backend: Stub },
   views: {
      "bars/nav": Stub,
      "bars/navpopup": Stub,
      "modes/day/multiday": Stub,
   },
};

// These normally get set by Webpack
global.WEBPACK_MODE = "development";
global.SENTRY_DSN = false;
global.VERSION = "";
