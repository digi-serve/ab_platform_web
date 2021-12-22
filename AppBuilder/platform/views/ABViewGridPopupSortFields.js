/*
 * ABViewGridPopupSortFields
 *
 * Manage the Sort Fields popup.
 *
 */

import ClassUI from "../../../ui/ClassUI";

var L = null;

export default class AB_Work_Object_Workspace_PopupSortFields extends ClassUI {
   constructor(idBase) {
      idBase = idBase || "abviewgridpopupSortFields";

      super({
         component: `${idBase}_popupSort`,
         list: `${idBase}_popupSort_list`,
         form: `${idBase}_popupSort_form`,
      });

      this.CurrentObject = null;
      // {ABObject}
      // The current ABObject we are working with.

      this._blockOnChange = false;
      // {bool}
      // Should we skip the onChange handler processing at this time?

      this._settings = null;
      // {json}
      // default sort settings.

      if (!L) {
         L = (...params) => {
            return this.AB.Multilingual.label(...params);
         };
      }
   }

   uiForm() {
      return {
         view: "form",
         id: this.ids.form,
         // autoheight: true,
         borderless: true,
         elements: [
            {
               view: "button",
               type: "form",
               css: "webix_primary",
               value: L("Add new sort"),
               on: {
                  onItemClick: (/* id, e, node */) => {
                     this.clickAddNewSort();
                     this.triggerOnChange();
                  },
               },
            },
         ],
      };
   }

   ui() {
      return {
         view: "popup",
         id: this.ids.component,
         // autoheight:true,
         width: 600,
         body: this.uiForm(),
         on: {
            onShow: () => {
               this.onShow();
            },
         },
      };
   }

   // Our init() function for setting up our UI
   async init(AB) {
      if (AB) {
         this.AB = AB;
      }

      webix.ui(this.ui());
   }

   /**
    * @function clickAddNewSort
    * When the user clicks the "Add New Sort" button, this routine will
    * add another row to the sort form.
    * @param {string} fieldId
    *        The ABField.id of the field to auto select in this new row.
    * @param {string} dir
    *        The sort order to auto select in this new row.
    */
   // clickAddNewSort: function(by, dir, isMulti, id) {
   clickAddNewSort(fieldId, dir) {
      var self = this;
      var sort_form = $$(this.ids.form);

      var viewIndex = sort_form.getChildViews().length - 1;
      var listFields = this.getFieldList(true);
      sort_form.addView(
         {
            id: "sort" + webix.uid(),
            cols: [
               {
                  view: "combo",
                  width: 220,
                  options: listFields,
                  on: {
                     onChange: function (columnId) {
                        var el = this;
                        self.onChangeCombo(columnId, el);
                     },
                  },
               },
               {
                  view: "segmented",
                  width: 200,
                  options: [
                     {
                        id: "",
                        value: L("Please select field"),
                     },
                  ],
                  on: {
                     onChange: (/* newv, oldv */) => {
                        // 'asc' or 'desc' values
                        this.triggerOnChange();
                     },
                  },
               },
               {
                  view: "button",
                  css: "webix_danger",
                  icon: "fa fa-trash",
                  type: "icon",
                  width: 30,
                  on: {
                     onItemClick: function () {
                        sort_form.removeView(this.getParentView());
                        self.refreshFieldList(true);
                        self.triggerOnChange();
                     },
                  },
               },
            ],
         },
         viewIndex
      );

      // Select field
      if (fieldId) {
         var fieldsCombo = sort_form
            .getChildViews()
            [viewIndex].getChildViews()[0];
         fieldsCombo.setValue(fieldId);
      }
      // select direction
      if (dir) {
         var segmentButton = sort_form
            .getChildViews()
            [viewIndex].getChildViews()[1];
         segmentButton.setValue(dir);
      }
   }

   /**
    * @function getFieldList
    * return field list so we can present a custom UI for view
    * @param {bool} excludeSelected
    *        Should we ignore fields that already exist in the form?
    * @return {array} [ { id, value } ]
    *         an array that is compatible with the webix.list
    *         widget.
    */
   getFieldList(excludeSelected) {
      var sort_form = $$(this.ids.form),
         listFields = [];

      var allFields = this.CurrentObject.fields();
      if (allFields.length == 0) return listFields;

      // Get all fields include hidden fields
      allFields.forEach((f) => {
         if (f.fieldIsSortable()) {
            listFields.push({
               id: f.id,
               value: f.label,
            });
         }
      });

      // Remove selected field
      if (excludeSelected) {
         var childViews = sort_form.getChildViews();
         if (childViews.length > 1) {
            // Ignore 'Add new sort' button
            childViews.forEach(function (cView, index) {
               if (childViews.length - 1 <= index) return false;

               var selectedValue = cView.getChildViews()[0].getValue();
               if (selectedValue) {
                  listFields = listFields.filter((f) => f.id != selectedValue);
               }
            });
         }
      }
      return listFields;
   }

   /**
    * @function objectLoad
    * Ready the Popup according to the current object
    * @param {ABObject} object  the currently selected object.
    */
   objectLoad(object) {
      this.CurrentObject = object;
   }

   /**
    * @method setSettings
    * Initialize the form with a set of conditions.
    * @param {Array} settings
    *        The default settings for this form.
    *        [
    *           {
    *              key: uuid,     // ABField.id
    *              dir: string,   // 'asc' or 'desc'
    *           }
    *        ]
    */
   setSettings(settings) {
      this._settings = this.AB.cloneDeep(settings);
   }

   /**
    * @method getSettings
    * return the current sort settings stored by this form.
    * @return {Array} -
    *         [
    *            {
    *               key: uuid,     // ABField.id
    *               dir: string,   // 'asc' or 'desc'
    *            }
    *         ]
    */
   getSettings() {
      var sort_form = $$(this.ids.form),
         sortFields = [];

      var childViews = sort_form.getChildViews();
      if (childViews.length > 1) {
         // Ignore 'Add new sort' button
         childViews.forEach(function (cView, index) {
            if (childViews.length - 1 <= index) return false;

            var fieldId = cView.getChildViews()[0].getValue();
            var dir = cView.getChildViews()[1].getValue();
            sortFields.push({
               key: fieldId,
               dir: dir,
            });
         });
      }
      return sortFields;
   }

   /**
    * @method onChangeCombo()
    * Update the display once they have chosen a field to sort by.
    * We now need to offer the appropriate sort direction chooser.
    * @param {string} fieldID
    *        The value of the combo box now.
    * @param {webix.$view} el
    *        The current Webix.$view that was the combo box that just
    *        changed.
    */
   onChangeCombo(fieldID, el) {
      var allFields = this.CurrentObject.fields();
      var chosenField = null,
         sortDir = el.getParentView().getChildViews()[1],
         // isMultiLingual = el.getParentView().getChildViews()[2],
         // isMulti = 0,
         options = null;

      chosenField = allFields.find((f) => f.id == fieldID);
      if (!chosenField) return;

      switch (chosenField.key) {
         case "date":
            options = [
               { id: "asc", value: L("Before -> After") },
               { id: "desc", value: L("After -> Before") },
            ];
            break;
         case "number":
            options = [
               { id: "asc", value: L("1 -> 9") },
               { id: "desc", value: L("9 -> 1") },
            ];
            break;
         case "string":
         default:
            options = [
               { id: "asc", value: L("A -> Z") },
               { id: "desc", value: L("Z -> A") },
            ];
            break;
      }

      sortDir.define("options", options);
      sortDir.refresh();

      // if (columnConfig.settings.supportMultilingual)
      //    isMulti = columnConfig.settings.supportMultilingual;

      // isMultiLingual.setValue(isMulti);

      this.refreshFieldList();
      this.triggerOnChange();
   }

   /**
    * @function onShow
    * Rebuild the form when an onShow() is called.
    */
   onShow() {
      var sort_form = $$(this.ids.form);

      // clear field options in the form
      webix.ui(this.uiForm(), sort_form);

      var sorts = this._settings;
      if (sorts && sorts.forEach) {
         sorts.forEach((s) => {
            this.clickAddNewSort(s.key, s.dir);
         });
      }

      if (sorts == null || sorts.length == 0) {
         this.clickAddNewSort();
      }
   }

   /**
    * @method refreshFieldList
    * return an updated field list so you cannot duplicate a sort
    * @param {bool} ignoreRemoveViews
    *
    */
   refreshFieldList(ignoreRemoveViews) {
      var sort_form = $$(this.ids.form),
         listFields = this.getFieldList(false),
         selectedFields = [],
         removeChildViews = [];

      var childViews = sort_form.getChildViews();
      if (childViews.length > 1) {
         // Ignore 'Add new sort' button
         childViews.forEach(function (cView, index) {
            if (childViews.length - 1 <= index) return false;

            var fieldId = cView.getChildViews()[0].getValue(),
               // fieldObj = $.grep(listFields, function (f) { return f.id == fieldId });
               fieldObj = listFields.find((f) => f.id == fieldId);

            if (fieldObj) {
               // Add selected field to list
               selectedFields.push(fieldObj);
            } else {
               // Add condition to remove
               removeChildViews.push(cView);
            }
         });
      }

      // Remove filter conditions when column is deleted
      if (!ignoreRemoveViews) {
         removeChildViews.forEach(function (cView) {
            sort_form.removeView(cView);
         });
      }

      // Field list should not duplicate field items
      childViews = sort_form.getChildViews();
      if (childViews.length > 1) {
         // Ignore 'Add new sort' button
         childViews.forEach(function (cView, index) {
            if (childViews.length - 1 <= index) return false;

            var fieldId = cView.getChildViews()[0].getValue(),
               // fieldObj = $.grep(listFields, function (f) { return f.id == fieldId }),
               fieldObj = listFields.filter(function (f) {
                  return f.id == fieldId;
               });

            // var selectedFieldsExcludeCurField = $(selectedFields).not(fieldObj);
            var selectedFieldsExcludeCurField = selectedFields.filter(function (
               x
            ) {
               if (Array.isArray(fieldObj) && fieldObj.indexOf(x) !== -1) {
                  return false;
               }
               return true;
            });

            // var enableFields = $(listFields).not(selectedFieldsExcludeCurField).get();
            var enableFields = listFields.filter(function (x) {
               if (
                  Array.isArray(selectedFieldsExcludeCurField) &&
                  selectedFieldsExcludeCurField.indexOf(x) !== -1
               ) {
                  return false;
               }
               return true;
            });

            // Update field list
            cView.getChildViews()[0].define("options", enableFields);
            cView.getChildViews()[0].refresh();
         });
      }
   }

   /**
    * @function triggerOnChange
    * This parses the sort form to build in order the sorts then saves to the application object workspace
    */
   triggerOnChange() {
      // block .onChange callback
      if (this._blockOnChange) return;

      this._settings = this.getSettings();

      this.emit("changed", this._settings);
   }

   blockOnChange() {
      this._blockOnChange = true;
   }

   unblockOnChange() {
      this._blockOnChange = false;
   }

   /**
    * @function show()
    * Show this component.
    * @param {obj} $view
    *        the webix.$view to hover the popup around.
    * @param {uuid} fieldId
    *        the ABField.id we want to prefill the sort with
    * @param {json} options
    *        Additional webix.show() options parameters.
    */
   show($view, fieldId, options) {
      this.blockOnChange();

      $$(this.ids.component).show($view, options || null);

      if (fieldId) {
         this.clickAddNewSort(fieldId);
      }

      this.unblockOnChange();
   }

   /**
    * @function sort()
    * client sort data in list
    *
    * @param {Object} a
    * @param {Object} b
    */
   sort(a, b) {
      var result = 0;

      var childViews = $$(this.ids.form).getChildViews();
      if (childViews.length > 1) {
         // Ignore 'Add new sort' button
         childViews.forEach(function (cView, index) {
            if (childViews.length - 1 <= index || result != 0) return;

            var fieldId = cView.getChildViews()[0].getValue();
            var dir = cView.getChildViews()[1].getValue();

            var field = this.CurrentObject.fieldByID(fieldId);
            if (!field) return;

            var by = field.columnName; // column name

            var aValue = a[by],
               bValue = b[by];

            if (Array.isArray(aValue)) {
               aValue = (aValue || [])
                  .map(function (item) {
                     return item.text || item;
                  })
                  .join(" ");
            }

            if (Array.isArray(bValue)) {
               bValue = (bValue || [])
                  .map(function (item) {
                     return item.text || item;
                  })
                  .join(" ");
            }

            if (aValue != bValue) {
               if (dir == "asc") {
                  result = aValue > bValue ? 1 : -1;
               } else {
                  result = aValue < bValue ? 1 : -1;
               }
            }
         });
      }

      return result;
   }
}
