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
   async findAll(cond) {
      const requestConfigs = this.object.request ?? {};

      // Load data
      const response = await fetch(requestConfigs.url, {
         method: (requestConfigs.verb ?? "GET").toUpperCase(),
         headers: this.object.headers,
         mode: "cors",
         cache: "no-cache",
      });

      // Convert to JSON
      let result = await response.json();

      // Extract data from key
      result = this.object.dataFromKey(result);

      // TODO: filter data from FilterComplex by .cond variable

      return new Promise((resolve, reject) => {
         const context = { resolve, reject };
         const err = null;
         const data = {
            data: result,
            // TODO: Paging
            // limit: 30,
            // offset: 0,
            // pos: 0,
            // total_count: 3
         };
         this.handler_findAll(context, err, data);
      });
   }

   /**
    * @method batchCreate
    * update model values on the server.
    */
   batchCreate(values) {
      var error = new Error(
         "ABObjectQuery.ABModelAPI.batchCreate() does not be implemented."
      );
      return Promise.reject(error);
   }

   /**
    * @method create
    * update model values on the server.
    */
   async create(values) {
      if (this.object.isFetched && this.object.readonly === 1)
         return await Promise.reject(new Error("This is the read only object"));

      await super.create(values);
   }

   /**
    * @method delete
    * remove this model instance from the server
    * @param {integer|UUID} id  the .id of the instance to remove.
    * @return {Promise}
    */
   delete(id) {
      var error = new Error(
         "ABObjectQuery.ABModelAPI.delete() does not be implemented."
      );
      return Promise.reject(error);
   }

   /**
    * @method update
    * update model values on the server.
    */
   update(id, values) {
      var error = new Error(
         "ABObjectQuery.ABModelAPI.update() does not be implemented."
      );
      return Promise.reject(error);
   }

   /**
    * @method batchUpdate
    * update value to many rows on the server.
    */
   batchUpdate({ rowIds, values }) {
      var error = new Error(
         "ABObjectQuery.ABModelAPI.batchUpdate() does not be implemented."
      );
      return Promise.reject(error);
   }
};
