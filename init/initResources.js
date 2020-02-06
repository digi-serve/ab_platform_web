/*
 * initResources
 * make sure all Platform Resources have a chance to initialize before
 * continuing on.
 */

import Account from "../resources/Account.js";
import Network from "../resources/Network.js";
import Tenant from "../resources/Tenant.js";

import webix from "../js/webix/webix.js";
import webixCSS from "../js/webix/webix.css";

export default {
   init: (AB) => {
      // Make sure webix is global object
      if (!window.webix) {
         window.webix = webix;
      }

      var allInits = [];

      allInits.push(Account.init());
      allInits.push(Network.init());
      allInits.push(Tenant.init());

      return Promise.all(allInits);
   }
};
