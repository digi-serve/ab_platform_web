/*
 * CommCenter.js
 * A communication center for the user's browser to connect with
 * other sources.
 */

var EventEmitter = require("events").EventEmitter;
import CommCenterRoom from "./CommCenterRoom";

class CommCenter extends EventEmitter {
   constructor() {
      super();

      this.setMaxListeners(0);
      // allow > 10 listeners

      this.rooms = {};
      // {hash}  { key: {CommCenterRoom}}
   }

   init(AB) {
      this.AB = AB;
      return Promise.resolve();
   }

   async Room(key) {
      // NOTE: current implementation implies that a browser can only
      // make a single connection into a room.  However if we want to
      // make >1 connection, we should instead track it
      // this.rooms[key] = [Room, Room];
      // or
      // this.rooms[key] = { clientID : {Room} }
      // Then each call to this Room(key) will add a new connection.

      // build a new Room Connection if one doesn't exist.
      if (!this.rooms[key]) {
         // create a new Room connection:
         let room = new CommCenterRoom(this, key);
         this.rooms[key] = room;
         // let socketKey = `${this.AB.Tenant.id()}-${key}`;
         // {string}
         // on the server, we partition these rooms off by the Tenant.  So
         // socketKey represents the ACTUAL socket room name and is used
         // to listen on io.socket.on();

         io.socket.on(key, (packet) => {
            let Room = this.rooms[packet.key];
            if (!Room) return;
            if (packet.to && packet.to != Room.clientID) return;
            switch (packet.type) {
               case "client":
                  // a default broadcast packet sent to this Room to
                  // announce another client that has joined.
                  // packet: {
                  //    type: "client",
                  //    id: clientID
                  //        // uid of this client in the room
                  // }
                  Room.clientIn(packet);
                  break;

               case "data":
                  // a DATA packet sent to the ROOM. This might be a BROADCAST
                  // data packet sent via Room.send({data});  Or this might be
                  // sent directly to this client's Room using a
                  // Client.send({data});
                  // In either case, there is not an expected response to this
                  // incoming DATA packet.
                  // packet: {
                  //    type:"data",
                  //    {to:clientID}
                  //    from:"clientID",
                  //    data:{data}
                  // }
                  if (!packet.to || packet.to == this.clientID) {
                     Room.dataIn(packet);
                  }
                  break;

               case "query":
                  // A QUERY request was made to this Room Connection. There is
                  // an expected response that is being waited for.
                  // packet: {
                  //    type:"query",
                  //    from:"clientID",
                  //    qID:"queryID",
                  //    data:"data"
                  // }
                  Room.queryIn(packet);
                  break;

               case "response":
                  // A RESPONSE to a QUERY request was received.  The Room will
                  // need to resolve the pending Room.query().then() to deliver
                  // the response.
                  // packet: {
                  //    type:"response",
                  //    qID:"queryID",
                  //    from:"clientID",
                  //    data:data
                  // }
                  Room.responseIn(packet);
                  break;
            }
         });
         await room.join();
      }

      // return our room connection
      return this.rooms[key];
   }
}

export default new CommCenter();
