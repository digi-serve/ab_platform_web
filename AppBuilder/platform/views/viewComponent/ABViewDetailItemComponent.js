const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewDetailItemComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewDetailItem_${baseView.id}`,
         Object.assign(
            {
               detailItem: "",
            },
            ids
         )
      );
   }

   ui(uiDetailItemComponent = {}) {
      const baseView = this.view;

      // setup 'label' of the element
      const settings = baseView.detailComponent()?.settings ?? {};

      let templateLabel = "";

      if (settings.showLabel) {
         if (settings.labelPosition === "top")
            templateLabel =
               "<label style='display:block; text-align: left;' class='webix_inp_top_label'>#label#</label>#display#";
         else
            templateLabel =
               "<label style='width: #width#px; display: inline-block; float: left; line-height: 32px;'>#label#</label><div class='ab-detail-component-holder' style='margin-left: #width#px;'>#display#</div>";
      }
      // no label
      else templateLabel = "#display#";

      const field = baseView.field();
      const template = templateLabel
         .replace(/#width#/g, settings.labelWidth)
         .replace(/#label#/g, field?.label ?? "");

      let height = 38;

      if (settings.labelPosition === "top") height = height * 2;

      if (field?.settings?.useHeight === 1)
         height = parseInt(field.settings.imageHeight) || height;

      const _ui = super.ui([
         Object.assign(
            {
               id: this.ids.detailItem,
               view: "template",
               borderless: true,
               height: height,
               isUsers: field?.key === "user",
               template: template,
               data: { display: "" }, // show empty data in template
            },
            uiDetailItemComponent
         ),
      ]);

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
