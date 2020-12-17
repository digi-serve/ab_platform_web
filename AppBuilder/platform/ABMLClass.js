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
   // constructor(fieldList) {
   //    super(fieldList);
   // }

   /**
    * @method translate()
    *
    * translate the multilingual fields (in this.mlFields) from
    * our .translation data.
    */
   /*
    translate(instance, attributes, fields) {
        if (!instance) instance = this;
        if (!attributes) attributes = this;
        if (!fields) fields = this.mlFields;

        super.translate(instance, attributes, fields);
    }
    */

   /**
    * @method unTranslate()
    *
    * un-translate the multilingual fields (in this.mlFields) into
    * our .translation data
    */
   /*
    unTranslate(instance, attributes, fields) {
        if (!instance) instance = this;
        if (!attributes) attributes = this;
        if (!fields) fields = this.mlFields;
        
        super.unTranslate(instance, attributes, fields);
    }
    */

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
   destroy() {
      var def = this.toDefinition().toObj();
      if (def.id) {
         // here ABDefinition is our sails.model()
         return new Promise((resolve, reject) => {
            this.AB.definitionDestroy(def.id)
               .then(resolve)
               .catch((err) => {
                  if (err.toString().indexOf("No record found") > -1) {
                     // this is weird, but not breaking:
                     console.log(
                        `ABMLClass.destroy(): could not find record for id[${def.id}]`
                     );
                     console.log(def);
                     return resolve();
                  }
                  reject(err);
               });
         });
      } else {
         return Promise.resolve();
      }
   }

   /**
    * @method save()
    * persist this definition of our {ABxxx} Object
    * @return {Promise}
    */
   save() {
      var def = this.toDefinition().toObj();
      def.name = def.name || this.name || this.label || "name";
      def.type = def.type || this.type || "type";
      if (def.id) {
         // here ABDefinition communicates directly with our sails model
         return this.AB.definitionUpdate(def.id, def);
      } else {
         return this.AB.definitionCreate(def).then((data) => {
            this.id = data.id;
         });
      }
   }
};
