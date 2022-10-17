import ClassUI from "./ClassUI.js";

class PortalTranslationTool extends ClassUI {
   constructor() {
      super();
      this.containerDomID = "domID";
   }

   ui() {
      const translationToolBody = {
         view: "scrollview",
         css: "lightgray ab_amp",
         body: {
            rows: [
               {
                  view: "accordion",
                  id: `qtt_accordion_${this.containerDomID}`,
                  roles: [],
                  hidden: true,
                  collapsed: true,
                  css: "webix_dark",
                  rows: [],
               },
               {
                  id: `qtt_accordion_noSelection_${this.containerDomID}`,
                  rows: [{}],
               },
            ],
         },
      };

      return {
         view: "window",
         css: "qttWindow",
         id: `quickTranslationTool_${this.containerDomID}`,
         position: function (state) {
            state.left = state.maxWidth - 400; // fixed values
            state.top = 0;
            state.width = 400; // relative values
            state.height = state.maxHeight;
         },
         on: {
            onShow: () => {
               // collapse all the accordion items but the top one
               var index = 0;
               $$(`qtt_accordion_${this.containerDomID}`)
                  .getChildViews()
                  .forEach((a) => {
                     if (index == 0) {
                        $$(a).expand();
                     } else {
                        $$(a).collapse();
                     }
                     index++;
                     $$(`qtt_accordion_${this.containerDomID}`).show();
                     $$(
                        `qtt_accordion_noSelection_${this.containerDomID}`
                     ).hide();
                  });
            },
         },
         head: {
            rows: [
               {
                  view: "toolbar",
                  css: "webix_dark",
                  cols: [
                     {
                        width: 15,
                     },
                     {
                        view: "label",
                        label: "Translation Tool",
                        autowidth: true,
                     },
                     {},
                     {
                        view: "button",
                        width: 38,
                        css: "webix_transparent",
                        icon: "fa fa-cog",
                        type: "iconTop",
                        click: function () {
                           if ($$("translationSettings").config.hidden) {
                              $$("translationSettings").show();
                           } else {
                              $$("translationSettings").hide();
                           }
                        },
                     },
                     {
                        view: "button",
                        width: 35,
                        css: "webix_transparent",
                        type: "icon",
                        icon: "nomargin fa fa-times",
                        click: () => {
                           $$(
                              `quickTranslationTool_${this.containerDomID}`
                           ).hide();
                        },
                     },
                  ],
               },
               {
                  view: "toolbar",
                  id: "translationSettings",
                  hidden: true,
                  css: "webix_dark",
                  rows: [
                     {
                        id: `qtt_accordion_${this.containerDomID}_translateTo`,
                        view: "select",
                        labelWidth: 120,
                        label: "Translate to:",
                        labelAlign: "right",
                        options: [],
                        on: {
                           onChange: (newVal, oldVal) => {
                              if (newVal != oldVal) {
                                 this.buildTranslationAccordion(
                                    this.application.objectsIncluded(),
                                    this.application.pages()
                                 );
                              }
                           },
                        },
                     },
                     {
                        id: `qtt_accordion_${this.containerDomID}_translateHint`,
                        view: "select",
                        labelWidth: 120,
                        label: "Hint language:",
                        bottomLabel: "*Hover over label to display hint",
                        labelAlign: "right",
                        options: [],
                        on: {
                           onChange: (newVal, oldVal) => {
                              if (newVal != oldVal) {
                                 this.buildTranslationAccordion(
                                    this.application.objectsIncluded(),
                                    this.application.pages()
                                 );
                              }
                           },
                        },
                     },
                  ],
               },
            ],
         },
         body: translationToolBody,
      };
   }

   init(portal) {
      this.AB = portal.AB;
      this.portal = portal;
      this.appId = portal.AppState.lastSelectedApp;
      this.application = this.AB.applicationByID(this.appId);

      const languageCode = this.AB.Config.userConfig().languageCode;

      let languageList = [];

      try {
         this.AB.Network.get({
            // The object "SITE_LANGUAGE"
            url: "/app_builder/model/d84cd351-d96c-490f-9afb-2a0b880ca0ec",
         }).then((list) => {
            list.data.forEach((item) => {
               languageList.push({
                  id: item.language_code,
                  value: item.language_label,
               });
            });
            $$(`qtt_accordion_${this.containerDomID}_translateTo`).define({
               options: languageList,
               value: languageCode,
            });
            $$(`qtt_accordion_${this.containerDomID}_translateTo`).refresh();
            $$(
               `qtt_accordion_${this.containerDomID}` + "_translateHint"
            ).define({
               options: languageList,
               value: languageList[0].id,
            });
            $$(
               `qtt_accordion_${this.containerDomID}` + "_translateHint"
            ).refresh();
            this.buildTranslationAccordion(
               this.application.objectsIncluded(),
               this.application.pages()
            );
         });

         webix.ready(function () {
            webix.protoUI(
               {
                  name: "edittree",
               },
               webix.EditAbility,
               webix.ui.tree
            );
         });

         webix.ui(this.ui());
      } catch (error) {
         console.error(error);
      }
   }

   show() {
      $$(`quickTranslationTool_${this.containerDomID}`).show();
   }

   hide() {
      $$(`quickTranslationTool_${this.containerDomID}`).hide();
   }

   showPage(pageId) {
      let page = this.application.views((v) => {
         return v.id == pageId;
      })[0];

      this.portal.showPage(page);
   }

   /*
    * helper to get the current apps views
    */
   views(f) {
      return this.AB.applicationByID(this.appId).views(f);
   }

   buildTranslationAccordion(objects, views) {
      $$(`qtt_accordion_${this.containerDomID}`).removeView(
         `qtt_accordionitem_${this.containerDomID}_objects`
      );
      $$(`qtt_accordion_${this.containerDomID}`).removeView(
         `qtt_accordionitem_${this.containerDomID}_views`
      );

      var toggleParent = (element) => {
         if (!element.parent) return false;
         var parentElem = element.parent;
         if (!parentElem.parent) return false;
         parentElem.parent.emit("changeTab", parentElem.id);
         toggleParent(parentElem.parent);
      };

      var objectTree = [
         {
            id: `qtt_object_progress${this.containerDomID}`,
            height: 7,
         },
         {
            id: `linetree_${this.containerDomID}_objects`,
            view: "edittree",
            type: "lineTree",
            editable: true,
            tooltip: "#hint#",
            // role: role,
            editor: "text",
            editValue: "value",
            template: (obj, common) => {
               let language = $$(
                  `qtt_accordion_${this.containerDomID}_translateTo`
               ).getValue();
               var color = "gray";
               if (obj.value.indexOf(`[${language}]`) > -1) {
                  color = "#ff5c4c";
               }
               if (!obj.icon) {
                  obj.icon = "minus";
               }
               var icon = `<span class="fa-stack" style="margin: 0 5px 0 4px;">
                                             <i style="color: ${color};" class="fa fa-circle fa-stack-2x"></i>
                                             <i class="fa fa-${obj.icon} fa-stack-1x fa-inverse"></i>
                                          </span>`;
               return (
                  `<span>` +
                  icon +
                  common.icon(obj, common) +
                  `<span>${obj.value}</span>`
               );
            },
            data: [],
            on: {
               onAfterLoad: (id) => {
                  if (
                     !$$(`qtt_object_progress${this.containerDomID}`)
                        .showProgress
                  ) {
                     webix.extend(
                        $$(`qtt_object_progress${this.containerDomID}`),
                        webix.ProgressBar
                     );
                  }
                  $$(`linetree_${this.containerDomID}_objects`).parse(
                     this.getTranslationToolObjectsTree(
                        objects,
                        this.containerDomID
                     )
                  );
                  $$(`linetree_${this.containerDomID}_objects`).openAll();
               },
               onAfterEditStop: (state, editor, ignoreUpdate) => {
                  if (state.old == state.value) return false;
                  let language = $$(
                     `qtt_accordion_${this.containerDomID}_translateTo`
                  ).getValue();
                  let branch = $$(
                     `linetree_${this.containerDomID}_objects`
                  ).data.getItem(editor.id);
                  let propName = branch.field;
                  let objectId = branch.objectId ? branch.objectId : branch.id;
                  let fieldId = branch.fieldId ? branch.fieldId : "";
                  let obj = this.AB.objectByID(objectId);
                  if (fieldId) {
                     let field = obj.fields((item) => {
                        return item.id == fieldId;
                     })[0];
                     if (branch.type == "option") {
                        field.settings.options.forEach((option) => {
                           if (option.id == branch.id) {
                              if (obj.languageDefault() == language) {
                                 hasLang = true;
                                 option[propName] = state.value;
                              } else {
                                 option.translations.forEach((t) => {
                                    if (t.language_code == language) {
                                       hasLang = true;
                                       t[propName] = state.value;
                                    }
                                 });
                              }
                              if (!hasLang) {
                                 var trans = {};
                                 trans.language_code = language;
                                 trans[propName] = state.value;
                                 option.translations.push(trans);
                              }
                              field.save();
                           }
                        });
                     } else {
                        var hasLang = false;
                        if (obj.languageDefault() == language) {
                           hasLang = true;
                           field[propName] = state.value;
                        } else {
                           field.translations.forEach((t) => {
                              if (t.language_code == language) {
                                 hasLang = true;
                                 t[propName] = state.value;
                              }
                           });
                        }
                        if (!hasLang) {
                           var trans = {};
                           trans.language_code = language;
                           trans[propName] = state.value;
                           field.translations.push(trans);
                        }
                        field.save();
                     }
                  } else {
                     let hasLang = false;
                     if (obj.languageDefault() == language) {
                        hasLang = true;
                        obj[propName] = state.value;
                     } else {
                        obj.translations.forEach((t) => {
                           if (t.language_code == language) {
                              hasLang = true;
                              t[propName] = state.value;
                           }
                        });
                     }
                     if (!hasLang) {
                        let trans = {};
                        trans.language_code = language;
                        trans[propName] = state.value;
                        obj.translations.push(trans);
                     }
                     obj.save();
                  }

                  let progressBar = $$(
                     `qtt_object_progress${this.containerDomID}`
                  );
                  let total = progressBar.config.total;
                  let completed = progressBar.config.completed;

                  if (
                     state.old.indexOf(`[${language}]`) == -1 &&
                     state.value.indexOf(`[${language}]`) > -1
                  ) {
                     completed--;
                  } else if (
                     state.old.indexOf(`[${language}]`) > -1 &&
                     state.value.indexOf(`[${language}]`) > -1
                  ) {
                     // no change to completed count
                  } else {
                     completed++;
                  }
                  let position = completed / total + 0.00001;
                  progressBar.define({
                     total: total,
                     completed: completed,
                  });
                  progressBar.showProgress({
                     type: "top",
                     position: position,
                  });
               },
            },
         },
      ];

      var viewTree = [
         {
            id: `qtt_view_progress${this.containerDomID}`,
            height: 7,
         },
         {
            id: `linetree_${this.containerDomID}_views`,
            view: "edittree",
            type: "lineTree",
            editable: true,
            tooltip: "#hint#",
            // role: role,
            editor: "text",
            editValue: "value",
            template: (obj, common) => {
               let language = $$(
                  `qtt_accordion_${this.containerDomID}_translateTo`
               ).getValue();
               var color = "gray";
               if (obj.value.indexOf(`[${language}]`) > -1) {
                  color = "#ff5c4c";
               }
               if (!obj.icon) {
                  obj.icon = "minus";
               }
               var externalLink = "";
               if (["button", "label", "menu"].indexOf(obj.type) == -1) {
                  externalLink = `<i style="float:right; color: lightgray" class="externalLink fa fa-external-link"></i>`;
               }
               var icon = `<span class="fa-stack" style="margin: 0 5px 0 4px;">
                                             <i style="color: ${color};" class="fa fa-circle fa-stack-2x"></i>
                                             <i class="fa fa-${obj.icon} fa-stack-1x fa-inverse"></i>
                                          </span>`;
               return (
                  `<span>` +
                  icon +
                  common.icon(obj, common) +
                  `<span>${obj.value}</span>` +
                  externalLink
               );
            },
            data: [],
            onClick: {
               externalLink: (event, branch, target) => {
                  var item = $$(
                     `linetree_${this.containerDomID}_views`
                  ).getItem(branch);

                  this.showPage(item.pageId || item.viewId);

                  if (item.type == "tab") {
                     var tabView = this.application.views(
                        (v) => v.id == item.id
                     )[0];
                     if (!tabView) return false;

                     var tab = tabView.parent;
                     if (!tab) return false;

                     toggleParent(tab);
                     if (!$$(tabView.id) || !$$(tabView.id).isVisible()) {
                        var showIt = setInterval(function () {
                           if ($$(tabView.id) && $$(tabView.id).isVisible()) {
                              clearInterval(showIt);
                           }
                           tab.emit("changeTab", tabView.id);
                        }, 200);
                     }
                  } else if (item.type == "page") {
                     debugger;
                     var pageView = this.application.views(
                        (v) => v.id == item.id
                     )[0];
                     if (!pageView) return false;
                     pageView.emit("changePage", pageView.id);
                     // this.showPage(item.pageId);
                  }

                  return false;
               },
            },
            on: {
               onAfterLoad: (id) => {
                  if (
                     !$$(`qtt_view_progress${this.containerDomID}`).showProgress
                  ) {
                     webix.extend(
                        $$(`qtt_view_progress${this.containerDomID}`),
                        webix.ProgressBar
                     );
                  }
                  $$(`linetree_${this.containerDomID}_views`).parse(
                     this.getTranslationToolViewsTree(
                        views,
                        this.containerDomID
                     )
                  );
                  $$(`linetree_${this.containerDomID}_views`).openAll();
               },
               onAfterEditStop: (state, editor, ignoreUpdate) => {
                  if (state.old == state.value) return false;
                  let language = $$(
                     `qtt_accordion_${this.containerDomID}_translateTo`
                  ).getValue();
                  let branch = $$(
                     `linetree_${this.containerDomID}_views`
                  ).data.getItem(editor.id);
                  let propName = branch.field;
                  if (branch.type == "menu") {
                     let view = this.application.views((view) => {
                        return view.id == branch.viewId;
                     })[0];
                     view.settings.order.forEach((button) => {
                        if (button.pageId == branch.buttonId) {
                           let hasLang = false;
                           button.translations.forEach((t) => {
                              if (t.language_code == language) {
                                 hasLang = true;
                                 t[propName] = state.value;
                              }
                           });
                           if (!hasLang) {
                              let trans = {};
                              trans.language_code = language;
                              trans[propName] = state.value;
                              button.translations.push(trans);
                           }
                           view.save();
                        }
                     });
                  } else if (branch.type == "button") {
                     let view = this.application.views((view) => {
                        return view.id == branch.viewId;
                     })[0];
                     var hasLang = false;

                     if (view.languageDefault() == language) {
                        hasLang = true;
                        view.settings[propName] = state.value;
                     } else {
                        view.settings.translations.forEach((t) => {
                           if (t.language_code == language) {
                              hasLang = true;
                              t[propName] = state.value;
                           }
                        });
                     }
                     if (!hasLang) {
                        var trans = {};
                        trans.language_code = language;
                        trans[propName] = state.value;
                        view.settings.translations.push(trans);
                     }
                     view.save();
                  } else {
                     let view = this.application.views((view) => {
                        return view.id == branch.id;
                     })[0];
                     let hasLang = false;
                     if (view.languageDefault() == language) {
                        hasLang = true;
                        view[propName] = state.value;
                     } else {
                        view.translations.forEach((t) => {
                           if (t.language_code == language) {
                              hasLang = true;
                              t[propName] = state.value;
                           }
                        });
                     }
                     if (!hasLang) {
                        let trans = {};
                        trans.language_code = language;
                        trans[propName] = state.value;
                        view.translations.push(trans);
                     }
                     view.save();
                  }
                  let progressBar = $$(
                     `qtt_view_progress${this.containerDomID}`
                  );
                  let total = progressBar.config.total;
                  let completed = progressBar.config.completed;
                  if (
                     state.old.indexOf(`[${language}]`) == -1 &&
                     state.value.indexOf(`[${language}]`) > -1
                  ) {
                     completed--;
                  } else if (
                     state.old.indexOf(`[${language}]`) > -1 &&
                     state.value.indexOf(`[${language}]`) > -1
                  ) {
                     // no change to completed count
                  } else {
                     completed++;
                  }
                  let position = completed / total + 0.00001;
                  progressBar.define({
                     total: total,
                     completed: completed,
                  });
                  progressBar.showProgress({
                     type: "top",
                     position: position,
                  });
               },
            },
         },
      ];

      var objectsAccordionItem = {
         view: "accordionitem",
         id: `qtt_accordionitem_${this.containerDomID}_objects`,
         header: "Data Objects",
         collapsed: true,
         body: {
            type: "clean",
            rows: objectTree,
         },
      };

      var viewsAccordionItem = {
         view: "accordionitem",
         id: `qtt_accordionitem_${this.containerDomID}_views`,
         header: "Interface Items",
         collapsed: true,
         body: {
            type: "clean",
            rows: viewTree,
         },
      };

      $$(`qtt_accordion_${this.containerDomID}`).addView(
         objectsAccordionItem,
         -1
      );
      $$(`qtt_accordion_${this.containerDomID}`).addView(
         viewsAccordionItem,
         -1
      );
      $$(`qtt_accordion_${this.containerDomID}`).show();
      $$(`qtt_accordionitem_${this.containerDomID}_views`).collapse();
      $$(`qtt_accordion_noSelection_${this.containerDomID}`).hide();

      $$(`linetree_${this.containerDomID}_objects`).openAll();
      $$(`linetree_${this.containerDomID}_views`).openAll();
   }

   getTranslations(translations, domId, field, completed, total) {
      var missingHint = false;
      var missingTranslate = false;
      var translateLang = $$(`qtt_accordion_${domId}_translateTo`).getValue();
      var value = translations.filter((item) => {
         return item.language_code == translateLang;
      })[0];
      if (!value) {
         // we didn't find the language so we are defaulting to first language
         missingTranslate = true;
         value = translations[0];
      }
      var hintLang = $$(`qtt_accordion_${domId}_translateHint`).getValue();
      var hint = translations.filter((item) => {
         return item.language_code == hintLang;
      })[0];
      if (!hint) {
         // we didn't find the language so we are defaulting to first language
         missingHint = true;
         hint = translations[0];
      }

      var hintLabel = "";
      var valueLabel = "";

      // some items store the text we need translated under "text"
      if (field) {
         hintLabel = hint[field];
         valueLabel = value[field];
      }
      if (!hintLabel) {
         hintLabel = hint.label;
      }
      if (!valueLabel) {
         valueLabel = value.label;
      }

      var hintPrefix = "";
      if (missingHint) {
         hintPrefix = `[${hintLang}] `;
      }
      var translatePrefix = "";
      if (missingTranslate) {
         translatePrefix = `[${translateLang}] `;
      }
      if (
         (valueLabel || "").indexOf(`[${translateLang}]` == -1) &&
         !missingTranslate
      ) {
         completed++;
      }
      total++;
      return {
         hint: hintPrefix + hintLabel,
         value: translatePrefix + valueLabel,
         completed: completed,
         total: total,
      };
   }

   getTranslationToolViewsTree(views, domId) {
      var completed = 0;
      var total = 0;
      // this so it looks right/indented in a tree view:
      var tree = new webix.TreeCollection();

      /**
       * @method addPage
       *
       * @param {ABView} page
       * @param {integer} index
       * @param {uuid} parentId
       */
      var addPage = (page, parentId, type, field = "label", viewId) => {
         var translations = page.translations;
         var pageId = page.id;
         if (type == "button") {
            translations = page.settings.translations;
            pageId = `${page.id}_${field}`;
         }
         var labels = this.getTranslations(
            translations,
            domId,
            field,
            completed,
            total
         );
         completed = labels.completed;
         total = labels.total;
         var icon = page.tabicon ? page.tabicon : page.icon;

         // add to tree collection
         var branch = {
            id: pageId,
            value: labels.value,
            hint: labels.hint,
            field: field,
            viewId: viewId,
            translations: page.translations,
            pageId: parentId,
            buttonId: page.pageId,
            type: type,
            icon: icon,
         };
         tree.add(branch, null, parentId);

         // stop at detail views
         // if (page.defaults.key == "detail") {
         //    return;
         // }

         var subPages = page.pages ? page.pages() : [];
         subPages.forEach((childPage, childIndex) => {
            addPage(childPage, page.id, "page");
         });

         // stop if there are no views to parse
         if (!page.views) return;
         // add labels
         page
            .views((v) => v.defaults.key == "label")
            .forEach((label, labelIndex) => {
               // label views
               // label.icon = "th-list";
               addPage(label, page.id, "label", "text", label.id);
            });
         // add tabs
         page
            .views((v) => v.defaults.key == "tab")
            .forEach((tab, tabIndex) => {
               // tab views
               tab.views().forEach((tabView, tabViewIndex) => {
                  // tab items will be below sub-page items
                  // tabView.icon = "th-list";
                  addPage(tabView, page.id, "tab", "label", tab.id);
               });
            });
         // add menus
         page
            .views((v) => v.defaults.key == "menu")
            .forEach((menu, menuIndex) => {
               // menu buttons
               if (!menu.settings.order) return;
               menu.settings.order.forEach((menuItem, menuItemIndex) => {
                  // tab items will be below sub-page items
                  // menuItem.icon = "link";
                  addPage(menuItem, page.id, "menu", "aliasname", menu.id);
               });
            });
         // add form buttons
         page
            .views((v) => v.defaults.key == "form")
            .forEach((form, formIndex) => {
               // form inputs
               form.views().forEach((formInput, formInputIndex) => {
                  // we only need buttons
                  if (formInput.key == "button") {
                     for (const property in formInput.settings
                        .translations[0]) {
                        if (property != "language_code") {
                           addPage(
                              formInput,
                              page.id,
                              "button",
                              property,
                              formInput.id
                           );
                        }
                     }
                  }
               });
            });
         // add chart labels
         page
            .views((v) => v.defaults.key == "chart")
            .forEach((chart, chartIndex) => {
               // chart views
               chart.views().forEach((view, viewIndex) => {
                  // we only need buttons
                  if (view.key == "label") {
                     addPage(view, page.id, "label", "text", view.id);
                  }
               });
            });
      };
      views.forEach((p, index) => {
         addPage(p, null, "page", "label", p.id);
      });

      // there is a webix bug that will not allow you to se the value of a progress bar to 0
      let progressBar = $$(`qtt_view_progress${domId}`);
      let position = completed / total + 0.0001;
      progressBar.showProgress({
         type: "top",
         position: position,
      });
      progressBar.define({
         total: total,
         completed: completed,
      });

      return tree;
   }

   getTranslationToolObjectsTree(objects, domId) {
      var completed = 0;
      var total = 0;
      // this so it looks right/indented in a tree view:
      var tree = new webix.TreeCollection();

      /**
       * @method addBranch
       *
       * @param {ABView} page
       * @param {uuid} parentId
       * @param {string} type
       */
      var addBranch = (
         object,
         parentId,
         type,
         field = "label",
         fieldId,
         objectId
      ) => {
         var translations = object.translations;
         var labels = this.getTranslations(
            translations,
            domId,
            field,
            completed,
            total
         );
         completed = labels.completed;
         total = labels.total;

         // add to tree collection
         var branch = {
            id: object.id,
            value: labels.value,
            hint: labels.hint,
            translations: object.translations,
            pageId: parentId,
            objectId: objectId,
            type: type,
            field: field,
            fieldId: fieldId,
            icon:
               type == "object" ? "database" : object.icon ? object.icon : "",
         };
         tree.add(branch, null, parentId);

         var fields = object.fields ? object.fields() : [];
         fields.forEach((field, fieldIndex) => {
            addBranch(field, object.id, "field", "label", field.id, object.id);
         });

         // add options
         if (
            object.settings &&
            object.settings.options &&
            object.settings.options.length
         ) {
            object.settings.options.forEach((option, optionIndex) => {
               addBranch(
                  option,
                  object.id,
                  "option",
                  "text",
                  fieldId,
                  parentId
               );
            });
         }
      };
      objects.forEach((p, index) => {
         addBranch(p, null, "object");
      });

      // there is a webix bug that will not allow you to se the value of a progress bar to 0
      let progressBar = $$(`qtt_object_progress${domId}`);
      let position = completed / total + 0.0001;
      progressBar.showProgress({
         type: "top",
         position: position,
      });
      progressBar.define({
         total: total,
         completed: completed,
      });

      return tree;
   }
}

export default new PortalTranslationTool();
