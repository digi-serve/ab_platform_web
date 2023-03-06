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
      // each warning entry should be in the format:
      // WarningMessage: {
      //    message: {string} "message to display"
      //    data: {json} additional debugging information
      // }
   }

   // fromValues(attributes) {
   //    super.fromValues(attributes);
   // }

   /**
    * @method warnings()
    * returns the stored warnings for this ONE object.
    * @return {array} WarningMessage
    */
   warnings() {
      return this._warnings;
   }

   /**
    * @method warningsEval()
    * This method causes an object to re-evaluate it's settings to see if there
    * are any potential errors.
    */
   warningsEval() {
      this._warnings = [];
   }

   /**
    * @method warningsAll()
    * returns all relevant warnings for the current Object. This includes any
    * sub fields, links, views, etc...
    * @return {array} warning structures
    *          [ {WarningMessage}, ... ]
    */
   warningsAll() {
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
