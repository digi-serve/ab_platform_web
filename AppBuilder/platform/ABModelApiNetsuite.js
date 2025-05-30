//
// ABModelAPINetsuite
//
// Represents the Data interface for a connection to Netsuite.

const ABModel = require("./ABModel");

module.exports = class ABModelAPINetsuite extends ABModel {
   ///
   /// Instance Methods
   ///
   async create(values) {
      const newVals = await super.create(values);
      this.AB.emit("ab.datacollection.create", {
         objectId: this.object.id,
         data: newVals,
      });
      return newVals;
   }

   /**
    * @method normalizeData()
    * For a Netsuite object, there are additional steps we need to handle
    * to normalize our data.
    */
   normalizeData(data) {
      super.normalizeData(data);

      if (!Array.isArray(data)) {
         data = [data];
      }

      var boolFields = this.object.fields((f) => f.key == "boolean");
      let allFields = this.object.fields();

      data.forEach((d) => {
         // Netsuite sometimes keeps keys all lowercase
         // which might not match up with what it told us in the meta-catalog
         // which we need:
         for (var i = 0; i < allFields.length; i++) {
            let actualColumn = allFields[i].columnName;
            let lcColumn = actualColumn.toLowerCase();

            if (
               typeof d[actualColumn] == "undefined" &&
               typeof d[lcColumn] != "undefined"
            ) {
               d[actualColumn] = d[lcColumn];
               delete d[lcColumn];
            }
         }

         // Netsuite Booleans are "T" or "F"
         boolFields.forEach((bField) => {
            let val = d[bField.columnName];
            // just how many ways can a DB indicate True/False?
            if (typeof val == "string") {
               val = val.toLowerCase();

               if (val === "t") val = true;
               else val = false;

               d[bField.columnName] = val;
            }
         });
      });
   }
};
