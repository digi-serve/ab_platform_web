import ClassUI from "./ClassUI.js";

class PortalWorkUserQRWindow extends ClassUI {
   constructor() {
      super();
      this.id = "portal_work_user_qr_window";
      this.idTaskMultiview = "taskMultiview";
      this.idTaskTitle = "taskTitle";
      this.idTaskPager = "taskPager";
   }

   ui() {
      var L = (...params) => {
         return this.label(...params);
      };
      return {
         id: this.id,
         view: "window",
         position: function (state) {
            state.left = state.maxWidth / 2 - 600 / 2; // fixed values
            state.top = state.maxHeight / 2 - (state.maxHeight * 0.7) / 2;
            state.width = 500; // relative values
            state.height = 400;
         },
         modal: true,
         head: {
            view: "toolbar",
            css: "webix_dark",
            cols: [
               { width: 17 },
               {
                  id: this.idTaskTitle,
                  view: "label",
                  label: L("Connect Mobile App"),
               },
               {
                  view: "button",
                  autowidth: true,
                  type: "icon",
                  css: "webix_transparent",
                  icon: "fa fa-repeat",
                  click: () => {
                     console.log("refresh");
                     $$("qr-code-image").refresh();
                  },
                  on: {
                     onAfterRender() {
                        ClassUI.CYPRESS_REF(this, "qr_image_reload");
                     },
                  },
               },
               {
                  view: "button",
                  autowidth: true,
                  type: "icon",
                  css: "webix_transparent",
                  icon: "nomargin fa fa-times",
                  click: () => {
                     $$(this.id).hide();
                  },
                  on: {
                     onAfterRender() {
                        ClassUI.CYPRESS_REF(this, "qr_window_close");
                     },
                  },
               },
            ],
         },
         body: {
            rows: [
               {
                  borderless: true,
                  template: L(
                     "Use your phone's camera app to scan this QR code, and it will open a webpage to the conneXted mobile app. You only need to scan the code for the first time."
                  ),
               },
               {
                  id: "qr-code-image",
                  borderless: true,
                  autoheight: true,
                  autowidth: true,
                  template:
                     "<img src='/relay/user-qr' style='margin: 10px auto 20px;display:block;' />",
               },

               {
                  borderless: true,
                  template: L(
                     "This code can only be used once. It will expire after 7 days."
                  ),
               },
            ],
         },
      };
   }

   init(AB) {
      this.AB = AB;
      webix.ui(this.ui());

      return Promise.resolve();
   }

   hide() {
      $$(this.id).hide();
   }

   show() {
      $$(this.id).show();
   }
}

export default new PortalWorkUserQRWindow();