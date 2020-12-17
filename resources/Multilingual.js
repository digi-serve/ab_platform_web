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
   }

   init(AB) {
      // {ABFactory} AB

      this.AB = AB;

      // this isn't actually an Async operation, so just resolve()
      return Promise.resolve();
   }

   currentLanguage() {
      console.error("Multilingual:currentLanguage(): figure this out.");
      return "en";
   }

   label(key, altText, values = []) {
      console.error("Multilingual:label(): Implement Label Storage.");
      var label = altText;
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
