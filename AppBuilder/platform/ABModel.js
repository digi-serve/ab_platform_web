const ABModelCore = require("../core/ABModelCore");

//
// ABModel
//
// Represents the Data interface for an ABObject data.
//
// 2 ways to use an ABModel to load a DataTable:
// 	Method 1:
// 	gather all the data externally and send to the DataTable
//		Model.findAll()
//		.then((data)=>{
//			DataTable.parse(data);
//		})
//
// 	Method 2:
// 	Set the Model object with a condition / skip / limit, then
// 	use it to load the DataTable:
//		Model.where({})
//		.skip(XX)
//		.limit(XX)
//		.loadInto(DataTable);

function errorPopup(error) {
   // Show the pop up
   if (error && error.data && error.data.error == "READONLY") {
      webix.alert({
         title: "Your action is blocked",
         ok: "Ok",
         text: error.data.message || "",
         type: "alert-warning",
      });
   }
}

/*
 * @function no_socket_trigger()
 * a common routine to trigger an update.
 * In the case where our AB.Network.type() isn't a socket implementation
 * we need to manually trigger the expected socket events ourselves.
 * This fn() attempts to simulate the socket responses in such a case.
 * @param {ABModel} model
 *        The ABModel currently processing the network transaction.
 * @param {string} key
 *        The socket update trigger we are simulating.
 * @param {json} data
 *        The relevant response from our network transaction.
 */
function no_socket_trigger(model, key, data) {
   // If we do not have socket updates available, then trigger an
   // update event with this data.
   if (model.AB.Network.type() != "socket") {
      model.AB.emit(key, {
         objectId: model.object.id,
         data,
      });
   }
}

module.exports = class ABModel extends ABModelCore {
   constructor(object) {
      super(object);

      this.handler_create = (...params) => {
         this.handler_common("ab.datacollection.create", ...params);
      };

      this.handler_delete = (...params) => {
         this.handler_common("ab.datacollection.update", ...params);
      };

      this.handler_findAll = (...params) => {
         this.handler_common(null, ...params);
      };

      this.handler_logs = (context, err, data) => {
         if (err) {
            context.reject?.(err);
            return;
         }
         context.resolve?.(data);
      };

      this.handler_update = (...params) => {
         this.handler_common("ab.datacollection.update", ...params);
      };

      this.handler_common = (key, context, err, data) => {
         // key: {string} the relevant socket event key
         //      can be null if not relevant.
         // context : {obj} any provided context data provided on the
         //           this.AB.Network.get() call.
         // err: {Error} any returned error message from api
         // data: {obj} returned data from the model-get api in format:
         //       {data: [], total_count: 1, pos: 0, offset: 0, limit: 0}
         if (err) {
            context.reject?.(err);
            return;
         }
         if (key) {
            // on "update" & "create" we want to normalizeData()
            if (key.indexOf("delete") == -1) {
               this.normalizeData(data);
            }
         } else {
            // on a findAll we normalize data.data
            this.normalizeData(data.data);
         }

         context.resolve?.(data);

         if (key) {
            no_socket_trigger(this, key, data);
         }
      };
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

   // Prepare multilingual fields to be untranslated
   // Before untranslating we need to ensure that values.translations is set.
   prepareMultilingualData(values) {
      // if this object has some multilingual fields, translate the data:
      var mlFields = this.object.multilingualFields();
      // if mlFields are inside of the values saved we want to translate otherwise do not because it will reset the translation field and you may loose unchanged translations
      var shouldTranslate = false;
      if (mlFields.length) {
         mlFields.forEach(function (field) {
            if (values[field] != null) {
               shouldTranslate = true;
            }
         });
      }
      if (shouldTranslate) {
         if (
            values.translations == null ||
            typeof values.translations == "undefined" ||
            values.translations == ""
         ) {
            values.translations = [];
         }
         this.object.unTranslate(values, values, mlFields);
      }
   }

   request(method, params) {
      return this.AB.Network[method](params);
   }

   /**
    * @method batchCreate
    * update model values on the server.
    */
   batchCreate(values) {
      values.batch.map((vals) => {
         return this.prepareMultilingualData(vals.data);
      });

      return new Promise((resolve, reject) => {
         var jobID = this.AB.jobID();
         this.AB.Network.once(jobID, (context, err, data) => {
            if (err) {
               reject(err);
               return;
            }
            this.normalizeData(data);
            resolve(data);
            // FIX: now with sockets, the triggers are fired from socket updates.
            // trigger a create event
            // triggerEvent('create', this.object, data);
         });

         this.AB.Network.post(
            {
               url: this.object.urlRestBatch(),
               params: values,
            },
            {
               key: jobID,
               context: {},
            }
         )
            // .then((data) => {
            //    this.normalizeData(data);

            //    resolve(data);

            //    // FIX: now with sockets, the triggers are fired from socket updates.
            //    // trigger a create event
            //    // triggerEvent('create', this.object, data);
            // })
            .catch(reject);
      });
   }

   /**
    * @method create
    * update model values on the server.
    */
   create(values) {
      this.prepareMultilingualData(values);

      return new Promise((resolve, reject) => {
         var jobID = this.AB.jobID();
         this.AB.Network.once(jobID, this.handler_create);
         this.AB.Network.post(
            {
               url: this.object.urlRest(),
               params: values,
            },
            {
               key: jobID,
               context: { resolve, reject },
            }
         ).catch((err) => {
            errorPopup(err);
            reject(err);
         });
      });
   }

   /**
    * @method delete
    * remove this model instance from the server
    * @param {integer|UUID} id  the .id of the instance to remove.
    * @return {Promise}
    */
   delete(id) {
      return new Promise((resolve, reject) => {
         var jobID = this.AB.jobID();
         this.AB.Network.once(jobID, this.handler_delete);
         this.AB.Network["delete"](
            {
               url: this.object.urlRestItem(id),
            },
            {
               key: jobID,
               context: { resolve, reject },
            }
         ).catch((err) => {
            errorPopup(err);
            reject(err);
         });
      });
   }

   /**
    * @method findAll
    * performs a data find with the provided condition.
    */
   findAll(cond) {
      cond = cond || {};

      // 		// prepare our condition:
      // 		var newCond = {};

      // 		// if the provided cond looks like our { where:{}, skip:xx, limit:xx } format,
      // 		// just use this one.
      // 		if (cond.where) {
      // 			newCond = cond;
      // 		} else {

      // 			// else, assume the provided condition is the .where clause.
      // 			newCond.where = cond;
      // 		}

      // /// if this is our depreciated format:
      // if (newCond.where.where) {
      // 	OP.Error.log('Depreciated Embedded .where condition.');
      // }

      return new Promise((resolve, reject) => {
         var jobID = this.AB.jobID();
         this.AB.Network.once(jobID, this.handler_findAll);
         this.AB.Network.get(
            {
               url: this.object.urlRest(),
               params: cond,
               // params: newCond
            },
            {
               key: jobID,
               context: { resolve, reject },
            }
         )
            // .then((data) => {
            //    this.normalizeData(data.data);

            //    resolve(data);
            // })
            .catch((err) => {
               if (err && err.code) {
                  switch (err.code) {
                     case "ER_PARSE_ERROR":
                        this.AB.notify.developer(err, {
                           message:
                              "AppBuilder:ABModel:findAll(): Parse Error with provided condition",
                           condition: cond,
                        });
                        break;

                     default:
                        this.AB.notify.developer(err, {
                           message:
                              "AppBuilder:ABModel:findAll(): Unknown Error with provided condition",
                           condition: cond,
                        });
                        break;
                  }
               }
               reject(err);
            });
      });
   }

   /**
    * @method loadInto
    * loads the current values into the provided Webix DataTable
    * @param {DataTable} DT  A Webix component that can dynamically load data.
    */
   loadInto(DT) {
      // if a limit was applied, then this component should be loading dynamically
      if (this._limit) {
         DT.define("datafetch", this._limit);
         DT.define("datathrottle", 250); // 250ms???

         // catch the event where data is requested:
         // here we will do our own findAll() so we can persist
         // the provided .where condition.

         // oh yeah, and make sure to remove any existing event handler when we
         // perform a new .loadInto()
         DT.___AD = DT.___AD || {};
         if (DT.___AD.onDataRequestEvent) {
            DT.detachEvent(DT.___AD.onDataRequestEvent);
         }
         DT.___AD.onDataRequestEvent = DT.attachEvent(
            "onDataRequest",
            (start, count) => {
               var cond = {
                  where: this._where,
                  sort: this._sort,
                  limit: count,
                  skip: start,
               };

               if (DT.showProgress) DT.showProgress({ type: "icon" });

               this.findAll(cond).then((data) => {
                  /*
                   // In V2: we move the row height processing into 
                   // the interface designer 

                  data.data.forEach((item) => {
                     if (
                        item.properties != null &&
                        item.properties.height != "undefined" &&
                        parseInt(item.properties.height) > 0
                     ) {
                        item.$height = parseInt(item.properties.height);
                     } else if (parseInt(this._where.height) > 0) {
                        item.$height = parseInt(this._where.height);
                     }
                  });
                  */
                  DT.parse(data);

                  if (DT.hideProgress) DT.hideProgress();
               });

               return false; // <-- prevent the default "onDataRequest"
            }
         );

         DT.refresh();
      }

      // else just load it all at once:
      var cond = {};
      if (this._where) cond.where = this._where;
      if (this._sort) cond.sort = this._sort;
      if (this._limit != null) cond.limit = this._limit;
      if (this._skip != null) cond.skip = this._skip;

      if (DT.showProgress) DT.showProgress({ type: "icon" });

      this.findAll(cond)
         .then((data) => {
            // v2: we no longer process item $height
            /*
            data.data.forEach((item) => {
               if (
                  item.properties != null &&
                  item.properties.height != "undefined" &&
                  parseInt(item.properties.height) > 0
               ) {
                  item.$height = parseInt(item.properties.height);
               } else if (parseInt(this._where.height) > 0) {
                  item.$height = parseInt(this._where.height);
               }
            });
            */

            DT.parse(data);

            if (DT.hideProgress) DT.hideProgress();
         })
         .catch((err) => {
            console.error("!!!!!", err);
         });
   }

   /**
    * @method logs()
    * return the log history related to this model's ABObject.
    * @param {hash} options
    *        a key=>value hash of optional search criteria
    *        .rowId {string} the uuid of the individual entry we are querying
    *        .levelName {string} the type of entry ["insert", "update", "delete"]
    *        .username {string} the entries associated with the given user
    *        .startDate {date} entries that happened ON or AFTER this date
    *        .endDate {date} entries that happened ON or BEFORE this date
    *        .start {integer} paging control: how many entries to skip
    *        .limit {integer} paging control: only return this # entries
    * @return {Promise}
    */
   logs(options) {
      return new Promise((resolve, reject) => {
         var jobID = this.AB.jobID();
         this.AB.Network.once(jobID, this.handler_logs);
         this.AB.Network.get(
            {
               url: this.object.urlRestLog(),
               params: options,
               // params: newCond
            },
            {
               key: jobID,
               context: { resolve, reject },
            }
         ).catch((err) => {
            if (err && err.code) {
               this.AB.notify.developer(err, {
                  context: "AppBuilder:ABModel:logs(): Error",
                  options,
               });
            }
            reject(err);
         });
      });
   }

   /**
    * @method limit
    * set the limit value for this set of data
    * @param {integer} limit  the number or elements to return in this call
    * @return {ABModel} this object that is chainable.
    */
   limit(limit) {
      this._limit = limit;
      return this;
   }

   /**
    * @method skip
    * set the skip value for this set of data
    * @param {integer} skip  the number or elements to skip
    * @return {ABModel} this object that is chainable.
    */
   skip(skip) {
      this._skip = skip;
      return this;
   }

   /**
    * @method update
    * update model values on the server.
    */
   update(id, values) {
      this.prepareMultilingualData(values);

      // remove empty properties
      for (var key in values) {
         if (values[key] == null) delete values[key];
      }

      return new Promise((resolve, reject) => {
         var jobID = this.AB.jobID();
         this.AB.Network.once(jobID, this.handler_update);
         this.AB.Network.put(
            {
               url: this.object.urlRestItem(id),
               params: values,
            },
            { key: jobID, context: { resolve, reject } }
         )
            // .then((data) => {
            //    this.normalizeData(data);

            //    resolve(data);

            //    // If we do not have socket updates available, then trigger an
            //    // update event with this data.
            //    if (this.AB.Network.type() != "socket") {
            //       this.AB.emit("ab.datacollection.update", {
            //          objectId: this.object.id,
            //          data,
            //       });
            //    }
            // })
            .catch((err) => {
               errorPopup(err);
               reject(err);
            });
      });
   }

   /**
    * @method batchUpdate
    * update value to many rows on the server.
    */
   batchUpdate({ rowIds, values }) {
      return new Promise((resolve, reject) => {
         var jobID = this.AB.jobID();
         this.AB.Network.once(jobID, (context, err /*, data */) => {
            if (err) {
               reject(err);
               return;
            }
            // this.normalizeData(data);
            resolve(true);
            // what about checking for socket updates?
         });
         this.AB.Network.put(
            {
               url: this.object.urlRestBatch(),
               params: {
                  rowIds,
                  values,
               },
            },
            { key: jobID, context: {} }
         )
            // .then(() => {
            //    resolve(true);
            // })
            .catch(reject);
      });
   }
};
