/*
 * Bootstrap.js
 * This file drives the setup and preparation of the Web Platform.
 * It's main job is to prepare all the local Resources for operation as
 * well the main ABFactory object that will drive the rest of the applications.
 */

import events from "events";

const EventEmitter = events.EventEmitter;

import Config from "../config/Config.js";

import initConfig from "../init/initConfig.js";
import "../init/initConnectListerner.js";
import initDiv from "../init/initDiv.js";
import initUser from "../init/initUser.js";
// import initResources from "../init/initResources.js";

// import JSZipUtils from "jszip-utils/dist/jszip-utils.min.js";

// import Selectivity from "../js/selectivity/selectivity.min.js";
// import selectivityCSS from "../js/selectivity/selectivity.min.css";

import UI from "../ui/ui.js";
import ErrorNoDefsUI from "../ui/error_noDefs.js";

import performance from "../utils/performance.js";

class Bootstrap extends EventEmitter {
   constructor() {
      super();
      this.setMaxListeners(0);

      // Common Reference to Configuration Values
      this.Config = Config;

      //
      // UI Related
      //

      this._div = null;
      // {el} _div
      // the HTML element that is the where our initial [click] here button
      // should be displayed.  Our actual portal is a popup, but the base
      // <div> can be used for an embedded view.

      this._plugins = [];
      // {array} ._plugins
      // an array of the loaded plugins we need to register.

      this._ui = null;
      // {obj} ._ui
      // the Webix Object that is our UI display

      this.on("error", (err) => {
         performance.error(err);
      });
   }

   /**
    * @param {Promise} webixLoading - so we know when webix is finished loading
    */
   async init(webixLoading) {
      const loadABFactory = import(
         /* webpackChunkName: "AB" */
         /* webpackPrefetch: true */
         "../AppBuilder/ABFactory"
      );
      // @const {Promise} loadABFactory Defer loading the ABFactory for a smaller
      // inital file size, allowing us to show the loading UI sooner.
      /**
       * @type {Function} preloadMessage
       * @description show a loading message
       * @param {string} message to display on the loading screen
       */
      const preloadMessage = (m) =>
         (document.getElementById("preload-text").innerHTML = m);
      /**
       * @type {Function}
       * @description remove the preload ui elements
       */
      const destroyPreloadUI = () =>
         document.getElementById("preloader").remove();

      const networkTestWorker = new Worker(
         new URL("../utils/networkTest.js", import.meta.url)
      );
      let networkIsSlow = false;
      networkTestWorker.onmessage = ({ data }) => {
         if (networkIsSlow !== data) {
            networkIsSlow = data;
            const $uiWarning = document.getElementById(
               "preload_network_warning"
            );
            $uiWarning.hidden = !networkIsSlow;
            // Tell sentry our network speed changed
            performance.setContext("breadcrumb", {
               category: "network",
               message: networkIsSlow
                  ? "Slow network detected"
                  : "Network speed restored",
               level: "info",
            });
         }
      };

      preloadMessage("Waiting for the API Server");

      performance.mark("bootstrap", { op: "function" });
      // on the web platform, we need to gather the appropriate configuration
      // information before we can show the UI
      // 1) Find or create the DIV element our UI is to attach to
      //    this DIV element can contain settings pertainent to our setup
      performance.mark("initDiv", { op: "ui.render" });
      await initDiv.init(this);
      performance.measure("initDiv");

      // 2) Request the User's Configuration Information from the server.
      performance.mark("initConfig", { op: "function" });
      preloadMessage("Getting Configuration Settings");
      await initConfig.init(this);
      performance.measure("initConfig");

      await initUser.init(this);
      const userInfo = Config.userConfig();

      if (userInfo) {
         // load definitions for current user
         performance.setContext("user", {
            id: userInfo.id,
         });
      } else {
         let { options: tenantConfig } = Config.tenantConfig();
         tenantConfig =
            typeof tenantConfig === "string"
               ? JSON.parse(tenantConfig)
               : tenantConfig;
         // If no user and tenant isn't using local auth start
         // the external auth workflow:
         if (tenantConfig.authType !== "login") {
            // window.location.assign("/auth/login");
            if (tenantConfig.authType == "cas") {
               const urlParams = new URLSearchParams(window.location.search);
               if (!urlParams.has("ticket")) {
                  const CAS_SERVER = "https://signin.l2d.biz/cas";
                  const SERVICE_URL = encodeURIComponent(
                     window.location.origin + "/"
                  );
                  // const SERVICE_URL = "";
                  window.location.assign(
                     `${CAS_SERVER}/login?service=${SERVICE_URL}`
                  );
                  return;
               }
            }
         }
         // Keep going if the tenant is using local auth
      }
      // 2.5) Load any plugins
      performance.mark("loadPlugins", { op: "function" });

      // Plugins are now loaded via the Preloader and stored in
      (window.__AB_Plugins || []).forEach((p) => {
         this.addPlugin(p);
      });
      performance.measure("loadPlugins");

      // 3) Now we have enough info, to create an instance of our
      //    {ABFactory} that drives the rest of the AppBuilder objects
      performance.mark("createABFactory", { op: "function" });
      preloadMessage("Starting AppBuilder");

      const { default: ABFactory } = await loadABFactory;
      let definitions = Config.definitions() || null;

      if (definitions) {
         // NOTE: when loading up an unauthorized user,
         // definitions will be null: we can skip the plugins
         // Q: is it possible to load a plugin when unauthorized?
         this._plugins.forEach((p) => {
            definitions = definitions.concat(p.definitions());
         });
      }
      this.AB = new ABFactory(definitions);

      if (!window.AB) window.AB = this.AB;
      // Make our Factory Global.
      // NOTE: our tests are expecting to access our ABFactory this way.

      this.AB.Network.registerNetworkTestWorker(
         networkTestWorker,
         networkIsSlow
      );
      await this.AB.init();
      await webixLoading;
      // NOTE: special case: User has no Roles defined.
      // direct them to our special ErrorNoDefsUI
      if (userInfo && userInfo.roles.length == 0) {
         performance.measure("createABFactory");
         ErrorNoDefsUI.init(this.AB);
         ErrorNoDefsUI.attach();
         ErrorNoDefsUI.show();
         if (Config.userReal()) {
            ErrorNoDefsUI.switcherooUser(Config.userConfig());
         }
         destroyPreloadUI();
         this.ui(ErrorNoDefsUI);

         let err = new Error("No Definitions");
         err.code = "ENODEFS";
         throw err;
      }

      // 3.5  prepare the plugins
      this._plugins.forEach((p) => {
         p.apply(this.AB);
         const labels = p.labels(this.AB.Multilingual.currentLanguage());
         this.AB.Multilingual.pluginLoadLabels(p.key, labels);
      });
      performance.measure("createABFactory");

      // 4) Now we can create the UI and send it the {ABFactory}
      performance.mark("initUI", { op: "ui.render" });
      // webix recommends wrapping any webix code in the .ready()
      // function that executes after page loading.
      webix.ready(() => {
         const locales = {
            en: "en-US",
            "zh-hans": "zh-CN",
            th: "th-TH",
         };
         // locales - map ab languageCode to webix locale
         const { languageCode } = AB.Config.userConfig() ?? {};
         // save the webix locale used to set locale in ClassUIPage.renderPage()
         window.webixLocale =
            Object.prototype.hasOwnProperty.call(locales, languageCode) &&
            Object.prototype.hasOwnProperty.call(
               webix.i18n.locales,
               locales[languageCode]
            )
               ? locales[languageCode]
               : false;

         // webix pro offers a feature that hides scroll bars by
         // default for browsers that include them due to the user's
         // UI. The experience becomes more like a touch interface
         // with the exception that scroll bars appear when user
         // hovers over a scrollable area
         /* if (!Webix.env.touch  && Webix.env.scrollSize ) */
         webix.CustomScroll.init();

         const div = this.div();

         UI.attach(div.id);
         destroyPreloadUI();
         this.ui(UI);
         this.ui()
            .init(this.AB)
            .then(() => {
               performance.measure("initUI");
               performance.measure("bootstrap");
            });
         // this.ui().init() routine handles the remaining
         // bootup/display process.
      });
   }

   addPlugin(plugin) {
      this._plugins.push(plugin);
   }

   alert(options) {
      webix.alert(options);
   }

   div(el) {
      if (el) {
         this._div = el;
         return;
      }
      return this._div;
   }

   error(...params) {
      console.error(...params);
      let message = params[0];
      this.emit(message);
   }

   ui(UI) {
      if (UI) {
         this._ui = UI;
         return;
      }
      return this._ui;
   }
}

export default new Bootstrap();
