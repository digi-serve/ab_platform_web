/*
 * initResources
 * make sure all Platform Resources have a chance to initialize before
 * continuing on.
 */

import webix from "../js/webix/webix.js";
import webixCSS from "../js/webix/webix.css";

export default {
   init: (AB) => {
      // Make sure webix is global object
      if (!window.webix) {
         window.webix = webix;
      }

      var allInits = [];

      allInits.push(AB.Account.init());
      allInits.push(AB.Network.init());
      allInits.push(AB.Tenant.init());

      return Promise.all(allInits);
   },
};
