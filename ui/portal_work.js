import ClassUI from "./ClassUI.js";

class PortalWork extends ClassUI {
   constructor() {
      super();
   }

   ui() {
      return {
         id: "portal_work",
         view: "label",
         label: "work"
      };
   }

   init(AB) {
      this.AB = AB;
   }

   show() {
      $$("portal_work").show();
   }
}

export default new PortalWork();
