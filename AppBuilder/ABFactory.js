var ABFactoryCore = require("./core/ABFactoryCore");

const _ = require("lodash");
const moment = require("moment");
import { nanoid } from "nanoid";
const uuid = require("uuid");

//
// Our Common Resources
//
import Config from "../config/Config.js";
// Config : responsible for all the configuration/settings of our instance.

import Account from "../resources/Account.js";
// Account : manages the current Logged in User and Account information.

import ClassUI from "../ui/ClassUI.js";

import Dialog from "./_factory_utils/Dialog.js";
// Dialog : common UI dialogs.

import Multilingual from "../resources/Multilingual.js";
// Multilingual: our interface Labels and language options

import Network from "../resources/Network.js";
// Network: our interface for communicating to our server

import Storage from "../resources/Storage.js";
// Storage: manages our interface for local storage

import Tenant from "../resources/Tenant.js";
// Tenant: manages the Tenant information of the current instance

import UISettings from "./uiSettings/config.js";
// UISettings: detailed settings for our common UI elements

var Webix = require("../js/webix/webix.js");
// NOTE: moved to require() because using import with webix_debug.js
// really messed things up!

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
      this.Storage = Storage;
      this.Tenant = Tenant;
      this.Webix = Webix;

      // Plugin Classes
      this.ClassUI = ClassUI;

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

      this.UISettings = UISettings;

      this.Validation = {
         validator: () => {
            console.error(
               "TODO: ABFactory: replace .Validation with OP.Validation "
            );
            return {
               addError: () => {},
               pass: () => true,
               fail: function () {
                  return !this.pass();
               },
               updateForm: ($form) => {
                  console.error(
                     "TODO: AB.Validation.validator().updateForm() <<--- "
                  );
               },
            };
         },
         isGridValidationError: () => {
            console.error(
               "TODO: ABFactory: .Validation.isGridValidationError()"
            );
            return false;
         },
      };

      // TODO: make sure "error" s are handled and sent to logs
      // this.on("error", ()=>{ Analytics.error })

      this.Definitions = {};
      // {obj} the provided interface for working with the ABDefinition table.
      // NOTE: on the web client, we simply perform web API calls to perform
      // the actions.  These are defined below.

      this.on("error", (err) => {
         // this simply prevents thrown errors if there are no listeners.
         console.error(err);
      });

      this._plugins = [];
      // {array} of loaded Plugin.applications.

      this._pendingNetworkRequests = {};
      // {hash}   uuid : {Promise}
      // convert our definitionsXXXX() operations to be Relay/offline compatible.
      // if a queued operation is sent after a web browser refresh, then
      // we will NOT have a pending promise to .resolve()/.reject()

      this.Network.on("definition.create", (context, err, fullDef) => {
         var pending = this._pendingNetworkRequests[context.uuid];
         if (err) {
            // this.error(err);
            pending?.reject(err);
            return;
         }

         // for immediate feedback to our UI:
         // simulate the RT update from our sockets:
         var pkt = {
            id: fullDef.id,
            data: fullDef,
         };
         this.emit("ab.abdefinition.create", pkt);

         let newDef = this.definitionNew(fullDef);
         pending?.resolve(newDef);
      });

      this.Network.on("definition.update", (context, err, serverDef) => {
         var pending = this._pendingNetworkRequests[context.uuid];
         if (err) {
            if (err.toString().indexOf("Not Found") > -1) {
               return this.definitionCreate(context.values)
                  .then(pending?.resolve)
                  .catch(pending?.reject);
            }
            // log the error
            // this.error(err);
            pending?.reject(err);
            return;
         }

         this._definitions[context.id] = serverDef;

         // for immediate feedback to our UI:
         // simulate the RT update from our sockets:
         var pkt = {
            id: serverDef.id,
            data: serverDef,
         };
         this.emit("ab.abdefinition.update", pkt);

         pending?.resolve(serverDef);
      });

      this.Network.on("definition.delete", (context, err, serverDef) => {
         var pending = this._pendingNetworkRequests[context.uuid];
         if (err) {
            // log the error
            // this.error(err);
            pending?.reject(err);
            return;
         }

         delete this._definitions[context.id];

         // for immediate feedback to our UI:
         // simulate the RT update from our sockets:
         var pkt = {
            id: context.id,
            data: serverDef,
         };
         this.emit("ab.abdefinition.delete", pkt);

         pending?.resolve();
      });
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

      return Promise.all(allInits)
         .then(() => {
            // some Resources depend on the above to be .init() before they can
            // .init() themselves.
            return this.Storage.init(this).then(() => {
               return this.Storage.get("local_settings").then((data) => {
                  this._localSettings = data || {};
               });
            });
         })
         .then(() => {
            //
            // RealTime Updates of our ABDefinitions
            //

            // new ABDefinition created:
            this.on("ab.abdefinition.create", (pkt) => {
               // pkt.id : definition.id
               // pkt.data : definition

               if (typeof pkt.data.json == "string") {
                  try {
                     pkt.data.json = JSON.parse(pkt.data.json);
                  } catch (e) {
                     console.log(e);
                  }
               }
               this.definitionSync("created", pkt.id, pkt.data);
            });

            // ABDefinition updated:
            this.on("ab.abdefinition.update", (pkt) => {
               // pkt.id : definition.id
               // pkt.data : definition
               if (typeof pkt.data.json == "string") {
                  try {
                     pkt.data.json = JSON.parse(pkt.data.json);
                  } catch (e) {
                     console.log(e);
                  }
               }
               this._definitions[pkt.id] = pkt.data;
               this.definitionSync("updated", pkt.id, pkt.data);
            });

            // ABDefinition delete:
            this.on("ab.abdefinition.delete", (pkt) => {
               // pkt.id : definition.id
               // pkt.data : definition
               if (typeof pkt.data.json == "string") {
                  try {
                     pkt.data.json = JSON.parse(pkt.data.json);
                  } catch (e) {
                     console.log(e);
                  }
               }
               delete this._definitions[pkt.id];
               this.definitionSync("destroyed", pkt.id, pkt.data);
            });

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
   async definitionCreate(def) {
      // we will set our uuid
      if (typeof def.id == "undefined") {
         def.id = this.uuid();
         def.json.id = def.id;
      }

      return new Promise((resolve, reject) => {
         var uuid = this.uuid();
         this._pendingNetworkRequests[uuid] = { resolve, reject };
         var jobResponse = {
            key: "definition.create",
            context: {
               uuid,
            },
         };
         this.Network.post(
            {
               url: `/definition/create`,
               data: def,
            },
            jobResponse
         ).catch((err) => {
            var message = "Error attempting to CREATE definitions";
            if (err.code == "E_NOPERM") {
               message = "User Doesn't have permission to CREATE definitions";
            }
            this.notify.developer(err, {
               context: "ABFactory.definitionCreate()",
               message,
               def,
            });

            // NOTE: when using jobResponse type calls, expect that
            // handler to be handling the errors.
            // don't keep propagating them here.
         });
      });
   }

   /**
    * definitionDestroy(id)
    * delete an ABDefinition
    * @param {string} id
    *        the uuid of the ABDefinition to delete
    * @return {Promise}
    */
   async definitionDestroy(id) {
      return new Promise((resolve, reject) => {
         var uuid = this.uuid();
         this._pendingNetworkRequests[uuid] = { resolve, reject };
         var jobResponse = {
            key: "definition.delete",
            context: {
               id,
               uuid,
            },
         };
         this.Network.delete(
            {
               url: `/definition/${id}`,
            },
            jobResponse
         ).catch((err) => {
            var message = "Error attempting to DESTROY definitions";
            if (err.code == "E_NOPERM") {
               message = "User Doesn't have permission to DELETE definitions";
            }
            this.notify.developer(err, {
               context: "ABFactory.definitionDestroy()",
               message,
               id,
            });

            // NOTE: when using jobResponse type calls, expect that
            // handler to be handling the errors.
            // don't keep propagating them here.
         });
      });

      /*
      var prevDef = this._definitions[id];
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
*/
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
   async definitionUpdate(id, values) {
      return new Promise((resolve, reject) => {
         var uuid = this.uuid();
         this._pendingNetworkRequests[uuid] = { resolve, reject };
         var jobResponse = {
            key: "definition.update",
            context: {
               id,
               uuid,
               values,
            },
         };
         this.Network.put(
            {
               url: `/definition/${id}`,
               data: values,
            },
            jobResponse
         ).catch((err) => {
            var message = "Error attempting to UPDATE definitions";
            if (err.code == "E_NOPERM") {
               message = "User Doesn't have permission to UPDATE definitions";
            }
            this.notify.developer(err, {
               context: "ABFactory.definitionUpdate()",
               message,
            });

            // NOTE: when using jobResponse type calls, expect that
            // handler to be handling the errors.
            // don't keep propagating them here.
         });
      });
   }

   /**
    * definitionsParse()
    * include the incoming definitions into our ABFactory. These new
    * definitions will replace any existing ones with the same .id.
    * @param {array[ABDefinitioin]} defs
    *     the incoming array of ABDefinitions to parse.
    * @return {Promise}
    */
   definitionsParse(defs = []) {
      if (!Array.isArray(defs)) {
         defs = [defs];
      }

      // store/replace the incoming definitions
      // 1st: insert ALL our definitions internally
      defs.forEach((d) => {
         this._definitions[d.id] = d;
      });
      // 2nd: Now we can then go through and signal the "updates"
      // and the related objects can find their dependent definitions.
      defs.forEach((d) => {
         this.definitionSync("updated", d.id, d);
      });

      return Promise.resolve();
   }

   definitionSync(op, id, def) {
      var { keyList, keyFn } = this.objectKeysByDef(def);
      if (keyList) {
         var curr;
         switch (op) {
            case "created":
               this[keyList].push(this[keyFn](def.json));
               this.emit("definition.created", def.json);
               break;

            case "updated":
               // get the current object
               curr = this[keyList].find((d) => d.id == id);

               // remove from list
               this[keyList] = this[keyList].filter((d) => d.id != id);
               // add new one:
               this[keyList].push(this[keyFn](def.json));

               // signal this object needs to be updated:
               curr?.emit?.("definition.updated");

               this.emit("definition.updated", def.json);
               break;

            case "destroyed":
               // get the current object
               curr = this[keyList].find((d) => d.id == id);
               if (curr) {
                  // remove from list
                  this[keyList] = this[keyList].filter((d) => d.id != id);

                  // signal this object needs to be updated:
                  curr?.emit?.("definition.deleted");

                  this.emit("definition.deleted", def.json);
               }
               break;
         }
      }

      // if (def.id) {
      // }
   }

   plugins() {
      return this._plugins;
   }
   pluginLoad(p) {
      this._plugins.push(p);
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

   jobID() {
      return nanoid();
   }

   Label() {
      return (...params) => {
         return this.Multilingual.label(...params);
      };
   }

   localSettings(key, value) {
      if (typeof value == "undefined") {
         // this is a getter:
         return this._localSettings[key];
      } else {
         // setting a value:
         this._localSettings[key] = value;
         return this.Storage.set(`local_settings`, this._localSettings);
      }
   }

   log(message, ...rest) {
      console.log(message);
      rest.forEach((r) => {
         console.log(r);
      });
   }

   /**
    * @method rules.isUUID
    * evaluate a given value to see if it matches the format of a uuid
    * @param {string} key
    * @return {boolean}
    */
   isUUID(key) {
      var checker = RegExp(
         "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
         "i"
      );
      return checker.test(key);
   }

   merge(...params) {
      return _.merge(...params);
   }

   orderBy(...params) {
      return _.orderBy(...params);
   }

   uniq(...params) {
      return _.uniq(...params);
   }

   kebabCase(...params) {
      return _.kebabCase(...params);
   }

   sumBy(...params) {
      return _.sumBy(...params);
   }

   meanBy(...params) {
      return _.meanBy(...params);
   }

   maxBy(...params) {
      return _.maxBy(...params);
   }

   minBy(...params) {
      return _.minBy(...params);
   }

   uuid() {
      return uuid.v4();
   }

   warn(message, ...rest) {
      console.warn(message);
      rest.forEach((r) => {
         console.warn(r);
      });
   }

   /**
    * @method toDate
    *
    * @param {string} dateText
    * @param {Object} options - {
    *                               format: "string",
    *                               ignoreTime: boolean
    *                            }
    * @return {Date}
    */
   toDate(dateText = "", options = {}) {
      if (!dateText) return;

      if (options.ignoreTime) dateText = dateText.replace(/T.*/, "");

      let result = options.format
         ? moment(dateText, options.format)
         : moment(dateText);

      let supportFormats = [
         "YYYY-MM-DD",
         "YYYY/MM/DD",
         "DD/MM/YYYY",
         "MM/DD/YYYY",
         "DD-MM-YYYY",
         "MM-DD-YYYY",
      ];

      supportFormats.forEach((format) => {
         if (!result || !result.isValid()) result = moment(dateText, format);
      });

      return new Date(result);
   }

   /**
    * @method toDateFormat
    *
    * @param {Date} date
    * @param {Object} options - {
    *           format: "string",
    *           localeCode: "string"
    *         }
    *
    * @return {string}
    */
   toDateFormat(date, options) {
      if (!date) return "";

      let momentObj = moment(date);

      if (options.localeCode) momentObj.locale(options.localeCode);

      return momentObj.format(options.format);
   }

   /**
    * @method subtractDate
    *
    * @param {Date} date
    * @param {number} number
    * @param {string} unit
    *
    * @return {Date}
    */
   subtractDate(date, number, unit) {
      return moment(date).subtract(number, unit).toDate();
   }

   /**
    * @method addDate
    *
    * @param {Date} date
    * @param {number} number
    * @param {string} unit
    *
    * @return {Date}
    */
   addDate(date, number, unit) {
      return moment(date).add(number, unit).toDate();
   }

   isString(...params) {
      return _.isString(params);
   }
}

export default ABFactory;
