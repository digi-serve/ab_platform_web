var EventEmitter = require("events").EventEmitter;

class Account extends EventEmitter {
   constructor() {
      super();

      this.isAuthenticated = false;
      this._config = null;
   }

   init(AB) {
      // {ABFactory} AB

      this.AB = AB;
      var UserConfig = this.AB.Config.userConfig();
      if (UserConfig) {
         this.isAuthenticated = true;
         this._config = UserConfig;
      }

      // this isn't actually an Async operation, so just resolve()
      return Promise.resolve();
   }

   language() {
      return this._config.languageCode;
   }

   roles() {
      return this._config.roles || [];
   }
   rolesAll() {
      console.error(
         "TODO: Account.rolesAll(): pull all the roles from the system."
      );
      return [];
   }

   scopes() {
      console.error("TODO: How is Account.scopes() supposed to work?");
      return [];
   }

   username() {
      return this._config.username;
   }

   userList() {
      console.error(
         "TODO: Account.userList(): pull all the users from the system."
      );
      return [];
   }
   usersAll() {
      console.error(
         "TODO: Account.usersAll(): refactor this call to use .userList()"
      );
      return this.userList();
   }

   uuid() {
      return this._config.uuid;
   }
}

export default new Account();
