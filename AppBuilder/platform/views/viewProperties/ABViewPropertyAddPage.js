import ABViewProperty from "./ABViewProperty";
import ABViewFormButton from "../ABViewFormButton";
import ABViewPDFImporter from "../ABViewPDFImporter";

let L = (...params) => AB.Multilingual.label(...params);

export default class ABViewPropertyAddPage extends ABViewProperty {
   /**
    * @property default
    * return default settings
    *
    * @return {Object}
    */
   static get default() {
      return {
         formView: "none", // id of form to add new data
      };
   }

   static propertyComponent(App, idBase) {
      let ids = {
         formView: `${idBase}_formView`,
      };

      let ui = {
         id: ids.formView,
         name: "formView",
         view: "richselect",
         label: L("Add New Form"),
         labelWidth: this.AB.UISettings.config().labelWidthXLarge,
         on: {
            onChange: (newVal, oldVal) => {
               if (newVal == L("No add new option")) {
                  $$(ids.formView).setValue("");
               }

               _logic.callbacks.onSave();
            },
         },
      };

      let _init = (options) => {
         for (let c in _logic.callbacks) {
            _logic.callbacks[c] = options[c] || _logic.callbacks[c];
         }
      };

      let _logic = {
         callbacks: {
            onSave: function () {
               console.warn("NO onSave()!");
            },
         },

         setSettings: (view, settings = {}) => {
            if (view == null) return;

            // Set the options of the possible edit forms
            let editForms = [
               {
                  id: "none",
                  value: L("No add new option"),
               },
            ];

            let pagesHasForm = view
               .pageRoot()
               .pages((p) => {
                  return p.views((v) => {
                     return (
                        v &&
                        v.key == "form" &&
                        v.datacollection &&
                        v.datacollection.datasource &&
                        v.datacollection.datasource.id ==
                           view.field().settings.linkObject
                     );
                  }, true).length;
               }, true)
               .map((p) => {
                  return {
                     id: p.id,
                     value: p.label,
                  };
               });

            editForms = editForms.concat(pagesHasForm);

            let $selector = $$(ids.formView);
            if ($selector) {
               $selector.define("options", editForms);
               $selector.define(
                  "value",
                  settings.formView || this.default.formView
               );
               $selector.refresh();
            }
         },

         getSettings: (view) => {
            let settings = view.settings || {};

            settings.formView = $$(ids.formView).getValue();

            return settings;
         },
      };

      return {
         ui: ui,
         init: _init,
         setSettings: _logic.setSettings,
         getSettings: _logic.getSettings,
      };
   }

   fromSettings(settings = {}) {
      this.settings = this.settings || {};
      this.settings.formView =
         settings.formView || this.constructor.default.formView;
   }

   getIds(idBase, App) {
      return {
         popup: App._App.unique(`${idBase}_popup_add_new`),
         field: idBase.split("_")[1],
         button: App._App.unique(`${idBase}_popup_add_new_button`),
      };
   }

   component(App, idBase) {
      // This can be overwritten by creating a different getIds before calling .super
      let ids = this.getIds(idBase, App);

      let ui = "";

      if (
         this.settings.formView &&
         this.settings.formView != this.constructor.default.formView
      ) {
         // let iDiv = document.createElement("div");
         // iDiv.className = "ab-connect-add-new";
         const dataCy = `add new CR button ${this.settings.formView} ${ids.field}`;
         // iDiv.innerHTML = `<a href="javascript:void(0);" class="fa fa-plus ab-connect-add-new-link" data-cy="${dataCy}"></a>`;
         // iDiv.appendChild(node);
         // ui = iDiv.outerHTML;
         ui = {
            id: ids.button,
            view: "button",
            type: "icon",
            icon: "fa fa-plus",
            width: 32,
            height: 32,
            css: "webix_primary ab-connect-add-new-link",
            on: {
               onAfterRender: () => {
                  $$(ids.button)
                     ?.$view.querySelector("button")
                     .setAttribute("data-cy", dataCy);
               },
            },
         };
      }

      let _logic = {
         callbacks: {
            onSaveData: (saveData) => {
               if ($$(ids.popup)) $$(ids.popup).close();
            },
            onCancel: () => {
               if ($$(ids.popup)) $$(ids.popup).close();

               return false;
            },
            onClearOnLoad: () => {
               return true;
            },
            clearOnLoad: () => {
               return true;
            },
         },

         applicationLoad: (application) => {
            this._application = application;
         },

         onClick: (dc) => {
            let pageId = this.settings.formView;
            let page = this._application.pages((p) => p.id == pageId, true)[0];

            return _logic.openFormPopup(page, dc);
         },

         /**
          * @method openFormPopup
          *
          * @param page {ABViewPage}
          * @param dc {ABDataCollection}
          */
         openFormPopup: (page, dc) => {
            return new Promise((resolve, reject) => {
               if (this._application == null) return resolve();

               if ($$(ids.popup)) {
                  $$(ids.popup).show();
                  return resolve();
               }

               // Clone page so we modify without causing problems
               let pageClone = page.clone(null, null, { ignoreSubPages: true });
               pageClone.id = this._application.AB.uuid(); // lets take the stored id can create a new dynamic one so our views don't duplicate
               // pageClone.id = pageClone.id + "-" + webix.uid(); // lets take the stored id can create a new dynamic one so our views don't duplicate
               let popUpComp = pageClone.component();
               let ui = popUpComp.ui();

               // Listen 'saved' event of the form widget
               const saveViews =
                  pageClone.views(
                     (v) =>
                        v instanceof ABViewFormButton ||
                        v instanceof ABViewPDFImporter,
                     true
                  ) ?? [];

               saveViews.forEach((view) => {
                  const v =
                     view instanceof ABViewFormButton ? view.parent : view;
                  v.on("saved", (savedData) => {
                     _logic?.callbacks?.onSaveData(savedData);
                     // ? is there ever a case where we want to keep an add popup open after saving?
                     // ! setting this to always close

                     if ($$(ids.popup)) {
                        $$(ids.popup).close();
                     } else {
                        var popup = this.getTopParentView();
                        popup.close();
                     }
                  });
               });

               let popupTemplate = {
                  view: "window",
                  id: ids.popup,
                  modal: true,
                  position: "center",
                  // position:function(stthis.__addPageToolate){
                  // 	state.left = x + 20this.__addPageTool; // offset the popups
                  // 	state.top = y + 20;this.__addPageTool
                  // },
                  resize: true,
                  width: parseInt(this.settings.popupWidth) || 700,
                  height: parseInt(this.settings.popupHeight) + 44 || 450,
                  css: "ab-main-container",
                  head: {
                     view: "toolbar",
                     css: "webix_dark",
                     cols: [
                        {
                           view: "label",
                           label: page.label,
                           css: "modal_title",
                           align: "center",
                        },
                        {
                           view: "button",
                           label: L("Close"),
                           autowidth: true,
                           align: "center",
                           click: function () {
                              var popup = this.getTopParentView();
                              popup.close();
                           },
                        },
                     ],
                  },
                  body: {
                     view: "scrollview",
                     scroll: true,
                     body: ui,
                  },
               };

               // Create popup
               webix.ui(popupTemplate).show();

               // Initial UI components
               const accessLevel = 3; // TODO: Is it correct
               popUpComp.init(this._application.AB, accessLevel, {
                  onSaveData: _logic.callbacks.onSaveData,
                  onCancelClick: _logic.callbacks.onCancel,
                  clearOnLoad: _logic.callbacks.clearOnLoad,
                  onClearOnLoad: _logic.callbacks.onClearOnLoad,
               });

               popUpComp.onShow();

               setTimeout(async () => {
                  _logic.setDefaultValue(dc, pageClone);

                  resolve();
               }, 100);
            });
         },

         setDefaultValue: (dc, page) => {
            if (!dc) return;

            let obj = dc.datasource;
            if (!obj) return;

            let linkedData = dc.getCursor();
            if (!linkedData) return;

            page.views().forEach((v) => {
               if (!v || v.key != "form") return;

               v.views().forEach((fView) => {
                  if (fView.key != "connect" || fView.settings == null) return;

                  let field = fView.field();
                  if (field == null) return;

                  let objLink = field.datasourceLink;
                  if (objLink == null || objLink.id != obj.id) return;

                  let data = {};
                  let relationName = field.relationName();
                  data[relationName] = {
                     id: linkedData.id,
                  };

                  // Add custom index values
                  let indexes = obj.indexes() || [];
                  indexes.forEach((idx) => {
                     (idx.fields || []).forEach((f) => {
                        data[relationName][f.columnName] =
                           linkedData[f.columnName];
                     });
                  });

                  // Set label of selected item
                  if (linkedData.text) {
                     data[relationName].text = linkedData.text;
                     data[relationName].value = data[relationName].text;
                  } else {
                     let rawData = {};
                     rawData[relationName] = linkedData;
                     data[relationName].text = field.format(rawData);
                     data[relationName].value = data[relationName].text;
                  }

                  let comp = v.viewComponents[fView.id];
                  if (!comp) return;

                  const ui = typeof comp.ui == "function" ? comp.ui() : comp.ui;
                  const inputId = ui?.inputId || ui?.rows?.[0]?.inputId;

                  if (inputId) field.setValue($$(inputId), data);
               });
            });
         },
      };

      let init = (options) => {
         for (let c in _logic.callbacks) {
            _logic.callbacks[c] = options[c] || _logic.callbacks[c];
         }
         if (ui) {
            for (let c in options) {
               ui.on[c] = options[c];
            }
         }
      };

      return {
         ui: ui,
         init: init,

         applicationLoad: _logic.applicationLoad,
         onClick: _logic.onClick,
         openFormPopup: _logic.openFormPopup,
      };
   }
}
