var EventEmitter = require("events").EventEmitter;

import StorageLocal from "./StorageLocal.js";

class Storage extends EventEmitter {
   constructor() {
      super();

      this.tenantStorage = null;
      this._config = null;
      this._storage = null;
   }

   init(AB) {
      // {ABFactory} AB

      this.AB = AB;
      var config = this.AB.Config.siteConfig();
      if (config) {
         if (config.storage && config.storage.encrypted) {
            console.error("TODO: Implement Encrypted Storage");
            // this._storage = StorageEncrypted;
            this._storage = StorageLocal;
         } else {
            this._storage = StorageLocal;
         }

         return this._storage.init(AB);
      } else {
         console.error("??? Why No site config ???");
      }

      return Promise.resolve();
   }

   set(...params) {
      return this._storage.set(...params);
   }

   get(...params) {
      return this._storage.get(...params);
   }

   clear(...params) {
      return this._storage.clear(...params);
   }

   clearAll(...params) {
      return this._storage.clearAll(...params);
   }
}

export default new Storage();
