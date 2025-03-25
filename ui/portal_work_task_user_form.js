import ClassUI from "./ClassUI.js";

class PortalWorkTaskUserForm extends ClassUI {
   constructor() {
      super("portal_work_task_user_form", {
         formIO: "",
      });
   }

   ui() {
      const ids = this.ids;
      const L = (...params) => {
         return this.label(...params);
      };

      return {
         id: ids.component,
         view: "window",
         height: 500,
         width: 600,
         position: "center",
         modal: true,
         resize: true,
         head: {
            view: "toolbar",
            css: "webix_dark",
            cols: [
               {},
               {
                  view: "label",
                  label: this.label(""),
                  autowidth: true,
               },
               {},
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
         body: {
            view: "layout",
            padding: 10,
            rows: [this.uiFormIO()],
         },
      };
   }

   uiFormIO(formComponents = { components: [] }) {
      const ids = this.ids;

      return {
         id: ids.formIO,
         view: "formiopreview",
         formComponents: formComponents,
         onButton: function (value) {
            // self.processItem(id, task, value);
         },
      };
   }

   refreshFormIO(formComponents = { components: [] }) {
      const ids = this.ids;
      const formIoDef = this.uiFormIO(formComponents);

      this.AB.Webix.ui(formIoDef, $$(ids.formIO));
   }

   init(AB) {
      const ui = this.ui();

      this.AB = AB;
      this.AB.custom.formiopreview.init();
      this.AB.Webix.ui(ui);
      this.AB.on("ab.task.userform", (data) => {
         this.refreshFormIO(data.formio);
         this.show();
      });
   }

   show() {
      const $popup = $$(this.ids.component);
      $popup?.show();
   }

   hide() {
      const $popup = $$(this.ids.component);
      $popup?.hide();
   }
}

export default new PortalWorkTaskUserForm();
