var EventEmitter = require("events").EventEmitter;

import Config from "../config/Config.js";

class Account extends EventEmitter {
   constructor() {
      super();

      this.isAuthenticated = false;
      this._config = null;
   }

   init() {
      debugger;
      var UserConfig = Config.userConfig();
      if (UserConfig) {
         this.isAuthenticated = true;
         this._config = UserConfig;
      }

      // this isn't actually an Async operation, so just resolve()
      return Promise.resolve();
   }
}

export default new Account();
