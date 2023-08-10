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
            },
            ids
         )
      );
   }

   ui() {
      const ids = this.ids;
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
                        let selectedIds = this.getSelectedId();
                        if (!Array.isArray(selectedIds))
                           selectedIds = [selectedIds];

                        // Unselect
                        if (e?.target?.className?.includes?.("unselect-page")) {
                           selectedIds = selectedIds.filter(
                              (pageId) => pageId != id
                           );
                        }
                        // Select
                        else if (
                           e?.target?.className?.includes?.("select-page")
                        ) {
                           selectedIds.push(id);
                        }
                        // Zoom
                        else if (e?.target?.className?.includes?.("pdf-zoom")) {
                           alert("TODO");
                        }

                        selectedIds = selectedIds.filter((pageId) => pageId);
                        if (selectedIds.length) this.select(selectedIds);
                        else this.unselectAll();
                     },
                  },
               },
               {
                  height: 10,
               },
               {
                  cols: [
                     {
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
                        view: "button",
                        css: "webix_primary",
                        type: "icon",
                        icon: "fa fa-floppy-o",
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

   async _readFileBuffer() {
      const _csvFileInfo = this._csvFileInfo;
      if (!_csvFileInfo || !_csvFileInfo.file)
         return Promise.resolve(new ArrayBuffer(0));

      return new Promise((resolve, reject) => {
         const fileReader = new FileReader();
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

   async loadFile() {
      this.clearDataview();

      const _csvFileInfo = this._csvFileInfo;
      if (!_csvFileInfo) return;

      const fileBuffer = await this._readFileBuffer();
      this._pdfDoc = await PDFJS.getDocument(fileBuffer).promise;

      const total_page = this._pdfDoc.numPages;
      const $dataview = $$(this.ids.dataview);
      for (let pageNumber = 1; pageNumber <= total_page; pageNumber++) {
         $dataview.add({
            id: pageNumber,
            pageNumber,
         });
      }
      this.renderPageImages();
   }

   clearDataview() {
      const $dataview = $$(this.ids.dataview);
      if (!$dataview) return;

      $dataview.clearAll();
   }

   removeFile(id) {
      $$(this.ids.uploadList)?.remove(id);

      delete this._pdfDoc;
      delete this._csvFileInfo;
      this.clearDataview();

      return true;
   }

   pageTemplateId(pageNumber) {
      return `pdf-importer-${this.view.id}-${pageNumber}`;
   }

   pageTemplate(item) {
      const $dataview = $$(this.ids.dataview);
      let selectedPageIds = $dataview.getSelectedId();
      if (!Array.isArray(selectedPageIds)) selectedPageIds = [selectedPageIds];

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
               this.pageWidth
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
         this.showPage(item.pageNumber);
      });
   }

   async showPage(pageNumber) {
      if (!this._pdfDoc) return;

      pageNumber = parseInt(pageNumber);
      const page = await this._pdfDoc.getPage(pageNumber);
      const canvas_pdf_page = document.querySelector(
         `#${this.pageTemplateId(pageNumber)}`
      );

      const pdf_original_width = page.getViewport({ scale: 1 }).width;
      const scale_required = canvas_pdf_page.width / pdf_original_width;

      // get viewport to render the page at required scale
      const viewport = page.getViewport({ scale: scale_required });
      canvas_pdf_page.height = viewport.height;

      page.render({
         canvasContext: canvas_pdf_page.getContext("2d"),
         viewport: viewport,
      });
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

   get pageWidth() {
      return this._isDisplayBig ? BIG_PAGE_WIDTH : SMALL_PAGE_WIDTH;
   }

   selectAll() {
      $$(this.ids.dataview)?.selectAll();
   }

   unselectAll() {
      $$(this.ids.dataview)?.unselectAll();
   }

   submit() {}
};
