/*
 * formioBuilder
 *
 * Create a custom webix component.
 *
 */
var ABEmitter = require("../AppBuilder/platform/ABEmitter.js");
module.exports = class ABCustomFormIOPreview extends ABEmitter {
   get key() {
      return "formiopreview";
   }

   constructor() {
      super();
      this.initialized = false;
   }

   async init() {
      if (this.initialized) return;
      const { default: Form } = await import(
         /* webpackChunkName: "formio" */
         /* webpackPrefetch: true */
         /* webpackFetchPrioirtiy: "low" */
         "../init/formioViewer.js"
      );
      // Our webix UI definition:
      var _ui = {
         name: this.key,
         defaults: {
            css: "scrolly",
            borderless: true,
         },
         $init: async function (config) {
            this.$ready.push(() => this.initForm(config));
         },

         initForm: async (config) => {
            var formComponents = config.formComponents ?? {};
            var formData = config.formData ?? {};
            const component = $$(config.id);
            // we need to find out when we are passing an array of objects and reduce it down to an array of IDs
            for (var data in formData) {
               if (
                  Array.isArray(formData[data]) &&
                  typeof formData[data][0] == "object"
               ) {
                  formData[data] = formData[data].map((item) => item.id);
               }
            }

            const form = new Form(component.$view, formComponents);
            // readOnly: true
            // sanitizeConfig: {
            //     addTags: ["a", "label", "img", "i"],
            //     addAttr: ["src", "href", "class", "target"]
            // }
            // }).then(function (form) {
            await form.build();
            // now that it is set up we can push it into the global var
            // formBuilder = builder;
            // Provide a default submission.
            form.submission = {
               data: formData,
            };
            (formComponents.components || []).forEach((comp) => {
               if (
                  comp.type == "button" &&
                  comp.action == "event" &&
                  comp.event
               ) {
                  form.once(comp.event, function (click) {
                     config.onButton ? config.onButton(comp.event) : null;
                     // _this.emit("button", comp.event);
                  });
               }
            });
            // });
         },
      };
      this.view = this.key;

      // our internal business logic
      this._logic = {};

      // Tell Webix to create an INSTANCE of our custom component:
      webix.protoUI(_ui, webix.ui.view);
      this.initialized = true;
   }
};
