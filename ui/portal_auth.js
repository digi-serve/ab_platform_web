import ClassUI from "./ClassUI.js";

// Resources
import Tenant from "../resources/Tenant.js";

// sub pages:
import PortalAuthLogin from "./portal_auth_login.js";

class PortalAuth extends ClassUI {
   constructor() {
      super();
   }

   ui() {
      var self = this;

      return {
         id: "portal_auth",
         view: "multiview",
         animate: false,
         cells: [PortalAuthLogin.ui()]
      };
   }

   init(AB) {
      PortalAuthLogin.init(AB);

      // decide which Auth type to display:
      var tID = Tenant.id();
      var authType = Tenant.setting("authType") || "login";
      switch (authType) {
         case "login":
            PortalAuthLogin.show();
            break;

         case "passwordless":
            break;

         case "facebook":
            break;

         case "google":
            break;
      }
   }

   show() {
      $$("portal_auth").show();
   }
}

export default new PortalAuth();
