const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewDetailItemComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      idBase = idBase || `ABViewDetailComponent_${baseView.id}`;
      super(baseView, idBase, ids);

      this.view = baseView;
      this.settings = baseView.settings;
      this.AB = baseView.AB;
   }

   ui() {
      let ids = this.ids;

      // setup 'label' of the element
      let detailView = this.view.parentDetailComponent(),
         field = this.view.field();

      let settings = detailView?.settings ?? {};
      let isUsers = field?.key == "user";

      let templateLabel = "";
      if (settings.showLabel == true) {
         if (settings.labelPosition == "top")
            templateLabel =
               "<label style='display:block; text-align: left;' class='webix_inp_top_label'>#label#</label>#display#";
         else
            templateLabel =
               "<label style='width: #width#px; display: inline-block; float: left; line-height: 32px;'>#label#</label><div class='ab-detail-component-holder' style='margin-left: #width#px;'>#display#</div>";
      }
      // no label
      else {
         templateLabel = "#display#";
      }

      let template = templateLabel
         .replace(/#width#/g, settings.labelWidth)
         .replace(/#label#/g, field?.label ?? "");

      let height = 38;
      if (settings.labelPosition == "top") height = height * 2;

      if (field?.settings?.useHeight == 1) {
         height = parseInt(field.settings.imageHeight) || height;
      }

      let _ui = {
         id: ids.component,
         view: "template",
         borderless: true,
         height: height,
         isUsers: isUsers,
         template: template,
         data: { display: "" }, // show empty data in template
      };

      return _ui;
   }

   init(AB) {
      this.AB = AB;
      return Promise.resolve();
   }

   setValue(val, componentId) {
      componentId = componentId ?? this.ids.component;

      if (!$$(componentId)) return;

      let field = this.view.field();
      if (field?.key == "string" || field?.key == "LongText") {
         val = val.replace(/[<]/g, "&lt;");
      }

      $$(componentId).setValues({ display: val });
   }
};
