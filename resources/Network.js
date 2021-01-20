/*
 * Network.js
 * A network manager for interfacing with our AppBuilder server.
 */
var EventEmitter = require("events").EventEmitter;
import NetworkRest from "./NetworkRest";
// import NetworkRelay from "./NetworkRelay";

class Network extends EventEmitter {
   constructor() {
      super();

      this.queueLock = null;
      // {Lock} .queueLock
      // our semaphore for coordinating our access to our local storage.

      this._config = null;
      this._network = null;
   }

   init(AB) {
      // {ABFactory} AB

      this.AB = AB;

      this.queueLock = new this.AB.Lock();

      this._config = this.AB.Config.siteConfig();
      if (this._config) {
         if (this._config.appbuilder.networkType == "relay") {
            // this._network = new NetworkRelay();
         } else {
            this._network = new NetworkRest(this);
         }

         return this._network.init(AB);
      } else {
         console.error("??? Why No site config ???");
      }

      return Promise.resolve();
   }

   //
   // Interface API
   //
   /**
    * Network.get(options, jobResponse)
    * perform a GET request back to the AppBuilder server.
    * @param {obj} params the request parameters that need to be executed on
    *              the AppBuilder Server
    * @param {obj} jobResponse the callback info for handling the response.
    *              {
    *                  key:'unique.key',
    *                  context:{ obj data }
    *              }
    * @return {Promise}
    */
   get(...params) {
      return this._network.get(...params).then((data) => {
         // Data returning from our server is wrapped in an outer layer of
         // information that is for our Networking API.
         // the outer wrapper should be:
         // on success :
         // {
         // 	status: "success",
         // 	data:{Data For App}
         // }
         // on Error:
         // {
         // 	status: "error",
         // 	id: {int} error code
         // 	... other data here
         // }

         // we have physically received a data packet from the server,
         // but we are informed that our transaction was problematic
         // (400 level USER problem?)
         if (data.status === "error") {
            // TODO: review Error procedure here
            return data;
         }

         // on success
         // make sure we return the Application Level Data packet:
         return data.data || data;
      });
   }

   /**
    * Network.post()
    * perform an AJAX POST request to the AppBuilder server.
    * @param {obj} params the request parameters that need to be executed on
    *              the AppBuilder Server
    * @param {obj} jobResponse the callback info for handling the response.
    *              {
    *                  key:'unique.key',
    *                  context:{ obj data }
    *              }
    * @return {Promise}
    */
   post(...params) {
      return this._network.post(...params);
   }

   /**
    * Network.put()
    * perform a PUT request to the AppBuilder server.
    * @param {obj} params the request parameters that need to be executed on
    *              the AppBuilder Server
    * @param {obj} jobResponse the callback info for handling the response.
    *              {
    *                  key:'unique.key',
    *                  context:{ obj data }
    *              }
    * @return {Promise}
    */
   put(...params) {
      return this._network.put(...params);
   }

   /**
    * Network.delete()
    * perform an AJAX DELETE request to the AppBuilder server.
    * @param {obj} params the request parameters that need to be executed on
    *              the AppBuilder Server
    * @param {obj} jobResponse the callback info for handling the response.
    *              {
    *                  key:'unique.key',
    *                  context:{ obj data }
    *              }
    * @return {Promise}
    */
   delete(...params) {
      return this._network.delete(...params);
   }

   ////
   //// Network Utilities
   ////

   /**
    * @method networkStatus
    * return the connection type currently registered with the network
    * plugin.
    * @return {string}
    */
   networkStatus() {
      return navigator.connection.type;
   }

   /**
    * @method isNetworkConnected
    * return true/false if the device is currently connected to the
    * internet.
    * @return {bool}
    */
   isNetworkConnected() {
      // if this isn't a Cordova Plugin, then return navigator data:
      if (typeof Connection == "undefined") {
         return navigator.onLine;
      }

      return this.networkStatus() != Connection.NONE;
   }

   /**
    * publishResponse()
    * emit the requested response for this network operation.
    * @param {obj} jobResponse
    * @param {obj} error
    * @param {obj} data
    */
   publishResponse(jobResponse, error, data) {
      this.emit(jobResponse.key, jobResponse.context, error, data);
   }

   ////
   //// Queued Requests
   ////

   /**
    * refQueue()
    * sub classes can override this for their own separate Queue Data
    * @return {string}
    */
   refQueue() {
      return "networkQueue";
   }

   /**
    * Adds a request to the outgoing queue.
    *
    * @param {object} data
    * @param {object} jobResponse
    * @return {Promise}
    */
   queue(data, jobResponse) {
      var refQueue = this.refQueue();

      return new Promise((resolve, reject) => {
         this.queueLock
            .acquire()
            .then(() => {
               return this.AB.Storage.get(refQueue);
            })
            .then((queue) => {
               queue = queue || [];
               queue.push({ data, jobResponse });
               this.AB.log(
                  `:::: ${queue.length} request${
                     queue.length > 1 ? "s" : ""
                  } queued`
               );
               return this.AB.Storage.set(refQueue, queue);
            })
            .then(() => {
               this.emit("queued");
               this.queueLock.release();
               resolve();
            })
            .catch((err) => {
               this.AB.error("Error while queueing data", err);
               this.AB.Analytics.logError(err);
               reject(err);

               this.queueLock.release();
            });
      });
   }

   /**
    * queueFlush()
    * Flush the queue and send the contents to the relay server.
    */
   queueFlush() {
      var refQueue = this.refQueue();

      // if we are not connected, then stop
      if (!this.isNetworkConnected()) {
         var error = new Error("Not connected to the internet.");
         error.code = "E_NOTCONNECTED";
         return Promise.reject(error);
      }

      // otherwise, attempt to flush the queue:
      return new Promise((resolve, reject) => {
         this.queueLock
            .acquire()

            //
            // Get queue contents
            //
            .then(() => {
               return this.AB.Storage.get(refQueue);
            })

            //
            // Send off each queued request
            //
            .then((queue) => {
               // default to [] if not found
               queue = queue || [];

               // recursively process each pending queue request
               var processRequest = (cb) => {
                  if (queue.length == 0) {
                     cb();
                  } else {
                     var entry = queue.shift();
                     var params = entry.data;
                     var job = entry.jobResponse;
                     this._network
                        .resend(params, job)
                        .then(() => {
                           processRequest(cb);
                        })
                        .catch(cb);
                  }
               };

               return new Promise((res, rej) => {
                  processRequest((err) => {
                     if (err) {
                        rej(err);
                     } else {
                        res();
                     }
                  });
               });
            })

            //
            // Clear queue contents
            //
            .then(() => {
               return this.AB.Storage.set(refQueue, []);
            })

            // release the Lock
            .then(() => {
               // this.emit('synced');
               return this.queueLock.release();
            })

            // all done.
            .then(() => {
               resolve();
            })

            // respond to errors:
            .catch((err) => {
               this.AB.error("commAPI queueFlush error", err);
               this.AB.Analytics.logError(err);

               this.queueLock.release().then(() => {
                  reject(err);
               });
            });
      });
   }

   /**
    * Reset credentials to a blank state.
    *
    * @return {Promise}
    */
   reset() {
      return Promise.resolve();
   }

   // uuid() {
   //    return this.AB.uuid();
   // }

   getTokens() {
      // called in appPage.js : openRelayLoader()
      return {};
   }
}

export default new Network();
