import ClassUI from "./ClassUI.js";

class PortalWorkInboxAccordion extends ClassUI {
   constructor(app) {
      super();

      this.app = app;
      this.idUnitList = `inbox-accordion-app-${this.app.id}`;
   }

   ui() {
      var self = this;
      // for .click() handler below:

      return {
         header: this.app.label,
         id: `inbox-accordion-app-holder-${this.app.id}`,
         view: "accordionitem",
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
               headerHeight: 24,
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
               var list = this;
               var parent = this.getParentView();
               var selectedItem = this.getItem(id);

               var cells = [];
               // {array}
               // the webix defs for the Form.io forms for this selection.

               // var number = 1;
               selectedItem.items.forEach(function (task) {
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
                              debugger;
                              self.processItem(task, value);
                           },
                        },
                     ],
                  });
               });

               self.emit("showTasks", selectedItem, cells);
            },
         },
      };
   }

   init(AB) {
      this.AB = AB;

      this.AB.Network.on("inbox.update", (context, err, response) => {
         if (err && err.message) {
            webix.message(err.message);
            return;
         }
         this.emit("item.processed", context.uuid);
      });

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
   processItem(task, value) {
      this.AB.Network.post(
         {
            url: `/process/inbox/${task.uuid}`,
            data: { response: value },
         },
         {
            key: "inbox.update",
            context: { uuid: task.uuid },
         }
      );

      return;
   }

   show() {
      $$("portal_work").show();
   }
}

export default PortalWorkInboxAccordion;
