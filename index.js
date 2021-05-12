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

// Make sure webix is global object
if (!window.webix) {
   window.webix = webix;
}

Bootstrap.init().catch((err) => {
   var errorMSG = err.toString();

   Bootstrap.alert({
      type: "alert-error",
      title: "Error initializing Portal:",
      text: errorMSG,
   });

   Bootstrap.error(err);
});
