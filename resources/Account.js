var EventEmitter = require("events").EventEmitter;

class Account extends EventEmitter {
   constructor() {
      super();

      this.isAuthenticated = false;
      this._config = null;

      this._listRoles = null;
      // {array}
      // a list of all the Defined Roles in the Tenant's system.

      this._listScopes = null;
      // {array | null}
      // a list of all the Defined Scopes in the Tenant's sytem.

      this._listUsers = null;
      // {array | null}
      // a list of all the Defined Users in the Tenant's system.
   }

   init(AB) {
      // {ABFactory} AB

      this.AB = AB;
      var UserConfig = this.AB.Config.userConfig();
      if (UserConfig) {
         this.isAuthenticated = true;
         this._config = UserConfig;
      }

      var MetaConfig = this.AB.Config.metaConfig();
      if (MetaConfig) {
         this._listRoles = MetaConfig.roles || [];
         this._listScopes = MetaConfig.scopes || [];
         this._listUsers = MetaConfig.users || [];
      }

      this.AB.Network.on("account.logout", (context, err) => {
         if (err) {
            console.error(err);
            return;
         }
         this.emit("logout");
      });

      return Promise.resolve();
   }

   isSystemDesigner() {
      return (
         this.roles((r) => r.uuid === "6cc04894-a61b-4fb5-b3e5-b8c3f78bd331")
            .length > 0
      );
   }

   language() {
      return this._config?.languageCode ?? "en";
   }

   logout() {
      return this.AB.Network.post(
         { url: "/auth/logout" },
         { key: "account.logout", context: {} }
      );
   }

   roles(fn = () => true) {
      return (this._config.roles || []).filter(fn);
   }
   rolesAll() {
      return this._listRoles;
   }

   scopes() {
      return this._listScopes;
   }

   username() {
      return this._config.username;
   }

   userList() {
      return this._listUsers;
   }

   uuid() {
      return this._config.uuid;
   }
}

export default new Account();
