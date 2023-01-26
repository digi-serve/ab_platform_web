const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewLabelComponent extends ABViewComponent {
   constructor(baseView, idBase) {
      super(baseView, idBase ?? `ABViewLabel_${baseView.id}`);
   }

   ui() {
      const baseView = this.view;

      const _ui = super.ui([
         {
            view: "label",
            // css: 'ab-component-header ab-ellipses-text',
            label: baseView.text || "*",
            align: baseView.settings.alignment,
            type: {
               height: "auto",
            },
         },
      ]);

      delete _ui.type;

      return this.uiFormatting(_ui);
   }

   /**
    * @method uiFormatting
    * a common routine to properly update the displayed label
    * UI with the css formatting for the given .settings
    * @param {obj} _ui the current webix.ui definition
    * @return {obj} a properly formatted webix.ui definition
    */
   uiFormatting(ui) {
      // add different css settings based upon it's format
      // type.
      switch (parseInt(this.settings.format)) {
         // normal
         case 0:
            ui.rows[0].css = "ab-component-label ab-ellipses-text";
            break;

         // title
         case 1:
            ui.rows[0].css = "ab-component-header ab-ellipses-text";
            break;

         // description
         case 2:
            ui.rows[0].css = "ab-component-description ab-ellipses-text";
            break;
      }

      return ui;
   }

   async init(AB) {
      await super.init(AB);
   }
};
