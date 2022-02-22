const ABFieldConnectCore = require("../../core/dataFields/ABFieldConnectCore");

const L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABFieldConnect extends ABFieldConnectCore {
   constructor(values, object, fieldDefaults) {
      super(values, object, fieldDefaults);
   }

   /**
    * @method destroy()
    *
    * destroy the current instance of ABApplication
    *
    * also remove it from our _AllApplications
    *
    * @return {Promise}
    */
   async destroy() {
      // verify we have been .save()d before:
      if (!this.id) return Promise.resolve();

      // NOTE: our .migrateXXX() routines expect the object to currently exist
      // in the DB before we perform the DB operations.  So we need to
      // .migrateDrop()  before we actually .objectDestroy() this.
      // this.migrateDrop()
      //    // .then(() => {
      //    //    // NOTE : prevent recursive remove connected fields
      //    //    // - remove this field from JSON
      //    //    this.object._fields = this.object.fields((f) => {
      //    //       return f.id != this.id;
      //    //    });
      //    // })
      //    .then(() => {
      //       // Save JSON of the object
      //       return this.object.fieldRemove(this);
      //    })
      await super.destroy();

      // Now we need to remove our linked Object->field

      const linkObject = this.datasourceLink;
      if (!linkObject) return Promise.resolve(); // already notified

      const linkField = this.fieldLink;
      if (!linkField) return Promise.resolve(); // already notified

      // destroy linked field
      return linkField.destroy();
   }

   ///
   /// Working with Actual Object Values:
   ///

   /**
    * @method pullRelationValues
    *
    * On the Web client, we want our returned relation values to be
    * ready for Webix objects that require a .text field.
    *
    * @param {*} row
    * @return {array}
    */
   pullRelationValues(row) {
      let selectedData = [];

      const data = super.pullRelationValues(row);
      const linkedObject = this.datasourceLink;

      if (data && linkedObject) {
         // if this select value is array
         if (data.map) {
            selectedData = data.map(function (d) {
               // display label in format
               if (d) d.text = d.text || linkedObject.displayData(d);

               return d;
            });
         } else if (data.id || data.uuid) {
            selectedData = data;
            selectedData.text =
               selectedData.text || linkedObject.displayData(selectedData);
         }
      }

      return selectedData;
   }

   // return the grid column header definition for this instance of ABFieldConnect
   columnHeader(options) {
      options = options || {};
      const config = super.columnHeader(options);
      const field = this;
      const App = field.AB._App;

      const width = options.width,
         editable = options.editable;

      config.template = (row) => {
         if (row.$group) return row[field.columnName];

         const node = document.createElement("div");
         node.classList.add("connect-data-values");
         if (typeof width != "undefined") {
            node.style.marginLeft = width + "px";
         }

         const domNode = node;

         const multiselect = field.settings.linkType == "many";

         let placeholder = L("Select item");
         if (multiselect) {
            placeholder = L("Select items");
         }
         let readOnly = false;
         if (editable != null && !editable) {
            readOnly = true;
            placeholder = "";
         }

         // const domNode = node.querySelector('.list-data-values');

         // get selected values
         const selectedData = field.pullRelationValues(row);

         // Render selectivity
         if (!options.skipRenderSelectivity) {
            field.selectivityRender(
               domNode,
               {
                  multiple: multiselect,
                  readOnly: readOnly,
                  editPage: options.editPage,
                  isLabelHidden: options.isLabelHidden,
                  additionalText: options.additionalText,
                  placeholder: placeholder,
                  data: selectedData,
               },
               App,
               row
            );
         }

         return domNode.outerHTML;
      };

      return config;
   }

   /*
    * @function customDisplay
    * perform any custom display modifications for this field.
    * @param {object} row
    *        is the {name=>value} hash of the current row of data.
    * @param {App} App
    *        the shared ui App object useful more making globally
    *			 unique id references.
    * @param {HtmlDOM} node
    *        the HTML Dom object for this field's display.
    * @param {object} options
    *        a {key=>value} hash of display options
    *          .editable {bool}  are we able to edit the value?
    *          .filters {hash}  the where cond to lookup values
    *          .editPage
    *          .isLabelHidden
    *          .additionalText
    *
    */
   customDisplay(row, App, node, options) {
      options = options || {};

      const isFormView = options.formView != null ? options.formView : false;
      // sanity check.
      if (!node) {
         return;
      }

      const domNode = node.querySelector(".connect-data-values");
      if (!domNode) return;

      const multiselect = this.settings.linkType == "many";

      // get selected values
      const selectedData = this.pullRelationValues(row);

      let placeholder = L("Select item");
      if (multiselect) {
         placeholder = L("Select items");
      }
      let readOnly = false;
      if (options.editable != null && options.editable == false) {
         readOnly = true;
         placeholder = "";
      }

      if (options.filters == null) {
         options.filters = {};
      }

      // if this field's options are filtered off another field's value we need
      // to make sure the UX helps the user know what to do.
      let placeholderReadOnly = null;
      if (options.filterValue && options.filterKey) {
         if (!$$(options.filterValue.ui.id)) {
            // this happens in the Interface Builder when only the single form UI is displayed
            readOnly = true;
            placeholderReadOnly = L("Must select item from '{0}' first.", [
               L("PARENT ELEMENT"),
            ]);
         } else {
            const val = this.getValue($$(options.filterValue.ui.id));
            if (!val) {
               // if there isn't a value on the parent select element set this one to readonly and change placeholder text
               readOnly = true;
               const label = $$(options.filterValue.ui.id);
               placeholderReadOnly = L("Must select item from '{0}' first.", [
                  label.config.label,
               ]);
            }
         }
      }

      let formId = "";
      if ($$(domNode).getFormView) {
         const formNode = $$(domNode).getFormView();
         if (formNode && formNode.config && formNode.config.abid) {
            formId = formNode.config.abid;
         }
      }

      // Render selectivity
      this.selectivityRender(
         domNode,
         {
            multiple: multiselect,
            data: selectedData,
            placeholder: placeholderReadOnly
               ? placeholderReadOnly
               : placeholder,
            readOnly: readOnly,
            editPage: options.editPage,
            isLabelHidden: options.isLabelHidden,
            additionalText: options.additionalText,
            dataCy: `${this.key} ${this.columnName} ${this.id} ${formId}`,
            ajax: {
               url: "It will call url in .getOptions function", // require
               minimumInputLength: 0,
               quietMillis: 250,
               fetch: async (url, init, queryOptions) => {
                  // if we are filtering based off another selectivity's value we
                  // need to do it on fetch each time because the value can change
                  // copy the filters so we don't add to them every time there is a change
                  const combineFilters = JSON.parse(
                     JSON.stringify(options.filters)
                  );

                  // only add filters if we pass valid value and key
                  if (
                     options.filterValue &&
                     options.filterKey &&
                     $$(options.filterValue.ui.id)
                  ) {
                     // get the current value of the parent select box
                     const parentVal = this.getValue(
                        $$(options.filterValue.ui.id)
                     );
                     if (parentVal) {
                        // if there is a value create a new filter rule
                        const filter = {
                           key: options.filterKey,
                           rule: "equals",
                           value: parentVal[options.filterColumn],
                        };
                        combineFilters.rules.push(filter);
                     }
                  }

                  this.once("option.data", (options) => {
                     domNode.selectivity.setOptions({
                        items: options,
                     });
                     domNode.selectivity.close();
                     domNode.selectivity.open();
                  });

                  return this.getOptions(
                     combineFilters,
                     queryOptions.term
                  ).then((data) => {
                     return {
                        results: data,
                     };
                  });
               },
            },
         },
         App,
         row
      );

      if (!domNode.dataset.isListened) {
         // prevent listen duplicate
         domNode.dataset.isListened = true;

         // Listen event when selectivity value updates
         if (domNode && row.id && !isFormView) {
            domNode.addEventListener(
               "change",
               async (/* e */) => {
                  // update just this value on our current object.model
                  const values = {};
                  values[this.columnName] = this.selectivityGet(domNode);

                  // check data does not be changed
                  if (Object.is(values[this.columnName], row[this.columnName]))
                     return;

                  // pass empty string because it could not put empty array in REST api
                  // added check for null because default value of field is null
                  if (
                     values[this.columnName] == null ||
                     values[this.columnName].length == 0
                  )
                     values[this.columnName] = "";

                  try {
                     await this.object.model().update(row.id, values);

                     // update values of relation to display in grid
                     values[this.relationName()] = values[this.columnName];

                     // update new value to item of DataTable .updateItem
                     if (values[this.columnName] == "")
                        values[this.columnName] = [];
                     if ($$(node) && $$(node).updateItem)
                        $$(node).updateItem(row.id, values);
                  } catch (err) {
                     node.classList.add("webix_invalid");
                     node.classList.add("webix_invalid_cell");

                     this.AB.notify.developer(err, {
                        context:
                           "ABFieldConnect:customDisplay():onChange: Error updating our entry.",
                        row: row,
                        values: values,
                     });
                  }
               },
               false
            );
         } else {
            domNode.addEventListener(
               "change",
               (/* e */) => {
                  if (domNode.clientHeight > 32) {
                     const item = $$(node);
                     item.define("height", domNode.clientHeight + 6);
                     item.resizeChildren();
                     item.resize();
                  }
               },
               false
            );

            // add a change listener to the selectivity instance we are filtering our options list by.
            if (options.filterValue && $$(options.filterValue.ui.id)) {
               const parentDomNode = $$(
                  options.filterValue.ui.id
               ).$view.querySelector(".connect-data-values");
               parentDomNode.addEventListener(
                  "change",
                  (e) => {
                     const parentVal = this.selectivityGet(parentDomNode);
                     if (parentVal) {
                        // if there is a value set allow the user to edit and
                        // put back the placeholder text to the orignal value
                        domNode.selectivity.setOptions({
                           readOnly: false,
                           placeholder: placeholder,
                        });

                        // clear any previous value because it could be invalid
                        domNode.selectivity.setValue(null);
                     } else {
                        // if there is not a value set make field read only and
                        // set the placeholder text to a read only version
                        domNode.selectivity.setOptions({
                           readOnly: true,
                           placeholder: placeholderReadOnly,
                        });

                        // clear any previous value because it could be invalid
                        domNode.selectivity.setValue(null);
                     }
                  },
                  false
               );
            }
         }
      }
   }

   /*
    * @function customEdit
    *
    * @param {object} row is the {name=>value} hash of the current row of data.
    * @param {App} App the shared ui App object useful more making globally
    *					unique id references.
    * @param {HtmlDOM} node  the HTML Dom object for this field's display.
    */

   //// NOTE: why do we pass in row, App, and node?  is this something we do in our external components?
   ////       are these values present when this Object is instanciated? Can't we just pass these into the
   ////       object constructor and have it internally track these things?
   customEdit(row, App, node) {
      if (this.settings.linkType == "many") {
         const domNode = node.querySelector(".connect-data-values");

         if (domNode.selectivity != null) {
            // Open selectivity
            domNode.selectivity.open();
            return false;
         }
         return false;
      }
      return false;
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
      return super.formComponent("connect");
   }

   detailComponent() {
      const detailComponentSetting = super.detailComponent();

      detailComponentSetting.common = () => {
         return {
            key: "detailconnect",
         };
      };

      return detailComponentSetting;
   }

   /**
    * @method getOptions
    * show options list in selectivity
    *
    * @return {Promise}
    */
   getOptions(where, term) {
      return new Promise((resolve, reject) => {
         let haveResolved = false;
         // {bool}
         // have we already passed back a result?

         const respond = (options) => {
            // filter the raw lookup with the provided search term
            options = options.filter(function (item) {
               if (item.text.toLowerCase().includes(term.toLowerCase())) {
                  return true;
               }
            });

            if (!haveResolved) {
               haveResolved = true;
               resolve(options);
            } else {
               // if we have already resolved() then .emit() that we have
               // updated "option.data".
               this.emit("option.data", options);
            }
         };

         // Prepare Where clause

         where = where || {};

         if (!where.glue) where.glue = "and";

         if (!where.rules) where.rules = [];

         term = term || "";

         // check if linked object value is not define, should return a empty array
         if (!this.settings.linkObject) return [];

         // if options was cached
         // if (this._options != null) return resolve(this._options);

         const linkedObj = this.datasourceLink;

         // System could not found the linked object - It may be deconsted ?
         if (linkedObj == null) throw new Error("No linked object");

         const linkedCol = this.fieldLink;

         // System could not found the linked field - It may be deconsted ?
         if (linkedCol == null) throw new Error("No linked column");

         // Get linked object model
         const linkedModel = linkedObj.model();

         // M:1 - get data that's only empty relation value
         if (
            this.settings.linkType == "many" &&
            this.settings.linkViaType == "one"
         ) {
            where.rules.push({
               key: linkedCol.id,
               rule: "is_null",
            });
            // where[linkedCol.columnName] = null;
         }
         // 1:1
         else if (
            this.settings.linkType == "one" &&
            this.settings.linkViaType == "one"
         ) {
            // 1:1 - get data is not match link id that we have
            if (this.settings.isSource == true) {
               // NOTE: make sure "haveNoRelation" shows up as an operator
               // the value ":0" doesn't matter, we just need 'haveNoRelation' as an operator.
               // newRule[linkedCol.id] = { 'haveNoRelation': 0 };
               where.rules.push({
                  key: linkedCol.id,
                  rule: "haveNoRelation",
               });
            }
            // 1:1 - get data that's only empty relation value by query null value from link table
            else {
               where.rules.push({
                  key: linkedCol.id,
                  rule: "is_null",
               });
               // newRule[linkedCol.id] = 'null';
               // where[linkedCol.id] = null;
            }
         }

         const storageID = `${this.id}-${JSON.stringify(where)}`;

         Promise.resolve()
            .then(async () => {
               // Get Local Storage

               // We store the .findAll() results locally and return that for a
               // quick response:
               const storedOptions = await this.AB.Storage.get(storageID);
               if (storedOptions) {
                  // immediately respond with our stored options.
                  this._options = storedOptions;
                  return respond(storedOptions);
               }
            })
            .then(async () => {
               try {
                  // Pull linked object data
                  const result = await linkedModel.findAll({
                     where: where,
                     populate: false,
                  });

                  // cache linked object data
                  this._options = result.data || result || [];

                  // populate display text
                  (this._options || []).forEach((opt) => {
                     opt.text = linkedObj.displayData(opt);
                  });

                  this.AB.Storage.set(storageID, this._options);
                  return respond(this._options);
               } catch (err) {
                  this.AB.notify.developer(err, {
                     context:
                        "ABFieldConnect:getOptions(): unable to retrieve options from server",
                     field: this.toObj(),
                     where,
                  });

                  haveResolved = true;
                  throw err;
               }
            });
      });
   }

   getValue(item) {
      const domNode = item.$view.querySelector(".connect-data-values");
      const values = this.selectivityGet(domNode);
      return values;
   }

   setValue(item, rowData) {
      if (!item) return;

      // if (AB.isEmpty(rowData)) return; removed because sometimes we will
      // want to set this to empty

      const val = this.pullRelationValues(rowData);

      // get selectivity dom
      const domSelectivity = item.$view.querySelector(".connect-data-values");

      if (domSelectivity) {
         // set value to selectivity
         this.selectivitySet(domSelectivity, val);

         if (domSelectivity.clientHeight > 32) {
            item.define("height", domSelectivity.clientHeight + 6);
            item.resizeChildren();
            item.resize();
         }
      }
   }
};
