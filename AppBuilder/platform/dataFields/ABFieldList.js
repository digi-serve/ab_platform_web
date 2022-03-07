const ABFieldListCore = require("../../core/dataFields/ABFieldListCore");

const ABFieldSelectivity = require("./ABFieldSelectivity");

const L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABFieldList extends ABFieldListCore {
   constructor(values, object) {
      super(values, object);

      this._Selectivity = new ABFieldSelectivity(values, object);
   }

   ///
   /// Instance Methods
   ///

   async save() {
      return super.save().then(() => {
         // Now we want to clear out any entries that had values == to item removed from our list:
         if (this.pendingDeletions.length) {
            const model = this.object.model();

            if (this.settings.isMultiple == true) {
               // find all the entries that have one of the deleted values:
               // use Promise to prevent issues with data being loaded before it is deleted on client side
               return new Promise((resolve, reject) => {
                  let numDone = 0;
                  let numToDo = 0;

                  model
                     .findAll({})
                     .then((list) => {
                        list = list.data || list;

                        // for each list item
                        list.forEach((item) => {
                           if (Array.isArray(item[this.columnName])) {
                              // get fields not in pendingDeletions
                              let remainingFields = item[
                                 this.columnName
                              ].filter((i) => {
                                 return (
                                    this.pendingDeletions.indexOf(i.id) == -1
                                 );
                              });

                              if (
                                 remainingFields.length !=
                                 item[this.columnName].length
                              ) {
                                 numToDo++;

                                 // update value to new field list
                                 if (remainingFields.length == 0) {
                                    remainingFields = "";
                                 }
                                 const value = {};
                                 value[this.columnName] = remainingFields;
                                 model.update(item.id, value).then(() => {
                                    // if ($$(node) && $$(node).updateItem)
                                    //    $$(node).updateItem(value.id, value);
                                    numDone++;
                                    if (numDone >= numToDo) {
                                       resolve();
                                    }
                                 });
                              }
                           }
                        });
                        if (numToDo == 0) {
                           resolve();
                        }
                     })
                     .catch(reject);
               });
            } else {
               // find all the entries that have one of the deleted values:
               const where = {};
               where[this.columnName] = this.pendingDeletions;
               return new Promise((resolve, reject) => {
                  let numDone = 0;

                  model
                     .findAll(where)
                     .then((list) => {
                        // make sure we just work with the { data:[] } that was returned
                        list = list.data || list;

                        // for each one, set the value to ''
                        // NOTE: jQuery ajax routines filter out null values, so we can't
                        // set them to null. :(
                        // const numDone = 0;
                        const value = {};
                        value[this.columnName] = "";

                        list.forEach((item) => {
                           model.update(item.id, value).then(() => {
                              numDone++;
                              if (numDone >= list.length) {
                                 resolve();
                              }
                           });
                        });
                        if (list.length == 0) {
                           resolve();
                        }
                     })
                     .catch(reject);
               });
            }
         }
      });
   }

   isValid() {
      const validator = super.isValid();

      // validator.addError('columnName', L('ab.validation.object.name.unique', 'Field columnName must be unique (#name# already used in this Application)').replace('#name#', this.name) );

      return validator;
   }

   ///
   /// Working with Actual Object Values:
   ///

   // return the grid column header definition for this instance of ABFieldList
   columnHeader(options) {
      options = options || {};

      const config = super.columnHeader(options);
      const field = this;
      const App = field.AB._App;

      // Multiple select list
      if (this.settings.isMultiple == true) {
         const width = options.width,
            editable = options.editable;

         config.template = (row) => {
            const node = document.createElement("div");
            node.classList.add("list-data-values");
            if (typeof width != "undefined") {
               node.style.marginLeft = width + "px";
            }

            const domNode = node;

            let placeholder = L("Select items");
            let readOnly = false;
            if (editable != null && editable == false) {
               readOnly = true;
               placeholder = "";
            }

            // const domNode = node.querySelector('.list-data-values');

            // get selected values
            const selectedData = _getSelectedOptions(field, row);

            // Render selectivity
            field._Selectivity.selectivityRender(
               domNode,
               {
                  multiple: true,
                  readOnly: readOnly,
                  placeholder: placeholder,
                  hasColors: field.settings.hasColors,
                  items: field.settings.options,
                  data: selectedData,
               },
               App,
               row
            );

            return node.outerHTML;
         };
      }
      // Single select list
      else {
         let formClass = "";
         let placeHolder = "";
         if (options.editable) {
            formClass = " form-entry";
            placeHolder = `<span style='color: #CCC; padding: 0 5px;'>${L(
               "Select item"
            )}"</span>`;
         }
         const isRemovable = options.editable && !this.settings.required;

         config.template = (obj) => {
            let myHex = "#666666";
            let myText = placeHolder;
            field.settings.options.forEach((h) => {
               if (h.id == obj[field.columnName]) {
                  myHex = h.hex;
                  myText = h.text;
               }
            });
            if (field.settings.hasColors && obj[field.columnName]) {
               return (
                  '<span class="selectivity-single-selected-item rendered' +
                  formClass +
                  '" style="background-color:' +
                  myHex +
                  ' !important;">' +
                  myText +
                  (isRemovable
                     ? ' <a class="selectivity-single-selected-item-remove"><i class="fa fa-remove"></i></a>'
                     : "") +
                  "</span>"
               );
            } else {
               if (myText != placeHolder) {
                  return (
                     myText +
                     (isRemovable
                        ? ' <a class="selectivity-single-selected-item-remove" style="color: #333;"><i class="fa fa-remove"></i></a>'
                        : "")
                  );
               } else {
                  return myText;
               }
            }
         };

         config.editor = "richselect";
         config.options = field.settings.options.map(function (opt) {
            return {
               id: opt.id,
               value: opt.text,
               hex: opt.hex,
            };
         });
      }

      return config;
   }

   /*
    * @function customDisplay
    * perform any custom display modifications for this field.
    * @param {object} row is the {name=>value} hash of the current row of data.
    * @param {App} App the shared ui App object useful more making globally
    *             unique id references.
    * @param {HtmlDOM} node  the HTML Dom object for this field's display.
    */
   customDisplay(row, App, node, options) {
      // sanity check.
      if (!node) {
         return;
      }

      options = options || {};

      if (this.settings.isMultiple == true) {
         let placeholder = L("Select items");
         let readOnly = false;
         if (options.editable != null && options.editable == false) {
            readOnly = true;
            placeholder = "";
         }

         const domNode = node.querySelector(".list-data-values");

         // get selected values
         const selectedData = _getSelectedOptions(this, row);

         // Render selectivity
         this._Selectivity.selectivityRender(
            domNode,
            {
               multiple: true,
               readOnly: readOnly,
               placeholder: placeholder,
               hasColors: this.settings.hasColors,
               items: this.settings.options,
               data: selectedData,
            },
            App,
            row
         );

         // Listen event when selectivity value updates
         if (domNode && !readOnly && row.id && node) {
            domNode.addEventListener(
               "change",
               (/* e */) => {
                  // update just this value on our current object.model
                  const values = {};
                  values[this.columnName] = this._Selectivity.selectivityGet(
                     domNode
                  );

                  // pass null because it could not put empty array in REST api
                  if (values[this.columnName].length == 0)
                     values[this.columnName] = "";

                  this.object
                     .model()
                     .update(row.id, values)
                     .then(() => {
                        // update the client side data object as well so other data changes won't cause this save to be reverted
                        if (values[this.columnName] == "")
                           values[this.columnName] = [];
                        if ($$(node) && $$(node).updateItem)
                           $$(node).updateItem(row.id, values);
                     })
                     .catch((err) => {
                        node.classList.add("webix_invalid");
                        node.classList.add("webix_invalid_cell");

                        this.AB.notify.developer(err, {
                           message: "Error updating our entry.",
                           row: row,
                           values: values,
                        });
                     });
               },
               false
            );
         }
      } else {
         if (!node.querySelector) return;

         const clearButton = node.querySelector(
            ".selectivity-single-selected-item-remove"
         );
         if (clearButton) {
            clearButton.addEventListener("click", (e) => {
               e.stopPropagation();
               const values = {};
               values[this.columnName] = "";
               this.object
                  .model()
                  .update(row.id, values)
                  .then(() => {
                     // update the client side data object as well so other data changes won't cause this save to be reverted
                     if ($$(node) && $$(node).updateItem)
                        $$(node).updateItem(row.id, values);
                  })
                  .catch((err) => {
                     node.classList.add("webix_invalid");
                     node.classList.add("webix_invalid_cell");

                     this.AB.notify.developer(err, {
                        message: "Error updating our entry.",
                        row: row,
                        values: "",
                     });
                  });
            });
         }
      }
   }

   /*
    * @function customEdit
    *
    * @param {object} row is the {name=>value} hash of the current row of data.
    * @param {App} App the shared ui App object useful more making globally
    *             unique id references.
    * @param {HtmlDOM} node  the HTML Dom object for this field's display.
    */
   customEdit(row, App, node) {
      if (this.settings.isMultiple == true) {
         const domNode = node.querySelector(".list-data-values");

         if (domNode.selectivity != null) {
            // Open selectivity
            domNode.selectivity.open();
            return false;
         }
         return false;
      } else {
         return super.customEdit(row, App, node);
      }
   }

   /*
    * @funciton formComponent
    * returns a drag and droppable component that is used on the UI
    * interface builder to place form components related to this ABField.
    *
    * an ABField defines which form component is used to edit it's contents.
    * However, what is returned here, needs to be able to create an instance of
    * the component that will be stored with the ABViewForm.
    */
   formComponent() {
      // NOTE: what is being returned here needs to mimic an ABView CLASS.
      // primarily the .common() and .newInstance() methods.
      const formComponentSetting = super.formComponent();

      // .common() is used to create the display in the list
      formComponentSetting.common = () => {
         return {
            key: this.settings.isMultiple ? "fieldcustom" : "selectsingle",
            settings: {
               options: this.settings.options.map(function (opt) {
                  return {
                     id: opt.id,
                     value: opt.text,
                     hex: opt.hex,
                  };
               }),
            },
         };
      };

      return formComponentSetting;
   }

   detailComponent() {
      const detailComponentSetting = super.detailComponent();

      detailComponentSetting.common = () => {
         return {
            key: this.settings.isMultiple ? "detailcustom" : "detailtext",
         };
      };

      return detailComponentSetting;
   }

   getValue(item /*, rowData */) {
      let values = {};

      if (!item) return values;

      if (this.settings.isMultiple) {
         const domNode = item.$view.querySelector(".list-data-values");
         values = this._Selectivity.selectivityGet(domNode);
      } else {
         values = $$(item).getValue();
      }
      return values;
   }

   setValue(item, rowData) {
      if (!item) return;

      if (this.settings.isMultiple) {
         const selectedOpts = _getSelectedOptions(this, rowData);

         // get selectivity dom
         const domSelectivity = item.$view.querySelector(".list-data-values");

         // set value to selectivity
         this._Selectivity.selectivitySet(
            domSelectivity,
            selectedOpts,
            this.App
         );
      } else {
         super.setValue(item, rowData);
      }
   }
};

// == Private methods ==
function _getSelectedOptions(field, rowData = {}) {
   let result = [];
   if (rowData[field.columnName] != null) {
      result = rowData[field.columnName];

      if (typeof result == "string") result = JSON.parse(result);

      // Pull text with current language
      if (field.settings) {
         result = (field.settings.options || []).filter((opt) => {
            return (
               (result || []).filter((v) => (opt.id || opt) == (v.id || v))
                  .length > 0
            );
         });
      }
   }

   return result;
}
