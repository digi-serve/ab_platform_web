/*
 * NetworkRest.js
 * The base Networking class.  This class is responsible for job submissions
 * and outlines the basic Network interface.
 */

import performance from "../utils/performance";
import NetworkRest from "./NetworkRest";

const listSocketEvents = [
   // NOTE: ABFactory.definitionXXX() will manage emitting these
   // events internally:
   // "ab.abdefinition.create",
   // "ab.abdefinition.update",
   // "ab.abdefinition.delete",
   "ab.datacollection.create",
   "ab.datacollection.update",
   "ab.datacollection.stale",
   "ab.datacollection.delete",
   "ab.inbox.create",
   "ab.inbox.update",
   "ab.task.userform",
   // "ab.object.update",
];
// {array}
// The io.socket.* events we are listening for that relate to our datacollection
// maintainence.

function socketDataSave(key, length) {
   if (!HashSocketJobs[key]) {
      HashSocketJobs[key] = {
         packets: 0,
         length: 0,
      };
   }

   HashSocketJobs[key].packets++;
   HashSocketJobs[key].length += length;
}
function socketDataLog(AB, key, data) {
   let length = "??";
   try {
      length = JSON.stringify(data).length;
      data.__length = length;
   } catch (e) {
      console.log(e);
      //
   }

   if (data.objectId) {
      let obj = AB.objectByID(data.objectId);
      if (!obj) {
         console.warn(`socket: ${key} unkown object (${length})`, data);
      } else {
         console.warn(
            `socket: ${key} ${obj.label ?? obj.name}(${length})`,
            data
         );
      }
   } else {
      console.warn(`socket: ${key} (${length})`, data);
   }

   if (data.jobID) {
      socketDataSave(data.jobID, length);
      socketDataSave(`${data.jobID}-${key}`, length);
   }
}

let HashSocketJobs = {
   /* jobID : { #packets, length } */
};

let keyBlacklist = {
   /* key : true */
};
// a list of incoming message keys, that indicate wether or not we have
// processed this message.  If a message has been processed, we skip it.

/**
 * @function blacklistKey()
 * create a unique key for this network event.
 * @param {event} ev
 *        the incoming network event key (ab.datacollection.create)
 * @param {obj} data
 *        the related network packet of the incoming event.
 * @return {string}
 */
function blacklistKey(AB, ev, data) {
   let parts = [ev];

   if (data.jobID) {
      parts.push(data.jobID);
   }

   if (data.data) {
      let PK = "uuid";
      let obj = AB.objectByID(data.objectId);
      if (obj) {
         PK = obj.PK();
      }
      parts.push(data.data[PK] || data.data.id);
   }

   if (data.__length) {
      parts.push(data.__length);
   } else {
      let length = "??";
      try {
         length = JSON.stringify(data).length;
      } catch (e) {
         // ignore
      }
      parts.push(length);
   }

   return parts.join("-");
}

/**
 * @function isBlacklisted()
 * return True/False if a given key is already blacklisted.
 * @param {string} key
 *        the () we are checking
 * @return {bool}
 */
function isBlacklisted(key) {
   return keyBlacklist[key] ?? false;
}

/**
 * @function blacklist()
 * mark a given key as blacklisted. This prevents additional calls with
 * the same key from being processed.
 * A Key is only blacklisted for a given amount of time (1s by default).
 * @param {string} key
 *        the blacklistKey() we are checking
 * @param {int} time
 *        The duration in ms of how long to keep the key blacklisted.
 */
function blacklist(key, time = 1000) {
   keyBlacklist[key] = true;
   setTimeout(() => {
      delete keyBlacklist[key];
   }, time);
}

class NetworkRestSocket extends NetworkRest {
   constructor(parent) {
      // {Network} parent

      super(parent);

      this.isRealTime = true;
      // {bool}
      // does this Network type support RealTime updates. (socket = true);

      // Pass the io.socket.on(*) events to our AB factory.
      listSocketEvents.forEach((ev) => {
         io.socket.on(ev, (data) => {
            // data should be in the format:
            // {
            //    objectId: {uuid},
            //    data: {object}
            // }
            socketDataLog(this.AB, ev, data);

            // ensure we only process a network update 1x
            let blKey = blacklistKey(this.AB, ev, data);
            if (isBlacklisted(blKey)) return;
            blacklist(blKey, 5000); // now prevent additional ones

            // check if the ev contains 'datacollection'
            // and do a single normalizeData() on the incoming data here
            // before sending it off to be processed.
            if (ev.indexOf("ab.datacollection") > -1) {
               let values = data.data;
               if (values) {
                  let obj = this.AB.objectByID(data.objectId);
                  if (obj) {
                     if (ev != "ab.datacollection.delete") {
                        // if data is packed, then unpack it
                        let model = obj.model();
                        if (model.isCsvPacked(values)) {
                           let lengthPacked = data.__length;
                           delete data.__length;
                           values = model.csvUnpack(values);
                           data.data = values.data;
                           let lengthUnpacked = JSON.stringify(data).length;
                           data.__length = lengthUnpacked;
                           data.__lengthPacked = lengthPacked;
                           console.log(
                              `CSV Pack: ${lengthUnpacked} -> ${lengthPacked} (${(
                                 (lengthPacked / lengthUnpacked) *
                                 100
                              ).toFixed(2)}%)`
                           );
                        }

                        let jobID = this.AB.jobID();
                        performance.mark(`${ev}:normalization`, {
                           op: "function",
                           data: { jobID },
                        });
                        model.normalizeData(data.data);
                        performance.measure(`${ev}:normalization`);
                     }
                  }
               }
            }
            this.AB.emit(ev, data);
         });
      });
   }

   //
   // Interface API
   //

   socketLog() {
      console.warn(JSON.stringify(HashSocketJobs, null, 4));
   }

   socketLogClear() {
      HashSocketJobs = {};
   }

   ////
   //// Network Utilities
   ////

   isNetworkConnected() {
      return io.socket.isConnected();
   }

   salSend(params) {
      let route, query;
      try {
         // Extract paramitized route (ex: `/app_builder/model/:ID`) for performance tracking
         [, route, query] = params.url.match(
            /https?:\/\/[^/]+(\/[^?]+)\??(.*)/
         );
         route = route.replace(/\b[a-fA-F\d-]{36}\b/g, ":ID");
         performance.mark(route, {
            op: "websocket.client",
            data: {
               http: {
                  query: query || undefined,
                  method: params.method,
               },
               url: params.url,
            },
         });
      } catch (err) {
         this.AB.notify.developer(err, {
            context: `salSend() create performance.mark`,
         });
      }

      return new Promise((resolve, reject) => {
         params.method = params.method.toLowerCase();

         io.socket.request(params, (data, jwres) => {
            // {json} data
            // the data response from the request
            // {json} jwres
            // A JSON WebSocket Response object.
            //    {json} jwres.headers :  header values
            //    {int}  jwres.statusCode : http response code
            //    {json} jwres.body === resData

            // if this is an  error
            if (jwres.statusCode >= 400) {
               // Our NetworkRest.error( err ) should be in this format:
               // err.status
               // err.statusText
               // err.responseText

               var errStr = jwres.error ? jwres.error.toString() : jwres.body;

               var err = new Error(`Socket Error: ${errStr}`);
               err.status = jwres.statusCode;
               err.statusText = errStr;
               err.responseText = jwres.body;

               // on RequestTimeout:
               // err.statusText == "Request timeout"

               reject(err);
            } else {
               // some errors like socket disconnected return an Error for data
               if (data instanceof Error) {
                  reject(data);
                  return;
               }

               if (typeof data == "string") {
                  performance.mark("JSON.parse", { op: "serialize" });
                  data = JSON.parse(data);
                  performance.measure("JSON.parse");
               }

               // Got a JSON response but was the service response an error?
               // this would be a strange case where the .statusCode < 400
               if (data?.status == "error") {
                  // make sure to reject an err.responseText = data
                  reject({
                     status: jwres.statusCode,
                     responseText: JSON.Stringify(data),
                  });
               }
               // Success!
               else {
                  performance.measure(route);
                  resolve(data);
               }
            }
         });
      });
   }
}

export default NetworkRestSocket;
