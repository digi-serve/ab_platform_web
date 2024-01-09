import ClassUI from "./ClassUI.js";

class PortalWorkInboxAccordion extends ClassUI {
   constructor(app) {
      super();

      this.app = app;
      this.id = `inbox-accordion-app-holder-${this.app.id}`;
      this.idUnitList = `inbox-accordion-app-${this.app.id}`;
   }

   ui() {
      const self = this;
      // for .click() handler below:

      return {
         header: this.app.label,
         id: this.id,
         view: "accordionitem",
         collapsed: true,
         css: "stayCollapsed",
         hidden: true,
         body: {
            view: "unitlist",
            id: this.idUnitList,
            uniteBy: "#uniteLabel#",
            autoheight: true,
            css: "inbox_unitlist",
            type: {
               templateHeader: function (value) {
                  return (
                     '<i style="opacity: 0.4" class="fa fa-fw fa-code-fork fa-rotate-90"></i> ' +
                     value.replace(/{(.*?)}/, "")
                  );
               },
               headerHeight: 35,
            },
            template: function (obj) {
               return (
                  obj.name +
                  " <span class='pull-right webix_badge'>" +
                  obj.items.length +
                  "</span>"
               );
            },
            select: true,
            data: [],
            click: function (id /* , ev */) {
               const list = this;
               // const parent = this.getParentView();
               const selectedItem = this.getItem(id);

               const cells = [];
               // {array}
               // the webix defs for the Form.io forms for this selection.

               // const number = 1;
               selectedItem.items.forEach(function (task) {
                  if (task.data?.url) {
                     cells.push({
                        id: "task-holder-" + task.uuid,
                        unitlist: list,
                        view: "layout",
                        padding: 20,
                        rows: [
                           {
                              id: task.uuid,
                              view: "iframe",
                              src: task.data.url,
                           },
                        ],
                     });
                  } else
                     cells.push({
                        id: "task-holder-" + task.uuid,
                        unitlist: list,
                        view: "layout",
                        padding: 20,
                        rows: [
                           {
                              id: task.uuid,
                              view: "formiopreview",
                              formComponents: task.ui,
                              formData: task.data,
                              onButton: function (value) {
                                 self.processItem(id, task, value);
                              },
                           },
                        ],
                     });
               });

               self.emit("showTasks", /*list, */ selectedItem.name, cells);
            },
            on: {
               onAfterRender() {
                  ClassUI.CYPRESS_REF(this);
                  this.data.each((a) => {
                     ClassUI.CYPRESS_REF(
                        this.getItemNode(a.id),
                        `${self.id}_${a.id}`
                     );
                  });
               },
            },
         },
         // TODO: This never gets called!
         // on: {
         //    onAfterRender() {
         //       ClassUI.CYPRESS_REF(this);
         //    },
         // },
      };
   }

   init(AB) {
      // prevent multiple .init() calls
      if (!this.AB) {
         this.AB = AB;

         this.AB.Network.on("inbox.update", (context, err /* , response */) => {
            if (err && err.message) {
               webix.message(err.message);
               this.AB.notify.developer(err, {
                  context:
                     "portal_work_inbox_accordion:Network[inbox.update]: error updating Inbox item",
                  info: context,
               });
               return;
            }

            const list = $$(this.idUnitList);
            const selectedItem = list.getItem(context.unitID);

            // clear out processed item from our accordion
            // prune the item from the group of similar processes in the unit list
            if (selectedItem) {
               const parent = list.getParentView();

               selectedItem.items = selectedItem.items.filter(function (i) {
                  return i.uuid != context.uuid;
               });

               // refresh the unit list so we can get an update badge count
               list.refresh();
               if (selectedItem.items.length == 0) {
                  // remove the item from the unit list
                  list.remove(list.getSelectedId());
                  // if that was the last item in the unit list remove the accordion
                  if (list.count() == 0) {
                     parent.hide();
                  }
               }
            }

            this.emit("item.processed", context.uuid);
         });
      }

      return Promise.resolve();
   }

   unitList() {
      return $$(this.idUnitList);
   }

   /**
    * @method processItem()
    * submit the current task's response back to the server.
    * @param {ABProcessForm} task
    *        the current form that is being responded to.
    * @param {string} value
    *        the value of the Form button returned.
    */
   processItem(unitID, task, value) {
      this.AB.Network.put(
         {
            url: `/process/inbox/${task.uuid}`,
            data: { response: value },
         },
         {
            key: "inbox.update",
            context: { uuid: task.uuid, unitID },
         }
      );

      return;
   }

   show() {
      $$(this.id).show();
      $$(this.id).expand();
      this.initFormIOPreview();
   }

   /**
    * Ensure the formio custom webix component is loaded and ready to
    * use.
    */
   initFormIOPreview() {
      this.AB.custom.formiopreview.init();
   }
}

export default PortalWorkInboxAccordion;
