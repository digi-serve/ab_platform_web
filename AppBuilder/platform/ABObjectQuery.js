//
// ABObjectQuery
//
// A type of Object in our system that is based upon a complex relationship of multiple
// existing Objects.
//
// In the QueryBuilder section of App Builder, a new Query Object can be created.
// An initial Object can be chosen from our current list of Objects. After that, additional Objects
// and a specified join type can be specified.
//
// A list of fields from each specified Object can also be included as the data to be returned.
//
// A where statement is also part of the definition.
//

const ABObjectQueryCore = require("../core/ABObjectQueryCore");

var ABFactory = null;
if (typeof io != "undefined") {
   io.socket.on("ab.query.update", function (msg) {
      if (ABFactory) {
         ABFactory.emit("ab.query.update", {
            queryId: msg.queryId,
            data: msg.data,
         });
      } else {
         console.error(
            "ABObjectQuery:: received io.socket msg before ABFactory is defined"
         );
         console.error("TODO: move this to ABFactory!");
      }
   });
} else {
   console.error("TODO: install socket.io client for sails updates.");
}

// io.socket.on("ab.query.delete", function (msg) {
// });

module.exports = class ABObjectQuery extends ABObjectQueryCore {
   constructor(attributes, AB) {
      super(attributes, AB);

      if (!ABFactory) {
         ABFactory = AB;
      }
      // listen
      this.AB.on("ab.query.update", (data) => {
         if (this.id == data.queryId) this.fromValues(data.data);
      });
   }

   ///
   /// Static Methods
   ///
   /// Available to the Class level object.  These methods are not dependent
   /// on the instance values of the Application.
   ///

   ///
   /// Instance Methods
   ///

   /// ABApplication data methods

   /**
    * @method destroy()
    *
    * destroy the current instance of ABObjectQuery
    *
    * also remove it from our parent application
    *
    * @return {Promise}
    */
   destroy() {
      return super.destroy().then(() => {
         console.error("Move .queryRemove() to Appbuilder Designer.");
         // return this.AB.queryRemove(this);
      });
   }

   /**
    * @method save()
    *
    * persist this instance of ABObjectQuery with it's parent ABApplication
    *
    * @return {Promise}
    *						.resolve( {this} )
    */
   save() {
      return Promise.resolve()
         .then(() => {
            return super.save();
         })
         .then(() => {
            console.error("Move .queryInsert() to AppBuilder Designer.");
            // return this.AB.queryInsert(this);
         });
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

   /**
    * @method columnResize()
    *
    * save the new width of a column
    *
    * @param {} id The instance of the field to save.
    * @param {int} newWidth the new width of the field
    * @param {int} oldWidth the old width of the field
    * @return {Promise}
    */
   columnResize(columnName, newWidth, oldWidth) {
      let field = this.fields((f) => f.columnName == columnName)[0];
      if (field) {
         field.settings.width = newWidth;

         return this.save();
      } else {
         return Promise.resolve();
      }
   }

   ///
   /// DB Migrations
   ///

   /**
    * @method migrateCreate
    * A Query Object doesn't do anything on a migrateCreate() request.
    * override these in case they are called for some reason.
    */
   migrateCreate() {
      return new Promise((resolve, reject) => {
         resolve();
      });
   }

   /**
    * @method migrateDrop
    * A Query Object doesn't do anything on a migrateDrop() request.
    * override these in case they are called for some reason.
    */
   migrateDrop() {
      return new Promise((resolve, reject) => {
         resolve();
      });
   }

   ///
   /// Working with Client Components:
   ///

   // return the column headers for this object
   // @param {bool} isObjectWorkspace  return the settings saved for the object workspace
   columnHeaders(
      isObjectWorkspace,
      isEditable,
      summaryColumns,
      countColumns,
      hiddenFieldNames
   ) {
      var headers = super.columnHeaders(
         isObjectWorkspace,
         isEditable,
         summaryColumns,
         countColumns,
         hiddenFieldNames
      );

      headers.forEach((h) => {
         // pull object by alias
         let object = this.objectByAlias(h.alias);
         if (!object) return;

         let field = object.fieldByID(h.fieldID);
         if (!field) return;

         // NOTE: query v1
         let alias = "";
         if (Array.isArray(this.joins())) {
            alias = field.object.name;
         } else {
            alias = h.alias;
         }

         // include object name {aliasName}.{columnName}
         // to use it in grid headers & hidden fields
         h.id = `${alias}.${field.columnName}`;

         // label
         if (this.settings && this.settings.hidePrefix) {
            h.header = `${field.label || ""}`;
         } else {
            h.header = `${field.object.label || ""}.${field.label || ""}`;
         }

         // icon
         if (field.settings && field.settings.showIcon) {
            h.header = `<span class="webix_icon fa fa-${field.fieldIcon()}"></span>${
               h.header
            }`;
         }

         // If this query supports grouping, then add folder icon to display in grid
         if (this.isGroup) {
            let originTemplate = h.template;

            h.template = (item, common) => {
               if (item[h.id])
                  return (
                     common.icon(item, common) +
                     (originTemplate
                        ? originTemplate(item, common, item[h.id])
                        : item[h.id])
                  );
               else return "";
            };
         }

         h.adjust = true;
         h.minWidth = 220;
      });

      return headers;
   }
};
