const ABViewDetailItemComponent = require("./ABViewDetailItemComponent");

module.exports = class ABViewDetailImageComponent extends (
   ABViewDetailItemComponent
) {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewDetailImage_${baseView.id}`, ids);
   }

   ui() {
      const baseView = this.view;
      const field = baseView.field();
      const _ui = {
         on: {
            //Add data-cy attribute for Cypress Testing
            onAfterRender: () => {
               const dataCy = `detail image ${field?.columnName} ${field?.id} ${
                  baseView.parentDetailComponent()?.id || baseView.parent.id
               }`;

               $$(this.ids.detailItem)?.$view.setAttribute("data-cy", dataCy);
            },
         },
      };
      const settings = this.settings;

      if (settings.height) _ui.height = settings.height;

      return super.ui(_ui);
   }

   setValue(val) {
      const field = this.view.field();

      if (!field) {
         super.setValue("");

         return;
      }

      const parsedImageUrl = val || field.settings.defaultImageUrl;

      if (!parsedImageUrl) {
         super.setValue("");

         return;
      }

      const imageUrl = field.urlImage(parsedImageUrl);
      const settings = this.settings;
      const width = settings.width || field.settings.imageWidth || 200;
      const height = settings.height
         ? `${settings.height}px`
         : field.settings.imageHeight
         ? `${field.settings.imageHeight}px`
         : "100%";
      const imageTemplate = [
         `<div class="ab-image-data-field">`,
         `<div style="float: left; background-size: cover; background-position: center center; background-image:url('${imageUrl}');  width: ${width}px; height: ${height}; position:relative;">`,
         `<a href="${imageUrl}" target="_blank" title="" class="fa fa-download ab-image-data-field-download"></a>`,
         `</div></div>`,
      ].join("");

      super.setValue(imageTemplate);
   }
};
