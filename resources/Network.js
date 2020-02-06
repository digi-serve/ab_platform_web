/*
 * Network.js
 * A network manager for interfacing with our AppBuilder server.
 */

import NetworkRest from "./NetworkRest";
// import NetworkRelay from "./NetworkRelay";

import Config from "../config/Config.js";
var config = Config.siteConfig();

// pages that use :
// /lib/pages/app/appPage.js

var network;

// Return the proper network instance based upon our config settings.
if (config.appbuilder.networkType == "relay") {
   // network = new NetworkRelay();
} else {
   network = new NetworkRest();
}

export default network;
