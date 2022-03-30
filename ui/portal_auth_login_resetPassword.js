import ClassUI from "./ClassUI.js";

var L = null;

class PortalAuthLoginResetPassword extends ClassUI {
   constructor() {
      super();
   }

   ui() {
      var self = this;

      if (!this.AB) {
         // we need to init() before being able to translate our UI:
         return {
            id: "portal_auth_login_reset_password",
         };
      }

      return {
         id: "portal_auth_login_reset_password",
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
                           id: "portal_auth_login_reset_password_col",
                           css: "portalLoginForm",
                           padding: 30,
                           rows: [
                              {
                                 template:
                                    "<div style='text-align: center; font-size:160px; line-height: 160px;'><i style='background-color: #666; color: transparent; text-shadow: 0px 1px 1px rgba(255,255,255,0.5); -webkit-background-clip: text; -moz-background-clip: text; background-clip: text;' class='fa fa-user-circle-o'></i></div>",
                                 borderless: true,
                                 height: 190,
                                 type: "clean",
                              },
                              {
                                 id: "portal_auth_login_reset_password_form",
                                 view: "form",
                                 type: "clean",
                                 css: { background: "transparent !important" },
                                 borderless: true,
                                 elementsConfig: {
                                    height: 52,
                                 },
                                 elements: [
                                    {
                                       id: "new-password-email",
                                       template: ` ${this.AB.Account.email()} `,
                                       css: {
                                          background: "transparent !important",
                                          border: "none",
                                          "font-size": "16px",
                                          color: "black",
                                          "text-align": "center",
                                       },
                                    },
                                    {
                                       id: "password-new",
                                       view: "text",
                                       type: "password",
                                       placeholder: L("Enter a new Password"),
                                       name: L("Enter a new Password"),
                                       validate: (v) => {
                                          return v.length >= 8;
                                       },
                                       invalidMessage: L(
                                          "Needs to be at least 8 characters"
                                       ),
                                       validateEvent: "blur",
                                       bottomPadding: 20,
                                    },
                                    {
                                       id: "password-confirm",
                                       view: "text",
                                       type: "password",
                                       placeholder: L("Re-enter Password"),
                                       name: "email",
                                       validate: (v) => {
                                          return (
                                             v === $$("password-new").getValue()
                                          );
                                       },
                                       invalidMessage: L(
                                          "Passwords do not match"
                                       ),
                                       validateEvent: "blur",
                                       bottomPadding: 20,
                                    },
                                    {
                                       margin: 10,
                                       paddingX: 2,
                                       borderless: true,
                                       cols: [
                                          {},
                                          {
                                             view: "button",
                                             label: L("Save"),
                                             type: "form",
                                             css: "webix_primary",
                                             width: 150,
                                             hotkey: "enter",
                                             click: () => {
                                                if (
                                                   $$(
                                                      "portal_auth_login_reset_password_form"
                                                   ).validate()
                                                ) {
                                                   let password = $$(
                                                      "password-new"
                                                   ).getValue();
                                                   this.AB.Network.post(
                                                      {
                                                         url:
                                                            "/auth/password/reset",
                                                         data: {
                                                            password,
                                                         },
                                                      },
                                                      {
                                                         key:
                                                            "portal_auth_password_reset",
                                                         context: {},
                                                      }
                                                   ).catch((err) => {
                                                      console.log(err);
                                                   });
                                                }
                                             },
                                          },
                                          {},
                                       ],
                                    },
                                 ],
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

   async init(AB) {
      this.AB = AB;

      L = (...params) => {
         return this.AB.Multilingual.label(...params);
      };

      // now replace our initial placeholder with our viewable form
      webix.ui(this.ui(), $$("portal_auth_login_reset_password"));

      this.AB.Network.on(
         "portal_auth_password_reset",
         (context, err, response) => {
            // Listen for our responses:
            // Show a popup for confirmation that an email was sent.
            // context.email : {string} entered email address.

            this.AB.emit("portal.show", "work"); // switch to the Work Portal.
         }
      );
   }

   show() {
      $$("portal_auth_login_reset_password").show();
   }
}

export default new PortalAuthLoginResetPassword();
