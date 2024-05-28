import ConfigDesktop from "./configDesktop";
import ConfigMobile from "./configMobile";

// var EventEmitter = require("events").EventEmitter;
import { defaultsDeep } from "lodash";

const settingsDefault = {
   "appbuilder-portal-autoenter": true,
   // {bool} autoenter
   // open up the portal as soon as we load.
   //   false : just displays a link that will load the portal

   "appbuilder-portal-fullscreen": true,
   // {bool} fullscreen
   // take up the full browser window?
   //   false : only take up the area the current div is

   "appbuilder-tenant": null,
   // {string} tenant
   // the tenant uuid for this AppBuilder instance.

   "appbuilder-view": "work",
   // {string} view
   // the default view to display to the current user.

   "appbuilder-tenant-prefix": null,
   // TESTING! Remove this
};

const configDefaults = {
   site: {
      appbuilder: {
         networkType: "socket",
         // options: ["rest", "relay", "socket"]
         // Note: "socket" is required for realtime updates across devices.

         networkNumRetries: 3,
         // the number of times we will retry sending a network request
         // when we receive a timeout error.

         urlCoreServer: window.location.origin,
         // on the web client, just record the current URL by default.
         // the site config can override this if they want.
      },
      storage: {
         encrypted: false,
         // {bool} should we encrypt our data in the local browser storage?
      },
   },
};
class Config {
   constructor() {
      // this.setMaxListeners(0);
      this._config = null;
      // {obj} _config
      // these are the configuration settings returned from the server. These
      // are more detailed configuration settings for the running of the site.

      this._configUser = null;
      // {obj} _configUser
      // the default settings for the current user of the system.
      //    .user {obj}  the current info for who we think is using the site
      //    .userReal {obj}  if switheroo'd, this is the actual user

      this._settings = {};
      // {obj} _settings
      // settings are the configuration parameters found on the base <div>
      // these settings are the minimum needed to successfully pull up the
      // portal popup and perform the initial config request
   }

   config(json) {
      this._config = this._config || {};
      Object.keys(json).forEach((k) => {
         this._config[k] = json[k];
      });
      defaultsDeep(this._config, configDefaults);
   }

   configInbox(json) {
      this._config = this._config || {};
      this._config.inbox = json.inbox || [];
      this._config.inboxMeta = json.inboxMeta || [];
   }

   configUser(json) {
      this._configUser = json;
   }

   setting(key, value) {
      if (value) {
         this._settings[key] = value;
         return;
      }
      return this._settings[key];
   }

   settingsFromDiv(div) {
      Object.keys(settingsDefault).forEach((d) => {
         var val = div.getAttribute(d);
         if (!val) {
            val = settingsDefault[d];
         }
         if (val === "false") val = false;
         if (val === "true") val = true;

         var key = d.split("-").pop();
         this.setting(key, val);
      });
   }

   settings(json = {}) {
      for (let key in settingsDefault) {
         const val = json[key] ?? settingsDefault[key];
         this.setting(key.split("-").pop(), val);
      }
   }

   /**
    * definitions()
    * return the ABDefinition(s) required to manage the interface.
    * @return {obj}
    *          { ABDefinition.id : {ABDefinition} }  hash of definitions.
    */
   definitions() {
      return window.definitions;
   }

   error(/* ...args */) {
      console.error("Who is calling this? -> move to AB.error() instead.");
      // this.emit("ab.error", args);
   }

   labelConfig() {
      if (this._config && this._config.labels) {
         return this._config.labels;
      }
      console.error("No Label config found.");
      return {};
   }

   languageConfig() {
      if (this._config && this._config.languages) {
         return this._config.languages;
      }
      console.error("No Language config found.");
      return {};
   }

   metaConfig() {
      if (this._config && this._config.meta) {
         return this._config.meta;
      }
      console.error("No Meta config found.");
      return {};
   }

   plugins() {
      // TODO: Pull from this._config.plugins
      return ["ABDesigner.js"];
      // return [];
   }

   inboxConfig() {
      if (this._config && this._config.inbox) {
         return this._config.inbox;
      }
      return null;
   }

   inboxMetaConfig() {
      if (this._config && this._config.inboxMeta) {
         return this._config.inboxMeta;
      }
      return null;
   }

   /**
    * @typedef SiteConfig
    * @property {Object} appbuilder
    * @property {number} appbuilder.networkNumRetries
    * @property {"socket"|"rest"|"relay"} appbuilder.networkType
    * @property {string} appbuilder.urlCoreServer
    * @property {boolean} [relay] whether relay is enabled on the server
    * @property {Object} [storage]
    * @property {boolean} storage.encrypted
    * @property {Array<{uuid: string, key: string}>} [tenants]
    * @property {string} [privacyPolicy]
    */
   /** @returns {SiteConfig} */
   siteConfig() {
      if (this._config && this._config.site) {
         return this._config.site;
      }
      return configDefaults.site;
   }

   tenantConfig() {
      if (this._config && this._config.tenant) {
         return this._config.tenant;
      }
      return null;
   }

   uiSettings() {
      if (window.innerWidth < 768) {
         return ConfigMobile;
      }
      return ConfigDesktop;
   }

   /**
    * @typedef User - based on SITE_USER
    * @property {string} email email address
    * @property {string} id
    * @property {number} isActive wether the user is active in the system
    * @property {string} languageCode
    * @property {string} username
    * ...
    */

   /**
    * Information about the current user
    * @returns {User|null}
    */
   userConfig() {
      return this._configUser?.user ?? null;
   }

   userReal() {
      return this._configUser?.userReal ?? false;
   }
}
export default new Config();
