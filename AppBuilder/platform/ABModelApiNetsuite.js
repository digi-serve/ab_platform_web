//
// ABModelAPINetsuite
//
// Represents the Data interface for a connection to Netsuite.

const ABModel = require("./ABModel");

module.exports = class ABModelAPINetsuite extends ABModel {
   ///
   /// Instance Methods
   ///

   /**
    * @method findAll
    * performs a data find with the provided condition.
    */
   async findAll(cond = {}) {
      // cond.isNetsuite = true;

      // the server side handler will decode the cond obj
      // with any specific info needed that isn't part
      // of this Obj's data.

      // include those parameters here in cond, eg:
      // cond.url = this.object?.request?.url;

      return super.findAll(cond);
   }

   /**
    * @method batchCreate
    * update model values on the server.
    */
   batchCreate(values) {
      const error = new Error(
         "ABObjectApi.ABModelAPINetsuite.batchCreate() does not be implemented."
      );
      return Promise.reject(error);
   }

   /**
    * @method create
    * update model values on the server.
    */
   // async create(values) {
   //    const error = new Error(
   //       "ABObjectApi.ABModelAPINetsuite.create() does not be implemented."
   //    );
   //    return Promise.reject(error);
   // }

   /**
    * @method delete
    * remove this model instance from the server
    * @param {integer|UUID} id  the .id of the instance to remove.
    * @return {Promise}
    */
   delete(id) {
      const error = new Error(
         "ABObjectApi.ABModelAPINetsuite.delete() does not be implemented."
      );
      return Promise.reject(error);
   }

   /**
    * @method update
    * update model values on the server.
    */
   update(id, values) {
      const error = new Error(
         "ABObjectApi.ABModelAPINetsuite.update() does not be implemented."
      );
      return Promise.reject(error);
   }

   /**
    * @method batchUpdate
    * update value to many rows on the server.
    */
   batchUpdate({ rowIds, values }) {
      const error = new Error(
         "ABObjectApi.ABModelAPINetsuite.batchUpdate() does not be implemented."
      );
      return Promise.reject(error);
   }
};
