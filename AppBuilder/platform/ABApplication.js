const _ = require("lodash");

// prettier-ignore
const ABApplicationCore = require("../core/ABApplicationCore.js");

const ABView = require("./views/ABView");

module.exports = class ABClassApplication extends ABApplicationCore {
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

   // actionKeyName() {
   //    return `opstools.${this.validAppName()}.view`;
   // }

   validAppName() {
      return this.AB.rules.toApplicationNameFormat(this.name);
   }

   ////
   //// DB Related
   ////

   dbApplicationName() {
      return this.AB.rules.toApplicationNameFormat(this.name);
   }

   ///
   /// Definition
   ///

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
      return new ABView(values, this);
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
