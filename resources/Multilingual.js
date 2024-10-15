/*
 * Multilingual
 * manage our multilingual Translations/Labels/etc.
 */

var MLClass = require("../AppBuilder/platform/ABMLClass");

class Multilingual extends MLClass {
   constructor() {
      super([], {});
      // super()
      //    [] = no labels
      //    {} = placeholder ABFactory entry until .init() is called.

      this.isAuthenticated = false;
      this._config = null;

      this._missingLabelID = false;
      this._missingLabels = {};
      this._pluginLabelsMissing = {};

      this.isLabelUpdateEnabled = false;
      // {bool}
      // we can only update labels on the server if this is enabled.
      // Only on a Developers environment should we enable this:
      // javascript console: > window.AB.Multilingual.enableLabelUpdates();
   }

   init(AB) {
      // {ABFactory} AB

      this.AB = AB;

      this.labels = this.AB.Config.labelConfig();
      this._languages = this.AB.Config.languageConfig();

      this.pluginLabels = {};

      // this isn't actually an Async operation, so just resolve()
      return Promise.resolve();
   }

   currentLanguage() {
      return this.AB.Account.language();
   }

   enableLabelUpdates() {
      this.isLabelUpdateEnabled = true;
   }

   label(key, altText, values = [], postMissing = true) {
      // part of our transition: L("single string") should start to work:
      if (typeof altText == "undefined" && key) {
         altText = key;
      }

      // other case: L("single string {0}", [])
      if (arguments.length == 2 && Array.isArray(altText)) {
         values = altText;
         altText = key;
      }

      // We need to escape " characters or else they will get added to the the lang.js
      // then we get errors next time we try to parse it as JSON (see appbuilder.label-missing)
      altText = altText.replace(/"/g, '\\"');
      key = key.replace(/"/g, '\\"');

      // NOTE: transition to new Labels
      // currently our code still uses the L(key, altText, values) format, but
      // the labels we get back are in L(altText, values) format.
      //
      // we are going to keep this like this until we have a well functioning
      // UI display of our Apps, which should flesh out most of the missing
      // labels to our files.
      //
      // After that, convert our L(k, t, v) to L(t, v)

      var newKey = altText;
      if (newKey[0] == "*") {
         newKey = newKey.slice(1);
      }
      var label = this.labels[newKey];
      if (!label) {
         if (postMissing) {
            this.postMissingLabel(key, altText);
         }
         label = altText;
      }

      values.forEach((v, i) => {
         var sub = `{${i}}`;
         label = label.replaceAll(sub, v);
      });
      label = label.replace(/\\"/g, '"'); // unescape " in the label
      return label;
   }

   labelPlugin(plugin, altText, values = []) {
      // 1st check to see if it is a common label from platform:
      var label = this.label(altText, altText, values, false);
      if (!label) {
         // ok, so check to see if it is a Plugin Label:
         label = this.pluginLabels[plugin][altText];
      }
      if (!label) {
         // !! record it missing.
         this._pluginLabelsMissing[plugin] =
            this._pluginLabelsMissing[plugin] || {};
         this._pluginLabelsMissing[plugin][altText] = altText;
         label = altText;
      }
      values.forEach((v, i) => {
         var sub = `{${i}}`;
         label = label.replaceAll(sub, v);
      });
      return label;
   }

   languages() {
      return this._languages;

      // console.error(
      //    "Multilingual:languages(): Implement Language Storage/Retrieval."
      // );
      // return [];
   }

   pluginLoadLabels(key, labels) {
      this.pluginLabels[key] = labels;
   }
   pluginLabelReport(key) {
      console.warn("missing labels for plugin: ", key);
      console.warn("current language:", this.currentLanguage());
      var labels = JSON.stringify(this._pluginLabelsMissing[key], null, 3);
      console.warn(labels);
   }

   postMissingLabel(key, altText) {
      if (!this.isLabelUpdateEnabled) return;

      if (this._missingLabelID) {
         clearTimeout(this._missingLabelID);
      }
      var batchLength = 50;
      var sendBatch = () => {
         var batchLabels = [];
         let missingLabels = Object.keys(this._missingLabels).map(
            (k) => this._missingLabels[k]
         );
         if (missingLabels.length <= batchLength) {
            batchLabels = missingLabels;
            this._missingLabels = {};
         } else {
            for (var i = 0; i <= batchLength; i++) {
               var l = missingLabels.shift();
               batchLabels.push(l);
               delete this._missingLabels[l.key];
            }
         }
         this.AB.Network.post({
            url: "/multilingual/label-missing",
            data: { labels: JSON.stringify(batchLabels) },
         })
            .then(() => {
               if (Object.keys(this._missingLabels).length > 0) {
                  sendBatch();
               }
            })
            .catch((err) => {
               const strErr = err.toString();
               if (strErr.indexOf("unable to get") > -1) {
                  console.error(
                     "Missing language file for :" + this.currentLanguage()
                  );
               }
            });
      };
      this._missingLabelID = setTimeout(() => {
         sendBatch();
      }, 1000);

      this._missingLabels[key] = { key, altText };
   }
   ///
   /// Disable un-needed ABMLClass functionality
   ///
   /// NOTE: we are mainly Piggybacking on ABMLClass for it's
   /// .translate() and .unTranslate() capabilities. So disable these
   /// for good measure.
   destroy() {
      console.error("Multilingual:destroy(): Should not be called.");
      return Promise.resolve();
   }
   save() {
      console.error("Multilingual:save(): Should not be called.");
      return Promise.resolve();
   }
   toObj() {
      console.error("Multilingual:toObj(): Should not be called.");
      return {};
   }
   toDefinition() {
      console.error("Multilingual:toDefinition(): Should not be called.");
      return {};
   }
}

export default new Multilingual();
