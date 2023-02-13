const ABViewImageCore = require("../../core/views/ABViewImageCore");
const ABViewImageComponent = require("./viewComponent/ABViewImageComponent");

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewImage extends ABViewImageCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   //
   //	Editor Related
   //

   /**
    * @method editorComponent
    * return the Editor for this UI component.
    * the editor should display either a "block" view or "preview" of
    * the current layout of the view.
    * @param {string} mode what mode are we in ['block', 'preview']
    * @return {Component}
    */
   editorComponent(App, mode) {
      var idBase = "ABViewImageEditorComponent";

      var ImageComponent = this.component(App, idBase);

      return ImageComponent;
   }

   //
   // Property Editor
   //

   static propertyEditorDefaultElements(App, ids, _logic, ObjectDefaults) {
      var commonUI = super.propertyEditorDefaultElements(
         App,
         ids,
         _logic,
         ObjectDefaults
      );

      _logic.validateType = (item) => {
         // verify file type
         var acceptableTypes = ["jpg", "jpeg", "bmp", "png", "gif"];
         var type = item.type.toLowerCase();
         if (acceptableTypes.indexOf(type) == -1) {
            webix.message(
               L("Only [{0}] images are supported", [
                  acceptableTypes.join(", "),
               ])
            );
            return false;
         } else {
            // set upload url to uploader
            var currView = _logic.currentEditObject();
            let actionKey = `opstool.AB_${currView.application.name.replace(
               "_",
               ""
            )}.view`;
            let url = `/file/upload/${currView.application.name}/${actionKey}/1`;

            $$(ids.file).define("upload", url);
            $$(ids.file).refresh();

            return true;
         }
      };

      _logic.uploadedFile = (fileInfo) => {
         if (!fileInfo || !fileInfo.data) return;

         var currView = _logic.currentEditObject();
         currView.settings.filename = fileInfo.data.uuid;

         // get width & height of images
         if (fileInfo.file) {
            let img = new Image();
            img.onload = function () {
               $$(ids.width).setValue(img.width);
               $$(ids.height).setValue(img.height);
            };
            img.src = URL.createObjectURL(fileInfo.file);
         }

         // trigger a save()
         this.propertyEditorSave(ids, currView);
      };

      // in addition to the common .label  values, we
      // ask for:
      return commonUI.concat([
         {
            cols: [
               {
                  view: "label",
                  label: L("Image:"),
                  css: "ab-text-bold",
                  width: this.AB.UISettings.config().labelWidthXLarge,
               },
               {
                  view: "uploader",
                  value: L("Upload image"),
                  name: "file",
                  apiOnly: true,
                  inputName: "image",
                  multiple: false,
                  on: {
                     onBeforeFileAdd: (item) => {
                        return _logic.validateType(item);
                     },

                     onFileUpload: (file, response) => {
                        _logic.uploadedFile(file);
                     },

                     onFileUploadError: (file, response) => {},
                  },
               },
            ],
         },
         {
            view: "counter",
            name: "width",
            label: L("Width:"),
            labelWidth: this.AB.UISettings.config().labelWidthXLarge,
         },
         {
            view: "counter",
            name: "height",
            label: L("Height:"),
            labelWidth: this.AB.UISettings.config().labelWidthXLarge,
         },
      ]);
   }

   static propertyEditorPopulate(App, ids, view) {
      super.propertyEditorPopulate(App, ids, view);

      $$(ids.width).setValue(view.settings.width);
      $$(ids.height).setValue(view.settings.height);
   }

   static propertyEditorValues(ids, view) {
      super.propertyEditorValues(ids, view);

      view.settings.width = $$(ids.width).getValue();
      view.settings.height = $$(ids.height).getValue();
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false) {
      let component = new ABViewImageComponent(this);

      // if this is our v1Interface
      if (v1App) {
         let newComponent = component;

         component = {
            ui: component.ui(),
            init: (options, accessLevel) => {
               return newComponent.init(this.AB, accessLevel);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
      }

      return component;
   }
};
