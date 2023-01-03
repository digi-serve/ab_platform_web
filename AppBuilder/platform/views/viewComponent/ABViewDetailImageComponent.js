const ABViewDetailItemComponent = require("./ABViewDetailItemComponent");

module.exports = class ABViewDetailImageComponent extends (
   ABViewDetailItemComponent
) {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewDetailImageComponent_${baseView.id}`;
      super(baseView, idBase);
   }

   ui() {
      let _ui = super.ui();
      let field = this.view.field();

      _ui.id = this.ids.component;

      if (this.settings.height) _ui.height = this.settings.height;

      _ui.on = {
         //Add data-cy attribute for Cypress Testing
         onAfterRender: () => {
            const dataCy = `detail image ${field?.columnName} ${field?.id} ${
               this.view.parentDetailComponent()?.id || this.view.parent.id
            }`;
            $$(this.ids.component)?.$view.setAttribute("data-cy", dataCy);
         },
      };

      return _ui;
   }

   setValue(val) {
      let field = this.view.field();
      let imageTemplate = "";
      let defaultImageUrl = field ? field.settings.defaultImageUrl : "";

      if (val || (!val && defaultImageUrl)) {
         let imageUrl = field.urlImage(val || defaultImageUrl);
         let width =
            field && field.settings.imageWidth
               ? `${field.settings.imageWidth}px`
               : "200px";
         let height =
            field && field.settings.imageHeight
               ? `${field.settings.imageHeight}px`
               : "100%";

         if (this.settings.height) height = `${this.settings.height}px`;

         if (this.settings.width) width = `${this.settings.width}px`;

         imageTemplate =
            `<div class="ab-image-data-field">` +
            `<div style="float: left; background-size: cover; background-position: center center; background-image:url('${imageUrl}');  width: ${width}; height: ${height}; position:relative;">` +
            `<a href="${imageUrl}" target="_blank" title="" class="fa fa-download ab-image-data-field-download"></a>` +
            `</div></div>`;
      }

      super.setValue(imageTemplate);
   }
};
