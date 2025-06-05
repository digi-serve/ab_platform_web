const atomicjs = require("atomicjs");
const ABObjectApiCore = require("../core/ABObjectApiCore");

module.exports = class ABObjectApi extends ABObjectApiCore {
   constructor(attributes, AB) {
      super(attributes, AB);
   }

   async fetchData(insertDataMax = 20) {
      if (this.isFetched) return;

      const headers = this.headers;

      const response = await atomicjs(this.request.url, {
         method: this.request.verb,
         headers,
         data: {},
         timeout: null,
         withCredentials: false,
      });

      let parsedResponse = this.dataFromKey(response);

      const model = this.model();

      if (parsedResponse.length == null || parsedResponse.length === 0) {
         const data = {};

         this.response.fields.forEach((f) => {
            data[f.columnName] = parsedResponse[f.columnName];
         });

         await model.create(data);

         return;
      }

      let pendingModelCreate = [];

      for (let i = 0; i < parsedResponse.length; i++) {
         const data = {};

         this.response.fields.forEach((f) => {
            data[f.columnName] = parsedResponse[i][f.columnName];
         });

         pendingModelCreate.push(model.create(data));

         if (pendingModelCreate.length % insertDataMax === 0)
            await Promise.all(pendingModelCreate);
      }

      if (pendingModelCreate.length > 0) await Promise.all(pendingModelCreate);

      this.isFetched = true;

      await this.save();
   }

   fromValues(values) {
      super.fromValues(values)
   }

   /**
    * @method save()
    *
    * persist this instance of ABObject with it's parent ABApplication
    *
    *
    * @return {Promise}
    *						.resolve( {this} )
    */
   async save() {
      return await super.save(true);
   }

   migrateCreate() {
      return Promise.resolve();
   }

   migrateDrop() {
      return Promise.resolve();
   }
};
