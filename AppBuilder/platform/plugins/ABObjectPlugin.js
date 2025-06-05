import ABObject from "../ABObject.js";

export default class ABObjectPlugin extends ABObject {
   // constructor(...params) {
   //    super(...params);

   // }

   static getPluginKey() {
      return "ab-object-plugin";
   }

   // Format our getDbInfo() response for the ABDesigner info options.
   async getDbInfo() {
      /*
      // Data format:
      {
          "definitionId": "f2416a1a-d75c-40f2-8180-bad9b5f8b9cc",
          "tableName": "AB_MockupHR_TeamTargetLocation",
          "fields": [
              {
                  "Field": "uuid",
                  "Type": "varchar(255)",
                  "Null": "NO",
                  "Key": "PRI",
                  "Default": null,
                  "Extra": ""
              },
              {
                  "Field": "created_at",
                  "Type": "datetime",
                  "Null": "YES",
                  "Key": "",
                  "Default": null,
                  "Extra": ""
              },
              {
                  "Field": "updated_at",
                  "Type": "datetime",
                  "Null": "YES",
                  "Key": "",
                  "Default": null,
                  "Extra": ""
              },
              {
                  "Field": "properties",
                  "Type": "text",
                  "Null": "YES",
                  "Key": "",
                  "Default": null,
                  "Extra": ""
              }
          ]
      }
      */
      let PK = this.PK();
      let fieldInfo = [];
      this.fields().forEach((f) => {
         let field = {
            Field: f.columnName,
            Type: f.key,
            Null: f.settings.required ? "NO" : "YES",
            Key: PK == f.columnName ? "PRI" : "",
            Default: "",
            Extra: "",
         };
         fieldInfo.push(field);
      });

      let TableInfo = {
         definitionId: this.id,
         tableName: this.tableName,
         fields: fieldInfo,
      };

      return TableInfo;
   }
}
