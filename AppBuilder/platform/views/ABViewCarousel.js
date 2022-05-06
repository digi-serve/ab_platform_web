const ABViewCarouselCore = require("../../core/views/ABViewCarouselCore");
const ABViewComponent = require("./ABViewComponent").default;

// const ABViewPropertyFilterData = require("./viewProperties/ABViewPropertyFilterData");
// const ABViewPropertyLinkPage = require("./viewProperties/ABViewPropertyLinkPage");

import ABViewPropertyFilterData from "./viewProperties/ABViewPropertyFilterData";
import ABViewPropertyLinkPage from "./viewProperties/ABViewPropertyLinkPage";

const ABFieldImage = require("../dataFields/ABFieldImage");

let L = (...params) => AB.Multilingual.label(...params);

let PopupCarouselFilterMenu = null;

class ABViewCarouselComponent extends ABViewComponent {
   constructor(viewCarousel, idBase) {
      var base = idBase || `ABViewCarousel_${viewCarousel.id}`;
      super(base, {});

      this.view = viewCarousel;
      this.settings = viewCarousel.settings;

      this._handler_doOnShow = () => {
         this.onShow();
      };

      this._handler_doFilter = (fnFilter, filterRules) => {
         // NOTE: fnFilter is depreciated and will be removed.

         // this.onShow(filterRules);
         let dv = this.view.datacollection;
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
      let ids = this.ids;
      this.filterUI = this.view.filterHelper; // component(/* App, idBase */);
      this.linkPage = this.view.linkPageHelper.component(/* App, idBase */);

      let spacer = {};
      if (this.settings.width == 0) {
         spacer = {
            width: 1,
         };
      }

      return {
         borderless: true,
         cols: [
            spacer, // spacer
            {
               borderless: true,
               rows: [
                  this.filterUI.ui(), // filter UI
                  {
                     id: ids.component,
                     view: "carousel",
                     cols: [],
                     width: this.settings.width,
                     height: this.settings.height,
                     navigation: {
                        items: !this.settings.hideItem,
                        buttons: !this.settings.hideButton,
                        type: this.settings.navigationType,
                     },
                     on: {
                        onShow: () => {
                           let activeIndex = $$(ids.component).getActiveIndex();
                           this.switchImage(activeIndex);
                        },
                     },
                  },
               ],
            },
            spacer, // spacer
         ],
      };
   }

   // make sure each of our child views get .init() called
   init(AB, parentAccessLevel = 0) {
      this.AB = AB;

      let dv = this.view.datacollection;
      if (!dv) return;

      let object = dv.datasource;
      if (!object) return;

      dv.removeListener("loadData", this._handler_doOnShow);
      dv.on("loadData", this._handler_doOnShow);

      if (!this._handler_doReload) {
         this._handler_doReload = () => {
            dv.reloadData();
         };
      }

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

      // filter helper
      this.view.filterHelper.objectLoad(object);
      this.view.filterHelper.viewLoad(this);

      this.filterUI.init(this.AB);
      this.filterUI.removeListener("filter.data", this._handler_doOnShow);
      this.filterUI.on("filter.data", this._handler_doFilter);

      // link page helper
      this.linkPage.init({
         view: this.view,
         datacollection: dv,
      });

      // set data-cy
      const carousel = $$(this.ids.component).$view;
      carousel.setAttribute("data-cy", `${this.view.key} ${this.view.id}`);
      carousel
         .querySelector(".webix_nav_button_prev")
         ?.firstElementChild?.setAttribute(
            "data-cy",
            `${this.view.key} button previous ${this.view.id}`
         );
      carousel
         .querySelector(".webix_nav_button_next")
         ?.firstElementChild?.setAttribute(
            "data-cy",
            `${this.view.key} button next ${this.view.id}`
         );

      return Promise.resolve();
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
      let dv = this.view.datacollection;
      if (!dv) return;

      dv.removeListener("loadData", this._handler_doOnShow);

      if (this._handler_doReload) {
         dv.removeListener("update", this._handler_doReload);
         dv.removeListener("delete", this._handler_doReload);
         dv.removeListener("create", this._handler_doReload);
      }

      dv.removeListener("initializingData", this._handler_busy);

      dv.removeListener("initializedData", this._handler_ready);

      if (this.settings.filterByCursor) {
         dv.removeListener("changeCursor", this._handler_doOnShow);
      }

      this.filterUI.removeListener("filter.data", this._handler_doOnShow);
   }

   myTemplate(row) {
      if (row && row.src) {
         let template =
            `<div class="ab-carousel-image-container">` +
            `<img src="${row.src}" class="content" ondragstart="return false" />` +
            (this.settings.showLabel
               ? `<div class="ab-carousel-image-title">${row.label || ""}</div>`
               : "") +
            `<div class="ab-carousel-image-icon">` +
            (this.settings.detailsPage || this.settings.detailsTab
               ? `<span ab-row-id="${row.id}" class="ab-carousel-detail webix_icon fa fa-eye"></span>`
               : "") +
            (this.settings.editPage || this.settings.editTab
               ? `<span ab-row-id="${row.id}" class="ab-carousel-edit webix_icon fa fa-pencil"></span>`
               : "") +
            `<span class="webix_icon ab-carousel-fullscreen fa fa-arrows-alt"></span>` +
            `<span style="display: none;" class="webix_icon ab-carousel-exit-fullscreen fa fa-times"></span>` +
            `</div>` +
            `</div>`;

         return template;
      } // empty image
      else return "";
   }

   busy() {
      let Carousel = $$(this.ids.component);
      Carousel?.disable();
      Carousel?.showProgress?.({ type: "icon" });
   }

   ready() {
      let Carousel = $$(this.ids.component);
      Carousel?.enable();
      Carousel?.hideProgress?.();
   }

   async switchImage(current_position) {
      let dv = this.view.datacollection;
      if (!dv) return;

      // Check want to load more images
      if (
         current_position >= this._imageCount - 1 && // check last image
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

   onShow(fnFilter) {
      let ids = this.ids;
      let dv = this.view.datacollection;
      if (!dv) return;

      let obj = dv.datasource;
      if (!obj) return;

      let field = this.view.imageField;
      if (!field) return;

      if (dv && dv.dataStatus == dv.dataStatusFlag.notInitial) {
         // load data when a widget is showing
         dv.loadData();

         // it will call .onShow again after dc loads completely
         return;
      }

      fnFilter = fnFilter || this.filterUI.getFilter();

      let rows = dv.getData(fnFilter);

      // Filter images by cursor
      if (this.settings.filterByCursor) {
         let cursor = dv.getCursor();
         if (cursor) {
            rows = rows.filter(
               (r) =>
                  (r[obj.PK()] || r.id || r) ==
                  (cursor[obj.PK()] || cursor.id || cursor)
            );
         }
      }

      let images = [];

      rows.forEach((r) => {
         let imgFile = r[field.columnName];
         if (imgFile) {
            let imgData = {
               id: r.id,
               src: `/file/${imgFile}`,
            };

            // label of row data
            if (this.settings.showLabel) {
               imgData.label = obj.displayData(r);
            }

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

      // insert the default image to first item
      if (field.settings.defaultImageUrl) {
         images.unshift({
            css: "image",
            template: (...params) => {
               return this.myTemplate(...params);
            },
            data: {
               id: this.AB.uuid(),
               src: `/file/${field.settings.defaultImageUrl}`,
               label: L("Default image"),
            },
         });
      }

      // empty image
      if (images.length < 1) {
         images.push({
            rows: [
               {
                  view: "label",
                  align: "center",
                  height: this.settings.height,
                  label:
                     "<div style='display: block; font-size: 180px; background-color: #666; color: transparent; text-shadow: 0px 1px 1px rgba(255,255,255,0.5); -webkit-background-clip: text; -moz-background-clip: text; background-clip: text;' class='fa fa-picture-o'></div>",
               },
               {
                  view: "label",
                  align: "center",
                  label: L("No image"),
               },
            ],
         });
      }

      // store total of rows
      this._rowCount = rows.length;

      // store total of images
      this._imageCount = images.length;

      var Carousel = $$(ids.component);

      // re-render
      webix.ui(images, Carousel);

      // add loading cursor
      if (Carousel) webix.extend(Carousel, webix.ProgressBar);

      // link pages events
      let editPage = this.settings.editPage;
      let detailsPage = this.settings.detailsPage;

      // if (detailsPage || editPage) {
      $$(ids.component).$view.onclick = (e) => {
         if (e.target.className) {
            if (e.target.className.indexOf("ab-carousel-edit") > -1) {
               webix.html.removeCss($$(ids.component).getNode(), "fullscreen");
               webix.fullscreen.exit();
               let rowId = e.target.getAttribute("ab-row-id");
               this.linkPage.changePage(editPage, rowId);
            } else if (e.target.className.indexOf("ab-carousel-detail") > -1) {
               webix.html.removeCss($$(ids.component).getNode(), "fullscreen");
               webix.fullscreen.exit();
               let rowId = e.target.getAttribute("ab-row-id");
               this.linkPage.changePage(detailsPage, rowId);
            } else if (
               e.target.className.indexOf("ab-carousel-fullscreen") > -1
            ) {
               $$(ids.component).define("css", "fullscreen");
               webix.fullscreen.set(ids.component, {
                  head: {
                     view: "toolbar",
                     css: "webix_dark",
                     elements: [
                        {},
                        {
                           view: "icon",
                           icon: "fa fa-times",
                           click: function () {
                              webix.html.removeCss(
                                 $$(ids.component).getNode(),
                                 "fullscreen"
                              );
                              webix.fullscreen.exit();
                           },
                        },
                     ],
                  },
               });
            }
         }
      };
      // }
   }

   showFilterPopup($view) {
      this.filterUI.showPopup($view);
   }
}

export default class ABViewCarousel extends ABViewCarouselCore {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues);
   }

   ///
   /// Instance Methods
   ///

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      // filter property
      this.filterHelper.fromSettings(this.settings.filter);
   }

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
   // editorComponent(App, mode) {
   //    var idBase = "ABViewCarouselEditorComponent";

   //    var CarouselComponent = this.component(App, idBase);

   //    return CarouselComponent;
   // }

   //
   // Property Editor
   //
   /*
   static propertyEditorDefaultElements(App, ids, _logic, ObjectDefaults) {
      var idBase = "ABViewCarouselPropertyEditor";

      let commonUI = super.propertyEditorDefaultElements(
         App,
         ids,
         _logic,
         ObjectDefaults
      );

      PopupCarouselFilterMenu = ABViewPropertyFilterData.propertyComponent(
         App,
         idBase
      );
      this.linkPageComponent = ABViewPropertyLinkPage.propertyComponent(
         App,
         idBase
      );

      let filter_property_popup = webix.ui({
         view: "window",
         modal: true,
         position: "center",
         resize: true,
         width: 700,
         height: 450,
         css: "ab-main-container",
         head: {
            view: "toolbar",
            cols: [
               {
                  view: "label",
                  label: L("Filter Menu"),
               },
            ],
         },
         body: PopupCarouselFilterMenu.ui,
      });

      _logic.filterMenuShow = () => {
         var currView = _logic.currentEditObject();

         PopupCarouselFilterMenu.setSettings(currView.settings.filter);

         // show filter popup
         filter_property_popup.show();
      };

      _logic.filterSave = () => {
         var currView = _logic.currentEditObject();

         // hide filter popup
         filter_property_popup.hide();

         // refresh settings
         this.propertyEditorValues(ids, currView);

         // trigger a save()
         this.propertyEditorSave(ids, currView);
      };

      _logic.filterCancel = () => {
         // hide filter popup
         filter_property_popup.hide();
      };

      PopupCarouselFilterMenu.init({
         onSave: _logic.filterSave,
         onCancel: _logic.filterCancel,
      });

      return commonUI.concat([
         {
            view: "fieldset",
            label: L("Data:"),
            labelWidth: this.AB.UISettings.config().labelWidthLarge,
            body: {
               type: "clean",
               padding: 10,
               rows: [
                  {
                     view: "select",
                     name: "datacollection",
                     label: L("Object:"),
                     labelWidth: this.AB.UISettings.config().labelWidthLarge,
                     options: [],
                     on: {
                        onChange: function (newv, oldv) {
                           if (newv != oldv) {
                              $$(ids.detailsPage).setValue("");
                              $$(ids.editPage).setValue("");

                              let imageFields = [];

                              let dataCollection = _logic
                                 .currentEditObject()
                                 .AB.datacollectionByID(newv);
                              if (dataCollection) {
                                 let datasource = dataCollection.datasource;
                                 if (datasource) {
                                    imageFields =
                                       datasource
                                          .fields(
                                             (f) => f instanceof ABFieldImage
                                          )
                                          .map((f) => {
                                             return {
                                                id: f.id,
                                                value: f.label,
                                             };
                                          }) || [];
                                 }
                              }
                              if (imageFields.length > 0) {
                                 imageFields.unshift({
                                    id: "",
                                    value: L("Select a field"),
                                 });
                              } else {
                                 imageFields.unshift({
                                    id: "",
                                    value: L("no image fields."),
                                 });
                              }

                              $$(ids.field).define("options", imageFields);
                              $$(ids.field).refresh();
                           }
                        },
                     },
                  },

                  {
                     view: "select",
                     name: "field",
                     label: L("Image Field:"),
                     labelWidth: this.AB.UISettings.config().labelWidthLarge,
                     options: [],
                  },

                  {
                     view: "checkbox",
                     name: "filterByCursor",
                     labelWidth: 0,
                     labelRight: L("Filter images by cursor"),
                  },
               ],
            },
         },

         this.linkPageComponent.ui,
         // {
         // 	view: "fieldset",
         // 	label: L('ab.component.label.linkedPages', '*Linked Pages:'),
         // 	labelWidth: this.AB.UISettings.config().labelWidthLarge,
         // 	body: {
         // 		type: "clean",
         // 		padding: 10,
         // 		rows: [
         // 			{
         // 				view: "select",
         // 				name: "detailsPage",
         // 				label: L('ab.component.label.detailsPage', '*Details Page:'),
         // 				labelWidth: this.AB.UISettings.config().labelWidthLarge,
         // 				options: []
         // 			},
         // 			{
         // 				view: "select",
         // 				name: "editPage",
         // 				label: L('ab.component.label.editForm', '*Edit Form:'),
         // 				labelWidth: this.AB.UISettings.config().labelWidthLarge,
         // 				options: []
         // 			}
         // 		]
         // 	}
         // },
         {
            view: "fieldset",
            label: L("Customize Display:"),
            labelWidth: this.AB.UISettings.config().labelWidthLarge,
            body: {
               type: "clean",
               padding: 10,
               rows: [
                  {
                     view: "select",
                     name: "navigationType",
                     label: L("Navigation Type"),
                     labelWidth: this.AB.UISettings.config().labelWidthLarge,
                     options: [
                        { id: "corner", value: L("Corner") },
                        { id: "side", value: L("Side") },
                     ],
                  },

                  {
                     view: "checkbox",
                     name: "showLabel",
                     labelRight: L("Show label of image"),
                     labelWidth: this.AB.UISettings.config().labelWidthCheckbox,
                  },

                  {
                     view: "checkbox",
                     name: "hideItem",
                     labelRight: L("Hide item list"),
                     labelWidth: this.AB.UISettings.config().labelWidthCheckbox,
                  },

                  {
                     view: "checkbox",
                     name: "hideButton",
                     labelRight: L("Hide navigation buttons"),
                     labelWidth: this.AB.UISettings.config().labelWidthCheckbox,
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

                  {
                     cols: [
                        {
                           view: "label",
                           label: L("Filter Option:"),
                           css: "ab-text-bold",
                           width: this.AB.UISettings.config().labelWidthXLarge,
                        },
                        {
                           view: "button",
                           id: ids.gridFilterMenuButton,
                           css: "webix_primary",
                           label: L("Settings"),
                           icon: "fa fa-gear",
                           type: "icon",
                           badge: 0,
                           click: function () {
                              _logic.filterMenuShow(this.$view);
                           },
                        },
                     ],
                  },
               ],
            },
         },
      ]);
   }

   static propertyEditorPopulate(App, ids, view) {
      super.propertyEditorPopulate(App, ids, view);

      if (!view) return;

      // Set the objects you can choose from in the list
      // Pull data collections to options
      var objectOptions = view.propertyDatacollections();
      $$(ids.datacollection).define("options", objectOptions);
      $$(ids.datacollection).refresh();

      $$(ids.datacollection).setValue(view.settings.dataviewID);
      $$(ids.field).setValue(view.settings.field);
      $$(ids.filterByCursor).setValue(view.settings.filterByCursor);

      $$(ids.width).setValue(view.settings.width);
      $$(ids.height).setValue(view.settings.height);
      $$(ids.showLabel).setValue(view.settings.showLabel);
      $$(ids.hideItem).setValue(view.settings.hideItem);
      $$(ids.hideButton).setValue(view.settings.hideButton);
      $$(ids.navigationType).setValue(view.settings.navigationType);

      // Populate values to QueryBuilder
      var selectedDv = view.datacollection;
      if (selectedDv) {
         PopupCarouselFilterMenu.objectLoad(selectedDv.datasource);
      }

      // Populate values to link page properties
      this.linkPageComponent.viewLoad(view);
      this.linkPageComponent.setSettings(view.settings);
   }

   static propertyEditorValues(ids, view) {
      super.propertyEditorValues(ids, view);

      view.settings.dataviewID = $$(ids.datacollection).getValue();
      view.settings.field = $$(ids.field).getValue();
      view.settings.filterByCursor = $$(ids.filterByCursor).getValue() || false;

      view.settings.width = $$(ids.width).getValue();
      view.settings.height = $$(ids.height).getValue();
      view.settings.showLabel = $$(ids.showLabel).getValue();
      view.settings.hideItem = $$(ids.hideItem).getValue();
      view.settings.hideButton = $$(ids.hideButton).getValue();
      view.settings.navigationType = $$(ids.navigationType).getValue();

      // filter
      view.settings.filter = PopupCarouselFilterMenu.getSettings();

      // link pages
      let linkSettings = this.linkPageComponent.getSettings();
      for (let key in linkSettings) {
         view.settings[key] = linkSettings[key];
      }
   }
*/
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false) {
      var dv = this.datacollection;
      if (dv) {
         this.filterHelper.objectLoad(dv.datasource);
         this.filterHelper.fromSettings(this.settings.filter);
      }

      let component = new ABViewCarouselComponent(this);

      // if this is our v1Interface
      if (v1App) {
         var newComponent = component;
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

   /*
   componentV1(App) {
      var idBase = this.idBase;
      var ids = {
         component: App.unique(`${idBase}_component`),
      };

      var dv = this.datacollection;
      if (dv) {
         this.filterHelper.objectLoad(dv.datasource);
         this.filterHelper.fromSettings(this.settings.filter);
      }

      let filterUI = this.filterHelper.component(App, idBase);
      let linkPage = this.linkPageHelper.component(App, idBase);

      let spacer = {};
      if (this.settings.width == 0) {
         spacer = {
            width: 1,
         };
      }

      let _ui = {
         borderless: true,
         cols: [
            spacer, // spacer
            {
               borderless: true,
               rows: [
                  filterUI.ui, // filter UI
                  {
                     id: ids.component,
                     view: "carousel",
                     cols: [],
                     width: this.settings.width,
                     height: this.settings.height,
                     navigation: {
                        items: !this.settings.hideItem,
                        buttons: !this.settings.hideButton,
                        type: this.settings.navigationType,
                     },
                     on: {
                        onShow: function () {
                           let activeIndex = $$(ids.component).getActiveIndex();
                           _logic.switchImage(activeIndex);
                        },
                     },
                  },
               ],
            },
            spacer, // spacer
         ],
      };

      // make sure each of our child views get .init() called
      let _init = (options) => {
         let dv = this.datacollection;
         if (!dv) return;

         let object = dv.datasource;
         if (!object) return;

         dv.on("loadData", () => {
            _logic.onShow();
         });
         dv.on("update", () => {
            dv.reloadData();
         });
         dv.on("delete", () => {
            dv.reloadData();
         });
         dv.on("create", () => {
            dv.reloadData();
         });
         dv.on("initializingData", () => {
            _logic.busy();
         });
         dv.on("initializedData", () => {
            _logic.ready();
         });

         if (this.settings.filterByCursor) {
            dv.on("changeCursor", () => {
               _logic.onShow();
            });
         }

         // filter helper
         this.filterHelper.objectLoad(object);
         this.filterHelper.viewLoad(this);

         filterUI.init({
            onFilterData: (fnFilter) => {
               _logic.onShow(fnFilter); // be notified when there is a change in the filter
            },
         });

         // link page helper
         linkPage.init({
            view: this,
            datacollection: dv,
         });

         // set data-cy
         const carousel = $$(ids.component).$view;
         carousel.setAttribute('data-cy', `${this.key} ${this.id}`);
         carousel
             .querySelector('.webix_nav_button_prev')
             ?.firstElementChild
             ?.setAttribute('data-cy', `${this.key} button previous ${this.id}`);
         carousel
             .querySelector('.webix_nav_button_next')
             ?.firstElementChild
             ?.setAttribute('data-cy', `${this.key} button next ${this.id}`);

      };

      let _logic = {
         myTemplate: (row) => {
            if (row && row.src) {
               let template =
                  `<div class="ab-carousel-image-container">` +
                  `<img src="${row.src}" class="content" ondragstart="return false" />` +
                  (this.settings.showLabel
                     ? `<div class="ab-carousel-image-title">${
                          row.label || ""
                       }</div>`
                     : "") +
                  `<div class="ab-carousel-image-icon">` +
                  (this.settings.detailsPage || this.settings.detailsTab
                     ? `<span ab-row-id="${row.id}" class="ab-carousel-detail webix_icon fa fa-eye"></span>`
                     : "") +
                  (this.settings.editPage || this.settings.editTab
                     ? `<span ab-row-id="${row.id}" class="ab-carousel-edit webix_icon fa fa-pencil"></span>`
                     : "") +
                  `<span class="webix_icon ab-carousel-fullscreen fa fa-arrows-alt"></span>` +
                  `<span style="display: none;" class="webix_icon ab-carousel-exit-fullscreen fa fa-times"></span>` +
                  `</div>` +
                  `</div>`;

               return template;
            } // empty image
            else return "";
         },

         busy: () => {
            let Carousel = $$(ids.component);

            Carousel.disable();

            if (Carousel.showProgress) Carousel.showProgress({ type: "icon" });
         },

         ready: () => {
            let Carousel = $$(ids.component);

            Carousel.enable();

            if (Carousel.hideProgress) Carousel.hideProgress();
         },

         switchImage: async (current_position) => {
            let dv = this.datacollection;
            if (!dv) return;

            // Check want to load more images
            if (
               current_position >= this._imageCount - 1 && // check last image
               dv.totalCount > this._rowCount
            ) {
               // loading cursor
               _logic.busy();

               try {
                  await dv.loadData(this._rowCount || 0);
               } catch (err) {
                  App.AB.notify.developer(err, {
                     message: "Error when load data from a Data collection",
                  });
               }

               _logic.ready();
            }
         },

         onShow: (fnFilter) => {
            let dv = this.datacollection;
            if (!dv) return;

            let obj = dv.datasource;
            if (!obj) return;

            let field = this.imageField;
            if (!field) return;

            if (dv && dv.dataStatus == dv.dataStatusFlag.notInitial) {
               // load data when a widget is showing
               dv.loadData();

               // it will call .onShow again after dc loads completely
               return;
            }

            fnFilter = fnFilter || filterUI.getFilter();

            let rows = dv.getData(fnFilter);

            // Filter images by cursor
            if (this.settings.filterByCursor) {
               let cursor = dv.getCursor();
               if (cursor) {
                  rows = rows.filter(
                     (r) =>
                        (r[obj.PK()] || r.id || r) ==
                        (cursor[obj.PK()] || cursor.id || cursor)
                  );
               }
            }

            let images = [];

            rows.forEach((r) => {
               let imgFile = r[field.columnName];
               if (imgFile) {
                  let imgData = {
                     id: r.id,
                     src: `/file/${imgFile}`,
                  };

                  // label of row data
                  if (this.settings.showLabel) {
                     imgData.label = obj.displayData(r);
                  }

                  images.push({
                     css: "image",
                     borderless: true,
                     template: _logic.myTemplate,
                     data: imgData,
                  });
               }
            });

            // insert the default image to first item
            if (field.settings.defaultImageUrl) {
               images.unshift({
                  css: "image",
                  template: _logic.myTemplate,
                  data: {
                     id: this.AB.uuid(),
                     src: `/file/${field.settings.defaultImageUrl}`,
                     label: L("Default image"),
                  },
               });
            }

            // empty image
            if (images.length < 1) {
               images.push({
                  rows: [
                     {
                        view: "label",
                        align: "center",
                        height: this.settings.height,
                        label:
                           "<div style='display: block; font-size: 180px; background-color: #666; color: transparent; text-shadow: 0px 1px 1px rgba(255,255,255,0.5); -webkit-background-clip: text; -moz-background-clip: text; background-clip: text;' class='fa fa-picture-o'></div>",
                     },
                     {
                        view: "label",
                        align: "center",
                        label: L("No image"),
                     },
                  ],
               });
            }

            // store total of rows
            this._rowCount = rows.length;

            // store total of images
            this._imageCount = images.length;

            var Carousel = $$(ids.component);

            // re-render
            webix.ui(images, Carousel);

            // add loading cursor
            if (Carousel) webix.extend(Carousel, webix.ProgressBar);

            // link pages events
            let editPage = this.settings.editPage;
            let detailsPage = this.settings.detailsPage;

            // if (detailsPage || editPage) {
            $$(ids.component).$view.onclick = (e) => {
               if (e.target.className) {
                  if (e.target.className.indexOf("ab-carousel-edit") > -1) {
                     webix.html.removeCss(
                        $$(ids.component).getNode(),
                        "fullscreen"
                     );
                     webix.fullscreen.exit();
                     let rowId = e.target.getAttribute("ab-row-id");
                     linkPage.changePage(editPage, rowId);
                  } else if (
                     e.target.className.indexOf("ab-carousel-detail") > -1
                  ) {
                     webix.html.removeCss(
                        $$(ids.component).getNode(),
                        "fullscreen"
                     );
                     webix.fullscreen.exit();
                     let rowId = e.target.getAttribute("ab-row-id");
                     linkPage.changePage(detailsPage, rowId);
                  } else if (
                     e.target.className.indexOf("ab-carousel-fullscreen") > -1
                  ) {
                     $$(ids.component).define("css", "fullscreen");
                     webix.fullscreen.set(ids.component, {
                        head: {
                           view: "toolbar",
                           css: "webix_dark",
                           elements: [
                              {},
                              {
                                 view: "icon",
                                 icon: "fa fa-times",
                                 click: function () {
                                    webix.html.removeCss(
                                       $$(ids.component).getNode(),
                                       "fullscreen"
                                    );
                                    webix.fullscreen.exit();
                                 },
                              },
                           ],
                        },
                     });
                  }
               }
            };
            // }
         },

         showFilterPopup: ($view) => {
            filterUI.showPopup($view);
         },
      };

      return {
         ui: _ui,
         init: _init,
         logic: _logic,

         onShow: _logic.onShow,
      };
   }
   */

   get idBase() {
      return `ABViewCarousel_${this.id}`;
   }

   get filterHelper() {
      if (this.__filterHelper == null)
         this.__filterHelper = new ABViewPropertyFilterData(
            this.AB,
            this.idBase
         );

      return this.__filterHelper;
   }

   get linkPageHelper() {
      if (this.__linkPageHelper == null)
         this.__linkPageHelper = new ABViewPropertyLinkPage();

      return this.__linkPageHelper;
   }
}
