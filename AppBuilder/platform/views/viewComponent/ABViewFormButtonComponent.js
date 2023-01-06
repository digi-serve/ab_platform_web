const ABViewComponent = require("./ABViewComponent").default;

const L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewFormButtonComponent extends ABViewComponent {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewFormButtonComponent_${baseView.id}`;

      super(baseView, idBase, {});

      this.view = baseView;
      this.view._callbacks = {};
      this.AB = this.view.AB;
   }

   ui() {
      const self = this;
      const ids = this.ids;
      const baseView = this.view;

      const _ui = {
         id: ids.component,
         cols: [],
      };

      const form = baseView.parentFormComponent();

      const alignment =
         baseView.settings.alignment ??
         baseView.constructor.defaultValues().alignment;

      // spacer
      if (alignment === "center" || alignment === "right") {
         _ui.cols.push({});
      }

      // cancel button
      if (baseView.settings.includeCancel) {
         _ui.cols.push(
            {
               view: "button",
               autowidth: true,
               value: baseView.settings.cancelLabel || L("Cancel"),
               click: function () {
                  self.onCancel(this);
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
      if (baseView.settings.includeReset) {
         _ui.cols.push(
            {
               view: "button",
               autowidth: true,
               value: baseView.settings.resetLabel || L("Reset"),
               click: function () {
                  self.onClear(this);
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
      if (baseView.settings.includeSave) {
         _ui.cols.push({
            view: "button",
            type: "form",
            css: "webix_primary",
            autowidth: true,
            value: baseView.settings.saveLabel || L("Save"),
            click: function () {
               baseView._callbacks.onSaveClick(this);
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
      if (alignment === "center" || alignment === "left") {
         _ui.cols.push({});
      }

      return _ui;
   }

   async init(AB) {
      this.AB = AB;

      const baseView = this.view;

      baseView._callbacks.onCancelClick = AB.onCancelClick ?? (() => true);
      baseView._callbacks.onSaveClick =
         AB.onSaveClick ??
         ((saveButton) => {
            this.onSave(saveButton);
         });
   }

   onCancel(cancelButton) {
      const baseView = this.view;

      // attempt to call onCancleClick callback...if no override is set we simply return false
      const shouldContinue = baseView._callbacks.onCancelClick();

      // if override was called we should have returned true so we can stop now
      if (!shouldContinue) {
         return false;
      }

      // get form component
      const form = baseView.parentFormComponent();

      // get ABDatacollection
      const dc = form.datacollection;

      // clear cursor of DC
      if (dc) {
         dc.setCursor(null);
      }

      if (cancelButton.getFormView()) cancelButton.getFormView().clear();

      if (baseView.settings.afterCancel)
         super.changePage(baseView.settings.afterCancel);
      // If the redirect page is not defined, then redirect to parent page
      else {
         const noPopupFilter = (p) => p.settings && p.settings.type !== "popup";
         const pageCurr = baseView.pageParent();

         if (pageCurr) {
            const pageParent = pageCurr.pageParent(noPopupFilter) || pageCurr;

            if (pageParent) super.changePage(pageParent.id);
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

      if (resetButton.getFormView()) resetButton.getFormView().clear();
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
            if (saveButton && saveButton.$view) saveButton.enable();

            //Focus on first focusable component
            form.focusOnFirst();
         })
         .catch((err) => {
            console.error(err);
            if (saveButton && saveButton.$view) saveButton.enable();
         });
   }
};
