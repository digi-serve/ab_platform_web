import ClassUI from "./ClassUI.js";

class PortalWork extends ClassUI {
   constructor() {
      super();
   }

   ui() {
      var menu_data = [
         {
            id: "layouts",
            icon: "fa fa-connectdevelop",
            value: "AppBuilder",
            pages: [],
         },
         {
            id: "dashboard",
            icon: "fa fa-user",
            value: "Administration",
            pages: [
               { label: "App Page 1", icon: "fa fa-cubes" },
               { label: "Another App Page", icon: "fa fa-dollar" },
               { label: "Settings", icon: "fa fa-cog" },
            ],
         },
         {
            id: "tables",
            icon: "fa fa-child",
            value: "CARS",
            pages: [
               { label: "App Page 1", icon: "fa fa-cubes" },
               { label: "Another App Page", icon: "fa fa-dollar" },
               { label: "Settings", icon: "fa fa-cog" },
            ],
         },
         {
            id: "uis",
            icon: "fa fa-map",
            value: "Directions",
            pages: [
               { label: "App Page 1", icon: "fa fa-cubes" },
               { label: "Another App Page", icon: "fa fa-dollar" },
               { label: "Settings", icon: "fa fa-cog" },
            ],
         },
         {
            id: "tools",
            icon: "fa fa-calendar",
            value: "Tools",
            pages: [{ label: "App Page 1", icon: "fa fa-cubes" }],
         },
         {
            id: "forms",
            icon: "fa fa-pencil",
            value: "Forms",
            pages: [{ label: "App Page 1", icon: "fa fa-cubes" }],
         },
         {
            id: "demo",
            icon: "fa fa-book",
            value: "Documentation",
            pages: [
               { label: "App Page 1", icon: "fa fa-cubes" },
               { label: "Another App Page", icon: "fa fa-dollar" },
               { label: "Settings", icon: "fa fa-cog" },
            ],
         },
      ];

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

                     icon: "fa fa-bars",
                     click: function () {
                        if ($$("navSidebar").isVisible()) {
                           $$("navSidebar").hide();
                        } else {
                           $$("navSidebar").show();
                           if ($$("mainSidebar").getSelectedId() == "") {
                              $$("mainSidebar").blockEvent();
                              $$("mainSidebar").select(
                                 $$("mainSidebar").getFirstId()
                              );
                              $$("mainSidebar").unblockEvent();
                           }
                        }
                     },
                  },
                  {
                     view: "label",
                     autowidth: true,
                     id: "menuTitle",
                     label: "AppBuilder",
                     align: "center",
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
                     rows: [
                        {
                           view: "scrollview",
                           scroll: "y",
                           css: "darkScrollview",
                           body: {
                              rows: [
                                 {
                                    view: "sidebar",
                                    id: "mainSidebar",
                                    borderless: true,
                                    css: "webix_dark mainSidebar",
                                    data: menu_data,
                                    on: {
                                       onAfterRender: function () {
                                          var sideBarHeight =
                                             $$("mainSidebar").count() * 45 + 1;
                                          $$("mainSidebar").define(
                                             "height",
                                             sideBarHeight
                                          );
                                          $$("mainSidebar").resize();
                                       },
                                       onAfterSelect: function (id) {
                                          $$("menuTitle").setValue(
                                             this.getItem(id).value
                                          );
                                          $$("menuTitle").resize();
                                          var pages = [];
                                          var firstPage = true;
                                          this.getItem(id).pages.forEach(
                                             (p) => {
                                                var active = "";
                                                if (firstPage) {
                                                   active = "activePage";
                                                   firstPage = false;
                                                }
                                                pages.push({
                                                   view: "button",
                                                   css: active,
                                                   type: "icon",
                                                   label: p.label,
                                                   autowidth: true,
                                                   icon: p.icon,
                                                   click: function (item) {
                                                      $$("appPages")
                                                         .queryView(
                                                            {
                                                               css:
                                                                  "activePage",
                                                            },
                                                            "all"
                                                         )
                                                         .forEach((p) => {
                                                            p.define("css", "");
                                                            p.$view.classList.remove(
                                                               "activePage"
                                                            );
                                                         });
                                                      $$(item).define(
                                                         "css",
                                                         "activePage"
                                                      );
                                                      $$(
                                                         item
                                                      ).$view.classList.add(
                                                         "activePage"
                                                      );
                                                   },
                                                });
                                             }
                                          );
                                          webix.ui(pages, $$("appPages"));
                                          $$("navSidebar").hide();
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
                  { template: "Page content would go here." }, // this is where content goes
               ],
            },
         ],
      };
   }

   init(AB) {
      this.AB = AB;

      // build initial Layout structure using application information.
      /*
      var menu_data = [
   {id: "layouts", icon: "fa fa-connectdevelop", value:"AppBuilder", pages: []},
   {id: "dashboard", icon: "fa fa-user", value: "Administration", pages: [{label: "App Page 1", icon: "fa fa-cubes"},{label: "Another App Page",icon: "fa fa-dollar"},{label: "Settings", icon: "fa fa-cog"}] },
   {id: "tables", icon: "fa fa-child", value:"CARS", pages: [{label: "App Page 1", icon: "fa fa-cubes"},{label: "Another App Page",icon: "fa fa-dollar"},{label: "Settings", icon: "fa fa-cog"}]},
   {id: "uis", icon: "fa fa-map", value:"Directions", pages: [{label: "App Page 1", icon: "fa fa-cubes"},{label: "Another App Page",icon: "fa fa-dollar"},{label: "Settings", icon: "fa fa-cog"}]},
   {id: "tools", icon: "fa fa-calendar", value:"Tools", pages: [{label: "App Page 1", icon: "fa fa-cubes"}]},
   {id: "forms", icon: "fa fa-pencil", value:"Forms", pages: [{label: "App Page 1", icon: "fa fa-cubes"}]},
   {id: "demo", icon: "fa fa-book", value:"Documentation", pages: [{label: "App Page 1", icon: "fa fa-cubes"},{label: "Another App Page",icon: "fa fa-dollar"},{label: "Settings", icon: "fa fa-cog"}]}
];
*/
      // figure out which Application+Page to load 1st
      // after loaded, .show() + emit("ready")
      // then load remaining pages in background.

      this.emit("ready");

      return Promise.resolve();
   }

   show() {
      $$("portal_work").show();
   }
}

export default new PortalWork();
