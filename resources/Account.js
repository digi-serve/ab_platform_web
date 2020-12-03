var EventEmitter = require("events").EventEmitter;

class Account extends EventEmitter {
   constructor() {
      super();

      this.isAuthenticated = false;
      this._config = null;
   }

   init(AB) {
      // {ABFactory} AB

      debugger;
      this.AB = AB;
      var UserConfig = this.AB.Config.userConfig();
      if (UserConfig) {
         this.isAuthenticated = true;
         this._config = UserConfig;
      }

      // this isn't actually an Async operation, so just resolve()
      return Promise.resolve();
   }
}

export default new Account();
