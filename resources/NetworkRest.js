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

// import { storage } from "./Storage";
// import Tenant from "./Tenant";
// import { v4 as uuidv4 } from "uuid";

// Temp placeholders until Resources are implemented:

// End Temp

const Atomic = require("atomicjs/dist/atomic.min.js");
// Atomic : a small $.ajax() replacement

var Config = null;
// {} Config
// the site specific configuration information

class NetworkRest extends EventEmitter {
   constructor(parent) {
      // {Network} parent

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

      this._network = parent;
      // {Network} ._network
      // the Parent Network Resource that the rest of the Platform actually
      // works with.
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
            this._network.publishResponse(jobResponse, response);
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
            this._network.publishResponse(jobResponse, response);
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
            this._network.publishResponse(jobResponse, response);
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
            this._network.publishResponse(jobResponse, response);
         }
         return response;
      });
   }

   ////
   //// Network Utilities
   ////

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
         if (jobResponse) {
            this._network.publishResponse(jobResponse, err);
         }

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

         if (this._network.isNetworkConnected()) {
            params.method = params.method || params.type;
            params.timeout = 6000; // ??

            Atomic(params.url, params)
               .then((packet) => {
                  // TODO: check if packet.status == "error"
                  // and then .publishResponse() as an error

                  //
                  var data = packet;
                  if (data.data) data = data.data;
                  if (jobResponse) {
                     this._network.publishResponse(jobResponse, null, data);
                  }
                  resolve(data);
               })
               .catch((err) => {
                  // err.status
                  // err.statusText
                  // err.responseText

                  // if this is a network connection error, send the attempt again:
                  if (err.statusText == "Request timeout") {
                     //// Network Error: conneciton refused, access denied, etc...
                     this.AB.Analytics.log(
                        "NetworkRest._request():network connection error detected. Trying again"
                     );

                     params._retry++;

                     // retry the attempt:
                     this._request(params)
                        .then((data) => {
                           // console.log('--- timeout.then():',data);
                           this.AB.warn(
                              "*** NetworkRest._request().then(): attempt resolved."
                           );
                           resolve(data);
                        })
                        .catch((_err) => {
                           this.AB.error(
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
                     this.AB.error(packet.data);
                     if (jobResponse) {
                        this._network.publishResponse(jobResponse, packet);
                     }
                     reject(packet.data);
                     return;
                  } else {
                     // unknown/unexpected error:
                     var error = new Error(
                        `${err.status} ${err.statusText}: ${params.method} ${params.url}`
                     );
                     error.response = err.responseText;
                     error.text = err.statusText;
                     error.err = err;
                     error.url = `${params.method} ${params.url}`;
                     this.AB.Analytics.logError(error);
                     this.AB.error(error);
                     if (jobResponse) {
                        this._network.publishResponse(jobResponse, error);
                     }
                     reject(error);
                  }
               });
         } else {
            // now Queue this request params.
            this.AB.Analytics.log(
               "NetworkRest:_request(): Network is offline. Queuing request."
            );
            this._network
               .queue(params, jobResponse)
               .then(() => {
                  resolve({ status: "queued" });
               })
               .catch(reject);
         }
      });
   }

   /**
    * resend()
    * processes messages that were queued due to network connectivity
    * issues.
    * @param {obj} params  the jQuery.ajax() formatted params
    * @param {obj} jobRequest  the information about the request's response.
    * @return {Promise}
    */
   resend(params, jobResponse) {
      var op = params.type.toLowerCase();
      return this[op](params, jobResponse);
   }
}

export default NetworkRest;
