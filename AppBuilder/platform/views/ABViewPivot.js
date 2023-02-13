const ABViewPivotCore = require("../../core/views/ABViewPivotCore");
const ABViewPivotComponent = require("./viewComponent/ABViewPivotComponent");

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewPivot extends ABViewPivotCore {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues);
   }

   //
   //	Editor Related
   //

   /**
    * @method editorComponent
    * return the Editor for this UI component.
    * the editor should display either a "block" view or "preview" of
    * the current layout of the view.
    * @param {string} mode what mode are we in ['block', 'preview']
    * @return {Component}
    */
   editorComponent(App, mode) {
      var idBase = "ABViewPivotEditorComponent";
      var ids = {
         component: App.unique(`${idBase}_component`),
      };

      var componentBase = this.component(App);
      var component = App.AB.cloneDeep(componentBase);

      component.ui.id = ids.component;
      component.ui.readonly = false;
      component.ui.on = {
         onBeforeApply: (structure) => {
            this.settings.structure = structure;
            this.save();
         },
      };

      component.init = (options) => {
         componentBase.init({
            componentId: ids.component,
         });
      };

      return component;
   }

   //
   // Property Editor
   //

   // static propertyEditorComponent(App) {
   // 	return ABViewPropertyComponent.component(App);
   // }

   static propertyEditorDefaultElements(App, ids, _logic, ObjectDefaults) {
      let commonUI = super.propertyEditorDefaultElements(
         App,
         ids,
         _logic,
         ObjectDefaults
      );

      return commonUI.concat([
         {
            name: "datacollection",
            view: "richselect",
            label: L("Data Source"),
            labelWidth: this.AB.UISettings.config().labelWidthLarge,
         },
         {
            view: "counter",
            name: "height",
            label: L("Height:"),
            labelWidth: this.AB.UISettings.config().labelWidthLarge,
         },
         {
            view: "checkbox",
            name: "removeMissed",
            labelRight: L("Remove empty data."),
            labelWidth: this.AB.UISettings.config().labelWidthCheckbox,
         },
         {
            view: "checkbox",
            name: "totalColumn",
            labelRight: L("Show a total column."),
            labelWidth: this.AB.UISettings.config().labelWidthCheckbox,
         },
         {
            view: "checkbox",
            name: "separateLabel",
            labelRight: L("Separate header label."),
            labelWidth: this.AB.UISettings.config().labelWidthCheckbox,
         },
         {
            view: "checkbox",
            name: "min",
            labelRight: L(
               "Highlighting of a cell(s) with the least value in a row."
            ),
            labelWidth: this.AB.UISettings.config().labelWidthCheckbox,
         },
         {
            view: "checkbox",
            name: "max",
            labelRight: L(
               "Highlighting of a cell(s) with the biggest value in a row."
            ),
            labelWidth: this.AB.UISettings.config().labelWidthCheckbox,
         },
         {
            name: "decimalPlaces",
            view: "counter",
            min: 1,
            label: L("Decimal Places"),
            labelWidth: this.AB.UISettings.config().labelWidthXLarge,
         },
      ]);
   }

   static propertyEditorPopulate(App, ids, view) {
      super.propertyEditorPopulate(App, ids, view);

      var datacollectionId = view.settings.dataviewID
         ? view.settings.dataviewID
         : null;
      var SourceSelector = $$(ids.datacollection);

      // Pull data collections to options
      var dcOptions = view.propertyDatacollections();
      SourceSelector.define("options", dcOptions);
      SourceSelector.define("value", datacollectionId);
      SourceSelector.refresh();

      $$(ids.removeMissed).setValue(view.settings.removeMissed);
      $$(ids.totalColumn).setValue(view.settings.totalColumn);
      $$(ids.separateLabel).setValue(view.settings.separateLabel);
      $$(ids.min).setValue(view.settings.min);
      $$(ids.max).setValue(view.settings.max);
      $$(ids.height).setValue(view.settings.height);
      $$(ids.decimalPlaces).setValue(
         view.settings.decimalPlaces == null ? 2 : view.settings.decimalPlaces
      );
   }

   static propertyEditorValues(ids, view) {
      super.propertyEditorValues(ids, view);

      view.settings.dataviewID = $$(ids.datacollection).getValue();

      view.settings.removeMissed = $$(ids.removeMissed).getValue();
      view.settings.totalColumn = $$(ids.totalColumn).getValue();
      view.settings.separateLabel = $$(ids.separateLabel).getValue();
      view.settings.min = $$(ids.min).getValue();
      view.settings.max = $$(ids.max).getValue();
      view.settings.height = $$(ids.height).getValue();
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false) {
      let component = new ABViewPivotComponent(this);

      // if this is our v1Interface
      if (v1App) {
         const newComponent = component;

         component = {
            ui: newComponent.ui(),
            init: (options, accessLevel) => {
               return newComponent.init(this.AB);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
      }

      return component;
   }
};
