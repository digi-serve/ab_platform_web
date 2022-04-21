/*
 * CommCenterRoom.js
 * A connection to shared "Room" where participants of that room can
 * share messages among each other.
 */

var EventEmitter = require("events").EventEmitter;

class CommReq extends EventEmitter {
   constructor(Room, packet) {
      super();

      this._Room = Room;
      this._packet = packet;
   }

   get isBroadcast() {
      return typeof this._packet.to == "undefined";
   }

   get data() {
      return this._packet.data;
   }

   get from() {
      return this._packet.from;
   }

   get to() {
      return this._packet.to;
   }

   get qID() {
      return this._packet.qID;
   }

   respond(data) {
      // we need to make sure we format this packet:
      let packet = {
         type: "response",
         to: this.from,
         qID: this._packet.qID,
         data,
      };
      return this._Room.respond(packet);
   }

   reject(error) {
      // we need to make sure we format this packet:
      let packet = {
         type: "response",
         to: this.from,
         qID: this._packet.qID,
         error,
      };
      return this._Room.respond(packet);
   }
}

class CommCenterClient extends EventEmitter {
   constructor(Room, clientID) {
      super();
      this.id = clientID;
      this.room = Room;
      this.AB = Room.AB;

      this.pendingQueries = {
         /* qid : { resolve, reject } */
      };
      // {hash}
      // track the pending queries we have made.  On a "response" packet
      // we find the pending qid, and resolve it with the data we get
      // from thre response.
   }

   dataIn(req) {
      this.emit("data", req);
   }

   queryIn(req) {
      this.emit("query", req);
   }

   query(data) {
      return new Promise((resolve, reject) => {
         let qID = this.AB.jobID(4);
         this.pendingQueries[qID] = { resolve, reject };

         let packet = {
            type: "query",
            to: this.id,
            qID,
            data,
         };

         this.room.respond(packet);
      });
   }

   responseIn(req) {
      var res = this.pendingQueries[req.qID];
      if (res) {
         if (req.data) {
            res.resolve(req);
         }
         if (req.error) {
            res.reject(req);
         }
         delete this.pendingQueries[req.qID];
      }
   }
}

export default class CommCenterRoom extends EventEmitter {
   constructor(CC, key) {
      super();

      this.CC = CC;
      // {CommCenter}
      // a pointer back to our common CommCenter.

      this.AB = CC.AB;

      this.key = key;
      // {string}
      // the unique socket room key we are joining.

      this.setMaxListeners(0);
      // allow > 10 listeners

      this.clientID = null;
      // {uid}
      // each connection to a room gets it's own clientID
      // even if it comes from the same browser.

      this.clients = {};
   }

   async join() {
      this.clientID = await this.AB.Network.post({
         url: `/commcenter/room/${this.key}`,
      });
      console.log("join(): clientID:" + this.clientID);
   }

   /**
    * @method client()
    * Register a new client that is available in this Room.
    * @param {obj} packet
    *        {
    *          type: "client",
    *          id: clientID
    *          // uid of this client in the room
    *        }
    */
   clientIn(packet) {
      // creates a this.clients[clientID] = new Client(clientID, this)
      let client = new CommCenterClient(this, packet.id);
      this.clients[client.id] = client;
      this.emit("client", client);
   }

   /**
    * @method data()
    * This room has received a DATA packet. DATA packets don't need to be
    * directly responded to.  This most likely is for this client to update
    * it's state.
    * The ROOM will emit a "data" event.  And if a client is registered that
    * matches the .from field, then that CLIENT will also emit a "data" event.
    * @param {obj} packet
    *        {
    *          type: "data",
    *          {to:  clientID,}
    *                {optional} .to  if provided we will ignore if not to us.
    *          from: clientID,
    *          data: {data}
    *        }
    */
   dataIn(packet) {
      var req = new CommReq(this, packet);
      this.emit("data", req);

      if (req.from) {
         let client = this.clients[req.from];
         if (!client) {
            // let's create a new client here:
            this.clientIn({ id: req.from });
            client = this.clients[req.from];
         }
         client.dataIn(req);
      }
   }

   /**
    * @method queryIn()
    * This room has received a QUERY packet. QUERY packets expect to be
    * responded to. The packet contains a .qID that needs to be part of the
    * response packet.
    * The ROOM will emit a "query" event.  And if a client is registered that
    * matches the .from field, then that CLIENT will also emit a "query" event.
    * @param {obj} packet
    *        {
    *          type: "data",
    *          {to:  clientID,}
    *                {optional} .to  if provided we will ignore if not to us.
    *          from: clientID,
    *          qID:  {uid},
    *          data: {data}
    *        }
    */
   queryIn(packet) {
      var req = new CommReq(this, packet);
      this.emit("query", req);

      if (req.from) {
         let client = this.clients[req.from];
         if (!client) {
            // let's create a new client here:
            this.clientIn({ id: req.from });
            client = this.clients[req.from];
         }
         client.queryIn(req);
      }
   }

   /**
    * @method query()
    * The room is querying each of it's clients and returning their data
    * as a hash { clientID: response }.
    * @param {obj} data
    *        the data packet to send to each of the clients.
    * @return {Promise}
    */
   query(data) {
      var results = {};

      var allClients = [];

      function queryClient(client) {
         allClients.push(
            client.query(data).then((res) => {
               results[client.id] = res;
            })
         );
      }

      Object.keys(this.clients).forEach((cid) => {
         // query the OTHER clients, not myself:
         if (cid != this.clientID) {
            queryClient(this.clients[cid]);
         }
      });

      return Promise.all(allClients).then(() => {
         return { data: results };
      });
   }

   /**
    * @method respond()
    * Issue a response packet back to the server.
    * Response packets coming from this Room will have .from == this.ClientID;
    * @param {obj} packet
    *        The data packet to return.
    * @return {Promise}
    */
   respond(packet) {
      packet.from = this.clientID;
      return this._send(packet);
   }

   responseIn(packet) {
      var req = new CommReq(this, packet);

      if (req.from) {
         // find the client this is from
         let client = this.clients[req.from];
         if (!client) {
            // let's create a new client here:
            this.clientIn({ id: req.from });
            client = this.clients[req.from];
         }
         client.responseIn(req);
      }
   }

   /**
    * @method send()
    * Send a Broadcast message to the whole room.
    */
   send(data) {
      var packet = {
         type: "data",
         from: this.clientID,
         data,
      };
      return this._send(packet);
   }

   _send(packet) {
      return this.AB.Network.put({
         url: `/commcenter/room/${this.key}`,
         data: packet,
      });
   }
}
