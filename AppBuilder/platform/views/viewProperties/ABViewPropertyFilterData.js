/*
 * ABViewPropertyFilterData
 * This is a displayable ui component that will manage displaying a
 * means of searching for the user.
 *
 * This component will emit: "filter.data" when one of the filter options
 * have been enabled.
 *    "filter.data" has 2 parameters: fnFilter, filterRules
 *       fnFilter {function} when passed a row of data from the grid,
 *                return true/false if it passes the filter.
 *       filterRules {array} of each of the filter rules that have been
 *                created. Note: the fnFilter still checks the validity
 *                of the row based on these rules.
 *                (this is used for the parent component to indicate how
 *                many rules are currently applied to the data being displayed)
 */
const ABMLClass = require("../../ABMLClass");
import ABViewProperty from "./ABViewProperty";
import ABViewComponent from "../ABViewComponent";

// const ABViewGridFilterRule = require("../../../rules/ABViewGridFilterRule");

let L = (...params) => AB.Multilingual.label(...params);

class FilterRuleSettings extends ABMLClass {
   constructor() {
      super(["label"], AB);
   }

   fromSettings(settings) {
      super.fromValues(settings);
      this.filters = settings.filters;
   }

   toSettings() {
      let obj = super.toObj();
      obj.filters = this.filters;
      return obj;
   }
}

class ABViewPropertyFilterDataComponent extends ABViewComponent {
   constructor(viewPropertyFilterData, idBase) {
      var base = idBase || viewPropertyFilterData.idBase;
      super(base, {});
   }
}

export default class ABViewPropertyFilterData extends ABViewProperty {
   constructor(AB, idBase) {
      super(idBase, {
         buttonAddfilter: "",
         filterPanel: "",
         globalFilterFormContainer: "",
         globalFilterForm: "",
         filterMenutoolbar: "",
         resetFilterButton: "",
      });

      this.AB = AB;
      this.idBase = idBase;
      this.object = null;
      // this.queryRules = [];

      this.__externalSearchText = null;
      // {string}
      // External sources of text filters are stored here. This is most likely
      // from the global search toolbar entry.

      this.rowFilter = this.AB.filterComplexNew(`${this.ids.component}_filter`);
      // {RowFilter}
      // When .userFilterPosition == "toolbar" we use this RowFilter to
      // display a form in a popup where the toolbar button is.

      this.rowFilterForm = this.AB.filterComplexNew(
         `${this.ids.component}_filter_form`
      );
      // {RowFilter}
      // When .userFilterPosition == "form" we use this RowFilter to
      // display a form under the toolbar.

      this._handler_rowFilterChanged = (value) => {
         let filterRules = value.rules || [];

         // if ($$(ids.buttonFilter)) {
         //    $$(ids.buttonFilter).define('badge', filterRules.length || null);
         //    $$(ids.buttonFilter).refresh();
         // }

         // be notified when there is a change in the filter
         this.triggerCallback((rowData) => {
            return this.rowFilter.isValid(rowData);
         }, filterRules);
      };

      this._handler_rowFilterFormChanged = () => {
         this.triggerCallback();
      };

      this.initialized = false;
      // {bool}
      // make sure this is not .init() more than once
   }

   /**
    * @property default
    * return default settings
    *
    * @return {Object}
    */
   static get default() {
      return {
         filterOption: 1,
         // {integer}
         // 0 - Not allow
         // 1 - Enable user filter
         // 2 - Predefined filter menu
         // 3 - Global filter input

         // filterOptions == 1 options
         userFilterPosition: "toolbar",
         // {string} the location of the filter:
         //    "toolbar" : there will be an "Add Filters" button on
         //                the toolbar that will trigger the form popup
         //    "form"    : there will be a button under the toolbar that
         //                will bring up the form popup.

         isGlobalToolbar: 1,
         // {boolean|truthy}
         // when "toolbar" is chosen for userFilterPosition, this setting
         // allows us to also include the search criteria specified in
         // the search box on the toolbar.

         // filterOptions == 2 options
         // predefined filters created by the builders. There will be
         // an area under the toolbar that displays buttons to choose
         // between one of the predefined queryRules.
         // queryRules: [], // An array of ABViewGridFilterRule object

         // filterOptions == 3 options
         // globalFilterPosition: "default",
         // {string} [ "default", "single" ]
         //    "default" : shows default grid with all potential matches
         //    "single"  : grid only shows when it has a match.  only 1
         //                match is shown. ( is this true?? )
      };
   }

   /**
    * @method fromSettings
    * Create an initial set of default values based upon our settings object.
    * @param {obj} settings  The settings object we created in .toSettings()
    */
   fromSettings(settings) {
      settings = settings || {};

      settings.filterOption =
         typeof settings.filterOption != "undefined"
            ? settings.filterOption
            : ABViewPropertyFilterData.default.filterOption;

      settings.isGlobalToolbar =
         typeof settings.isGlobalToolbar != "undefined"
            ? settings.isGlobalToolbar
            : ABViewPropertyFilterData.default.isGlobalToolbar;

      this.settings = settings;
   }

   /**
    * @method objectLoad
    * A rule is based upon a Form that was working with an Object.
    * .objectLoad() is how we specify which object we are working with.
    *
    * @param {ABObject} The object that will be used to evaluate the Rules
    */
   objectLoad(object) {
      this.object = object;

      if (this.rowFilter) {
         // this.rowFilter.applicationLoad(object.application);
         this.rowFilter.fieldsLoad(object.fields());
      }

      if (this.rowFilterForm) {
         // this.rowFilterForm.applicationLoad(object.application);
         this.rowFilterForm.fieldsLoad(object.fields());
      }
   }

   viewLoad(view) {
      this.view = view;
   }

   /** == UI == */
   ui() {
      var self = this;
      var ids = this.ids;

      return {
         id: ids.filterPanel,
         type: "space",
         borderless: true,
         padding: 0,
         hidden: true,
         rows: [
            {
               id: ids.globalFilterFormContainer,
               hidden: true,
               cols: [
                  {
                     id: ids.globalFilterForm,
                     view: "text",
                     placeholder: L("Search or scan a barcode to see results"),
                     on: {
                        onTimedKeyPress: () => {
                           this.triggerCallback();
                        },
                     },
                  },
                  {
                     view: "button",
                     css: "webix_primary",
                     width: 28,
                     type: "icon",
                     icon: "fa fa-times",
                     click: function () {
                        var $form = $$(ids.globalFilterForm);
                        $form.setValue("");
                        $form.focus();
                        $form.callEvent("onTimedKeyPress");
                     },
                  },
               ],
            },
            {
               id: ids.buttonAddfilter,
               view: "button",
               css: "webix_primary",
               value: L("Add Filter"),
               click: () => {
                  this.rowFilterForm.popUp($$(ids.buttonAddfilter).getNode(), {
                     pos: "bottom",
                  });
               },
            },
            {
               view: "toolbar",
               id: ids.filterMenutoolbar,
               css: "ab-data-toolbar",
               hidden: true,
               cols: [
                  {
                     view: "button",
                     css: "webix_primary",
                     id: ids.resetFilterButton,
                     label: L("Reset Filter"),
                     icon: "fa fa-ban",
                     type: "icon",
                     // badge: 0,
                     autowidth: true,
                     click: function () {
                        self.resetFilter();
                     },
                  },
               ],
            },
         ],
      };
   }

   async init(AB) {
      if (AB) {
         this.AB = AB;
      }

      var ids = this.ids;
      // this.filter_popup = webix.ui({
      //    view: "popup",
      //    id: ids.component,
      //    width: 600,
      //    height: 400,
      //    hidden: true,
      //    body: this.rowFilter.ui,
      // });

      this.rowFilter.init();
      this.rowFilter.removeListener("changed", this._handler_rowFilterChanged);
      this.rowFilter.on("changed", this._handler_rowFilterChanged);

      this.rowFilterForm.init();
      this.rowFilterForm.removeListener(
         "changed",
         this._handler_rowFilterFormChanged
      );
      this.rowFilterForm.on("changed", this._handler_rowFilterFormChanged);
      this.rowFilterForm.removeListener(
         "save",
         this._handler_rowFilterFormChanged
      );
      this.rowFilterForm.on("save", this._handler_rowFilterFormChanged);

      $$(ids.filterPanel)?.hide();
      $$(ids.buttonAddfilter)?.hide();
      $$(ids.filterMenutoolbar)?.hide();
      $$(ids.globalFilterFormContainer)?.hide();

      switch (this.settings.filterOption) {
         case 0:
            break;
         case 1:
            switch (this.settings.userFilterPosition) {
               case "form":
                  $$(ids.buttonAddfilter)?.show();
                  $$(ids.filterPanel)?.show();
                  break;
               case "toolbar":
                  $$(ids.filterPanel)?.hide();
                  break;
            }
            break;
         case 2:
            $$(ids.filterPanel)?.show();
            var $filterMenutoolbar = $$(ids.filterMenutoolbar);
            if ($filterMenutoolbar) {
               $filterMenutoolbar.show();

               // populate filter items
               if (this.settings?.queryRules) {
                  (this.settings.queryRules || []).forEach((qr) => {
                     let Rule = new FilterRuleSettings();
                     Rule.fromSettings(qr);
                     var filterRuleButton = {
                        view: "button",
                        css: "webix_primary",
                        label: Rule.label,
                        icon: "fa fa-filter",
                        type: "icon",
                        // badge: 0,
                        autowidth: true,
                        click: () => {
                           this.emit("filter.data", null, Rule.filters);
                           // this.selectFilter(qr.filter);
                        },
                     };
                     $filterMenutoolbar.addView(filterRuleButton);
                  });
               }
            }
            break;
         case 3:
            $$(ids.globalFilterFormContainer)?.show();
            $$(ids.filterPanel)?.show();
            break;
      }
   }

   filterRules() {
      let rowFilterRules = null;

      switch (this.settings.userFilterPosition) {
         case "form":
            rowFilterRules = this.rowFilterForm.getValue();
            break;
         case "toolbar":
            rowFilterRules = this.rowFilter.getValue();
            break;
      }

      return rowFilterRules;
   }

   /**
    * @method getFilter()
    * Return a fn() that returns {truthy} with a given row of
    * data.
    */
   getFilter() {
      // default filter
      if (this.__currentFilter == null) {
         // if empty search text in global single mode, then no display rows
         if (
            this.settings.filterOption == 3 &&
            this.settings.globalFilterPosition == "single"
         )
            this.__currentFilter = (/* row */) => {
               return false;
            };
         // always true, show every rows
         else
            this.__currentFilter = (/* row */) => {
               return true;
            };
      }

      return this.__currentFilter;
   }

   /**
    * @method triggerCallback()
    * We compile our current search options and emit them back to our
    * parent container.
    */
   triggerCallback(/*fnFilter, filterRules*/) {
      let searchRules = this.searchText(this.__externalSearchText);
      let rowFilterRules = this.filterRules();

      let badgeCount = 0;
      if (rowFilterRules?.rules?.length) {
         badgeCount = rowFilterRules?.rules?.length;
         if (searchRules) {
            badgeCount++;
            rowFilterRules = {
               glue: "and",
               rules: [rowFilterRules, searchRules],
            };
         }
      } else {
         rowFilterRules = searchRules;
      }

      this.emit("filter.data", null, rowFilterRules);

      if (badgeCount == 0) badgeCount = false;
      let $button = $$(this.ids.buttonAddfilter);
      $button.config.badge = badgeCount;
      $button.refresh();
   }

   resetFilter() {
      this.triggerCallback(() => true, []);
   }

   /**
    * @method externalSearchText()
    * Save any search criteria established from outside this filterHelper.
    * NOTE: The ABViewGrid has a toolbar search entry that will provide
    * this value.
    * @param {string} search
    *        The typed in search criteria.
    */
   externalSearchText(search = null) {
      this.__externalSearchText = search;
      this.triggerCallback(); // update each time
   }

   /**
    * @method searchText()
    * Retrieve the typed in search terms from the user, and convert them
    * into a set of Rules that will modify our results.
    * If an external search param is provided, use that instead.
    * @param {string} externalText
    * @return {json} The QB Rule condition for the search criteria
    */
   searchText(externalText) {
      var search;
      if (externalText) {
         search = externalText;
      } else {
         search = ($$(this.ids.globalFilterForm).getValue() || "").trim();
      }
      if (!search) return null; // <-- includes ""

      // find the individual "terms" that we should search for
      let terms = search.trim().toLowerCase().split(" ");

      // build a set of conditions for each term
      var allTerms = [];

      var allFields = this.object?.fields() || [];

      terms.forEach((t) => {
         var fieldTerms = [];

         // for each field, add a match condition for that field
         // (if the field applies)
         allFields.forEach((f) => {
            if (f.fieldIsFilterable()) {
               switch (f.key) {
                  case "string":
                  case "LongText":
                  case "email":
                     fieldTerms.push({
                        key: f.id,
                        rule: "contains",
                        value: t,
                     });
                     break;

                  case "list":
                     var options = f.options();
                     options.forEach((o) => {
                        if (o.text.indexOf(t) > -1) {
                           fieldTerms.push({
                              key: f.id,
                              rule: "equals",
                              value: o.id,
                           });
                        }
                     });
                     break;
               }
            }
         });

         if (fieldTerms.length > 0) {
            allTerms.push({
               glue: "or",
               rules: fieldTerms,
            });
         }
      });

      if (allTerms.length > 0) {
         var searchRules = {
            glue: "and",
            rules: allTerms,
         };
         return searchRules;
      } else {
         return null;
      }
   }

   showPopup($view) {
      // this.filter_popup.show($view, null, { pos: "top" });
      this.rowFilter.popUp($view, null, { pos: "center" });
   }
}
