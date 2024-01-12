const ABViewFormItemComponent = require("./ABViewFormItemComponent");

module.exports = class ABViewFormTextboxComponent extends (
   ABViewFormItemComponent
) {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewFormTextbox_${baseView.id}`, ids);
      this.type =
         this.settings.type ||
         this.view.settings.type ||
         this.view.constructor.defaultValues().type;
   }

   ui() {
      const _ui = {};

      switch (this.type) {
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

   async onShow() {
      if (this.type !== "rich") return;
      await this.initTinyMCE();
      const _ui = this.ui();
      const _uiFormItem = _ui.rows[0];
      let $formItem = $$(this.ids.formItem);

      // WORKAROUND : to fix breaks TinyMCE when switch pages/tabs
      // https://forum.webix.com/discussion/6772/switching-tabs-breaks-tinymce
      if ($formItem) {
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

   /**
    * Ensure TinyMCE has been loaded and initialized.
    */
   async initTinyMCE() {
      await this.AB.custom["tinymce-editor"].init();
   }
};
