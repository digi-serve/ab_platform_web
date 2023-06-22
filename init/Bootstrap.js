/*
 * Bootstrap.js
 * This file drives the setup and preparation of the Web Platform.
 * It's main job is to prepare all the local Resources for operation as
 * well the main ABFactory object that will drive the rest of the applications.
 */

import * as Webix from "../js/webix/webix.js";
// NOTE: changed to require() so switching to webix_debug.js will work.
// const Webix = require("../js/webix/webix_debug.js");

import webixCSS from "../js/webix/webix.css";
// Make sure webix is global object
if (!window.webix) {
   window.webix = Webix;
}

import "../js/webix/locales/th-TH.js";

import events from "events";

const EventEmitter = events.EventEmitter;

import BootstrapCSS from "../node_modules/bootstrap/dist/css/bootstrap.min.css";

import Config from "../config/Config.js";

import FormIO from "../node_modules/formiojs/dist/formio.full.min.js";
import "../node_modules/formiojs/dist/formio.form.min.css";
import "../node_modules/formiojs/dist/formio.builder.min.css";
// import FormIOCSS from "../node_modules/formiojs/dist/formio.full.min.css";

import initConfig from "../init/initConfig.js";
import initDiv from "../init/initDiv.js";
import initDefinitions from "../init/initDefinitions.js";
// import initResources from "../init/initResources.js";

// import JSZipUtils from "jszip-utils/dist/jszip-utils.min.js";

// Should use webix/query, querybuilder no longer maintained
// But we still use this in some places (processing record rules, etc)
import("../js/webix/components/querybuilder/querybuilder.min.js");
// We need to do a dynamic import to ensure webix is loaded first
import "../js/webix/components/querybuilder/querybuilder.min.css";

import Selectivity from "../js/selectivity/selectivity.min.js";
import selectivityCSS from "../js/selectivity/selectivity.min.css";

import * as tinymce from "../js/webix/extras/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/plugins/link";
import "tinymce/skins/ui/oxide/skin.min.css";
import "tinymce/skins/ui/oxide/content.css"; // content.min.css ?
import "tinymce/skins/content/default/content.min.css";

import("../js/webix/components/hint/hint.js");
import "../js/webix/components/hint/hint.css";

import UI from "../ui/ui.js";
import PreloadUI from "../ui/loading.js";
import ErrorNoDefsUI from "../ui/error_noDefs.js";

class Bootstrap extends EventEmitter {
   constructor(definitions) {
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

      // TODO: make sure "error" s are handled and sent to logs
      // this.on("error", ()=>{ Analytics.error })
   }

   init(ab) {
      // We rerun init after a sucessful login, at that point we already have AB.
      // This means we can use `AB.Network` over the fetch API when loading
      // config again. This prevents the session from being reset, which was
      // happening inconsitently.
      if (ab) this.AB = ab;

      PreloadUI.attach();
      this.ui(PreloadUI);
      const loadABFactory = import("../AppBuilder/ABFactory");
      // @const {Promise} loadABFactory Defer loading the ABFactory for a smaller
      // inital file size, allowing us to show the loading UI sooner.
      const preloadMessage = (m) => this.ui().preloadMessage(m);
      preloadMessage("Waiting for the API Server");
      // on the web platform, we need to gather the appropriate configuration
      // information before we can show the UI
      return (
         // 1) Find or create the DIV element our UI is to attach to
         //    this DIV element can contain settings pertainent to our setup
         initDiv
            .init(this)
            .then(() => {
               // 2) Request the User's Configuration Information from the
               //    server.
               preloadMessage("Getting Configuration Settings");
               return initConfig.init(this);
            })
            // load definitions for current user
            .then(async () => {
               if (Config.userConfig()) {
                  preloadMessage("Loading App Definitions");
                  await initDefinitions.init(this);
               }
            })

            .then(() => {
               // 2.5) Load any plugins

               // Make sure the BootStrap Object is available globally
               window.__ABBS = this;

               const allPluginsLoaded = [];
               const tenantInfo = Config.tenantConfig();

               if (tenantInfo) {
                  const plugins = Config.plugins() || [];

                  // Short Term Fix: Don't load ABDesigner for non builders (need a way to assign plugins to users/roles);
                  const designerIndex = plugins.indexOf("ABDesigner.js");
                  if (designerIndex > -1) {
                     const builderRoles = [
                        "6cc04894-a61b-4fb5-b3e5-b8c3f78bd331",
                        "e1be4d22-1d00-4c34-b205-ef84b8334b19",
                     ];
                     const userInfo = Config.userConfig();
                     const userBuilderRoles = userInfo?.roles.filter(
                        (role) => builderRoles.indexOf(role.uuid) > -1
                     ).length;
                     // Remove if no builder roles
                     if (userBuilderRoles < 1 || userInfo == null) {
                        plugins.splice(designerIndex, 1);
                     }
                  }

                  console.log("plugins:", plugins);

                  plugins.forEach((p) => {
                     preloadMessage(`Loading Plugin (${p})`);
                     allPluginsLoaded.push(loadScript(tenantInfo.id, p));
                  });
               }
               return Promise.all(allPluginsLoaded);
            })

            .then(async () => {
               // 3) Now we have enough info, to create an instance of our
               //    {ABFactory} that drives the rest of the AppBuilder objects
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

               // NOTE: special case: User has no Roles defined.
               // direct them to our special ErrorNoDefsUI
               const userConfig = this.AB.Config.userConfig();

               if (userConfig && userConfig.roles.length == 0) {
                  await this.AB.init();
                  ErrorNoDefsUI.init(this.AB);
                  ErrorNoDefsUI.attach();
                  if (Config.userReal()) {
                     ErrorNoDefsUI.switcherooUser(Config.userConfig());
                  }
                  this.ui().destroy(); // remove the preloading screen
                  this.ui(ErrorNoDefsUI);

                  let err = new Error("No Definitions");
                  err.code = "ENODEFS";
                  throw err;
               }

               if (!window.AB) window.AB = this.AB;

               // Make our Factory Global.
               // Transition: we still have some UI code that depends on accessing
               // our Factory as a Global var.  So until those are rewritten we will
               // make our factory Global.

               return this.AB.init().then(() => {
                  // 3.5  prepare the plugins
                  this._plugins.forEach((p) => {
                     p.apply(this.AB);
                     const labels = p.labels(
                        this.AB.Multilingual.currentLanguage()
                     );
                     this.AB.Multilingual.pluginLoadLabels(p.key, labels);
                  });
               });
            })

            .then(() => {
               // 4) Now we can create the UI and send it the {ABFactory}
               return Promise.resolve().then(() => {
                  // webix recommends wrapping any webix code in the .ready()
                  // function that executes after page loading.
                  Webix.ready(() => {
                     const locales = {
                        en: "en-US",
                        "zh-hans": "zh-CN",
                        th: "th-TH",
                     };
                     // locales - map ab languageCode to webix locale
                     const { languageCode } = AB.Config.userConfig() ?? {};
                     // save the webix locale used to set locale in ClassUIPage.renderPage()
                     window.webixLocale =
                        Object.prototype.hasOwnProperty.call(
                           locales,
                           languageCode
                        ) &&
                        Object.prototype.hasOwnProperty.call(
                           Webix.i18n.locales,
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
                     Webix.CustomScroll.init();

                     const div = this.div();

                     UI.attach(div.id);
                     this.ui().destroy(); // remove the preloading screen
                     this.ui(UI);
                     this.ui().init(this.AB);
                     // this.ui().init() routine handles the remaining
                     // bootup/display process.
                  });
               });
            })
      );
   }

   addPlugin(plugin) {
      this._plugins.push(plugin);
   }

   alert(options) {
      Webix.alert(options);
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

function loadScript(tenant, p) {
   return new Promise((resolve, reject) => {
      const cb = () => resolve();

      // Adding the script tag to the head as suggested before
      const head = document.head;
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = `/plugin/${tenant || "??"}/${p}`;

      // Then bind the event to the callback function.
      // There are several events for cross browser compatibility.
      script.onreadystatechange = cb;
      script.onload = cb;
      script.onerror = () => {
         reject(new Error(`Error loading plugin ${p}`));
      };

      // Fire the loading
      head.appendChild(script);
   });
}
