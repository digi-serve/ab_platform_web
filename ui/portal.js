import ClassUI from "./ClassUI.js";
import PortalLoading from "./portal_loading.js";
import PortalAuth from "./portal_auth.js";
import PortalWork from "./portal_work.js";

class Portal extends ClassUI {
   constructor() {
      super();

      this.ShownPortal = null;
      // {UI.Portal} ShownPortal
      // Keep track of which Portal is currently shown.

      this.portalWorkReady = false;
      // {bool}
      // has the PortalWork UI emitted it's "ready" event?
      //
   }

   ui() {
      return {
         view: "popup",
         fullscreen: true,
         modal: true,
         body: {
            id: "portal",
            view: "multiview",
            keepViews: true,
            animate: false,
            rows: [PortalLoading.ui(), PortalAuth.ui(), PortalWork.ui()],
         },
      };
   }

   init(AB) {
      this.AB = AB;

      this.AB.on("portal.show", (key) => {
         this.showPortal(key);
      });

      var allInits = [];
      // {array} allInits
      // all the .init() {Promise}s that are being generated during our
      // init().

      allInits.push(PortalAuth.init(AB));

      // if we are authenticated, then we make sure our loading & work portals
      // are prepared.
      if (this.AB.Account.isAuthenticated) {
         // Setup our listeners BEFORE the .init()s
         this.AB.Account.on("logout", () => {
            // on logout show Auth Portal
            this.showAuthPortal();
         });

         this.AB.Network.on("reauth", () => {
            // on logout show Auth Portal
            this.showAuthPortal();
         });

         PortalWork.on("ready", () => {
            this.portalWorkReady = true;
            this.showDefaultView();
         });

         // Now trigger our other .init()s
         allInits.push(PortalLoading.init(AB));
         allInits.push(PortalWork.init(AB));
      }

      return Promise.all(allInits).then(() => {
         this.showDefaultView();
      });
   }

   showAuthPortal(defaultView) {
      if (this.ShownPortal != PortalAuth) {
         PortalAuth.show(defaultView);
         this.ShownPortal = PortalAuth;
      }
   }

   showWorkPortal() {
      if (this.portalWorkReady) {
         if (this.ShownPortal != PortalWork) {
            // when loading portal is done move to Work Portal
            PortalWork.show();
            this.ShownPortal = PortalWork;
         }
      } else {
         if (!this.ShownPortal) {
            // if we haven't already shown a portal ... show the loading
            PortalLoading.show();
         }
      }
   }

   showDefaultView() {
      // At this point, all inits() are complete

      // if authenticated then show our default view:
      if (this.AB.Account.isAuthenticated) {
         // do we have a specified defaultView?
         let defaultView = this.AB.Config.setting("view");
         if (defaultView) {
            // defaultView should be in form:
            //    "auth_login_form",
            //    "auth_login_passwordReset",
            //    "work"
            var parts = defaultView.split("_");
            this.showPortal(parts[0], defaultView);
         } else {
            // then default to our work view:
            if (this.portalWorkReady) {
               this.showWorkPortal();
            } else {
               if (!this.ShownPortal) {
                  // if we haven't already shown a portal ... show the loading
                  PortalLoading.show();
               }
            }
         }
      } else {
         this.showAuthPortal();
      }
   }

   showPortal(key, defaultView) {
      switch (key) {
         case "auth":
            this.showAuthPortal(defaultView);
            break;

         case "work":
            this.showWorkPortal();
            break;
      }
   }
}

export default new Portal();
