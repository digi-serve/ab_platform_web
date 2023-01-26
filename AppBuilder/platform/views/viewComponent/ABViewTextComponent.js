const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewTextComponent extends ABViewComponent {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewText_${baseView.id}`;

      super(baseView, idBase ?? `ABViewText_${baseView.id}`, {
         text: "",
      });
   }

   ui() {
      const ids = this.ids;
      const baseView = this.view;

      const _ui = {
         id: ids.text,
         view: "template",
         minHeight: 10,
         css: "ab-custom-template",
         borderless: true,
      };

      if (baseView.settings.height) _ui.height = baseView.settings.height;
      else _ui.autoheight = true;

      return _ui;
   }

   async init(AB) {
      await super.init(AB);
   }

   displayText(value) {
      const ids = this.ids;
      const baseView = this.view;
      const result = baseView.displayText(value, ids.text);

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
