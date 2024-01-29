import SailsIOJS from "sails.io.js";
import ioClient from "socket.io-client";
window.io = SailsIOJS(ioClient);
io.sails.reconnection = true;
// {bool}
// by default, sails.io will not reconnect.  setting this to true will
// tell it to auto reconnect.

window.__AB_socketReady_resolve();
