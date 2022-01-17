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
            animate: false,
            rows: [PortalLoading.ui(), PortalAuth.ui(), PortalWork.ui()],
         },
      };
   }

   init(AB) {
      this.AB = AB;

      var allInits = [];
      // {array} allInits
      // all the .init() {Promise}s that are being generated during our
      // init().

      var ShownPortal = null;
      // {UI.Portal} ShownPortal
      // Keep track of which Portal is currently shown.

      allInits.push(PortalAuth.init(AB));

      // if we are authenticated, then we make sure our loading & work portals
      // are prepared.
      if (this.AB.Account.isAuthenticated) {
         // Setup our listeners BEFORE the .init()s
         this.AB.Account.on("logout", () => {
            // on logout show Auth Portal
            if (ShownPortal != PortalAuth) {
               PortalAuth.show();
               ShownPortal = PortalAuth;
            }
         });

         this.AB.Network.on("reauth", () => {
            // on logout show Auth Portal
            if (ShownPortal != PortalAuth) {
               PortalAuth.show();
               ShownPortal = PortalAuth;
            }
         });

         PortalWork.on("ready", () => {
            if (ShownPortal != PortalWork) {
               // when loading portal is done move to Work Portal
               PortalWork.show();
               ShownPortal = PortalWork;
            }
         });

         // Now trigger our other .init()s
         allInits.push(PortalLoading.init(AB));
         allInits.push(PortalWork.init(AB));
      }

      return Promise.all(allInits).then(() => {
         // if authenticated then show the loading Portal
         if (this.AB.Account.isAuthenticated) {
            if (!ShownPortal) {
               // if we haven't already shown a portal ... show the loading
               PortalLoading.show();
            }
         } else {
            if (ShownPortal != PortalAuth) {
               // if we are not authenticated, then move to Auth Portal
               PortalAuth.show();
               ShownPortal = PortalAuth;
            }
         }
      });
   }
}

export default new Portal();
