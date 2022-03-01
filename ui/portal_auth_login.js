import ClassUI from "./ClassUI.js";
import PortalAuthLoginForm from "./portal_auth_login_form.js";
import PortalAuthLoginResetPassword from "./portal_auth_login_resetPassword.js";
import PortalAuthLoginResetRequest from "./portal_auth_login_resetRequest.js";

class PortalAuthLogin extends ClassUI {
   constructor() {
      super();
   }

   ui() {
      var self = this;

      return {
         id: "portal_auth_login",
         view: "multiview",
         animate: false,
         rows: [
            PortalAuthLoginForm.ui(),
            PortalAuthLoginResetPassword.ui(),
            PortalAuthLoginResetRequest.ui(),
         ],
      };
   }

   async init(AB) {
      this.AB = AB;

      var allInits = [];
      allInits.push(PortalAuthLoginForm.init(AB));
      PortalAuthLoginForm.on("request.reset", () => {
         PortalAuthLoginResetRequest.show();
      });

      allInits.push(PortalAuthLoginResetRequest.init(AB));
      PortalAuthLoginResetRequest.on("login", () => {
         PortalAuthLoginForm.show();
      });

      allInits.push(PortalAuthLoginResetPassword.init(AB));
      PortalAuthLoginResetPassword.on("updated", () => {
         console.log(">>>> Password Changed ... NOW WHAT? <<<<<<");
      });

      await Promise.all(allInits);
   }

   show(defaultView) {
      // defaultView should be:
      //   "auth_login_form",
      //   "auth_login_passwordReset"

      if (defaultView) {
         var view = defaultView.split("_").pop();
         switch (view) {
            case "resetPassword":
               PortalAuthLoginResetPassword.show();
               break;

            default:
            case "form":
               PortalAuthLoginForm.show();
               break;
         }
         return;
      }

      // Default to the LoginForm
      PortalAuthLoginForm.show();
   }
}

export default new PortalAuthLogin();
