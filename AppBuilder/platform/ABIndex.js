const ABIndexCore = require("../core/ABIndexCore");

module.exports = class ABIndex extends ABIndexCore {
   // constructor(attributes, object) {
   //    super(attributes, object);
   // }

   /**
    * @method save()
    * persist this instance of ABIndex with it's parent ABObject
    * @return {Promise}
    */
   save() {
      return super
         .save()
         .then(() => this.object.indexSave(this))
         .then(() => this.migrateCreate());
   }

   /**
    * @method destroy()
    * destroy the current instance of ABIndex
    * also remove it from our parent ABObject
    * @return {Promise}
    */
   destroy() {
      return new Promise((resolve, reject) => {
         if (this.id) {
            this.migrateDrop()
               .then(() => {
                  return super.destroy();
               })
               .then(() => this.object.indexRemove(this))
               .then(resolve)
               .catch(reject);
         } else {
            resolve();
         }
      });
   }

   warningsEval() {
      super.warningsEval();

      (this._unknownFieldIDs || []).forEach((id) => {
         this.warningsMessage(`is referencing an unknown field id[${id}]`);
      });

      if (this.fields.length == 0) {
         this.warningsMessage(`is not referencing any fields`);
      }
   }

   /**
    * @method warningsMessage()
    * generate a commonly formatted warning message for this ABField.
    * This is expected to be called from within a .warningsEval()
    * method when generating warnings.
    * @param {string} msg
    *        the warning string to display
    * @param {json} data
    *        any relevant additional information for a developer to refer to.
    */
   warningsMessage(msg, data = {}) {
      let message = `Index[${this.label}]: ${msg}`;
      this._warnings.push({ message, data });
   }

   ///
   /// DB Migrations
   ///

   migrateCreate() {
      return this.AB.Network.post({
         url: `/definition/migrate/object/${this.object.id}/index/${this.id}`,
         // data: this.toObj(),
      });
   }

   migrateDrop() {
      return this.AB.Network["delete"]({
         url: `/definition/migrate/object/${this.object.id}/index/${this.id}`,
      });
   }
};
