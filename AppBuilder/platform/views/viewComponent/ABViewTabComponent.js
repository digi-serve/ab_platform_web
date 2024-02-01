const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewTabComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewTab_${baseView.id}`,
         Object.assign(
            {
               tab: "",

               sidebar: "",
               expandMenu: "",
               collapseMenu: "",

               popupTabManager: "",
               popupTabManagerForm: "",
               popupTabManagerSaveButton: "",
            },
            ids
         )
      );

      this.viewComponents =
         this.viewComponents ||
         baseView
            .views((v) => v.getUserAccess())
            .map((v) => {
               return {
                  view: v,
                  // component: v.component(App)
               };
            });
   }

   ui() {
      const ids = this.ids;
      const baseView = this.view;
      const ab = this.AB;
      const abWebix = ab.Webix;

      let _ui = null;

      // We are going to make a custom icon using the first letter of a menu item for menu items that don't have an icon
      // to do this we need to modify the default template with the method webix recommended form this snippet https://snippet.webix.com/b566d9f8
      abWebix.type(abWebix.ui.tree, {
         baseType: "sideBar", // inherit everything else from sidebar type
         name: "customIcons",
         icon: (obj, common) => {
            if (obj.icon.length)
               return [
                  "<span class='webix_icon webix_sidebar_icon fa fa-fw fa-",
                  obj.icon,
                  "'></span>",
               ].join("");

            return [
               "<span class='webix_icon webix_sidebar_icon sidebarCustomIcon'>",
               obj.value.charAt(0).toUpperCase(),
               "</span>",
            ].join("");
         },
      });

      const viewComponents = this.viewComponents;
      const settings = this.settings;

      if (viewComponents.length > 0) {
         if (settings.stackTabs) {
            // define your menu items from the view components
            const menuItems = viewComponents.map((vc) => {
               const view = vc.view;

               return {
                  id: `${view.id}_menu`,
                  value: view.label,
                  icon: view.tabicon ? view.tabicon : "",
               };
            });

            if (menuItems.length) {
               // create a menu item for the collapse option to use later
               const collapseMenu = {
                  id: ids.collapseMenu,
                  value: this.label("Collapse Menu"),
                  icon: "chevron-circle-left",
               };

               // create a menu item from the expand option to use later
               const expandMenu = {
                  id: ids.expandMenu,
                  value: this.label("Expand Menu"),
                  icon: "chevron-circle-right",
                  hidden: true,
               };

               // find out what the first option is so we can set it later
               let selectedItem = `${viewComponents[0].view.id}_menu`;

               const abStorage = ab.Storage;
               const sidebar = {
                  view: "sidebar",
                  type: "customIcons", // define the sidebar type with the new template created above
                  id: ids.sidebar,
                  height: settings.height,
                  width: settings.sidebarWidth ? settings.sidebarWidth : 0,
                  scroll: true,
                  position: settings.sidebarPos ? settings.sidebarPos : "left",
                  css: settings.darkTheme ? "webix_dark" : "",
                  data: menuItems.concat(collapseMenu), // add you menu items along with the collapse option to start
                  on: {
                     onItemClick: (id) => {
                        // when a menu item is clicked
                        if (id === ids.collapseMenu) {
                           // if it was the collapse menu item
                           setTimeout(() => {
                              const $sidebar = $$(ids.sidebar);

                              // remove the collapse option from the menu
                              $sidebar.remove(ids.collapseMenu);
                              // add the expand option to the menu
                              $sidebar.add(expandMenu);
                              // toggle the sidebar state
                              $sidebar.toggle();
                              // we just clicked the collapse...but we don't wanted highlighted
                              // so highlight the previously selected menu item
                              $sidebar.select(selectedItem);
                              // store this state in local storage the user preference is
                              // remembered next time they see this sidebar
                              abStorage.set(
                                 `${ids.tab}-state`,
                                 $sidebar.getState()
                              );
                           }, 0);
                        } else if (id === ids.expandMenu) {
                           setTimeout(() => {
                              const $sidebar = $$(ids.sidebar);

                              // remove the expand option from the menu
                              $sidebar.remove(ids.expandMenu);
                              // add the collapse option to the menu
                              $sidebar.add(collapseMenu);
                              // toggle the sidebar state
                              $sidebar.toggle();
                              // we just clicked the collapse...but we don't wanted highlighted
                              // so highlight the previously selected menu item
                              $sidebar.select(selectedItem);
                              // store this state in local storage the user preference is
                              // remembered next time they see this sidebar
                              abStorage.set(
                                 `${ids.tab}-state`,
                                 $sidebar.getState()
                              );
                           }, 0);
                        } else {
                           // store the selecte menu item just in case someone toggles the menu later
                           selectedItem = id;
                           // if the menu item is a regular menu item
                           // call the onShow with the view id to load the view

                           id = id.replace("_menu", "");
                           let node = $$(id);
                           if (node) {
                              node.show(false, false);
                           } else {
                              // How often does this occure?
                              let msg = `ABViewTabComponent[${this.name}][${this.id}] could not resolve UI panel for provided menu [${selectedItem}].`;
                              this.AB.notify("developer", msg, {});
                           }
                           // $$(id).show(false, false);

                           // onShow(id);
                        }
                     },
                     onSelectChange: () => {
                        addDataCy();
                     },
                     onAfterRender: () => {
                        addDataCy();
                     },
                  },
               };

               const multiview = {
                  view: "multiview",
                  id: ids.tab,
                  keepViews: true,
                  minWidth: settings.minWidth,
                  cells: viewComponents.map((view) => {
                     const tabUi = {
                        id: view.view.id,
                        // ui will be loaded when its tab is opened
                        view: "layout",
                        rows: [],
                     };

                     return tabUi;
                  }),
                  on: {
                     onViewChange: (prevId, nextId) => {
                        this.onShow(nextId);
                     },
                  },
               };

               const addDataCy = function () {
                  const $sidebar = $$(ids.sidebar);

                  // set ids of controller buttons
                  const collapseNode = $sidebar?.$view.querySelector(
                     `[webix_tm_id="${ids.collapseMenu}"]`
                  );

                  if (collapseNode)
                     collapseNode.setAttribute(
                        "data-cy",
                        `tab-collapseMenu-${ids.collapseMenu}`
                     );

                  const expandNode = $sidebar?.$view.querySelector(
                     `[webix_tm_id="${ids.expandMenu}"]`
                  );

                  if (expandNode)
                     expandNode.setAttribute(
                        "data-cy",
                        `tab-expandMenu-${ids.expandMenu}`
                     );

                  baseView.views((view) => {
                     const node = $sidebar?.$view?.querySelector(
                        `[webix_tm_id="${view.id}_menu"]`
                     );

                     if (!node) {
                        return;
                     }

                     node.setAttribute(
                        "data-cy",
                        `tab-${view.name.replace(" ", "")}-${view.id}-${
                           baseView.id
                        }`
                     );
                  });
               };

               let columns = [sidebar, multiview];

               if (settings.sidebarPos === "right") {
                  columns = [multiview, sidebar];
               }

               _ui = {
                  cols: columns,
               };
            } else
               _ui = {
                  view: "spacer",
               };
         } else {
            const cells = baseView
               .views((view) => {
                  const accessLevel = view.getUserAccess();

                  if (accessLevel > 0) {
                     return view;
                  }
               })
               .map((view) => {
                  const tabUi = {
                     id: view.id,
                     // ui will be loaded when its tab is opened
                     view: "layout",
                     rows: [],
                  };

                  let tabTemplate = "";

                  // tab icon
                  if (view.tabicon) {
                     if (settings.iconOnTop)
                        tabTemplate = [
                           "<div class='ab-tabIconContainer'><span class='fa fa-lg fa-fw fa-",
                           view.tabicon,
                           "'></span><br/>",
                           view.label,
                           "</div>",
                        ].join("");
                     else
                        tabTemplate = [
                           "<span class='fa fa-lg fa-fw fa-",
                           view.tabicon,
                           "'></span> ",
                           view.label,
                        ].join("");
                  }

                  // no icon
                  else tabTemplate = view.label;

                  return {
                     header: tabTemplate,
                     body: tabUi,
                  };
               });

            // if there are cells to display then return a tabview
            if (cells.length) {
               _ui = {
                  rows: [
                     {
                        view: "tabview",
                        id: ids.tab,
                        minWidth: settings.minWidth,
                        height: settings.height,
                        tabbar: {
                           height: 60,
                           type: "bottom",
                           css: settings.darkTheme ? "webix_dark" : "",
                           on: {
                              onAfterRender: () => {
                                 baseView.views((view) => {
                                    const node = $$(
                                       ids.tab
                                    )?.$view?.querySelector(
                                       `[button_id="${view.id}"]`
                                    );

                                    if (!node) return;

                                    node.setAttribute(
                                       "data-cy",
                                       `tab ${view.name} ${view.id} ${baseView.id}`
                                    );
                                 });
                              },
                           },
                        },
                        multiview: {
                           on: {
                              onViewChange: (prevId, nextId) => {
                                 this.onShow(nextId);
                              },
                           },
                        },
                        cells: cells,
                     },
                  ],
               };
            }
            // else we return a spacer
            else
               _ui = {
                  view: "spacer",
               };
         }
      } else
         _ui = {
            view: "spacer",
         };

      _ui = super.ui([_ui]);

      delete _ui.type;

      return _ui;
   }

   async init(AB) {
      await super.init(AB);

      const ids = this.ids;
      const $tab = $$(ids.tab);
      const ab = this.AB;
      const abWebix = ab.Webix;

      if ($tab) abWebix.extend($tab, abWebix.ProgressBar);

      const baseView = this.view;
      const viewComponents = this.viewComponents;

      viewComponents.forEach((vc) => {
         // vc.component.init(AB);

         // Trigger 'changePage' event to parent
         this.eventAdd({
            emitter: vc.view,
            eventName: "changePage",
            listener: (...p) => this.changePage(...p),
         });
      });

      // Trigger 'changeTab' event to parent
      this.eventAdd({
         emitter: baseView,
         eventName: "changeTab",
         listener: (...p) => this.changeTab(...p),
      });

      // initialize the sidebar and figure out if it should be collased or not
      const $sidebar = $$(ids.sidebar);

      if (!$sidebar) return;

      const state = await ab.Storage.get(`${ids.tab}-state`);

      if (!state) return;

      // create a menu item for the collapse option to use later
      const collapseMenu = {
         id: ids.collapseMenu,
         value: this.label("Collapse Menu"),
         icon: "chevron-circle-left",
      };

      // create a menu item from the expand option to use later
      const expandMenu = {
         id: ids.expandMenu,
         value: this.label("Expand Menu"),
         icon: "chevron-circle-right",
         hidden: true,
      };

      // this will collapse or expand the sidebar
      $sidebar.setState(state);

      const checkCollapseMenu = $sidebar.getItem(ids.collapseMenu) ?? null;
      const checkExpandMenu = $sidebar.getItem(ids.expandMenu) ?? null;

      // if the state is collapsed we need to make sure the expand option is available
      if (state.collapsed) {
         if (checkCollapseMenu && checkExpandMenu)
            // $sidebar.remove(ids.collapseMenu);
            $sidebar.add(expandMenu);
      } else if (checkCollapseMenu && checkExpandMenu)
         // $sidebar.remove(ids.collapseMenu);
         $sidebar.add(collapseMenu);
   }

   changePage(pageId) {
      const $tab = $$(this.ids.tab);

      $tab?.blockEvent();
      this.view.changePage(pageId);
      $tab?.unblockEvent();
   }

   changeTab(tabViewId) {
      const baseView = this.view;
      const $tabViewId = $$(tabViewId);

      // switch tab view
      this.toggleParent(baseView.parent);

      if (this.settings.stackTabs)
         if (!$tabViewId.isVisible()) {
            const showIt = setInterval(() => {
               if ($tabViewId.isVisible()) clearInterval(showIt);

               $tabViewId.show(false, false);
            }, 200);
         } else $$(this.ids.tab).setValue(tabViewId);
   }

   toggleParent(view) {
      const $viewID = $$(view.id);

      if (view.key === "tab" || view.key === "viewcontainer") {
         $viewID?.show(false, false);
      }
      if (view.parent) {
         this.toggleParent(view.parent);
      }
   }

   onShow(viewId) {
      const ids = this.ids;

      let defaultViewIsSet = false;

      const $sidebar = $$(ids.sidebar);

      // if no viewId is given, then try to get the currently selected ID
      if (!viewId && $sidebar)
         viewId = $sidebar.getSelectedId().replace("_menu", "");

      const baseView = this.view;
      const viewComponents = this.viewComponents;

      viewComponents.forEach((vc) => {
         // set default view id
         const currView = baseView.views((view) => {
            return view.id === vc.view.id;
         });

         let accessLevel = 0;

         if (currView.length) accessLevel = currView[0].getUserAccess();

         // choose the 1st View if we don't have one we are looking for.
         if (!viewId && !defaultViewIsSet && accessLevel > 0) {
            viewId = vc.view.id;

            defaultViewIsSet = true;
         }

         // create view's component once
         const $tab = $$(ids.tab);
         const settings = this.settings;

         if (!vc?.component && vc?.view?.id === viewId) {
            // show loading cursor
            if ($tab?.showProgress) $tab.showProgress({ type: "icon" });

            vc.component = vc.view.component();

            const $viewID = $$(vc.view.id);
            const ab = this.AB;
            const abWebix = ab.Webix;

            if (settings.stackTabs) {
               // update multiview UI
               abWebix.ui(
                  {
                     // able to 'scroll' in tab view
                     id: vc.view.id,
                     view: "scrollview",
                     css: "ab-multiview-scrollview",
                     body: vc.component.ui(),
                  },
                  $viewID
               );
            } else {
               // update tab UI
               abWebix.ui(
                  {
                     // able to 'scroll' in tab view
                     id: vc.view.id,
                     view: "scrollview",
                     css: "ab-tabview-scrollview",
                     body: vc.component.ui(),
                  },
                  $viewID
               );
            }

            // for tabs we need to look at the view's accessLevels
            accessLevel = vc.view.getUserAccess();

            vc.component.init(ab, accessLevel);

            // done
            setTimeout(() => {
               // $$(v.view.id).adjust();

               $tab?.hideProgress?.();
               // check if tab has a hint
               // if (vc?.view?.settings?.hintID) {
               //    // fetch the steps for the hint
               //    let hint = ab.hintID(vc.view.settings.hintID);
               //    hint.createHintUI();
               // }
            }, 10);
         }

         // show UI
         if (vc?.view?.id === viewId && vc?.component?.onShow)
            vc.component.onShow();

         if (settings.stackTabs && vc?.view?.id === viewId) {
            $$(viewId).show(false, false);
            $sidebar.select(`${viewId}_menu`);
         }
      });
   }
};
