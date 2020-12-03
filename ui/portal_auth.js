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

      var ActivePortal = null;
      // {PortalAuthxxx} ActivePortal
      // the UI Portal to use for Authenticating our User for this Tenant.

      // decide which Auth Portal to display:
      var authType = this.AB.Tenant.setting("authType") || "login";
      switch (authType) {
         case "login":
            ActivePortal = PortalAuthLogin;
            break;

         case "passwordless":
            break;

         case "facebook":
            break;

         case "google":
            break;
      }

      return ActivePortal.init(AB).then(() => {
         ActivePortal.show();
      });
   }

   show() {
      $$("portal_auth").show();
   }
}

export default new PortalAuth();
