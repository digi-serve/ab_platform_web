const ABViewGanttCore = require("../../core/views/ABViewGanttCore");
const ABGanttWorkspace = require("../../../ABDesigner/ab_work_object_workspace_gantt.js");
const ABGanttProperty = require("../workspaceViews/ABObjectWorkspaceViewGantt.js");

const ABViewGanttPropertyComponentDefaults = ABViewGanttCore.defaultValues();

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewGantt extends ABViewGanttCore {
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
      return this.component(App);
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

      this._ganttProperty = ABGanttProperty.component(App, "ab_widget_gantt");

      // in addition to the common .label  values, we
      // ask for:
      return commonUI.concat([
         {
            view: "fieldset",
            label: L("Gantt Data:"),
            labelWidth: this.AB.UISettings.config().labelWidthLarge,
            body: {
               type: "clean",
               padding: 10,
               rows: [
                  {
                     view: "select",
                     name: "datacollection",
                     label: L("Object:"),
                     labelWidth: this.AB.UISettings.config().labelWidthLarge,
                     on: {
                        onChange: (newv, oldv) => {
                           if (newv == oldv) return;
                        },
                     },
                  },
               ],
            },
         },
         {
            view: "fieldset",
            label: L("Gantt Fields:"),
            labelWidth: this.AB.UISettings.config().labelWidthLarge,
            body: {
               view: "form",
               name: "fields",
               borderless: true,
               elements: this._ganttProperty.elements().rows,
            },
         },
      ]);
   }

   static propertyEditorPopulate(App, ids, view) {
      super.propertyEditorPopulate(App, ids, view);

      $$(ids.datacollection).define("options", view.propertyDatacollections());
      $$(ids.datacollection).refresh();
      $$(ids.datacollection).setValue(view.settings.dataviewID || "");

      let dc = view.datacollection;
      if (dc && dc.datasource) {
         this._ganttProperty.init(dc.datasource);
      }

      $$(ids.fields).setValues({
         title: view.settings.titleFieldID,
         startDate: view.settings.startDateFieldID,
         endDate: view.settings.endDateFieldID,
         duration: view.settings.durationFieldID,
         progress: view.settings.progressFieldID,
         notes: view.settings.notesFieldID,
      });
   }

   static propertyEditorValues(ids, view) {
      super.propertyEditorValues(ids, view);

      view.settings.dataviewID =
         $$(ids.datacollection).getValue() ||
         ABViewGanttPropertyComponentDefaults.dataviewID;

      let dc = view.datacollection;
      if (dc && dc.datasource) {
         this._ganttProperty.init(dc.datasource);
      }

      let fieldIds = $$(ids.fields).getValues() || {};

      view.settings.titleFieldID =
         fieldIds.title || ABViewGanttPropertyComponentDefaults.titleFieldID;
      view.settings.startDateFieldID =
         fieldIds.startDate ||
         ABViewGanttPropertyComponentDefaults.startDateFieldID;
      view.settings.endDateFieldID =
         fieldIds.endDate ||
         ABViewGanttPropertyComponentDefaults.endDateFieldID;
      view.settings.durationFieldID =
         fieldIds.duration ||
         ABViewGanttPropertyComponentDefaults.durationFieldID;
      view.settings.progressFieldID =
         fieldIds.progress ||
         ABViewGanttPropertyComponentDefaults.progressFieldID;
      view.settings.notesFieldID =
         fieldIds.notes || ABViewGanttPropertyComponentDefaults.notesFieldID;
   }

   /*
    * @component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(App) {
      let base = super.component(App);
      let idBase = `ABViewGantt_${this.id}`;
      let ids = {
         component: App.unique(`${idBase}_component`),
      };

      let ganttView = new ABGanttWorkspace(App, idBase);

      // make sure each of our child views get .init() called
      let _init = (options) => {
         let dc = this.datacollection;
         if (!dc) return;

         let obj = dc.datasource;
         if (!obj) return;

         ganttView.setFields({
            titleField: obj.fieldByID(this.settings.titleFieldID),

            startDateField: obj.fieldByID(this.settings.startDateFieldID),

            endDateField: obj.fieldByID(this.settings.endDateFieldID),

            durationField: obj.fieldByID(this.settings.durationFieldID),

            progressField: obj.fieldByID(this.settings.progressFieldID),

            notesField: obj.fieldByID(this.settings.notesFieldID),
         });

         ganttView.objectLoad(obj);
         ganttView.datacollectionLoad(dc);
      };

      return {
         ui: ganttView.ui,
         init: _init,
         onShow: base.onShow,
      };
   }
};
