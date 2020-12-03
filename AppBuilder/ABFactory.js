var EventEmitter = require("events").EventEmitter;
//
// Our Common Resources
//
import Config from "../config/Config.js";
// Config : responsible for all the configuration/settings of our instance.

import Account from "../resources/Account.js";
// Account : manages the current Logged in User and Account information.

import Network from "../resources/Network.js";
// Network: our interface for communicating to our server

import Tenant from "../resources/Tenant.js";
// Tenant: manages the Tenant information of the current instance

import Webix from "../js/webix/webix.js";

//
// AppBuilder Objects
//
// const ABApplication = require("./platform/ABApplication");

class ABFactory extends EventEmitter {
   constructor(definitions) {
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

      // Temp placeholders until Resources are implemented:
      this.Analytics = {
         log: () => {},
         logError: () => {},
      };
      this.Lock = class Lock {
         constructor() {}

         acquire() {
            return Promise.resolve();
         }
         release() {
            return Promise.resolve();
         }
      };
      this.Storage = {
         get: () => {
            return Promise.resolve();
         },
         set: () => {
            return Promise.resolve();
         },
      };

      // TODO: make sure "error" s are handled and sent to logs
      // this.on("error", ()=>{ Analytics.error })
   }

   /**
    * init()
    * prepare the ABFactory for operation. This includes parsing the
    * definitions into useable objects, preparing the System Resources, etc.
    * @return {Promise}
    */
   init() {
      var allInits = [];

      allInits.push(this.Account.init(this));
      allInits.push(this.Network.init(this));
      allInits.push(this.Tenant.init(this));

      return Promise.all(allInits);
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

   uuid() {}
}

export default ABFactory;
