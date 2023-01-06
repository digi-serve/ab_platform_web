// const ABComponent = require("./ABComponent");
import ClassUI from "../../ui/ClassUI";
const ABViewForm = require("../platform/views/ABViewForm");

var L = null;

class RowUpdater extends ClassUI {
   constructor(idBase, AB) {
      super(idBase, {
         form: `${idBase}_rowUpdaterForm`,
         addNew: `${idBase}_rowUpdaterAddNew`,
         field: `${idBase}_rowUpdaterField`,
      });

      this._Object = null;
      // {ABObject}
      // The ABObject we are building a form for.

      this._mockFormWidget = null;
      // {ABViewForm}
      // When building our form components to display, they need a
      // ABViewForm to be associated with.

      this.AB = AB;

      if (!L) {
         L = (...params) => {
            return this.AB.Multilingual.label(...params);
         };
      }
   }

   /**
    * @method uiItem()
    * Return the webix description of a new field/value row.
    * @return {json}
    */
   uiItem() {
      var self = this;
      return {
         rows: [
            {
               view: "layout",
               isolate: true,
               cols: [
                  {
                     // Label
                     view: "label",
                     width: 40,
                     label: L("Set"),
                  },
                  {
                     // Field list
                     view: "combo",
                     id: this.ids.field,
                     options: this.getFieldList(true),
                     on: {
                        onChange: async function (columnId) {
                           let $viewItem = this.getParentView();

                           await self.selectField(columnId, $viewItem);
                        },
                     },
                  },
                  {
                     // Label
                     view: "label",
                     width: 40,
                     label: L("To"),
                  },
                  {
                     view: "segmented",
                     value: "custom",
                     height: 40,
                     maxWidth: 160,
                     options: [
                        { id: "custom", value: L("Custom") },
                        { id: "process", value: L("Process") },
                     ],
                     hidden:
                        this._extendedOptions == null ||
                        !this._extendedOptions.length,
                     on: {
                        onChange: function (val) {
                           let $viewItem = this.getParentView();

                           self.toggleCustomProcessOption(
                              $viewItem,
                              val == "process"
                           );
                        },
                     },
                  },
                  // Field value
                  {},
                  // Extended value
                  {
                     hidden: true,
                  },
                  {
                     // "Remove" button
                     view: "button",
                     css: "webix_danger",
                     icon: "fa fa-trash",
                     type: "icon",
                     autowidth: true,

                     click: function () {
                        let $viewCond = this.getParentView().getParentView();

                        self.removeItem($viewCond);
                     },
                  },
               ],
            },
         ],
      };
   }

   /**
    * @method ui()
    * return the webix description of our Entry form.
    * @return {json}
    */
   ui() {
      // webix UI definition:
      return {
         rows: [
            {
               view: "form",
               id: this.ids.form,
               hidden: true,
               borderless: true,
               elements: [],
            },
            {
               view: "button",
               id: this.ids.addNew,
               icon: "fa fa-plus",
               type: "iconButton",
               label: L("Add field to edit"),
               click: () => {
                  this.addItem();
               },
            },
         ],
      };
   }

   async init(AB) {
      const $form = $$(this.ids.form);
      if ($form) AB.Webix.extend($form, AB.Webix.ProgressBar);
   }

   /**
    * @method addItem()
    * Add another field/value entry item to our form.
    * @param {integer} index
    *        which position in the list of form elements do we want to
    *        insert the new row.
    * @return {string} the webix .id of the new row we just added.
    */
   addItem(index) {
      let $form = $$(this.ids.form);

      let remainFields = this.getFieldList(true);
      if (remainFields.length < 1) return;

      let ui = this.uiItem();

      let viewId = $form.addView(ui, index);

      this.toggleForm();

      return viewId;
   }

   /**
    * @method getFieldList()
    * Return an array of options in a webix.list format that represents the
    * possible fields that can be selected on the current ABObject.
    * @param {bool} excludeSelected
    *        should we exclude from the list the fields that are ALREADY
    *        displayed on the form?
    * @return {array} [ { id, value }, ... ]
    *         id: ABField.id
    *         value: ABField.label
    */
   getFieldList(excludeSelected) {
      let options = (this._Object.fields() || []).map((f) => {
         return {
            id: f.id,
            value: f.label,
         };
      });

      if (excludeSelected) {
         let $form = $$(this.ids.form);

         $form.getChildViews().forEach(($viewCond) => {
            // Ignore "Add new" button
            if (!$viewCond || !$viewCond.$$) return;

            let $fieldElem = $viewCond.$$(this.ids.field);
            if (!$fieldElem) return;

            let fieldId = $fieldElem.getValue();
            if (!fieldId) return;

            options = options.filter((opt) => opt.id != fieldId);
         });
      }
      return options;
   }

   /**
    * @method getValue
    * Return an array of field:value results that have been entered on this
    * form.
    * @return {Array}
    *         [
    *            {
    *               fieldId: {UUID}
    *               isProcessValue: {Boolean} - If it is true, then value is from Process parameter
    *               value: {Object}
    *            },
    *            ...
    *         ]
    */
   getValue() {
      let result = [];

      let $form = $$(this.ids.form);
      if ($form) {
         $form.getChildViews().forEach(($viewContainer) => {
            let $viewItem = $viewContainer.getChildViews()[0];

            // Ignore "Add new" button
            if (!$viewItem || !$viewItem.$$) return;

            let $fieldElem = $viewItem.$$(this.ids.field);
            if (!$fieldElem) return;

            let fieldId = $fieldElem.getValue();
            if (!fieldId) return;

            let $customValueElem = $viewItem.getChildViews()[4];
            let $processValueElem = $viewItem.getChildViews()[5];
            if (!$customValueElem && !$processValueElem) return;

            let fieldInfo = this._Object.fieldByID(fieldId);

            let val = {
               fieldId: fieldId,
            };

            // Custom value
            if ($customValueElem && $customValueElem.isVisible()) {
               if (
                  fieldInfo.key == "connectObject" ||
                  fieldInfo.key == "user"
               ) {
                  val.value = fieldInfo.getValue(
                     $customValueElem.getChildViews()[0]
                  );
               } else if (
                  fieldInfo.key == "date" ||
                  fieldInfo.key == "datetime"
               ) {
                  let currDateCheckbox = $customValueElem.getChildViews()[0];
                  if (currDateCheckbox.getValue() == true) {
                     val.value = "ab-current-date";
                  } else {
                     let datePicker = $customValueElem.getChildViews()[1];
                     val.value = fieldInfo.getValue(datePicker);
                  }
               } else {
                  // Get value from data field manager
                  val.value = fieldInfo.getValue($customValueElem);
               }
            }
            // Process value
            else if ($processValueElem && $processValueElem.isVisible()) {
               val.isProcessValue = true;
               val.value = $processValueElem.getValue();
            }

            // Add to output
            result.push(val);
         });
      }

      return result;
   }

   /**
    * @method objectLoad
    * Load the Object we are currently working with.
    * @param {ABObject} object
    */
   objectLoad(object) {
      this._Object = object;
      this._mockFormWidget = new ABViewForm(
         {
            id: `${this.ids.form}_view`,
            key: ABViewForm.common().key,
            settings: {
               showLabel: false,
               labelWidth: 0,
            },
         },
         this.AB._mockApp // just need any ABApplication here
      );

      this._mockFormWidget.objectLoad(object);
      this.setValue(null); // clear
   }

   /**
    * @method removeItem
    * Remove the current form row.
    * @param {webix.view} $viewCond
    *        This is the webix.view that contains the whole value row
    *        we are removing.
    */
   removeItem($viewCond) {
      let $form = $$(this.ids.form);
      $form.removeView($viewCond);
      this.toggleForm();
   }

   /**
    * @method selectField
    * Update the value display when a field is selected. Changing to a
    * different field will change the types of values that can be entered.
    * @param {string} columnId
    *        The field.uuid of the object that was selected.
    * @param {webix.view} $viewItem
    *        The webix.view that contains the value expression of the field
    *        that was selected.
    */
   async selectField(columnId, $viewItem) {
      const field = this._Object.fieldByID(columnId);

      if (!field) {
         this.AB.notify.builder(
            new Error(`could not find field for id[${columnId}]`),
            {
               context: "RowUpdater.selectField() could not find a field",
               fieldID: columnId,
            }
         );

         return;
      }

      const fieldComponent = field.formComponent(),
         formFieldWidget = fieldComponent.newInstance(
            this.AB._mockApp,
            this._mockFormWidget
         ),
         formFieldComponent = formFieldWidget.component();
      const childViews = $viewItem.getChildViews();

      let inputView = formFieldComponent.ui();

      // Add extended value options
      $viewItem.removeView(childViews[5]);

      if (this._extendedOptions && this._extendedOptions.length) {
         $viewItem.addView(
            {
               view: "richselect",
               options: this._extendedOptions,
               hidden: true,
            },
            5
         );
      } else {
         $viewItem.addView(
            {
               hidden: true,
            },
            5
         );
      }

      await this.busy();

      // WORKAROUND: add '[Current User]' option to the user data field
      switch (field.key) {
         case "connectObject":
         case "user":
            // inputView = inputView.rows[0];
            inputView.rows[0].suggest.body.data =
               (await field.getOptions()).map((e) => {
                  return { id: e.value, value: e.value };
               }) ?? [];

            if (field.key === "user")
               inputView.rows[0].suggest.body.data.unshift({
                  id: "ab-current-user",
                  value: L("ab-current-user"),
               });

            break;

         case "date":
         case "datetime":
            inputView = {
               view: "layout",
               rows: [
                  {
                     view: "checkbox",
                     labelWidth: 0,
                     labelRight: L("Current Date/Time"),
                     on: {
                        onChange: function (newVal) {
                           let layout = this.getParentView();
                           if (!layout) return;

                           let datePicker = layout.getChildViews()[1];
                           if (!datePicker) return;

                           newVal ? datePicker.hide() : datePicker.show();
                        },
                     },
                  },
                  inputView,
               ],
            };

            break;
      }

      // Change component to display value
      $viewItem.removeView(childViews[4]);
      $viewItem.addView(inputView, 4);

      formFieldComponent.init();

      // Show custom display of data field
      if (field.customDisplay)
         field.customDisplay({}, this.AB._App, childViews[4].$view);

      this.toggleCustomProcessOption(
         $viewItem,
         childViews[3].getValue() === "process"
      );

      $$($viewItem).adjust();
      $viewItem.getFormView().adjust();

      this.ready();
   }

   /**
    * @method setValue
    * Given the previous settings, redraw the form with the field/value
    * entries.
    * @param {array} settings
    *        [
    *           {
    *              fieldId: {UUID}
    *              value: {Object|String}
    *           }, ...
    *        ]
    */
   setValue(settings) {
      let $form = $$(this.ids.form);
      if (!$form) return;

      // Redraw form with no elements
      webix.ui([], $form);

      settings = settings || [];
      if (settings.length < 1) return;

      settings.forEach(async (item) => {
         let $viewContainer = $$(this.addItem());
         let $viewItem = $viewContainer.getChildViews()[0];
         let $valueTypeButton = $viewItem.queryView(
            { view: "segmented" },
            "self"
         );

         $valueTypeButton.setValue(item.isProcessValue ? "process" : "custom");

         const $field = $viewItem.$$(this.ids.field);

         $field.define("value", item.fieldId);
         $field.refresh();

         await this.selectField(item.fieldId, $viewItem);

         let fieldInfo = this._Object.fieldByID(item.fieldId);

         if (!fieldInfo) return;

         // Set process value
         if (item.isProcessValue) {
            let $processValueElem = $viewItem.getChildViews()[5];

            $processValueElem.setValue?.(item.value);

            return;
         }

         // Set custom value
         let $customValueElem = $viewItem.getChildViews()[4];
         let rowData = {};

         rowData[fieldInfo.columnName] = item.value?.value ?? item.value;
         fieldInfo.setValue(
            fieldInfo.key === "user" || fieldInfo.key === "connectObject"
               ? $customValueElem.getChildViews()[0]
               : $customValueElem,
            rowData
         );
      });

      this.toggleForm();
   }

   /**
    * @method toggleForm
    * decide if the form with the field/value elements should be displayed.
    */
   toggleForm() {
      let $form = $$(this.ids.form);
      if ($form) {
         let childViews = $form.getChildViews();
         if (childViews && childViews.length) {
            $form.show();
         } else {
            $form.hide();
         }
         $form.adjust();
      }
   }

   setExtendedOptions(options) {
      this._extendedOptions = options;
   }

   toggleCustomProcessOption($viewItem, showProcessOption) {
      let $customOption = $viewItem.getChildViews()[4];
      let $processOption = $viewItem.getChildViews()[5];

      if (showProcessOption) {
         $customOption.hide();
         $processOption.show();
      } else {
         $customOption.show();
         $processOption.hide();
      }
   }

   async busy() {
      $$(this.ids.addNew).disable();

      const $form = $$(this.ids.form);

      if (!$form) return;

      if (!$form.showProgress) await this.init(this.AB);

      $form.showProgress({ type: "icon" });
   }

   ready() {
      $$(this.ids.addNew).enable();
      $$(this.ids.form).hideProgress();
   }
}

export default RowUpdater;
