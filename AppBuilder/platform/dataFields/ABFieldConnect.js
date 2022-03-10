var ABFieldConnectCore = require("../../core/dataFields/ABFieldConnectCore");
var ABFieldComponent = require("./ABFieldComponent");

let L = (...params) => AB.Multilingual.label(...params);

var ids = {
   linkObject: "ab-new-connectObject-list-item",
   objectCreateNew: "ab-new-connectObject-create-new",

   fieldLink: "ab-add-field-link-from",
   fieldLink2: "ab-add-field-link-from-2",
   linkType: "ab-add-field-link-type-to",
   linkViaType: "ab-add-field-link-type-from",
   fieldLinkVia: "ab-add-field-link-to",
   fieldLinkVia2: "ab-add-field-link-to-2",

   link1: "ab-link1-field-options",
   link2: "ab-link2-field-options",

   isCustomFK: "ab-is-custom-fk",
   indexField: "ab-index-field",
   indexField2: "ab-index-field2",

   connectDataPopup: "ab-connect-object-data-popup",
};

var defaultValues = ABFieldConnectCore.defaultValues();

function populateSelect(populate) {
   let options = [];
   ABFieldConnectComponent.CurrentApplication.objectsIncluded().forEach((o) => {
      options.push({ id: o.id, value: o.label });
   });

   // sort by object's label  A -> Z
   options.sort((a, b) => {
      if (a.value < b.value) return -1;
      if (a.value > b.value) return 1;
      return 0;
   });

   $$(ids.linkObject).define("options", options);
   $$(ids.linkObject).refresh();
   if (populate != null && populate == true) {
      $$(ids.linkObject).setValue(options[options.length - 1].id);
      $$(ids.linkObject).refresh();
      var selectedObj = $$(ids.linkObject)
         .getList()
         .getItem(options[options.length - 1].id);
      if (selectedObj) {
         var selectedObjLabel = selectedObj.value;
         $$(ids.fieldLinkVia).setValue(
            L("<b>${0}</b> entry.", [selectedObjLabel])
         );
         $$(ids.fieldLinkVia2).setValue(
            L("Each <b>${0}</b> entry connects with", [selectedObjLabel])
         );
         $$(ids.link1).show();
         $$(ids.link2).show();
      }
   }
}

/**
 * ABFieldConnectComponent
 *
 * Defines the UI Component for this Data Field.  The ui component is responsible
 * for displaying the properties editor, populating existing data, retrieving
 * property values, etc.
 */
var ABFieldConnectComponent = new ABFieldComponent({
   fieldDefaults: ABFieldConnectCore.defaults(),

   elements: (App, field) => {
      ids = field.idsUnique(ids, App);

      this.App = App;

      return [
         {
            view: "richselect",
            label: L("Connected to:"),
            id: ids.linkObject,
            disallowEdit: true,
            name: "linkObject",
            labelWidth: this.AB.UISettings.config().labelWidthLarge,
            placeholder: L("Select object"),
            options: [],
            // select: true,
            // height: 140,
            // template: "<div class='ab-new-connectObject-list-item'>#label#</div>",
            on: {
               onChange: (newV, oldV) => {
                  ABFieldConnectComponent.logic.selectObjectTo(newV, oldV);
               },
            },
         },
         {
            view: "button",
            css: "webix_primary",
            id: ids.objectCreateNew,
            disallowEdit: true,
            value: L("Connect to new Object"),
            click: async () => {
               await ABFieldConnectComponent.logic.clickNewObject();
            },
         },
         {
            view: "layout",
            id: ids.link1,
            hidden: true,
            cols: [
               {
                  id: ids.fieldLink,
                  view: "label",
                  width: 300,
               },
               {
                  id: ids.linkType,
                  disallowEdit: true,
                  name: "linkType",
                  view: "richselect",
                  value: defaultValues.linkType,
                  width: 95,
                  options: [
                     {
                        id: "many",
                        value: L("many"),
                     },
                     {
                        id: "one",
                        value: L("one"),
                     },
                  ],
                  on: {
                     onChange: (newValue, oldValue) => {
                        ABFieldConnectComponent.logic.selectLinkType(
                           newValue,
                           oldValue
                        );
                     },
                  },
               },
               {
                  id: ids.fieldLinkVia,
                  view: "label",
                  label: L("<b>{0}</b> entry.", [L("[Select object]")]),
                  width: 200,
               },
            ],
         },
         {
            view: "layout",
            id: ids.link2,
            hidden: true,
            cols: [
               {
                  id: ids.fieldLinkVia2,
                  view: "label",
                  label: L("Each <b>{0}</b> entry connects with", [
                     L("[Select object]"),
                  ]),
                  width: 300,
               },
               {
                  id: ids.linkViaType,
                  name: "linkViaType",
                  disallowEdit: true,
                  view: "richselect",
                  value: defaultValues.linkViaType,
                  width: 95,
                  options: [
                     {
                        id: "many",
                        value: L("many"),
                     },
                     {
                        id: "one",
                        value: L("one"),
                     },
                  ],
                  on: {
                     onChange: (newV, oldV) => {
                        ABFieldConnectComponent.logic.selectLinkViaType(
                           newV,
                           oldV
                        );
                     },
                  },
               },
               {
                  id: ids.fieldLink2,
                  view: "label",
                  width: 200,
               },
            ],
         },
         {
            name: "linkColumn",
            view: "text",
            hidden: true,
         },
         {
            name: "isSource",
            view: "text",
            hidden: true,
         },
         {
            id: ids.isCustomFK,
            name: "isCustomFK",
            view: "checkbox",
            disallowEdit: true,
            labelWidth: 0,
            labelRight: L("Custom Foreign Key"),
            hidden: true,
            on: {
               onChange: () => {
                  ABFieldConnectComponent.logic.checkCustomFK();
               },
            },
         },
         {
            id: ids.indexField,
            name: "indexField",
            view: "richselect",
            disallowEdit: true,
            hidden: true,
            labelWidth: this.AB.UISettings.config().labelWidthLarge,
            label: L("Index Field:"),
            placeholder: L("Select index field"),
            options: [],
            // on: {
            //    onChange: () => {
            //       ABFieldConnectComponent.logic.updateColumnName();
            //    }
            // }
         },
         {
            id: ids.indexField2,
            name: "indexField2",
            view: "richselect",
            disallowEdit: true,
            hidden: true,
            labelWidth: this.AB.UISettings.config().labelWidthLarge,
            label: L("Index Field:"),
            placeholder: L("Select index field"),
            options: [],
         },
      ];
   },

   // defaultValues: the keys must match a .name of your elements to set it's default value.
   defaultValues: defaultValues,

   // rules: basic form validation rules for webix form entry.
   // the keys must match a .name of your .elements for it to apply
   rules: {},

   // include additional behavior on default component operations here:
   // The base routines will be processed first, then these.  Any results
   // from the base routine, will be passed on to these:
   logic: {
      applicationLoad: (application) => {
         ABFieldConnectComponent.CurrentApplication = application;
      },

      objectLoad: (object) => {
         ABFieldConnectComponent.CurrentObject = object;
      },

      clear: (ids) => {
         // $$(ids.linkObject).unselectAll();
         $$(ids.linkObject).setValue(defaultValues.linkObject);
      },

      isValid: (ids, isValid) => {
         // validate require select linked object
         var selectedObjId = $$(ids.linkObject).getValue();
         if (!selectedObjId) {
            webix.html.addCss($$(ids.linkObject).$view, "webix_invalid");
            isValid = false;
         } else {
            webix.html.removeCss($$(ids.linkObject).$view, "webix_invalid");
         }

         return isValid;
      },

      show: (pass_ids) => {
         // add objects to list
         // $$(pass_ids.linkObject).clearAll();
         // $$(pass_ids.linkObject).parse(ABFieldConnectComponent.CurrentApplication.objects());
         populateSelect(false);

         // show current object name
         $$(ids.fieldLink).setValue(
            L("Each <b>{0}</b> entry connects with", [
               ABFieldConnectComponent.CurrentObject.label,
            ])
         );
         $$(ids.fieldLink2).setValue(
            L("<b>{0}</b> entry.", [
               ABFieldConnectComponent.CurrentObject.label,
            ])
         );

         // keep the column name element to use when custom index is checked
         ABFieldConnectComponent._$columnName = $$(pass_ids.columnName);
         ABFieldConnectComponent.logic.updateCustomIndex();
      },

      populate: (/* ids, values */) => {},

      values: (ids, values) => {
         return values;
      },

      selectObjectTo: (newValue, oldValue) => {
         if (!newValue) {
            $$(ids.link1).hide();
            $$(ids.link2).hide();
         }
         if (newValue == oldValue || newValue == "") return;

         let selectedObj = $$(ids.linkObject).getList().getItem(newValue);
         if (!selectedObj) return;

         let selectedObjLabel = selectedObj.value;
         $$(ids.fieldLinkVia).setValue(
            L("<b>{0}</b> entry.", [selectedObjLabel])
         );
         $$(ids.fieldLinkVia2).setValue(
            L("Each <b>{0}</b> entry connects with", [selectedObjLabel])
         );
         $$(ids.link1).show();
         $$(ids.link2).show();

         ABFieldConnectComponent.logic.updateCustomIndex();
      },

      clickNewObject: async (callback) => {
         let App = this.App;
         if (!App.actions.addNewObject) return;

         try {
            // pass false because after it is created we do not want it to select it in the object list
            await App.actions.addNewObject(false, callback);

            // pass true because we want it to select the last item in the list that was just created
            populateSelect(true, callback);
         } catch (err) {
            App.AB.notify.developer(err, {
               message: "Error when add new object.",
            });
         }
      },

      selectLinkType: (newValue /*, oldValue */) => {
         let labelEntry = L("entry");
         let labelEntries = L("entries");

         let message = $$(ids.fieldLinkVia).getValue() || "";

         if (newValue == "many") {
            message = message.replace(labelEntry, labelEntries);
         } else {
            message = message.replace(labelEntries, labelEntry);
         }
         $$(ids.fieldLinkVia).define("label", message);
         $$(ids.fieldLinkVia).refresh();

         ABFieldConnectComponent.logic.updateCustomIndex();
      },

      selectLinkViaType: (newValue /*, oldValue */) => {
         let labelEntry = L("entry");
         let labelEntries = L("entries");

         let message = $$(ids.fieldLink2).getValue() || "";

         if (newValue == "many") {
            message = message.replace(labelEntry, labelEntries);
         } else {
            message = message.replace(labelEntries, labelEntry);
         }
         $$(ids.fieldLink2).define("label", message);
         $$(ids.fieldLink2).refresh();

         ABFieldConnectComponent.logic.updateCustomIndex();
      },

      checkCustomFK: () => {
         $$(ids.indexField).hide();
         $$(ids.indexField2).hide();

         let isChecked = $$(ids.isCustomFK).getValue();
         if (isChecked) {
            let menuItems = $$(ids.indexField).getList().config.data;
            if (menuItems && menuItems.length) {
               $$(ids.indexField).show();
            }

            let menuItems2 = $$(ids.indexField2).getList().config.data;
            if (menuItems2 && menuItems2.length) {
               $$(ids.indexField2).show();
            }
         }

         // ABFieldConnectComponent.logic.updateColumnName();
      },

      updateCustomIndex: () => {
         let linkObjectId = $$(ids.linkObject).getValue();
         let linkType = $$(ids.linkType).getValue();
         let linkViaType = $$(ids.linkViaType).getValue();

         let sourceObject = null; // object stores index column
         let linkIndexes = null; // the index fields of link object M:N

         $$(ids.indexField2).define("options", []);
         $$(ids.indexField2).refresh();

         // 1:1
         // 1:M
         if (
            (linkType == "one" && linkViaType == "one") ||
            (linkType == "one" && linkViaType == "many")
         ) {
            sourceObject = this.AB.objectByID(linkObjectId);
         }
         // M:1
         else if (linkType == "many" && linkViaType == "one") {
            sourceObject = ABFieldConnectComponent.CurrentObject;
         }
         // M:N
         else if (linkType == "many" && linkViaType == "many") {
            sourceObject = ABFieldConnectComponent.CurrentObject;
            let linkObject = this.AB.objectByID(linkObjectId);

            // Populate the second index fields
            let linkIndexFields = [];
            linkIndexes = linkObject.indexes((idx) => idx.unique);
            (linkIndexes || []).forEach((idx) => {
               (idx.fields || []).forEach((f) => {
                  if (
                     (!f ||
                        !f.settings ||
                        !f.settings.required ||
                        linkIndexFields.filter((opt) => opt.id == f.id)
                           .length) &&
                     f.key != "AutoIndex" &&
                     f.key != "combined"
                  )
                     return;

                  linkIndexFields.push({
                     id: f.id,
                     value: f.label,
                  });
               });
            });
            $$(ids.indexField2).define("options", linkIndexFields);
            $$(ids.indexField2).refresh();
         }

         $$(ids.indexField).hide();
         $$(ids.indexField2).hide();

         if (!sourceObject) {
            $$(ids.isCustomFK).hide();
            return;
         }

         let indexes = sourceObject.indexes((idx) => idx.unique);
         if (
            (!indexes || indexes.length < 1) &&
            (!linkIndexes || linkIndexes.length < 1)
         ) {
            $$(ids.isCustomFK).hide();
            $$(ids.indexField).define("options", []);
            $$(ids.indexField).refresh();
            return;
         }

         let indexFields = [];
         (indexes || []).forEach((idx) => {
            (idx.fields || []).forEach((f) => {
               if (
                  (!f ||
                     !f.settings ||
                     !f.settings.required ||
                     indexFields.filter((opt) => opt.id == f.id).length) &&
                  f.key != "AutoIndex" &&
                  f.key != "combined"
               )
                  return;

               indexFields.push({
                  id: f.id,
                  value: f.label,
                  field: f,
               });
            });
         });
         $$(ids.indexField).define("options", indexFields);
         $$(ids.indexField).refresh();

         if (indexFields && indexFields.length) {
            $$(ids.isCustomFK).show();
         }

         ABFieldConnectComponent.logic.checkCustomFK();
      },

      // updateColumnName: () => {
      //    let isChecked = $$(ids.isCustomFK).getValue();
      //    let indexFieldId = $$(ids.indexField).getValue();
      //    let indexFieldOpt = (
      //       $$(ids.indexField).getList().config.data || []
      //    ).filter((opt) => opt.id == indexFieldId)[0];

      //    if (isChecked && indexFieldOpt && indexFieldOpt.field) {
      //       // Disable & Update the column name
      //       if (ABFieldConnectComponent._$columnName) {
      //          let linkObjectId = $$(ids.linkObject).getValue();
      //          let linkObject = ABFieldConnectComponent.CurrentApplication.objects(
      //             (o) => o.id == linkObjectId
      //          )[0];
      //          if (linkObject) {
      //             ABFieldConnectComponent._$columnName.setValue(
      //                `${linkObject.name}.${indexFieldOpt.field.columnName}`
      //             );
      //          }
      //          ABFieldConnectComponent._$columnName.disable();
      //       }
      //    } else {
      //       // Enable the column name element
      //       if (ABFieldConnectComponent._$columnName) {
      //          ABFieldConnectComponent._$columnName.enable();
      //       }
      //    }
      // }
   },
});

module.exports = class ABFieldConnect extends ABFieldConnectCore {
   constructor(values, object, fieldDefaults) {
      super(values, object, fieldDefaults);
   }

   /*
    * @function propertiesComponent
    *
    * return a UI Component that contains the property definitions for this Field.
    *
    * @param {App} App the UI App instance passed around the Components.
    * @param {stirng} idBase
    * @return {Component}
    */
   static propertiesComponent(App, idBase) {
      return ABFieldConnectComponent.component(App, idBase);
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

      var linkObject = this.datasourceLink;
      if (!linkObject) return Promise.resolve(); // already notified

      var linkField = this.fieldLink;
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
      var selectedData = [];

      var data = super.pullRelationValues(row);
      var linkedObject = this.datasourceLink;

      if (data && linkedObject) {
         // if this select value is array
         if (data.map) {
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

   columnHeader(options) {
      options = options || {};

      if (options.filters == null) {
         options.filters = {};
      }

      var config = super.columnHeader(options);
      var App = App;

      var multiselect = this.settings.linkType == "many";

      config.editor = multiselect ? "multiselect" : "combo";
      config.editFormat = (value) => {
         return this.editFormat(value);
      };
      config.editParse = (value) => {
         return this.editParse(value);
      };
      config.template = (row) => {
         var selectedData = this.pullRelationValues(row);
         var values = [];
         if (selectedData.length) {
            selectedData.forEach((val) => {
               values.push(
                  `<div class='webix_multicombo_value'><span>${val.value}</span><!-- span data-uuid="${val.id}" class="webix_multicombo_delete" role="button" aria-label="Remove item"></span --></div>`
               );
            });
         } else if (selectedData.value) {
            values.push(
               `<div class='webix_multicombo_value'><span>${selectedData.value}</span><!-- span data-uuid="${selectedData.id}" class="webix_multicombo_delete" role="button" aria-label="Remove item"></span --></div>`
            );
         }
         return values.join("");
      };
      config.suggest = {
         button: true,
         on: {
            onBeforeShow: function () {
               this.getAndPopulateOptions(this);
            },
         },
      };
      if (multiselect) {
         config.suggest.view = "checksuggest";
      }

      return config;
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

   detailComponent() {
      var detailComponentSetting = super.detailComponent();

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
   getOptions(where, term, sort) {
      return new Promise((resolve, reject) => {
         var haveResolved = false;
         // {bool}
         // have we already passed back a result?

         var respond = (options) => {
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
         sort = sort || [];

         if (!where.glue) where.glue = "and";

         if (!where.rules) where.rules = [];

         term = term || "";

         // check if linked object value is not define, should return a empty array
         if (!this.settings.linkObject) return [];

         // if options was cached
         // if (this._options != null) return resolve(this._options);

         var linkedObj = this.datasourceLink;

         // System could not found the linked object - It may be deleted ?
         if (linkedObj == null) throw new Error("No linked object");

         var linkedCol = this.fieldLink;

         // System could not found the linked field - It may be deleted ?
         if (linkedCol == null) throw new Error("No linked column");

         // Get linked object model
         var linkedModel = linkedObj.model();

         // M:1 - get data that's only empty relation value
         if (
            this.settings.linkType == "many" &&
            this.settings.linkViaType == "one"
         ) {
            // Mar 8, 2022 I (James) removed this because we need these options
            // to appear so we can put a checkbox next to them with the new UI
            // where.rules.push({
            //    key: linkedCol.id,
            //    rule: "is_null",
            // });
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

         var storageID = `${this.id}-${JSON.stringify(where)}`;

         Promise.resolve()
            .then(async () => {
               // Get Local Storage

               // We store the .findAll() results locally and return that for a
               // quick response:
               var storedOptions = await this.AB.Storage.get(storageID);
               if (storedOptions) {
                  // immediately respond with our stored options.
                  this._options = storedOptions;
                  return respond(this._options);
               }
            })
            .then(async () => {
               try {
                  // Pull linked object data
                  var result = await linkedModel.findAll({
                     where: where,
                     sort: sort,
                     populate: false,
                  });

                  // cache linked object data
                  this._options = result.data || result || [];

                  // populate display text
                  (this._options || []).forEach((opt) => {
                     opt.text = linkedObj.displayData(opt);
                     opt.value = opt.text;
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
      var multiselect = this.settings.linkType == "many";
      if (multiselect) {
         let returnVals = [];
         let vals = value.split(",");
         vals.forEach((val) => {
            returnVals.push(val);
         });
         return returnVals;
      } else {
         let item = this.getItemFromVal(value);
         return item;
      }
   }

   getAndPopulateOptions(editor, options, field, form) {
      let theEditor = editor;

      let combineFilters = {};
      if (options && options.filterValue && options.filterValue.config.id) {
         let parentVal = $$(options.filterValue.config.id).getValue();
         if (parentVal) {
            // if we are filtering based off another selectivity's value we
            // need to do it on fetch each time because the value can change
            // copy the filters so we don't add to them every time there is a change
            combineFilters = JSON.parse(JSON.stringify(options.filters));

            // if there is a value create a new filter rule
            let filter = {
               key: options.filterKey,
               rule: "equals",
               value: parentVal,
            };
            combineFilters.rules.push(filter);
         }
      }

      this.once("option.data", (data) => {
         this.populateOptions(theEditor, data, field, form, true);
      });
      this.getOptions(combineFilters, "").then((data) => {
         this.populateOptions(theEditor, data, field, form, false);
      });
   }

   populateOptions(theEditor, data, field, form, addCy) {
      theEditor.blockEvent();
      theEditor.getList().clearAll();
      theEditor.getList().define("data", data);
      if (addCy) {
         this.populateOptionsDataCy(theEditor, field, form);
      }
      if (theEditor.getValue && theEditor.getValue()) {
         theEditor.setValue(theEditor.getValue());
         // } else if (this._selectedData && this._selectedData.length) {
         //    theEditor.setValue(this.editFormat(this._selectedData));
      }
      theEditor.unblockEvent();
   }

   populateOptionsDataCy(theEditor, field, form) {
      // Add data-cy attributes
      if (theEditor.getList) {
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
               `${field.key} options ${option.id} ${field.id} ${form.id}`
            );
         });
      }
   }

   getItemFromVal(val) {
      let item;
      let options = [];
      if (this._options) {
         options = options.concat(this._options);
      }
      if (options.length > 0) {
         options.forEach((option) => {
            if (this.indexField && option[this.indexField.columnName] == val) {
               item = option;
               return false;
            } else if (
               this.indexField2 &&
               option[this.indexField2.columnName] == val
            ) {
               item = option;
               return false;
            } else {
               if (option.id == val) {
                  item = option;
                  return false;
               }
            }
         });
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
         item.getList().define("data", val);
      }
      setTimeout(function () {
         item.setValue(val.id);
      }, 50);
   }
};
