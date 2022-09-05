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
                     rows: [
                        {
                           css: "portalLoginForm",
                           padding: 30,
                           rows: [
                              {
                                 template: `<div style='text-align: center; font-size:40px; line-height: 90px;'>
                                       <i class="fa fa-spinner fa-pulse fa-2x fa-fw"></i>
                                       <span class="sr-only">Loading...</span>
                                    </div>`,
                                 borderless: true,
                                 height: 110,
                                 type: "clean",
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
      $$("preload-text").setValues({ text });
   }
}

export default new PreloadUI();
