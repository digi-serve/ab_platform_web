var EventEmitter = require("events").EventEmitter;

import Config from "../config/Config.js";

class Tenant extends EventEmitter {
   constructor() {
      super();

      this.text = false;
      this._config = null;
      this.textClickToEnter = null;
   }

   init() {
      var config = Config.tenantConfig();
      if (config) {
         // check if we have options that are stored as a string
         if (
            typeof config.options === "string" ||
            config.options instanceof String
         ) {
            // if we do try to parse them into a JSON object
            try {
               config.options = JSON.parse(config.options);
            } catch (error) {
               console.error(error);
            }
         }
         this._config = config;
         this.textClickToEnter = config.options.textClickToEnter;
      }

      // this isn't actually an Async operation, so just resolve()
      return Promise.resolve();
   }

   id() {
      if (!this._config || this._config.id == "??") {
         return null;
      }
      return this._config.id;
   }

   setting(key, value) {
      if (this._config) {
         if (value) {
            this._config.options[key] = value;
            return;
         }
         return this._config.options[key];
      }
   }
}

export default new Tenant();
