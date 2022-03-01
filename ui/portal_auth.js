import ClassUI from "./ClassUI.js";

// sub pages:
import PortalAuthLogin from "./portal_auth_login.js";

class PortalAuth extends ClassUI {
   constructor() {
      super();

      this.ActivePortal = null;
      // {PortalAuthxxx} ActivePortal
      // the UI Portal to use for Authenticating our User for this Tenant.
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

      // decide which Auth Portal to display:
      var authType = this.AB.Tenant.setting("authType") || "login";
      switch (authType) {
         case "login":
            this.ActivePortal = PortalAuthLogin;
            break;

         case "passwordless":
            break;

         case "facebook":
            break;

         case "google":
            break;
      }

      return this.ActivePortal.init(AB).then(() => {
         this.ActivePortal.show();
      });
   }

   show(defaultView) {
      $$("portal_auth").show();
      this.ActivePortal.show(defaultView);
   }
}

export default new PortalAuth();
