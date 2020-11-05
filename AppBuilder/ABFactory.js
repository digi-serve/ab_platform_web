var EventEmitter = require("events").EventEmitter;

import initConfig from "../init/initConfig.js";
import initDiv from "../init/initDiv.js";
import initResources from "../init/initResources.js";

import Config from "../config/Config.js";

import Account from "../resources/Account.js";
import Network from "../resources/Network.js";
import Tenant from "../resources/Tenant.js";

import Webix from "../js/webix/webix.js";

import UI from "../ui/ui.js";

class ABFactory extends EventEmitter {
   constructor() {
      super();
      this.setMaxListeners(0);

      // Common Reference to Configuration Values
      this.Config = Config;

      //
      // Resources
      //
      this.Account = Account;
      this.Network = Network;
      this.Tenant = Tenant;

      //
      // UI Related
      //
      this._div = null;
      // {el} _div
      // the HTML element that is the where our initial [click] here button
      // should be displayed.  Our actual portal is a popup, but the base
      // <div> can be used for an embedded view.

      this._ui = null;
      // {obj} ._ui
      // the Webix Object that is our UI display

      // TODO: make sure "error" s are handled and sent to logs
      // this.on("error", ()=>{ Analytics.error })
   }

   bootstrap() {
      return initDiv
         .init(this)
         .then(() => {
            return initConfig.init(this);
         })
         .then(() => {
            return initResources.init(this);
         })
         .then(() => {
            return Promise.resolve().then(() => {
               var div = this.div();

               UI.attach(div.id);
               this.ui(UI);
               this.ui().init(this);
            });
            // after initAttach the UI.init() routine handles the remaining
            // bootup/display process.
         });
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

   error(message) {
      console.error(message);
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

export default new ABFactory();
