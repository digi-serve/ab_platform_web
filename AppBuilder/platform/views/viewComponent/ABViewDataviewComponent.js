const ABViewComponent = require("./ABViewComponent").default;
const ABViewDetailComponent = require("./ABViewDetailComponent");
const ABViewPropertyLinkPage =
   require("../viewProperties/ABViewPropertyLinkPage").default;

module.exports = class ABViewDataviewComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewDataview_${baseView.id}`,
         Object.assign(
            {
               dataview: "",
            },
            ids
         )
      );

      this.linkPage = null;
   }

   ui() {
      // NOTE: need to initial the detail component here
      // because its dom width & height values are used .template function
      this.initDetailComponent();

      const ids = this.ids;
      const _ui = super.ui([
         {
            id: ids.dataview,
            view: "dataview",
            scroll: "y",
            sizeToContent: true,
            css: "borderless transparent",
            xCount: this.settings.xCount,
            template: (item) => this.itemTemplate(item),
            on: {
               onAfterRender: () => {
                  this.applyClickEvent();
                  this.addCyAttribute();
               },
            },
         },
      ]);

      return _ui;
   }

   async init(AB) {
      await super.init(AB);

      const dc = this.datacollection;
      if (!dc) return;

      // Initial the link page helper
      this.linkPage = this.linkPageHelper.component();
      this.linkPage.init({
         view: this.view,
         datacollection: dc,
      });

      const ids = this.ids;
      const dataView = $$(ids.dataview);
      dc.bind(dataView);
   }

   onShow() {
      super.onShow();

      const $dataview = $$(this.ids.dataview);
      $dataview.resize();

      const item_width = this.getItemWidth();
      $dataview.customize({ width: item_width });
      $dataview.getTopParentView?.().resize?.();
   }

   initDetailComponent() {
      const detailUI = this.getDetailUI();
      this._detail_ui = this.AB.Webix.ui(detailUI);

      // 2 - Always allow access to components inside data view
      this.detailComponent.init(null, 2);
   }

   getDetailUI() {
      const detailCom = this.detailComponent;
      const editPage = this.settings.editPage;
      const detailsPage = this.settings.detailsPage;

      const _ui = detailCom.ui();
      // adjust the UI to make sure it will look like a "card"
      _ui.type = "clean";
      _ui.css = "ab-detail-view";

      if (detailsPage || editPage) {
         _ui.css += ` ab-detail-hover ab-record-#itemId#`;

         if (detailsPage) _ui.css += " ab-detail-page";
         if (editPage) _ui.css += " ab-edit-page";
      }

      return _ui;
   }

   itemTemplate(item) {
      const detailCom = this.detailComponent;
      const $dataview = $$(this.ids.dataview);
      const $detail_item = this._detail_ui;

      // Mock up data to initialize height of item
      if (!item || !Object.keys(item).length) {
         item = item ?? {};
         this.datacollection?.datasource?.fields().forEach((f) => {
            switch (f.key) {
               case "string":
               case "LongText":
                  item[f.columnName] = "Lorem Ipsum";
                  break;
               case "date":
               case "datetime":
                  item[f.columnName] = new Date();
                  break;
               case "number":
                  item[f.columnName] = 7;
                  break;
            }
         });
      }
      detailCom.displayData(item);

      const itemWidth =
         $dataview.data.count() > 0
            ? $dataview.type.width
            : ($detail_item.$width - 20) / this.settings.xCount;

      const itemHeight =
         $dataview.data.count() > 0
            ? $dataview.type.height
            : $detail_item.getChildViews()?.[0]?.$height;

      const tmp_dom = document.createElement("div");
      tmp_dom.appendChild($detail_item.$view);

      $detail_item.define("width", itemWidth - 24);
      $detail_item.define("height", itemHeight + 15);
      $detail_item.adjust();

      // Add cy attributes
      this.addCyItemAttributes(tmp_dom, item);

      return tmp_dom.innerHTML.replace(/#itemId#/g, item.id);
   }

   getItemWidth() {
      const $dataview = $$(this.ids.dataview);

      let currElem = $dataview;
      let parentWidth = currElem?.$width;
      while (currElem) {
         if (
            currElem.config.view == "scrollview" ||
            currElem.config.view == "layout"
         )
            parentWidth =
               currElem?.$width < parentWidth ? currElem?.$width : parentWidth;

         currElem = currElem?.getParentView?.();
      }

      if (!parentWidth)
         parentWidth = $dataview?.getParentView?.().$width || window.innerWidth;

      // check if the browser window minus webix default padding is the same as the parent window
      // if so we need to check to see if there is a sidebar and reduce the usable space by the
      // width of the sidebar
      if (window.innerWidth - 18 <= parentWidth) {
         const $sidebar = this.getTabSidebar();
         if ($sidebar) {
            parentWidth -= $sidebar.$width;
         }
      }

      const recordWidth = Math.floor(parentWidth / this.settings.xCount);

      return recordWidth;
   }

   getTabSidebar() {
      const $dataview = $$(this.ids.dataview);
      let $sidebar;
      let currElem = $dataview;
      while (currElem && !$sidebar) {
         $sidebar = (currElem.getChildViews?.() ?? []).filter(
            (item) => item?.config?.view == "sidebar"
         )[0];

         currElem = currElem?.getParentView?.();
      }

      return $sidebar;
   }

   applyClickEvent() {
      const editPage = this.settings.editPage;
      const detailsPage = this.settings.detailsPage;
      if (!detailsPage && !editPage) return;

      const $dataview = $$(this.ids.dataview);
      if (!$dataview) return;

      $dataview.$view.onclick = (e) => {
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

   addCyAttribute() {
      const baseView = this.view;
      const $dataview = $$(this.ids.dataview);
      const name = (baseView.name ?? "").replace(".dataview", "");

      $dataview.$view.setAttribute(
         "data-cy",
         `dataview container ${name} ${baseView.id}`
      );
   }

   addCyItemAttributes(dom, item) {
      const baseView = this.view;
      const uuid = item.uuid;
      const name = (baseView.name ?? "").replace(".dataview", "");
      dom.querySelector(".webix_accordionitem_body")?.setAttribute(
         "data-cy",
         `dataview item ${name} ${uuid} ${baseView.id}`
      );
      dom.querySelector(".webix_accordionitem_button")?.setAttribute(
         "data-cy",
         `dataview item button ${name} ${uuid} ${baseView.id}`
      );
   }

   get detailComponent() {
      return (this._detailComponent =
         this._detailComponent ??
         new ABViewDetailComponent(
            this.view,
            `${this.ids.component}_detail_view`
         ));
   }

   get linkPageHelper() {
      return (this.__linkPageHelper =
         this.__linkPageHelper || new ABViewPropertyLinkPage());
   }
};
