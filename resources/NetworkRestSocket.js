/*
 * NetworkRest.js
 * The base Networking class.  This class is responsible for job submissions
 * and outlines the basic Network interface.
 */

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
   // "ab.object.update",
];
// {array}
// The io.socket.* events we are listening for that relate to our datacollection
// maintainence.

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
            this.AB.emit(ev, data);
         });
      });
   }

   //
   // Interface API
   //

   ////
   //// Network Utilities
   ////

   isNetworkConnected() {
      return io.socket.isConnected();
   }

   salSend(params) {
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
                  data = JSON.parse(data);
               }

               // Got a JSON response but was the service response an error?
               // this would be a strange case where the .statusCode < 400
               if (data.status && data.status == "error") {
                  // make sure to reject an err.responseText = data
                  reject({
                     status: jwres.statusCode,
                     responseText: JSON.Stringify(data),
                  });
               }
               // Success!
               else {
                  resolve(data);
               }
            }
         });
      });
   }
}

export default NetworkRestSocket;
