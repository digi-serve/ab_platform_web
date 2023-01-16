const ABViewFormItemComponent = require("./ABViewFormItemComponent");
const ABViewFormTextboxCore = require("../../../core/views/ABViewFormTextboxCore");

const ABViewFormTextboxPropertyComponentDefaults =
   ABViewFormTextboxCore.defaultValues();

module.exports = class ABViewFormTextboxComponent extends (
   ABViewFormItemComponent
) {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewFormTextbox_${baseView.id}`;
      super(baseView, idBase, {});
   }

   ui() {
      const _ui = super.ui();
      _ui.id = this.ids.component;

      switch (
         this.view.settings.type ??
         ABViewFormTextboxPropertyComponentDefaults.type
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

      return _ui;
   }

   onShow() {
      const settings = this.view.settings ?? {};
      const _ui = this.ui();
      const $elem = $$(_ui.id);

      // WORKAROUND : to fix breaks TinyMCE when switch pages/tabs
      // https://forum.webix.com/discussion/6772/switching-tabs-breaks-tinymce
      if (settings.type == "rich" && $elem) {
         // recreate rich editor
         webix.ui(_ui, $elem);
         // Add dataCy to TinyMCE text editor
         $elem
            .getChildViews()[0]
            .getEditor(true)
            .then((editor) => {
               const dataCy = `${this.key} rich ${_ui.name} ${this.id} ${this.parent.id}`;
               editor.contentAreaContainer.setAttribute("data-cy", dataCy);
            });
      }
   }
};
