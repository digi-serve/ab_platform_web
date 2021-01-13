/*
 * StorageLocal
 *
 * An interface for storing and retrieving Client Side data.  Data stored
 * in StorageLoacal is NOT encrypted.
 *
 * This implementation is based upon the webix.storage.local library.
 * See: https://docs.webix.com/api__refs__storage.local.html
 *
 */

var EventEmitter = require("events").EventEmitter;

class StorageLocal extends EventEmitter {
   constructor() {
      super();

      this.tenantStorage = null;
      // {Webix.storage} object.
      // We divide the storage data according to the tenant we are working
      // with.  This way Users who can move between different Tenants can
      // keep their local data separated.
   }

   init(AB) {
      // {ABFactory} AB

      this.AB = AB;
      var tenantID = this.AB.Tenant.id();
      if (!tenantID) {
         tenantID = "noAuth";
         // "noAuth" is considered the tenant on our Login sequence
         // which should have a minimum of data stored (language maybe?)
      }

      this.tenantStorage = this.AB.Webix.storage.prefix(
         tenantID,
         this.AB.Webix.storage.local
      );

      // this isn't actually an Async operation, so just resolve()
      return Promise.resolve();
   }

   set(key, value /* , options = {} */) {
      return Promise.resolve().then(() => {
         return this.tenantStorage.put(key, value);
      });
   }

   get(key /*, options = {} */) {
      return Promise.resolve().then(() => {
         return this.tenantStorage.get(key);
      });
   }

   clear(key) {
      return Promise.resolve().then(() => {
         return this.tenantStorage.remove(key);
      });
   }

   clearAll() {
      return Promise.resolve().then(() => {
         return this.tenantStorage.clear();
      });
   }
}

export default new StorageLocal();
