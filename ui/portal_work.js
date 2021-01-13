import ClassUI from "./ClassUI.js";
import ClassUIPage from "./ClassUIPage.js";

class PortalWork extends ClassUI {
   constructor() {
      super();
   }

   ui() {
      return {
         id: "portal_work",
         rows: [
            {
               view: "toolbar",
               id: "mainToolbar",
               borderless: true,
               css: "webix_dark mainToolbar",
               padding: 10,
               cols: [
                  {
                     view: "icon",
                     width: 50,
                     icon: "fa fa-bars",
                     click: () => {
                        let navSideBar = $$("navSidebar");
                        if (navSideBar.isVisible()) {
                           navSideBar.hide();
                        } else {
                           navSideBar.show();
                           let sidebarMenu = $$("abSidebarMenu");
                           if (sidebarMenu.getSelectedId() == "") {
                              sidebarMenu.blockEvent();
                              var firstID = sidebarMenu.getFirstId();
                              sidebarMenu.select(firstID);
                              sidebarMenu.unblockEvent();
                           }
                        }
                     },
                  },
                  {
                     view: "label",
                     autowidth: true,
                     id: "menuTitle",
                     label: "AppBuilder",
                     align: "left",
                  },
                  {},
                  {
                     id: "appPages",
                     css: "appPages",
                     cols: [],
                  },
                  {},
                  {
                     view: "icon",
                     icon: "fa fa-envelope",
                     width: 50,
                     badge: 12,
                  },
                  {
                     view: "menu",
                     width: 50,
                     css: "userMenu",
                     data: [
                        {
                           value: "",
                           icon: "fa fa-user-circle",
                           submenu: [
                              { value: "User Profile" },
                              { value: "Switcheroo" },
                              { $template: "Separator" },
                              { value: "Logout" },
                           ],
                        },
                     ],
                  },
               ],
            },
            {
               cols: [
                  {
                     id: "navSidebar",
                     hidden: true,
                     autoheight: true,
                     rows: [
                        {
                           id: "abNavSidebarScrollView",
                           view: "scrollview",
                           scroll: "y",
                           css: "darkScrollview",
                           body: {
                              rows: [
                                 {
                                    view: "sidebar",
                                    id: "abSidebarMenu",
                                    borderless: true,
                                    css: "webix_dark mainSidebar",
                                    data: [],
                                    on: {
                                       onAfterRender: () => {
                                          // this.sidebarResize();
                                       },
                                       onAfterSelect: (id) => {
                                          this.selectApplication(id);
                                       },
                                       onItemClick: (id) => {
                                          this.selectApplication(id);
                                       },
                                    },
                                 },
                              ],
                           },
                        },
                        {
                           view: "template",
                           borderless: true,
                           css: "appDevDesigns",
                           height: 110,
                        },
                     ],
                  },
                  {
                     id: "abWorkPages",
                     template: "Page content would go here.",
                  }, // this is where content goes
               ],
            },
         ],
      };
   }

   init(AB) {
      this.AB = AB;

      this.storageKey = "portal_work_state";

      this.pageContainers = {};
      // {hash}  { ABViewPage.id : ClassUIPage() }
      // track each of the page containers (instances of ClassUIPage) that
      // are responsible for displaying the proper state of each of our
      // Root Pages.

      // Build out our Navigation Side Bar Menu with our available
      // ABApplications
      let menu_data = [];
      (this.AB.applications() || []).forEach((app) => {
         // TODO: implement Sorting on these before building UI
         menu_data.push(this.uiSideBarMenuEntry(app));
      });

      $$("abSidebarMenu").define("data", menu_data);
      this.sidebarResize();

      // Now Fill out Toolbar and Root Pages:
      return Promise.resolve()
         .then(() => {
            return this.AB.Storage.get(this.storageKey);
         })
         .then((AppState) => {
            //
            // Step 1: prepare the AppState so we can determine which options
            // should be pre selected.
            //

            if (!AppState) {
               AppState = {
                  lastSelectedApp: null,
                  // {string}  the ABApplication.id of the last App selected

                  lastPages: {},
                  // {hash}  { ABApplication.id : ABPage.id }
                  // a lookup of all the last selected Pages for each Application
               };
            }
            this.AppState = AppState;

            // set default selected App if not already set
            // just choose the 1st App in the list
            if (!this.AppState.lastSelectedApp && menu_data.length) {
               this.AppState.lastSelectedApp = menu_data[0].abApplication.id;
            }

            //
            // Step 2: figure out the Default Page to be displayed.
            //
            var DefaultPage = null;
            // {ABViewPage}
            // The ABViewPage of the 1st page to display.

            // sidebar and NavBar are already built at this point. So we can
            // query them.
            var sideBar = $$("abSidebarMenu");
            if (sideBar) {
               // search the Menu entries to see which one matches our
               // stored AppState
               var foundMenuEntry = null;
               var id = sideBar.getFirstId();
               while (!foundMenuEntry && id) {
                  let entry = sideBar.getItem(id);
                  if (entry.abApplication.id == this.AppState.lastSelectedApp) {
                     foundMenuEntry = entry;
                  }
                  id = sideBar.getNextId(id);
               }

               if (foundMenuEntry) {
                  sideBar.select(foundMenuEntry.id);
                  this.selectApplication(foundMenuEntry.id);

                  var defaultPageID = this.AppState.lastPages[
                     foundMenuEntry.abApplication.id
                  ];
                  DefaultPage = foundMenuEntry.abApplication.pages(
                     (p) => p.id === defaultPageID
                  )[0];
                  if (!DefaultPage) {
                     // then just pick the first one:
                     DefaultPage = foundMenuEntry.abApplication.pages()[0];
                  }
               }
            }

            //
            // Step 3: Prime the content area with placeholders for ALL
            // Root Pages
            //

            var allPlaceholders = [];
            // var buildPage = (page) => {
            //    allPlaceholders.push({
            //       id: this.pageID(page),
            //       template: `Page: ${page.label || page.name}`,
            //    });

            //    (page.pages() || []).forEach((p) => {
            //       buildPage(p);
            //    });
            // };

            (this.AB.applications() || []).forEach((app) => {
               (app.pages() || []).forEach((page) => {
                  // buildPage(page);
                  allPlaceholders.push({
                     id: this.pageID(page),
                     template: `Page: ${page.label || page.name}`,
                  });
               });
            });
            webix.ui(
               { view: "multiview", keepViews: true, cells: allPlaceholders },
               $$("abWorkPages")
            );

            //
            // Step 4: initialize the DefaultPage
            // when it is finished we can show that page and emit "ready" to
            // signal we can transition to the Work Portal
            //
            if (!this.App) {
               // page.component() require a common {ABComponent.App}
               this.App = new this.AB.Class.ABComponent(
                  null,
                  "portal_work",
                  this.AB
               ).App;
            }
            var container = new ClassUIPage(
               this.pageID(DefaultPage),
               DefaultPage,
               this.App,
               this.AB
            );
            this.pageContainers[DefaultPage.id] = container;

            container.init(this.AB, true).then(() => {
               this.showPage(DefaultPage);
            });

            // let pUI = DefaultPage.component(this.App);

            // webix.ui(pUI.ui, $$(this.pageID(DefaultPage)));
            // pUI.init();
            // pUI.onShow();
            // this.showPage(DefaultPage);

            //
            // Step 5: initialize the remaining Pages
            //

            (this.AB.applications() || []).forEach((app) => {
               (app.pages() || []).forEach((page) => {
                  if (page.id != DefaultPage.id) {
                     var cont = new ClassUIPage(
                        this.pageID(page),
                        page,
                        this.App,
                        this.AB
                     );
                     this.pageContainers[page.id] = cont;

                     cont.init(this.AB);

                     // let comp = page.component(commonComp.App);
                     // webix.ui(comp.ui, $$(this.pageID(page)));
                     // comp.init();
                     // comp.onShow();
                  }
               });
            });
         })
         .then(() => {
            this.emit("ready");

            // !!! HACK: Leave this for James to figure out why Menu Title isn't proper
            // size on initial loading.
            setTimeout(() => {
               $$("menuTitle").resize();
            }, 200);
         });
   }

   /**
    * pageID()
    * return a commone webix.id for a given ABViewPage
    * @param {ABViewPage || string} page
    *       An instance of ABViewPage, OR a string of the ABViewPage.id
    * @return {string}
    */
   pageID(page) {
      return `page_${page.id || page}`;
   }

   /**
    * generate the Webix definition for a menu entry given the ABApplication
    * the menu entry should represent.
    * @param {ABApplication} app
    * @return {obj} Webix.ui definition.
    */
   uiSideBarMenuEntry(app) {
      return {
         id: app.id,
         icon: `fa ${app.icon}`,
         value: app.label || app.name,
         abApplication: app,
      };
   }

   selectApplication(id) {
      var row = $$("abSidebarMenu").getItem(id);

      var pageButtons = [];
      // {array}
      // the webix menu buttons for each Page

      var firstPage = true;
      // {bool} firstPage
      // should we choose the 1st page as being the active page?

      var activePageID = null;
      // {string}
      // The ABViewPage.id of the active Page for the current Application.

      // remember the current Application has been selected
      this.AppState.lastSelectedApp = row.abApplication.id;
      this.saveState();

      // if the current Application already has an Active State Page marked
      // we don't want the first page:
      activePageID = this.AppState.lastPages[row.abApplication.id];
      if (activePageID) {
         firstPage = false;
      }

      // Build a Menu Button for each of the ABApplication Root Pages
      (row.abApplication.pages() || []).forEach((p) => {
         // Decide if current Page button should look selected.
         var active = "";
         if (firstPage || p.id == activePageID) {
            active = "activePage";
            firstPage = false;

            // remember this one
            this.AppState.lastPages[row.abApplication.id] = p.id;
         }

         pageButtons.push({
            view: "button",
            css: active,
            type: "icon",
            label: p.label,
            autowidth: true,
            icon: `fa fa-${p.icon}`,
            abPage: p,
            click: (item) => {
               // when button is clicked, update the selected look
               var pageButton = $$(item);

               // Remove any other "activePage" entries
               $$("appPages")
                  .queryView(
                     {
                        css: "activePage",
                     },
                     "all"
                  )
                  .forEach((p) => {
                     if (p != pageButton) {
                        p.define("css", "");
                        p.$view.classList.remove("activePage");
                     }
                  });

               // make sure this one is marked
               pageButton.define("css", "activePage");
               pageButton.$view.classList.add("activePage");

               // now trigger the page to display:
               this.showPage(pageButton.data.abPage);
            },
         });
      });
      webix.ui(pageButtons, $$("appPages"));

      $$("menuTitle").setValue(row.value);
      $$("menuTitle").resize();
   }

   /**
    * saveState()
    * trigger a save of our current AppState.
    * NOTE: we delay this so we can catch multiple saves in a short period
    * of time.
    */
   saveState() {
      if (this._saveTimeoutID) {
         clearTimeout(this._saveTimeoutID);
      }
      this._saveTimeoutID = setTimeout(() => {
         this.AB.Storage.set(this.storageKey, this.AppState);
      }, 500);
   }

   show() {
      $$("portal_work").show();
   }

   showPage(page) {
      var pageUI = this.pageContainers[page.id];
      if (pageUI) {
         pageUI.show();
         this.AppState.lastPages[page.application.id] = page.id;
         this.saveState();
      }
   }

   sidebarResize() {
      let sidebarMenu = $$("abSidebarMenu");
      var sideBarHeight = sidebarMenu.count() * 45 + 1;
      sidebarMenu.define("height", sideBarHeight);
      sidebarMenu.resize();
      // $$("abNavSidebarScrollView").resize(true);
   }
}

export default new PortalWork();
