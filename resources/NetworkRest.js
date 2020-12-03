/*
 * NetworkRest.js
 * The base Networking class.  This class is responsible for job submissions
 * and outlines the basic Network interface.
 */

/* global navigator Connection */
// import Account from "./Account";
// import analytics from "./Analytics";
// import EventEmitter from "eventemitter2";
var EventEmitter = require("events").EventEmitter;
// import Lock from "./Lock";
// import Log from "./Log";
// import { storage } from "./Storage";
// import Tenant from "./Tenant";
// import { v4 as uuidv4 } from "uuid";

// Temp placeholders until Resources are implemented:

const Log = console.log;
Log.warn = console.warn;
Log.error = console.error;

// End Temp

const Atomic = require("atomicjs/dist/atomic.min.js");
// Atomic : a small $.ajax() replacement

var Config = null;
// {} Config
// the site specific configuration information

class NetworkRest extends EventEmitter {
   constructor() {
      super({
         wildcard: true,
         newListener: false,
         maxListeners: 0,
      });

      this.baseURL = null;
      // {string} .baseURL
      // the url of our site.

      this.numRetries = 3;
      // {int} .numRetries
      // the number or times we should attempt to issue a network request.

      this.queueLock = null;
      // {Lock} .queueLock
      // our semaphore for coordinating our access to our local storage.
   }

   /**
    * @method init
    * @param {ABFactory} AB
    * @param {object} options
    * @param {string} options.baseURL
    * @return {Promise}
    */
   init(AB, options) {
      this.AB = AB;

      this.queueLock = new this.AB.Lock();

      Config = this.AB.Config.siteConfig();
      options = options || {};
      if (options) {
         this.baseURL = options.baseURL || Config.appbuilder.urlCoreServer;
         this.numRetries =
            options.networkNumRetries || Config.appbuilder.networkNumRetries;
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
   get(params, jobResponse) {
      params.type = params.type || "GET";
      return this._request(params, jobResponse).then((response) => {
         if (jobResponse) {
            this.publishResponse(jobResponse, response);
         }
         return response;
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
   post(params, jobResponse) {
      params.type = params.type || "POST";
      return this._request(params, jobResponse).then((response) => {
         if (jobResponse) {
            this.publishResponse(jobResponse, response);
         }
         return response;
      });
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
   put(params, jobResponse) {
      params.type = params.type || "PUT";
      return this._request(params, jobResponse).then((response) => {
         if (jobResponse) {
            this.publishResponse(jobResponse, response);
         }
         return response;
      });
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
   delete(params, jobResponse) {
      params.type = params.type || "DELETE";
      return this._request(params, jobResponse).then((response) => {
         if (jobResponse) {
            this.publishResponse(jobResponse, response);
         }
         return response;
      });
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
    * _request()
    * perform the actual AJAX request for this operation.
    * @param {obj} params  the jQuery.ajax() formatted params
    * @param {obj} jobRequest  the information about the request's response.
    * @return {Promise}
    */
   _request(params, jobResponse) {
      // make sure we don't process too many retries:
      params._retry = params._retry || 0;
      if (params._retry >= this.numRetries) {
         var err = new Error(
            `Too many retries (${this.numRetries}) for ${params.url}`
         );
         this.AB.Analytics.logError(err);
         this.publishResponse(jobResponse, err);
         return Promise.reject(err);
      }

      return new Promise((resolve, reject) => {
         params.url = params.url || "/";
         if (params.url[0] == "/") {
            params.url = this.baseURL + params.url;
         }

         params.headers = params.headers || {};
         if (this.AB.Account.authToken) {
            params.headers.Authorization = this.AB.Account.authToken;
         }

         var tenantID = this.AB.Tenant.id();
         if (tenantID) {
            params.headers["tenant-token"] = tenantID;
         }

         // params.timeout = params.timeout || 6000;

         if (this.isNetworkConnected()) {
            params.method = params.method || params.type;
            params.timeout = 6000; // ??

            Atomic(params.url, params)
               .then((packet) => {
                  // TODO: check if packet.status == "error"
                  // and then .publishResponse() as an error

                  //
                  var data = packet;
                  if (data.data) data = data.data;
                  this.publishResponse(jobResponse, null, data);
                  resolve(data);
               })
               .catch((err) => {
                  // err.status
                  // err.statusText
                  // err.responseText

                  // if this is a network connection error, send the attempt again:
                  if (err.statusText == "Request timeout") {
                     //// Network Error: conneciton refused, access denied, etc...
                     Log(
                        "*** NetworkRest._request():network connection error detected. Trying again"
                     );
                     this.AB.Analytics.log(
                        "NetworkRest._request():network connection error detected. Trying again"
                     );

                     params._retry++;

                     // retry the attempt:
                     this._request(params)
                        .then((data) => {
                           // console.log('--- timeout.then():',data);
                           Log.warn(
                              "*** NetworkRest._request().then(): attempt resolved."
                           );
                           resolve(data);
                        })
                        .catch((_err) => {
                           Log.error(
                              "*** NetworkRest._request().catch(): retry failed:",
                              _err
                           );
                           reject(_err);
                        });

                     return;
                  } else {
                     // Else attempt to emit() some common Error types for
                     // additional Platform Handling.
                     if (err.status == 403) {
                        this.emit("error.badAuth", err);
                     } else if (err.status >= 400 && err.status < 500) {
                        this.emit("error.badRequest", err);
                     } else if (err.status >= 500) {
                        this.emit("error.badServer", err);
                     }
                  }

                  var packet = null;
                  if (err.responseText) {
                     try {
                        packet = JSON.parse(err.responseText);
                     } catch (e) {}
                  }
                  // if this is an req.ab.error() response:
                  if (packet && packet.status == "error") {
                     this.AB.Analytics.logError(packet.data);
                     Log.error(packet.data);
                     this.publishResponse(jobResponse, packet);
                     reject(packet.data);
                     return;
                  } else {
                     // unknown/unexpected error:
                     var error = new Error(`${err.status} ${err.statusText}`);
                     error.response = err.responseText;
                     error.text = err.statusText;
                     error.err = err;
                     this.AB.Analytics.logError(error);
                     Log.error(error);
                     this.publishResponse(jobResponse, error);
                     reject(error);
                  }
               });
         } else {
            // now Queue this request params.
            this.AB.Analytics.log(
               "NetworkRest:_request(): Network is offline. Queuing request."
            );
            this.queue(params, jobResponse)
               .then(() => {
                  resolve({ status: "queued" });
               })
               .catch(reject);
         }
      });
   }

   /**
    * _resend()
    * processes messages that were queued due to network connectivity
    * issues.
    * @param {obj} params  the jQuery.ajax() formatted params
    * @param {obj} jobRequest  the information about the request's response.
    * @return {Promise}
    */
   _resend(params, jobResponse) {
      var op = params.type.toLowerCase();
      return this[op](params, jobResponse);
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
               Log(
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
               Log.error("Error while queueing data", err);
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
                     this._resend(params, job)
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
               Log.error("commAPI queueFlush error", err);
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

export default NetworkRest;
