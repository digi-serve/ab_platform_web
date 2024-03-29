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
    * ready for Webix objects that require a .text and .value field.
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
         if (Array.isArray(data)) {
            selectedData = data.map(function (d) {
               // display label in format
               if (d) {
                  d.text = d.text || d.value || linkedObject.displayData(d);
                  d.value = d.text;
               }

               return d;
            });
         } else if (data.id || data.uuid) {
            selectedData = data;
            selectedData.text =
               selectedData.text ||
               selectedData.value ||
               linkedObject.displayData(selectedData);
            selectedData.value = selectedData.text;
         } else if (typeof data == "string") {
            selectedData = { text: data };
         }
      }

      return selectedData;
   }

   columnHeader(options) {
      options = options || {};
      const config = super.columnHeader(options);
      const field = this;
      const App = field.AB._App;

      if (options.filters == null) {
         options.filters = {};
      }

      var multiselect = this.settings.linkType == "many";

      config.editor = multiselect ? "multiselect" : "combo";
      config.editFormat = (value) => {
         return this.editFormat(value);
      };
      config.editParse = (value) => {
         return this.editParse(value);
      };
      config.template = (row) => {
         var selectedData = field.pullRelationValues(row);
         var values = [];
         values.push('<div class="badgeContainer">');
         if (
            selectedData &&
            Array.isArray(selectedData) &&
            selectedData.length
         ) {
            selectedData.forEach((val) => {
               values.push(
                  `<div class='webix_multicombo_value'><span>${val.value}</span><!-- span data-uuid="${val.id}" class="webix_multicombo_delete" role="button" aria-label="Remove item"></span --></div>`
               );
            });
            if (selectedData.length > 1) {
               values.push(
                  `<span class="webix_badge selectivityBadge">${selectedData.length}</span>`
               );
            }
         } else if (selectedData.value) {
            let clear = "";
            if (options.editable) {
               clear = `<span class="webix_multicombo_delete clear-combo-value" role="button" aria-label="Remove item"></span>`;
            }
            values.push(
               `<div class='webix_multicombo_value'>${clear}<span class="ellip">${selectedData.value}</span></div>`
            );
         } else {
            return "";
         }
         values.push("</div>");
         return values.join("");
      };

      config.suggest = {
         on: {
            onBeforeShow: function () {
               field.openOptions(this);
            },
         },

         // Support partial matches
         filter: ({ value }, search) =>
            (value ?? "").toLowerCase().includes((search ?? "").toLowerCase()),
      };

      if (multiselect) {
         config.suggest.view = "checksuggest";
         config.suggest.button = true;
      }

      return config;
   }

   openOptions($suggest) {
      // PREVENT repeatedly pull data:
      // If not a x->1 relation and the options list was populated, then skip
      const $list = $suggest.getList();
      if (this.settings.linkViaType != "one") {
         if (($list?.find({}) ?? []).length) return;
      }

      // Listen create/update events of the linked object, then clear data list to re-populate
      ["create", "update"].forEach((key) => {
         if (this[`_dc_${key}_event`]) return;

         this[`_dc_${key}_event`] = this.AB.on(
            `ab.datacollection.${key}`,
            (res) => {
               if (this.datasourceLink.id == res.objectId) $list.clearAll();
            }
         );
      });

      this.getAndPopulateOptions($suggest, null, this);
   }

   /*
    * @function customEdit
    *
    * @param {object} row is the {name=>value} hash of the current row of data.
    * @param {App} App the shared ui App object useful more making globally
    *             unique id references.
    * @param {HtmlDOM} node  the HTML Dom object for this field's display.
    */

   //// NOTE: why do we pass in row, App, and node?  is this something we do in our external components?
   ////       are these values present when this Object is instanciated? Can't we just pass these into the
   ////       object constructor and have it internally track these things?
   customEdit(row, /*App,*/ node) {
      // var selectedData = this.pullRelationValues(row);
      // this._selectedData = selectedData;
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

   formComponentMobile() {
      if (this.settings.linkType == "many") {
         return super.formComponent("mobile-selectmultiple");
      }
      return super.formComponent("mobile-selectsingle");
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
   async getOptions(whereClause, term, sort, editor) {
      const theEditor = editor;

      if (theEditor) {
         // PREVENT: repeatly refresh data too often
         if (theEditor._getOptionsThrottle) {
            clearTimeout(theEditor._getOptionsThrottle);
            // NOTE: remove variables that reference the Promise and Resolve to let GC cleans up.
            // https://dev.to/xnimorz/js-promises-3-garbage-collection-and-memory-leaks-2oi7?fbclid=IwAR1wqgNz2KqchaM7eRkclR6YWHT01eva4y5IWpnaY0in6BrxmTAtpNCnEXM
            delete theEditor._timeToPullData;
            delete theEditor._getOptionsResolve;
         }
         theEditor._timeToPullData = await new Promise((resolve) => {
            theEditor._getOptionsResolve = resolve;
            theEditor._getOptionsThrottle = setTimeout(() => {
               resolve(true);
            }, 100);
         });
         if (!theEditor._timeToPullData) return;
      }

      return new Promise((resolve, reject) => {
         let haveResolved = false;
         // {bool}
         // have we already passed back a result?

         const respond = (options) => {
            // filter the raw lookup with the provided search term
            options = options.filter((item) => {
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

         const where = this.AB.cloneDeep(whereClause || {});
         sort = sort || [];

         if (!where.glue) where.glue = "and";

         if (!where.rules) where.rules = [];

         term = term || "";

         // check if linked object value is not define, should return a empty array
         if (!this.settings.linkObject) return [];

         // if options was cached
         // if (this._options != null) return resolve(this._options);

         const linkedObj = this.datasourceLink;

         // System could not found the linked object - It may be deleted ?
         if (linkedObj == null) throw new Error("No linked object");

         const linkedCol = this.fieldLink;

         // System could not found the linked field - It may be deleted ?
         if (linkedCol == null) throw new Error("No linked column");

         // Get linked object model
         const linkedModel = linkedObj.model();

         // M:1 - get data that's only empty relation value
         if (
            this.settings.linkType == "many" &&
            this.settings.linkViaType == "one" &&
            editor?.config?.showAllOptions != true
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
            this.settings.linkViaType == "one" &&
            editor?.config?.showAllOptions != true
         ) {
            // 1:1 - get data is not match link id that we have
            if (this.settings.isSource == true) {
               // NOTE: make sure "haveNoRelation" shows up as an operator
               // the value ":0" doesn't matter, we just need 'haveNoRelation' as an operator.
               // newRule[linkedCol.id] = { 'haveNoRelation': 0 };
               where.rules.push({
                  key: linkedCol.id,
                  rule: "have_no_relation",
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

         const storageID = this.getStorageID(where);

         Promise.resolve()
            .then(async () => {
               // Mar 23, 2023 disabling local storage of options because users
               // were reporting not seeing the correct options list with either
               // new, updated or deleted records that should or should not appear
               return false;
               // Get Local Storage unless xxx->one connected field
               if (this?.settings?.linkViaType != "one") {
                  // We store the .findAll() results locally and return that for a
                  // quick response:
                  return await this.AB.Storage.get(storageID);
               }
            })
            .then(async (storedOptions) => {
               if (storedOptions) {
                  // immediately respond with our stored options.
                  this._options = storedOptions;
                  return respond(this._options);
               }
               // Pull linked object data
               let options = function () {
                  return linkedModel.findAll({
                     where: where,
                     sort: sort,
                     populate: false,
                  });
               };

               // placeholder for selected options
               let selected = function () {
                  return new Promise((resolve, reject) => {
                     // empty data array to pass to all()
                     resolve({ data: [] });
                  });
               };

               // we also need to get selected values of xxx->one connections
               // if we are looking at a field in a form we look at linkViaOneValues
               // if we are looking at a grid we are editing we look at theEditor?.config?.value
               if (
                  this?.settings?.linkViaType == "one" &&
                  (this?.linkViaOneValues || theEditor?.config?.value)
               ) {
                  let values = "";
                  // determine if we are looking in a grid or at a form field
                  if (
                     (theEditor?.config?.view == "multicombo" ||
                        theEditor?.config?.view == "combo") &&
                     this?.linkViaOneValues
                  ) {
                     values = this?.linkViaOneValues;
                  } else if (theEditor?.config?.value) {
                     if (Array.isArray(theEditor.config.value)) {
                        values = theEditor?.config?.value.join();
                     } else {
                        values = theEditor?.config?.value;
                     }
                  }
                  let whereRels = {};
                  let sortRels = [];

                  whereRels.glue = "or";
                  whereRels.rules = [];

                  values.split(",").forEach((v) => {
                     whereRels.rules.push({
                        key: "uuid",
                        rule: "equals",
                        value: v,
                     });
                  });
                  selected = function () {
                     return linkedModel.findAll({
                        where: whereRels,
                        sort: sortRels,
                        populate: false,
                     });
                  };
               }
               try {
                  const results = await Promise.all([options(), selected()]);

                  // combine options and selected items and
                  // put the selected options at the top of the list
                  const result = results[1].data.concat(results[0].data);

                  // store results in _options
                  this._options = result.data || result || [];

                  // populate display text
                  (this._options || []).forEach((opt) => {
                     opt.text = linkedObj.displayData(opt);
                     opt.value = opt.text;
                  });

                  // 8/10/2023 - We are not actually using this (see line 338) - If we need to store
                  // user data in local storage we should encrypt it.
                  // cache options if not a xxx->one connection
                  // if (this?.settings?.linkViaType != "one") {
                  //    this.AB.Storage.set(storageID, this._options);
                  // }
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

   getStorageID(where) {
      return `${this.id}-${JSON.stringify(where)}`;
   }

   async clearStorage(where) {
      const storageID = this.getStorageID(where);
      await this.AB.Storage.set(storageID, null);
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
               if (itemObj && itemObj.id) {
                  vals.push(itemObj.id);
               } else {
                  vals.push(val);
               }
            }
         });
      } else {
         if (typeof value == "object") {
            vals.push(value.id);
         } else {
            let itemObj = this.getItemFromVal(value);
            if (itemObj && itemObj.id) {
               vals.push(itemObj.id);
            } else {
               vals.push(value);
            }
         }
      }
      return vals.join();
   }

   editParse(value) {
      var multiselect = this.settings.linkType == "many";
      if (multiselect) {
         if (!value) {
            return [];
         } else {
            let returnVals = [];
            let vals = value.split(",");
            vals.forEach((val) => {
               returnVals.push(this.getItemFromVal(val));
            });
            return returnVals;
         }
      } else {
         let item = this.getItemFromVal(value);
         return item;
      }
   }

   getAndPopulateOptions(editor, options, field, form) {
      if (!editor) return Promise.resolve([]);

      const theEditor = editor;
      // if editor has options and is xxx->one store the options on the field
      if (
         this?.settings?.linkViaType == "one" &&
         theEditor.getValue() &&
         !field.linkViaOneValues
      ) {
         field.linkViaOneValues = theEditor.getValue();
      }

      // if we are filtering based off another selectivity's value we
      // need to do it on fetch each time because the value can change
      // copy the filters so we don't add to them every time there is a change
      const combineFilters = options?.filters
         ? Object.assign({}, options.filters)
         : { glue: "and", rules: [] };

      if (options?.filterByConnectValues) {
         const parseFilterByConnectValues = (conditions, values, depth = 0) => {
            const valuesByDepth = values.filter((e) => e?.depth === depth);

            return [
               ...conditions.rules.map((e) => {
                  if (e.glue)
                     return {
                        glue: e.glue,
                        rules: parseFilterByConnectValues(e, values, depth + 1),
                     };

                  const value = valuesByDepth.filter(
                     (ef) => ef.key === e.key && ef.value === e.value
                  )[0];

                  if (!value) return e;

                  const $parentField = value?.filterValue?.config.id
                     ? $$(value.filterValue.config.id)
                     : null;

                  if (!$parentField)
                     throw Error(
                        "Some parent field's view components don't exist"
                     );

                  const parentValue = value?.filterValue
                     ? $parentField.getValue() ?? ""
                     : "";

                  let newVal = "";

                  if (parentValue) {
                     if (value.filterColumn) {
                        const filterField = field.object.fieldByID(
                           value.filterValue.config.dataFieldId
                        );
                        let valItem;

                        // When options does not load yet, then pull select value from DC
                        if (!filterField._options?.length) {
                           const linkedField =
                              (form.datacollection.datasource?.fields(
                                 (f) =>
                                    f.id == value.value ||
                                    f.columnName == value.value
                              ) ?? [])[0];

                           if (linkedField) {
                              // Get values from DC
                              const formVals = form.datacollection?.getCursor();

                              valItem =
                                 formVals[linkedField.relationName()] ??
                                 formVals[value.value];
                           }
                        } else {
                           valItem = filterField.getItemFromVal(parentValue);
                        }

                        if (valItem) {
                           newVal = valItem[value.filterColumn];
                        } else {
                           newVal = parentValue;
                        }
                     } else {
                        newVal = parentValue;
                     }
                  }

                  return {
                     key: e.key,
                     rule: "equals",
                     value: newVal,
                  };
               }),
            ];
         };

         combineFilters.rules = parseFilterByConnectValues(
            combineFilters,
            options.filterByConnectValues
         );
      }

      if (!this.handlerOptionData) {
         this.handlerOptionData = (data) => {
            if (theEditor.$destructed) {
               this.removeListener("option.data", this.handlerOptionData);
               return;
            }
            this.populateOptions(theEditor, data, field, form, true);
         };
      }

      // try to make sure we don't continually add up listeners.
      this.removeListener("option.data", this.handlerOptionData).once(
         "option.data",
         this.handlerOptionData
      );

      return new Promise((resolve, reject) => {
         this.getOptions(
            combineFilters,
            "",
            options?.sort ?? "",
            theEditor
         ).then((data) => {
            this.populateOptions(theEditor, data, field, form, true);
            resolve(data);
         });
      });
   }

   populateOptions(theEditor, data, field, form, addCy) {
      if (theEditor == null || theEditor.$destructed) return;

      theEditor.blockEvent();
      theEditor.getList().clearAll();
      theEditor.getList().define("data", data);
      if (addCy) {
         this.populateOptionsDataCy(theEditor, field, form);
      }
      if (theEditor.getValue?.() && data?.length) {
         let currVal = theEditor.getValue();
         // in a multiselect environment, the current val can be an encoded string:
         // "id1,id2".  Break this into an array:
         if (field.linkType() == "many" && typeof currVal == "string") {
            currVal = currVal.split(",");
         }
         if (!Array.isArray(currVal)) {
            currVal = [currVal];
         }

         let selectedVals = [];
         currVal.forEach((cVal) => {
            // Check exists item
            const isExists = data.some((d) => d.id == cVal);

            if (isExists) {
               selectedVals.push(cVal);
            }

            // if we couldn't find it by it's .id, then check to see
            // if there is a custom index (.indexField  .indexField2)
            // that does match.
            // Select option item from custom index value
            if (
               !isExists &&
               field.isConnection &&
               (field.indexField || field.indexField2)
            ) {
               const selectedItem = data.filter(
                  (d) =>
                     d[field.indexField?.columnName ?? ""] == cVal ||
                     d[field.indexField2?.columnName ?? ""] == cVal
               )[0];

               if (selectedItem) selectedVals.push(selectedItem.id);
            }
         });

         theEditor.setValue(selectedVals);
      }
      theEditor.unblockEvent();
   }

   populateOptionsDataCy(theEditor, field, form) {
      if (theEditor?.$destructed) return;

      // Add data-cy attributes
      if (theEditor?.getList) {
         if (!theEditor.getPopup) return;
         var popup = theEditor.getPopup();
         if (!popup) return;
         theEditor.getList().data.each((option) => {
            if (!option) return;
            var node = popup.$view.querySelector(
               "[webix_l_id='" + option.id + "']"
            );
            if (!node) return;
            node.setAttribute(
               "data-cy",
               `${field.key} options ${option.id} ${field.id} ${form?.id}`
            );
         });
      }
   }

   getItemFromVal(val) {
      let item;
      let options = this._options || [];
      if (options.length > 0) {
         for (let i = 0; i < options.length; i++) {
            if (
               this.indexField &&
               options[i][this.indexField.object.PK()] == val
            ) {
               item = options[i];
               break;
            } else if (
               this.indexField2 &&
               options[i][this.indexField2.object.PK()] == val
            ) {
               item = options[i];
               break;
            } else {
               if (
                  options[i].id == val ||
                  options[i].value == val ||
                  options[i][this.indexField?.columnName ?? ""] == val ||
                  options[i][this.indexField2?.columnName ?? ""] == val
               ) {
                  item = options[i];
                  break;
               }
            }
         }
         return item;
      } else {
         return "";
      }
   }

   getValue(item) {
      var multiselect = this.settings.linkType == "many";
      if (multiselect) {
         let vals = [];
         if (item.getValue()) {
            let val = item.getValue().split(",");
            val.forEach((record) => {
               vals.push(item.getList().getItem(record));
            });
         }
         return vals;
      } else {
         if (item.getValue()) {
            return item.getList().getItem(item.getValue());
         } else {
            return "";
         }
      }
   }

   setValue(item, rowData) {
      if (!item) return;
      // if (AB.isEmpty(rowData)) return; removed because sometimes we will
      // want to set this to empty
      let val = this.pullRelationValues(rowData);
      // put in current values as options so we can display them before
      // the rest of the options are fetched when field is clicked
      if (item.getList && item.getList().count() == 0) {
         if (this.settings.linkType !== "one" && !Array.isArray(val)) {
            val = [val];
         }

         const $list = item.getList();

         $list.define("data", val);
         $list.refresh();
      }

      item.setValue(
         Array.isArray(val)
            ? val
                 .map(
                    (e) =>
                       this.getRelationValue(e, { forUpdate: true }) ??
                       e.id ??
                       e.uuid ??
                       e
                 )
                 .join(",")
            : this.getRelationValue(val, { forUpdate: true }) ??
                 val.id ??
                 val.uuid ??
                 val
      );
   }

   /**
    * @method pullRecordRelationValues
    *
    * On the Web client, we want our returned relation values to be
    * ready for Webix objects that require a .text and .value field.
    *
    * @param {*} row
    * @return {array}
    */
   pullRecordRelationValues(record) {
      var selectedData = [];

      var data = record;
      var linkedObject = this.datasourceLink;

      if (data && linkedObject) {
         // if this select value is array
         if (Array.isArray(data)) {
            selectedData = data.map(function (d) {
               // display label in format
               if (d) {
                  d.text = d.text || linkedObject.displayData(d);
                  d.value = d.text;
               }

               return d;
            });
         } else if (data.id || data.uuid) {
            selectedData = data;
            selectedData.text =
               selectedData.text || linkedObject.displayData(selectedData);
            selectedData.value = selectedData.text;
         }
      }

      return selectedData;
   }

   warningsEval() {
      super.warningsEval();

      var linkField = this.fieldLink;
      if (!linkField) {
         this.warningsMessage(
            `is unable to find linked field[${this.settings.linkColumn}]`,
            {
               linkColumn: this.settings.linkColumn,
            }
         );
      }

      let linkObj = this.datasourceLink;
      if (!linkObj) {
         this.warningsMessage(
            `is unable to find linked object[${this.settings.linkObject}]`,
            {
               linkObject: this.settings.linkObject,
            }
         );
      }
   }
};
