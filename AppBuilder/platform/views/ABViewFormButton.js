const ABViewFormButtonCore = require("../../core/views/ABViewFormButtonCore");

const ABViewFormButtonPropertyComponentDefaults = ABViewFormButtonCore.defaultValues();

let L = (...params) => AB.Label()("", ...params);

module.exports = class ABViewFormButton extends ABViewFormButtonCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

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
   editorComponent(App, mode) {
      var idBase = "ABViewFormButtonEditorComponent";
      var ids = {
         component: App.unique(idBase + "_component"),
      };

      var button = this.component(App).ui;
      button.id = ids.component;

      var _ui = {
         rows: [button, {}],
      };

      var _init = (options) => {};

      var _logic = {};

      return {
         ui: _ui,
         init: _init,
         logic: _logic,
      };
   }

   //
   // Property Editor
   //

   static propertyEditorDefaultElements(App, ids, _logic, ObjectDefaults) {
      var commonUI = super.propertyEditorDefaultElements(
         App,
         ids,
         _logic,
         ObjectDefaults
      );

      // in addition to the common .label  values, we
      // ask for:
      return commonUI.concat([
         {
            name: "includeSave",
            view: "checkbox",
            label: L("Save"),
         },
         {
            name: "saveLabel",
            view: "text",
            labelWidth: App.config.labelWidthLarge,
            label: L("Save Label"),
            placeholder: L("Save Placeholder"),
         },
         {
            name: "includeCancel",
            view: "checkbox",
            label: L("Cancel"),
         },
         {
            name: "cancelLabel",
            view: "text",
            labelWidth: App.config.labelWidthLarge,
            label: L("Cancel Label"),
            placeholder: L("Cancel Placeholder"),
         },
         {
            name: "includeReset",
            view: "checkbox",
            label: L("Reset"),
         },
         {
            name: "resetLabel",
            view: "text",
            labelWidth: App.config.labelWidthLarge,
            label: L("Reset Label"),
            placeholder: L("Reset Placeholder"),
         },
         {
            name: "afterCancel",
            view: "richselect",
            labelWidth: App.config.labelWidthLarge,
            label: L("After Cancel"),
            // options: []
         },
         {
            name: "alignment",
            view: "richselect",
            labelWidth: App.config.labelWidthLarge,
            label: L("Alignment"),
            options: [
               {
                  id: "left",
                  value: L("Left"),
               },
               {
                  id: "center",
                  value: L("Center"),
               },
               {
                  id: "right",
                  value: L("Right"),
               },
            ],
         },
      ]);
   }

   static propertyEditorPopulate(App, ids, view) {
      super.propertyEditorPopulate(App, ids, view);

      var pagesList = [];
      var allPage = view.application.pages();
      view.AddPagesToList(pagesList, view.application, view.pageRoot().id);

      var opts = pagesList.map(function (opt) {
         return {
            id: opt.id,
            value: opt.value,
         };
      });
      $$(ids.afterCancel).define("options", opts);

      $$(ids.includeSave).setValue(
         view.settings.includeSave != null
            ? view.settings.includeSave
            : ABViewFormButtonPropertyComponentDefaults.includeSave
      );
      $$(ids.includeCancel).setValue(
         view.settings.includeCancel != null
            ? view.settings.includeCancel
            : ABViewFormButtonPropertyComponentDefaults.includeCancel
      );
      $$(ids.includeReset).setValue(
         view.settings.includeReset != null
            ? view.settings.includeReset
            : ABViewFormButtonPropertyComponentDefaults.includeReset
      );

      $$(ids.saveLabel).setValue(view.settings.saveLabel || "");
      $$(ids.cancelLabel).setValue(view.settings.cancelLabel || "");
      $$(ids.resetLabel).setValue(view.settings.resetLabel || "");

      $$(ids.afterCancel).setValue(
         view.settings.afterCancel ||
            ABViewFormButtonPropertyComponentDefaults.afterCancel
      );
      $$(ids.alignment).setValue(
         view.settings.alignment ||
            ABViewFormButtonPropertyComponentDefaults.alignment
      );
   }

   static propertyEditorValues(ids, view) {
      super.propertyEditorValues(ids, view);

      view.settings.includeSave = $$(ids.includeSave).getValue();
      view.settings.saveLabel = $$(ids.saveLabel).getValue();
      view.settings.includeCancel = $$(ids.includeCancel).getValue();
      view.settings.cancelLabel = $$(ids.cancelLabel).getValue();
      view.settings.includeReset = $$(ids.includeReset).getValue();
      view.settings.resetLabel = $$(ids.resetLabel).getValue();
      view.settings.afterCancel = $$(ids.afterCancel).getValue();
      view.settings.alignment = $$(ids.alignment).getValue();
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(App) {
      var idBase = this.parentFormUniqueID(
         "ABViewFormButton_" + this.id + "_f_"
      );
      var ids = {
         component: App.unique(idBase + "_component"),
      };

      var form = this.parentFormComponent();

      var _ui = {
         id: ids.component,
         cols: [],
      };

      var alignment =
         this.settings.alignment ||
         ABViewFormButtonPropertyComponentDefaults.alignment;

      // spacer
      if (alignment == "center" || alignment == "right") {
         _ui.cols.push({});
      }

      // cancel button
      if (this.settings.includeCancel) {
         _ui.cols.push(
            {
               view: "button",
               autowidth: true,
               value: this.settings.cancelLabel || L("Cancel"),
               click: function () {
                  _logic.onCancel(this);
               },
               on: {
                  onAfterRender: function () {
                     this.getInputNode().setAttribute(
                        "data-cy",
                        "button cancel " + form.id
                     );
                  },
               },
            },
            {
               width: 10,
            }
         );
      }

      // reset button
      if (this.settings.includeReset) {
         _ui.cols.push(
            {
               view: "button",
               autowidth: true,
               value: this.settings.resetLabel || L("Reset"),
               click: function () {
                  _logic.onClear(this);
               },
               on: {
                  onAfterRender: function () {
                     this.getInputNode().setAttribute(
                        "data-cy",
                        "button reset " + form.id
                     );
                  },
               },
            },
            {
               width: 10,
            }
         );
      }

      // save button
      if (this.settings.includeSave) {
         _ui.cols.push({
            view: "button",
            type: "form",
            css: "webix_primary",
            autowidth: true,
            value: this.settings.saveLabel || L("Save"),
            click: function () {
               _logic.callbacks.onSaveClick(this);
            },
            on: {
               onAfterRender: function () {
                  this.getInputNode().setAttribute(
                     "data-cy",
                     "button save " + form.id
                  );
               },
            },
         });
      }

      // spacer
      if (alignment == "center" || alignment == "left") {
         _ui.cols.push({});
      }

      // make sure each of our child views get .init() called
      var _init = (options) => {
         // register our callbacks:
         if (options) {
            for (var c in _logic.callbacks) {
               _logic.callbacks[c] = options[c] || _logic.callbacks[c];
            }
         }
      };

      var _logic = (this._logic = {
         callbacks: {
            onCancelClick: function () {
               return true;
            },
            onSaveClick: function (saveButton) {
               _logic.onSave(saveButton);
            },
         },

         onCancel: (cancelButton) => {
            // attempt to call onCancleClick callback...if no override is set we simply return false
            var shouldContinue = _logic.callbacks.onCancelClick();

            // if override was called we should have returned true so we can stop now
            if (!shouldContinue) {
               return false;
            }

            // get form component
            var form = this.parentFormComponent();

            // get ABDatacollection
            var dc = form.datacollection;

            // clear cursor of DC
            if (dc) {
               dc.setCursor(null);
            }

            if (cancelButton.getFormView()) cancelButton.getFormView().clear();

            if (this.settings.afterCancel)
               super.changePage(this.settings.afterCancel);
            // If the redirect page is not defined, then redirect to parent page
            else {
               var noPopupFilter = (p) =>
                  p.settings && p.settings.type != "popup";

               var pageCurr = this.pageParent();
               if (pageCurr) {
                  var pageParent =
                     pageCurr.pageParent(noPopupFilter) || pageCurr;

                  if (pageParent) super.changePage(pageParent.id);
               }
            }
         },

         onClear: (resetButton) => {
            // get form component
            var form = this.parentFormComponent();

            // get ABDatacollection
            var dc = form.datacollection;

            // clear cursor of DC
            if (dc) {
               dc.setCursor(null);
            }

            if (resetButton.getFormView()) resetButton.getFormView().clear();
         },

         onSave: (saveButton) => {
            // get form component
            var form = this.parentFormComponent();
            var formView = saveButton.getFormView();

            // disable the save button
            saveButton.disable();

            // save data
            form
               .saveData(formView)
               .then(() => {
                  if (saveButton && saveButton.$view) saveButton.enable();

                  //Focus on first focusable component
                  form.focusOnFirst();
               })
               .catch(() => {
                  if (saveButton && saveButton.$view) saveButton.enable();
               });
         },
      });

      return {
         ui: _ui,
         init: _init,
         logic: _logic,
      };
   }

   AddPagesToList(pagesList, parent, rootPageId) {
      if (!parent || !parent.pages || !pagesList) return;

      var pages = parent.pages() || [];

      pages.forEach((page) => {
         if (page.parent != null || page.id == rootPageId) {
            pagesList.push({
               id: page.id,
               value: page.label,
            });

            this.AddPagesToList(pagesList, page, page.id);
         }
      });
   }

   /**
    * @method parentFormUniqueID
    * return a unique ID based upon the closest form object this component is on.
    * @param {string} key  The basic id string we will try to make unique
    * @return {string}
    */
   parentFormUniqueID(key) {
      var form = this.parentFormComponent();
      var uniqueInstanceID;
      if (form) {
         uniqueInstanceID = form.uniqueInstanceID;
      } else {
         uniqueInstanceID = webix.uid();
      }

      return key + uniqueInstanceID;
   }
};
