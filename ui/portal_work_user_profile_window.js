import ClassUI from "./ClassUI.js";

class PortalWorkUserProfileWindow extends ClassUI {
   constructor() {
      super("portal_work_user_profile_window", {
         imageUser: "",
         uploaderImage: "",
         formUserInfo: "",

         dataEmail: "",
         editModeEmail: "",
         buttonEditModeEmail: "",
         editModeButtonsEmail: "",

         dataLanguage: "",
         editModeLanguage: "",
         buttonEditModeLanguage: "",
         editModeButtonsLanguage: "",

         formNewPassword: "",
         fieldNewPassword: "",
         systemNotification: "",
         advanceOptions: "",
      });
   }

   ui() {
      const ids = this.ids;
      const L = (...params) => {
         return this.label(...params);
      };

      return {
         id: ids.component,
         view: "window",
         position: "center",
         modal: true,
         head: {
            view: "toolbar",
            css: "webix_dark",
            cols: [
               { width: 7 },
               {
                  view: "label",
                  label: L("User Profile"),
               },
               {
                  view: "button",
                  autowidth: true,
                  type: "icon",
                  icon: "nomargin fa fa-times",
                  on: {
                     onItemClick() {
                        $$(ids.component).hide();
                     },
                     onAfterRender() {
                        ClassUI.CYPRESS_REF(this);
                     },
                  },
               },
            ],
         },
         body: {
            view: "layout",
            width: 640,
            css: {
               "text-align": "center",
               margin: "0px",
               padding: "0px",
            },
            rows: [
               {
                  cols: [
                     {
                        css: {
                           position: "absolute",
                           left: "162px",
                           top: "162px",
                        },
                        rows: [
                           {
                              id: ids.uploaderImage,
                              view: "uploader",
                              type: "icon",
                              width: 30,
                              height: 30,
                              zIndex: 999,
                              icon: "wxi-plus",
                              algin: "right",
                              css: {
                                 "text-align": "center",
                              },
                              inputName: "file",
                              apiOnly: true,
                              multiple: false,
                              accept:
                                 "image/png, image/gif, image/jpeg, image/bmp",
                              // Image field
                              upload: `/file/upload/${
                                 this.AB.objectUser().id
                              }/6383ce19-b344-44ee-87e6-decced7361f8/1`,
                              on: {
                                 // when upload is complete:
                                 onFileUpload: async (item, response) => {
                                    const imageID = response.data.uuid;

                                    const $uploaderImage = $$(
                                       ids.uploaderImage
                                    );
                                    const $imageUser = $$(ids.imageUser);

                                    $uploaderImage.disable();

                                    await this.AB.Network.put({
                                       url: `/app_builder/model/${
                                          this.AB.objectUser().id
                                       }/${this.AB.Account.uuid()}`,
                                       data: {
                                          image_id: response.data.uuid,
                                       },
                                    });

                                    this.AB.Account._config.image_id = imageID;

                                    $imageUser.setHTML(
                                       `<img src="file/${this.AB.Account.imageID()}" width="150" height="150" style="border-radius: 50%;" />`
                                    );
                                    $uploaderImage.enable();
                                 },

                                 // if an error was returned
                                 onFileUploadError: (item, response) => {
                                    const error = new Error(response);

                                    const $uploaderImage = $$(
                                       ids.uploaderImage
                                    );

                                    $uploaderImage.enable();

                                    console.error(error);
                                    webix.alert(error);
                                 },
                              },
                           },
                           {},
                        ],
                     },
                     {
                        id: ids.imageUser,
                        view: "template",
                        autoheight: true,
                        borderless: true,
                        width: 228,
                        css: {
                           "text-align": "center",
                        },
                        template: `<img src="file/${this.AB.Account.imageID()}" width="150" height="150" style="border-radius: 50%;" />`,
                     },
                     {
                        id: ids.formUserInfo,
                        view: "form",
                        borderless: true,
                        width: 388,
                        css: {
                           "text-align": "left",
                        },
                        elements: [
                           {
                              cols: [
                                 {
                                    view: "label",
                                    width: 70,
                                    css: {
                                       "text-align": "center",
                                    },
                                    label: L("Tenant"),
                                 },
                                 {
                                    view: "label",
                                    width: 15,
                                    label: ": ",
                                 },
                                 {
                                    view: "label",
                                    name: "tenant",
                                    value: "",
                                 },
                              ],
                           },
                           {
                              cols: [
                                 {
                                    view: "label",
                                    width: 70,
                                    css: {
                                       "text-align": "center",
                                    },
                                    label: L("Username"),
                                 },
                                 {
                                    view: "label",
                                    width: 15,
                                    label: ": ",
                                 },
                                 {
                                    view: "label",
                                    name: "username",
                                    value: "",
                                 },
                              ],
                           },
                           {
                              cols: [
                                 {
                                    view: "label",
                                    width: 70,
                                    css: {
                                       "text-align": "center",
                                    },
                                    label: L("Email"),
                                 },
                                 {
                                    view: "label",
                                    width: 15,
                                    label: ": ",
                                 },
                                 {
                                    id: ids.dataEmail,
                                    view: "label",
                                    name: "email",
                                    value: "",
                                 },
                                 {
                                    id: ids.editModeEmail,
                                    view: "text",
                                    hidden: true,
                                    value: "",
                                 },
                                 {
                                    id: ids.buttonEditModeEmail,
                                    view: "button",
                                    type: "icon",
                                    icon: "wxi-pencil",
                                    width: 40,
                                    inputWidth: 40,
                                    on: {
                                       onItemClick: () => {
                                          const $dataEmail = $$(ids.dataEmail);
                                          const $editModeEmail = $$(
                                             ids.editModeEmail
                                          );
                                          const $buttonEditModeEmail = $$(
                                             ids.buttonEditModeEmail
                                          );
                                          const $editModeButtonsEmail = $$(
                                             ids.editModeButtonsEmail
                                          );

                                          $editModeEmail.setValue(
                                             this.AB.Account.email()
                                          );

                                          $dataEmail.hide();
                                          $buttonEditModeEmail.hide();

                                          $editModeEmail.show();
                                          $editModeButtonsEmail.show();
                                       },
                                    },
                                 },
                                 {
                                    id: ids.editModeButtonsEmail,
                                    hidden: true,
                                    cols: [
                                       {
                                          view: "button",
                                          type: "icon",
                                          icon: "wxi-close",
                                          width: 40,
                                          inputWidth: 40,
                                          css: "webix_danger",
                                          on: {
                                             onItemClick: () => {
                                                const $dataEmail = $$(
                                                   ids.dataEmail
                                                );
                                                const $editModeEmail = $$(
                                                   ids.editModeEmail
                                                );
                                                const $buttonEditModeEmail = $$(
                                                   ids.buttonEditModeEmail
                                                );
                                                const $editModeButtonsEmail = $$(
                                                   ids.editModeButtonsEmail
                                                );

                                                $editModeEmail.hide();
                                                $editModeButtonsEmail.hide();

                                                $dataEmail.show();
                                                $buttonEditModeEmail.show();
                                             },
                                          },
                                       },
                                       {
                                          view: "button",
                                          type: "icon",
                                          icon: "wxi-check",
                                          width: 40,
                                          inputWidth: 40,
                                          css: "webix_primary",
                                          on: {
                                             onItemClick: async () => {
                                                const $dataEmail = $$(
                                                   ids.dataEmail
                                                );
                                                const $editModeEmail = $$(
                                                   ids.editModeEmail
                                                );
                                                const $buttonEditModeEmail = $$(
                                                   ids.buttonEditModeEmail
                                                );
                                                const $editModeButtonsEmail = $$(
                                                   ids.editModeButtonsEmail
                                                );

                                                $editModeEmail.hide();
                                                $editModeButtonsEmail.hide();

                                                $dataEmail.show();
                                                $buttonEditModeEmail.show();

                                                try {
                                                   const email = $editModeEmail.getValue();

                                                   $buttonEditModeEmail.disable();

                                                   await this.AB.Network.put({
                                                      url: `/app_builder/model/${
                                                         this.AB.objectUser().id
                                                      }/${this.AB.Account.uuid()}`,
                                                      data: {
                                                         email,
                                                      },
                                                   });

                                                   this.AB.Account._config.email = email;
                                                } catch (error) {
                                                   console.error(error);
                                                } finally {
                                                   $dataEmail.setValue(
                                                      this.AB.Account.email()
                                                   );
                                                   $buttonEditModeEmail.enable();
                                                }
                                             },
                                          },
                                       },
                                    ],
                                 },
                              ],
                           },
                           {
                              cols: [
                                 {
                                    view: "label",
                                    width: 70,
                                    css: {
                                       "text-align": "center",
                                    },
                                    label: L("Language"),
                                 },
                                 {
                                    view: "label",
                                    width: 15,
                                    label: ": ",
                                 },
                                 {
                                    id: ids.dataLanguage,
                                    view: "label",
                                    name: "language",
                                    value: "",
                                 },
                                 {
                                    id: ids.editModeLanguage,
                                    view: "combo",
                                    hidden: true,
                                    value: null,
                                    options: [],
                                 },
                                 {
                                    id: ids.buttonEditModeLanguage,
                                    view: "button",
                                    type: "icon",
                                    icon: "wxi-pencil",
                                    width: 40,
                                    inputWidth: 40,
                                    on: {
                                       onItemClick: async () => {
                                          const $dataLanguage = $$(
                                             ids.dataLanguage
                                          );
                                          const $editModeLanguage = $$(
                                             ids.editModeLanguage
                                          );
                                          const $buttonEditModeLanguage = $$(
                                             ids.buttonEditModeLanguage
                                          );
                                          const $editModeButtonsLanguage = $$(
                                             ids.editModeButtonsLanguage
                                          );

                                          $buttonEditModeLanguage.disable();

                                          $editModeLanguage.define(
                                             "options",
                                             await this.getLanguages()
                                          );
                                          $editModeLanguage.refresh();
                                          $editModeLanguage.setValue(
                                             this.AB.Account.language()
                                          );

                                          $dataLanguage.hide();
                                          $buttonEditModeLanguage.hide();

                                          $editModeLanguage.show();
                                          $editModeButtonsLanguage.show();
                                       },
                                    },
                                 },
                                 {
                                    id: ids.editModeButtonsLanguage,
                                    hidden: true,
                                    cols: [
                                       {
                                          view: "button",
                                          type: "icon",
                                          icon: "wxi-close",
                                          width: 40,
                                          inputWidth: 40,
                                          css: "webix_danger",
                                          on: {
                                             onItemClick: async () => {
                                                const $dataLanguage = $$(
                                                   ids.dataLanguage
                                                );
                                                const $editModeLanguage = $$(
                                                   ids.editModeLanguage
                                                );
                                                const $buttonEditModeLanguage = $$(
                                                   ids.buttonEditModeLanguage
                                                );
                                                const $editModeButtonsLanguage = $$(
                                                   ids.editModeButtonsLanguage
                                                );

                                                $editModeLanguage.hide();
                                                $editModeButtonsLanguage.hide();

                                                $dataLanguage.show();
                                                $buttonEditModeLanguage.show();

                                                try {
                                                   $dataLanguage.setValue(
                                                      await this.languageCodeToWord(
                                                         this.AB.Account.language()
                                                      )
                                                   );
                                                } catch (error) {
                                                   $dataLanguage.setValue(null);

                                                   console.error(error);
                                                } finally {
                                                   $buttonEditModeLanguage.enable();
                                                }
                                             },
                                          },
                                       },
                                       {
                                          view: "button",
                                          type: "icon",
                                          icon: "wxi-check",
                                          width: 40,
                                          inputWidth: 40,
                                          css: "webix_primary",
                                          on: {
                                             onItemClick: async () => {
                                                const $dataLanguage = $$(
                                                   ids.dataLanguage
                                                );
                                                const $editModeLanguage = $$(
                                                   ids.editModeLanguage
                                                );
                                                const $buttonEditModeLanguage = $$(
                                                   ids.buttonEditModeLanguage
                                                );
                                                const $editModeButtonsLanguage = $$(
                                                   ids.editModeButtonsLanguage
                                                );

                                                $editModeLanguage.hide();
                                                $editModeButtonsLanguage.hide();

                                                $dataLanguage.show();
                                                $buttonEditModeLanguage.show();

                                                try {
                                                   const languageCode = $editModeLanguage.getValue();

                                                   await this.AB.Network.put({
                                                      url: `/app_builder/model/${
                                                         this.AB.objectUser().id
                                                      }/${this.AB.Account.uuid()}`,
                                                      data: {
                                                         languageCode,
                                                      },
                                                   });

                                                   this.AB.Account._config.languageCode = languageCode;
                                                } catch (error) {
                                                   console.error(error);
                                                } finally {
                                                   try {
                                                      $dataLanguage.setValue(
                                                         await this.languageCodeToWord(
                                                            this.AB.Account.language()
                                                         )
                                                      );
                                                   } catch (error) {
                                                      $dataLanguage.setValue(
                                                         null
                                                      );

                                                      console.error(error);
                                                   }

                                                   $buttonEditModeLanguage.enable();
                                                }
                                             },
                                          },
                                       },
                                    ],
                                 },
                              ],
                           },
                        ],
                     },
                  ],
               },
               {
                  rows: [
                     {
                        view: "button",
                        type: "icon",
                        icon: "wxi-angle-down",
                        height: 30,
                        css: "webix_transparent",
                        label: L("Advanced Options"),
                        on: {
                           onItemClick: (id) => {
                              const $button = $$(id);
                              const $advanceOptions = $$(ids.advanceOptions);

                              if ($advanceOptions.isVisible()) {
                                 $button.define("icon", "wxi-angle-down");
                                 $button.refresh();
                                 $advanceOptions.hide();
                              } else {
                                 $button.define("icon", "wxi-angle-up");
                                 $button.refresh();
                                 $advanceOptions.show();
                              }
                           },
                        },
                     },
                     {
                        id: ids.advanceOptions,
                        hidden: true,
                        rows: [
                           {
                              view: "label",
                              width: 606,
                              css: {
                                 "text-align": "left",
                                 margin: "0px 17px 0px 17px !important",
                                 width: "606px !important",
                              },
                              label: `${L("New Password")}:`,
                           },
                           {
                              id: ids.formNewPassword,
                              view: "form",
                              borderless: true,
                              height: 38,
                              elements: [
                                 {
                                    css: {
                                       margin: "0px 17px 0px 17px !important",
                                    },
                                    cols: [
                                       {
                                          id: ids.fieldNewPassword,
                                          view: "text",
                                          name: "newPassword",
                                          type: "password",
                                          placeholder: L(
                                             "Enter a new Password (at least 8)"
                                          ),
                                          value: "",
                                          validate: (value) => {
                                             return value.length >= 8;
                                          },
                                       },
                                       { width: 10 },
                                       {
                                          view: "text",
                                          name: "confirmPassword",
                                          type: "password",
                                          placeholder: L("Confirm Password"),
                                          value: "",
                                          validate: (value) => {
                                             const $fieldNewPassword = $$(
                                                ids.fieldNewPassword
                                             );

                                             return (
                                                value ===
                                                $fieldNewPassword.getValue()
                                             );
                                          },
                                       },
                                       { width: 10 },
                                       {
                                          view: "button",
                                          type: "form",
                                          value: "Save",
                                          height: 32,
                                          width: 75,
                                          inputWidth: 75,
                                          css: "webix_primary",
                                          on: {
                                             onItemClick: async (id) => {
                                                const $thisButton = $$(id);
                                                const $formNewPassword = $$(
                                                   ids.formNewPassword
                                                );

                                                if (
                                                   $formNewPassword.validate()
                                                ) {
                                                   try {
                                                      const $fieldNewPassword = $$(
                                                         ids.fieldNewPassword
                                                      );
                                                      const password = $fieldNewPassword.getValue();

                                                      $thisButton.disable();
                                                      $formNewPassword.disable();

                                                      await this.AB.Network.post(
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
                                                      );
                                                   } catch (error) {
                                                      console.log(error);
                                                   } finally {
                                                      $formNewPassword.clear();
                                                      $formNewPassword.enable();
                                                      $thisButton.enable();
                                                   }
                                                   webix.alert(
                                                      "The new password is successfully updated!"
                                                   );
                                                }
                                             },
                                          },
                                       },
                                    ],
                                 },
                              ],
                           },
                           {
                              css: {
                                 "text-align": "left",
                                 margin: "0px 17px 0px 17px !important",
                                 width: "606px !important",
                              },
                              cols: [
                                 {
                                    view: "label",
                                    width: 135,
                                    css: {
                                       "text-align": "left !important",
                                    },
                                    label: `${L("System Notification")}`,
                                 },
                                 {
                                    id: ids.systemNotification,
                                    view: "checkbox",
                                    borderless: true,
                                    width: 27,
                                    css: {
                                       "text-align": "center !important",
                                    },
                                    value: 0,
                                    on: {
                                       onItemClick: async () => {
                                          const $systemNotification = $$(
                                             ids.systemNotification
                                          );

                                          try {
                                             const sendEmailNotifications = $systemNotification.getValue();
                                             await this.AB.Network.put({
                                                url: `/app_builder/model/${
                                                   this.AB.objectUser().id
                                                }/${this.AB.Account.uuid()}`,
                                                data: {
                                                   sendEmailNotifications,
                                                },
                                             });

                                             this.AB.Account._config.sendEmailNotifications = sendEmailNotifications;
                                          } catch (error) {
                                             console.error(error);
                                          } finally {
                                             $systemNotification.setValue(
                                                this.AB.Account.sendEmailNotifications()
                                             );
                                          }
                                       },
                                    },
                                 },
                              ],
                           },
                        ],
                     },
                  ],
               },
            ],
         },
      };
   }

   async init(AB) {
      this.AB = AB;

      webix.ui(this.ui());
   }

   async languageCodeToWord(code) {
      if (typeof code !== "string")
         throw new Error('The argrument "code" should be a string');

      const languages = await this.getLanguages();
      for (let i = 0; i < languages.length; i++)
         if (languages[i].id === code) return languages[i].value;

      return null;
   }

   async getLanguages() {
      const data = [];

      try {
         const response = await this.AB.Network.get({
            // The object "SITE_LANGUAGE"
            url: "/app_builder/model/d84cd351-d96c-490f-9afb-2a0b880ca0ec",
         });

         for (let i = 0; i < response.data.length; i++)
            data.push({
               id: response.data[i].language_code,
               value: response.data[i].language_label,
            });
      } catch (error) {
         console.error(error);
      }

      return data;
   }

   async populate() {
      const ids = this.ids;

      const $formUserInfo = $$(ids.formUserInfo);
      const $systemNotification = $$(ids.systemNotification);

      const populateLanguage = async () => {
         const $dataLanguage = $$(ids.dataLanguage);
         const $buttonEditModeLanguage = $$(ids.buttonEditModeLanguage);

         $buttonEditModeLanguage.disable();

         try {
            $dataLanguage.setValue(
               await this.languageCodeToWord(this.AB.Account.language())
            );
         } catch (error) {
            $dataLanguage.setValue(null);

            console.error(error);
         }

         $buttonEditModeLanguage.enable();
      };

      populateLanguage();
      $formUserInfo.setValues({
         tenant: this.AB.Tenant.id(),
         username: this.AB.Account.username(),
         email: this.AB.Account.email(),
      });
      $systemNotification.setValue(this.AB.Account.sendEmailNotifications());
   }

   hide() {
      const ids = this.ids;

      const $component = $$(ids.component);

      $component.hide();
   }

   show() {
      const ids = this.ids;

      const $component = $$(ids.component);

      $component.show();

      this.populate();
   }
}

export default new PortalWorkUserProfileWindow();