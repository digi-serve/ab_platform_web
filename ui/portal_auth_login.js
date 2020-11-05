import ClassUI from "./ClassUI.js";

class PortalAuthLogin extends ClassUI {
   constructor() {
      super();
   }

   ui() {
      var self = this;

      return {
         id: "portal_auth_login",
         cols: [
            {},
            {
               rows: [
                  {},
                  {
                     id: "portal_auth_login_form",
                     view: "form",
                     elementsConfig: {
                        bottomPadding: 18,
                        labelWidth: 120,
                     },
                     elements: [
                        {
                           template:
                              "<span class='webix_icon fa-user-circle-o'></span>Login",
                           type: "header",
                        },
                        //// TODO: James make this look pretty ...
                        {
                           id: "portal_auth_login_form_errormsg",
                           view: "template",
                           height: 32,
                           template:
                              "<span class='webix_invalid'>Error Message Here</span>",
                        },
                        {
                           id: "portal_auth_login_form_tenantList",
                           view: "select",
                           label: "Tenant",
                           name: "tenant",
                           value: 1,
                           options: [
                              { id: 1, value: "Master" },
                              { id: 2, value: "Release" },
                           ],
                        },
                        {
                           view: "text",
                           label: "Email",
                           name: "email",
                           id: "email",
                           required: true,
                           validate: webix.rules.isEmail,
                           invalidMessage: "Please enter a valid email!",
                           on: {
                              onBlur: function () {
                                 // console.log("Validating email", this);
                                 var result = this.validate(); // validate only this field and show warning message under field if invalid
                                 if (this.$scope) this.$scope.validateForm();
                              },
                           },
                        },
                        {
                           view: "text",
                           type: "password",
                           label: "Password",
                           name: "password",
                           required: true,
                           validate: webix.rules.isNotEmpty,
                           invalidMessage: "Please enter your password!",
                           validateEvent: "key",
                           on: {
                              onBlur: function () {
                                 console.log("Validating password");
                                 this.validate();
                                 if (this.$scope) this.$scope.validateForm();
                              },
                              // onKeyPress: function() {
                              //    console.log("keypress in password");
                              // }
                           },
                        },
                        {
                           margin: 10,
                           paddingX: 2,
                           borderless: true,
                           cols: [
                              {},
                              {
                                 view: "button",
                                 label: "Login",
                                 type: "form",
                                 id: "loginFormSubmitButton",
                                 width: 150,
                                 click: function () {
                                    var form = $$("portal_auth_login_form");
                                    if (form.validate()) {
                                       var values = form.getValues();
                                       self.error(); // hids the error message
                                       self.AB.Network.post(
                                          { url: "/auth/login", data: values },
                                          { key: "portal_auth_login" }
                                       )
                                          .then((response) => {
                                             if (
                                                response.status == "success" &&
                                                response.data.user
                                             ) {
                                                // we can .reload() from cache given that all our
                                                // dynamic data comes from our initial /config call
                                                window.location.reload(false);
                                             } else {
                                                if (
                                                   response.status == "error"
                                                ) {
                                                   console.log(
                                                      "what to do with this error:"
                                                   );
                                                   console.log(response);
                                                }
                                             }
                                          })
                                          .catch((err) => {
                                             // any http 400-500 response should show up here:
                                             if (err.code) {
                                                switch (err.code) {
                                                   case "EINVALIDLOGIN":
                                                      self.error(err.message);
                                                      break;

                                                   case "EFAILEDATTEMPTS":
                                                      self.error(err.message);
                                                      $$(
                                                         "loginFormSubmitButton"
                                                      ).hide();
                                                      break;
                                                }
                                             }
                                          });
                                    }
                                 },
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

   error(message) {
      if (message) {
         $$("portal_auth_login_form_errormsg").setHTML(
            `<span class="webix_invalid">${message}</span>`
         );
         $$("portal_auth_login_form_errormsg").show();
      } else {
         $$("portal_auth_login_form_errormsg").hide();
      }
   }

   init(AB) {
      this.AB = AB;
      var siteConfig = AB.Config.siteConfig();
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
         // console.log("newOptions:", newOptions);

         $$("portal_auth_login_form_tenantList").define("options", newOptions);
      }

      var tID = this.AB.Tenant.id();
      if (tID) {
         $$("portal_auth_login_form_tenantList").define("value", tID);
      }

      this.error(); // hides the default error message.

      // Network.on("portal_auth_login", (key, context) => {
      //    console.log("Network.on():", key, context);
      // });
   }

   show() {
      $$("portal_auth_login").show();
   }
}

export default new PortalAuthLogin();
