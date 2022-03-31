/**
 * ABMLClass
 * manage the multilingual information of an instance of a AB Defined Class.
 *
 * these classes have certain fields ("label", "description"), that can be
 * represented in different language options as defined by our platform.
 *
 * This platform ABMLClass will define 2 methods that allow for the translation
 * untranslation of this data.
 */
var ABMLClassCore = require("../core/ABMLClassCore");

module.exports = class ABMLClass extends ABMLClassCore {
   constructor(fieldList, AB) {
      super(fieldList, AB);

      this._warnings = [];
      // {array}
      // an array of warning messages for this object.

      this.on("warning", (message, data) => {
         this._warnings.push({ message, data });
      });
   }

   // fromValues(attributes) {
   //    super.fromValues(attributes);
   // }

   warnings() {
      return this._warnings;
   }

   warningsEval() {
      this._warnings = [];
      // if (
      //    ["datacollection", "object", "query", "process"].indexOf(this.type) >
      //    -1
      // ) {
      //    console.warn(
      //       `ABML Object [${this.type}][${this.label}] has not overwritten .warningsEval()`
      //    );
      // }

      // many of our warnings are generated during the .fromValues() method
      // when we initialize our Objects.  So, cause this process to repeat.
      this.fromValues(this.toObj());
   }

   warningsAll() {
      // console.warn(
      //    `ABML Object [${this.label}] has not overwritten .warningsAll()`
      // );
      return this.warnings();
   }

   /**
    * @method languageDefault
    * return a default language code.
    * @return {string}
    */
   languageDefault() {
      return this.AB.Account.language() || "en";
   }

   /**
    * @method destroy()
    * remove this definition.
    * @return {Promise}
    */
   async destroy() {
      var def = this.toDefinition();
      if (def.id) {
         return def.destroy().catch((err) => {
            if (err.toString().indexOf("No record found") > -1) {
               // this is weird, but not breaking:
               console.log(
                  `ABMLClass.destroy(): could not find record for id[${def.id}]`
               );
               console.log(def);
               return;
            }
            throw err;
         });
      }
      return Promise.resolve();
   }

   /**
    * @method save()
    * persist this definition of our {ABxxx} Object
    * @return {Promise}
    */
   async save() {
      var def = this.toDefinition();
      // if not name, try to use our label as the name
      def.name = def.name || this.name || this.label || "name";
      var data = await def.save();
      if (!this.id) {
         this.id = data.id;
      }
   }
};
