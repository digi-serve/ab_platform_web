import ClassUI from "./ClassUI.js";
import ClassAccordionEntry from "./portal_work_inbox_accordion.js";
import PortalWorkInboxTaskWindow from "./portal_work_inbox_taskWindow.js";

class PortalWorkInbox extends ClassUI {
   constructor() {
      super();

      this.id = "portal_work_inbox";
      // {string}
      // the webix.id of this UI element

      this.entries = [];
      // {array}
      // the list of User Forms this user is able to process.

      this.processLookupHash = {
         /* ABProcess.id : "Process Label" */
      };

      this.appLookupHash = {
         /* ABProcess.id : "ABApplication.id" */
      };
   }

   ui() {
      var L = (...params) => {
         return this.label(...params);
      };

      return {
         id: this.id,
         view: "window",
         head: {
            view: "toolbar",
            css: "webix_dark inbox_drawer",
            cols: [
               { width: 7 },
               {
                  view: "label",
                  label: L("Inbox"),
               },
               {
                  view: "button",
                  autowidth: true,
                  type: "icon",
                  icon: "nomargin fa fa-times",
                  click: () => {
                     $$(this.id).hide();
                  },
               },
            ],
         },
         position: function (state) {
            state.left = state.maxWidth - 350; // fixed values
            state.top = 0;
            state.width = 350; // relative values
            state.height = state.maxHeight;
         },
         body: {
            cells: [
               {
                  id: "inboxItems",
                  view: "scrollview",
                  scroll: "y",
                  body: {
                     view: "accordion",
                     id: "inbox_accordion",
                     css: {
                        background: "#dadee0 !important",
                     },
                     multi: true,
                     rows: [],
                  },
               },
               {
                  id: "emptyInbox",
                  view: "layout",
                  hidden: true,
                  css: {
                     background: "#dadee0 !important",
                  },
                  rows: [
                     {},
                     {
                        view: "label",
                        align: "center",
                        height: 200,
                        label:
                           "<div style='display: block; font-size: 180px; background-color: #666; color: transparent; text-shadow: 0px 1px 1px rgba(255,255,255,0.5); -webkit-background-clip: text; -moz-background-clip: text; background-clip: text;' class='fa fa-thumbs-up'></div>",
                     },
                     {
                        view: "label",
                        align: "center",
                        label: L("No tasks...you're all caught up."),
                     },
                     {},
                  ],
               },
            ],
         },
      };
   }

   init(AB) {
      this.AB = AB;

      webix.ui(this.ui());

      var allAppAccordions = {};
      // {hash}  { ABApplication.id : ClassAccordionEntry }
      // A lookup of all our ClassAccordionEntry(s) by their app.id

      //
      // Prepare our Hashes:
      //
      this.AB.applications().forEach((app) => {
         var appAccordion = new ClassAccordionEntry(app);
         $$("inbox_accordion").addView(appAccordion.ui());
         allAppAccordions[app.id] = appAccordion;
         appAccordion.on("showTasks", (selectedItem, cells) => {
            // showTasks
            // indicates when the user has selected a group of Accordian Tasks
            // to process.
            PortalWorkInboxTaskWindow.showTasks(selectedItem, cells);
         });

         appAccordion.on("item.processed", (uuid) => {
            // item.processed
            // indicates when the specified form has been updated on the server.
            PortalWorkInboxTaskWindow.clearTask(uuid);
            debugger;
            this.entries = this.entries.filter((e) => e.uuid != uuid);
            this.emit("updated");
         });

         app.processes().forEach((p) => {
            this.processLookupHash[p.id] = p.label;
            this.appLookupHash[p.id] = app.id;
         });

         // TODO: what if there are processes that are sending us forms due to
         // a ROLE assignment, but we don't have access to the Application it
         // is part of?  Do we then make a special role {p.id : role.id }?
      });

      var appAccordionLists = {};
      // {hash}  { app.id : {accordionItemDefinition} }

      this.entries = this.AB.Config.inboxConfig() || [];

      this.entries.forEach((item) => {
         // item {obj}  inbox configuration item
         //    .definition {uuid} the process.id that generated this form
         //    .name {string} the Name of this form
         //

         item.uniteLabel =
            "{" +
            item.definition +
            "}" +
            this.processLookupHash[item.definition];
         // create our own .uniteLabel
         // this is used within the accordion.unitlist to group the data.

         // find the application.id for this form
         var appId = this.appLookupHash[item.definition];

         // make sure we have an appAccordionLists[appID] entry
         if (!appAccordionLists[appId]) appAccordionLists[appId] = {};
         if (!appAccordionLists[appId][item.definition]) {
            appAccordionLists[appId][item.definition] = {
               id: item.definition,
               name: item.name,
               uniteLabel: item.uniteLabel,
               items: [],
            };
         }

         // add this as one of our items
         appAccordionLists[appId][item.definition].items.push(item);
      });

      for (var index in appAccordionLists) {
         var processes = [];
         for (var process in appAccordionLists[index]) {
            processes.push(appAccordionLists[index][process]);
         }

         var accordion = allAppAccordions[index].unitList();
         if (accordion) {
            accordion.parse(processes);
            accordion.show();
         } else {
            console.error(
               "could not find an inbox-accordion for index[" + index + "]"
            );
         }
      }

      this.emit("updated");
      return Promise.resolve();
   }

   show() {
      if (this.entries.length == 0) {
         $$("emptyInbox").show();
      } else {
         $$("inboxItems").show();
      }
      $$(this.id).show();
   }

   count() {
      return this.entries.length;
   }
}

export default new PortalWorkInbox();
