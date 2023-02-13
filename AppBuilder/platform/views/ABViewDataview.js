const ABViewDataviewCore = require("../../core/views/ABViewDataviewCore");
const ABViewDataviewComponent = require("./viewComponent/ABViewDataviewComponent");
// const ABViewPropertyLinkPage = require("./viewProperties/ABViewPropertyLinkPage")
//    .default;

const ABViewDataviewDefaults = ABViewDataviewCore.defaultValues();

const L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewDataview extends ABViewDataviewCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   //
   // Property Editor
   //

   // static propertyEditorDefaultElements(App, ids, _logic, ObjectDefaults) {
   //    var idBase = "ABViewDataviewPropertyEditor";

   //    var commonUI = super.propertyEditorDefaultElements(
   //       App,
   //       ids,
   //       _logic,
   //       ObjectDefaults
   //    );

   //    this.linkPageComponent = ABViewPropertyLinkPage.propertyComponent(
   //       App,
   //       idBase
   //    );

   //    return commonUI.concat([
   //       {
   //          view: "counter",
   //          name: "xCount",
   //          min: 1, // we cannot have 0 columns per row so lets not accept it
   //          label: L("Items in a row"),
   //          labelWidth: this.AB.UISettings.config().labelWidthLarge,
   //          step: 1,
   //       },
   //       this.linkPageComponent.ui,
   //    ]);
   // }

   // static propertyEditorPopulate(App, ids, view) {
   //    super.propertyEditorPopulate(App, ids, view);

   //    $$(ids.xCount).setValue(
   //       view.settings.xCount || ABViewDataviewDefaults.xCount
   //    );

   //    this.linkPageComponent.viewLoad(view);
   //    this.linkPageComponent.setSettings(view.settings);
   // }

   // static propertyEditorValues(ids, view) {
   //    super.propertyEditorValues(ids, view);

   //    view.settings.xCount = $$(ids.xCount).getValue();

   //    let linkSettings = this.linkPageComponent.getSettings();
   //    for (let key in linkSettings) {
   //       view.settings[key] = linkSettings[key];
   //    }
   // }

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      this.settings.detailsPage =
         this.settings.detailsPage ?? ABViewDataviewDefaults.detailsPage;
      this.settings.editPage =
         this.settings.editPage ?? ABViewDataviewDefaults.editPage;
      this.settings.detailsTab =
         this.settings.detailsTab ?? ABViewDataviewDefaults.detailsTab;
      this.settings.editTab =
         this.settings.editTab ?? ABViewDataviewDefaults.editTab;
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj } v1App
    * @param {string} idPrefix - define to support in 'Datacollection' widget
    *
    * @return {obj } UI component
    */
   component(v1App, idPrefix) {
      let component = new ABViewDataviewComponent(this);

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

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj } App
    * @return {obj } UI component
    */
   componentOld(App, idPrefix) {
      var com = {};

      var idBase = "ABViewDataview_" + this.id;
      var ids = {
         scrollview: App.unique(`${idBase}_scrollview`),
         component: App.unique(`${idBase}_component`),
         dataFlexView: App.unique(`${idBase}_dataFlexView`),
      };

      let linkPage = this.linkPageHelper.component(App, idBase);

      com.ui = {
         id: ids.component,
         rows: [
            {
               id: ids.scrollview,
               view: "scrollview",
               scroll: "y",
               body: {
                  id: ids.dataFlexView,
                  view: "flexlayout",
                  paddingX: 15,
                  paddingY: 19,
                  type: "space",
                  cols: [],
               },
               on: {
                  onAfterScroll: function () {
                     let pos = this.getScrollState();

                     com.logic.scroll(pos);
                  },
               },
            },
         ],
      };

      if (this.settings.height) com.ui.height = this.settings.height;

      com.init = (options) => {
         var dc = this.datacollection;
         if (!dc) return;

         let dataView = $$(ids.dataFlexView);

         // initial the link page helper
         linkPage.init({
            view: this,
            datacollection: dc,
         });

         // if (dc.datacollectionLink && dc.fieldLink) {
         //    dc.bind(dataView, dc.datacollectionLink, dc.fieldLink);
         // } else {
         //    dc.bind(dataView);
         // }
         // track all flexlayout component IDs on the data collectino so we can notify them of changes
         dc.attachFlexlayout(dataView);
         dc.on("initializingData", () => {
            com.logic.busy();
         });
         dc.on("initializedData", () => {
            com.logic.ready();
         });
         dc.on("loadData", () => {
            com.emptyView();
            com.renderData();
         });
         dc.on("update", () => {
            com.emptyView();
            com.renderData();
         });
         dc.on("delete", () => {
            com.emptyView();
            com.renderData();
         });
         dc.on("create", () => {
            com.emptyView();
            com.renderData();
         });

         // this.eventClear();
         //
         // this.eventAdd({
         //    emitter: dc,
         //    eventName: "loadData",
         //    listener: () => {
         //       com.renderData();
         //    },
         // });
      };

      com.logic = {
         busy: () => {
            let Layout = $$(ids.dataFlexView);
            let Scroll = $$(ids.scrollview);

            // editor mode doesn't load this ui
            if (!Scroll || !Layout) return;

            Layout.disable();

            if (!Scroll.showProgress) {
               webix.extend(Scroll, webix.ProgressBar);
            }
            Scroll.showProgress({ type: "icon" });
         },

         ready: () => {
            let Layout = $$(ids.dataFlexView);
            let Scroll = $$(ids.scrollview);

            // editor mode doesn't load this ui
            if (!Scroll || !Layout) return;

            Layout.enable();

            if (Scroll && !Scroll.hideProgress) {
               webix.extend(Scroll, webix.ProgressBar);
            }
            Scroll.hideProgress();
         },

         // we need to recursivly look backwards to toggle tabs into view when a user choosed to select a tab for edit or details views
         toggleTab: (parentTab, wb) => {
            // find the tab
            var tab = wb.getTopParentView().queryView({ id: parentTab });
            // if we didn't pass and id we may have passed a domNode
            if (tab == null) {
               tab = $$(parentTab);
            }

            if (tab == null) return;

            // set the tabbar to to the tab
            var tabbar = tab.getParentView().getParentView();

            if (tabbar == null) return;

            if (tabbar.setValue) {
               // if we have reached the top we won't have a tab
               tabbar.setValue(parentTab);
            }

            // find if it is in a multiview of a tab
            var nextTab = tabbar.queryView({ view: "scrollview" }, "parent");
            // if so then do this again
            if (nextTab) {
               com.toggleTab(nextTab, wb);
            }
         },

         /**
          * @method scroll
          * @param pos - {
          * 					x: {integer},
          * 					y: {integer}
          * 				}
          */
         scroll: async (pos) => {
            let loadWhen = 40;

            let y = pos.y;
            let maxYPos =
               $$(ids.dataFlexView).$height - $$(ids.scrollview).$height;
            if (maxYPos - y <= loadWhen) {
               if (this.loadMoreTimer) return;

               com.setYPos(y);

               var dc = this.datacollection;
               if (!dc) return;

               if ($$(ids.dataFlexView).getChildViews().length >= dc.totalCount)
                  return;

               // loading cursor
               com.logic.busy();

               await dc.loadData(
                  $$(ids.dataFlexView).getChildViews().length || 0
               );

               this.loadMoreTimer = setTimeout(() => {
                  this.loadMoreTimer = null;
               }, 1100);
            }
         },
      };

      com.onShow = () => {
         var dc = this.datacollection;
         if (!dc) return;

         if (dc.dataStatus == dc.dataStatusFlag.notInitial) {
            // load data when a widget is showing
            dc.loadData();
         } else if (dc.dataStatus == dc.dataStatusFlag.initialized) {
            com.renderData();
         }
      };

      com.setYPos = (pos) => {
         this.yPosition = pos;
      };

      com.getYPos = () => {
         return this.yPosition || 0;
      };

      com.emptyView = () => {
         let flexlayout = {
            id: ids.dataFlexView,
            view: "flexlayout",
            type: "clean",
            padding: 10,
            css: { background: "#ebedf0 !important" },
            cols: [],
         };
         webix.ui(flexlayout, $$(ids.scrollview), $$(ids.dataFlexView));
      };

      com.renderData = () => {
         let editPage = this.settings.editPage;
         let detailsPage = this.settings.detailsPage;
         var editTab = this.settings.editTab;
         var detailsTab = this.settings.detailsTab;
         var records = [];

         var dc = this.datacollection;
         if (!dc) {
            com.logic.ready();
            return;
         }

         let Layout = $$(ids.dataFlexView) || $$(ids.component);

         if (!Layout || isNaN(Layout.$width)) {
            com.logic.ready();
            return;
         }

         let recordWidth = Math.floor(
            (Layout.$width - 20 - parseInt(this.settings.xCount) * 20) /
               parseInt(this.settings.xCount)
         );

         var rows = dc.getData();

         // if this amount of data is already parsed just skip the rest.
         if (Layout.currentLength == rows.length) {
            com.logic.ready();
            return;
         }

         Layout.currentLength = rows.length;

         // store total of rows
         this._startPos = Layout.getChildViews
            ? Layout.getChildViews().length
            : 0;

         let stopPos = rows.length;

         if (this._startPos == 0) {
            stopPos = rows.length;
         } else if (rows.length - this._startPos > 20) {
            stopPos = this._startPos + 20;
         }

         if (dc.settings.loadAll) {
            stopPos = rows.length;
         }

         var dataGrid = [];
         for (var i = this._startPos; i < stopPos; i++) {
            // get the components configuation
            let detailCom = App.AB.cloneDeep(super.component(App, rows[i].id));

            // adjust the UI to make sure it will look like a "card"
            detailCom.ui.type = "space";
            detailCom.ui.css = "ab-detail-view";
            if (detailsPage || editPage) {
               detailCom.ui.css += " ab-detail-hover ab-record-" + rows[i].id;
            }
            if (detailsPage) {
               detailCom.ui.css += " ab-detail-page";
            }
            if (editPage) {
               detailCom.ui.css += " ab-edit-page";
            }
            detailCom.ui.paddingX = 10;
            detailCom.ui.paddingY = 6;
            detailCom.ui.minWidth = recordWidth - 10;
            detailCom.ui.maxWidth = recordWidth;

            if (Layout.addView) {
               Layout.addView(detailCom.ui, -1);
               detailCom.init(null, 2); // 2 - Always allow access to components inside data view
               setTimeout(detailCom.logic.displayData(rows[i]), 0);
            } else {
               records.push(detailCom.ui);
            }
         }

         if (records.length) {
            var flexlayout = {
               id: ids.dataFlexView,
               view: "flexlayout",
               paddingX: 15,
               paddingY: 19,
               type: "space",
               cols: records,
            };
            webix.ui(flexlayout, $$(ids.scrollview), $$(ids.dataFlexView));

            for (let i = this._startPos; i < stopPos; i++) {
               let detailCom = App.AB.cloneDeep(
                  super.component(App, rows[i].id)
               );
               detailCom.init(null, 2); // 2 - Always allow access to components inside data view
               setTimeout(detailCom.logic.displayData(rows[i]), 0);
            }
         }

         if ($$(ids.scrollview)) {
            $$(ids.scrollview).scrollTo(0, com.getYPos());

            if (detailsPage || editPage) {
               Layout.$view.onclick = (e) => {
                  var clicked = false;
                  let divs = e.path ?? [];

                  // NOTE: Some web browser clients do not support .path
                  if (!divs.length) {
                     divs.push(e.target);
                     divs.push(e.target?.parentNode);
                     divs = divs.filter((p) => p != null);
                  }

                  if (editPage) {
                     for (let p of divs) {
                        if (
                           p.className &&
                           p.className.indexOf("webix_accordionitem_header") >
                              -1
                        ) {
                           clicked = true;
                           p.parentNode.parentNode.classList.forEach((c) => {
                              if (c.indexOf("ab-record-") > -1) {
                                 // var record = parseInt(c.replace("ab-record-", ""));
                                 var record = c.replace("ab-record-", "");
                                 linkPage.changePage(editPage, record);
                                 // com.logic.toggleTab(detailsTab, ids.component);
                              }
                           });
                           break;
                        }
                     }
                  }
                  if (detailsPage && !clicked) {
                     for (let p of divs) {
                        if (
                           p.className &&
                           p.className.indexOf("webix_accordionitem") > -1
                        ) {
                           p.parentNode.parentNode.classList.forEach((c) => {
                              if (c.indexOf("ab-record-") > -1) {
                                 // var record = parseInt(c.replace("ab-record-", ""));
                                 var record = c.replace("ab-record-", "");
                                 linkPage.changePage(detailsPage, record);
                                 // com.logic.toggleTab(detailsTab, ids.component);
                              }
                           });
                           break;
                        }
                     }
                  }
               };
            }
         }

         //Add data-cy attributes for cypress tests
         const name = this.name.replace(".dataview", "");
         Layout.$view.setAttribute(
            "data-cy",
            `dataview container ${name} ${this.id}`
         );

         Layout.getChildViews().forEach((child, i) => {
            const uuid = rows[i + this._startPos]["uuid"];
            const view = child.$view;
            view
               .querySelector(".webix_accordionitem_body")
               .setAttribute(
                  "data-cy",
                  `dataview item ${name} ${uuid} ${this.id}`
               );
            view
               .querySelector(".webix_accordionitem_button")
               .setAttribute(
                  "data-cy",
                  `dataview item button ${name} ${uuid} ${this.id}`
               );
         });

         com.logic.ready();
      };

      return com;
   }
};
