const _ = require("lodash");

// prettier-ignore
const ABApplicationCore = require("../core/ABApplicationCore.js");

const ABViewPage = require("./views/ABViewPage");
const ABViewManager = require("./ABViewManager");

module.exports = class ABClassApplication extends ABApplicationCore {
   constructor(attributes, AB) {
      super(attributes, AB);

      // now listen for any updates to our managed objects
      this._handler_page_updated = (definition) => {
         var currPage = this._pages.find((p) => p.id === definition.id);
         if (currPage) {
            this._pages = this._pages.filter((p) => p.id != currPage.id);
            this._pages.push(currPage.refreshInstance());
         }
      };
      this._pages.forEach((p) => {
         p.on("definition.updated", this._handler_page_updated);
      });
   }

   static applications(/*fn = () => true*/) {
      console.error(
         "ABApplication.applicationForID(): Depreciated. Who is doing this?"
      );
      return null;
   }
   static applicationForID(/*id*/) {
      var errDepreciated = new Error(
         "ABApplication.applicationForID(): Depreciated. Who is doing this?"
      );
      console.error(errDepreciated);
      return null;
   }

   static definitionForID(/*id*/) {
      var errDepreciated = new Error(
         "ABApplication.definitionForID(): Depreciated. Who is doing this?"
      );
      console.error(errDepreciated);
      return null;
   }

   areaKey() {
      return _.kebabCase(`ab-${this.name}`);
   }

   /**
    * @method refreshInstance()
    * Used when a definition.updated message is detected on this ABApplication.
    * This method will return a new instance based upon the current definition
    * and properly resolve any handlers and pending network Requests.
    * @return {ABObject}
    */
   refreshInstance() {
      var newObj = this.AB.applicationByID(this.id);

      // remove my listeners
      this._pages.forEach((p) => {
         p.removeListener("definition.updated", this._handler_page_updated);
      });

      return newObj;
   }

   ///
   /// Definition
   ///

   /**
    * @method objectRemove()
    * remove the current ABObject from our list of .objectIDs.
    * NOTE: this method persists the changes to the server.
    * @param {ABObject} object
    * @return {Promise}
    */
   objectRemove(object) {
      var begLen = this.objectIDs.length;
      this.objectIDs = this.objectIDs.filter((id) => {
         return id != object.id;
      });
      // if there was a change then save this.
      if (begLen != this.objectIDs.length) {
         return this.save();
      }
      return Promise.resolve();
   }

   /**
    * @method objectInsert()
    * persist the current ABObject in our list of .objectIDs.
    * @param {ABObject} object
    * @return {Promise}
    */
   objectInsert(object) {
      var isIncluded = this.objectIDs.indexOf(object.id) != -1;
      if (!isIncluded) {
         this.objectIDs.push(object.id);
         // Save our own Info:
         return this.save();
      }
      return Promise.resolve();
   }

   /**
    * @method exportIDs()
    * export any relevant .ids for the necessary operation of this application.
    * @param {array} ids
    *         the array of ids to insert any relevant .ids into
    */
   exportIDs(ids) {
      // make sure we don't get into an infinite loop:
      if (ids.indexOf(this.id) > -1) return;

      ids.push(this.id);

      // start with Objects:
      this.objectsIncluded().forEach((o) => {
         o.exportIDs(ids);
      });

      // Queries
      this.queriesIncluded().forEach((q) => {
         q.exportIDs(ids);
      });

      // Datacollections
      // NOTE: currently the server doesn't make instances of DataCollections
      // so we manually parse the related info here:
      this.datacollectionIDs.forEach((dID) => {
         if (ids.indexOf(dID) > -1) return;

         var def = this.AB.definitionByID(dID);
         if (def) {
            ids.push(dID);
            if (def.settings.datasourceID) {
               var object = this.AB.objects((o) => {
                  return o.id == def.settings.datasourceID;
               })[0];
               if (object) {
                  object.exportIDs(ids);
               }
            }
         }
      });

      // Processes
      this.processes().forEach((p) => {
         p.exportIDs(ids);
      });

      // Pages
      // NOTE: currently the server doesn't make instances of ABViews
      // so we manually parse the object data here:
      var parseView = (view) => {
         if (ids.indexOf(view.id) > -1) return;
         ids.push(view.id);
         (view.pageIDs || []).forEach((pid) => {
            var pdef = this.AB.definitionByID(pid);
            if (pdef) {
               parseView(pdef);
            }
         });

         (view.viewIDs || []).forEach((vid) => {
            var vdef = this.AB.definitionByID(vid);
            if (vdef) {
               parseView(vdef);
            }
         });
      };

      var pageIDs = this._pages.map((p) => p.id);
      (pageIDs || []).forEach((pid) => {
         var pdef = this.AB.definitionByID(pid);
         if (pdef) {
            parseView(pdef);
         }
      });

      // return only unique entries:
      ids = _.uniq(ids);
   }

   /**
    * @method viewNew()
    *
    *
    * @return {ABView}
    */
   pageNew(values) {
      // make sure this is an ABViewPage description
      values.key = ABViewPage.common().key;

      return ABViewManager.newView(values, this, null);
   }

   save() {
      // if someone just changed the name of our ABApplication, reflect that
      // in our Def.Name
      if (this.name != this.label) {
         this.name = this.label;
      }
      return super.save();
   }

   warningsEval() {
      this._warnings = [];

      //
      // check for valid object references:
      //
      var checks = {
         objectIDs: "object",
         queryIDs: "query",
         datacollectionIDs: "datacollection",
      };

      Object.keys(checks).forEach((k) => {
         this[k].forEach((id) => {
            var def = this.AB.definitionByID(id);
            if (!def) {
               this.emit(
                  "warning",
                  `Application is referencing a missing ${checks[k]}`,
                  {
                     appID: this.id,
                     id,
                  }
               );
            }
         });
      });

      //
      // Make sure there is some way to access this Application:
      //
      if (this.roleAccess.length == 0 && !this.isAccessManaged) {
         this.emit(
            "warning",
            "Application has no Role assigned, and is unaccessible."
         );
      }

      // do our Role references exist?
      var allRoles = this.AB.Account.rolesAll().map((r) => r.id);
      this.roleAccess.forEach((r) => {
         if (allRoles.indexOf(r) == -1) {
            this.emit(
               "warning",
               `Specified Role Access [${r}] does not exist in this system`,
               { role: r }
            );
         }
      });
   }

   warningsAll() {
      var warnings = [].concat(this._warnings);
      [
         "objectsIncluded",
         "queriesIncluded",
         "datacollectionsIncluded",
         "processes",
         "pages",
         "views",
      ].forEach((k) => {
         this[k]().forEach((o) => {
            warnings = warnings.concat(o.warnings());
         });
      });

      return warnings;
   }

   /**
    * @method mobileAppNew()
    *
    * return an instance of a new (unsaved) ABMobileApp that is tied to this
    * ABApplication.
    *
    * @return {ABMobileApp}
    */
   // mobileAppNew(values) {
   //    return new ABMobileApp(values, this);
   // }
};
