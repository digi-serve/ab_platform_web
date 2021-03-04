//
// ABModelQuery
//
// Represents the Data interface for an ABObjectQuery data.

const ABModel = require("./ABModel");

module.exports = class ABModelQuery extends ABModel {
   ///
   /// Instance Methods
   ///

   /**
    * @method batchCreate
    * update model values on the server.
    */
   batchCreate(values) {
      var error = new Error(
         "ABObjectQuery.ABModelQuery.batchCreate() should not be called."
      );
      return Promise.reject(error);
   }

   /**
    * @method create
    * update model values on the server.
    */
   create(values) {
      var error = new Error(
         "ABObjectQuery.ABModelQuery.create() should not be called."
      );
      return Promise.reject(error);
   }

   /**
    * @method delete
    * remove this model instance from the server
    * @param {integer|UUID} id  the .id of the instance to remove.
    * @return {Promise}
    */
   delete(id) {
      var error = new Error(
         "ABObjectQuery.ABModelQuery.delete() should not be called."
      );
      return Promise.reject(error);
   }

   /**
    * @method update
    * update model values on the server.
    */
   update(id, values) {
      var error = new Error(
         "ABObjectQuery.ABModelQuery.update() should not be called."
      );
      return Promise.reject(error);
   }

   /**
    * @method batchUpdate
    * update value to many rows on the server.
    */
   batchUpdate({ rowIds, values }) {
      var error = new Error(
         "ABObjectQuery.ABModelQuery.batchUpdate() should not be called."
      );
      return Promise.reject(error);
   }
};
