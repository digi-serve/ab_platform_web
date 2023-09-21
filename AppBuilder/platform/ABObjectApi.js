const atomicjs = require("atomicjs");
const ABObjectApiCore = require("../core/ABObjectApiCore");

module.exports = class ABObjectApi extends ABObjectApiCore {
   constructor(attributes, AB) {
      super(attributes, AB);
   }

   async fetchData(insertDataMax = 20) {
      if (this.isFetched) return;

      const headers = {};

      this.request.headers.forEach((header) => {
         headers[header.key] = header.value;
      });

      const response = await atomicjs(this.request.url, {
         method: this.request.verb,
         headers,
         data: {},
         timeout: null,
         withCredentials: false,
      });

      let parsedResponse = response;

      this.response.dataKey.split(".").forEach((key) => {
         parsedResponse = parsedResponse[key];
      });

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

         if (pendingModelCreate % insertDataMax === 0)
            await Promise.all(pendingModelCreate);
      }

      if (pendingModelCreate.length > 0) await Promise.all(pendingModelCreate);

      this.isFetched = true;

      await this.save();
   }

   ///
   /// Fields
   ///

   /**
    * @method importFields
    * instantiate a set of fields from the given attributes.
    * Our attributes are a set of field URLs That should already be created in their respective
    * ABObjects.
    * @param {array} fieldSettings The different field urls for each field
    *             { }
    * @param {bool} shouldAliasColumn
    *        should we add the object alias to the columnNames?
    *        this is primarily used on the web client
    */
   importFields(fieldSettings) {
      super.importFields(fieldSettings);

      this._fields.forEach((fieldEntry) => {
         // include object name {aliasName}.{columnName}
         // to use it in grid headers & hidden fields
         fieldEntry.field.columnName = `${fieldEntry.alias}.${fieldEntry.field.columnName}`;
      });
   }
};
