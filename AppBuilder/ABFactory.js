var ABFactoryCore = require("./core/ABFactoryCore");

const _ = require("lodash");
const uuidv4 = require("uuid");

//
// Our Common Resources
//
import Config from "../config/Config.js";
// Config : responsible for all the configuration/settings of our instance.

import Account from "../resources/Account.js";
// Account : manages the current Logged in User and Account information.

import Dialog from "./_factory_utils/Dialog.js";
// Dialog : common UI dialogs.

import Multilingual from "../resources/Multilingual.js";
// Multilingual: our interface Labels and language options

import Network from "../resources/Network.js";
// Network: our interface for communicating to our server

import Tenant from "../resources/Tenant.js";
// Tenant: manages the Tenant information of the current instance

import UISettings from "./uiSettings/config.js";
// UISettings: detailed settings for our common UI elements

import Webix from "../js/webix/webix.js";

//
// AppBuilder Objects
//

class ABFactory extends ABFactoryCore {
   constructor(definitions) {
      super(definitions);

      // Common Reference to Configuration Values
      this.Config = Config;

      //
      // Resources
      //
      this.Account = Account;
      this.Dialog = Dialog;
      this.Multilingual = Multilingual;
      this.Network = Network;
      this.Tenant = Tenant;
      this.Webix = Webix;

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

      this.UISettings = UISettings;

      this.Validation = {
         validator: () => {
            console.error("ABFactory: replace .Validation with OP.Validation ");
            return [];
         },
         isGridValidationError: () => {
            console.error("ABFactory: .Validation.isGridValidationError()");
            return false;
         },
      };

      // TODO: make sure "error" s are handled and sent to logs
      // this.on("error", ()=>{ Analytics.error })

      this.Definitions = {};
      // {obj} the provided interface for working with the ABDefinition table.
      // NOTE: on the web client, we simply perform web API calls to perform
      // the actions.  These are defined below.
   }

   /**
    * init()
    * prepare the ABFactory for operation. This includes parsing the
    * definitions into useable objects, preparing the System Resources, etc.
    * @return {Promise}
    */
   init() {
      //
      // Prepare our Resources First
      //
      var allInits = [];

      allInits.push(this.Account.init(this));
      allInits.push(this.Multilingual.init(this));
      allInits.push(this.Network.init(this));
      allInits.push(this.Tenant.init(this));

      return Promise.all(allInits).then(() => {
         // Now prepare the rest of the ABFactory()
         return super.init();
      });
   }

   /**
    * definiitonCreate(def)
    * create a new ABDefinition
    * @param {obj} def
    *        the value hash of the new definition entry
    * @return {Promise}
    *        resolved with a new {ABDefinition} for the entry.
    */
   definitionCreate(def) {
      return this.Network.post({
         url: `/app_builder/abdefinitionmodel`,
         data: def,
      })
         .then((fullDef) => {
            let newDef = this.definitionNew(fullDef);
            this.emit("definition.created", newDef);
            return newDef;
         })
         .catch((err) => {
            this.error(err);
            throw err;
         });
   }

   /**
    * definitionDestroy(id)
    * delete an ABDefinition
    * @param {string} id
    *        the uuid of the ABDefinition to delete
    * @return {Promise}
    */
   definitionDestroy(id) {
      return this.Network.delete({
         url: `/app_builder/abdefinitionmodel/${id}`,
      })
         .then(() => {
            delete this._definitions[id];
            this.emit("definition.destroyed", id);
         })
         .catch((err) => {
            this.error(err);
            throw err;
         });
   }

   /**
    * definitionUpdate(id, def)
    * update an existing ABDefinition
    * @param {string} id
    *        the uuid of the ABDefinition to update.
    * @param {obj} values
    *        the value hash of the new definition values
    * @return {Promise}
    *        resolved with a new {ABDefinition} for the entry.
    */
   definitionUpdate(id, values) {
      return this.Network.put({
         url: `/app_builder/abdefinitionmodel/${id}`,
         data: values,
      })
         .then((serverDef) => {
            this._definitions[id] = serverDef;
            // TODO: fiugure out how to propogate definition updates to live objects
            this.emit("definition.updated", id, serverDef);
            return serverDef;
         })
         .catch((err) => {
            if (err.toString().indexOf("Not Found") > -1) {
               return this.definitionCreate(values);
            }
            // log the error
            this.error(err);
            // keep the error propagating:
            throw err;
         });
   }

   //
   // Utilities
   //
   alert(options) {
      Webix.alert(options);
   }

   cloneDeep(value) {
      return _.cloneDeep(value);
   }

   merge(...params) {
      return _.merge(...params);
   }

   orderBy(...params) {
      return _.orderBy(...params);
   }

   error(message, ...rest) {
      var emitData = {
         message: `ABFactory[${this.Tenant.id()}]:${message.toString()}`,
      };

      console.error(emitData.message);
      if (message instanceof Error) {
         emitData.error = message;
         // this dumps the error.stack
         console.error(message);
      }

      if (rest && rest.length > 0) {
         rest.forEach((r) => {
            if (r instanceof Error) {
               emitData.error = r;
               // this dumps the error.stack
               console.error(r);
            }

            if (typeof r == "object") {
               for (var k in r) {
                  emitData[k] = r[k];
                  console.error(k, r[k]);
               }
            }
         });
      }
      this.emit("error", emitData);
   }

   uniq(...params) {
      return _.uniq(...params);
   }

   uuid() {
      return uuidv4();
   }
}

export default ABFactory;
