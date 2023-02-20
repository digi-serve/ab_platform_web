const ABViewFormItemComponent = require("./ABViewFormItemComponent");

module.exports = class ABViewFormTextboxComponent extends (
   ABViewFormItemComponent
) {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewFormTextbox_${baseView.id}`, ids);
   }

   ui() {
      const _ui = {};

      switch (
         this.settings.type ||
         this.view.settings.type ||
         this.view.constructor.defaultValues().type
      ) {
         case "single":
            _ui.view = "text";
            break;
         case "multiple":
            _ui.view = "textarea";
            _ui.height = 200;
            break;
         case "rich":
            _ui.view = "forminput";
            _ui.height = 200;
            _ui.css = "ab-rich-text";
            _ui.body = {
               view: "tinymce-editor",
               value: "",
               cdn: "/js/webix/extras/tinymce",
               config: {
                  plugins: "link",
                  menubar: "format edit",
                  toolbar:
                     "undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | fontsizeselect | link",
               },
            };
            break;
      }

      return super.ui(_ui);
   }

   onShow() {
      const settings = this.view.settings ?? {};
      const _ui = this.ui();
      const _uiFormItem = _ui.rows[0];
      let $formItem = $$(_uiFormItem.id);

      // WORKAROUND : to fix breaks TinyMCE when switch pages/tabs
      // https://forum.webix.com/discussion/6772/switching-tabs-breaks-tinymce
      if (settings.type === "rich" && $formItem) {
         // recreate rich editor
         $formItem = this.AB.Webix.ui(_uiFormItem, $formItem);

         // Add dataCy to TinyMCE text editor
         const baseView = this.view;

         $formItem
            .getChildViews()[0]
            .getEditor(true)
            .then((editor) => {
               const dataCy = `${baseView.key} rich ${_uiFormItem.name} ${
                  baseView.id ?? ""
               } ${baseView.parent?.id ?? ""}`;

               editor.contentAreaContainer.setAttribute("data-cy", dataCy);
            });
      }
   }
};
