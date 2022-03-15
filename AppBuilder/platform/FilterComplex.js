const FilterComplexCore = require("../core/FilterComplexCore");

let L = (...params) => AB.Multilingual.label(...params);

/**
 * @function _toInternal()
 * translate our external QB conditions into our internal format that
 * makes the cond.rule unique by adding the field.id to the rule.
 * @param {obj} cond - {
 *                         rules: [
 *                            {
 *                               alias: string || undefined,
 *                               key: uuid,
 *                               rule: string,
 *                               value: object,
 *                            }
 *                         ]
 *                      }
 *        the QB condition format we use exernally in our AB system.
 */
function _toInternal(cond, fields = []) {
   if (!cond) return;
   if (cond.key) {
      // Convert to format
      // {
      //    glue: "and",
      //    rules: [
      //       {
      //          field: "test_col",
      //          condition: { type: "greater", filter: 100 },
      //       },
      //    ],
      // }
      let field = fields.filter((f) => f.id == cond.key)[0];
      cond.field = field?.columnName;
      cond.includes = (cond.value || []).split(",");
      cond.condition = {
         type: cond.rule,
         filter: cond.value,
      };

      delete cond.key;
      delete cond.rule;
      delete cond.value;
   }

   if (cond.rules && cond.rules.length) {
      (cond.rules || []).forEach((r) => {
         _toInternal(r, fields);
      });
   }
}

/**
 * @function _toExternal()
 * translate our internal QB conditions into our external format that
 * where the cond.rule no longer has the field.id.
 * @param {obj} cond - {
 *                         glue: "and",
 *                         rules: [
 *                            {
 *                               field: "test_col",
 *                               condition: { type: "greater", filter: 100 },
 *                            },
 *                         ],
 *                      }
 *        the QB condition format we use internally
 */
function _toExternal(cond, fields = []) {
   if (!cond) return;
   if (cond.field) {
      let field = fields.filter((f) => f.columnName == cond.field)[0];
      cond.key = field?.id;
      cond.condition = cond.condition || {};
      cond.rule = cond.condition.type;

      // Convert multi-values to a string
      let values = cond.includes || [];
      if (cond.condition.filter && values.indexOf(cond.condition.filter) < 0)
         values.push(cond.condition.filter);

      cond.value = values.join(",");

      delete cond.field;
      delete cond.type;
      delete cond.includes;
      delete cond.condition;
   }

   if (cond.rules && cond.rules.length) {
      (cond.rules || []).forEach((r) => {
         _toExternal(r, fields);
      });
   }
}

module.exports = class FilterComplex extends FilterComplexCore {
   constructor(App, idBase, AB) {
      idBase = idBase || "ab_row_filter";

      super(App, idBase, AB);

      let labels = (this.labels = {
         common: (App || {}).labels,
         component: {
            and: L("And"),
            or: L("Or"),

            thisObject: L("This Object"),
            inQuery: L("In Query"),
            notInQuery: L("Not In Query"),
            inQueryField: L("By Query Field"),
            notInQueryField: L("Not By Query Field"),

            inQueryFieldQueryPlaceholder: L("Choose a Query"),
            inQueryFieldFieldPlaceholder: L("Choose a Field"),

            sameAsUser: L("Same As User"),
            notSameAsUser: L("Not Same As User"),

            sameAsField: L("Same As Field"),
            notSameAsField: L("Not Field"),

            inDataCollection: L("In Data Collection"),
            notInDataCollection: L("Not In Data Collection"),

            containsCondition: L("contains"),
            notContainsCondition: L("doesn't contain"),
            isCondition: L("is"),
            isNotCondition: L("is not"),

            beforeCondition: L("is before"),
            afterCondition: L("is after"),
            onOrBeforeCondition: L("is on or before"),
            onOrAfterCondition: L("is on or after"),
            beforeCurrentCondition: L("is before current date"),
            afterCurrentCondition: L("is after current date"),
            onOrBeforeCurrentCondition: L("is on or before current date"),
            onOrAfterCurrentCondition: L("is on or after current date"),
            onLastDaysCondition: L("last ... days"),
            onNextDaysCondition: L("next ... days"),

            equalCondition: L(":"),
            notEqualCondition: L("≠"),
            lessThanCondition: L("<"),
            moreThanCondition: L(">"),
            lessThanOrEqualCondition: L("≤"),
            moreThanOrEqualCondition: L("≥"),

            equalListCondition: L("equals"),
            notEqualListCondition: L("does not equal"),

            checkedCondition: L("is checked"),
            notCheckedCondition: L("is not checked"),

            isCurrentUserCondition: L("is current user"),
            isNotCurrentUserCondition: L("is not current user"),
            containsCurrentUserCondition: L("contains current user"),
            notContainsCurrentUserCondition: L("does not contain current user"),
         },
      });

      // internal list of Webix IDs to reference our UI components.
      let ids = (this.ids = {
         popup: this.unique(`${idBase}_popup`),
         querybuilder: this.unique(`${idBase}_querybuilder`),
         save: this.unique(`${idBase}_save`),
      });

      // Set current username
      this.Account.username = this.AB.Account.username();

      // Default options list to push to all fields
      // this.queryFieldOptions = [
      //    {
      //       value: this.labels.component.inQueryField,
      //       id: "in_query_field"
      //    },
      //    {
      //       value: this.labels.component.notInQueryField,
      //       id: "not_in_query_field"
      //    }
      // ];

      this.recordRuleOptions = [];
      this.recordRuleFieldOptions = [];

      this.uiQueryCustomValue();

      // webix UI definition:
      this.ui = {
         rows: [
            {
               view: "layout",
               type: "clean",
               borderless: true,
               rows: [
                  {
                     view: "query",
                     id: ids.querybuilder,
                     data: () => [],
                     // data: async (field) => await this.pullOptions(field),
                     fields: [
                        {
                           id: "first_name",
                           value: "First Name",
                           type: "text",
                           conditions: [
                              {
                                 id: "equals",
                                 value: "Equals",
                                 batch: "string",
                                 handler: () => true,
                              },
                           ],
                        },
                     ],
                  },
               ],
            },
            {
               id: ids.save,
               view: "button",
               css: "webix_primary",
               value: L("Save"),
               click: () => {
                  if (this.myPopup) this.myPopup.hide();
                  this.emit("save", this.getValue());
               },
            },
         ],
      };
   }

   // setting up UI
   init(options) {
      super.init(options);

      const el = $$(this.ids.querybuilder);
      if (el) {
         el.getState().$observe("value", (v) => {
            this.emit("changed", this.getValue());
         });
      }

      // if (options.isRecordRule) {
      //    this.recordRuleOptions = [
      //       {
      //          value: this.labels.component.sameAsField,
      //          id: "same_as_field"
      //       },
      //       {
      //          value: this.labels.component.notSameAsField,
      //          id: "not_same_as_field"
      //       }
      //    ];
      //    this.recordRuleFieldOptions = options.fieldOptions;
      // }
   }

   /**
    * @method isValid
    * validate the row data is valid filter condition
    *
    * @param rowData {Object} - data row
    */
   isValid(rowData) {
      let helper = () => true;

      let $query = $$(this.ids.querybuilder);
      if ($query) helper = $query.getFilterFunction();

      return helper(rowData);
   }

   setValue(settings) {
      super.setValue(settings);
      if (!settings) return;

      const el = $$(this.ids.querybuilder);
      if (el) {
         let qbSettings = this.AB.cloneDeep(settings);

         // Settings should match a condition built upon our QB format:
         // {
         //    glue:"and",
         //    rules:[
         //       {
         //          key:"uuid",
         //          rule:"",
         //          value:""
         //       }
         //    ]
         // }
         // externally our key should be the field.id and the rules should be
         // the "contains", "not_contains", "equal" ... keywords.
         // However, internally, we convert these rules into .ids that are
         // unique for each field (see uiInit()).  So when we bring in settings
         // we need to translate them into our internal format:

         _toInternal(qbSettings, this._Fields);

         el.define("value", qbSettings);
      }
   }

   getValue() {
      if ($$(this.ids.querybuilder)) {
         let settings = this.AB.cloneDeep(
            $$(this.ids.querybuilder).getState().value || {}
         );

         // what we pull out of the QB will have .rules in our internal format:
         // {field.id}_{rule}  (see uiInit() )
         // But we need to store them in our generic QB format for use outside
         // our FilterComplex widget.
         _toExternal(settings, this._Fields);
         this.condition = settings;
      }

      return super.getValue();
   }

   fieldsLoad(fields = [], object = null) {
      super.fieldsLoad(fields, object);
      this.uiInit();
   }

   toShortHand() {
      return "Add Filters";
   }

   uiInit() {
      let el = $$(this.ids.querybuilder);
      if (el) {
         // Clear fields
         while (el.config.fields.length > 0) {
            el.config.fields.pop();
         }
         // Set fields
         (this.fieldsToQB() || []).forEach((f) => {
            el.config.fields.push(f);
         });
      }
   }

   // HACK: have to overwrite Webix Query's function to support our custom input requirement.
   // HooWoo
   uiQueryCustomValue() {
      // Could not require on the top of the page. (Webix cound not found error). Yahoo
      const Query = require("../../js/webix/components/query/query.js");

      Query.views.filter.prototype.CreateFilter = (
         field,
         type,
         format,
         conditions,
         place
      ) => {
         let inputs = this.uiValue(field);

         let ui = {
            view: "filter",
            localId: "filter",
            conditions: conditions,
            field: field,
            mode: type,
            template: function (o) {
               let str = o[field];
               let parser =
                  format || (type == "date" ? webix.i18n.dateFormatStr : null);
               if (parser) str = parser(str);
               return str;
            },
            inputs: inputs,
            margin: 6,
         };

         let filter = webix.ui(ui, place);

         // let data = [];
         // const $query = $$(this.ids.querybuilder);
         // if ($query) {
         //    data = $query.app.getService("backend").data(field);
         // }
         // filter.parse(data);

         return filter;
      };
   }

   uiValue(fieldColumnName) {
      let result;

      let field = (this._Fields || []).filter(
         (f) => f.columnName == fieldColumnName
      )[0];

      switch (field?.key) {
         case "boolean":
            result = []
               .concat(this.uiBooleanValue(field))
               .concat(this.uiQueryFieldValue(field));
            break;
         case "connectObject":
            result = []
               .concat(this.uiQueryValue(field))
               .concat(this.uiUserValue(field))
               .concat(this.uiDataCollectionValue(field));
            break;
         case "list":
            result = []
               .concat(this.uiListValue(field))
               .concat(this.uiQueryFieldValue(field));
            break;
         case "user":
            result = []
               .concat(this.uiUserValue(field))
               .concat(this.uiQueryFieldValue(field));
            break;
      }

      return result;
   }

   uiBooleanValue(field) {
      return [
         {
            batch: "boolean",
            view: "checkbox",
         },
      ];
   }

   uiQueryValue(field) {
      let options = [];

      let isQueryField =
         this._QueryFields?.filter((f) => f.id == field.id).length > 0;

      // populate the list of Queries for this_object:
      if (field.id == "this_object" && this._Object) {
         options = this._Queries?.filter((q) =>
            q.canFilterObject(this._Object)
         );
      }
      // populate the list of Queries for a query field
      else if (isQueryField) {
         options = this._Queries?.filter(
            (q) =>
               (this._Object ? this._Object.id : "") != q.id && // Prevent filter looping
               q.canFilterObject(field.datasourceLink)
         );
      }

      options?.forEach((q) => {
         options.push({
            id: q.id,
            value: q.label,
         });
      });

      return [
         {
            batch: "query",
            view: "combo",
            options: options ?? [],
         },
      ];
   }

   uiListValue(field) {
      return [
         {
            batch: "list",
            view: "combo",
            options: field?.settings?.options?.map(function (x) {
               return {
                  id: x.id,
                  value: x.text,
               };
            }),
         },
      ];
   }

   uiUserValue(field) {
      return [
         {
            batch: "user",
            view: "combo",
            options: this.AB.Account.userList().map((u) => {
               return {
                  id: u.username,
                  value: u.username,
               };
            }),
         },
      ];
   }

   uiDataCollectionValue(field) {
      let linkObjectId;
      if (field.id == "this_object" && this._Object) {
         linkObjectId = this._Object.id;
      } else {
         linkObjectId = field?.settings?.linkObject;
      }

      return [
         {
            batch: "datacollection",
            view: "combo",
            options:
               this._Application && linkObjectId
                  ? this._Application
                       .datacollections(
                          (dc) => dc?.datasource?.id == linkObjectId
                       )
                       .map((dc) => {
                          return {
                             id: dc.id,
                             value: dc.label,
                          };
                       })
                  : [],
         },
      ];
   }

   uiQueryFieldValue(field) {
      return [
         {
            batch: "queryField",
            view: "combo",
            options: this.queries(
               (q) => this._Object == null || q.id != this._Object.id
            ).map((q) => {
               return {
                  id: q.id,
                  value: q.label,
               };
            }),
         },
      ];
   }

   // uiCustomValue($selector) {
   //    if (
   //       !$selector ||
   //       !$selector.config ||
   //       !$selector.config.value ||
   //       !$selector.config.value.key
   //    )
   //       return;

   //    let columnName = $selector.config.value.key;
   //    let rule = $selector.config.value.rule;
   //    // let value = $selector.config.value.value;

   //    let $valueElem = $selector.queryView({ customEdit: true });
   //    if (!$valueElem) return;

   //    let field = this._Fields.filter((f) => f.columnName == columnName)[0];
   //    if (!field) return;

   //    if (rule == "in_query" || rule == "not_in_query") {
   //       this.uiInQueryValue($valueElem, field);
   //    } else if (
   //       rule == "in_data_collection" ||
   //       rule == "not_in_data_collection"
   //    ) {
   //       this.uiInDataCollectionValue($valueElem, field);
   //    } else if (field.key == "list") {
   //       this.uiListValue($valueElem, field);
   //    }
   // }

   // uiInQueryValue($value, field) {
   //    let options = [];
   //    let Queries = [];

   //    // populate the list of Queries for this_object:
   //    if (field.id == "this_object" && this._Object) {
   //       Queries = this.queries((q) => q.canFilterObject(this._Object));
   //    }
   //    // populate the list of Queries for a query field
   //    else {
   //       Queries = this.queries((q) => {
   //          return (
   //             (this._Object ? this._Object.id : "") != q.id && // Prevent filter looping
   //             q.canFilterObject(field.datasourceLink)
   //          );
   //       });
   //    }

   //    Queries.forEach((q) => {
   //       options.push({
   //          id: q.id,
   //          value: q.label,
   //       });
   //    });

   //    $value.define("options", options);
   //    $value.refresh();
   // }

   // uiInDataCollectionValue($value, field) {
   //    let options = [];

   //    // get id of the link object
   //    let linkObjectId;
   //    if (field.id == "this_object" && this._Object) {
   //       linkObjectId = this._Object.id;
   //    } else {
   //       linkObjectId = field.settings.linkObject;
   //    }

   //    // pull data collection list
   //    if (this._Application && linkObjectId) {
   //       options = this._Application
   //          .datacollections(
   //             (dc) => dc.datasource && dc.datasource.id == linkObjectId
   //          )
   //          .map((dc) => {
   //             return { id: dc.id, value: dc.label };
   //          });
   //    }

   //    $value.define("options", options);
   //    $value.refresh();
   // }

   // uiListValue($value, field) {
   //    let options = field.settings.options.map(function (opt) {
   //       return {
   //          id: opt.id,
   //          value: opt.text,
   //          hex: opt.hex,
   //       };
   //    });

   //    $value.define("options", options);
   //    $value.refresh();
   // }

   popUp(...options) {
      if (!this.myPopup) {
         let ui = {
            id: this.ids.popup,
            view: "popup",
            height: 400,
            width: 800,
            body: this.ui,
         };

         this.myPopup = webix.ui(ui);
         this.init();
      }

      if (this._Application) {
         this.applicationLoad(this._Application);
      }
      if (this._Fields) {
         this.fieldsLoad(this._Fields);
      }

      // NOTE: do this, before the .setValue() operation, as we need to have
      // our fields and filters defined BEFORE a setValue() is performed.
      this.uiInit();

      if (this.condition) {
         this.setValue(this.condition);
      }

      this.myPopup.show(...options);
   }
};
