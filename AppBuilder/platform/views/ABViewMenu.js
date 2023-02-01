const ABViewMenuCore = require("../../core/views/ABViewMenuCore");
const ABViewMenuComponent = require("./viewComponent/ABViewMenuComponent");

module.exports = class ABViewMenu extends ABViewMenuCore {
   /**
    * @function component()
    * return a UI component based upon this view.
    * @param {obj} v1App
    * @return {obj} UI component
    */
   component(v1App) {
      let component = new ABViewMenuComponent(this);

      // if this is our v1Interface
      if (v1App) {
         const newComponent = component;
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
    * @method componentOld()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   // componentOld(App) {
   //    var idBase = `ABMenuLabel_${this.id}`;
   //    var ids = {
   //       component: App.unique(`${idBase}_component`),
   //    };

   //    var css = "";

   //    if (this.settings.buttonStyle) {
   //       css += this.settings.buttonStyle + " ";
   //    } else {
   //       css += ABViewMenuPropertyComponentDefaults.buttonStyle + " ";
   //    }

   //    if (this.settings.menuAlignment) {
   //       css += this.settings.menuAlignment + " ";
   //    } else {
   //       css += ABViewMenuPropertyComponentDefaults.menuAlignment + " ";
   //    }

   //    var _ui = {
   //       id: ids.component,
   //       view: "menu",
   //       autoheight: true,
   //       autowidth: true,
   //       datatype: "json",
   //       css: css,
   //       layout:
   //          this.settings.orientation ||
   //          ABViewMenuPropertyComponentDefaults.orientation,
   //       on: {
   //          onMenuItemClick: (id, e, node) => {
   //             // switch tab view
   //             var item = $$(ids.component).getMenuItem(id);
   //             if (item.type == "tab") {
   //                this.changePage(item.pageId);

   //                var redirectPage = this.application.pages(
   //                   (p) => p.id == item.pageId,
   //                   true
   //                )[0];
   //                if (!redirectPage) return;

   //                var tabView = redirectPage.views(
   //                   (v) => v.id == item.id,
   //                   true
   //                )[0];
   //                if (!tabView) return;

   //                var tab = tabView.parent;
   //                if (!tab) return;

   //                toggleParent(tab);
   //                // if (!$$(tabView.id) || !$$(tabView.id).isVisible()) {
   //                let showIt = setInterval(function () {
   //                   if ($$(tabView.id) && $$(tabView.id).isVisible()) {
   //                      clearInterval(showIt);
   //                      return;
   //                   }
   //                   tab.emit("changeTab", tabView.id);
   //                }, 100);
   //                // }
   //             }
   //             // switch page
   //             else {
   //                this.changePage(id);
   //             }
   //          },
   //          onAfterRender: () => {
   //             const Menu = $$(ids.component);
   //             if (!Menu) return;
   //             Menu?.data.each((item) => {
   //                const node = Menu.getItemNode(item.id);
   //                if (!node) return;
   //                // get linked page/tab info so we can use its name in the data-cy
   //                const viewInfo = this.AB.definitionByID(item.id);
   //                node.setAttribute(
   //                   "data-cy",
   //                   `menu-item ${viewInfo?.name} ${item.id} ${this.id}`
   //                );
   //             });
   //          },
   //       },
   //       type: {
   //          subsign: true,
   //       },
   //    };

   //    if (parseInt(this.settings.menuInToolbar)) {
   //       var elems = [];
   //       var menuIncluded = false;

   //       // Legacy support: use old settings values if translated values are not set
   //       if (this.menuTextLeft == "" && this.settings.menuTextLeft) {
   //          this.menuTextLeft = this.settings.menuTextLeft;
   //       }
   //       if (this.menuTextCenter == "" && this.settings.menuTextCenter) {
   //          this.menuTextCenter = this.settings.menuTextCenter;
   //       }
   //       if (this.menuTextRight == "" && this.settings.menuTextRight) {
   //          this.menuTextRight = this.settings.menuTextRight;
   //       }

   //       if (
   //          this.settings.menuPosition &&
   //          this.settings.menuPosition == "left"
   //       ) {
   //          menuIncluded = true;
   //          elems.push(_ui);
   //       } else if (this.menuTextLeft && this.menuTextLeft.length) {
   //          let width = this.menuTextLeft.length * 15;
   //          elems.push({
   //             view: "label",
   //             label: this.menuTextLeft,
   //             align: "left",
   //             width: width,
   //          });
   //       } else {
   //          elems.push({
   //             view: "label",
   //             label: "",
   //             autowidth: true,
   //          });
   //       }

   //       if (
   //          this.settings.menuPosition &&
   //          this.settings.menuPosition == "center"
   //       ) {
   //          menuIncluded = true;
   //          elems.push(_ui);
   //       } else if (this.menuTextCenter && this.menuTextCenter.length) {
   //          let width = this.menuTextLeft.length * 15;
   //          elems.push({});
   //          elems.push({
   //             view: "label",
   //             label: this.menuTextCenter,
   //             align: "center",
   //             width: width,
   //          });
   //          elems.push({});
   //       } else {
   //          elems.push({
   //             view: "label",
   //             label: "",
   //             autowidth: true,
   //          });
   //       }

   //       if (
   //          this.settings.menuPosition &&
   //          this.settings.menuPosition == "right"
   //       ) {
   //          menuIncluded = true;
   //          elems.push(_ui);
   //       } else if (this.menuTextRight && this.menuTextRight.length) {
   //          let width = this.menuTextLeft.length * 15;
   //          elems.push({
   //             view: "label",
   //             label: this.menuTextRight,
   //             align: "right",
   //             width: width,
   //          });
   //       } else {
   //          elems.push({
   //             view: "label",
   //             label: "",
   //             autowidth: true,
   //          });
   //       }

   //       if (menuIncluded == false) {
   //          elems = [_ui];
   //       }

   //       _ui = {
   //          view: "toolbar",
   //          css: this.settings.menuTheme
   //             ? this.settings.menuTheme
   //             : ABViewMenuPropertyComponentDefaults.menuTheme,
   //          padding: this.settings.menuPadding
   //             ? parseInt(this.settings.menuPadding)
   //             : ABViewMenuPropertyComponentDefaults.menuPadding,
   //          elements: elems,
   //       };
   //    }

   //    // make sure each of our child views get .init() called
   //    var _init = (options) => {
   //       var Menu = $$(ids.component);
   //       if (Menu) {
   //          this.ClearPagesInView(Menu);
   //          if (this.settings.order && this.settings.order.length) {
   //             this.AddPagesToView(Menu, this.settings.order);
   //             // Force onAfterRender to fire
   //             Menu.refresh();
   //          }
   //       }
   //    };

   //    var toggleParent = (element) => {
   //       if (!element.parent) return false;
   //       var parentElem = element.parent;
   //       if (!parentElem.parent) return false;
   //       parentElem.parent.emit("changeTab", parentElem.id);
   //       toggleParent(parentElem.parent);
   //    };

   //    return {
   //       ui: _ui,
   //       init: _init,
   //    };
   // }
};
