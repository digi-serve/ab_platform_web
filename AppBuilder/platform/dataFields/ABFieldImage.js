const ABFieldImageCore = require("../../core/dataFields/ABFieldImageCore");

const L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABFieldImage extends ABFieldImageCore {
   constructor(values, object) {
      super(values, object);
   }

   ///
   /// Instance Methods
   ///

   /**
    * @function destroy
    * On a destroy operation, ask if the user wants to keep the related images.
    */
   async destroy() {
      return new Promise((resolve, reject) => {
         // verify we have been .save()d before:
         if (this.id) {
            // Ask the user what to do about the existing images:
            webix.confirm({
               title: L("Keep Images?"),
               message: L("Do you want to keep the images referenced by {0}?", [
                  this.label,
               ]),
               callback: async (result) => {
                  // update this setting so the server can respond correctly in
                  // ABFieldImage.migrateDrop()
                  this.settings.removeExistingData = result ? 0 : 1;

                  try {
                     await this.save();

                     // TODO: a reminder that you still got alot on the server to do!
                     webix.alert({
                        title: "!! TODO !!",
                        text:
                           "ABFieldImage.destroy(): Tell a Developer to actually pay attention to this!",
                     });

                     await super.destroy();

                     resolve();
                  } catch (err) {
                     reject(err);
                  }
               },
            });
         } else {
            resolve(); // nothing to do really
         }
      });
   }

   ///
   /// Working with Actual Object Values:
   ///

   idCustomContainer(obj, formId) {
      // if formId is passed the field is in a form view not a grid and
      // we won't have the obj and each time this
      // field is in a form it will conflict with the last one rendered
      if (formId) {
         return `${this.columnName.replace(/ /g, "_")}-${formId}-image`;
      } else {
         return `${this.columnName.replace(/ /g, "_")}-${obj.id}-image`;
      }
   }

   // return the grid column header definition for this instance of ABFieldImage
   columnHeader(options) {
      options = options || {};

      const config = super.columnHeader(options);
      const field = this;

      config.editor = false; // 'text';  // '[edit_type]'   for your unique situation
      // config.sort   = 'string' // '[sort_type]'   for your unique situation

      let containerHeight = "100%";
      let imageHeight = "100%";
      let width = "100%";
      let imageSrcHeight = "100%";
      if (field.settings.useWidth) {
         config.width = field.settings.imageWidth || 100;
         const heightVal =
            field.settings.useHeight && field.settings.imageHeight
               ? field.settings.imageHeight + 20
               : 80;
         containerHeight = `${heightVal} px`;
         width = `${field.settings.imageWidth || 100} px`;
         imageHeight =
            field.settings.useHeight && field.settings.imageHeight
               ? field.settings.imageHeight
               : 80;
         imageHeight = `${imageHeight} px`;
         imageSrcHeight =
            field.settings.useHeight && field.settings.imageHeight
               ? field.settings.imageHeight
               : 60;
         imageSrcHeight = `${imageSrcHeight} px`;
      }
      if (field.settings.useHeight) {
         containerHeight = parseInt(field.settings.imageHeight) + 20;
         containerHeight = `${containerHeight} px`;
         imageHeight = parseInt(field.settings.imageHeight);
         imageHeight = `${imageHeight} px`;
         imageSrcHeight = parseInt(field.settings.imageHeight);
         imageSrcHeight = `${imageSrcHeight} px`;
      }

      const editable = options.editable;

      // populate our default template:
      // debugger;
      config.template = (obj) => {
         if (obj.$group) return obj[this.columnName];

         const widthStyle = `width: ${width}; height: ${containerHeight}`;

         const imageStyle = `width: ${width}; height: ${imageHeight}`;

         const imgDiv = [
            `<div class="ab-image-data-field" style="${widthStyle}">`,
            `<div class="webix_view ab-image-holder" style="${imageStyle}">`,
            '<div class="webix_template">',
            this.imageTemplate(obj, {
               editable: editable,
               height: imageSrcHeight,
               width: width,
            }),
            "</div>",
            "</div>",
            "</div>",
         ].join("");

         return imgDiv;
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
    * @param {object} options - {
    * 		editable {Bool}   where or not this field is currently editable
    * 		formId {string}   the id of the presenting form if any
    * }
    */
   customDisplay(row, App, node, options) {
      // sanity check.
      if (!node) {
         return;
      }
      const L = App.Label;

      options = options || {};

      const idBase = App.unique(this.idCustomContainer(row, options.formId));

      // safety check:
      // webix seems to crash if you specify a .container that doesn't exists:
      // Note: when the template is first created, we don't have App.unique()
      const parentContainer = node.querySelector(".ab-image-holder");
      if (parentContainer) {
         parentContainer.innerHTML = "";
         // parentContainer.id = idBase;	// change it to the unique one.

         let imgHeight = 0;
         if (this.settings.useHeight) {
            imgHeight = parseInt(this.settings.imageHeight) || imgHeight;
         }

         let imgWidth = 0;
         if (this.settings.useWidth) {
            imgWidth = parseInt(this.settings.imageWidth) || imgWidth;
         }

         if (options.height) imgHeight = options.height;

         if (options.width) imgWidth = options.width;
         //// TODO: actually pay attention to the height and width when
         //// displaying the images.

         // use a webix component for displaying the content.
         // do this so I can use the progress spinner
         const webixContainer = webix.ui({
            view: "template",
            css: "ab-image-holder",
            // id: ids.container,
            container: parentContainer,

            template: this.imageTemplate(row, {
               editable: options.editable,
               height: imgHeight ? imgHeight + "px" : 0,
               width: imgWidth ? imgWidth + "px" : 0,
            }),

            borderless: true,
            height: imgHeight,
            width: imgWidth,
         });
         webix.extend(webixContainer, webix.ProgressBar);

         ////
         //// Prepare the Uploader
         ////

         if (!options.editable) {
            const domNode = parentContainer.querySelector(".deconste-image");
            if (domNode) domNode.style.display = "none";

            return;
         }

         const url = this.urlUpload();

         const uploader = webix.ui({
            view: "uploader",
            // id:ids.uploader,
            apiOnly: true,
            upload: url,
            inputName: "file",
            multiple: false,
            // formData:{
            // 	appKey:application.name,
            // 	permission:actionKey,
            // 	isWebix:true,
            // 	imageParam:'upload'
            // },
            on: {
               // when a file is added to the uploader
               onBeforeFileAdd: function (item) {
                  node.classList.remove("webix_invalid");
                  node.classList.remove("webix_invalid_cell");

                  // verify file type
                  const acceptabconstypes = [
                     "jpg",
                     "jpeg",
                     "bmp",
                     "png",
                     "gif",
                  ];
                  const type = item.type.toLowerCase();
                  if (acceptabconstypes.indexOf(type) == -1) {
                     webix.message(
                        L("Only [{0}] images are supported", [
                           acceptabconstypes.join(", "),
                        ])
                     );
                     return false;
                  }

                  // start progress indicator
                  webixContainer.showProgress({
                     type: "icon",
                     delay: 2000,
                  });
               },

               // when upload is compconste:
               onFileUpload: async (item, response) => {
                  webixContainer.hideProgress();
                  this.showImage(response.data.uuid, node);

                  // TODO: deconste previous image from our OPsPortal service?

                  const values = {};
                  values[this.columnName] = response.data.uuid;

                  // update just this value on our current object.model
                  if (row.id) {
                     try {
                        await this.object.model().update(row.id, values);

                        // update the client side data object as well so other data changes won't cause this save to be reverted
                        if (
                           $$(node) &&
                           $$(node).getItem &&
                           $$(node).getItem(row.id)
                        ) {
                           $$(node).updateItem(row.id, values);
                        } else {
                           // if you scroll the table the connection to the datatable is lost so we need to find it again
                           const dataTable = document.querySelector(
                              ".webix_dtable"
                           );
                           if ($$(dataTable) && $$(dataTable).getItem(row.id))
                              $$(dataTable).updateItem(row.id, values);
                        }
                     } catch (err) {
                        node.classList.add("webix_invalid");
                        node.classList.add("webix_invalid_cell");

                        this.AB.notify.developer(err, {
                           context:
                              "ABFieldImage.onFileUpload(): model.update(): error updating our entry",
                           field: this,
                           row,
                           values,
                        });
                     }
                  }

                  // update value in the form component
                  this.setValue($$(node), values);
               },

               // if an error was returned
               onFileUploadError: (item, response) => {
                  this.AB.notify.developer(new Error("Error uploading image"), {
                     context: "ABFieldImage. uploader. onFileUploadError():",
                     field: this,
                     response,
                  });
                  webixContainer.hideProgress();
               },
            },
         });
         uploader.addDropZone(webixContainer.$view);

         // store upload id into html element (it will be used in .customEdit)
         node.dataset["uploaderId"] = uploader.config.id;

         // if we are working in a datagrid we need to add a click event to
         // check if the user is clicking on the deconste button
         if (node.className == "webix_cell") {
            node.addEventListener("click", (e) => {
               if (e.target.className.indexOf("deconste-image") > -1) {
                  this.deconsteImage = true;
               }
            });
         }
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
   customEdit(row, App, node, id, evt) {
      if (
         (evt && evt.target.className.indexOf("deconste-image") > -1) ||
         this.deconsteImage
      ) {
         delete this.deconsteImage;
         if (!row.removeDefaultImage) {
            row.removeDefaultImage = [];
         }
         row.removeDefaultImage[this.columnName] = true;

         // Ask the user if they really want to deconste the photo
         webix.confirm({
            title: "",
            message: L("Are you sure you want to remove this image?"),
            callback: async (result) => {
               const confirmDeconste = result ? 1 : 0;
               if (confirmDeconste) {
                  // update just this value on our current object.model
                  const values = {};
                  values[this.columnName] = ""; // removing the reference to the image here

                  try {
                     await this.object.model().update(row.id, values);

                     // update the client side data object as well so other data changes won't cause this save to be reverted
                     if ($$(node) && $$(node).updateItem)
                        $$(node).updateItem(row.id, values);

                     // update value in the form component
                     this.setValue($$(node), values);
                  } catch (err) {
                     node.classList.add("webix_invalid");
                     node.classList.add("webix_invalid_cell");

                     this.AB.notify.developer(err, {
                        context:
                           "ABFieldImage: customEdit(): Error updating our entry",
                        field: this,
                        row: row,
                        values: values,
                     });
                  }
               }
            },
         });
      } else {
         const uploaderId = node.dataset["uploaderId"],
            uploader = $$(uploaderId);

         if (uploader && uploader.fileDialog)
            uploader.fileDialog({ rowid: row.id });
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
            key: "detailimage",
         };
      };

      return detailComponentSetting;
   }

   imageTemplate(obj, options) {
      options = options || {};
      options.height = options.height || "100%";
      options.width = options.width || "100%";

      // deault view is icon:
      let iconDisplay = "";
      let imageDisplay = "display:none";
      let imageURL = "";

      let value = "";
      let isRemoveDefaultImage = false;
      if (obj[this.columnName]) {
         value = obj[this.columnName];
      }
      if (obj.removeDefaultImage) {
         if (obj.removeDefaultImage[this.columnName]) {
            isRemoveDefaultImage = obj.removeDefaultImage[this.columnName];
         }
      }

      if (value) {
         iconDisplay = "display:none";
         imageDisplay = "";
         imageURL = `background-image:url('${this.urlImage(value)}');`;
      } else {
         if (this.settings.useDefaultImage && !isRemoveDefaultImage) {
            iconDisplay = "display:none";
            imageDisplay = "";
            imageURL = `background-image:url('${this.urlImage(
               this.settings.defaultImageUrl
            )}');`;
         }
      }

      let html = [
         `<div class="image-data-field-icon" style="${iconDisplay}"><i class="fa fa-picture-o fa-2x"></i>#drag#</div>` +
            `<div class="image-data-field-image" style="${imageDisplay} width:${options.width}; height:${options.height}; ${imageURL}">#remove#</div>`,
      ].join("");

      html = html.replace(
         "#drag#",
         options.editable
            ? `<div>${L("Drag and drop or click here")}</div>`
            : ""
      );
      html = html.replace(
         "#remove#",
         options.editable
            ? `<a style="${imageDisplay}" class="ab-deconste-photo" href="javascript:void(0);"><i class="fa fa-times deconste-image"></i></a>`
            : ""
      );

      return html;
   }

   showImage(uuid, node) {
      const parentContainer = node.querySelector(".ab-image-holder");
      if (parentContainer) {
         parentContainer.querySelector(".image-data-field-icon").style.display =
            "none";
         const image = parentContainer.querySelector(".image-data-field-image");
         image.style.display = "";
         image.style.backgroundImage = `url('${this.urlImage(uuid)}')`;
         image.setAttribute("image-uuid", uuid);
      }
   }

   getValue(item, rowData) {
      const image = item.$view.querySelector(".image-data-field-image");
      return image.getAttribute("image-uuid");
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

      const imageIcon = domNode.querySelector(".image-data-field-icon");
      if (imageIcon) imageIcon.style.display = val ? "none" : "";

      const image = domNode.querySelector(".image-data-field-image");
      if (image) {
         const imageDeconsteIcon = image.querySelector(".ab-deconste-photo");
         if (imageDeconsteIcon)
            imageDeconsteIcon.style.display = val ? "block" : "none";

         image.style.display = val ? "block" : "none";

         if (val) {
            image.style.backgroundImage = `url('${this.urlImage(val)}')`;
            image.setAttribute("image-uuid", val);
         } else {
            image.removeAttribute("image-uuid");
         }
      }
   }

   /**
    * @method toBase64
    *
    * @param {Object} rowData
    *
    * @return {Promise} - {
    * 		data: string,
    * 		width: number,
    * 		height: number
    * }
    */
   toBase64(rowData) {
      const promise = new Promise((resolve, reject) => {
         if (!rowData[this.columnName]) return resolve(null);

         const img = new Image();
         img.crossOrigin = "Anonymous";
         img.onerror = function (err) {
            reject(err);
         };
         img.onload = function () {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL();
            const imageData = {
               data: dataURL,
               width: img.width,
               height: img.height,
            };
            resolve(imageData);
         };

         img.src = this.urlImage(rowData[this.columnName]);
      });
      return promise;
   }

   /**
    * @method urlImage()
    * return the url to use to reference the image by it's id.
    * @param {string} id
    *        the file.uuid reference of this image.
    * @return {string}
    */
   urlImage(id) {
      return `/file/${id}`;
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
};
