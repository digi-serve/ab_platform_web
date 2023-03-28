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

      this.appAccordionLists = {};
      // {hash}  { app.id : {accordionItemDefinition} }
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
                  on: {
                     onAfterRender() {
                        ClassUI.CYPRESS_REF(this);
                     },
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
                        label: "<div style='display: block; font-size: 180px; background-color: #666; color: transparent; text-shadow: 0px 1px 1px rgba(255,255,255,0.5); -webkit-background-clip: text; -moz-background-clip: text; background-clip: text;' class='fa fa-thumbs-up'></div>",
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

      this.allAppAccordions = {};
      // {hash}  { ABApplication.id : ClassAccordionEntry }
      // A lookup of all our ClassAccordionEntry(s) by their app.id

      //
      // Prepare our Hashes:
      //
      this.lang = this.AB.Account.language();
      (this.AB.Config.inboxMetaConfig() || []).forEach((app) => {
         this.createAccordian(app);
      });

      this.entries = this.AB.Config.inboxConfig() || [];

      this.entries.forEach((i) => this.addItem(i));

      var allInits = [];

      for (var index in this.appAccordionLists) {
         const processes = this.getProcessList(index);

         const accordion = this.allAppAccordions[index]
            ? this.allAppAccordions[index].unitList()
            : null;
         if (accordion) {
            const init = async () => {
               await this.allAppAccordions[index].init(this.AB);
               accordion.parse(processes);
               accordion.show();
            };
            allInits.push(init());
         } else {
            this.AB.notify.developer(
               new Error(
                  `could not find an inbox-accordion for index[${index}]`
               ),
               {
                  context: "portal_work_inbox:init(): config error",
                  inboxMeta: this.AB.Config.inboxMetaConfig(),
                  inbox: this.entries,
               }
            );
         }
      }

      return Promise.all(allInits).then(() => {
         this.emit("updated");

         this.AB.on("ab.inbox.create", async (item) => {
            const alreadyThere = this.entries.find((e) => e.uuid == item.uuid);
            if (!alreadyThere) {
               this.entries.push(item);
               // If we can't find the app's accordion in the list then add it
               const createNew = !this.appLookupHash[item.definition];
               if (createNew) {
                  const [app] = await this.AB.Network.post({
                     url: "/process/inbox/meta",
                     data: { ids: [item.definition] },
                  });
                  this.createAccordian(app);
               }
               const appId = this.appLookupHash[item.definition];
               const accordion = this.allAppAccordions[appId];
               this.addItem(item);

               if (createNew) await accordion.init(this.AB);

               const unitList = accordion.unitList();
               unitList.parse(this.appAccordionLists[appId][item.definition]);
               unitList.show();
               unitList.refresh();

               accordion.show();
            }
            this.emit("updated");
         });

         this.AB.on("ab.inbox.update", (item) => {
            const appId = this.appLookupHash[item.definition];
            const accordion = this.allAppAccordions[appId];

            accordion.AB.Network.emit("inbox.update", {
               uuid: item.uuid,
               unitID: item.definition,
            });
         });

         // Now Register for RT Updates to our Inbox
         this.AB.Network.post(
            {
               url: `/process/inbox/register`,
            },
            {
               key: "inbox.register",
               context: {},
            }
         );
      });
   }

   createAccordian(app) {
      // convert config info with current language labels
      this.translate(app, this.lang);

      const appAccordion = new ClassAccordionEntry(app);
      $$("inbox_accordion").addView(appAccordion.ui());
      this.allAppAccordions[app.id] = appAccordion;
      appAccordion.on("showTasks", (...params) => {
         // showTasks
         // indicates when the user has selected a group of Accordian Tasks
         // to process.
         PortalWorkInboxTaskWindow.showTasks(...params);
      });

      appAccordion.on("item.processed", (uuid) => {
         // item.processed
         // indicates when the specified form has been updated on the server.
         PortalWorkInboxTaskWindow.clearTask(uuid);
         this.entries = this.entries.filter((e) => e.uuid != uuid);
         if (this.entries.length == 0) {
            $$("emptyInbox").show();
         }
         this.emit("updated");
      });

      (app.processes || []).forEach((p) => {
         this.translate(p, this.lang);
         this.processLookupHash[p.id] = p.label;
         this.appLookupHash[p.id] = app.id;
      });

      return appAccordion;
   }

   getProcessList(index) {
      const processes = [];
      for (const process in this.appAccordionLists[index]) {
         processes.push(this.appAccordionLists[index][process]);
      }
      return processes;
   }

   addItem(item) {
      // item {obj}  inbox configuration item
      //    .definition {uuid} the process.id that generated this form
      //    .name {string} the Name of this form
      //
      item.uniteLabel =
         "{" + item.definition + "}" + this.processLookupHash[item.definition];
      // create our own .uniteLabel
      // this is used within the accordion.unitlist to group the data.

      // find the application.id for this form
      var appId = this.appLookupHash[item.definition];

      // make sure we have an appAccordionLists[appID] entry
      if (!this.appAccordionLists[appId]) this.appAccordionLists[appId] = {};
      if (!this.appAccordionLists[appId][item.definition]) {
         this.appAccordionLists[appId][item.definition] = {
            id: item.definition,
            name: item.name,
            uniteLabel: item.uniteLabel,
            items: [],
         };
      }

      // add this as one of our items
      this.appAccordionLists[appId][item.definition].items.push(item);
   }

   show() {
      if (this.entries.length == 0) {
         $$("emptyInbox").show();
      } else {
         $$("inboxItems").show();
      }
      $$(this.id).show();
   }

   /**
    * @method translate()
    * given an object with a .translations property, we will fill out
    * the translations for the given language.
    * @param {obj} obj
    * @param {string} lang
    *        the language_code of the translations to use.
    */
   translate(obj, lang) {
      if (obj.translations) {
         var entry = obj.translations.find((t) => t.language_code == lang);
         if (!entry) {
            entry = obj.translations[0];
         }
         if (entry) {
            Object.keys(entry).forEach((k) => {
               if (k != "language_code") {
                  obj[k] = entry[k];
               }
            });
         }
      }
   }

   count() {
      return this.entries.length;
   }
}

export default new PortalWorkInbox();
