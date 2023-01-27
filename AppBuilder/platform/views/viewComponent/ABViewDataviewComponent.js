const ABViewComponent = require("./ABViewComponent").default;
const ABViewDetailComponent = require("./ABViewDetailComponent");
const ABViewPropertyLinkPage =
   require("../viewProperties/ABViewPropertyLinkPage").default;

module.exports = class ABViewDataviewComponent extends ABViewComponent {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewDataviewComponent_${baseView.id}`;
      super(baseView, idBase, {
         scrollview: "",
         dataFlexView: "",
      });
   }

   ui() {
      const ids = this.ids;

      return {
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
                  onAfterScroll: () => {
                     const pos = $$(ids.scrollview).getScrollState();
                     this.scroll(pos);
                  },
               },
            },
         ],
      };
   }

   init(options) {
      const ids = this.ids;

      const dc = this.view.datacollection;
      if (!dc) return;

      const dataView = $$(ids.dataFlexView);

      // initial the link page helper
      this.linkPage = this.linkPageHelper.component();
      this.linkPage.init({
         view: this.view,
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
         this.busy();
      });
      dc.on("initializedData", () => {
         this.ready();
      });
      dc.on("loadData", () => {
         this.emptyView();
         this.renderData();
      });
      dc.on("update", () => {
         this.emptyView();
         this.renderData();
      });
      dc.on("delete", () => {
         this.emptyView();
         this.renderData();
      });
      dc.on("create", () => {
         this.emptyView();
         this.renderData();
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
   }

   async onShow() {
      const dc = this.view.datacollection;
      if (!dc) return;

      switch (dc.dataStatus) {
         case dc.dataStatusFlag.notInitial:
            // load data when a widget is showing
            dc.loadData();
            break;
         case dc.dataStatusFlag.initialized:
            this.renderData();
            break;
      }
   }

   get yPosition() {
      return this._yPosition ?? 0;
   }

   set yPosition(pos) {
      this._yPosition = pos;
   }

   busy() {
      const ids = this.ids;
      const Layout = $$(ids.dataFlexView);
      const Scroll = $$(ids.scrollview);

      // editor mode doesn't load this ui
      if (!Scroll || !Layout) return;

      Layout.disable();

      if (!Scroll.showProgress) {
         this.AB.Webix.extend(Scroll, this.AB.Webix.ProgressBar);
      }
      Scroll.showProgress({ type: "icon" });
   }

   ready() {
      const ids = this.ids;
      const Layout = $$(ids.dataFlexView);
      const Scroll = $$(ids.scrollview);

      // editor mode doesn't load this ui
      if (!Scroll || !Layout) return;

      Layout.enable();

      if (Scroll && !Scroll.hideProgress) {
         this.AB.Webix.extend(Scroll, this.AB.Webix.ProgressBar);
      }
      Scroll.hideProgress();
   }

   renderData() {
      const ids = this.ids;
      const editPage = this.settings.editPage;
      const detailsPage = this.settings.detailsPage;
      let records = [];

      const dc = this.view.datacollection;
      if (!dc) {
         this.ready();
         return;
      }

      const Layout = $$(ids.dataFlexView) || $$(ids.component);
      if (!Layout || isNaN(Layout.$width)) {
         this.ready();
         return;
      }

      const xCount = parseInt(this.view.settings.xCount);
      const recordWidth = Math.floor(
         (Layout.$width - 20 - xCount * 20) / xCount
      );

      const rows = dc.getData();

      // if this amount of data is already parsed just skip the rest.
      if (Layout.currentLength == rows.length) {
         this.ready();
         return;
      }

      Layout.currentLength = rows.length;

      // store total of rows
      this._startPos = Layout.getChildViews ? Layout.getChildViews().length : 0;

      let stopPos = rows.length;

      if (dc.settings.loadAll || this._startPos == 0) {
         stopPos = rows.length;
      } else if (rows.length - this._startPos > 20) {
         stopPos = this._startPos + 20;
      }

      for (let i = this._startPos; i < stopPos; i++) {
         // get the components configuation
         let detailCom = new ABViewDetailComponent(this.view, rows[i].id);

         let _ui = detailCom.ui();

         // adjust the UI to make sure it will look like a "card"
         _ui.type = "space";
         _ui.css = "ab-detail-view";
         if (detailsPage || editPage) {
            _ui.css += ` ab-detail-hover ab-record-${rows[i].id}`;

            if (detailsPage) {
               _ui.css += " ab-detail-page";
            }
            if (editPage) {
               _ui.css += " ab-edit-page";
            }
         }
         _ui.paddingX = 10;
         _ui.paddingY = 6;
         _ui.minWidth = recordWidth - 10;
         _ui.maxWidth = recordWidth;

         if (Layout.addView) {
            Layout.addView(_ui, -1);
            detailCom.init(null, 2); // 2 - Always allow access to components inside data view
            setTimeout(detailCom.displayData(rows[i]), 0);
         } else {
            records.push(_ui);
         }
      }

      if (records.length) {
         let flexlayout = {
            id: ids.dataFlexView,
            view: "flexlayout",
            paddingX: 15,
            paddingY: 19,
            type: "space",
            cols: records,
         };
         this.AB.Webix.ui(flexlayout, $$(ids.scrollview), $$(ids.dataFlexView));

         for (let j = this._startPos; j < stopPos; j++) {
            let detailCom = new ABViewDetailComponent(this.view, rows[j].id);
            detailCom.init(null, 2); // 2 - Always allow access to components inside data view
            setTimeout(detailCom.displayData(rows[j]), 0);
         }
      }

      if ($$(ids.scrollview)) {
         $$(ids.scrollview).scrollTo(0, this.yPosition);

         if (detailsPage || editPage) {
            Layout.$view.onclick = (e) => {
               let clicked = false;
               let divs = e.path ?? [];

               // NOTE: Some web browser clients do not support .path
               if (!divs.length) {
                  divs.push(e.target);
                  divs.push(e.target.parentNode);
               }

               if (editPage) {
                  for (let p of divs) {
                     if (
                        p.className &&
                        p.className.indexOf("webix_accordionitem_header") > -1
                     ) {
                        clicked = true;
                        p.parentNode.parentNode.classList.forEach((c) => {
                           if (c.indexOf("ab-record-") > -1) {
                              // var record = parseInt(c.replace("ab-record-", ""));
                              const record = c.replace("ab-record-", "");
                              this.linkPage.changePage(editPage, record);
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
                              const record = c.replace("ab-record-", "");
                              this.linkPage.changePage(detailsPage, record);
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
      const name = this.view.name.replace(".dataview", "");
      Layout.$view.setAttribute(
         "data-cy",
         `dataview container ${name} ${this.view.id}`
      );

      Layout.getChildViews().forEach((child, i) => {
         const uuid = rows[i + this._startPos]["uuid"];
         const view = child.$view;
         view
            .querySelector(".webix_accordionitem_body")
            .setAttribute(
               "data-cy",
               `dataview item ${name} ${uuid} ${this.view.id}`
            );
         view
            .querySelector(".webix_accordionitem_button")
            .setAttribute(
               "data-cy",
               `dataview item button ${name} ${uuid} ${this.view.id}`
            );
      });

      this.ready();
   }

   emptyView() {
      const ids = this.ids;
      const flexlayout = {
         id: ids.dataFlexView,
         view: "flexlayout",
         type: "clean",
         padding: 10,
         css: { background: "#ebedf0 !important" },
         cols: [],
      };
      this.AB.Webix.ui(flexlayout, $$(ids.scrollview), $$(ids.dataFlexView));
   }

   /**
    * @method scroll
    * @param pos - {
    * 					x: {integer},
    * 					y: {integer}
    * 				}
    */
   async scroll(pos) {
      const ids = this.ids;
      const Layout = $$(ids.dataFlexView);
      const Scroll = $$(ids.scrollview);

      let loadWhen = 40;

      const y = pos.y;
      const maxYPos = Layout.$height - Scroll.$height;
      if (maxYPos - y <= loadWhen) {
         if (this.loadMoreTimer) return;

         this.yPosition = y;

         const dc = this.view.datacollection;
         if (!dc) return;

         if (Layout.getChildViews().length >= dc.totalCount) return;

         // loading cursor
         this.busy();

         await dc.loadData(Layout.getChildViews().length || 0);

         this.loadMoreTimer = setTimeout(() => {
            this.loadMoreTimer = null;
         }, 1100);
      }
   }

   get linkPageHelper() {
      if (this.__linkPageHelper == null)
         this.__linkPageHelper = new ABViewPropertyLinkPage();

      return this.__linkPageHelper;
   }
};
