import ClassUI from "./ClassUI.js";

var L = null;

class PortalAuthLoginResetRequest extends ClassUI {
   constructor() {
      super();
   }

   ui() {
      var self = this;

      if (!this.AB) {
         // we need to init() before being able to translate our UI:
         return {
            id: "portal_auth_login_reset_request",
         };
      }

      return {
         id: "portal_auth_login_reset_request",
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
                           id: "password_reset_email",
                           css: "portalLoginForm",
                           padding: 30,
                           rows: [
                              {
                                 template:
                                    "<div style='text-align: center; font-size:160px; line-height: 160px;'><i style='background-color: #666; color: transparent; text-shadow: 0px 1px 1px rgba(255,255,255,0.5); -webkit-background-clip: text; -moz-background-clip: text; background-clip: text;' class='fa fa-envelope-o'></i></div>",
                                 borderless: true,
                                 height: 190,
                                 type: "clean",
                              },
                              {
                                 id: "portal_reset_password_form",
                                 view: "form",
                                 type: "clean",
                                 css: { background: "transparent !important" },
                                 borderless: true,
                                 elementsConfig: {
                                    bottomPadding: 20,
                                 },
                                 elements: [
                                    {
                                       template: `<p>${L(
                                          "Enter your email. We'll send a link to reset your password."
                                       )}</p>`,
                                       autoheight: true,
                                       css: {
                                          background: "transparent",
                                          border: "none",
                                          "font-size": "16px",
                                          color: "black",
                                          "text-align": "center",
                                       },
                                    },
                                    {
                                       borderless: true,
                                       cols: [
                                          {
                                             id: "reset_tenantList",
                                             view: "select",
                                             // label: "Tenant",
                                             name: "tenant",
                                             attributes: {
                                                "data-cy": "reset_tenantList",
                                             },
                                             value: 1,
                                             options: [
                                                { id: 1, value: "Master" },
                                                { id: 2, value: "Release" },
                                             ],
                                          },
                                          {
                                             id: "reset-email",
                                             view: "text",
                                             placeholder: L("Email"),
                                             name: "email",
                                             validate: webix.rules.isEmail,
                                             invalidMessage: L(
                                                "Please enter a valid email."
                                             ),
                                             validateEvent: "blur",
                                          },
                                          {
                                             rows: [
                                                {
                                                   view: "button",
                                                   icon: "fa fa-paper-plane",
                                                   type: "icon",
                                                   css: "webix_primary",
                                                   autowidth: true,
                                                   hotkey: "enter",
                                                   click() {
                                                      var email = $$(
                                                         "reset-email"
                                                      );
                                                      if (email.validate()) {
                                                         email = email.getValue();
                                                         var tenant = $$(
                                                            "reset_tenantList"
                                                         ).getValue();
                                                         self.AB.Network.post(
                                                            {
                                                               url:
                                                                  "/auth/login/reset",
                                                               data: {
                                                                  email,
                                                                  tenant,
                                                                  url:
                                                                     window
                                                                        .location
                                                                        .origin ||
                                                                     window
                                                                        .location
                                                                        .href,
                                                               },
                                                            },
                                                            {
                                                               key:
                                                                  "portal_auth_login_reset",
                                                               context: {
                                                                  email,
                                                               },
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
                                    {
                                       view: "button",
                                       label: L("Back to log in"),
                                       css: "webix_transparent",
                                       click() {
                                          self.emit("login");
                                       },
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
      webix.ui(this.ui(), $$("portal_auth_login_reset_request"));

      var $tenant = $$("reset_tenantList");
      var siteConfig = this.AB.Config.siteConfig();
      if (siteConfig) {
         // replace options in tenant list with siteConfig.tenants:
         var newOptions = [];
         siteConfig.tenants.forEach((t) => {
            var opt = {
               id: t.uuid,
               value: t.title || t.key,
            };
            newOptions.push(opt);
         });

         $tenant.define("options", newOptions);
      }

      var tID = this.AB.Tenant.id();
      if (tID) {
         $tenant.define("value", tID);

         // if the tID matches one of our options, then we can hide
         // the input.
         // eg: they entered a route [tenant].our.url
         // we simple auto select the tenant and don't show this component.
         var opt = newOptions.find((o) => o.id == tID);
         if (opt) {
            $tenant.hide();
         }
      }

      this.AB.Network.on(
         "portal_auth_login_reset",
         (context, err, response) => {
            // Listen for our responses:
            // Show a popup for confirmation that an email was sent.
            // context.email : {string} entered email address.

            var text = L(
               "<p>An email with instructions on how to reset your password has been sent to <b>{0}</b>.</p><p>Check your spam or junk folder if you don’t see the email in your inbox.</p>",
               [context.email]
            );

            webix.alert({
               title: L("Email Sent"),
               ok: L("Okay"),
               width: 500,
               text: text,
            });
         }
      );
   }

   show() {
      $$("portal_auth_login_reset_request").show();
   }
}

export default new PortalAuthLoginResetRequest();
