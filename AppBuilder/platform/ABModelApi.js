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
      let url = requestConfigs.url;
      let headers = this.object.headers;

      // Paging
      const pagingValues = this.object.getPagingValues({
         skip: cond?.skip,
         limit: cond?.limit,
      });
      if (Object.keys(pagingValues).length) {
         switch (requestConfigs.paging.type) {
            case "queryString":
               url = `${url}?${new URLSearchParams(pagingValues).toString()}`;
               break;
            case "header":
               headers = Object.assign(headers, pagingValues);
               break;
         }
      }

      // Load data
      const response = await fetch(url, {
         method: (requestConfigs.verb ?? "GET").toUpperCase(),
         headers,
         mode: "cors",
         cache: "no-cache",
      });

      // Convert to JSON
      let result = await response.json();

      // Extract data from key
      result = this.object.dataFromKey(result);

      // TODO: filter data from FilterComplex by .cond variable

      const returnData = {
         data: result,
         limit: cond?.limit,
         // offset: 0,
         pos: cond?.skip,
         // total_count: 3
      };

      // Paging
      if (pagingValues.total && result[pagingValues.total] != null) {
         returnData.total_count = result[pagingValues.total];
      }

      return new Promise((resolve, reject) => {
         const context = { resolve, reject };
         const err = null;
         this.handler_findAll(context, err, returnData);
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
