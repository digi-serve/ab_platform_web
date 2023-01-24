const ABViewComponent = require("./ABViewComponent").default;
const ABViewMenuCore = require("../../../core/views/ABViewMenuCore");

const ABViewMenuPropertyComponentDefaults = ABViewMenuCore.defaultValues();

const L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewMenuComponent extends ABViewComponent {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABMenuLabel_${baseView.id}`;
      super(baseView, idBase, {
         menu: "",
      });
   }

   ui() {
      const view = this.view;
      const settings = view.settings;

      if (parseInt(settings.menuInToolbar)) {
         return this.uiToolbar();
      } else {
         return this.uiMenu();
      }
   }

   uiMenu() {
      const settings = this.view.settings;

      let css = `${
         settings.buttonStyle ?? ABViewMenuPropertyComponentDefaults.buttonStyle
      } ${
         settings.menuAlignment ??
         ABViewMenuPropertyComponentDefaults.menuAlignment
      } `;

      return {
         id: this.ids.menu,
         view: "menu",
         autoheight: true,
         autowidth: true,
         datatype: "json",
         css: css,
         layout:
            settings.orientation ||
            ABViewMenuPropertyComponentDefaults.orientation,
         on: {
            onMenuItemClick: (id, e, node) => {
               this.onClick(id);
            },
            onAfterRender: () => {
               this.defineCypress();
            },
         },
         type: {
            subsign: true,
         },
      };
   }

   uiToolbar() {
      const view = this.view;
      const settings = this.view.settings;
      const _uiMenu = this.uiMenu();

      let elems = [];
      let menuIncluded = false;

      // Legacy support: use old settings values if translated values are not set
      const menuTextLeft = view.menuTextLeft ?? settings.menuTextLeft;
      const menuTextCenter = view.menuTextCenter ?? settings.menuTextCenter;
      const menuTextRight = view.menuTextRight ?? settings.menuTextRight;

      if (settings.menuPosition == "left") {
         menuIncluded = true;
         elems.push(_uiMenu);
      } else if (menuTextLeft?.length) {
         const width = menuTextLeft.length * 15;
         elems.push({
            view: "label",
            label: menuTextLeft,
            align: "left",
            width: width,
         });
      } else {
         elems.push({
            view: "label",
            label: "",
            autowidth: true,
         });
      }

      if (settings?.menuPosition == "center") {
         menuIncluded = true;
         elems.push(_uiMenu);
      } else if (menuTextCenter?.length) {
         const width = menuTextLeft.length * 15;
         elems.push({});
         elems.push({
            view: "label",
            label: menuTextCenter,
            align: "center",
            width: width,
         });
         elems.push({});
      } else {
         elems.push({
            view: "label",
            label: "",
            autowidth: true,
         });
      }

      if (settings?.menuPosition == "right") {
         menuIncluded = true;
         elems.push(_uiMenu);
      } else if (menuTextRight?.length) {
         const width = menuTextLeft.length * 15;
         elems.push({
            view: "label",
            label: menuTextRight,
            align: "right",
            width: width,
         });
      } else {
         elems.push({
            view: "label",
            label: "",
            autowidth: true,
         });
      }

      if (menuIncluded == false) {
         elems = [_uiMenu];
      }

      return {
         // TODO: We have to refactor becuase we need "id" on the very top level for each viewComponent.
         id: `${this.ids.component}_temp`,
         view: "toolbar",
         css:
            settings.menuTheme ?? ABViewMenuPropertyComponentDefaults.menuTheme,
         padding: settings.menuPadding
            ? parseInt(settings.menuPadding)
            : ABViewMenuPropertyComponentDefaults.menuPadding,
         elements: elems,
      };
   }

   init(options) {
      const $Menu = $$(this.ids.menu);
      if ($Menu) {
         const settings = this.view.settings;
         this.view.ClearPagesInView($Menu);
         if (settings.order && settings.order.length) {
            this.view.AddPagesToView($Menu, settings.order);
            // Force onAfterRender to fire
            $Menu.refresh();
         }
      }
   }

   onClick(itemId) {
      const $Menu = $$(this.ids.menu);
      const $item = $Menu.getMenuItem(itemId);

      // switch tab view
      if ($item.type == "tab") {
         this.view.changePage($item.pageId);

         const redirectPage = this.view.application.pages(
            (p) => p.id == $item.pageId,
            true
         )[0];
         if (!redirectPage) return;

         const tabView = redirectPage.views((v) => v.id == $item.id, true)[0];
         if (!tabView) return;

         const tab = tabView.parent;
         if (!tab) return;

         this.toggleParent(tab);
         // if (!$$(tabView.id) || !$$(tabView.id).isVisible()) {
         let showIt = setInterval(function () {
            if ($$(tabView.id) && $$(tabView.id).isVisible()) {
               clearInterval(showIt);
               return;
            }
            tab.emit("changeTab", tabView.id);
         }, 100);
         // }
      }
      // switch page
      else {
         this.view.changePage(itemId);
      }
   }

   toggleParent(element) {
      if (!element.parent) return false;
      const parentElem = element.parent;
      if (!parentElem.parent) return false;
      parentElem.parent.emit("changeTab", parentElem.id);
      this.toggleParent(parentElem.parent);
   }

   defineCypress() {
      const Menu = $$(this.ids.menu);
      if (!Menu) return;

      Menu.data.each((item) => {
         const node = Menu.getItemNode(item.id);
         if (!node) return;
         // get linked page/tab info so we can use its name in the data-cy
         const viewInfo = this.AB.definitionByID(item.id);
         node.setAttribute(
            "data-cy",
            `menu-item ${viewInfo?.name} ${item.id} ${this.view.id}`
         );
      });
   }
};
