import ClassUI from "./ClassUI.js";
import Portal from "./portal.js";

import Tenant from "../resources/Tenant.js";

class UI extends ClassUI {
   constructor() {
      super();

      this.hiddenElements = [];
   }

   ui() {
      return {
         id: "labelClickToEnter",
         view: "label",
         label: "Hello",
         on: {
            onItemClick: (/* id, e */) => {
               this.portalShow();
            }
         }
      };
   }

   init(Config) {
      var entryLabel = Tenant.textClickToEnter;
      if (entryLabel) {
         $$("labelClickToEnter").define({
            label: entryLabel
         });
      }

      // by not sending an id param, this creates it's own div.
      this.popup = Portal.attach();
      Portal.init(Config);

      if (Config.setting("autoenter")) {
         this.portalShow();
      } else {
         this.portalHide();
      }
   }

   portalHide() {
      // show our link to enter
      this.popup.hide();
   }

   portalShow() {
      // show our portal
      this.popup.show();
   }
}

export default new UI();
