//
// ABModelAPI
//
// Represents the Data interface for an ABObjectQuery data.

const ABModel = require("./ABModel");

module.exports = class ABModelAPI extends ABModel {
   ///
   /// Instance Methods
   ///

   /**
    * @method findAll
    * performs a data find with the provided condition.
    */
   async findAll(cond = {}) {
      cond.isAPI = true;
      cond.url = this.object?.request?.url;

      return super.findAll(cond);
   }

   /**
    * @method batchCreate
    * update model values on the server.
    */
   batchCreate(values) {
      const error = new Error(
         "ABObjectApi.ABModelAPI.batchCreate() does not be implemented."
      );
      return Promise.reject(error);
   }

   /**
    * @method create
    * update model values on the server.
    */
   async create(values) {
      const error = new Error(
         "ABObjectApi.ABModelAPI.create() does not be implemented."
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
      const error = new Error(
         "ABObjectApi.ABModelAPI.delete() does not be implemented."
      );
      return Promise.reject(error);
   }

   /**
    * @method update
    * update model values on the server.
    */
   update(id, values) {
      const error = new Error(
         "ABObjectApi.ABModelAPI.update() does not be implemented."
      );
      return Promise.reject(error);
   }

   /**
    * @method batchUpdate
    * update value to many rows on the server.
    */
   batchUpdate({ rowIds, values }) {
      const error = new Error(
         "ABObjectApi.ABModelAPI.batchUpdate() does not be implemented."
      );
      return Promise.reject(error);
   }
};
