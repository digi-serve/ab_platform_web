import ClassUI from "./ClassUI.js";

class PreloadUI extends ClassUI {
   ui() {
      return {
         id: "preloader",
         css: "portalLogin",
         cols: [
            {},
            {
               rows: [
                  {},
                  {
                     width: 360,
                     height: 200,
                     rows: [
                        {
                           css: "portalLoginForm",
                           padding: 30,
                           rows: [
                              {
                                 // .lds-default is a pure css loader from https://loading.io/
                                 template: `<div style='text-align: center; font-size:40px; line-height: 90px;'>
                                          <div class="lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
                                          <span class="sr-only">Loading...</span>
                                    </div>`,
                                 borderless: true,
                                 height: 110,
                                 type: "clean",
                                 on: {
                                    onAfterRender() {
                                       ClassUI.CYPRESS_REF(
                                          this,
                                          "preload-spinner"
                                       );
                                    },
                                 },
                              },
                              {
                                 id: "preload-text",
                                 template: `<div style='text-align: center; font-size:14px;'>
                                       #text#
                                    </div>`,
                                 borderless: true,
                              },
                           ],
                        },
                     ],
                  },
                  {},
               ],
            },
            {},
         ],
      };
   }
   preloadMessage(text) {
      $$("preload-text")?.setValues({ text });
   }
   destroy() {
      $$("preloader")?.destructor();
   }
}

export default new PreloadUI();
