import { JSDOM } from "jsdom";
import webix from "./_mock/webix";
import webixElement from "./_mock/webix_element";

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
