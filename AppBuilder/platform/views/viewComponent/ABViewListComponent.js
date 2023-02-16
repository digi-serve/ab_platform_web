const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewListComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewList_${baseView.id}`,
         Object.assign({ list: "" }, ids)
      );
   }

   ui() {
      const settings = this.settings;
      const _uiList = {
         id: this.ids.list,
         view: "dataview",
         type: {
            width: 1000,
            height: 30,
         },
         template: (item) => {
            const field = this.view.field();

            if (!field) return "";

            return field.format(item);
         },
      };

      // set height or autoHeight
      if (settings.height !== 0) _uiList.height = settings.height;
      else _uiList.autoHeight = true;

      const _ui = super.ui([_uiList]);

      delete _ui.type;

      return _ui;
   }

   async init(AB) {
      await super.init(AB);

      const dc = this.datacollection;

      if (!dc) return;

      // bind dc to component
      dc.bind($$(this.ids.list));
      // $$(ids.list).sync(dv);
   }
};
