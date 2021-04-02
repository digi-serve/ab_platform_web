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
            console.error("ABFactory: replace .Validation with OP.Validation ");
            return {
               addError: () => {},
               pass: () => true,
            };
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

      return Promise.all(allInits)
         .then(() => {
            // some Resources depend on the above to be .init() before they can
            // .init() themselves.
            return this.Storage.init(this);
         })
         .then(() => {
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

   log(message, ...rest) {
      console.log(message);
      rest.forEach((r) => {
         console.log(r);
      });
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

   uuid() {
      return uuidv4();
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

      if (options.ignoreTime) dateText = dateText.replace(/\T.*/, "");

      let result = options.format
         ? moment(dateText, options.format)
         : moment(dateText);

      let supportFormats = [
         "YYYY-MM-DD",
         "YYYY/MM/DD",
         "DD/MM/YYYY",
         "MM/DD/YYYY",
         "DD-MM-YYYY",
         "MM-DD-YYYY"
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
    *                               format: "string",
    *                               localeCode: "string"
    *                            }
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
      return moment(date)
         .subtract(number, unit)
         .toDate();
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
      return moment(date)
         .add(number, unit)
         .toDate();
   }
}

export default ABFactory;

