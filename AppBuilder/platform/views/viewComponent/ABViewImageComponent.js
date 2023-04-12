const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewImageComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewImage_${baseView.id}`,
         Object.assign({ image: "" }, ids)
      );
   }

   ui() {
      const settings = this.settings;
      const _ui = super.ui([
         {
            cols: [
               {
                  id: this.ids.image,
                  view: "template",
                  template: "",
                  height: settings.height,
                  width: settings.width,
               },
               {},
            ],
         },
      ]);

      delete _ui.type;

      return _ui;
   }

   async init(AB) {
      await super.init(AB);

      const $image = $$(this.ids.image);
      if (!$image) return;

      const settings = this.settings;

      if (settings.filename)
         $image.define(
            "template",
            `<img src="/file/${settings.filename}" height="${settings.height}" width="${settings.width}">`
         );
      else $image.define("template", "");

      $image.refresh();
   }
};
