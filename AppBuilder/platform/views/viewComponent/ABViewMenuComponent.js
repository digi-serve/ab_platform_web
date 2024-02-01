const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewMenuComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewMenu_${baseView.id}`,
         Object.assign(
            {
               menu: "",
            },
            ids
         )
      );
   }

   ui() {
      const settings = this.settings;
      const _ui = super.ui([
         parseInt(settings.menuInToolbar) ? this.uiToolbar() : this.uiMenu(),
      ]);

      delete _ui.type;

      return _ui;
   }

   uiMenu() {
      const baseView = this.view;
      const settings = this.settings;
      const defaultSettings = baseView.constructor.defaultValues();
      const css = `${settings.buttonStyle || defaultSettings.buttonStyle} ${
         settings.menuAlignment || defaultSettings.menuAlignment
      } `;

      return {
         id: this.ids.menu,
         view: "menu",
         autoheight: true,
         autowidth: true,
         datatype: "json",
         css: css,
         layout: settings.orientation || defaultSettings.orientation,
         on: {
            onMenuItemClick: (id /*, e, node */) => {
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
      const settings = this.settings;
      const baseView = this.view;
      const defaultSettings = baseView.constructor.defaultValues();
      const _uiMenu = this.uiMenu();

      let elems = [];
      let menuIncluded = false;

      // Legacy support: use old settings values if translated values are not set
      const menuTextLeft = baseView.menuTextLeft ?? settings.menuTextLeft;
      const menuTextCenter = baseView.menuTextCenter ?? settings.menuTextCenter;
      const menuTextRight = baseView.menuTextRight ?? settings.menuTextRight;

      if (settings.menuPosition === "left") {
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
      } else
         elems.push({
            view: "label",
            label: "",
            autowidth: true,
         });

      if (settings?.menuPosition === "center") {
         menuIncluded = true;

         elems.push(_uiMenu);
      } else if (menuTextCenter?.length) {
         const width = menuTextLeft.length * 15;

         elems.push(
            {},
            {
               view: "label",
               label: menuTextCenter,
               align: "center",
               width: width,
            },
            {}
         );
      } else
         elems.push({
            view: "label",
            label: "",
            autowidth: true,
         });

      if (settings?.menuPosition === "right") {
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
      } else
         elems.push({
            view: "label",
            label: "",
            autowidth: true,
         });

      if (menuIncluded === false) elems = [_uiMenu];

      return {
         view: "toolbar",
         css: settings.menuTheme ?? defaultSettings.menuTheme,
         padding: settings.menuPadding
            ? parseInt(settings.menuPadding)
            : defaultSettings.menuPadding,
         elements: elems,
      };
   }

   async init(AB) {
      await super.init(AB);

      const $menu = $$(this.ids.menu);
      const baseView = this.view;

      if ($menu) {
         const settings = this.settings;

         baseView.ClearPagesInView($menu);

         if (settings.order?.length) {
            baseView.AddPagesToView($menu, settings.order);
            // Force onAfterRender to fire
            $menu.refresh();
         }
      }
   }

   onClick(itemId) {
      const $menu = $$(this.ids.menu);
      let $item;
      try {
         $item = $menu.getMenuItem(itemId);
      } catch (err) {
         this.AB.notify.developer(err, {
            context:
               "ABViewMenuComponent > onClick error gettint menu / menu item",
            itemId,
            menu: {
               id: this.view.id,
               settings: this.view.settings,
            },
         });
         return;
      }
      const baseView = this.view;

      // switch tab view
      if ($item.type === "tab") {
         baseView.changePage($item.pageId);

         const redirectPage = baseView.application.pages(
            (p) => p.id === $item.pageId,
            true
         )[0];

         if (!redirectPage) return;

         const tabView = redirectPage.views((v) => v.id === $item.id, true)[0];

         if (!tabView) return;

         const tab = tabView.parent;

         if (!tab) return;

         this.toggleParent(tab);

         // if (!$$(tabView.id) || !$$(tabView.id).isVisible()) {
         const showIt = setInterval(() => {
            if ($$(tabView.id) && $$(tabView.id).isVisible()) {
               clearInterval(showIt);

               return;
            }

            tab.emit("changeTab", tabView.id);
         }, 100);
         // }
      }
      // switch page
      else baseView.changePage(itemId);
   }

   toggleParent(element) {
      if (!element.parent) return false;

      const parentElem = element.parent;

      if (!parentElem?.parent) return false;

      parentElem.parent.emit("changeTab", parentElem.id);
      this.toggleParent(parentElem.parent);
   }

   defineCypress() {
      const $menu = $$(this.ids.menu);

      if (!$menu) return;

      $menu.data.each((item) => {
         const node = $menu.getItemNode(item.id);

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
