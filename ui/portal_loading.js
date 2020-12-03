import ClassUI from "./ClassUI.js";

class PortalLoading extends ClassUI {
   constructor() {
      super();
   }

   ui() {
      return {
         id: "portal_loading",
         view: "label",
         label: "loading",
      };
   }

   init(AB) {
      this.AB = AB;

      return Promise.resolve();
   }

   show() {
      $$("portal_loading").show();
   }
}

export default new PortalLoading();
