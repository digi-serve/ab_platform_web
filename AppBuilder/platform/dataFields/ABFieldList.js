const ABFieldListCore = require("../../core/dataFields/ABFieldListCore");

const L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABFieldList extends ABFieldListCore {
   constructor(values, object) {
      super(values, object);

      // this._Selectivity = new ABFieldSelectivity(values, object);
   }

   ///
   /// Instance Methods
   ///

   save() {
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

      var formClass = "";
      var placeHolder = "";
      if (options.editable) {
         formClass = " form-entry";
         placeHolder = `<span style='color: #CCC; padding: 0 5px;'>${L(
            "Select item"
         )}</span>`;
      }
      var isRemovable = options.editable && !this.settings.required;

      config.editFormat = (value) => {
         return this.editFormat(value);
      };
      config.editParse = (value) => {
         return this.editParse(value);
      };

      config.template = (rowData) => {
         let selectedData = rowData[this.columnName];
         if (selectedData == null) return "";
         if (this.settings.isMultiple) {
            selectedData = _getSelectedOptions(this, rowData);
         }
         var values = [];
         values.push('<div class="badgeContainer">');
         let hasCustomColor = "";
         let optionHex = "";
         if (
            selectedData &&
            Array.isArray(selectedData) &&
            selectedData.length
         ) {
            selectedData.forEach((val) => {
               if (this.settings.hasColors && val.hex) {
                  hasCustomColor = "hascustomcolor";
                  optionHex = `background: ${val.hex};`;
               }
               if (val.text) {
                  values.push(
                     `<div style="${optionHex}" class='webix_multicombo_value ${hasCustomColor}'><span>${val.text}</span><!-- span data-uuid="${val.id}" class="webix_multicombo_delete" role="button" aria-label="Remove item"></span --></div>`
                  );
               }
            });
            if (selectedData.length > 1) {
               values.push(
                  `<span class="webix_badge selectivityBadge">${selectedData.length}</span>`
               );
            }
         } else if (selectedData) {
            let selectedObj = selectedData;
            if (typeof selectedData == "string") {
               selectedObj = this.getItemFromVal(selectedData);
            }
            if (!selectedObj) return "";
            if (this.settings.hasColors && selectedObj.hex) {
               hasCustomColor = "hascustomcolor";
               optionHex = `background: ${selectedObj.hex};`;
            }
            if (selectedObj.text) {
               let clear = "";
               if (options.editable) {
                  clear = `<span class="webix_multicombo_delete clear-combo-value" role="button" aria-label="Remove item"></span>`;
               }
               values.push(
                  `<div style="${optionHex}" class='webix_multicombo_value ${hasCustomColor}'>${clear}<span class="ellip">${selectedObj.text}</span></div>`
               );
            }
         } else {
            return "";
         }
         values.push("</div>");
         return values.join("");
      };
      config.editor = this.settings.isMultiple ? "multiselect" : "combo";
      config.suggest = {
         button: true,
         data: this.settings.options.map(function (opt) {
            return {
               id: opt.id,
               value: opt.text,
               hex: opt.hex,
            };
         }),
      };
      if (this.settings.isMultiple) {
         config.suggest.view = "checksuggest";
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

      if (!node.querySelector) return;

      var clearButton = node.querySelector(
         ".selectivity-single-selected-item-remove"
      );
      if (clearButton) {
         clearButton.addEventListener("click", (e) => {
            e.stopPropagation();
            var values = {};
            values[this.columnName] = "";
            this.object
               .model()
               .update(row.id, values)
               .then(() => {
                  // update the client side data object as well so other data changes won't cause this save to be reverted
                  $$(node)?.updateItem?.(row.id, values);
               })
               .catch((err) => {
                  node.classList.add("webix_invalid");
                  node.classList.add("webix_invalid_cell");

                  this.AB.notify.developer(err, {
                     message: "Error updating our entry.",
                     row: row,
                     values: "",
                     field: this.toObj(),
                  });
               });
         });
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
   // customEdit(row, App, node) {
   //    return super.customEdit(row, App, node);
   // }

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
            key: this.settings.isMultiple ? "selectmultiple" : "selectsingle",
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
            key: this.settings.isMultiple ? "detailtext" : "detailtext",
         };
      };

      return detailComponentSetting;
   }

   editFormat(value) {
      if (!value) return "";
      let vals = [];
      if (Array.isArray(value)) {
         value.forEach((val) => {
            if (typeof val == "object") {
               vals.push(val.id);
            } else {
               let itemObj = this.getItemFromVal(val);
               vals.push(itemObj.id);
            }
         });
      } else {
         if (typeof value == "object") {
            vals.push(value.id);
         } else {
            let itemObj = this.getItemFromVal(value);
            if (itemObj && itemObj.id) {
               vals.push(itemObj.id);
            }
         }
      }
      return vals.join();
   }

   editParse(value) {
      if (this.settings.isMultiple) {
         let returnVals = [];
         let vals = value.split(",");
         vals.forEach((val) => {
            returnVals.push(this.getItemFromVal(val));
         });
         return returnVals;
      } else {
         return value;
      }
   }

   getItemFromVal(val) {
      let item;
      let options = this.options();
      if (options.length > 1) {
         options.forEach((option) => {
            if (option.id == val) {
               item = option;
               return false;
            }
         });
         return item;
      } else {
         return "";
      }
   }

   getValue(item, rowData) {
      return this.editParse(item.getValue());
   }

   getSelectedOptions(field, rowData = {}) {
      let result = [];
      if (rowData[this.columnName] != null) {
         result = rowData[this.columnName];
      } else if (rowData) {
         if (Array.isArray(rowData)) {
            result = rowData;
         } else {
            result.push(rowData);
         }
      }
      if (result.length) {
         if (typeof result == "string") result = JSON.parse(result);

         // Pull text with current language
         if (this.settings) {
            result = (this.settings.options || []).filter((opt) => {
               return (
                  (result || []).filter((v) => (opt.id || opt) == (v.id || v))
                     .length > 0
               );
            });
         }
      }

      return result;
   }

   setValue(item, rowData) {
      if (!item) return;

      if (this.settings.isMultiple) {
         // do we need anything here?
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
