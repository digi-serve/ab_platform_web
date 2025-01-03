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
      cond.field = field?.id;

      cond.condition = {
         type: cond.rule,
         filter: cond.value,
      };

      if (Array.isArray(cond.value)) cond.includes = cond.value;
      else cond.includes = cond.value?.split?.(/,|:/) ?? [];

      if (field?.key == "date" || field?.key == "datetime") {
         cond.condition.filter = cond.condition.filter
            ? AB.rules.toDate(cond.condition.filter)
            : null;

         cond.includes = cond.includes.map((v) => AB.rules.toDate(v));
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
      let field = fields.filter((f) => f.id == cond.field)[0];
      // cond.alias = alias || undefined;
      cond.key = field?.id ?? cond.field;
      cond.condition = cond.condition ?? {};
      cond.rule = cond.condition.type;

      let values =
         cond.includes.map((v) => (v instanceof Date ? v.toISOString() : v)) ??
         [];

      // Convert multi-values to a string
      if (cond.condition.filter) {
         if (cond.condition.filter instanceof Date) {
            if (values.indexOf(cond.condition.filter.toISOString()) < 0) {
               values.push(cond.condition.filter);
            }
         } else if (values.indexOf(cond.condition.filter) < 0)
            values.push(cond.condition.filter);
      }

      if (cond.rule === "is_current_date") {
         cond.value = AB.rules.getUTCDayTimeRange();
      } else if (
         cond.rule === "in_query_field" ||
         cond.rule === "not_in_query_field"
      ) {
         cond.value =
            cond.includes?.length == 2 ? cond.includes.join(":") : null;
      } else {
         cond.value = values
            .map((v) => {
               // Convert date format
               if (field && (field.key === "date" || field.key === "datetime"))
                  return field.exportValue(new Date(v));
               return v;
            })
            .join(",");
      }

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

function _uiQueryOptionId(fieldId) {
   return `byQueryField-query-option-${fieldId}`;
}

function _uiFieldOptionId(fieldId) {
   return `byQueryField-field-option-${fieldId}`;
}

module.exports = class FilterComplex extends FilterComplexCore {
   constructor(idBase, AB, options = {}) {
      idBase = idBase ?? "ab_filterComplex";

      super(idBase, AB);

      this._options = options ?? {};

      this._initComplete = false;
      // {bool}
      // trying to prevent multiple .init() from being called due to
      // various ways of initializing the component.

      this.observing = false;
      // {bool}
      // try to prevent multiple observers generating >1 "changed"
      // event.

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
            isCurrentDateCondition: L("is current date"),
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
            notCheckedCondition: L("is unchecked"),

            isCurrentUserCondition: L("is current user"),
            isNotCurrentUserCondition: L("is not current user"),
            containsCurrentUserCondition: L("contains current user"),
            notContainsCurrentUserCondition: L("does not contain current user"),

            contextDefaultOption: L("choose option"),
            equalsProcessValue: L("equals process value"),
            notEqualsProcessValueCondition: L("not equals process value"),
            inProcessValueCondition: L("in process value"),
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

      this._settings.recordRuleFieldOptions = [];

      // webix UI definition:
      this.ui = {
         rows: [
            {
               view: "layout",
               type: "clean",
               borderless: this._options.borderless ?? true,
               rows: [
                  {
                     id: ids.querybuilder,
                     view: "query",
                     data: () => [],
                     // data: async (field) => await this.pullOptions(field),
                     fields: [],
                     disabled: true,
                     height: this._options.height,
                  },
               ],
            },
            {
               id: ids.save,
               view: "button",
               css: "webix_primary",
               value: L("Save"),
               hidden: this._options.isSaveHidden ?? false,
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
      if (this._initComplete) return;

      super.init(options);

      const el = $$(this.ids.querybuilder);

      if (el) {
         if (!this.observing) {
            this.__blockOnChange = true;
            el.getState().$observe("value", (v) => {
               if (this.__blockOnChange) return false;

               this.emit("changed", this.getValue());
            });
            this.__blockOnChange = false;

            // HACK!! The process of setting the $observe() is actually
            // calling the cb() when set.  This is clearing our .condition
            // if we call init() after we have setValues(). which can happen
            // when using the popUp() method.
            let _cond = this.condition;
            this.condition = _cond;
            this.observing = true;
         }
         this._initComplete = true;
      }
   }

   /**
    * @method isValid
    * validate the row data is valid filter condition
    *
    * @param rowData {Object} - data row
    * @param condition {Object} - [Optional] {
    *                                           glue: "and" | "or",
    *                                           rules: []
    *                                        }
    */
   isValid(rowData, condition = this.condition) {
      let helper = () => true;

      let $query = $$(this.ids.querybuilder);
      if ($query) {
         helper = $query.getFilterFunction();
         return helper(rowData);
      } else {
         return super.isValid(rowData, condition);
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

      if (cond?.glue) {
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
               case "checked":
               case "unchecked":
               case "is_current_date":
                  // There are only a few rules that don't need a
                  // value
                  break;

               case "in_data_collection":
               case "not_in_data_collection":
                  // a value needs to exist
                  if (!cond.value || cond.value == "") {
                     isComplete = false;
                  }
                  // and it needs to reference a valid DC
                  if (isComplete) {
                     let dc = this.AB.datacollectionByID(cond.value);
                     if (!dc) {
                        isComplete = false;
                     }
                  }
                  break;

               case "in_query":
               case "not_in_query":
                  // a value needs to exist
                  if (!cond.value || cond.value == "") {
                     isComplete = false;
                  }
                  // and it needs to reference a valid query
                  if (isComplete) {
                     let query = this.AB.queryByID(cond.value);
                     if (!query) {
                        isComplete = false;
                     }
                  }
                  break;

               case "in_query_field":
               case "not_in_query_field":
                  // a value needs to exist
                  if (!cond.value || cond.value == "") {
                     isComplete = false;
                  }
                  // and it needs to reference a valid query
                  if (isComplete) {
                     let queryId = cond.value.split(":")[0],
                        fieldId = cond.value.split(":")[1];
                     let query = this.AB.queryByID(queryId);
                     if (!query) {
                        isComplete = false;
                     } else {
                        // and a valid field
                        let field = query.fieldByID(fieldId);
                        if (!field) {
                           isComplete = false;
                        }
                     }
                  }
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
      this.condition = settings;

      const el = $$(this.ids.querybuilder);
      if (el) {
         if (!settings) {
            // Clear settings value of webix.query
            el.define("value", {
               glue: "and",
               rules: [],
            });
            return;
         }

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
         if (el.config.fields.length) {
            el.enable();
         } else {
            this.setValue("");
            el.disable();
         }
      }
   }

   // HACK: have to overwrite Webix Query's function to support our custom input requirement.
   // HooWoo
   uiQueryCustomValue() {
      const $el = $$(this.ids.querybuilder);
      if (!$el) return;

      const _this = this;
      const $filterView = $el.$app.require("jet-views", "filter");

      if (!this._fnBaseGetValue)
         this._fnBaseGetValue = $filterView.prototype.GetValue;
      $filterView.prototype.GetValue = function () {
         const rule = _this._fnBaseGetValue.call(this);
         if (!rule) {
            // Not sure if its a problem, so report in case it is.
            _this.AB.notify.developer(new Error("No rule found"), {
               context: "No rule from $filterView.GetValue()",
            });
            return;
         }

         if (
            rule.condition.type == "in_query_field" ||
            rule.condition.type == "not_in_query_field"
         ) {
            const queryOptId = _uiQueryOptionId(rule.field);
            const fieldOptId = _uiFieldOptionId(rule.field);
            const selectedQueryId = $$(queryOptId)?.getValue();
            const selectedFieldId = $$(fieldOptId)?.getValue();

            if (selectedQueryId && selectedFieldId) {
               rule.includes = [selectedQueryId, selectedFieldId];
            }
         }

         return rule;
      };

      // window.query.views.filter.prototype.CreateFilter = (
      $filterView.prototype.CreateFilter = async function (
         fieldId,
         type,
         format,
         conditions,
         place
      ) {
         let inputs = _this.uiValue(fieldId);

         let ui = {
            id: place.config.id,
            view: "filter",
            localId: "filter",
            conditions: conditions,
            field: fieldId,
            mode: type,
            template: function (o) {
               let str = o[fieldId];
               let parser =
                  format ?? (type == "date" ? webix.i18n.dateFormatStr : null);
               if (parser) str = parser(str);
               return str;
            },
            inputs: inputs,
            margin: 6,
         };

         let filter = webix.ui(ui, place);

         // NOTE: Need this to have filter.config.value?.includes value
         // let data = [];
         if ($el) {
            await $el.$app.getService("backend").data(fieldId);
            // data = await $query.getService("backend").data(fieldId);
         }
         // filter.parse(data);

         // Populate options of "in_query_field" and "not_in_query_field"
         if (
            conditions.filter(
               (cond) =>
                  cond.id == "in_query_field" || cond.id == "not_in_query_field"
            ).length &&
            filter.config.value?.includes?.length == 2
         ) {
            // inputs = _this.uiValue(fieldId, filter.config.value.includes);
            // filter.define("inputs", inputs);
            const queryOptId = _uiQueryOptionId(fieldId);
            const fieldOptId = _uiFieldOptionId(fieldId);
            const $queryOpt = $$(queryOptId);
            const $fieldOpt = $$(fieldOptId);
            const vals = filter.config.value?.includes ?? [];
            if (vals?.length > 1 && $queryOpt && $fieldOpt) {
               $queryOpt.setValue(vals[0]);
               $fieldOpt.setValue(vals[1]);
               $queryOpt.refresh();
               $fieldOpt.refresh();
            }
         }

         return filter;
      };
   }

   uiValue(fieldColumnName, defaultValue = null) {
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
         (f) => f.id == fieldColumnName
      )[0];

      switch (field?.key) {
         case "boolean":
            result = this.uiNoneValue(field);
            break;
         case "connectObject":
            result = []
               .concat(this.uiQueryValue(field))
               .concat(this.uiUserValue(field))
               .concat(this.uiDataCollectionValue(field))
               .concat(this.uiContextValue(field))
               .concat(this.uiNoneValue())
               .concat(this.uiQueryFieldValue(field, defaultValue));
            break;
         case "date":
         case "datetime":
            result = ["datepicker", "daterangepicker"]
               .concat(this.uiNoneValue())
               .concat(this.uiContextValue(field));
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
      const LinkType = `${field?.settings?.linkType}:${field?.settings?.linkViaType}`;
      if (
         field?.settings?.isCustomFK &&
         // 1:M
         (LinkType == "one:many" ||
            // 1:1 isSource = true
            (LinkType == "one:one" && field?.settings?.isSource))
      ) {
         result = (result ?? []).concat(this.uiTextValue(field));
      } else if (field?.key != "connectObject") {
         result = (result ?? [])
            .concat(this.uiTextValue(field))
            .concat(this.uiQueryFieldValue(field, defaultValue))
            .concat(this.uiContextValue(field));
      }
      // Special case: from Process builder
      // .processFieldsLoad()
      else if (fieldColumnName.indexOf("uuid") > -1) {
         result = this.uiContextValue(null, fieldColumnName);
      }

      if (this._settings.isRecordRule) {
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
                  // Why!! If the parent layout has zIndex lower than 101,
                  // then is not able to focus to webix.text and webix.textarea
                  let $layout =
                     this.queryView(function (a) {
                        return !a.getParentView();
                     }, "parent") ?? this;
                  $layout.$view.style.zIndex = 202;
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
         options = this.queries((q) => q.canFilterObject(this._Object));
      }
      // populate the list of Queries for a query field
      else if (isQueryField) {
         options = this.queries(
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

   uiQueryFieldValue(field, defaultValue) {
      // ABQuery Options
      const qOpts = this.queries(
         (q) => this._Object == null || q.id != this._Object.id
      ).map((q) => {
         return {
            id: q.id,
            value: q.label,
         };
      });

      const pullFieldOption = (queryId) => {
         const options = [];

         // Get fields of the query
         const Query = this.AB.queryByID(queryId);
         if (Query) {
            Query.fields((f) => !f.isConnection).forEach((q) => {
               options.push({
                  id: q.id,
                  value: `${q.object.label}.${q.label}`,
               });
            });
         }

         return options;
      };

      const refreshFieldOption = ($queryOpt, queryId) => {
         const options = pullFieldOption(queryId);

         // Update UI
         if ($queryOpt) {
            const $queryContainer = $queryOpt.getParentView();
            const $fieldOption = $queryContainer.getChildViews()[1];
            $fieldOption?.define("options", options);
            $fieldOption?.refresh();
         }
      };

      let queryId;
      let fieldId;
      let fieldOptions = [];
      if (defaultValue?.length == 2) {
         queryId = defaultValue[0];
         fieldId = defaultValue[1];

         fieldOptions = pullFieldOption(queryId);
      }

      return [
         {
            batch: "queryField",
            view: "form",
            borderless: true,
            padding: 0,
            elements: [
               {
                  id: _uiQueryOptionId(field?.id),
                  name: "query",
                  view: "combo",
                  placeholder:
                     this.labels.component.inQueryFieldQueryPlaceholder,
                  options: qOpts,
                  value: queryId,
                  on: {
                     onChange: function (qVal) {
                        refreshFieldOption(this, qVal);
                     },
                  },
               },
               {
                  id: _uiFieldOptionId(field?.id),
                  name: "field",
                  view: "combo",
                  placeholder: L("Choose a Field"),
                  options: fieldOptions,
                  value: fieldId,
               },
            ],
         },
      ];
   }

   uiRecordRuleValue(field) {
      return [
         {
            batch: "recordRule",
            view: "select",
            options: this._settings.recordRuleFieldOptions ?? [],
         },
      ];
   }

   uiContextValue(field, processFieldKey = null) {
      const processFields = (this._ProcessFields ?? [])
         .filter((pField) => {
            if (!pField) return false;

            let result = false;
            switch (field) {
               case "this_object":
                  result =
                     this._Object.id === pField.object?.id && !pField.field;

                  break;

               default:
                  switch (field.key) {
                     case "boolean":
                        result = ["boolean"].includes(pField.field?.key);

                        break;

                     case "connectObject":
                        result =
                           field.settings.linkObject ===
                           (pField.field?.object.id ?? pField.object.id);

                        if (!field.settings.isCustomFK) {
                           result = result && !pField.field;

                           break;
                        }

                        result =
                           result &&
                           (field.settings.indexField ||
                              field.settings.indexField2) === pField.field?.id;

                        break;

                     case "date":
                     case "datetime":
                        result = ["date", "datetime"].includes(
                           pField.field?.key
                        );

                        break;

                     case "calculate":
                     case "formula":
                     case "number":
                        result = ["calculate", "formula", "number"].includes(
                           pField.field?.key
                        );

                        break;

                     case "string":
                     case "LongText":
                     case "email":
                     case "AutoIndex":
                     case "list":
                        result = [
                           "string",
                           "LongText",
                           "email",
                           "AutoIndex",
                           "list",
                        ].includes(pField.field?.key);

                        break;

                     case "user":
                        result = ["user"].includes(pField.field?.key);

                        break;

                     default:
                        if (pField.key) {
                           // uuid
                           const processFieldId = pField.key.split(".").pop();

                           result =
                              processFieldId === field.id ||
                              processFieldId === field.key ||
                              processFieldId === processFieldKey ||
                              pField.key === processFieldKey;
                        }

                        break;
                  }

                  break;
            }

            return result;
         })
         .map((e) => {
            return {
               id: e.key,
               value: L("context({0})", [e.label]),
            };
         });

      if (!processFields) return [];

      return [
         {
            batch: "context",
            view: "select",
            options: [
               {
                  id: "empty",
                  value: this.labels.component.contextDefaultOption,
               },
               ...processFields,
            ],
         },
      ];
   }

   uiCustomValue(field) {
      if (!field) return [];

      const customOptions = this._customOptions ?? {};
      const options = customOptions[field.id ?? field] ?? {};
      return options.values ?? [];
   }

   popUp(...options) {
      const condition = Object.assign({}, this.condition);

      if (!this.myPopup) {
         let ui = {
            id: this.ids.popup,
            view: "popup",
            height: 400,
            width: 800,
            body: this.ui,
         };

         if (!$$(this.ids.popup)) {
            this.myPopup = webix.ui(ui);
            this.init(this._settings);
            if (this._Fields) {
               this.fieldsLoad(this._Fields, this._Object);
            }

            // NOTE: do this, before the .setValue() operation, as we need to have
            // our fields and filters defined BEFORE a setValue() is performed.
            // this.uiInit();

            if (condition) {
               this.setValue(condition);
            }

            this.myPopup.show(...options);
         } else {
            $$(this.ids.popup).show(...options);
         }
      } else {
         this.myPopup.show(...options);
      }
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
