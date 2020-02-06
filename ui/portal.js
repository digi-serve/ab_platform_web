import ClassUI from "./ClassUI.js";
import PortalLoading from "./portal_loading.js";
import PortalAuth from "./portal_auth.js";
import PortalWork from "./portal_work.js";

// Resources
import Account from "../resources/Account.js";

class Portal extends ClassUI {
   constructor() {
      super();
   }

   ui() {
      return {
         view: "popup",
         fullscreen: true,
         modal: true,
         body: {
            id: "portal",
            view: "multiview",
            rows: [PortalLoading.ui(), PortalAuth.ui(), PortalWork.ui()]
         }
      };
   }

   init(AB) {
      this.AB = AB;
      PortalLoading.init(AB);
      PortalAuth.init(AB);
      PortalWork.init(AB);

      if (Account.isAuthenticated) {
         PortalLoading.show();
      } else {
         PortalAuth.show();
      }

      Account.on("logout", () => {
         PortalAuth.show();
      });

      PortalLoading.on("done", () => {
         PortalWork.show();
      });
   }
}

export default new Portal();
