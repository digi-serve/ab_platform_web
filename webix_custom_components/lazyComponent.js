/**
 * Base class for any custom webix component that we want to initalize lazily,
 * usually to reduce the dependency size required on load.
 */
var ABEmitter = require("../AppBuilder/platform/ABEmitter.js");
module.exports = class ABLazyCustomComponent extends ABEmitter {
   constructor({ AB }) {
      super();
      this.initialized = false;
      this.AB = AB;
      this.setDefaultUI();
   }

   /**
    * Sets a default UI used before the actual webix component is ready. Meant as
    * a helper to future developers.
    */
   setDefaultUI() {
      this.AB.Webix.protoUI(
         {
            name: this.key,
            defaults: {
               template:
                  "This custom webix component has not been initialized. <br>Call AB.custom.#key#.init() before using this component.",
               data: { key: this.key },
            },
            $init: () =>
               this.AB.notify.developer(
                  new Error(
                     `${this.key} custom webix component used before being initalized`
                  ),
                  {
                     context: `ABLazyCustomComponent (${this.key}) -> setDefaultUI()`,
                     fix: `call AB.custom.${this.key}.init() before the component is used`,
                  }
               ),
         },
         this.AB.Webix.ui.template
      );
   }
};
