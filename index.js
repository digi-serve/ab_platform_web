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
import "./js/webix/webix.min.css";

import "./styles/ui.css";

import performance from "./utils/performance";
performance.init();

// NOTE: keep Font Awesome AFTER webix css so webix wont
// override our icon styles
import "./styles/font-awesome.min.css";

import Bootstrap from "./init/Bootstrap.js";
// Bootstrap is responsible for initializing the platform.

// Import webix dynamically so we load it before we load other files that need it
import(
   /* webpackChunkName: "webix" */
   /* webpackPreload: true */
   "./js/webix/webix.min.js"
).then((webix) => {
   // Make sure webix is global object
   window.webix = webix;
   // Now load additional webix resources
   import(
      /* webpackChunkName: "webix.resources" */
      /* webpackPreload: true */
      "./js/webix/webixResources"
   );

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
});
