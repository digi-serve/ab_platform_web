import ClassUI from "./ClassUI.js";

import Switcheroo from "./portal_work_user_switcheroo.js";

class ErrorNoDefsUI extends ClassUI {
   ui() {
      const L = (...params) => {
         return this.label(...params);
      };
      return {
         rows: [
            {
               id: "switched",
               height: 23,
               css: "portal_work_switcheroo_user_switched",
               hidden: true,
               cols: [
                  {
                     width: 5,
                  },
                  {
                     id: "switched_label",
                     view: "label",
                     align: "center",
                  },
                  {
                     view: "button",
                     value: '<div style="text-align: center; font-size: 12px; color:#FFFFFF"><i class="fa-fw fa fa-times"></i></div>',
                     align: "center",
                     width: 30,
                     css: "webix_transparent",
                     on: {
                        onItemClick: () => {
                           Switcheroo.init(this.AB, true);
                           Switcheroo.switcherooClear();
                           $$("switched").hide();
                        },
                     },
                  },
                  {
                     width: 5,
                  },
               ],
            },
            {
               id: "error_no_defs",
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
                                       id: "error_no_defs_text",
                                       template: `<div style='text-align: center; font-size:14px;'>
                                       ${L(
                                          "You don't have any Roles in the system defined.  Talk to an Administrator."
                                       )}
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
            },
         ],
      };
   }

   async init(AB) {
      this.AB = AB;
   }

   switcherooUser(user) {
      const L = (...params) => {
         return this.label(...params);
      };
      $$("switched").show();
      $$("switched_label").setValue(
         L('*You are viewing this site as "{0}"*', [this.AB.Account.username()])
      );
   }

   preloadMessage(text) {
      $$("error_no_defs_text").setValues({ text });
   }
   destroy() {
      $$("error_no_defs").destructor();
   }
}

export default new ErrorNoDefsUI();
