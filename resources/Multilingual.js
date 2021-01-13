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
   }

   init(AB) {
      // {ABFactory} AB

      this.AB = AB;

      this.labels = this.AB.Config.labelConfig();

      // this isn't actually an Async operation, so just resolve()
      return Promise.resolve();
   }

   currentLanguage() {
      console.error("Multilingual:currentLanguage(): figure this out.");
      return "en";
   }

   label(key, altText, values = []) {
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
         this.postMissingLabel(key, altText);
         label = altText;
      }

      values.forEach((v, i) => {
         var sub = `{${i}}`;
         label = label.replaceAll(sub, v);
      });
      return label;
   }

   languages() {
      console.error(
         "Multilingual:languages(): Implement Language Storage/Retrieval."
      );
      return [];
   }

   postMissingLabel(key, altText) {
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
         }).then(() => {
            if (Object.keys(this._missingLabels).length > 0) {
               sendBatch();
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
