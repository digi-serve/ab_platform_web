const ABViewComponent = require("./ABViewComponent").default;

const L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewTextComponent extends ABViewComponent {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewText_${baseView.id}`;

      super(baseView, idBase, {});

      this.view = baseView;

      this.AB = this.view.AB;
   }

   ui() {
      const ids = this.ids;
      const baseView = this.view;

      const _ui = {
         id: ids.component,
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
      this.AB = AB;

      const ids = this.ids;

      const $component = $$(ids.component);
   }

   displayText(value) {
      const ids = this.ids;
      const baseView = this.view;
      const result = baseView.displayText(value, ids.component);

      const $component = $$(ids.component) ?? null;

      if (!$component) return;

      $component.define("template", result);
      $component.refresh();
   }

   onShow(viewId) {
      const ids = this.ids;

      const baseView = this.view;

      super.onShow(viewId);

      // listen DC events
      const dataview = baseView.datacollection ?? null;

      if (dataview && baseView.parent.key !== "dataview")
         baseView.eventAdd({
            emitter: dataview,
            eventName: "changeCursor",
            listener: this.displayText,
         });

      this.displayText();
   }
};
