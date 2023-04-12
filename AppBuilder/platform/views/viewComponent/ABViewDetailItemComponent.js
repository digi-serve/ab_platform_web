const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewDetailItemComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewDetailItem_${baseView.id}`,
         Object.assign(
            {
               detailItem: "",
               detailItemLabel: "",
            },
            ids
         )
      );
   }

   ui(uiDetailItemComponent = {}) {
      const baseView = this.view;

      // setup 'label' of the element
      const settings = baseView.detailComponent()?.settings ?? {};
      const field = baseView.field();

      const isLabelTop = settings.labelPosition == "top";

      const group = [];
      /** @const group will be used later as rows or cols depending on label position */
      if (settings.showLabel) {
         const templateLabel = isLabelTop
            ? "<label style='display:block; text-align: left; line-height: 32px;' class='webix_inp_top_label'>#label#</label>"
            : "<label style='display: inline-block; float: left; line-height: 32px; width:#width#px;'>#label#</label>";

         const labelUi = {
            id: this.ids.detailItemLabel,
            view: "template",
            borderless: true,
            height: 38,
            template: templateLabel,
            data: { label: field?.label ?? "" },
         };
         if (!isLabelTop) labelUi.width = settings.labelWidth + 24; // Add 24px to compensate for webix padding
         group.push(labelUi);
      }

      let height;
      if (field?.settings?.useHeight === 1)
         height = parseInt(field.settings.imageHeight) || height;

      const valueUi = Object.assign(
         {
            id: this.ids.detailItem,
            view: "template",
            borderless: true,
            autowidth: true,
            height,
            isUsers: field?.key === "user",
            template: isLabelTop
               ? "<div style='min-height: 38px'>#display#</div>"
               : "<div class='ab-detail-component-holder'>#display#</div>",
            data: { display: "" }, // show empty data in template
         },
         uiDetailItemComponent
      );
      // height = 0 behaves a bit differently then autoheight here.
      if (!valueUi.height || valueUi.height == 0) {
         delete valueUi.height;
         valueUi.autoheight = true;
      }
      group.push(valueUi);
      const itemUi = {};
      settings.labelPosition == "top"
         ? (itemUi.rows = group)
         : (itemUi.cols = group);
      const _ui = super.ui([itemUi]);

      delete _ui.type;

      return _ui;
   }

   // async init(AB) {
   //    await super.init(AB);
   // }

   setValue(val, detailId) {
      const $detailItem = $$(detailId ?? this.ids.detailItem);

      if (!$detailItem) return;

      const field = this.view.field();

      if (field?.key === "string" || field?.key === "LongText") {
         $detailItem.setValues({ display: val.replace(/[<]/g, "&lt;") });

         return;
      }

      $detailItem.setValues({ display: val });
   }
};
