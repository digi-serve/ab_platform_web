const ABViewPageCore = require("../../core/views/ABViewPageCore");

const ABPropertyComponentDefaults = ABViewPageCore.defaultValues();

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewPage extends ABViewPageCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   //
   //	Editor Related
   //

   /**
    * @method editorComponent
    * return the Editor for this UI component.
    * the editor should display either a "block" view or "preview" of
    * the current layout of the view.
    * @param {string} mode what mode are we in ['block', 'preview']
    * @return {Component}
    */
   // editorComponent(App, mode) {
   //    var comp = super.editorComponent(App, mode);

   //    var _init = (options) => {
   //       comp.init(options);
   //    };

   //    return {
   //       ui: comp.ui,
   //       init: _init,
   //       logic: comp.logic,

   //       onShow: comp.onShow,
   //    };
   // }

   /*
   static propertyEditorDefaultElements(App, ids, _logic, ObjectDefaults) {
      var commonUI = super.propertyEditorDefaultElements(
         App,
         ids,
         _logic,
         ObjectDefaults
      );

      _logic.permissionClick = (id, e, node, isRetry = false) => {
         var List = $$(ids.permissions);
         var item = List.getItem(id);

         List.showProgress({ type: "icon" });

         if (item.markCheckbox) {
            console.warn("ABViewPage:check for depreciated role removal here:");
            App.AB.Network.delete({
               url: "/app_builder/page/" + item.action_key + "/role",
               data: {
                  role_id: item.id,
               },
            })
               .then((data) => {
                  item.markCheckbox = false;
                  List.updateItem(id, item);
                  List.hideProgress();
               })
               .catch((err) => {
                  console.error(err);
                  if (err.code == "E_NOACTIONKEY") {
                     // if this our second time through, then display an error:
                     if (isRetry) {
                        console.error("Error Saving Permisison: ", err);
                        List.hideProgress();
                        return;
                     }

                     // in the case where no ActionKey was present,
                     // we can still mark that this is no longer connected:
                     item.markCheckbox = false;
                     List.updateItem(id, item);

                     // Now if we got here, there is an issue with the data in our
                     // Permissions.  These permissions get created when a Page is
                     // .created/saved, so let's run through our pages again and
                     // save() them
                     var allSaves = [];
                     item._view.application.pages().forEach((page) => {
                        allSaves.push(page.save());
                     });

                     // once that is all done, try this again:
                     Promise.all(allSaves).then(() => {
                        _logic.permissionClick(id, e, node, true);
                     });
                  }
               });
         } else {
            console.warn("ABViewPage:check for depreciated role operation");
            App.AB.Network.put({
               url: "/app_builder/page/" + item.action_key + "/role",
               data: {
                  role_id: item.id,
               },
            })
               .then((data) => {
                  item.markCheckbox = true;
                  List.updateItem(id, item);
                  List.hideProgress();
               })
               .catch((err) => {
                  console.error(err);
                  if (err.code == "E_NOACTIONKEY") {
                     // if this our second time through, then display an error:
                     if (isRetry) {
                        console.error("Error Saving Permisison: ", err);
                        List.hideProgress();
                        return;
                     }

                     // Now if we got here, there is an issue with the data in our
                     // Permissions.  These permissions get created when a Page is
                     // .created/saved, so let's run through our pages again and
                     // save() them
                     var allSaves = [];
                     item._view.application.pages().forEach((page) => {
                        allSaves.push(page.save());
                     });

                     // once that is all done, try this again:
                     Promise.all(allSaves).then(() => {
                        _logic.permissionClick(id, e, node, true);
                     });
                  }
               });
         }
      };

      // in addition to the common .label  values, we
      // ask for:
      return commonUI.concat([
         {
            name: "type",
            view: "richselect",
            label: L("Type"),
            options: [
               { id: "page", value: L("Page") },
               { id: "popup", value: L("Popup") },
            ],
            on: {
               onChange: function (newv, oldv) {
                  if (newv == "page") {
                     $$(ids.popupSettings).hide();
                     $$(ids.pageSettings).show();
                  } else {
                     $$(ids.popupSettings).show();
                     $$(ids.pageSettings).hide();
                  }
               },
            },
         },
         {
            view: "fieldset",
            name: "popupSettings",
            label: L("Popup Settings"),
            labelWidth: this.AB.UISettings.config().labelWidthLarge,
            body: {
               type: "clean",
               padding: 10,
               rows: [
                  {
                     view: "text",
                     name: "popupWidth",
                     placeholder: L("Set popup width"),
                     label: L("Width:"),
                     labelWidth: this.AB.UISettings.config().labelWidthLarge,
                     validate: webix.rules.isNumber,
                  },
                  {
                     view: "text",
                     name: "popupHeight",
                     placeholder: L("Set popup height"),
                     label: L("Height:"),
                     labelWidth: this.AB.UISettings.config().labelWidthLarge,
                     validate: webix.rules.isNumber,
                  },
               ],
            },
         },
         {
            view: "fieldset",
            name: "pageSettings",
            label: L("Page Settings"),
            labelWidth: this.AB.UISettings.config().labelWidthLarge,
            body: {
               type: "clean",
               padding: 10,
               rows: [
                  {
                     view: "checkbox",
                     name: "fixedPageWidth",
                     labelRight: L("Page has fixed width"),
                     labelWidth: this.AB.UISettings.config().labelWidthCheckbox,
                     click: function (id, event) {
                        if (this.getValue() == 1) {
                           $$(ids.pageWidth).show();
                        } else {
                           $$(ids.pageWidth).hide();
                        }
                     },
                  },
                  {
                     view: "text",
                     name: "pageWidth",
                     placeholder: L("Set page width"),
                     label: L("Page width:"),
                     labelWidth: this.AB.UISettings.config().labelWidthLarge,
                  },
                  {
                     view: "richselect",
                     name: "pageBackground",
                     label: L("Page background:"),
                     labelWidth: this.AB.UISettings.config().labelWidthXLarge,
                     options: [
                        {
                           id: "ab-background-default",
                           value: L("White (default)"),
                        },
                        {
                           id: "ab-background-gray",
                           value: L("Dark"),
                        },
                        // { "id":"ab-background-texture", "value":L('ab.component.page.pageBackgroundTextured', '*Textured')}
                     ],
                  },
               ],
            },
         },
         {
            view: "fieldset",
            name: "pagePermissionPanel",
            label: L("Page Permissions:"),
            labelWidth: this.AB.UISettings.config().labelWidthLarge,
            body: {
               type: "clean",
               padding: 10,
               rows: [
                  {
                     name: "permissions",
                     view: "list",
                     select: false,
                     minHeight: 200,
                     template: "{common.markCheckbox()} #name#",
                     type: {
                        markCheckbox: function (obj) {
                           return `<span class='check webix_icon fa fa-${
                              obj.markCheckbox ? "check-" : ""
                           }square-o'></span>`;
                        },
                     },
                     on: {
                        onItemClick: function (id, e, node) {
                           _logic.permissionClick(id, e, node);
                        },
                     },
                  },
               ],
            },
         },
      ]);
   }

   static propertyEditorPopulate(App, ids, view, logic) {
      super.propertyEditorPopulate(App, ids, view, logic);

      $$(ids.type).setValue(
         view.settings.type || ABPropertyComponentDefaults.type
      );
      $$(ids.popupWidth).setValue(
         view.settings.popupWidth || ABPropertyComponentDefaults.popupWidth
      );
      $$(ids.popupHeight).setValue(
         view.settings.popupHeight || ABPropertyComponentDefaults.popupHeight
      );
      $$(ids.pageWidth).setValue(
         view.settings.pageWidth || ABPropertyComponentDefaults.pageWidth
      );
      $$(ids.fixedPageWidth).setValue(
         view.settings.fixedPageWidth ||
            ABPropertyComponentDefaults.fixedPageWidth
      );
      $$(ids.pageBackground).setValue(
         view.settings.pageBackground ||
            ABPropertyComponentDefaults.pageBackground
      );

      // Disable select type of page when this page is root
      if (view.isRoot()) {
         $$(ids.type).hide();

         // Update permission options
         $$(ids.pagePermissionPanel).show();
         this.propertyUpdatePermissionsOptions(ids, view);
      } else {
         $$(ids.pagePermissionPanel).hide();
         $$(ids.type).show();
      }

      if (view.settings.type == "popup") {
         $$(ids.popupSettings).show();
         $$(ids.pageSettings).hide();
      } else {
         $$(ids.popupSettings).hide();
         $$(ids.pageSettings).show();
      }

      if (view.settings.fixedPageWidth == 1) {
         $$(ids.pageWidth).show();
      } else {
         $$(ids.pageWidth).hide();
      }
   }

   static propertyEditorValues(ids, view) {
      super.propertyEditorValues(ids, view);

      view.settings.type = $$(ids.type).getValue();
      view.settings.popupWidth = $$(ids.popupWidth).getValue();
      view.settings.popupHeight = $$(ids.popupHeight).getValue();
      view.settings.pageWidth = $$(ids.pageWidth).getValue();
      view.settings.fixedPageWidth = $$(ids.fixedPageWidth).getValue();
      view.settings.pageBackground = $$(ids.pageBackground).getValue();
   }

   /**
    * @method propertyUpdatePermissionsOptions
    * Populate permissions of Ops Portal to select list in property
    *
    * /
   static propertyUpdatePermissionsOptions(ids, view) {
      var action_key = this.getPageActionKey(view);
      var roles = [];

      var List = $$(ids.permissions);

      // make sure our list has been made into a ProgressBar
      if (!List.showProgress) {
         webix.extend(List, webix.ProgressBar);
      }

      List.clearAll();
      List.showProgress({ type: "icon" });

      console.error(
         "ABViewPage: check for depreciated Permission checks here."
      );
      view.application
         .getPermissions()
         .then(function (selected_role_ids) {
            var app_roles = selected_role_ids;

            view.AB.Network.get({
               url: "/app_builder/page/" + action_key + "/role",
            }).then((data) => {
               var selectedRoles = [];
               data.selected.forEach((s) => {
                  selectedRoles.push(s.id);
               });

               data.roles.forEach((r) => {
                  if (app_roles.indexOf(r.id) != -1) {
                     if (selectedRoles.indexOf(r.id) != -1) {
                        r.markCheckbox = true;
                     } else {
                        r.markCheckbox = false;
                     }
                     r.action_key = action_key;
                     r._view = view;
                     roles.push(r);
                  }
               });

               roles = view.AB.orderBy(roles, "id", "asc");

               List.parse(roles);
               List.hideProgress();
            });
         })
         .catch(function (err) {
            List.hideProgress();

            console.error(err);
         });
   }
   */

   /*
    * @component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false) {
      var component = super.component();

      component._ui = component.ui();

      // wrap our ABViewContainer in our Page scrollview
      component.ui = () => {
         return {
            view: "scrollview",
            borderless: true,
            css:
               this.settings.pageBackground ||
               ABPropertyComponentDefaults.pageBackground,
            body: component._ui,
         };
      };

      // if this is our v1Interface
      if (v1App) {
         var newComponent = component;
         component = {
            ui: component.ui(),
            init: (options, accessLevel) => {
               accessLevel = accessLevel ?? this.getUserAccess();
               return newComponent.init(this.AB, accessLevel, options);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
      }

      return component;
   }
   /*
   componentV1(App) {
      var comp = super.component(App);
      var _ui = {
         view: "scrollview",
         borderless: true,
         css:
            this.settings.pageBackground ||
            ABPropertyComponentDefaults.pageBackground,
         body: comp.ui,
      };

      var _init = (options) => {
         var accessLevel = this.getUserAccess();
         comp.init(options, accessLevel);
      };

      return {
         ui: _ui,
         init: _init,
         logic: comp.logic,

         onShow: comp.onShow,
      };
   }
   */
};
