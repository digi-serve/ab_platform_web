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

      // [fix] preventing console 404 errors when user doesn't have an Account Image:
      let acctImageID = this.AB.Account.imageID();
      let imgTemplate = `<img src="file/${acctImageID}" onerror="this.style.display='none'; document.getElementById('errorImage').style.display = 'block';" width="150" height="150" style="border-radius: 50%; margin: 10px auto; display: block; border: 3px solid white;" />`;
      let imgErrorDiv = `<div id="errorImage" style="display: none; width: 150px; height: 150px; background: #dee2e6; border-radius: 50%; margin: 10px auto; border: 3px solid white;"><i class="fa fa-user" style="font-size: 118px; color: white; margin: 15px 0 0 32px;"></i></div>`;

      if (acctImageID) {
         imgTemplate = `${imgTemplate}${imgErrorDiv}`; // show both in case value is invalid
      } else {
         imgTemplate = imgErrorDiv.replace("none;", "block;"); // show the Div
      }

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
                        ClassUI.CYPRESS_REF(this, "user-profile-close");
                     },
                  },
               },
            ],
         },
         // body: {
         // view: "scrollview",
         // minHeight: 455,
         body: {
            view: "layout",
            width: 460,
            rows: [
               {
                  rows: [
                     {
                        id: ids.imageUser,
                        view: "template",
                        autoheight: true,
                        borderless: true,
                        css: {
                           background: "#222f3e",
                        },
                        // width: 160,
                        template: imgTemplate,
                     },
                     {
                        css: {
                           position: "absolute",
                           top: "185px",
                        },
                        cols: [
                           {},
                           {
                              id: ids.uploaderImage,
                              view: "uploader",
                              type: "icon",
                              width: 34,
                              height: 32,
                              zIndex: 999,
                              icon: "fa fa-upload",
                              algin: "center",
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

                                    // await this.AB.Network.put({
                                    //    url: `/app_builder/model/${
                                    //       this.AB.objectUser().id
                                    //    }/${this.AB.Account.uuid()}`,
                                    //    data: {
                                    //       image_id: response.data.uuid,
                                    //    },
                                    // });
                                    await this.AB.objectUser()
                                       .model()
                                       .update(this.AB.Account.uuid(), {
                                          image_id: response.data.uuid,
                                       });

                                    this.AB.Account._config.image_id = imageID;

                                    $imageUser.setHTML(
                                       `<img src="file/${this.AB.Account.imageID()}" onerror="this.style.display='none'; document.getElementById('errorImage').style.display = 'block';" width="150" height="150" style="border-radius: 50%; margin: 10px auto; display: block; border: 3px solid white;" /><div id="errorImage" style="display: none; width: 150px; height: 150px; background: #dee2e6; border-radius: 50%; margin: 10px auto; border: 3px solid white;"><i class="fa fa-user" style="font-size: 118px; color: white; margin: 15px 0 0 32px;"></i></div>`
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

                                    this.AB.notify.developer(error, {
                                       context: "Error uploading file",
                                    });
                                    webix.alert(error);
                                 },
                              },
                           },
                           {},
                        ],
                     },
                     {
                        id: ids.formUserInfo,
                        view: "form",
                        width: 460,
                        height: 160,
                        borderless: true,
                        css: {
                           position: "relative",
                           top: "15px",
                        },
                        elements: [
                           {
                              css: {
                                 "border-bottom": "1px solid #dee2e6",
                                 "margin-top": "0 !important",
                              },
                              cols: [
                                 {
                                    view: "label",
                                    width: 160,
                                    // align: "right",
                                    label: L("Tenant"),
                                 },
                                 {
                                    view: "label",
                                    name: "tenant",
                                    value: "",
                                    css: "formText",
                                    on: {
                                       onAfterRender: function () {
                                          ClassUI.CYPRESS_REF(
                                             this,
                                             "user_profile_tenant"
                                          );
                                       },
                                    },
                                 },
                              ],
                           },
                           {
                              css: {
                                 "border-bottom": "1px solid #dee2e6",
                                 "margin-top": "0 !important",
                              },
                              cols: [
                                 {
                                    view: "label",
                                    width: 160,
                                    // align: "right",
                                    label: L("Username"),
                                 },
                                 {
                                    view: "label",
                                    name: "username",
                                    value: "",
                                    css: "formText",
                                    on: {
                                       onAfterRender: function () {
                                          ClassUI.CYPRESS_REF(
                                             this,
                                             "user_profile_username"
                                          );
                                       },
                                    },
                                 },
                              ],
                           },
                           {
                              css: {
                                 "border-bottom": "1px solid #dee2e6",
                                 "margin-top": "0 !important",
                              },
                              cols: [
                                 {
                                    view: "label",
                                    width: 160,
                                    // align: "right",
                                    label: L("Email"),
                                 },
                                 {
                                    id: ids.dataEmail,
                                    view: "label",
                                    name: "email",
                                    value: "",
                                    css: "formText",
                                    on: {
                                       onAfterRender: function () {
                                          ClassUI.CYPRESS_REF(
                                             this,
                                             "user_profile_email"
                                          );
                                       },
                                    },
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
                                                const $editModeButtonsEmail =
                                                   $$(ids.editModeButtonsEmail);

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
                                                const $editModeButtonsEmail =
                                                   $$(ids.editModeButtonsEmail);

                                                $editModeEmail.hide();
                                                $editModeButtonsEmail.hide();

                                                $dataEmail.show();
                                                $buttonEditModeEmail.show();

                                                try {
                                                   const email =
                                                      $editModeEmail.getValue();

                                                   $buttonEditModeEmail.disable();

                                                   // await this.AB.Network.put({
                                                   //    url: `/app_builder/model/${
                                                   //       this.AB.objectUser().id
                                                   //    }/${this.AB.Account.uuid()}`,
                                                   //    data: {
                                                   //       email,
                                                   //    },
                                                   // });
                                                   await this.AB.objectUser()
                                                      .model()
                                                      .update(
                                                         this.AB.Account.uuid(),
                                                         { email }
                                                      );

                                                   this.AB.Account._config.email =
                                                      email;
                                                } catch (error) {
                                                   this.AB.notify.developer(
                                                      error,
                                                      {
                                                         context:
                                                            "error updating user profile email",
                                                      }
                                                   );
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
                              css: {
                                 "margin-top": "0 !important",
                              },
                              cols: [
                                 {
                                    view: "label",
                                    width: 160,
                                    // align: "right",
                                    label: L("Language"),
                                 },
                                 {
                                    id: ids.dataLanguage,
                                    view: "label",
                                    name: "language",
                                    value: "",
                                    css: "formText",
                                    on: {
                                       onAfterRender: function () {
                                          ClassUI.CYPRESS_REF(
                                             this,
                                             "user_profile_language"
                                          );
                                       },
                                    },
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
                                                const $buttonEditModeLanguage =
                                                   $$(
                                                      ids.buttonEditModeLanguage
                                                   );
                                                const $editModeButtonsLanguage =
                                                   $$(
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
                                                   this.AB.notify.developer(
                                                      error,
                                                      {
                                                         context:
                                                            "portal_work_user_profile_window: Error updating language",
                                                      }
                                                   );
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
                                                const $buttonEditModeLanguage =
                                                   $$(
                                                      ids.buttonEditModeLanguage
                                                   );
                                                const $editModeButtonsLanguage =
                                                   $$(
                                                      ids.editModeButtonsLanguage
                                                   );

                                                $editModeLanguage.hide();
                                                $editModeButtonsLanguage.hide();

                                                $dataLanguage.show();
                                                $buttonEditModeLanguage.show();

                                                try {
                                                   const languageCode =
                                                      $editModeLanguage.getValue();

                                                   // await this.AB.Network.put({
                                                   //    url: `/app_builder/model/${
                                                   //       this.AB.objectUser().id
                                                   //    }/${this.AB.Account.uuid()}`,
                                                   //    data: {
                                                   //       languageCode,
                                                   //    },
                                                   // });
                                                   await this.AB.objectUser()
                                                      .model()
                                                      .update(
                                                         this.AB.Account.uuid(),
                                                         { languageCode }
                                                      );

                                                   this.AB.Account._config.languageCode =
                                                      languageCode;
                                                } catch (error) {
                                                   this.AB.notify.developer(
                                                      error,
                                                      {
                                                         context:
                                                            "portal_work_user_profile_window: Error updating language Code",
                                                      }
                                                   );
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

                                                      this.AB.notify.developer(
                                                         error,
                                                         {
                                                            context:
                                                               "portal_work_user_profile_window: Error updating languageCodeToWord()",
                                                         }
                                                      );
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
                        height: 40,
                        css: "webix_primary",
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
                              view: "form",
                              width: 460,
                              borderless: true,
                              elements: [
                                 {
                                    cols: [
                                       {
                                          rows: [
                                             {
                                                height: 3,
                                             },
                                             {
                                                view: "label",
                                                width: 160,
                                                // align: "right",
                                                label: L("New Password"),
                                             },
                                             {},
                                          ],
                                       },
                                       {
                                          id: ids.formNewPassword,
                                          view: "form",
                                          borderless: true,
                                          width: 260,
                                          padding: 0,
                                          elements: [
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
                                             {
                                                view: "text",
                                                name: "confirmPassword",
                                                type: "password",
                                                placeholder:
                                                   L("Confirm Password"),
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
                                             {
                                                view: "button",
                                                type: "form",
                                                value: "Save",
                                                align: "right",
                                                height: 32,
                                                width: 75,
                                                inputWidth: 75,
                                                css: "webix_primary",
                                                on: {
                                                   onItemClick: async (id) => {
                                                      const $formNewPassword =
                                                         $$(
                                                            ids.formNewPassword
                                                         );
                                                      const $thisButton =
                                                         $$(id);

                                                      if (
                                                         $formNewPassword.validate()
                                                      ) {
                                                         try {
                                                            const $fieldNewPassword =
                                                               $$(
                                                                  ids.fieldNewPassword
                                                               );
                                                            const password =
                                                               $fieldNewPassword.getValue();

                                                            $thisButton.disable();
                                                            $formNewPassword.disable();

                                                            await this.AB.Network.post(
                                                               {
                                                                  url: "/auth/password/reset",
                                                                  data: {
                                                                     password,
                                                                  },
                                                               },
                                                               {
                                                                  key: "portal_auth_password_reset",
                                                                  context: {},
                                                               }
                                                            );
                                                         } catch (error) {
                                                            this.AB.notify.developer(
                                                               error,
                                                               {
                                                                  context:
                                                                     "portal_work_user_profile_window:Error resetting password",
                                                               }
                                                            );
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
                                       "border-top": "1px solid #dee2e6",
                                    },
                                    cols: [
                                       {
                                          view: "label",
                                          width: 160,
                                          // align: "right",
                                          label: L("System Notification"),
                                       },
                                       {
                                          id: ids.systemNotification,
                                          view: "checkbox",
                                          borderless: true,
                                          width: 27,
                                          css: {
                                             "text-align": "center !important",
                                             padding: "0 10px",
                                          },
                                          value: 0,
                                          on: {
                                             onItemClick: async () => {
                                                const $systemNotification = $$(
                                                   ids.systemNotification
                                                );

                                                try {
                                                   const sendEmailNotifications =
                                                      $systemNotification.getValue();
                                                   // await this.AB.Network.put({
                                                   //    url: `/app_builder/model/${
                                                   //       this.AB.objectUser().id
                                                   //    }/${this.AB.Account.uuid()}`,
                                                   //    data: {
                                                   //       sendEmailNotifications,
                                                   //    },
                                                   // });

                                                   await this.AB.objectUser()
                                                      .model()
                                                      .update(
                                                         this.AB.Account.uuid(),
                                                         {
                                                            sendEmailNotifications,
                                                         }
                                                      );

                                                   this.AB.Account._config.sendEmailNotifications =
                                                      sendEmailNotifications;
                                                } catch (error) {
                                                   this.AB.notify.developer(
                                                      error,
                                                      {
                                                         context:
                                                            "portal_work_user_profile_window:Error updating email notifications",
                                                      }
                                                   );
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
            ],
         },
         // },
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
         const Language = this.AB.objectLanguage();
         const response = await Language.model().findAll();
         for (let i = 0; i < response.data.length; i++)
            data.push({
               id: response.data[i].language_code,
               value: response.data[i].language_label,
            });
      } catch (error) {
         this.AB.notify.developer(error, {
            context: "Error getting Languages",
         });
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

            this.AB.notify.developer(error, {
               context: "Error setting Languages",
            });
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
