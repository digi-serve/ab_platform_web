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

         case "cas":
            this.ActivePortal = PortalAuthLogin;
            break;

         case "passwordless":
            break;

         case "facebook":
            break;

         case "google":
            break;
      }

      return this.ActivePortal?.init(AB).then(() => {
         this.ActivePortal?.show();
      });
   }

   show(defaultView) {
      // We cannot properly store the session id if users navigate directly to /home
      // so when they navigate to /home and it was not a redirect we send them back to /
      if (
         window?.location?.pathname == "/home" &&
         !window?.performance?.navigation?.redirectCount
      )
         window.location.replace(window.location.origin);

      $$("portal_auth").show();
      this.ActivePortal.show(defaultView);
   }
}

export default new PortalAuth();
