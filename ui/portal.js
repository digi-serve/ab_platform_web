import ClassUI from "./ClassUI.js";
import PortalLoading from "./portal_loading.js";
import PortalAuth from "./portal_auth.js";
import PortalWork from "./portal_work.js";

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
            rows: [PortalLoading.ui(), PortalAuth.ui(), PortalWork.ui()],
         },
      };
   }

   init(AB) {
      this.AB = AB;
      PortalLoading.init(AB);
      PortalAuth.init(AB);
      PortalWork.init(AB);

      if (this.AB.Account.isAuthenticated) {
         PortalLoading.show();
      } else {
         PortalAuth.show();
      }

      this.AB.Account.on("logout", () => {
         PortalAuth.show();
      });

      PortalLoading.on("done", () => {
         PortalWork.show();
      });
   }
}

export default new Portal();
