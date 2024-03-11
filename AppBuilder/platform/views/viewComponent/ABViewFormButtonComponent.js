const ABViewFormItemComponent = require("./ABViewFormItemComponent");

module.exports = class ABViewFormButton extends ABViewFormItemComponent {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewFormButton_${baseView.id}`, ids);
   }

   ui() {
      const self = this;
      const baseView = this.view;
      const form = baseView.parentFormComponent();
      const settings = baseView.settings ?? {};

      const alignment =
         settings.alignment || baseView.constructor.defaultValues().alignment;

      const _ui = {
         cols: [],
      };

      // spacer
      if (alignment === "center" || alignment === "right") {
         _ui.cols.push({});
      }

      // delete button
      if (settings.includeDelete) {
         _ui.cols.push(
            {
               view: "button",
               autowidth: true,
               value: settings.deleteLabel || this.label("Delete"),
               css: "webix_danger",
               click: function () {
                  self.onDelete(this);
               },
               on: {
                  onAfterRender: function () {
                     this.getInputNode().setAttribute(
                        "data-cy",
                        `button delete ${form.id}`
                     );
                  },
               },
            },
            {
               width: 10,
            }
         );
      }

      // cancel button
      if (settings.includeCancel) {
         _ui.cols.push(
            {
               view: "button",
               autowidth: true,
               value: settings.cancelLabel || this.label("Cancel"),
               click: function () {
                  self.onCancel(this);
               },
               on: {
                  onAfterRender: function () {
                     this.getInputNode().setAttribute(
                        "data-cy",
                        `button cancel ${form.id}`
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
      if (settings.includeReset) {
         _ui.cols.push(
            {
               view: "button",
               autowidth: true,
               value: settings.resetLabel || this.label("Reset"),
               click: function () {
                  self.onClear(this);
               },
               on: {
                  onAfterRender: function () {
                     this.getInputNode().setAttribute(
                        "data-cy",
                        `button reset ${form.id}`
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
      if (settings.includeSave) {
         _ui.cols.push({
            view: "button",
            type: "form",
            css: "webix_primary",
            autowidth: true,
            value: settings.saveLabel || this.label("Save"),
            click: function () {
               self.onSave(this);
            },
            on: {
               onAfterRender: function () {
                  this.getInputNode().setAttribute(
                     "data-cy",
                     `button save ${form.id}`
                  );
               },
            },
         });
      }

      // spacer
      if (alignment === "center" || alignment === "left") _ui.cols.push({});

      return super.ui(_ui);
   }

   onCancel(cancelButton) {
      const baseView = this.view;
      const settings = baseView.settings ?? {};

      // get form component
      const form = baseView.parentFormComponent();

      // get ABDatacollection
      const dc = form.datacollection;

      // clear cursor of DC
      dc?.setCursor(null);

      cancelButton?.getFormView?.().clear();

      if (settings.afterCancel) form.changePage(settings.afterCancel);
      // If the redirect page is not defined, then redirect to parent page
      else {
         const noPopupFilter = (p) => p.settings && p.settings.type != "popup";

         const pageCurr = this.view.pageParent();
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
      if (!saveButton) {
         console.error("Require the button element");
         return;
      }
      // get form component
      const form = this.view.parentFormComponent();
      const formView = saveButton.getFormView();

      // disable the save button
      saveButton.disable?.();

      // save data
      form
         .saveData(formView)
         .then(() => {
            saveButton.enable?.();

            //Focus on first focusable component
            form.focusOnFirst();
         })
         .catch((err) => {
            console.error(err);
            // Catch uncaught error reported in Sentry and add context
            // APPBUILDER-WEB-1A3(https://appdev-designs.sentry.io/issues/4631880265/)
            try {
               saveButton.enable?.();
            } catch (e) {
               this.AB.notify.developer(e, {
                  context:
                     "formButton.onSave > catch err > saveButton.enable()",
                  buttonID: this?.view?.id,
                  formID: this?.view?.parent?.id,
               });
            }
         });
   }

   onDelete(deleteButton) {
      this.AB.Webix.confirm({
         title: this.label("Delete data"),
         text: this.label("Do you want to delete this data?"),
         callback: async (confirm) => {
            if (!confirm) return;

            deleteButton.disable?.();

            try {
               // get form component
               const form = this.view.parentFormComponent();
               const $formView = deleteButton.getFormView();

               // delete a record row
               await form.deleteData($formView);
            } catch (err) {
               console.error(err);
            } finally {
               deleteButton.enable?.();
            }
         },
      });
   }
};
