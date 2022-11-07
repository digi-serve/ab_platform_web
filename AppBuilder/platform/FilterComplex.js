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
      const field = fields.filter((f) => f.id == cond.key)[0];
      cond.field = field?.columnName ?? field?.id;

      cond.condition = {
         type: cond.rule,
         filter: cond.value,
      };

      if (Array.isArray(cond.value)) cond.includes = cond.value;
      else cond.includes = (cond.value ?? "").split(",");

      if (field.key == "date" || field.key == "datetime") {
         cond.condition.filter = cond.condition.filter
            ? AB.toDate(cond.condition.filter)
            : null;

         cond.includes = cond.includes.map((v) => AB.toDate(v));
      }

      delete cond.key;
      delete cond.rule;
      delete cond.value;
   }

   if (cond.rules && cond.rules.length) {
      (cond.rules ?? []).forEach((r) => {
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
      // cond.alias = alias || undefined;
      cond.key = field?.id ?? cond.field;
      cond.condition = cond.condition ?? {};
      cond.rule = cond.condition.type;

      // Convert multi-values to a string
      let values = cond.includes ?? [];
      if (cond.condition.filter && values.indexOf(cond.condition.filter) < 0)
         values.push(cond.condition.filter);

      cond.value = values
         .map((v) => {
            // Convert date format
            if (field && (field.key == "date" || field.key == "datetime")) {
               return field.exportValue(v);
            } else if (v instanceof Date) {
               return v.toISOString();
            } else {
               return v;
            }
         })
         .join(",");

      delete cond.field;
      delete cond.type;
      delete cond.includes;
      delete cond.condition;
   }

   if (cond.rules && cond.rules.length) {
      (cond.rules ?? []).forEach((r) => {
         _toExternal(r, fields);
      });
   }
}

module.exports = class FilterComplex extends FilterComplexCore {
   constructor(idBase, AB) {
      idBase = idBase ?? "ab_row_filter";

      super(idBase, AB);

      let labels = (this.labels = {
         common: (AB._App ?? {}).labels,
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
            isEmpty: L("is empty"),
            isNotEmpty: L("is not empty"),

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

            ContextDefaultOption: L("choose option"),
            EqualsProcessValue: L("equals process value"),
            NotEqualsProcessValueCondition: L("not equals process value"),
            InProcessValueCondition: L("in process value"),
            notInProcessValueCondition: L("not in process value"),
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

      this._recordRuleFieldOptions = [];

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
                     fields: [],
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
            if (this.__blockOnChange) return false;

            this.emit("changed", this.getValue());
         });
      }

      this._isRecordRule = options?.isRecordRule ?? false;
      this._recordRuleFieldOptions = options?.fieldOptions ?? [];
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
      if ($query) {
         helper = $query.getFilterFunction();
         return helper(rowData);
      } else {
         return super.isValid(rowData);
      }
   }

   /**
    * @method isConditionComplete()
    * Check a given condition entry and indicate if it is fully
    * filled out.
    * @param {obj} cond
    *        The Condition object we are checking.  If a Macro
    *        condition if provided: { glue:"and", rules:[] } then
    *        this method will return True/False if All rules are
    *        complete.
    *        If an individual rule is provided, then it evaluates
    *        the completness of that rule. { key, rule, value }
    * @return {bool}
    */
   isConditionComplete(cond) {
      if (!cond) return false;

      let isComplete = true;
      // start optimistically.

      if (cond.glue) {
         (cond.rules ?? []).forEach((r) => {
            isComplete = isComplete && this.isConditionComplete(r);
         });
      } else {
         // every condition needs a .key & .rule
         if (!cond.key || cond.key == "") {
            isComplete = false;
         }

         if (!cond.rule || cond.rule == "") {
            isComplete = false;
         }

         if (isComplete) {
            switch (cond.rule) {
               case "is_current_user":
               case "is_not_current_user":
               case "contain_current_user":
               case "not_contain_current_user":
               case "same_as_user":
               case "not_same_as_user":
               case "less_current":
               case "greater_current":
               case "less_or_equal_current":
               case "greater_or_equal_current":
               case "is_empty":
               case "is_not_empty":
                  // There are only a few rules that don't need a
                  // value
                  break;

               default:
                  // The rest do need a .value
                  if (!cond.value || cond.value == "") {
                     isComplete = false;
                  }
                  break;
            }
         }
      }

      return isComplete;
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

         this.__blockOnChange = true;
         el.define("value", qbSettings);
         this.__blockOnChange = false;
      }
   }

   getValue() {
      if ($$(this.ids.querybuilder)) {
         let settings = this.AB.cloneDeep(
            $$(this.ids.querybuilder).getState().value ?? {}
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
      this.uiQueryCustomValue();

      let el = $$(this.ids.querybuilder);
      if (el) {
         // Clear fields
         while (el.config.fields.length > 0) {
            el.config.fields.pop();
         }
         // Set fields
         (this.fieldsToQB() ?? []).forEach((f) => {
            el.config.fields.push(f);
         });
      }
   }

   // HACK: have to overwrite Webix Query's function to support our custom input requirement.
   // HooWoo
   uiQueryCustomValue() {
      const $el = $$(this.ids.querybuilder);
      if (!$el) return;

      // window.query.views.filter.prototype.CreateFilter = (
      $el.$app.require("jet-views", "filter").prototype.CreateFilter = (
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
                  format ?? (type == "date" ? webix.i18n.dateFormatStr : null);
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

      // Special case: this_object
      if (fieldColumnName == "this_object") {
         return []
            .concat(this.uiQueryValue("this_object"))
            .concat(this.uiDataCollectionValue("this_object"))
            .concat(this.uiCustomValue("this_object"))
            .concat(this.uiContextValue("this_object", "uuid"));
      }

      let field = (this._Fields ?? []).filter(
         (f) => f.columnName == fieldColumnName
      )[0];

      switch (field?.key) {
         case "boolean":
            result = this.uiBooleanValue(field);
            break;
         case "connectObject":
            result = []
               .concat(this.uiQueryValue(field))
               .concat(this.uiUserValue(field))
               .concat(this.uiDataCollectionValue(field))
               .concat(this.uiContextValue(field))
               .concat(this.uiNoneValue());
            break;
         case "date":
         case "datetime":
            result = ["datepicker", "daterangepicker"];
            break;
         case "list":
            result = this.uiListValue(field);
            break;
         case "user":
            result = []
               .concat(this.uiNoneValue())
               .concat(this.uiUserValue(field));
            break;
         // case "number":
         //    result = ["text"];
         //    break;
         case "string":
         case "LongText":
         case "email":
            result = this.uiNoneValue();
            break;
      }

      // Add filter options to Custom index
      if (
         field?.settings?.isCustomFK &&
         // 1:M
         ((field?.settings?.linkType === "one" &&
            field?.settings?.linkViaType === "many") ||
            // 1:1 isSource = true
            (field?.settings?.linkType === "one" &&
               field?.settings?.linkViaType === "one" &&
               field?.settings?.isSource))
      ) {
         result = (result ?? []).concat(this.uiTextValue(field));
      } else if (field?.key != "connectObject") {
         result = (result ?? [])
            .concat(this.uiTextValue(field))
            .concat(this.uiQueryFieldValue(field))
            .concat(this.uiContextValue(field));
      }
      // Special case: from Process builder
      // .processFieldsLoad()
      else if (fieldColumnName.indexOf("uuid") > -1) {
         result = this.uiContextValue(null, fieldColumnName);
      }

      if (this._isRecordRule) {
         result = (result ?? []).concat(this.uiRecordRuleValue(field));
      }

      result = (result ?? []).concat(this.uiCustomValue(field));

      return result;
   }

   uiNoneValue() {
      return [
         {
            batch: "none",
            borderless: true,
            view: "template",
            template: "",
         },
      ];
   }

   uiBooleanValue(field) {
      return [
         {
            batch: "boolean",
            view: "checkbox",
         },
      ];
   }

   uiTextValue(field) {
      return [
         {
            batch: "text",
            view: "text",
            on: {
               onAfterRender: function () {
                  // HACK: focus on webix.text and webix.textarea
                  // Why!! If the parent layout has zIndex lower than 101, then is not able to focus to webix.text and webix.textarea
                  let $layout =
                     this.queryView(function (a) {
                        return !a.getParentView();
                     }, "parent") ?? this;
                  $layout.$view.style.zIndex = 102;
               },
            },
         },
      ];
   }

   uiQueryValue(field) {
      let options = [];

      let isQueryField =
         this._QueryFields?.filter((f) => f.id == field.id).length > 0;

      // populate the list of Queries for this_object:
      if (field == "this_object" && this._Object) {
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
      if (field == "this_object" && this._Object) {
         linkObjectId = this._Object.id;
      } else {
         linkObjectId = field?.settings?.linkObject;
      }

      return [
         {
            batch: "datacollection",
            view: "combo",
            options: linkObjectId
               ? this.AB.datacollections(
                    (dc) => dc?.datasource?.id == linkObjectId
                 ).map((dc) => {
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
            placeholder: this.labels.component.inQueryFieldQueryPlaceholder,
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

   uiRecordRuleValue(field) {
      return [
         {
            batch: "recordRule",
            view: "select",
            options: this._recordRuleFieldOptions ?? [],
         },
      ];
   }

   uiContextValue(field, processFieldKey = null) {
      let processField = (this._ProcessFields ?? []).filter((pField) => {
         if (!pField) return false;

         if (pField.field) {
            return pField.field.id == field.id;
         } else if (pField.key) {
            // uuid
            let processFieldId = pField.key.split(".").pop();
            return (
               processFieldId == field.id ||
               processFieldId == field.key ||
               processFieldId == processFieldKey ||
               pField.key == processFieldKey
            );
         }
      })[0];

      if (!processField) return [];

      return [
         {
            batch: "context",
            view: "select",
            options: [
               {
                  id: "empty",
                  value: this.labels.component.ContextDefaultOption,
               },
               {
                  id: processField.key,
                  value: L("context({0})", [processField.label]),
               },
            ],
         },
      ];
   }

   uiCustomValue(field) {
      let customOptions = this._customOptions ?? {};
      let options = customOptions[field.id ?? field] ?? {};
      return options.values ?? [];
   }

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

      if (this._Fields) {
         this.fieldsLoad(this._Fields, this._Object);
      }

      // NOTE: do this, before the .setValue() operation, as we need to have
      // our fields and filters defined BEFORE a setValue() is performed.
      // this.uiInit();

      if (this.condition) {
         this.setValue(this.condition);
      }

      this.myPopup.show(...options);
   }

   /**
    * @method addCustomOption
    *
    * @param {string|uuid} fieldId
    * @param {Object} options - {
    *                               conditions: [],
    *                               values: []
    *                           }
    */
   addCustomOption(fieldId, options = {}) {
      this._customOptions = this._customOptions ?? {};
      this._customOptions[fieldId] = options;
   }
};
