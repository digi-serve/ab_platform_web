const ABFieldFileCore = require("../../core/dataFields/ABFieldFileCore");

const L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABFieldFile extends ABFieldFileCore {
   constructor(values, object) {
      super(values, object);
   }

   ///
   /// Instance Methods
   ///

   isValid() {
      const validator = super.isValid();

      // validator.addError('columnName', L('ab.validation.object.name.unique', 'Field columnName must be unique (#name# already used in this Application)').replace('#name#', this.name) );

      return validator;
   }

   /**
    * @function destroy
    * On a destroy operation, ask if the user wants to keep the related file.
    */
   async destroy() {
      return new Promise((resolve, reject) => {
         // verify we have been .save()d before:
         if (!this.id) {
            resolve();
            return;
         }

         // Ask the user what to do about the existing file:
         webix.confirm({
            title: L("Keep Files?"),
            message: L("Do you want to keep the files referenced by {0}?", [
               this.label,
            ]),
            callback: async (result) => {
               // update this setting so the server can respond correctly in
               // ABFieldFile.migrateDrop()
               this.settings.removeExistingData = result ? 0 : 1;

               try {
                  await this.save();

                  // TODO: a reminder that you still got alot on the server to do!
                  webix.alert({
                     title: "!! TODO !!",
                     text: "Tell a Developer to actually pay attention to this!",
                  });

                  // now the default .destroy()
                  await super.destroy();

                  resolve();
               } catch (err) {
                  reject(err);
               }
            },
         });
      });
   }

   ///
   /// Working with Actual Object Values:
   ///

   // return the grid column header definition for this instance of ABFieldFile
   columnHeader(options) {
      options = options || {};

      const config = super.columnHeader(options);

      config.editor = false;

      const editable = options.editable;

      // populate our default template:
      config.template = (obj) => {
         if (obj.$group) return this.dataValue(obj);

         const fileDiv = [
            '<div class="ab-file-data-field" style="float: left;">',
            '<div class="webix_view ab-file-holder">',
            '<div class="webix_template">',
            this.fileTemplate(obj, editable),
            "</div>",
            "</div>",
            "</div>",
         ].join("");

         return fileDiv;
      };

      return config;
   }

   /*
    * @function customDisplay
    * perform any custom display modifications for this field.
    * @param {object} row is the {name=>value} hash of the current row of data.
    * @param {App} App the shared ui App object useful more making globally
    *					unique id references.
    * @param {HtmlDOM} node  the HTML Dom object for this field's display.
    */
   customDisplay(row, App, node, options) {
      // sanity check.
      if (!node) {
         return;
      }
      options = options || {};

      let typesList = [];
      let maximumSize = 0;

      if (this.settings.limitFileType && this.settings.fileType) {
         typesList = this.settings.fileType.split(",");
      }

      if (this.settings.limitFileSize && this.settings.fileSize) {
         maximumSize = this.settings.fileSize;
      }

      // 		// safety check:
      // 		// webix seems to crash if you specify a .container that doesn't exists:
      // 		// Note: when the template is first created, we don't have App.unique()
      const parentContainer = node.querySelector(".ab-file-holder");
      if (parentContainer) {
         parentContainer.innerHTML = "";
         // parentContainer.id = idBase;	// change it to the unique one.

         // 			// use a webix component for displaying the content.
         // 			// do this so I can use the progress spinner

         const webixContainer = webix.ui({
            view: "template",
            container: parentContainer,

            template: this.fileTemplate(row, options.editable),

            borderless: true,
            width: 160,
            height: 60,
         });
         webix.extend(webixContainer, webix.ProgressBar);

         // 			////
         // 			//// Prepare the Uploader
         // 			////

         if (!options.editable) {
            const domNode = parentContainer.querySelector(".delete-image");
            if (domNode) domNode.style.display = "none";

            return;
         }

         const url = this.urlUpload(true);

         const uploader = webix.ui({
            view: "uploader",
            apiOnly: true,
            upload: url,
            inputName: "file",
            multiple: false,
            on: {
               // when a file is added to the uploader
               onBeforeFileAdd: function (item) {
                  node.classList.remove("webix_invalid");
                  node.classList.remove("webix_invalid_cell");

                  // verify file type
                  const acceptableTypes = typesList;
                  if (acceptableTypes && acceptableTypes != "") {
                     const type = item.type.toLowerCase();
                     if (acceptableTypes.indexOf(type) == -1) {
                        webix.message(
                           L("Only [{0}] files are supported", [
                              acceptableTypes.join(", "),
                           ])
                        );
                        return false;
                     }
                  }

                  //verify file size
                  //Convert to MegaBytes
                  if (maximumSize > 0) {
                     const acceptableSizes = maximumSize * 1000000;
                     if (item.size > acceptableSizes) {
                        webix.message(
                           L("Maximum file size is {0}MB", [maximumSize])
                        );
                        return false;
                     }
                  }

                  // start progress indicator
                  webixContainer.showProgress({
                     type: "icon",
                     delay: 2000,
                  });
               },

               // when upload is complete:
               onFileUpload: async (item, response) => {
                  webixContainer.hideProgress();
                  // this.showFile(idBase, response.data.uuid);

                  const values = {};
                  values[this.columnName] = {};
                  values[this.columnName].uuid = response.data.uuid;
                  values[this.columnName].filename = item.name;

                  // update just this value on our current object.model
                  if (row.id) {
                     try {
                        await this.object.model().update(row.id, values);

                        // update the client side data object as well so other data changes won't cause this save to be reverted
                        if ($$(node) && $$(node).updateItem)
                           $$(node).updateItem(row.id, values);
                     } catch (err) {
                        node.classList.add("webix_invalid");
                        node.classList.add("webix_invalid_cell");

                        this.AB.notify.developer(err, {
                           context:
                              "ABFieldFile.onFileUpload(): Error updating our entry.",
                           row: row,
                           values: values,
                        });
                     }
                  }

                  // update value in the form component
                  this.setValue($$(node), values);
               },

               // if an error was returned
               onFileUploadError: (item, response) => {
                  this.AB.notify.developer(new Error("Error loading file"), {
                     message: "Error loading file",
                     response,
                  });
                  webixContainer.hideProgress();
               },
            },
         });
         uploader.addDropZone(webixContainer.$view);

         // store upload id into html element (it will be used in .customEdit)
         node.dataset["uploaderId"] = uploader.config.id;

         // open file upload dialog when's click
         node.addEventListener("click", (e) => {
            if (e.target.className.indexOf("delete-image") > -1) {
               this.deleteFile = true;
            }
         });
      }
   }

   /*
    * @function customEdit
    *
    * @param {object} row is the {name=>value} hash of the current row of data.
    * @param {App} App the shared ui App object useful more making globally
    *					unique id references.
    * @param {HtmlDOM} node  the HTML Dom object for this field's display.
    */
   customEdit(row, App, node) {
      if (this.deleteFile == true) {
         // remove the property because it is only needed to prevent the file dialog from showing
         delete this.deleteFile;

         // Ask the user if they really want to delete the photo
         webix.confirm({
            title: "",
            text: L("Are you sure you want to remove this file?"),
            callback: async (result) => {
               const confirmDelete = result ? 1 : 0;
               if (confirmDelete) {
                  // update just this value on our current object.model
                  const values = {};

                  values[this.columnName] = {};

                  if (row.id) {
                     try {
                        await this.object.model().update(row.id, values);

                        // update the client side data object as well so other data changes won't cause this save to be reverted
                        if ($$(node) && $$(node).updateItem)
                           $$(node).updateItem(row.id, values);
                     } catch (err) {
                        node.classList.add("webix_invalid");
                        node.classList.add("webix_invalid_cell");

                        this.AB.notify.developer(err, {
                           message: "Error updating our entry.",
                           row: row,
                           values: values,
                        });
                     }
                  }
                  // update value in the form component
                  else {
                     this.setValue($$(node), values);
                  }
               }
            },
         });
      } else {
         const rowData = this.dataValue(row);
         if (!rowData || !rowData.uuid) {
            const uploaderId = node.dataset["uploaderId"],
               uploader = $$(uploaderId);

            if (uploader && uploader.fileDialog)
               uploader.fileDialog({ rowid: row.id });
         }
      }

      return false;
   }

   /*
    * @funciton formComponent
    * returns a drag and droppable component that is used on the UI
    * interface builder to place form components related to this ABField.
    *
    * an ABField defines which form component is used to edit it's contents.
    * However, what is returned here, needs to be able to create an instance of
    * the component that will be stored with the ABViewForm.
    */
   formComponent() {
      return super.formComponent("fieldcustom");
   }

   detailComponent() {
      const detailComponentSetting = super.detailComponent();

      detailComponentSetting.common = () => {
         return {
            key: "detailcustom",
         };
      };

      return detailComponentSetting;
   }

   //File Template

   fileTemplate(obj, editable) {
      let iconDisplay = "";
      let fileDisplay = "display:none;";
      let fileURL = "";

      let value = "";
      let name = "";

      const rowData = this.dataValue(obj);
      if (rowData) {
         value = rowData.uuid;
         name = rowData.filename;
      }

      if (value && name) {
         iconDisplay = "display:none;";
         fileDisplay = "";
         fileURL = "/file/" + value;
      }

      const html = [
         `<div class="file-data-field-icon" style="text-align: center; height: inherit; display: table-cell; vertical-align: middle; border: 2px dotted #CCC; background: #FFF; border-radius: 10px; font-size: 11px; line-height: 13px; padding: 0 10px; ${iconDisplay}"><i class="fa fa-file fa-2x" style="opacity: 0.6; font-size: 32px; margin-top: 3px; margin-bottom: 5px;"></i>${
            editable ? `<br/>${L("Drag and drop or click here")}` : ""
         }</div>`,
         `<div class="file-data-field-name" style=" width:100%; height:100%; position:relative; "><a target="_blank" href="${fileURL}">${
            name || ""
         }</a>${
            editable
               ? `<a style="${fileDisplay}" class="ab-delete-photo" href="javascript:void(0);"><i class="fa fa-times delete-image"></i></a>`
               : ""
         }</div>`,
      ].join("");

      return html;
   }

   getValue(item, rowData) {
      const file = item.$view.querySelector(".file-data-field-name");
      const fileLink = file.querySelector("a");

      return {
         uuid: file.getAttribute("file-uuid"),
         filename: fileLink.innerHTML,
      };
   }

   setValue(item, rowData) {
      if (!item) return;

      const domNode = item.$view;
      if (!domNode) return;

      let val = null;
      if (rowData) {
         val = this.dataValue(rowData);

         // if (val == null) {
         // 	// assume they just sent us a single value
         // 	val = rowData;
         // }
      }

      const fileicon = domNode.querySelector(".file-data-field-icon");
      if (fileicon) fileicon.style.display = val && val.uuid ? "none" : "block";

      const file = domNode.querySelector(".file-data-field-name");
      if (file) {
         const fileDeleteIcon = file.querySelector(".ab-delete-photo");
         if (fileDeleteIcon)
            fileDeleteIcon.style.display = val && val.uuid ? "block" : "none";

         file.style.display = val && val.uuid ? "block" : "none";
         if (val && val.uuid) file.setAttribute("file-uuid", val.uuid);
         else file.removeAttribute("file-uuid");

         const fileLink = file.querySelector("a");
         const fileURL = "/file/" + (val ? val.uuid : "");
         fileLink.href = fileURL;
         fileLink.innerHTML = val ? val.filename : "";
      }
   }

   /**
    * @method urlUpload()
    * return the url for uploading a file.
    * When used in a webix widget, the response is different than our normal
    * API, so we can pass in a param to indicate a response compatible with
    * webix.
    * @param {bool} isWebix
    *        Is this url being used by a webix component?
    * @return {string}
    */
   urlUpload(isWebix = true) {
      return `/file/upload/${this.object.id}/${this.id}/${isWebix ? "1" : "0"}`;
   }

   /**
    * @method urlFile
    * return the url to use to reference the file by it's id.
    * @param {string} id uuid reference of this file.
    * @return {string}
    */
   urlFile(id) {
      return `/file/${id}`;
   }
};
