import ABViewComponent from "./ABViewComponent";

export default class ABViewCarouselComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewCarousel_${baseView.id}`,
         Object.assign(
            {
               carousel: "",
            },
            ids
         )
      );

      this._handler_doOnShow = () => {
         this.onShow();
      };

      this._handler_doReload = () => {
         // this.datacollection?.reloadData();
      };

      this._handler_doFilter = (fnFilter, filterRules) => {
         // NOTE: fnFilter is depreciated and will be removed.

         // this.onShow(filterRules);
         const dv = this.datacollection;

         if (!dv) return;

         dv.filterCondition(filterRules);
         dv.reloadData();
      };

      this._handler_busy = () => {
         this.busy();
      };

      this._handler_ready = () => {
         this.ready();
      };
   }

   ui() {
      const ids = this.ids;

      const baseView = this.view;

      this.filterUI = baseView.filterHelper; // component(/* App, idBase */);
      this.linkPage = baseView.linkPageHelper.component(/* App, idBase */);

      const spacer = {};
      const settings = this.settings;

      if (settings.width === 0)
         Object.assign(spacer, {
            width: 1,
         });

      const _ui = super.ui([
         {
            borderless: true,
            cols: [
               spacer, // spacer
               {
                  borderless: true,
                  rows: [
                     this.filterUI.ui(), // filter UI
                     {
                        id: ids.carousel,
                        view: "carousel",
                        cols: [],
                        width: settings.width,
                        height: settings.height,
                        navigation: {
                           items: !settings.hideItem,
                           buttons: !settings.hideButton,
                           type: settings.navigationType,
                        },
                        on: {
                           onShow: () => {
                              const activeIndex = $$(
                                 ids.carousel
                              ).getActiveIndex();

                              this.switchImage(activeIndex);
                           },
                        },
                     },
                  ],
               },
               spacer, // spacer
            ],
         },
      ]);

      delete _ui.type;

      return _ui;
   }

   // make sure each of our child views get .init() called
   async init(AB) {
      await super.init(AB);

      const dv = this.datacollection;

      if (!dv) {
         AB.notify.builder(`Datacollection is ${dv}`, {
            message: "This is an invalid datacollection",
         });

         return;
      }

      const object = dv.datasource;

      if (!object) {
         AB.notify.developer(`Object is ${dv}`, {
            message: "This is an invalid object",
         });

         return;
      }

      dv.removeListener("loadData", this._handler_doOnShow);
      dv.on("loadData", this._handler_doOnShow);

      dv.removeListener("update", this._handler_doReload);
      dv.on("update", this._handler_doReload);

      dv.removeListener("delete", this._handler_doReload);
      dv.on("delete", this._handler_doReload);

      dv.removeListener("create", this._handler_doReload);
      dv.on("create", this._handler_doReload);

      dv.removeListener("initializingData", this._handler_busy);
      dv.on("initializingData", this._handler_busy);

      dv.removeListener("initializedData", this._handler_ready);
      dv.on("initializedData", this._handler_ready);

      if (this.settings.filterByCursor) {
         dv.removeListener("changeCursor", this._handler_doOnShow);
         dv.on("changeCursor", this._handler_doOnShow);
      }

      const baseView = this.view;

      // filter helper
      baseView.filterHelper.objectLoad(object);
      baseView.filterHelper.viewLoad(this);

      this.filterUI.init(this.AB);
      this.filterUI.removeListener("filter.data", this._handler_doFilter);
      this.filterUI.on("filter.data", this._handler_doFilter);

      // link page helper
      this.linkPage.init({
         view: baseView,
         datacollection: dv,
      });

      // set data-cy
      const $carouselView = $$(this.ids.carousel)?.$view;

      if ($carouselView) {
         $carouselView.setAttribute(
            "data-cy",
            `${baseView.key} ${baseView.id}`
         );
         $carouselView
            .querySelector(".webix_nav_button_prev")
            ?.firstElementChild?.setAttribute(
               "data-cy",
               `${baseView.key} button previous ${baseView.id}`
            );
         $carouselView
            .querySelector(".webix_nav_button_next")
            ?.firstElementChild?.setAttribute(
               "data-cy",
               `${baseView.key} button next ${baseView.id}`
            );
      }
   }

   /**
    * @method detatch()
    * Will make sure all our handlers are removed from any object
    * we have attached them to.
    *
    * You'll want to call this in situations when we are dynamically
    * creating and recreating instances of the same Widget (like in
    * the ABDesigner).
    */
   detatch() {
      const dv = this.datacollection;

      if (!dv) return;

      dv.removeListener("loadData", this._handler_doOnShow);

      if (this._handler_doReload) {
         dv.removeListener("update", this._handler_doReload);
         dv.removeListener("delete", this._handler_doReload);
         dv.removeListener("create", this._handler_doReload);
      }

      dv.removeListener("initializingData", this._handler_busy);

      dv.removeListener("initializedData", this._handler_ready);

      if (this.settings.filterByCursor)
         dv.removeListener("changeCursor", this._handler_doOnShow);

      this.filterUI.removeListener("filter.data", this._handler_doOnShow);
   }

   myTemplate(row) {
      if (row?.src) {
         const settings = this.settings;

         return `<div class="ab-carousel-image-container">
            <link rel="preload" href="${
               row.src
            }" as="image" fetchpriotity="low"/>
            <img id="${this.ids.component}-${row.id}" src="${
            row.src
         }" class="content" ondragstart="return false" loading="lazy" />
            ${
               settings.showLabel
                  ? `<div class="ab-carousel-image-title">${
                       row.label || ""
                    }</div>`
                  : ""
            }
            <div class="ab-carousel-image-icon">
            ${
               settings.detailsPage || settings.detailsTab
                  ? `<span ab-row-id="${row.id}" class="ab-carousel-detail webix_icon fa fa-eye"></span>`
                  : ""
            }
            ${
               settings.editPage || settings.editTab
                  ? `<span ab-row-id="${row.id}" class="ab-carousel-edit webix_icon fa fa-pencil"></span>`
                  : ""
            }
            <span class="webix_icon ab-carousel-zoom-in fa fa-search-plus"></span>
            <span class="webix_icon ab-carousel-zoom-out fa fa-search-minus"></span>
                  <span ab-row-id="${row.id}" ab-img-file="${
            row.imgFile
         }" class="webix_icon ab-carousel-rotate-left fa fa-rotate-left"></span>
               <span ab-row-id="${row.id}" ab-img-file="${
            row.imgFile
         }" class="webix_icon ab-carousel-rotate-right fa fa-rotate-right"></span>
               <span class="webix_icon ab-carousel-fullscreen fa fa-arrows-alt"></span>
               <span style="display: none;" class="webix_icon ab-carousel-exit-fullscreen fa fa-times"></span>
            </div>
         </div>`;
      }
      // empty image
      else return "";
   }

   busy() {
      const $carousel = $$(this.ids.carousel);

      $carousel?.disable();
      $carousel?.showProgress?.({ type: "icon" });
   }

   ready() {
      const $carousel = $$(this.ids.carousel);

      $carousel?.enable();
      $carousel?.hideProgress?.();
   }

   async switchImage(currentPosition) {
      const dv = this.datacollection;

      if (!dv) return;

      // Check want to load more images
      if (
         currentPosition >= this._imageCount - 1 && // check last image
         dv.totalCount > this._rowCount
      ) {
         // loading cursor
         this.busy();

         try {
            await dv.loadData(this._rowCount || 0);
         } catch (err) {
            this.AB.notify.developer(err, {
               message:
                  "ABViewCarousel:switchImage():Error when load data from a Data collection",
            });
         }

         this.ready();
      }
   }

   onShow(fnFilter = this.filterUI.getFilter()) {
      const ids = this.ids;
      const dv = this.datacollection;

      if (!dv) return;

      const obj = dv.datasource;

      if (!obj) return;

      const field = this.view.imageField;

      if (!field) return;

      if (dv.dataStatus == dv.dataStatusFlag.notInitial) {
         // load data when a widget is showing
         dv.loadData();

         // it will call .onShow again after dc loads completely
         return;
      }

      const settings = this.settings;

      let rows = dv.getData(fnFilter);

      // Filter images by cursor
      if (settings.filterByCursor) {
         const cursor = dv.getCursor();

         if (cursor)
            rows = rows.filter(
               (r) =>
                  (r[obj.PK()] || r.id || r) ===
                  (cursor[obj.PK()] || cursor.id || cursor)
            );
      }

      const images = [];

      rows.forEach((r) => {
         const imgFile = r[field.columnName];

         if (imgFile) {
            const imgData = {
               id: r.id,
               src: `/file/${imgFile}`,
               imgFile,
            };

            // label of row data
            if (settings.showLabel) imgData.label = obj.displayData(r);

            images.push({
               css: "image",
               borderless: true,
               template: (...params) => {
                  return this.myTemplate(...params);
               },
               data: imgData,
            });
         }
      });

      const ab = this.AB;

      // insert the default image to first item
      if (field.settings.defaultImageUrl)
         images.unshift({
            css: "image",
            template: (...params) => this.myTemplate(...params),
            data: {
               id: ab.uuid(),
               src: `/file/${field.settings.defaultImageUrl}`,
               label: this.label("Default image"),
            },
         });

      // empty image
      if (images.length < 1)
         images.push({
            rows: [
               {
                  view: "label",
                  align: "center",
                  height: settings.height,
                  label: "<div style='display: block; font-size: 180px; background-color: #666; color: transparent; text-shadow: 0px 1px 1px rgba(255,255,255,0.5); -webkit-background-clip: text; -moz-background-clip: text; background-clip: text;' class='fa fa-picture-o'></div>",
               },
               {
                  view: "label",
                  align: "center",
                  label: this.label("No image"),
               },
            ],
         });

      // store total of rows
      this._rowCount = rows.length;

      // store total of images
      this._imageCount = images.length;

      const $carousel = $$(ids.carousel);
      const abWebix = ab.Webix;

      if ($carousel) {
         // re-render
         abWebix.ui(images, $carousel);

         // add loading cursor
         abWebix.extend($carousel, abWebix.ProgressBar);

         // link pages events
         const editPage = settings.editPage;
         const detailsPage = settings.detailsPage;

         // if (detailsPage || editPage) {
         $carousel.$view.onclick = async (e) => {
            if (e.target.className) {
               if (e.target.className.indexOf("ab-carousel-edit") > -1) {
                  abWebix.html.removeCss($carousel.getNode(), "fullscreen");
                  abWebix.fullscreen.exit();
                  let rowId = e.target.getAttribute("ab-row-id");
                  this.linkPage.changePage(editPage, rowId);
               } else if (
                  e.target.className.indexOf("ab-carousel-detail") > -1
               ) {
                  abWebix.html.removeCss($carousel.getNode(), "fullscreen");
                  abWebix.fullscreen.exit();
                  let rowId = e.target.getAttribute("ab-row-id");
                  this.linkPage.changePage(detailsPage, rowId);
               } else if (
                  e.target.className.indexOf("ab-carousel-fullscreen") > -1
               ) {
                  $carousel.define("css", "fullscreen");
                  abWebix.fullscreen.set(ids.carousel, {
                     head: {
                        view: "toolbar",
                        css: "webix_dark",
                        elements: [
                           {},
                           {
                              view: "icon",
                              icon: "fa fa-times",
                              click: function () {
                                 abWebix.html.removeCss(
                                    $carousel.getNode(),
                                    "fullscreen"
                                 );
                                 abWebix.fullscreen.exit();
                              },
                           },
                        ],
                     },
                  });
               } else if (
                  e.target.className.indexOf("ab-carousel-rotate-left") > -1
               ) {
                  const rowId = e.target.getAttribute("ab-row-id");
                  const imgFile = e.target.getAttribute("ab-img-file");
                  this.rotateImage(rowId, imgFile, field, "left");
               } else if (
                  e.target.className.indexOf("ab-carousel-rotate-right") > -1
               ) {
                  const rowId = e.target.getAttribute("ab-row-id");
                  const imgFile = e.target.getAttribute("ab-img-file");
                  this.rotateImage(rowId, imgFile, field, "right");
               } else if (
                  e.target.className.indexOf("ab-carousel-zoom-in") > -1
               ) {
                  this.zoom("in");
               } else if (
                  e.target.className.indexOf("ab-carousel-zoom-out") > -1
               ) {
                  this.zoom("out");
               }
            }
         };
      }
   }

   showFilterPopup($view) {
      this.filterUI.showPopup($view);
   }

   async rotateImage(rowId, imgFile, field, direction = "right") {
      this.busy();

      // call api to rotate
      if (direction == "left") await field.rotateLeft(imgFile);
      else await field.rotateRight(imgFile);

      // refresh image
      const imgElm = document.getElementById(`${this.ids.component}-${rowId}`);
      if (imgElm) {
         await fetch(imgElm.src, { cache: "reload", mode: "no-cors" });
         imgElm.src = `${imgElm.src}#${new Date().getTime()}`;
      }

      this.ready();
   }

   zoom(inOrOut = "in") {
      const imgContainer = document.getElementsByClassName(
         "ab-carousel-image-container"
      )[0];
      if (!imgContainer) return;

      const imgElem = imgContainer.getElementsByTagName("img")[0];
      if (!imgElem) return;

      const step = 15;
      const height = parseInt(
         (imgElem.style.height || 100).toString().replace("%", "")
      );
      const newHeight = inOrOut == "in" ? height + step : height - step;
      imgElem.style.height = `${newHeight}%`;

      imgContainer.style.overflow = newHeight > 100 ? "auto" : "";
   }
}
