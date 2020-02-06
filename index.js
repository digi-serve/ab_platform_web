import loaderCSS from "./styles/loader.css";

import Config from "./config/Config.js";
import initAttach from "./init/initAttach.js";
import initConfig from "./init/initConfig.js";
import initDiv from "./init/initDiv.js";
import initResources from "./init/initResources.js";
// import Webix from "./js/webix/webix.js";

initDiv
   .init(Config)
   .then(() => {
      return initConfig.init(Config);
   })
   .then(() => {
      return initResources.init(Config);
   })
   .then(() => {
      return initAttach.init(Config);
      // after initAttach the UI.init() routine handles the remaining
      // bootup/display process.
   })
   .catch((err) => {
      // stop loading :
      console.error(err);
   });

// test
