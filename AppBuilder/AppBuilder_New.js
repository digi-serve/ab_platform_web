var EventEmitter = require("events").EventEmitter;

var configDefaults = {
   "appbuilder-portal-autoenter": true,
   // autoenter {bool} open up the portal as soon as we load.
   //           false : just displays a link that will load the portal

   "appbuilder-portal-fullscreen": true,
   // fullscreen {bool} take up the full browser window
   //            false : the only take up the area the current div is

   "appbuilder-tenant": null,
   // tenant {string} the tenant uuid for this AppBuilder instance.

   "appbuilder-tenant-prefix": null
   // TESTING! Remove this
};

class AppBuilder extends EventEmitter {
   constructor() {
      super();

      this.setMaxListeners(0);
      this._config = null;
      this._div = null;
      this._settings = {};
      this._ui = null;

      // TODO: make sure "error" s are handled and sent to logs
      // this.on("error", ()=>{ Analytics.error })
   }

   config(json) {
      this._config = json;
   }

   div(el) {
      if (el) {
         this._div = el;
         return;
      }
      return this._div;
   }

   setting(key, value) {
      if (value) {
         this._settings[key] = value;
         return;
      }
      return this._settings[key];
   }

   settingsFromDiv(div) {
      Object.keys(configDefaults).forEach((d) => {
         var val = div.getAttribute(d);
         if (!val) {
            val = configDefaults[d];
         }
         if (val == "false") val = false;
         if (val == "true") val = true;

         var key = d.split("-").pop();
         this.setting(key, val);
      });
   }

   error(...args) {
      this.emit("ab.error", args);
   }

   siteConfig() {
      if (this._config && this._config.site) {
         return this._config.site;
      }
      return null;
   }

   tenantConfig() {
      if (this._config && this._config.tenant) {
         return this._config.tenant;
      }
      return null;
   }

   userConfig() {
      if (this._config && this._config.user) {
         return this._config.user;
      }
      return null;
   }

   ui(UI) {
      if (UI) {
         this._ui = UI;
         return;
      }
      return this._ui;
   }
}
module.exports = new AppBuilder();
