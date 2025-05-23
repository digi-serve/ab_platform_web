/*
 * NetworkRest.js
 * The base Networking class.  This class is responsible for job submissions
 * and outlines the basic Network interface.
 */

/* global Connection */
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

      this.isRealTime = false;
      // {bool}
      // does this Network type support RealTime updates. (socket = true);
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

      // data sent to params on a "GET" request need to be converted to
      // uri querystring values:
      var data = params.data || params.params;
      if (data) {
         var useThese = ["string", "number", "boolean"];
         var search = Object.keys(data)
            .map(function (key) {
               var val = data[key];
               if (useThese.indexOf(typeof val) == -1) {
                  val = JSON.stringify(val);
               }
               return key + "=" + encodeURIComponent(val);
            })
            .join("&");

         var join = "?";
         if (params.url.indexOf("?") > -1) {
            join = "&";
         }
         params.url = [params.url, search].join(join);
      }

      return this._request(params, jobResponse);
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
      return this._request(params, jobResponse);
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
      return this._request(params, jobResponse);
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
      return this._request(params, jobResponse);
   }

   ////
   //// Network Utilities
   ////

   isNetworkConnected() {
      return this._network.isNetworkConnected();
   }

   salSend(params) {
      return Atomic(params.url, params).then((packet) => {
         // {json} packet
         // the response from Atomic is in format:
         // {data: {…}, xhr: XMLHttpRequest}
         // we just want to send back our { status:"", data:xxx } packet.
         return packet.data;
      });
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
         err.code = "E_TOMANYRETRIES";
         this.AB.notify.developer(err, {
            context: "NetworkRest:_request: Too Many Retries",
         });
         // this.AB.Analytics.logError(err);
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
         // Fix: don't set content-type if passed in data is a FormData object.
         if (
            Object.prototype.toString.call(params.data) !== "[object FormData]"
         ) {
            params.headers["Content-type"] = "application/json";
         }

         var tenantID = this.AB.Tenant.id();
         if (tenantID) {
            params.headers["tenant-token"] = tenantID;
         }

         // params.timeout = params.timeout || 6000;

         if (this.isNetworkConnected()) {
            params.method = params.method || params.type;
            params.timeout = 6000; // ??
            params.data = params.data || params.params;
            delete params.params;

            this.salSend(params)
               .then((packet) => {
                  // TODO: check if packet.status == "error"
                  // and then .publishResponse() as an error

                  //
                  var data = packet;
                  if (jobResponse) {
                     this._network.publishResponse(jobResponse, null, data);
                  }
                  resolve(data);
               })
               .catch((err) => {
                  // err.status
                  // err.statusText
                  // err.responseText
                  // err.message  {socket}
                  // err.stack    {socket}

                  // if this is a network connection error, send the attempt again:
                  if (
                     err.statusText == "Request timeout" ||
                     (err.message && err.message.indexOf("disconnected") > -1)
                  ) {
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
                           this.AB.notify.developer(_err, {
                              message:
                                 "*** NetworkRest._request().catch(): retry failed:",
                           });
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
                     } catch (e) {
                        /* ignore */
                     }
                  }
                  // if this is an req.ab.error() response:
                  if (packet && packet.status == "error") {
                     // check if REAUTH Error:
                     if (packet.id == 5 || packet.code == "E_REAUTH") {
                        this._network.emit("reauth");
                        return;
                     }

                     this.AB.notify.developer(new Error(packet.message), {
                        context:
                           "NetworkRest:_request:Error returned from Server (req.ab.error())",
                        data: packet.data,
                        status: packet.status,
                     });
                     // this.AB.Analytics.logError(packet.data);
                     // this.AB.error(packet.data);
                     if (jobResponse) {
                        this._network.publishResponse(
                           jobResponse,
                           packet,
                           null
                        );
                     }
                     let error = new Error(packet.message ?? packet.data);
                     error.response = packet;
                     error.text = packet.message;
                     error.url = `${params.method} ${params.url}`;
                     return reject(error);
                  } else {
                     // unknown/unexpected error:
                     let error = new Error(
                        `${err.status} ${err.statusText || err.message}: ${
                           params.method
                        } ${params.url}`
                     );
                     error.response = err.responseText;
                     error.text = err.statusText;
                     error.err = err;
                     error.url = `${params.method} ${params.url}`;
                     this.AB.notify.developer(error, {
                        context:
                           "NetworkRest:_request:Unknown Error returned from server",
                        err,
                        response: err.responseText,
                        text: err.statusText || err.message,
                        url: error.url,
                     });
                     // this.AB.Analytics.logError(error);
                     // this.AB.error(error);
                     if (jobResponse) {
                        this._network.publishResponse(jobResponse, error);
                     }
                     return reject(error);
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
      // var op = params.type.toLowerCase();
      return this._request(params, jobResponse);
   }
}

export default NetworkRest;
