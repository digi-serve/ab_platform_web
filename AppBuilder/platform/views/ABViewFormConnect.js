const ABViewFormConnectCore = require("../../core/views/ABViewFormConnectCore");
const ABViewPropertyAddPage = require("./viewProperties/ABViewPropertyAddPage")
   .default;
const ABViewPropertyEditPage = require("./viewProperties/ABViewPropertyEditPage")
   .default;

const ABViewFormConnectPropertyComponentDefaults = ABViewFormConnectCore.defaultValues();

const ABPopupSort = require("../../../ABDesigner/ab_work_object_workspace_popupSortFields");

let FilterComponent = null;
let SortComponent = null;

let L = (...params) => AB.Multilingual.label(...params);

function _onShow(App, compId, instance, component) {
   const elem = $$(compId);

   if (!elem) return;

   const field = instance.field();

   if (!field) return;

   const node = elem.$view;

   if (!node) return;

   const $node = $$(node);

   if (!$node) return;

   let filterConditions = {
      glue: "and",
      rules: [],
   };

   if (instance.settings?.filterConditions?.rules?.length) {
      filterConditions = instance.settings.filterConditions;
   } else if (
      instance.settings?.objectWorkspace?.filterConditions?.rules?.length
   ) {
      filterConditions = instance.settings.objectWorkspace.filterConditions;
   }

   const getFilterByConnectValues = (conditions, depth = 0) => {
      return [
         ...conditions.rules
            .filter((e) => e.rule === "filterByConnectValue")
            .map((e) => {
               const filterByConnectValue = Object.assign({}, e);

               filterByConnectValue.depth = depth;

               return filterByConnectValue;
            }),
      ].concat(
         ...conditions.rules
            .filter((e) => e.glue)
            .map((e) => getFilterByConnectValues(e, depth + 1))
      );
   };

   const filterByConnectValues = getFilterByConnectValues(filterConditions).map(
      (e) => {
         for (const key in instance.parent.viewComponents) {
            const $ui = $$(instance.parent.viewComponents[key].ui.inputId);

            if ($ui?.config?.name === e.value) {
               // we need to use the element id stored in the settings to find out what the
               // ui component id is so later we can use it to look up its current value
               e.filterValue = $ui;

               break;
            }
         }

         const field = instance.AB.objectByID(
            instance.settings.objectId
         ).fieldByID(instance.settings.fieldId);
         const linkedObject = instance.AB.objectByID(field.settings.linkObject);
         const linkedField = linkedObject.fieldByID(e.key);

         if (linkedField.settings.isCustomFK) {
            // finally if this is a custom foreign key we need the stored columnName by
            // default uuid is passed for all non CFK
            e.filterColumn = instance.AB.objectByID(
               linkedField.settings.linkObject
            ).fields(
               (filter) =>
                  filter.id === linkedField.settings.indexField ||
                  linkedField.settings.indexField2
            )[0].columnName;
         } else e.filterColumn = null;

         return e;
      }
   );

   instance.options = {
      formView: instance.settings.formView,
      filters: filterConditions,
      sort: instance.settings.objectWorkspace.sortFields,
      editable: instance.settings.disable === 1 ? false : true,
      editPage:
         !instance.settings.editForm || instance.settings.editForm === "none"
            ? false
            : true,
      filterByConnectValues,
   };

   // if this field's options are filtered off another field's value we need
   // to make sure the UX helps the user know what to do.
   // fetch the options and set placeholder text for this view
   if (instance.options.editable) {
      const parentFields = [];

      for (let i = 0; i < filterByConnectValues?.length; i++) {
         if (
            filterByConnectValues[i].filterValue &&
            filterByConnectValues[i].key
         ) {
            const $filterValueConfig = $$(
               filterByConnectValues[i].filterValue.config.id
            );

            let parentField = null;

            if (!$filterValueConfig) {
               // this happens in the Interface Builder when only the single form UI is displayed
               parentField = {
                  id: "perentElement",
                  label: L("PARENT ELEMENT"),
               };
            } else {
               const value = field.getValue($filterValueConfig);

               if (!value) {
                  // if there isn't a value on the parent select element set this one to readonly and change placeholder text
                  parentField = {
                     id: filterByConnectValues[i].filterValue.config.id,
                     label: $filterValueConfig.config.label,
                  };
               }

               $filterValueConfig.attachEvent(
                  "onChange",
                  (e) => {
                     const parentVal = $filterValueConfig.getValue();

                     if (parentVal) {
                        $node.define("disabled", false);
                        $node.define("placeholder", L("Select items"));
                        field.getAndPopulateOptions(
                           $node,
                           instance.options,
                           field,
                           instance.parentFormComponent()
                        );
                     } else {
                        $node.define("disabled", true);
                        $node.define(
                           "placeholder",
                           L("Must select item from '{0}' first.", [
                              $filterValueConfig.config.label,
                           ])
                        );
                     }

                     $node.setValue("");
                     $node.refresh();
                  },
                  false
               );
            }

            if (
               parentField &&
               parentFields.findIndex((e) => e.id === parentField.id) < 0
            )
               parentFields.push(parentField);
         }
      }

      if (parentFields.length && !$node.getValue()) {
         $node.define("disabled", true);
         $node.define(
            "placeholder",
            L(
               `Must select item from ${parentFields
                  .map((e, i) => `'{${i}}'`)
                  .join(", ")} first.`,
               parentFields.map((e) => e.label)
            )
         );
      } else {
         $node.define("disabled", false);
         $node.define("placeholder", L("Select items"));
      }
   } else {
      $node.define("placeholder", "");
      $node.define("disabled", true);
   }

   $node.refresh();

   field.getAndPopulateOptions(
      $node,
      instance.options,
      field,
      instance.parentFormComponent()
   );
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
      this.__filterComponent = this.AB.filterComplexNew(
         `${this.id}__filterComponent`
      );
      // this.__filterComponent.applicationLoad(application);
      this.__filterComponent.fieldsLoad(
         this.datasource ? this.datasource.fields() : [],
         this.datasource ? this.datasource : null
      );

      if (
         !this.settings.objectWorkspace ||
         !this.settings.objectWorkspace.filterConditions
      ) {
         this.AB.error("Error: filter conditions do not exist", {
            error: "filterConditions do not exist",
            viewLocation: {
               application: this.application.name,
               id: this.id,
               name: this.label,
            },
            view: this,
         });
         // manually place an empty filter
         this.settings["objectWorkspace"] = {};
         this.settings["objectWorkspace"]["filterConditions"] = { glue: "and" };
      }

      this.__filterComponent.setValue(
         this.settings.objectWorkspace.filterConditions ??
            ABViewFormConnectPropertyComponentDefaults.filterConditions
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

      _logic.showSortPopup = ($button) => {
         SortComponent.show($button, null, {
            pos: "top",
         });
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

      _logic.onSortChange = () => {
         let view = _logic.currentEditObject();
         this.propertyEditorSave(ids, view);
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
                  {
                     height: 30,
                  },
                  {
                     rows: [
                        {
                           cols: [
                              {
                                 view: "label",
                                 label: L("Sort Options:"),
                                 width: App.config.labelWidthLarge,
                              },
                              {
                                 view: "button",
                                 name: "buttonSort",
                                 css: "webix_primary",
                                 label: L("Settings"),
                                 icon: "fa fa-gear",
                                 type: "icon",
                                 badge: 0,
                                 click: function () {
                                    _logic.showSortPopup(this.$view);
                                 },
                              },
                           ],
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
      this.addPageProperty.setSettings(view, view.settingsAddPage);
      this.editPageProperty.setSettings(view, view.settingsEditPage);
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
         sortFields: SortComponent.getValue(),
      };

      view.settingsAddPage = this.addPageProperty.getSettings(view);
      view.settingsEditPage = this.editPageProperty.getSettings(view);

      // refresh settings of app page tool
      view.addPageTool.fromSettings(view.settingsAddPage);
      view.editPageTool.fromSettings(view.settingsEditPage);
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

      if (
         view.settings.objectWorkspace &&
         view.settings.objectWorkspace.sortFields &&
         view.settings.objectWorkspace.sortFields.length
      ) {
         $$(ids.buttonSort).define(
            "badge",
            view.settings.objectWorkspace.sortFields.length || null
         );
         $$(ids.buttonSort).refresh();
      } else {
         $$(ids.buttonSort).define("badge", null);
         $$(ids.buttonSort).refresh();
      }
   }

   static initPopupEditors(App, ids, _logic) {
      var idBase = "ABViewFormConnectPropertyEditor";

      FilterComponent = this.AB.filterComplexNew(`${idBase}_filter`);
      FilterComponent.init();
      // when we make a change in the popups we want to make sure we save the new workspace to the properties to do so just fire an onChange event
      FilterComponent.on("change", (val) => {
         _logic.onFilterChange(val);
      });

      SortComponent = new ABPopupSort(this.App, `${idBase}_sort`);
      SortComponent.init({
         onChange: _logic.onSortChange,
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
      let linkedObj;
      let field = view.field();
      if (field) {
         linkedObj = field.datasourceLink;
         if (linkedObj)
            FilterComponent.fieldsLoad(linkedObj.fields(), linkedObj);
      }

      FilterComponent.setValue(filterConditions);

      if (linkedObj) SortComponent.objectLoad(linkedObj);
      SortComponent.setValue(view.settings.objectWorkspace.sortFields);
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

      let addPageComponent = this.addPageTool.component(App, idBase);
      let editPageComponent;

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

            field.once("option.data", (data) => {
               data.forEach((item) => {
                  item.value = item.text;
               });
               $$(ids.component).getList().clearAll();
               $$(ids.component).getList().define("data", data);
               if (field.settings.linkType == "many") {
                  let currentVals = $$(ids.component).getValue();
                  if (currentVals.indexOf(saveData.id) == -1) {
                     $$(ids.component).setValue(
                        currentVals
                           ? currentVals + "," + saveData.id
                           : saveData.id
                     );
                  }
               } else {
                  $$(ids.component).setValue(saveData.id);
               }
               // close the popup when we are finished
               $$(ids.popup)?.close();
               $$(ids.editpopup)?.close();
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

            // Open the form popup
            editPageComponent.onClick().then(() => {
               let dc = editForm.datacollection;
               if (dc) {
                  dc.setCursor(rowId);

                  if (!this.__editFormDcEvent) {
                     this.__editFormDcEvent = dc.on("initializedData", () => {
                        dc.setCursor(rowId);
                     });
                  }
               }
            });
         },
      };

      var multiselect = field.settings.linkType == "many";

      component.ui.label = field.label;
      component.ui.labelWidth = settings.labelWidth;
      component.ui.id = ids.component;
      component.ui.view = multiselect ? "multicombo" : "combo";
      component.ui.on = {
         onItemClick: (id, e) => {
            if (
               e.target.classList.contains("editConnectedPage") &&
               e.target.dataset.itemId
            ) {
               let rowId = e.target.dataset.itemId;
               if (!rowId) return;
               component.logic.goToEditPage(rowId);
            }
         },
         onChange: (data) => {
            let selectedValues;
            if (Array.isArray(data)) {
               selectedValues = [];
               data.forEach((record) => {
                  let recordObj = record;
                  if (typeof record != "object") {
                     // we need to convert either index or uuid to full data object
                     recordObj = field.getItemFromVal(record);
                  }
                  if (recordObj && recordObj.id)
                     selectedValues.push(recordObj.id);
               });
            } else {
               selectedValues = data;
               if (typeof data != "object") {
                  // we need to convert either index or uuid to full data object
                  selectedValues = field.getItemFromVal(data);
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
            const $$component = $$(ids.component);
            if ($$component) {
               $$component.blockEvent();
               let prepedVals = selectedValues.join
                  ? selectedValues.join()
                  : selectedValues;
               $$component.setValue(prepedVals);
               $$component.unblockEvent();
            }
         },
      };

      component.ui.dataFieldId = field.id;

      let editForm = "";
      if (settings.editForm && settings.editForm != "") {
         editForm =
            '<i data-item-id="#id#" class="fa fa-cog editConnectedPage"></i>';
      }
      component.ui.suggest = {
         button: true,
         selectAll: multiselect ? true : false,
         body: {
            template: editForm + "#value#",
         },
         on: {
            onShow: () => {
               field.populateOptionsDataCy($$(ids.component), field, form);
            },
         },
         // Support partial matches
         filter: ({ value }, search) =>
            value.toLowerCase().includes(search.toLowerCase()),
      };

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

               let dc = form.datacollection;

               addPageComponent.onClick(dc);

               return false;
            },
         };

         component.ui = {
            inputId: component.ui.id,
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
            inputId: component.ui.id,
            rows: [component.ui],
         };
      }

      component.onShow = () => {
         _onShow(App, ids.component, this, component);
         let elem = $$(ids.component);
         if (!elem) return;

         let node = elem.$view;

         // Add data-cy attributes
         const dataCy = `${field.key} ${field.columnName} ${field.id} ${this.parent.id}`;
         node.setAttribute("data-cy", dataCy);
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
