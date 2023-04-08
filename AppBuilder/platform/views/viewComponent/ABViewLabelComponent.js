const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewLabelComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewLabel_${baseView.id}`, ids);
   }

   ui() {
      const baseView = this.view;

      const _ui = super.ui([
         this.uiFormatting({
            view: "label",
            // css: 'ab-component-header ab-ellipses-text',
            label: baseView.text || "*",
            align: this.settings.alignment,
            type: {
               height: "auto",
            },
         }),
      ]);

      delete _ui.type;

      return _ui;
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
            ui.css = "ab-component-label ab-ellipses-text";
            break;

         // title
         case 1:
            ui.css = "ab-component-header ab-ellipses-text";
            break;

         // description
         case 2:
            ui.css = "ab-component-description ab-ellipses-text";
            break;
      }

      return ui;
   }
};
