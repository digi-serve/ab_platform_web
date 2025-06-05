import ABUIPlugin from "./ABUIPlugin.js";

function scanForSaveButton(el, idButtonSave) {
   if (el.rows || el.cols || el.cells) {
      let res = false;
      (el.rows || el.cols || el.cells).forEach((e) => {
         if (e) {
            res = res || scanForSaveButton(e, idButtonSave);
         }
      });
      return res;
   }
   if (el.id && el.id == idButtonSave) {
      return true;
   }
   return false;
}

export default class ABPropertiesObjectPlugin extends ABUIPlugin {
   constructor(key, ids = {}, AB) {
      key = key ?? ABPropertiesObjectPlugin.getPluginKey();
      // make sure we have these ids defined:
      ids = Object.assign(
         {
            form: "",
            buttonSave: "",
            buttonCancel: "",
         },
         ids
      );
      super(key, ids, AB);
      // console.log("ABPropertiesObjectPlugin constructor", this);

      this.width = 800;
      this.height = 500;
   }

   static getPluginKey() {
      return "ab-properties-object-plugin";
   }

   async init(AB) {
      this.AB = AB;

      //
      // setup our listeners
      //
      this.on("save.error", (...params) => {
         this.onError(...params);
      });

      this.on("save.success", (...params) => {
         this.onSuccess(...params);
      });
   }

   /**
    * @method onError()
    * Our Error handler when the data we provided our parent
    * ui_work_object_list_newObject object had an error saving
    * the values.
    * @param {Error|ABValidation|other} err
    *        The error information returned. This can be several
    *        different types of objects:
    *        - A javascript Error() object
    *        - An ABValidation object returned from our .isValid()
    *          method
    *        - An error response from our API call.
    */
   onError(err) {
      let L = this.L();
      if (err) {
         console.error(err);
         let message = L("the entered data is invalid");
         // if this was our Validation() object:
         if (err.updateForm) {
            err.updateForm(this.$form);
         } else {
            if (err.code && err.data) {
               message = err.data?.sqlMessage ?? message;
            } else {
               message = err?.message ?? message;
            }
         }

         const values = this.$form.getValues();
         webix.alert({
            title: L("Error creating Object: {0}", [values.name]),
            ok: L("fix it"),
            text: message,
            type: "alert-error",
         });
      }
      // get notified if there was an error saving.
      $$(this.ids.buttonSave).enable();
   }

   /**
    * @method onSuccess()
    * Our success handler when the data we provided our parent
    * ui_work_object_list_newObject successfully saved the values.
    */
   onSuccess() {
      this.formClear();
      $$(this.ids.buttonSave).enable();
   }

   ui() {
      return {
         id: this.ids.component,
         header: this.header(),
         body: {
            view: "form",
            id: this.ids.form,
            width: this.width,
            height: this.height,
            rules: this.rules(),
            elements: this.elementsCombined(),
         },
      };
   }

   elementsCombined() {
      let elements = this.elements();

      // function scan(el) {
      //    if (el.rows || el.cols || el.cells) {
      //       let res = false;
      //       (el.rows || el.cols || el.cells).forEach((e) => {
      //          res = res || scan(e);
      //       });
      //       return res;
      //    }
      //    if (el.id && el.id == this.ids.buttonSave) {
      //       return true;
      //    }
      //    return false;
      // }

      let hasSaveButton = false;
      elements.forEach((el) => {
         if (scanForSaveButton(el, this.ids.buttonSave)) {
            hasSaveButton = true;
         }
      });
      if (!hasSaveButton) {
         let L = this.L();
         elements.push({
            margin: 5,
            cols: [
               { fillspace: true },
               {
                  view: "button",
                  id: this.ids.buttonCancel,
                  value: L("Cancel"),
                  css: "ab-cancel-button",
                  autowidth: true,
                  click: () => {
                     this.cancel();
                  },
                  on: {
                     onAfterRender() {
                        ABUIPlugin.CYPRESS_REF(this);
                     },
                  },
               },
               {
                  view: "button",
                  id: this.ids.buttonSave,
                  css: "webix_primary",
                  value: L("Add Object"),
                  autowidth: true,
                  type: "form",
                  click: () => {
                     return this.save();
                  },
                  on: {
                     onAfterRender() {
                        ABUIPlugin.CYPRESS_REF(this);
                     },
                  },
               },
            ],
         });
      }
      return elements;
   }

   cancel() {
      this.formClear();
      this.emit("cancel");
   }

   formClear() {
      $$(this.ids.form).clearValidation();
      $$(this.ids.form).clear();
   }

   /**
    * @function save
    *
    * verify the current info is ok, package it, and return it to be
    * added to the application.createModel() method.
    */
   async save() {
      var saveButton = $$(this.ids.buttonSave);
      saveButton.disable();

      // if it doesn't pass the basic form validation, return:
      if (!(await this.formIsValid())) {
         saveButton.enable();
         return false;
      }

      var values = await this.formValues();

      this.emit("save", values);
   }

   busy() {
      const $form = $$(this.ids.form);
      const $saveButton = $$(this.ids.buttonSave);

      $form.showProgress({ type: "icon" });
      $saveButton.disable();
   }

   ready() {
      const $form = $$(this.ids.form);
      const $saveButton = $$(this.ids.buttonSave);

      $form.hideProgress();
      $saveButton.enable();
   }

   ///
   /// These methods are to be overridden by the Plugin definition
   ///
   header() {
      // this is the name used when choosing the Object Type
      // tab selector.
      let L = this.L();
      return L("PropertiesObjectPlugin");
   }

   rules() {
      return {
         // name: webix.rules.isNotEmpty,
      };
   }

   elements() {
      // return the webix form element definitions to appear on the page.
      return [];
   }

   async formIsValid() {
      var Form = $$(this.ids.form);

      Form?.clearValidation();

      // if it doesn't pass the basic form validation, return:
      if (!Form.validate()) {
         $$(this.ids.buttonSave)?.enable();
         return false;
      }
   }

   async formValues() {
      var Form = $$(this.ids.form);
      return Form?.getValues();
   }
}
