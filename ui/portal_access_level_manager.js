import ClassUI from "./ClassUI.js";

class PortalAccessLevelManager extends ClassUI {
   constructor() {
      super();
      this.accessLevels = [
         {
            id: "0",
            value: "No Access",
         },
         {
            id: "1",
            value: "Read Only",
         },
         {
            id: "2",
            value: "Full Access",
         },
      ];
   }

   ui() {
      const accessLevelManagerBody = {
         view: "scrollview",
         css: "lightgray ab_amp",
         body: {
            rows: [
               {
                  view: "accordion",
                  id: "amp_accordion",
                  roles: [],
                  hidden: true,
                  collapsed: true,
                  css: "webix_dark",
                  rows: [],
               },
               {
                  id: "amp_accordion_noSelection",
                  rows: [
                     {},
                     {
                        view: "label",
                        align: "center",
                        height: 200,
                        label: "<div style='display: block; font-size: 180px; background-color: #666; color: transparent; text-shadow: 0px 1px 1px rgba(255,255,255,0.5); -webkit-background-clip: text; -moz-background-clip: text; background-clip: text;' class='fa fa-unlock-alt'></div>",
                     },
                     {
                        view: "label",
                        align: "center",
                        label: "Add a role to control access.",
                     },
                     {
                        cols: [
                           {},
                           {
                              view: "button",
                              label: "Add Role",
                              type: "form",
                              css: "webix_primary",
                              autowidth: true,
                              click: () => {
                                 webix.ui(newRolePopup).show();

                                 const roles = this.roles.filter((role) => {
                                    return (
                                       $$("amp_accordion").config.roles.indexOf(
                                          role.id
                                       ) == -1
                                    );
                                 });

                                 $$("role_popup_options").define(
                                    "options",
                                    roles
                                 );
                                 $$("role_popup_options").refresh();
                              },
                           },
                           {},
                        ],
                     },
                     {},
                  ],
               },
            ],
         },
      };

      const newRolePopup = {
         view: "popup",
         id: "role_popup",
         position: "center",
         height: 250,
         width: 350,
         modal: true,
         body: {
            rows: [
               {
                  view: "toolbar",
                  id: "myToolbarABLiveTool",
                  css: "webix_dark",
                  cols: [
                     {
                        view: "label",
                        label: "Add Role",
                        align: "center",
                     },
                  ],
               },
               {
                  view: "form",
                  elements: [
                     /* We are not managing users yet so take this out
                                    {
                                      view: "text",
                                      label: "Create new",
                                      labelWidth: 90
                                    },
                                    {
                                      view: "label",
                                      label: "- or -",
                                      align: "center"
                                    },*/
                     {
                        view: "combo",
                        label: "",
                        id: "role_popup_options",
                        placeholder: "Choose role",
                        options: [],
                     },
                     {
                        cols: [
                           {
                              view: "button",
                              value: "Cancel",
                              click: () => {
                                 $$("role_popup").hide();
                              },
                           },
                           {
                              view: "button",
                              value: "Add",
                              id: "role_popup_options_add",
                              css: "webix_primary",
                              click: () => {
                                 const role =
                                    $$("role_popup_options").getValue();
                                 if ($$(`amp_accordionitem_${role}`)) {
                                    $$(`amp_accordionitem_${role}`).show();
                                    $$("amp_accordion").config.roles.push(role);
                                 } else {
                                    this.buildAccessAccordion(role);
                                 }
                                 $$("role_popup").hide();
                              },
                           },
                        ],
                     },
                  ],
               },
            ],
         },
      };

      return {
         view: "window",
         css: "ampWindow",
         id: "access_manager",
         position: function (state) {
            state.left = state.maxWidth - 350; // fixed values
            state.top = 0;
            state.width = 350; // relative values
            state.height = state.maxHeight;
         },
         on: {
            onShow: () => {
               // collapse all the accordion items but the top one
               var index = 0;
               $$("amp_accordion")
                  .getChildViews()
                  .forEach((a) => {
                     if (index == 0) {
                        $$(a).expand();
                     } else {
                        $$(a).collapse();
                     }
                     index++;
                     $$("amp_accordion").show();
                     $$("amp_accordion_noSelection").hide();
                  });
            },
         },
         //modal: true,
         head: {
            view: "toolbar",
            css: "webix_dark",
            cols: [
               {
                  width: 15,
               },
               {
                  view: "label",
                  label: "Access Manager",
                  autowidth: true,
               },
               {},
               {
                  view: "button",
                  label: "Add Role",
                  width: 100,
                  css: "webix_primary",
                  click: () => {
                     webix.ui(newRolePopup).show();

                     var roles = this.roles.filter((role) => {
                        return (
                           $$("amp_accordion").config.roles.indexOf(role.id) ==
                           -1
                        );
                     });

                     $$("role_popup_options").define("options", roles);
                     $$("role_popup_options").refresh();
                  },
               },
               {
                  view: "button",
                  width: 35,
                  css: "webix_transparent",
                  type: "icon",
                  icon: "nomargin fa fa-times",
                  click: () => {
                     this.hide();
                  },
               },
            ],
         },
         body: accessLevelManagerBody,
      };
   }

   init(portal) {
      this.AB = portal.AB;
      this.portal = portal;
      this.appId = portal.AppState.lastSelectedApp;

      const languageCode = this.AB.Config.userConfig().languageCode;
      this.roles = this.AB.Config.metaConfig().roles.map((role) => {
         const translation = role.translations.filter(
            (t) => t.code == languageCode
         );
         const name = translation.length == 1 ? translation[0].name : role.name;
         return { id: role.id, value: name };
      });

      webix.ui(this.ui());

      // buld the tree views for already defined role access levels
      const application = this.AB.applicationByID(this.appId);
      if (application.isAccessManaged) {
         // Build the access level tree for Roles
         const existingRoles = [];
         application.pages().forEach((page) => {
            Object.keys(page.accessLevels).forEach((role) => {
               if (existingRoles.indexOf(role) == -1) {
                  existingRoles.push(role);
               }
            });
         });
         existingRoles.forEach((role) => {
            this.buildAccessAccordion(role);
         });
      }
   }

   show() {
      $$("access_manager").show();
   }

   hide() {
      $$("access_manager").hide();
   }

   showPage(viewId, pageId, parent) {
      parent.application = {};
      parent.application.id = this.appId;
      this.portal.showPage(parent);
      const pageUI = this.portal.pageContainers[parent.id];
      pageUI.showPage(pageId, viewId);
   }

   /*
    * helper to get the current apps views
    */
   views(f) {
      return this.AB.applicationByID(this.appId).views(f);
   }

   buildAccessAccordion(role) {
      const L = this.AB.Label();
      const application = this.AB.applicationByID(this.appId);
      const isRoleAccessManager =
         parseInt(application.accessManagers.useRole) == 1 &&
         application.accessManagers.role.indexOf(role) > -1;
      const manageUsers = {
         rows: [
            {
               height: 10,
            },
            {
               cols: [
                  {
                     width: 10,
                  },
                  {
                     view: "button",
                     type: "icon",
                     icon: "fa fa-trash",
                     css: "webix_danger_inverse",
                     label: "Remove",
                     click: async () => {
                        const confirmation = await webix.confirm(
                           "Remove role from app?"
                        );
                        if (confirmation) {
                           const tree = $$(`linetree_${role}`);
                           const mainPages = this.AB.applicationByID(
                              this.appId
                           ).pages();
                           await mainPages.forEach(async (page) => {
                              const branch = tree.getItem(page.id);
                              branch.access = "0";
                              await page.updateAccessLevels(
                                 tree.config.role,
                                 "0"
                              );
                              tree.updateItem(page.id, branch);
                           });

                           $$(`amp_accordionitem_${role}`).hide();
                           const itemToRemove =
                              $$("amp_accordion").config.roles.indexOf(role);
                           if (itemToRemove > -1) {
                              $$("amp_accordion").config.roles.splice(
                                 itemToRemove,
                                 1
                              );
                           }
                        }
                     },
                  },
                  {
                     width: 10,
                  },
               ],
            },
            {
               height: 10,
            },
         ],
      };

      $$("amp_accordion").config.roles.push(role);

      const toggleParent = (element) => {
         if (!element.parent) return false;
         var parentElem = element.parent;
         if (!parentElem.parent) return false;
         parentElem.parent.emit("changeTab", parentElem.id);
         toggleParent(parentElem.parent);
      };

      const getParent = (id, component) => {
         let item = $$(component).getItem(id);
         if (item.$parent == 0) return item;
         else return getParent(item.$parent, component);
      };

      const tree = {
         id: `linetree_${role}`,
         view: "edittree",
         type: "lineTree",
         editable: true,
         role: role,
         editor: "combo",
         editValue: "access",
         threeState: true,
         template: (obj, common) => {
            const treeOptions = $$(`linetree_${role}`).config.options;
            const option = treeOptions.find((o) => o.id === obj.access);
            let color, icon;
            switch (option.id) {
               case "1":
                  color = "#FFAB00";
                  icon = "eye";
                  break;
               case "2":
                  color = "#00C853";
                  icon = "pencil";
                  break;
               default:
                  // Case "0"
                  color = "#ff4938";
                  icon = "lock";
            }

            return `<span class="accessLevel">
                     <span class="fa-stack">
                        <i style="color: ${color};" class="fa fa-circle fa-stack-2x"></i>
                        <i class="fa fa-${icon} fa-stack-1x fa-inverse"></i>
                     </span>
                     ${common.icon(obj, common)}
                     <span>${obj.label}</span>
                     <i class="externalLink fa fa-external-link"></i>
                  </span>`;
         },
         options: this.accessLevels,
         data: this.getAccessLevelTree(role),
         onClick: {
            externalLink: (event, branch, target) => {
               const item = $$(`linetree_${role}`).getItem(branch);
               const parent = getParent(branch, `linetree_${role}`);
               if (item.type == "tab") {
                  this.showPage(branch, item.pageId, parent);

                  const tabView = this.views((v) => v.id == item.id)[0];
                  if (!tabView) return false;

                  const tab = tabView.parent;
                  if (!tab) return false;

                  toggleParent(tab);
                  if (!$$(tabView.id) || !$$(tabView.id).isVisible()) {
                     const showIt = setInterval(() => {
                        if ($$(tabView.id) && $$(tabView.id).isVisible()) {
                           clearInterval(showIt);
                        }
                        tab.emit("changeTab", tabView.id);
                     }, 200);
                  }
               }
               // switch page
               else {
                  this.showPage(branch, item.id, parent);
               }

               return false;
            },
         },
         on: {
            onAfterEditStop: async (state, editor, ignoreUpdate) => {
               if (state.old == state.value) return false;
               const tree = $$(`linetree_${role}`);
               const view = this.views((v) => {
                  return v.id == editor.id;
               })[0];
               await view.updateAccessLevels(tree.config.role, state.value);
               console.log(
                  `Role: ${tree.config.role} set to Access Level: ${state.value} on view: ${view.id}`
               );
            },
            onDataUpdate: async (id, data, old) => {
               const tree = $$(`linetree_${role}`);
               if (data.access == "0") {
                  // NOTE: Need to update "No Access" option here because It does not trigger `onAfterEditStop` event
                  const view = this.views((v) => v.id == id)[0];
                  await view.updateAccessLevels(tree.config.role, data.access);

                  tree.blockEvent();
                  await tree.data.eachSubItem(id, async (child) => {
                     const childData = tree.getItem(child.id);
                     if (childData.access != data.access) {
                        childData.access = data.access;
                        const view = this.views((v) => {
                           return v.id == child.id;
                        })[0];
                        await view.updateAccessLevels(
                           tree.config.role,
                           data.access
                        );
                        console.log(
                           `Role: ${tree.config.role} set to Access Level: ${data.access} on view: ${view.id}`
                        );
                        tree.updateItem(child.id, childData);
                     }
                  });
                  tree.unblockEvent();
               } else {
                  const parentBranch = tree.getParentId(id);
                  const parentData = tree.getItem(parentBranch);
                  if (parentData) {
                     if (parentData.access == "0") {
                        parentData.access = "1";
                        const view = this.views((v) => {
                           return v.id == parentBranch;
                        })[0];
                        await view.updateAccessLevels(
                           tree.config.role,
                           parentData.access
                        );

                        console.log(
                           `Role: ${tree.config.role} set to Access Level: ${parentData.access} on view: ${view.id}`
                        );
                        tree.updateItem(parentBranch, parentData);
                     }
                  }
               }
            },
         },
      };

      const newAccordionItem = {
         view: "accordionitem",
         id: `amp_accordionitem_${role}`,
         header: () => {
            return `${
               this.roles?.find((r) => {
                  return r.id === role;
               })?.value ?? role
            } ${
               isRoleAccessManager
                  ? `<span class="header" webix_tooltip="${L(
                       "This role has been assigned as a Page Access Manager for this App. This means they have full access. Please remove the permissions from the App's Setting page if you would like to manage their access here."
                    )}">${this.WARNING_ICON}</span>`
                  : ""
            }`;
         },
         collapsed: true,
         body: {
            type: "clean",
            rows: [tree, manageUsers],
         },
      };

      $$("amp_accordion").addView(newAccordionItem, -1);
      $$("amp_accordion").show();
      $$("amp_accordion_noSelection").hide();

      if (isRoleAccessManager)
         this.AB.Webix.TooltipControl.addTooltip(
            $$(`amp_accordionitem_${role}`).$view
         );

      $$(`linetree_${role}`).openAll();
   }

   getAccessLevelTree(role) {
      const tree = new webix.TreeCollection();

      const addPage = (page, index, parentId, type) => {
         // add to tree collection
         const accessLevel = page.accessLevels[role] ?? "0";
         const branch = {
            id: page.id,
            access: accessLevel,
            label: page.label,
            pageId: parentId,
            type: type,
         };
         tree.add(branch, index, parentId);

         // stop at detail views
         if (page.defaults.key == "detail") {
            return;
         }

         const subPages = page.pages ? page.pages() : [];
         subPages.forEach((childPage, childIndex) => {
            addPage(childPage, childIndex, page.id, "page");
         });

         // add tabs
         page
            .views((view) => view.defaults.key == "tab")
            .forEach((tab, tabIndex) => {
               // tab views
               tab.views().forEach((tabView, tabViewIndex) => {
                  // tab items will be below sub-page items
                  const tIndex = subPages.length + tabIndex + tabViewIndex;
                  addPage(tabView, tIndex, page.id, "tab");
               });
            });
      };
      this.AB.applicationByID(this.appId)
         .pages()
         .forEach((p, index) => {
            addPage(p, index, null, "page");
         });

      return tree;
   }
}

export default new PortalAccessLevelManager();
