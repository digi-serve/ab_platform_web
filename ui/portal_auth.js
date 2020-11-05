import ClassUI from "./ClassUI.js";

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
         cells: [PortalAuthLogin.ui()],
      };
   }

   init(AB) {
      this.AB = AB;
      PortalAuthLogin.init(AB);

      // decide which Auth type to display:
      var tID = this.AB.Tenant.id();
      var authType = this.AB.Tenant.setting("authType") || "login";
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
