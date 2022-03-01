const ABViewFormConnectCore = require("../../core/views/ABViewFormConnectCore");
const ABViewPropertyAddPage = require("./viewProperties/ABViewPropertyAddPage")
   .default;
const ABViewPropertyEditPage = require("./viewProperties/ABViewPropertyEditPage")
   .default;

const ABViewFormConnectPropertyComponentDefaults = ABViewFormConnectCore.defaultValues();

const RowFilter = require("../RowFilter");

let FilterComponent = null;

let L = (...params) => AB.Multilingual.label(...params);

function _onShow(App, compId, instance, component) {
   let elem = $$(compId);
   if (!elem) return;

   let field = instance.field();
   if (!field) return;

   let rowData = {},
      node = elem.$view;

   // we need to use the element id stored in the settings to find out what the
   // ui component id is so later we can use it to look up its current value
   let filterValue = null;

   // we also need the id of the field that we are going to filter on
   let filterKey = null;

   // finally if this is a custom foreign key we need the stored columnName by
   // default uuid is passed for all non CFK
   let filterColumn = null;

   // the value stored is hash1:hash2:columnName
   // hash1 = component view id of the element we want to get the value from
   // hash2 = the id of the field we are using to filter our options
   // filterColumn = the name of the column to get the value from
   if (
      instance.settings.filterConnectedValue &&
      instance.settings.filterConnectedValue.indexOf(":") > -1
   ) {
      Object.keys(instance.parent.viewComponents).forEach((key, index) => {
         // find component name, I (James) adjusted the ui to display better,
         // but the result is two different ui types.
         let uiName = "";
         if (
            instance.parent.viewComponents[key].ui &&
            instance.parent.viewComponents[key].ui.rows
         ) {
            if (instance.parent.viewComponents[key].ui.rows[0].name) {
               uiName = instance.parent.viewComponents[key].ui.rows[0].name;
               if (
                  uiName == instance.settings.filterConnectedValue.split(":")[0]
               ) {
                  filterValue = instance.parent.viewComponents[key].ui.rows[0];
               }
            } else if (
               instance.parent.viewComponents[key].ui.rows[0].cols &&
               instance.parent.viewComponents[key].ui.rows[0].cols[2] &&
               instance.parent.viewComponents[key].ui.rows[0].cols[2].name
            ) {
               uiName =
                  instance.parent.viewComponents[key].ui.rows[0].cols[2].name;
               if (
                  uiName == instance.settings.filterConnectedValue.split(":")[0]
               ) {
                  filterValue =
                     instance.parent.viewComponents[key].ui.rows[0].cols[2];
               }
            }
         }
      });

      // if not found stop
      if (!filterValue) return;
      filterKey = instance.settings.filterConnectedValue.split(":")[1];
      filterColumn = instance.settings.filterConnectedValue.split(":")[2];
   }

   instance.options = {
      formView: instance.settings.formView,
      filters: instance.settings.objectWorkspace.filterConditions,
      filterValue: filterValue,
      filterKey: filterKey,
      filterColumn: filterColumn,
      editable: instance.settings.disable == 1 ? false : true,
      editPage:
         !instance.settings.editForm || instance.settings.editForm == "none"
            ? false
            : true,
   };

   var multiselect = field.settings.linkType == "many";

   var placeholder = L("Select item");
   if (multiselect) {
      placeholder = L("Select items");
   }

   var readOnly = false;
   if (
      instance.options.editable != null &&
      instance.options.editable == false
   ) {
      readOnly = true;
      placeholder = "";
   }

   // if this field's options are filtered off another field's value we need
   // to make sure the UX helps the user know what to do.
   let placeholderReadOnly = null;
   if (instance.options.filterValue && instance.options.filterKey) {
      if (!$$(instance.options.filterValue.id)) {
         // this happens in the Interface Builder when only the single form UI is displayed
         readOnly = true;
         placeholderReadOnly = L("Must select item from '{0}' first.", [
            L("PARENT ELEMENT"),
         ]);
      } else {
         let val = field.getValue($$(instance.options.filterValue.id));
         if (!val) {
            // if there isn't a value on the parent select element set this one to readonly and change placeholder text
            readOnly = true;
            let label = $$(instance.options.filterValue.id);
            placeholderReadOnly = L("Must select item from '{0}' first.", [
               label.config.label,
            ]);
         }
      }
   }

   // fetch the options and set placeholder text for this view
   if (node) {
      if (readOnly) {
         $$(node).define("placeholder", placeholderReadOnly);
         $$(node).define("disabled", true);
      } else {
         $$(node).define("placeholder", placeholder);
      }
      $$(node).refresh();

      field.once("option.data", (data) => {
         data.forEach((item) => {
            item.value = item.text;
         });
         $$(node).getList().clearAll();
         $$(node).getList().define("data", data);
      });

      field
         .getOptions(instance.settings.objectWorkspace.filterConditions, "")
         .then((data) => {
            data.forEach((item) => {
               item.value = item.text;
            });
            $$(node).getList().clearAll();
            $$(node).getList().define("data", data);
         });
   }

   if (instance.options.filterValue && $$(instance.options.filterValue.id)) {
      // let parentDomNode = $$(options.filterValue.ui.id).$view.querySelector(
      //    ".connect-data-values"
      // );
      $$(instance.options.filterValue.id).attachEvent(
         "onChange",
         (e) => {
            let parentVal = $$(instance.options.filterValue.id).getValue();
            if (parentVal) {
               $$(node).define("disabled", false);
               $$(node).define("placeholder", placeholder);
               $$(node).setValue("");
               $$(node).refresh();
            } else {
               $$(node).define("disabled", true);
               $$(node).define("placeholder", placeholderReadOnly);
               $$(node).setValue("");
               $$(node).refresh();
            }
         },
         false
      );
   }

   // field.customDisplay(rowData, App, node, {
   //    formView: instance.settings.formView,
   //    filters: instance.settings.objectWorkspace.filterConditions,
   //    filterValue: filterValue,
   //    filterKey: filterKey,
   //    filterColumn: filterColumn,
   //    editable: instance.settings.disable == 1 ? false : true,
   //    editPage:
   //       !instance.settings.editForm || instance.settings.editForm == "none"
   //          ? false
   //          : true,
   // });

   // listen 'editPage' event
   if (!instance._editPageEvent) {
      instance._editPageEvent = true;
      field.on("editPage", component.logic.goToEditPage);
   }
}

module.exports = class ABViewFormConnect extends ABViewFormConnectCore {
   /**
    * @param {obj} values  key=>value hash of ABView values
    * @param {ABApplication} application the application object this view is under
    * @param {ABView} parent the ABView this view is a child of. (can be null)
    */
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues);

      // Set filter value
      this.__filterComponent = new RowFilter(
         null,
         `${this.id}__filterComponent`,
         this.AB
      );
      // this.__filterComponent.applicationLoad(application);
      this.__filterComponent.fieldsLoad(
         this.datasource ? this.datasource.fields() : [],
         this.datasource ? this.datasource : null
      );

      this.__filterComponent.setValue(
         this.settings.objectWorkspace.filterConditions ||
            ABViewFormConnectPropertyComponentDefaults.objectWorkspace
               .filterConditions
      );
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
      let idBase = "ABViewFormConnectEditorComponent";
      let ids = {
         component: App.unique(`${idBase}_component`),
      };

      let baseComp = this.component(App);
      let templateElem = baseComp.ui;
      templateElem.id = ids.component;

      var _ui = {
         rows: [templateElem, {}],
      };

      return {
         ui: _ui,
         init: baseComp.init,
         logic: baseComp.logic,
         onShow: () => {
            _onShow(App, ids.component, this, baseComp);
         },
      };
   }

   ///
   /// Instance Methods
   ///

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      this.addPageTool.fromSettings(this.settings);
      this.editPageTool.fromSettings(this.settings);
   }

   //
   // Property Editor
   //

   static propertyEditorDefaultElements(App, ids, _logic, ObjectDefaults) {
      var commonUI = super.propertyEditorDefaultElements(
         App,
         ids,
         _logic,
         ObjectDefaults
      );

      let idBase = "ABViewFormConnectPropertyEditor";
      this.App = App;
      this.idBase = idBase;

      _logic.showFilterPopup = ($view) => {
         this.filter_popup.show($view, null, { pos: "top" });
      };

      _logic.onFilterChange = () => {
         let view = _logic.currentEditObject();
         let filterValues = FilterComponent.getValue() || {};

         let allComplete = true;
         (filterValues.rules || []).forEach((f) => {
            // if all 3 fields are present, we are good.
            if (f.key && f.rule && f.value) {
               allComplete = allComplete && true;
            } else {
               // else, we found an entry that wasn't complete:
               allComplete = false;
            }
         });

         // only perform the update if a complete row is specified:
         if (allComplete) {
            // we want to call .save() but give webix a chance to properly update it's
            // select boxes before this call causes them to be removed:
            setTimeout(() => {
               this.propertyEditorSave(ids, view);
            }, 10);
         }
      };

      // create filter & sort popups
      this.initPopupEditors(App, ids, _logic);

      let onSave = () => {
         let currView = _logic.currentEditObject();
         if (currView) {
            // refresh settings
            this.propertyEditorValues(ids, currView);

            // trigger a save()
            this.propertyEditorSave(ids, currView);
         }
      };

      this.addPageProperty.init({
         onSave: () => {
            onSave();
         },
      });

      this.editPageProperty.init({
         onSave: () => {
            onSave();
         },
      });

      // in addition to the common .label  values, we
      // ask for:
      return commonUI.concat([
         this.addPageProperty.ui,
         this.editPageProperty.ui,
         {
            view: "fieldset",
            name: "addNewSettings",
            label: L("Add New Popup Settings:"),
            labelWidth: this.AB.UISettings.config().labelWidthLarge,
            body: {
               type: "clean",
               padding: 10,
               rows: [
                  {
                     view: "text",
                     name: "popupWidth",
                     placeholder: L("Set popup width"),
                     label: L("Width:"),
                     labelWidth: this.AB.UISettings.config().labelWidthLarge,
                     validate: webix.rules.isNumber,
                  },
                  {
                     view: "text",
                     name: "popupHeight",
                     placeholder: L("Set popup height"),
                     label: L("Height:"),
                     labelWidth: this.AB.UISettings.config().labelWidthLarge,
                     validate: webix.rules.isNumber,
                  },
               ],
            },
         },
         {
            view: "fieldset",
            name: "advancedOption",
            label: L("Advanced Options:"),
            labelWidth: this.AB.UISettings.config().labelWidthLarge,
            body: {
               type: "clean",
               padding: 10,
               rows: [
                  {
                     cols: [
                        {
                           view: "label",
                           label: L("Filter Options:"),
                           width: this.AB.UISettings.config().labelWidthLarge,
                        },
                        {
                           view: "button",
                           name: "buttonFilter",
                           css: "webix_primary",
                           label: L("Settings"),
                           icon: "fa fa-gear",
                           type: "icon",
                           badge: 0,
                           click: function () {
                              _logic.showFilterPopup(this.$view);
                           },
                        },
                     ],
                  },
                  {
                     rows: [
                        {
                           view: "label",
                           label: L("Filter by Connected Field Value:"),
                        },
                        {
                           view: "combo",
                           name: "filterConnectedValue",
                           options: [], // we will add these in propertyEditorPopulate
                        },
                     ],
                  },
               ],
            },
         },
      ]);
   }

   static propertyEditorPopulate(App, ids, view) {
      super.propertyEditorPopulate(App, ids, view);

      // Default set of options for filter connected combo
      let filterConnectedOptions = [{ id: "", value: "" }];

      // get the definitions for the connected field
      let fieldDefs = view.AB.definitionForID(view.settings.fieldId);

      // get the definition for the object that the field is related to
      let objectDefs = view.AB.definitionForID(fieldDefs.settings.linkObject);

      // we need these definitions later as we check to find out which field
      // we are filtering by so push them into an array for later
      let fieldsDefs = [];
      objectDefs.fieldIDs.forEach((fld) => {
         fieldsDefs.push(view.AB.definitionForID(fld));
      });

      // find out what connected objects this field has
      let connectedObjs = view.application.connectedObjects(
         fieldDefs.settings.linkObject
      );

      // loop through the form's elements (need to ensure that just looking at parent is okay in all cases)
      view.parent.views().forEach((element) => {
         // identify if element is a connected field
         if (element.key == "connect") {
            // we need to get the fields defs to find out what it is connected to
            let formElementsDefs = view.AB.definitionForID(
               element.settings.fieldId
            );

            // loop through the connected objects discovered above
            connectedObjs.forEach((connObj) => {
               // see if the connected object matches the connected object of the form element
               if (connObj.id == formElementsDefs.settings.linkObject) {
                  // get the ui id of this component that matches the link Object
                  let fieldToCheck;
                  fieldsDefs.forEach((fdefs) => {
                     // if the field has a custom foreign key we need to store it
                     // so selectivity later can know what value to get, otherwise
                     // we just get the uuid of the record
                     if (
                        fdefs.settings.isCustomFK &&
                        fdefs.settings.indexField != "" &&
                        fdefs.settings.linkObject &&
                        fdefs.settings.linkType == "one" &&
                        fdefs.settings.linkObject ==
                           formElementsDefs.settings.linkObject
                     ) {
                        fieldToCheck = fdefs.id;
                        let customFK = view.application.definitionForID(
                           fdefs.settings.indexField
                        );

                        // if the index definitions were found
                        if (customFK) {
                           fieldToCheck = `${fdefs.id}:${customFK.columnName}`;
                        }
                     } else if (
                        fdefs.settings.linkObject &&
                        fdefs.settings.linkType == "one" &&
                        fdefs.settings.linkObject ==
                           formElementsDefs.settings.linkObject
                     ) {
                        fieldToCheck = `${fdefs.id}:uuid`;
                     }
                  });

                  // only add optinos that have a fieldToCheck
                  if (fieldToCheck) {
                     // get the component we are referencing so we can display its label
                     let formComponent = view.parent.viewComponents[element.id]; // need to ensure that just looking at parent is okay in all cases
                     filterConnectedOptions.push({
                        id: `${formComponent.ui.name}:${fieldToCheck}`, // store the columnName name because the ui id changes on each load
                        value: formComponent.ui.label, // should be the translated field label
                     });
                  }
               }
            });
         }
      });

      // Set the options of the possible edit forms
      this.addPageProperty.setSettings(view, view.settings);
      this.editPageProperty.setSettings(view, view.settings);
      $$(ids.filterConnectedValue).define("options", filterConnectedOptions);
      $$(ids.filterConnectedValue).setValue(view.settings.filterConnectedValue);

      $$(ids.popupWidth).setValue(
         view.settings.popupWidth ||
            ABViewFormConnectPropertyComponentDefaults.popupWidth
      );
      $$(ids.popupHeight).setValue(
         view.settings.popupHeight ||
            ABViewFormConnectPropertyComponentDefaults.popupHeight
      );

      // initial populate of popups
      this.populatePopupEditors(view);

      // inform the user that some advanced settings have been set
      this.populateBadgeNumber(ids, view);

      // when a change is made in the properties the popups need to reflect the change
      this.updateEventIds = this.updateEventIds || {}; // { viewId: boolean, ..., viewIdn: boolean }
      if (!this.updateEventIds[view.id]) {
         this.updateEventIds[view.id] = true;

         view.addListener("properties.updated", () => {
            this.populatePopupEditors(view);
            this.populateBadgeNumber(ids, view);
         });
      }
   }

   static propertyEditorValues(ids, view) {
      super.propertyEditorValues(ids, view);

      view.settings.popupWidth = $$(ids.popupWidth).getValue();
      view.settings.popupHeight = $$(ids.popupHeight).getValue();
      view.settings.filterConnectedValue = $$(
         ids.filterConnectedValue
      ).getValue();
      view.settings.objectWorkspace = {
         filterConditions: FilterComponent.getValue(),
      };

      view.settings = this.addPageProperty.getSettings(view);
      view.settings = this.editPageProperty.getSettings(view);

      // refresh settings of app page tool
      view.addPageTool.fromSettings(view.settings);
      view.editPageTool.fromSettings(view.settings);
   }

   static populateBadgeNumber(ids, view) {
      if (
         view.settings.objectWorkspace &&
         view.settings.objectWorkspace.filterConditions &&
         view.settings.objectWorkspace.filterConditions.rules
      ) {
         $$(ids.buttonFilter).define(
            "badge",
            view.settings.objectWorkspace.filterConditions.rules.length || null
         );
         $$(ids.buttonFilter).refresh();
      } else {
         $$(ids.buttonFilter).define("badge", null);
         $$(ids.buttonFilter).refresh();
      }
   }

   static initPopupEditors(App, ids, _logic) {
      var idBase = "ABViewFormConnectPropertyEditor";

      FilterComponent = new RowFilter(App, `${idBase}_filter`);
      FilterComponent.init({
         // when we make a change in the popups we want to make sure we save the new workspace to the properties to do so just fire an onChange event
         onChange: _logic.onFilterChange,
      });

      this.filter_popup = webix.ui({
         view: "popup",
         width: 800,
         hidden: true,
         body: FilterComponent.ui,
      });
   }

   static populatePopupEditors(view) {
      let filterConditions =
         ABViewFormConnectPropertyComponentDefaults.objectWorkspace
            .filterConditions;

      if (
         view.settings.objectWorkspace &&
         view.settings.objectWorkspace.filterConditions
      )
         filterConditions = view.settings.objectWorkspace.filterConditions;

      // Populate data to popups
      // FilterComponent.objectLoad(objectCopy);
      let field = view.field();
      if (field) {
         let linkedObj = field.datasourceLink;
         if (linkedObj)
            FilterComponent.fieldsLoad(linkedObj.fields(), linkedObj);
      }

      // FilterComponent.applicationLoad(view.application);
      FilterComponent.setValue(filterConditions);
   }

   static get addPageProperty() {
      return ABViewPropertyAddPage.propertyComponent(this.App, this.idBase);
   }

   static get editPageProperty() {
      return ABViewPropertyEditPage.propertyComponent(this.App, this.idBase);
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(App, idPrefix) {
      var field = this.field();
      // this field may be deleted
      if (!field) return super.component(App);

      idPrefix = idPrefix ? idPrefix + "_" : "";

      var component = super.component(App);
      var form = this.parentFormComponent();
      var idBase = this.parentFormUniqueID(
         "ABViewFormConnect_" + this.id + "_f_"
      );
      var ids = {
         component: App.unique(`${idPrefix}${idBase}_component`),
         popup: App.unique(`${idPrefix}${idBase}_popup_add_new`),
         editpopup: App.unique(
            `${idPrefix}${idBase}_popup_edit_form_popup_add_new`
         ),
      };

      var settings = {};
      if (form) settings = form.settings;

      // var requiredClass = "";
      // if (field.settings.required == true || this.settings.required == true) {
      //    requiredClass = "webix_required";
      // }
      // var templateLabel = "";
      // if (settings.showLabel) {
      //    if (settings.labelPosition == "top")
      //       templateLabel =
      //          '<label style="display:block; text-align: left; margin: 0; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" class="webix_inp_top_label ' +
      //          requiredClass +
      //          '">#label#</label>';
      //    else
      //       templateLabel =
      //          '<label style="width: #width#px; display: inline-block; line-height: 32px; float: left; margin: 0; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" class="webix_inp_label ' +
      //          requiredClass +
      //          '">#label#</label>';
      // }
      //
      // var newWidth = settings.labelWidth;
      // if (this.settings.formView && this.settings.formView != "none") {
      //    newWidth += 40;
      // } else if (
      //    settings.showLabel == true &&
      //    settings.labelPosition == "top"
      // ) {
      //    newWidth = 0;
      // }

      let addPageComponent = this.addPageTool.component(App, idBase);
      let editPageComponent;
      // let template = `<div class="customField">${templateLabel}#plusButton##template#</div>`
      //    .replace(/#width#/g, settings.labelWidth)
      //    .replace(/#label#/g, field.label)
      //    .replace(/#plusButton#/g, addPageComponent.ui)
      //    .replace(
      //       /#template#/g,
      //       field.columnHeader({
      //          width: newWidth,
      //          editable: true,
      //          skipRenderSelectivity: true,
      //       })
      //    );

      // let template = field.columnHeader({
      //    width: newWidth,
      //    editable: true,
      //    skipRenderSelectivity: true,
      // });

      component.init = (optionsParam) => {
         var settings = {};
         var options = optionsParam || {};
         if (form) settings = form.settings;

         addPageComponent.applicationLoad(this.application);
         addPageComponent.init({
            onSaveData: component.logic.callbackSaveData,
            onCancelClick: component.logic.callbackCancel,
            clearOnLoad: component.logic.callbackClearOnLoad,
         });

         editPageComponent = this.editPageTool.component(App, idBase);
         editPageComponent.applicationLoad(this.application);
         editPageComponent.init({
            onSaveData: component.logic.callbackSaveData,
            onCancelClick: component.logic.callbackCancel,
            clearOnLoad: component.logic.callbackClearOnLoad,
         });
      };

      component.logic = {
         /**
          * @function callbackSaveData
          *
          */
         callbackSaveData: (saveData) => {
            // find the selectivity component
            var elem = $$(ids.component);
            if (!elem) return;

            // get the linked Object for current field
            // var linkedObj = field.datasourceLink;
            // isolate the connected field data that was saved
            // var savedItem = linkedObj.displayData(saveData);
            // repopulate the selectivity options now that there is a new one added
            // var filters = {};
            // if (this.settings.objectWorkspace && this.settings.objectWorkspace.filterConditions) {
            // 	filters = this.settings.objectWorkspace.filterConditions;
            // }
            field.once("option.data", (data) => {
               data.forEach((item) => {
                  item.value = item.text;
               });
               $$(ids.component).getList().clearAll();
               $$(ids.component).getList().define("data", data);
               if (field.settings.linkType == "many") {
                  let currentVals = $$(ids.component).getValue();
                  $$(ids.component).setValue(
                     currentVals ? currentVals + "," + saveData.id : saveData.id
                  );
               } else {
                  $$(ids.component).setValue(saveData.id);
               }
               // close the popup when we are finished
               if ($$(ids.popup)) $$(ids.popup).close();
               if ($$(ids.editpopup)) $$(ids.editpopup).close();
            });

            field
               .getOptions(this.settings.objectWorkspace.filterConditions, "")
               .then(function (data) {
                  // we need new option that will be returned from server (above)
                  // so we will not set this and then just reset it.
               });
         },

         callbackCancel: () => {
            $$(ids.popup).close();
            return false;
         },

         callbackClearOnLoad: () => {
            return true;
         },

         getValue: (rowData) => {
            var elem = $$(ids.component);

            return field.getValue(elem, rowData);
         },

         formBusy: ($form) => {
            if (!$form) return;

            if ($form.disable) $form.disable();

            if ($form.showProgress) $form.showProgress({ type: "icon" });
         },

         formReady: ($form) => {
            if (!$form) return;

            if ($form.enable) $form.enable();

            if ($form.hideProgress) $form.hideProgress();
         },

         goToEditPage: (rowId) => {
            if (!this.settings.editForm) return;

            let editForm = this.application.urlResolve(this.settings.editForm);
            if (!editForm) return;

            let $form;
            let $elem = $$(ids.component);
            if ($elem) {
               $form = $elem.getFormView();
            }

            component.logic.formBusy($form);

            setTimeout(() => {
               // Open the form popup
               editPageComponent.onClick().then(() => {
                  let dc = editForm.datacollection;
                  if (dc) {
                     dc.setCursor(rowId);

                     if (!this.__editFormDcEvent) {
                        this.__editFormDcEvent = dc.on(
                           "initializedData",
                           () => {
                              dc.setCursor(rowId);
                           }
                        );
                     }
                  }

                  component.logic.formReady($form);
               });
            }, 50);
         },
      };

      var multiselect = field.settings.linkType == "many";

      component.ui.label = field.label;
      component.ui.labelWidth = settings.labelWidth;
      component.ui.id = ids.component;
      component.ui.view = multiselect ? "multicombo" : "combo";
      component.ui.on = {
         onChange: function (data) {
            let selectedValues;
            if (Array.isArray(data)) {
               selectedValues = [];
               data.forEach((record) => {
                  let recordObj = record;
                  if (typeof record != "object") {
                     // we need to convert either index or uuid to full data object
                     recordObj = field.getItemFromVal(record);
                     // if (!recordObj) {
                     //    recordObj = field.getItemFromUUID(record);
                     // }
                  }
                  // recordObj = field.pullRecordRelationValues(recordObj);
                  if (recordObj && recordObj.id)
                     selectedValues.push(recordObj.id);
               });
            } else {
               selectedValues = data;
               if (typeof data != "object") {
                  // we need to convert either index or uuid to full data object
                  selectedValues = field.getItemFromVal(data);
                  // if (!selectedValues) {
                  //    selectedValues = field.getItemFromUUID(data);
                  // }
               }
               // selectedValues = field.pullRecordRelationValues(selectedValues);
               if (selectedValues && selectedValues.id) {
                  selectedValues = selectedValues.id;
               } else {
                  selectedValues = data;
               }
            }
            // We can now set the new value but we need to block event listening
            // so it doesn't trigger onChange again
            $$(ids.component).blockEvent();
            let prepedVals = selectedValues.join
               ? selectedValues.join()
               : selectedValues;
            $$(ids.component).setValue(prepedVals);
            $$(ids.component).unblockEvent();
         },
      };
      component.ui.suggest = {
         selectAll: multiselect ? true : false,
         body: {
            data: [],
            template: "#value#",
         },
         on: {
            onShow: () => {
               if (this.options.filterValue && this.options.filterValue.id) {
                  let parentVal = $$(this.options.filterValue.id).getValue();
                  if (parentVal) {
                     // if we are filtering based off another selectivity's value we
                     // need to do it on fetch each time because the value can change
                     // copy the filters so we don't add to them every time there is a change
                     let combineFilters = JSON.parse(
                        JSON.stringify(this.options.filters)
                     );

                     // if there is a value create a new filter rule
                     let filter = {
                        key: this.options.filterKey,
                        rule: "equals",
                        value: parentVal,
                     };
                     combineFilters.rules.push(filter);

                     field.once("option.data", (data) => {
                        $$(ids.component).getList().clearAll();
                        $$(ids.component).getList().define("data", data);
                        $$(ids.component).setValue(
                           $$(ids.component).getValue()
                        );
                     });
                     field.getOptions(combineFilters, "").then((data) => {
                        $$(ids.component).getList().clearAll();
                        $$(ids.component).getList().define("data", data);
                        $$(ids.component).setValue(
                           $$(ids.component).getValue()
                        );
                     });
                  }
               } else {
                  field.once("option.data", (data) => {
                     $$(ids.component).getList().clearAll();
                     $$(ids.component).getList().define("data", data);
                     $$(ids.component).setValue($$(ids.component).getValue());
                  });
                  field
                     .getOptions(
                        this.settings.objectWorkspace.filterConditions,
                        ""
                     )
                     .then((data) => {
                        $$(ids.component).getList().clearAll();
                        $$(ids.component).getList().define("data", data);
                        $$(ids.component).setValue(
                           $$(ids.component).getValue()
                        );
                     });
               }
            },
         },
      };

      // component.ui = {
      //    id: ids.component,
      //    view: "forminput",
      //    labelWidth: 0,
      //    paddingY: 0,
      //    paddingX: 0,
      //    label: field.label,
      //    css: "ab-custom-field",
      //    name: field.columnName,
      //    body: {
      //       view: App.custom.focusabletemplate.view,
      //       css: "webix_el_box",
      //       borderless: true,
      //       template: template,
      //       onClick: {
      //          customField: (id, e, trg) => {
      //             if (this.settings.disable == 1) return;
      //
      //             var rowData = {};
      //
      //             if ($$(ids.component)) {
      //                var node = $$(ids.component).$view;
      //                field.customEdit(rowData, App, node);
      //             }
      //          },
      //          "ab-connect-add-new-link": function (e, id, trg) {
      //             e.stopPropagation();
      //             // var topParentView = this.getTopParentView();
      //             // component.logic.openFormPopup(topParentView.config.left, topParentView.config.top);
      //
      //             let $form = this.getFormView();
      //             component.logic.formBusy($form);
      //
      //             let dc = form.datacollection;
      //
      //             setTimeout(() => {
      //                addPageComponent.onClick(dc).then(() => {
      //                   component.logic.formReady($form);
      //                });
      //             }, 50);
      //
      //             return false;
      //          },
      //       },
      //    },
      // };

      // if (settings.showLabel == true && settings.labelPosition == "top") {
      //    component.ui.body.height = 80;
      // } else {
      //    component.ui.body.height = 38;
      // }

      component.ui.onClick = {
         customField: (id, e, trg) => {
            if (this.settings.disable == 1) return;

            var rowData = {};

            if ($$(ids.component)) {
               var node = $$(ids.component).$view;
               field.customEdit(rowData, App, node);
            }
         },
      };

      if (addPageComponent.ui) {
         // reset some component vals to make room for button
         component.ui.label = "";
         component.ui.labelWidth = 0;

         // add click event to add new button
         addPageComponent.ui.on = {
            onItemClick: (id, evt) => {
               let $form = $$(id).getFormView();
               component.logic.formBusy($form);

               let dc = form.datacollection;

               setTimeout(() => {
                  addPageComponent.onClick(dc).then(() => {
                     component.logic.formReady($form);
                  });
               }, 50);

               return false;
            },
         };

         component.ui = {
            rows: [
               {
                  cols: [
                     {
                        view: "label",
                        label: field.label,
                        width: settings.labelWidth,
                        align: "left",
                     },
                     addPageComponent.ui,
                     component.ui,
                  ],
               },
            ],
         };
      } else {
         component.ui = {
            rows: [component.ui],
         };
      }

      component.onShow = () => {
         _onShow(App, ids.component, this, component);
      };

      return component;
   }

   get addPageTool() {
      if (this.__addPageTool == null)
         this.__addPageTool = new ABViewPropertyAddPage();

      return this.__addPageTool;
   }

   get editPageTool() {
      if (this.__editPageTool == null)
         this.__editPageTool = new ABViewPropertyEditPage();

      return this.__editPageTool;
   }
};
