/* eslint-disable prettier/prettier */
const ABViewComponent = require("./ABViewComponent").default;
const ABViewFormButtonCore = require("../../../core/views/ABViewFormButtonCore");

const L = (...params) => AB.Multilingual.label(...params);
const ABViewFormButtonPropertyComponentDefaults =
   ABViewFormButtonCore.defaultValues();

module.exports = class ABViewFormButton extends ABViewComponent {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewFormButton_${baseView.id}`;
      super(baseView, idBase, {});
   }

   ui() {
      const self = this;
      const _ui = {
         id: this.ids.component,
         cols: []
      };

      const form = this.view.parentFormComponent();
      const settings = this.view.settings ?? {};

      const alignment =
         settings.alignment ??
         ABViewFormButtonPropertyComponentDefaults.alignment;

      // spacer
      if (alignment == "center" || alignment == "right") {
         _ui.cols.push({});
      }

      // cancel button
      if (settings.includeCancel) {
         _ui.cols.push(
            {
               view: "button",
               autowidth: true,
               value: settings.cancelLabel || L("Cancel"),
               click: function () {
                  self.onCancel(this);
               },
               on: {
                  onAfterRender: function () {
                     this.getInputNode().setAttribute(
                        "data-cy",
                        `button cancel ${form.id}`
                     );
                  }
               }
            },
            {
               width: 10
            }
         );
      }

      // reset button
      if (settings.includeReset) {
         _ui.cols.push(
            {
               view: "button",
               autowidth: true,
               value: settings.resetLabel || L("Reset"),
               click: function () {
                  self.onClear(this);
               },
               on: {
                  onAfterRender: function () {
                     this.getInputNode().setAttribute(
                        "data-cy",
                        `button reset ${form.id}`
                     );
                  }
               }
            },
            {
               width: 10
            }
         );
      }

      // save button
      if (settings.includeSave) {
         _ui.cols.push({
            view: "button",
            type: "form",
            css: "webix_primary",
            autowidth: true,
            value: settings.saveLabel || L("Save"),
            click: function () {
               self.onSave(this);
            },
            on: {
               onAfterRender: function () {
                  this.getInputNode().setAttribute(
                     "data-cy",
                     `button save ${form.id}`
                  );
               }
            }
         });
      }

      // spacer
      if (alignment == "center" || alignment == "left") {
         _ui.cols.push({});
      }

      return _ui;
   }

   onCancel(cancelButton) {
      const settings = this.view.settings ?? {};

      // get form component
      const form = this.view.parentFormComponent();

      // get ABDatacollection
      const dc = form.datacollection;

      // clear cursor of DC
      dc?.setCursor(null);

      cancelButton?.getFormView?.().clear();

      if (settings.afterCancel) form.changePage(settings.afterCancel);
      // If the redirect page is not defined, then redirect to parent page
      else {
         const noPopupFilter = (p) => p.settings && p.settings.type != "popup";

         const pageCurr = this.pageParent();
         if (pageCurr) {
            const pageParent = pageCurr.pageParent(noPopupFilter) ?? pageCurr;

            if (pageParent) form.changePage(pageParent.id);
         }
      }
   }

   onClear(resetButton) {
      // get form component
      const form = this.view.parentFormComponent();

      // get ABDatacollection
      const dc = form.datacollection;

      // clear cursor of DC
      if (dc) {
         dc.setCursor(null);
      }

      resetButton?.getFormView?.().clear();
   }

   onSave(saveButton) {
      // get form component
      const form = this.view.parentFormComponent();
      const formView = saveButton.getFormView();

      // disable the save button
      saveButton.disable();

      // save data
      form
         .saveData(formView)
         .then(() => {
            saveButton?.enable();

            //Focus on first focusable component
            form.focusOnFirst();
         })
         .catch((err) => {
            console.error(err);
            saveButton?.enable();
         });
   }
};
