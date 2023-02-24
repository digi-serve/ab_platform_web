import ABViewComponent from "./ABViewComponent";
import ABPopupSortField from "../ABViewGridPopupSortFields";
import ABViewCustomFilter from "../viewProperties/ABViewPropertyFilterData";
import _ from "lodash";

export default class ABViewDataFilterComponent extends ABViewComponent {
   constructor(baseView, idbase, ids) {
      super(
         baseView,
         idbase || `ABViewDataFilter_${baseView.id}`,
         Object.assign(
            {
               filter: "",
               reset: "",
               sortButton: "",
               filterButton: "",
               globalSearchToolbar: "",
            },
            ids
         )
      );

      this._handler_filterData = (fnFilter, filterRules) => {
         this.callbackFilterData(fnFilter, filterRules); // be notified when there is a change in the filter
      };

      this.field = null;
      const ab = this.AB;

      // {ABViewGridPopupSortFields}
      // The popup for adding sort criteria to our grid.
      this.PopupSortComponent = new ABPopupSortField(
         `ABViewDataFilter_Sort_Popup_${this.settings.dataviewID}`
      );
      this.PopupSortComponent.init(ab);
      this.PopupSortComponent.on("changed", (sortOptions) => {
         this.callbackSortData(sortOptions);
      });

      this.filterHelper = new ABViewCustomFilter(
         this.AB,
         `ABViewDataFilter_Filter_Popup_${this.settings.dataviewID}`
      );
      this.filterHelper.settings = {
         filterOption: 1,
         userFilterPosition: "toolbar",
         isGlobalToolbar: 1,
      };
      this.filterHelper.init(ab);
      this.detatch();
      this.filterHelper.on("filter.data", this._handler_filterData);
   }

   advancedUI() {
      const compId = this.ids.component;
      return [
         {
            css: "bg_gray",
            maxHeight: 60,
            rows: [
               {},
               {
                  cols: [
                     {
                        width: 18,
                     },
                     {
                        view: "button",
                        type: "icon",
                        icon: "fa fa-filter",
                        width: 40,
                        filterButton: true,
                        id: this.ids.filterButton,
                        css: "webix_primary",
                        click: (id, event) => {
                           this.toolbarFilter($$(this.ids.filterButton).$view);
                        },
                        on: {
                           onAfterRender: function () {
                              this.getInputNode().setAttribute(
                                 "data-cy",
                                 `${compId} filter button`
                              );
                           },
                        },
                     },
                     {
                        view: "button",
                        type: "icon",
                        icon: "fa fa-sort",
                        width: 40,
                        sortButton: true,
                        id: this.ids.sortButton,
                        css: "webix_primary",
                        click: (id, event) => {
                           this.openSort($$(this.ids.sortButton).$view);
                        },
                        on: {
                           onAfterRender: function () {
                              this.getInputNode().setAttribute(
                                 "data-cy",
                                 `${compId} sort button`
                              );
                           },
                        },
                     },
                     {
                        id: this.ids.globalSearchToolbar,
                        view: "search",
                        placeholder: "Search..",
                        width: 0,
                        attributes: {
                           "data-cy": `${this.ids.component} global search`,
                        },
                        on: {
                           onTimedKeyPress: () => {
                              const searchText = $$(
                                 this.ids.globalSearchToolbar
                              ).getValue();

                              this.filterHelper.externalSearchText(searchText);
                           },
                        },
                     },
                     {
                        width: 18,
                     },
                  ],
               },
               {},
            ],
         },
      ];
   }

   connectedFieldUI() {
      return [
         {
            css: "bg_gray",
            maxHeight: 60,
            cols: [
               {
                  width: 18,
               },
               {
                  rows: [
                     {},
                     {
                        view: "abslayout",
                        cells: [
                           {
                              css: "bg_gray",
                              view: "combo",
                              id: this.ids.filter,
                              labelWidth: 0,
                              relative: true,
                              disabled: true,
                              on: {
                                 onChange: (id) => this.applyConnectFilter(id),
                              },
                           },
                           {
                              view: "icon",
                              id: this.ids.reset,
                              icon: "fa fa-times",
                              right: 24,
                              top: 7,
                              width: 24,
                              height: 24,
                              hidden: true,
                              tooltip: this.label("Remove this filter"),
                              on: {
                                 onItemClick: () =>
                                    $$(this.ids.filter).setValue(),
                              },
                           },
                        ],
                     },
                     {},
                  ],
               },
               {
                  width: 18,
               },
            ],
         },
      ];
   }

   ui() {
      if (this.settings.viewType == "advanced") {
         if (!this?.settings?.dataviewID) return { height: 1 };
      } else {
         if (!this?.settings?.dataviewID || !this?.settings?.field)
            return { height: 1 };
      }

      const ids = this.ids;

      const ui =
         this.settings.viewType == "advanced"
            ? this.advancedUI()
            : this.connectedFieldUI();
      const _ui = super.ui(ui);

      delete _ui.type;

      return _ui;
   }

   async init(AB) {
      await super.init(AB);

      const dv = this.datacollection;

      if (!dv) return;

      const object = dv.datasource;

      if (!object) return;

      if (this.settings.viewType == "advanced") {
         if (this.settings.showSort) {
            this.PopupSortComponent.objectLoad(object);
         } else {
            $$(this.ids.sortButton).hide();
         }
         if (this.settings.showFilter) {
            this.filterHelper.objectLoad(object);
         } else {
            $$(this.ids.filterButton).hide();
         }
      } else if (this.settings.viewType == "connected") {
         const [field] = object.fields(
            (f) => f.columnName === this.settings.field
         );

         if (!field) {
            this.AB.notify.developer(
               `Cannot find field "${this.settings.field}" in ${object.name}`,
               {
                  context: "ABViewDataFilterComponent.init()",
                  data: { settings: this.settings },
               }
            );

            return;
         }

         this.field = field;

         const ids = this.ids;
         const suggest = webix.ui({
            view: "suggest",
            filter: ({ value }, search) =>
               value.toLowerCase().includes(search.toLowerCase()),
            on: {
               onShow: () => {
                  field.populateOptionsDataCy($$(ids.filter), field, {});
               },
            },
            showAllOptions: true,
         });
         field.getAndPopulateOptions(suggest, null, field);

         const $filter = $$(ids.filter);

         $filter.define("suggest", suggest);
         $filter.define(
            "placeholder",
            `${this.label("Filter by")} ${field.label}`
         );
         $filter.enable();
         $filter.refresh();
      }
   }

   applyConnectFilter(connectId) {
      let filterRule = [];
      if (connectId) {
         $$(this.ids.reset).show();
         filterRule = [
            {
               key: this.field.id,
               rule: "equals",
               value: connectId,
            },
         ];
      } else {
         $$(this.ids.reset).hide();
      }
      const dc = this.datacollection;

      dc.filterCondition({ glue: "and", rules: filterRule });
      dc.reloadData();
   }

   openSort($view) {
      this.PopupSortComponent.show($view);
   }

   /**
    * @method callbackSortData()
    * Process the provided sort options from our sort ui.
    * @param {array} sortRules
    *        Any Sort Rules added by the user.
    */
   async callbackSortData(sortRules = []) {
      var buttons = $$(this.ids.component)
         .getTopParentView()
         .queryView({ view: "button", sortButton: true }, "all");

      buttons.forEach((b) => {
         b.define("badge", sortRules?.length || null);
         b.refresh();
      });

      const dc = this.datacollection;
      if (!_.isEqual(dc?.settings?.objectWorkspace?.sortFields, sortRules)) {
         dc.settings.objectWorkspace.sortFields = sortRules;
         await this.datacollection.reloadData();
      }
   }

   /**
    * @method callbackFilterData()
    * Process the provided filter options from our filterHelper.
    * @param {fn} fnFilter
    *        A function that returns true/false for each row of data
    *        to determine if is should exist.
    * @param {array} filterRules
    *        Any Filter Rules added by the user.
    */
   callbackFilterData(fnFilter, filterRules = []) {
      var buttons = $$(this.ids.component)
         .getTopParentView()
         .queryView({ view: "button", filterButton: true }, "all");

      const onlyFilterRules = this.filterHelper.filterRules();
      buttons.forEach((b) => {
         b.define("badge", onlyFilterRules?.rules?.length ?? null);
         b.refresh();
      });

      const dc = this.datacollection;
      if (!_.isEqual(dc?.__filterCond, filterRules)) {
         dc.filterCondition(filterRules);
         dc.reloadData();
      }
   }

   toolbarFilter($view) {
      this.filterHelper.showPopup($view);
   }

   detatch() {
      this.filterHelper.removeListener("filter.data", this._handler_filterData);
      // this.datacollection?.removeListener("changeCursor", this.handler_select);
   }
}
