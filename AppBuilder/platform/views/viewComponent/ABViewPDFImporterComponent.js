const PDFJS = require("pdfjs-dist");
const ABViewComponent = require("./ABViewComponent").default;

const SMALL_PAGE_WIDTH = 150;
const BIG_PAGE_WIDTH = 250;

module.exports = class ABViewPDFImporterComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewPDFImporter_${baseView.id}`,
         Object.assign(
            {
               fileUploader: "",
               uploadList: "",
               dataview: "",
               fullImagePopup: "",
               fullImageCarousel: "",
               fullImageSelectToggle: "",
               fullImageLabel: "",
               selectAll: "",
               unselectAll: "",
               submit: "",
            },
            ids
         )
      );
   }

   ui() {
      const ids = this.ids;
      const self = this;
      const _ui = super.ui([
         {
            rows: [
               {
                  cols: [
                     {
                        id: ids.fileUploader,
                        view: "uploader",
                        name: "records",
                        link: ids.uploadList,
                        label: this.label("Upload a PDF file"),
                        inputWidth: 200,
                        width: 210,
                        accept: "application/pdf",
                        multiple: false,
                        autosend: false,
                        type: "icon",
                        icon: "fa fa-file-pdf-o",
                        on: {
                           onBeforeFileAdd: (fileInfo) => {
                              this._csvFileInfo = fileInfo;
                              if (!this._csvFileInfo) return false;

                              this.loadFile();

                              return true;
                           },
                        },
                     },
                     {
                        id: ids.uploadList,
                        view: "list",
                        type: "uploader",
                        autoheight: true,
                        borderless: true,
                        onClick: {
                           webix_remove_upload: (e, id) => {
                              this.removeFile(id);
                           },
                        },
                     },
                     {
                        width: 10,
                     },
                     {
                        view: "button",
                        type: "icon",
                        icon: "fa fa-th-large",
                        maxWidth: 30,
                        click: () => {
                           this.displayBig();
                        },
                     },
                     {
                        view: "button",
                        type: "icon",
                        icon: "fa fa-th",
                        maxWidth: 30,
                        click: () => {
                           this.displaySmall();
                        },
                     },
                  ],
               },
               {
                  height: 10,
               },
               {
                  id: ids.dataview,
                  view: "dataview",
                  borderless: true,
                  css: "pdf-data-view",
                  multiselect: false,
                  select: false,
                  type: {
                     template: (item) => {
                        return this.pageTemplate(item);
                     },
                     width: "auto",
                     height: "auto",
                  },
                  on: {
                     onSelectChange: (pageIds) => {
                        this.renderPageImages();
                     },
                     onItemClick: function (id, e, node) {
                        // Unselect
                        if (e?.target?.className?.includes?.("unselect-page")) {
                           this.unselect(id);
                        }
                        // Select
                        else if (
                           e?.target?.className?.includes?.("select-page")
                        ) {
                           this.select(id);
                        }
                        // Zoom
                        else if (e?.target?.className?.includes?.("pdf-zoom")) {
                           self._fullImagePopup.show();
                           $$(self.ids.fullImageCarousel).setActiveIndex(
                              parseInt(id ?? 0) - 1
                           );
                           self.refreshFullImage();
                        }
                     },
                  },
               },
               {
                  height: 10,
               },
               {
                  cols: [
                     {
                        id: ids.selectAll,
                        view: "button",
                        type: "icon",
                        icon: "fa fa-check-square-o",
                        maxWidth: 160,
                        label: this.label("Select All"),
                        click: () => {
                           this.selectAll();
                        },
                     },
                     {
                        id: ids.unselectAll,
                        view: "button",
                        type: "icon",
                        icon: "fa fa-square-o",
                        maxWidth: 160,
                        label: this.label("Unselect All"),
                        click: () => {
                           this.unselectAll();
                        },
                     },
                     {
                        fillspace: true,
                     },
                     {
                        id: ids.submit,
                        view: "button",
                        css: "webix_primary",
                        type: "icon",
                        icon: "fa fa-floppy-o",
                        disabled: true,
                        maxWidth: 180,
                        label: this.label("Submit"),
                        click: () => {
                           this.submit();
                        },
                     },
                  ],
               },
            ],
         },
      ]);

      return _ui;
   }

   uiPopup() {
      const ids = this.ids;
      return {
         id: ids.fullImagePopup,
         view: "window",
         modal: true,
         position: "center",
         headHeight: 25,
         head: {
            cols: [
               { fillspace: true },
               {
                  view: "button",
                  type: "icon",
                  icon: "fa fa-times",
                  maxWidth: 25,
                  height: 25,
                  click: () => {
                     $$(ids.fullImagePopup)?.hide();
                  },
               },
            ],
         },
         body: {
            rows: [
               {
                  id: ids.fullImageCarousel,
                  view: "carousel",
                  width: 600,
                  height: 500,
                  navigation: {
                     items: true,
                     buttons: true,
                     type: "side",
                  },
                  cols: [],
                  on: {
                     onShow: () => {
                        this.refreshFullImage();
                     },
                  },
               },
               {
                  view: "layout",
                  cols: [
                     {
                        id: ids.fullImageSelectToggle,
                        view: "toggle",
                        type: "icon",
                        offIcon: "fa fa-square-o",
                        onIcon: "fa fa-check-square-o",
                        offLabel: this.label("Unselected"),
                        onLabel: this.label("Selected"),
                        width: 130,
                        on: {
                           onChange: (isSelected) => {
                              const activeIndex = $$(
                                 this.ids.fullImageCarousel
                              ).getActiveIndex();
                              const pageNumber = activeIndex + 1;

                              if (isSelected) this.select(pageNumber);
                              else this.unselect(pageNumber);
                           },
                        },
                     },
                     {
                        fillspace: true,
                     },
                     {
                        id: ids.fullImageLabel,
                        view: "label",
                        width: 120,
                        label: `${this.label("Page Number")}: ${"#"}`,
                     },
                  ],
               },
            ],
         },
      };
   }

   async init(AB) {
      await super.init(AB);

      const $dataview = $$(this.ids.dataview);
      if ($dataview) this.AB.Webix.extend($dataview, webix.ProgressBar);

      if (!this._fullImagePopup) {
         const fullImagePopup = this.uiPopup();
         this._fullImagePopup = this.AB.Webix.ui(fullImagePopup);
      }
   }

   async _readFileBuffer() {
      const _csvFileInfo = this._csvFileInfo;
      if (!_csvFileInfo || !_csvFileInfo.file)
         return Promise.resolve(new ArrayBuffer(0));

      const fileReader = new FileReader();

      return new Promise((resolve, reject) => {
         fileReader.onload = (event) => {
            const fileBuffer = event.target.result;
            resolve(fileBuffer);
         };
         fileReader.onerror = (event) => {
            reject(event);
         };
         fileReader.readAsArrayBuffer(_csvFileInfo.file);
      });
   }

   async _toBlob(pageNumber, canvas) {
      if (!canvas) return;

      return new Promise((resolve, reject) => {
         canvas.toBlob((blob) => {
            const file = new File([blob], `${pageNumber}.png`, {
               type: "image/png",
            });

            resolve(file);
         }, "image/png");
      });
   }

   async _uploadImage(pageNumber) {
      // Create a temporary CANVAS dom to render page image with specify the height
      const $carousel = $$(this.ids.fullImageCarousel);
      const canvasId = `${this.view.id}_temp_canvas`;
      const canvas =
         document.getElementById(canvasId) ?? document.createElement("canvas");
      canvas.id = canvasId;
      canvas.width = $carousel.config.width - 20;

      await this.showPage(pageNumber, canvas);
      const fileBlob = await this._toBlob(pageNumber, canvas);

      return new Promise((resolve, reject) => {
         // Create a uploader to upload images
         const $uploader = this.AB.Webix.ui({
            view: "uploader",
            apiOnly: true,
            upload: this.field.urlUpload(),
            inputName: "file",
            multiple: false,
            on: {
               // when upload is complete:
               onFileUpload: (item, response) => {
                  // RETURN HERE
                  resolve(response?.data?.uuid);
                  $uploader.destructor();
               },
               // if an error was returned
               onFileUploadError: (item, response) => {
                  reject(response);
               },
            },
         });

         $uploader.addFile(fileBlob, fileBlob.size);
      });
   }

   _increaseProgressValue() {
      const $dataview = $$(this.ids.dataview);
      const maxProgressStep = ($dataview.getSelectedId(true) ?? []).length * 2;

      this._progressSteps = this._progressSteps ?? 0;
      this._progressSteps++;

      $dataview?.showProgress?.({
         type: "bottom",
         position: this._progressSteps / maxProgressStep,
      });
   }

   async loadFile() {
      this.clearDataview();

      const _csvFileInfo = this._csvFileInfo;
      if (!_csvFileInfo) return;

      const fileBuffer = await this._readFileBuffer();
      this._pdfDoc = await PDFJS.getDocument(fileBuffer).promise;

      const total_page = this._pdfDoc.numPages;
      const $dataview = $$(this.ids.dataview);
      const $carousel = $$(this.ids.fullImageCarousel);
      const carousel_list = [];
      for (let pageNumber = 1; pageNumber <= total_page; pageNumber++) {
         $dataview.add({
            id: pageNumber,
            pageNumber,
         });

         carousel_list.push({
            template: (item) => {
               return this.fullImageTemplate(item);
            },
            data: {
               pageNumber,
            },
         });
      }

      this.renderPageImages();
      if ($carousel) this.AB.Webix.ui(carousel_list, $carousel);

      $$(this.ids.submit)?.enable();
   }

   removeFile(id) {
      $$(this.ids.uploadList)?.remove(id);

      delete this._pdfDoc;
      delete this._csvFileInfo;
      this.clearDataview();

      $$(this.ids.submit)?.disable();

      return true;
   }

   pageTemplateId(pageNumber) {
      return `pdf-importer-${this.view.id}-${pageNumber}`;
   }

   pageTemplate(item) {
      const $dataview = $$(this.ids.dataview);
      let selectedPageIds = $dataview.getSelectedId(true);

      return `
      <div>
         <div class="pdf-data-view-item">
            <div>
            ${
               selectedPageIds.filter((pageId) => pageId == item.id).length
                  ? '<i class="unselect-page fa fa-check-square-o"></i>'
                  : '<i class="select-page fa fa-square-o"></i>'
            }
            </div>
            <div style="width: 15px;">
               ${item.pageNumber}
            </div>
         </div>
         <div class="pdf-zoom pdf-data-view-image">
            <canvas class="pdf-zoom" width="${
               this.pageItemWidth
            }" id="${this.pageTemplateId(item.pageNumber)}"></canvas>
            <div class="pdf-zoom pdf-data-view-image-icon">
               <i class="pdf-zoom fa fa-search-plus fa-4x"></i>
            </div>
         </div>
      </div>
      `;
   }

   renderPageImages() {
      const $dataview = $$(this.ids.dataview);
      $dataview?.find({}).forEach((item) => {
         const canvas_dom = document.querySelector(
            `#${this.pageTemplateId(item.pageNumber)}`
         );
         this.showPage(item.pageNumber, canvas_dom);
      });
   }

   async showPage(pageNumber, canvas_dom) {
      if (!this._pdfDoc) return;

      pageNumber = parseInt(pageNumber);
      const page = await this._pdfDoc.getPage(pageNumber);
      const pdf_original_width = page.getViewport({ scale: 1 }).width;
      const scale_required = canvas_dom.width / pdf_original_width;

      // get viewport to render the page at required scale
      const viewport = page.getViewport({ scale: scale_required });
      canvas_dom.height = viewport.height;

      return page.render({
         canvasContext: canvas_dom.getContext("2d"),
         viewport: viewport,
      }).promise;
   }

   clearDataview() {
      const $dataview = $$(this.ids.dataview);
      const $carousel = $$(this.ids.fullImageCarousel);

      $dataview?.clearAll();
      if ($carousel)
         this.AB.Webix.ui(
            [
               {
                  view: "label",
                  align: "center",
                  height: $carousel.height,
                  label: this.label("No image"),
               },
            ],
            $carousel
         );
   }

   displaySmall() {
      this._isDisplayBig = false;
      $$(this.ids.dataview)?.render();
      this.renderPageImages();
   }

   displayBig() {
      this._isDisplayBig = true;
      $$(this.ids.dataview)?.render();
      this.renderPageImages();
   }

   get pageItemWidth() {
      return this._isDisplayBig ? BIG_PAGE_WIDTH : SMALL_PAGE_WIDTH;
   }

   select(pageNumber) {
      const $dataview = $$(this.ids.dataview);

      let selectedIds = $dataview.getSelectedId(true);

      selectedIds.push(pageNumber);
      selectedIds = selectedIds.filter((pageId) => pageId);

      if (selectedIds.length) $dataview.select(selectedIds);
      else $dataview.unselectAll();
   }

   unselect(pageNumber) {
      const $dataview = $$(this.ids.dataview);

      let selectedIds = $dataview.getSelectedId(true);

      selectedIds = selectedIds.filter(
         (pageId) => pageId && pageId != pageNumber
      );

      if (selectedIds.length) $dataview.select(selectedIds);
      else $dataview.unselectAll();
   }

   selectAll() {
      $$(this.ids.dataview)?.selectAll();
   }

   unselectAll() {
      $$(this.ids.dataview)?.unselectAll();
   }

   fullImageTemplateId(pageNumber) {
      return `${this.pageTemplateId(pageNumber)}_full_size`;
   }

   fullImageTemplate(item) {
      const $carousel = $$(this.ids.fullImageCarousel);
      return `<canvas width="${
         $carousel.config.width - 20
      }" id="${this.fullImageTemplateId(item.pageNumber)}"></canvas>`;
   }

   refreshFullImage() {
      const ids = this.ids;
      const activeIndex = $$(ids.fullImageCarousel).getActiveIndex();
      const pageNumber = activeIndex + 1;
      const canvas_dom = document.querySelector(
         `#${this.fullImageTemplateId(pageNumber)}`
      );
      this.showPage(pageNumber, canvas_dom);

      const selectedPageIds = $$(ids.dataview).getSelectedId(true);
      const isSelected =
         selectedPageIds.filter((pageId) => pageId == pageNumber).length > 0;
      $$(ids.fullImageSelectToggle).setValue(isSelected);

      $$(ids.fullImageLabel).setValue(
         `${this.label("Page Number")}: ${pageNumber}`
      );
   }

   get dataCollection() {
      return this.AB.datacollectionByID(this.view.settings?.dataviewID || "");
   }

   get object() {
      return this.dataCollection?.datasource;
   }

   get field() {
      return this.object?.fields?.(
         (f) => f.id == this.view.settings.fieldID
      )[0];
   }

   busy() {
      const ids = this.ids;

      const $fileUploader = $$(ids.fileUploader);
      const $uploadList = $$(ids.uploadList);
      const $dataview = $$(ids.dataview);
      const $submit = $$(ids.submit);
      const $selectAll = $$(ids.selectAll);
      const $unselectAll = $$(ids.unselectAll);
      const $selectToggle = $$(ids.fullImageSelectToggle);

      $fileUploader?.disable();
      $uploadList?.disable();
      $submit?.disable();
      $selectAll?.disable();
      $unselectAll?.disable();
      $selectToggle?.disable();
      $dataview?.showProgress?.({
         type: "bottom",
         position: 0.001,
      });
   }

   ready() {
      const ids = this.ids;

      const $fileUploader = $$(ids.fileUploader);
      const $uploadList = $$(ids.uploadList);
      const $dataview = $$(ids.dataview);
      const $submit = $$(ids.submit);
      const $selectAll = $$(ids.selectAll);
      const $unselectAll = $$(ids.unselectAll);
      const $selectToggle = $$(ids.fullImageSelectToggle);

      $fileUploader?.enable();
      $uploadList?.enable();
      $submit?.enable();
      $selectAll?.enable();
      $unselectAll?.enable();
      $selectToggle?.enable();
      $dataview?.hideProgress?.();

      delete this._progressSteps;
   }

   async submit() {
      const field = this.field;
      if (!this._pdfDoc || !field) return;

      this.busy();

      const ids = this.ids;
      const $dataview = $$(ids.dataview);
      const selectedPageIds = $dataview.getSelectedId(true) ?? [];
      const model = field.object.model();
      const dcLink = this.dataCollection.datacollectionLink;

      for (let i = 0; i < selectedPageIds.length; i++) {
         const pageNumber = selectedPageIds[i];
         if (pageNumber == null || pageNumber == "") return;

         const uploadId = await this._uploadImage(pageNumber);

         this._increaseProgressValue();

         // Insert Data
         const values = field.object.defaultValues();
         values[field.columnName] = uploadId;

         // Set linked data from the parent DC
         const linkValues = dcLink?.getCursor();
         if (linkValues) {
            const objectLink = dcLink?.datasource;

            const connectFields = field.object.connectFields();
            connectFields.forEach((f) => {
               if (
                  objectLink.id == f.settings.linkObject &&
                  values[f.columnName] === undefined
               ) {
                  const linkColName = f.indexField
                     ? f.indexField.columnName
                     : objectLink.PK();

                  values[f.columnName] = {};
                  values[f.columnName][linkColName] =
                     linkValues[linkColName] ?? linkValues.id;
               }
            });
         }

         await model.create(values);

         this._increaseProgressValue();
      }

      this.ready();
   }
};
