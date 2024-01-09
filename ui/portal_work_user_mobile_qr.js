import ClassUI from "./ClassUI.js";

class PortalWorkUserMobileQR extends ClassUI {
   constructor() {
      super("portal_work_user_qr_window", {
         // taskMultiview:"",
         description: "",
         instructions: "",
         title: "",
         qrcode: "",
         taskPager: "",
      });
   }

   ui() {
      var L = (...params) => {
         return this.label(...params);
      };
      const ids = this.ids;
      return {
         id: ids.component,
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
                  id: ids.title,
                  view: "label",
                  label: L("Connect Mobile App"),
               },
               {
                  view: "button",
                  type: "icon",
                  css: "webix_transparent",
                  width: 40,
                  icon: "fa fa-repeat",
                  click: () => {
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
                  type: "icon",
                  css: "webix_transparent",
                  width: 40,
                  icon: "nomargin fa fa-times",
                  click: () => {
                     $$(ids.component).hide();
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
            css: { "text-align": "center" },
            rows: [
               { height: 10 },
               {
                  id: ids.description,
                  borderless: true,
                  template: `<span style="font-size:14px;font-weight:500;">The App's Description should go here.</span>`,
               },
               {
                  id: ids.instructions,
                  borderless: true,
                  template: `<span style="font-size:14px;font-weight:500;">${L(
                     "Use your phone's camera app to scan this QR code, and it will open a webpage to the {0} mobile app. You only need to scan the code for the first time."
                  )}</span>`,
               },
               {
                  id: ids.qrcode,
                  height: 175,
                  borderless: true,
                  // autoheight: true,
                  autowidth: true,
                  template:
                     "<img src='/relay/user-qr' style='margin: 10px auto 20px;display:block;' />",
               },

               {},
               // {
               //    borderless: true,
               //    template: `<div style="font-size:14px;font-weight:500;font-weight:500;">${L(
               //       "This code can only be used once. It will expire after 7 days."
               //    )}</div>`,
               // },
            ],
         },
      };
   }

   init(AB) {
      this.AB = AB;
      webix.ui(this.ui());

      return Promise.resolve();
   }

   load(App) {
      var L = (...params) => {
         return this.label(...params);
      };

      // change Title
      let $title = $$(this.ids.title);
      $title.define("label", App.label);
      $title.refresh();

      // Change Description
      let $desc = $$(this.ids.description);
      $desc.define(
         "template",
         `<span style="font-size:14px;font-weight:500;">${App.description}</span>`
      );
      $desc.refresh();

      let $instr = $$(this.ids.instructions);
      $instr.define(
         "template",
         `<span style="font-size:14px;font-weight:500;">${L(
            "Use your phone's camera app to scan this QR code, and it will open a webpage to the {0} mobile app. You only need to scan the code for the first time.",
            [App.label]
         )}</span>`
      );

      // Change QR Image
      let $qrcode = $$(this.ids.qrcode);
      $qrcode.define(
         "template",
         `<img src='/mobile/qr/${App.id}' style='margin: 10px auto 20px;display:block;' />`
      );
      $qrcode.refresh();

      $$(this.ids.component)?.refresh?.();
   }

   hide() {
      $$(this.ids.component).hide();
   }

   show() {
      $$(this.ids.component).show();
   }
}

export default new PortalWorkUserMobileQR();
