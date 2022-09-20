const ABViewComponent = require("./ABViewComponent").default;

const L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewTabComponent extends ABViewComponent {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewTab_${baseView.id}`;

      super(baseView, idBase, {
         sidebar: "",
         expandMenu: "",
         collapseMenu: "",

         popupTabManager: "",
         popupTabManagerForm: "",
         popupTabManagerSaveButton: "",
      });

      this.view = baseView;

      this.AB = this.view.AB;

      // get a UI component for each of our child views
      this.view._viewComponents = [];

      const viewComponents = baseView.views();

      for (let i = 0; i < viewComponents.length; i++) {
         const accessLevel = viewComponents[i].getUserAccess();

         if (accessLevel > 0) {
            this.view._viewComponents.push({
               view: viewComponents[i],
               // component: viewComponents[i].component(App)
            });
         }
      }
   }

   ui() {
      const self = this;
      const ids = this.ids;
      const baseView = this.view;

      let _ui = null;

      // We are going to make a custom icon using the first letter of a menu item for menu items that don't have an icon
      // to do this we need to modify the default template with the method webix recommended form this snippet https://snippet.webix.com/b566d9f8
      webix.type(webix.ui.tree, {
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

      if (baseView._viewComponents.length > 0) {
         if (baseView.settings.stackTabs) {
            // define your menu items from the view components
            const menuItems = baseView
               .views((view) => {
                  const accessLevel = view.getUserAccess();

                  if (accessLevel > 0) {
                     return view;
                  }
               })
               .map((view) => {
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
                  value: L("Collapse Menu"),
                  icon: "chevron-circle-left",
               };

               // create a menu item from the expand option to use later
               const expandMenu = {
                  id: ids.expandMenu,
                  value: L("Expand Menu"),
                  icon: "chevron-circle-right",
                  hidden: true,
               };

               // find out what the first option is so we can set it later
               let selectedItem = `${baseView._viewComponents[0].view.id}_menu`;

               const sidebar = {
                  view: "sidebar",
                  type: "customIcons", // define the sidebar type with the new template created above
                  id: ids.sidebar,
                  width: baseView.settings.sidebarWidth
                     ? baseView.settings.sidebarWidth
                     : 0,
                  scroll: true,
                  position: baseView.settings.sidebarPos
                     ? baseView.settings.sidebarPos
                     : "left",
                  css: baseView.settings.darkTheme ? "webix_dark" : "",
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
                              this.AB.Storage.set(
                                 `${ids.component}-state`,
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
                              self.AB.Storage.set(
                                 `${ids.component}-state`,
                                 $sidebar.getState()
                              );
                           }, 0);
                        } else {
                           // store the selecte menu item just in case someone toggles the menu later
                           selectedItem = id;
                           // if the menu item is a regular menu item
                           // call the onShow with the view id to load the view
                           id = id.replace("_menu", "");
                           $$(id).show(false, false);
                           // onShow(id);
                        }
                     },
                     onAfterRender: () => {
                        const $sidebar = $$(ids.sidebar);

                        // set ids of controller buttons
                        const collapseNode = $sidebar.$view.querySelector(
                           `[webix_tm_id="${ids.collapseMenu}"]`
                        );

                        if (collapseNode) {
                           collapseNode.setAttribute(
                              "data-cy",
                              `tab-collapseMenu-${ids.collapseMenu}`
                           );
                        }

                        const expandNode = $sidebar.$view.querySelector(
                           `[webix_tm_id="${ids.expandMenu}"]`
                        );

                        if (expandNode) {
                           expandNode.setAttribute(
                              "data-cy",
                              `tab-expandMenu-${ids.expandMenu}`
                           );
                        }

                        baseView.views((view) => {
                           const node = $sidebar.$view.querySelector(
                              `[webix_tm_id="${view.id}_menu"]`
                           );

                           if (!node) return;

                           node.setAttribute(
                              "data-cy",
                              `tab-${view.label.replace(" ", "")}-${view.id}-${
                                 baseView.id
                              }`
                           );
                        });
                     },
                  },
               };

               const multiview = {
                  view: "multiview",
                  id: ids.component,
                  keepViews: true,
                  minWidth: baseView.settings.minWidth,
                  cells: baseView._viewComponents.map((view) => {
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

               let columns = [sidebar, multiview];

               if (baseView.settings.sidebarPos === "right") {
                  columns = [multiview, sidebar];
               }

               _ui = {
                  cols: columns,
               };
            } else {
               _ui = {
                  view: "spacer",
               };
            }
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
                     if (baseView.settings.iconOnTop) {
                        tabTemplate = [
                           "<div class='ab-tabIconContainer'><span class='fa fa-lg fa-fw fa-",
                           view.tabicon,
                           "'></span><br/>",
                           view.label,
                           "</div>",
                        ].join("");
                     } else {
                        tabTemplate = [
                           "<span class='fa fa-lg fa-fw fa-",
                           view.tabicon,
                           "'></span> ",
                           view.label,
                        ].join("");
                     }
                  }

                  // no icon
                  else {
                     tabTemplate = view.label;
                  }

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
                        id: ids.component,
                        minWidth: baseView.settings.minWidth,
                        tabbar: {
                           height: 60,
                           type: "bottom",
                           css: baseView.settings.darkTheme ? "webix_dark" : "",
                           on: {
                              onAfterRender: () => {
                                 baseView.views((view) => {
                                    const node = $$(
                                       ids.component
                                    ).$view.querySelector(
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
            } else {
               // else we return a spacer
               _ui = {
                  view: "spacer",
               };
            }
         }
      } else {
         _ui = {
            view: "spacer",
         };
      }

      return _ui;
   }

   async init(AB) {
      this.AB = AB;

      const ids = this.ids;

      const $component = $$(ids.component);

      if ($component) webix.extend($component, webix.ProgressBar);

      const baseView = this.view;

      for (let i = 0; i < baseView._viewComponents.length; i++) {
         // view._viewComponents[i].component.init(options);

         // Trigger 'changePage' event to parent
         baseView.eventAdd({
            emitter: baseView._viewComponents[i].view,
            eventName: "changePage",
            listener: this.changePage.bind(this),
         });
      }

      // Trigger 'changeTab' event to parent
      baseView.eventAdd({
         emitter: baseView,
         eventName: "changeTab",
         listener: this.changeTab,
      });

      // initialize the sidebar and figure out if it should be collased or not
      const $sidebar = $$(ids.sidebar);

      if (!$sidebar) return;

      const state = this.AB.Storage.get(`${ids.component}-state`);

      if (!state) return;

      // create a menu item for the collapse option to use later
      const collapseMenu = {
         id: ids.collapseMenu,
         value: L("Collapse Menu"),
         icon: "chevron-circle-left",
      };

      // create a menu item from the expand option to use later
      const expandMenu = {
         id: ids.expandMenu,
         value: L("Expand Menu"),
         icon: "chevron-circle-right",
         hidden: true,
      };

      // this will collapse or expand the sidebar
      $sidebar.setState(state);

      const checkCollapseMenu = $sidebar.getItem(ids.collapseMenu) ?? null;
      const checkExpandMenu = $sidebar.getItem(ids.expandMenu) ?? null;

      // if the state is collapsed we need to make sure the expand option is available
      if (state.collapsed) {
         if (checkCollapseMenu && checkExpandMenu) {
            // $sidebar.remove(ids.collapseMenu);
            $sidebar.add(expandMenu);
         }
      } else {
         if (checkCollapseMenu && checkExpandMenu) {
            // $sidebar.remove(ids.collapseMenu);
            $sidebar.add(collapseMenu);
         }
      }
   }

   changePage(pageId) {
      const ids = this.ids;

      const $component = $$(ids.component);

      $component.blockEvent();
      this.view.changePage(pageId);
      $component.unblockEvent();
   }

   changeTab(tabViewId) {
      const ids = this.ids;
      const baseView = this.view;

      const $tabViewId = $$(tabViewId);

      // switch tab view
      this.toggleParent(baseView.parent);

      if (baseView.settings.stackTabs)
         if (!$tabViewId.isVisible()) {
            const showIt = setInterval(() => {
               if ($tabViewId.isVisible()) clearInterval(showIt);

               $tabViewId.show(false, false);
            }, 200);
         } else $$(ids.component).setValue(tabViewId);
   }

   toggleParent(view) {
      const $viewID = $$(view.id);
      if (
         (view.key === "tab" || view.key === "viewcontainer") &&
         $viewID?.show
      ) {
         $viewID.show(false, false);
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

      for (let i = 0; i < baseView._viewComponents.length; i++) {
         // set default view id
         const currView = baseView.views((view) => {
            return view.id === baseView._viewComponents[i].view.id;
         });

         let accessLevel = 0;

         if (currView.length) accessLevel = currView[0].getUserAccess();

         // choose the 1st View if we don't have one we are looking for.
         if (!viewId && !defaultViewIsSet && accessLevel > 0) {
            viewId = baseView._viewComponents[i].view.id;
            defaultViewIsSet = true;
         }

         // create view's component once
         const $component = $$(ids.component);

         if (
            !baseView._viewComponents[i]?.component &&
            baseView._viewComponents[i]?.view?.id === viewId
         ) {
            // show loading cursor
            if ($component?.showProgress)
               $component.showProgress({ type: "icon" });

            baseView._viewComponents[i].component = baseView._viewComponents[
               i
            ].view.component();

            const $viewID = $$(baseView._viewComponents[i].view.id);

            if (baseView.settings.stackTabs) {
               // update multiview UI
               webix.ui(
                  {
                     // able to 'scroll' in tab view
                     id: baseView._viewComponents[i].view.id,
                     view: "scrollview",
                     css: "ab-multiview-scrollview",
                     body: baseView._viewComponents[i].component.ui(),
                  },
                  $viewID
               );
            } else {
               // update tab UI
               webix.ui(
                  {
                     // able to 'scroll' in tab view
                     id: baseView._viewComponents[i].view.id,
                     view: "scrollview",
                     css: "ab-tabview-scrollview",
                     body: baseView._viewComponents[i].component.ui(),
                  },
                  $viewID
               );
            }

            // for tabs we need to look at the view's accessLevels
            accessLevel = baseView._viewComponents[i].view.getUserAccess();
            baseView._viewComponents[i].component.init(this.AB, accessLevel);

            // done
            setTimeout(() => {
               // $$(v.view.id).adjust();

               if ($component?.hideProgress) $component.hideProgress();
            }, 10);
         }

         // show UI
         if (
            baseView._viewComponents[i]?.view?.id === viewId &&
            baseView._viewComponents[i]?.component?.onShow
         )
            baseView._viewComponents[i].component.onShow();

         if (
            baseView.settings.stackTabs &&
            baseView._viewComponents[i]?.view?.id === viewId
         ) {
            $$(viewId).show(false, false);
            $sidebar.select(`${viewId}_menu`);
         }
      }
   }
};
