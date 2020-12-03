import ClassUI from "./ClassUI.js";
import Portal from "./portal.js";

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
            },
         },
      };
   }

   init(AB) {
      this.AB = AB;
      var entryLabel = this.AB.Tenant.textClickToEnter;
      if (entryLabel) {
         $$("labelClickToEnter").define({
            label: entryLabel,
         });
      }

      // by not sending an id param, this creates it's own div.
      this.popup = Portal.attach();

      return Portal.init(AB).then(() => {
         if (this.AB.Config.setting("autoenter")) {
            this.portalShow();
         } else {
            this.portalHide();
         }
      });
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
