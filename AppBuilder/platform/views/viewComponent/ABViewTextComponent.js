const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewTextComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewText_${baseView.id}`,
         Object.assign(
            {
               text: "",
            },
            ids
         )
      );
   }

   ui() {
      const ids = this.ids;
      const settings = this.settings;

      const _uiText = {
         id: ids.text,
         view: "template",
         minHeight: 10,
         css: "ab-custom-template",
         borderless: true,
      };

      if (settings.height) _uiText.height = settings.height;
      else _uiText.autoheight = true;

      const _ui = super.ui([_uiText]);

      delete _ui.type;

      return _ui;
   }

   displayText(value) {
      const ids = this.ids;
      const result = this.view.displayText(value, ids.text);

      const $text = $$(ids.text);

      if (!$text) return;

      $text.define("template", result);
      $text.refresh();
   }

   onShow() {
      super.onShow();

      // listen DC events
      const dataview = this.datacollection;
      const baseView = this.view;

      if (dataview && baseView.parent.key !== "dataview")
         baseView.eventAdd({
            emitter: dataview,
            eventName: "changeCursor",
            listener: (...p) => this.displayText(...p),
         });

      this.displayText();
   }
};
