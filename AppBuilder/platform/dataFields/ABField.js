/*
 * ABField
 *
 * An ABField defines a single unique Field/Column in a ABObject.
 *
 */

const ABFieldCore = require("../../core/dataFields/ABFieldCore");

const L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABField extends ABFieldCore {
   constructor(values, object, fieldDefaults) {
      super(values, object, fieldDefaults);

      this.AB.on("ab.abdefinition.update", (def) => {
         if (def.id == this.id) {
            this.emit("definition.updated", this);
         }
      });

      //  	// NOTE: setup this first so later we can use .fieldType(), .fieldIcon()
      //  	this.defaults = fieldDefaults;

      // 	{
      // 		id:'uuid',					// uuid value for this obj
      // 		key:'fieldKey',				// unique key for this Field
      // 		icon:'font',				// fa-[icon] reference for an icon for this Field Type
      // 		label:'',					// pulled from translation
      // 		columnName:'column_name',	// a valid mysql table.column name
      //		settings: {					// unique settings for the type of field
      // 			showIcon:true/false,	// only useful in Object Workspace DataTable
      // 			isImported: 1/0,		// flag to mark is import from other object
      // 			required: 1/0,			// field allows does not allow NULL or it does allow NULL
      // 			width: {int}			// width of display column

      // 		// specific for dataField
      // 		},
      // 		translations:[]
      // 	}

      // 	this.fromValues(values);

      // this.object = object;
   }

   ///
   /// Static Methods
   ///
   /// Available to the Class level object.  These methods are not dependent
   /// on the instance values of the Application.
   ///

   static clearEditor(ids) {
      this._CurrentField = null;

      const defaultValues = {
         label: "",
         columnName: "",
         showIcon: 1,
         required: 0,
         unique: 0,
         validationRules: "",
      };

      for (const f in defaultValues) {
         const component = $$(ids[f]);
         if (component) component.setValue(defaultValues[f]);
      }

      // reset the validation rules UI
      const filterViews = $$(ids.filterComplex).queryView(
         {
            view: "form",
            css: "abValidationForm",
         },
         "all"
      );
      if (filterViews.length) {
         filterViews.forEach((v) => {
            $$(ids.filterComplex).removeView(v);
         });
      }

      $$(ids.addValidation).hide();

      // hide warning message of null data
      $$(ids.numberOfNull).hide();
   }

   /**
    * @function editorPopulate
    *
    * populate the form with the given ABField instance provided.
    *
    * @param {object} ids
    * @param {ABField} field
    */
   static editorPopulate(ids, field) {
      this._CurrentField = field;

      $$(ids.label).setValue(field.label);
      $$(ids.columnName).setValue(field.columnName);
      $$(ids.showIcon).setValue(field.settings.showIcon);
      $$(ids.required).setValue(field.settings.required);
      $$(ids.unique).setValue(field.settings.unique);

      if (this._CurrentField) {
         $$(ids.addValidation).show();
      }

      if (field.settings && field.settings.validationRules) {
         let rules = field.settings.validationRules;
         if (typeof rules == "string") {
            try {
               rules = JSON.parse(rules);
            } catch (e) {
               // continue regardless of error
            }
         }
         (rules || []).forEach((settings) => {
            field.addValidation(ids, settings);
         });
      }
   }

   /**
    * @function definitionEditor
    *
    * Many DataFields share some base information for their usage
    * in the AppBuilder.  The UI Editors have a common header
    * and footer format, and this function allows child DataFields
    * to not have to define those over and over.
    *
    * The common layout header contains:
    *		[Menu Label]
    *		[textBox: labelName]
    *		[text:    description]
    *
    * The defined DataField UI will be added at the end of this.
    *
    * This routine actually updated the live DataField definition
    * with the common header info.
    *
    * @param {DataField} field  The DataField object to work with.
    */
   static definitionEditor(App, ids, _logic, Field) {
      /// TODO: maybe just pass in onChange instead of _logic
      /// if not onChange, then use our default:

      // setup our default labelOnChange functionality:
      let labelOnChange = function (newVal, oldVal) {
         oldVal = oldVal || "";

         if (
            newVal != oldVal &&
            oldVal == $$(ids.columnName).getValue() &&
            $$(ids.columnName).isEnabled()
         ) {
            $$(ids.columnName).setValue(newVal);
         }
      };

      // if they provided a labelOnChange() override, use that:
      if (_logic.labelOnChange) {
         labelOnChange = _logic.labelOnChange;
      }

      let requiredOnChange = function (newVal, oldVal, ids) {
         console.warn(
            "Field has not implemented .requiredOnChange() is that okay?"
         );
      };

      const addValidation = (ids) => {
         return this._CurrentField.addValidation(ids);
      };

      // if the provided a requriedOnChange() override, use that:
      if (_logic.requiredOnChange) {
         requiredOnChange = _logic.requiredOnChange;
      }

      const getNumberOfNullValue = async (isRequired) => {
         if (
            isRequired &&
            this._CurrentField &&
            this._CurrentField.id &&
            this._CurrentField.settings.required != isRequired
         ) {
            // TODO: disable save button

            // get count number
            const data = await this._CurrentField.object.model().count({
               where: {
                  glue: "and",
                  rules: [
                     {
                        key: this._CurrentField.id,
                        rule: "is_null",
                     },
                  ],
               },
            });

            if (data.count > 0) {
               const messageTemplate = L(
                  "** There are {0} rows that will be updated to default value",
                  [data.count]
               );

               $$(ids.numberOfNull).setValue(messageTemplate);
               $$(ids.numberOfNull).show();
            } else {
               $$(ids.numberOfNull).hide();
            }

            // TODO: enable save button
         } else {
            $$(ids.numberOfNull).hide();
         }
      };

      const _ui = {
         // id: ids.component,
         rows: [
            // {
            // 	view: "label",
            // 	label: "<span class='webix_icon fa fa-{0}'></span>{1}".replace('{0}', Field.icon).replace('{1}', Field.menuName)
            // },
            {
               view: "text",
               id: ids.label,
               name: "label",
               label: L("Label"),
               placeholder: L("Label"),
               labelWidth: this.AB.UISettings.config().labelWidthLarge,
               css: "ab-new-label-name",
               on: {
                  onChange: function (newVal, oldVal) {
                     labelOnChange(newVal, oldVal);
                  },
               },
            },
            {
               view: "text",
               id: ids.columnName,
               name: "columnName",
               disallowEdit: true,
               label: L("Field Name"),
               labelWidth: this.AB.UISettings.config().labelWidthLarge,
               placeholder: L("Database field name"),
            },
            {
               view: "label",
               id: ids.fieldDescription,
               label: L("Description"),
               align: "right",
            },
            {
               view: "checkbox",
               id: ids.showIcon,
               name: "showIcon",
               labelRight: App.labels.dataFieldShowIcon, // 'Show icon',
               labelWidth: this.AB.UISettings.config().labelWidthCheckbox,
               value: true,
            },
            {
               view: "checkbox",
               id: ids.required,
               name: "required",
               hidden: !Field.supportRequire,
               labelRight: App.labels.required,
               // disallowEdit: true,
               labelWidth: this.AB.UISettings.config().labelWidthCheckbox,
               on: {
                  onChange: async (newVal, oldVal) => {
                     requiredOnChange(newVal, oldVal, ids);

                     // If check require on edit field, then show warning message
                     await getNumberOfNullValue(newVal);
                  },
               },
            },
            // warning message: number of null value rows
            {
               view: "label",
               id: ids.numberOfNull,
               css: { color: "#f00" },
               label: "",
               hidden: true,
            },

            {
               view: "checkbox",
               id: ids.unique,
               name: "unique",
               hidden: !Field.supportUnique,
               labelRight: App.labels.unique,
               disallowEdit: true,
               labelWidth: this.AB.UISettings.config().labelWidthCheckbox,
            },
            {
               id: ids.filterComplex,
               rows: [],
            },
            {
               id: ids.addValidation,
               view: "button",
               label: L("Add Field Validation"),
               css: "webix_primary",
               click: () => {
                  addValidation(ids);
               },
            },
            // have a hidden field to contain the validationRules
            // value we will parse out later
            {
               id: ids.validationRules,
               view: "text",
               hidden: true,
               name: "validationRules",
            },
         ],
      };

      return _ui;
   }

   static editorValues(settings) {
      const obj = {
         label: settings.label,
         columnName: settings.columnName,
         settings: settings,
      };

      delete settings.label;
      delete settings.columnName;

      return obj;
   }

   addValidation(ids, settings) {
      const App = this.object.application.App;
      const Filter = this.AB.filterComplexNew(
         `${this.id}_field_validation_rules`
      );
      $$(ids.filterComplex).addView({
         view: "form",
         css: "abValidationForm",
         cols: [
            {
               rows: [
                  {
                     view: "text",
                     name: "invalidMessage",
                     labelWidth: this.AB.UISettings.config().labelWidthLarge,
                     value:
                        settings && settings.invalidMessage
                           ? settings.invalidMessage
                           : "",
                     label: L("Invalid Message"),
                  },
                  Filter.ui,
               ],
            },
            {
               view: "button",
               css: "webix_danger",
               icon: "fa fa-trash",
               type: "icon",
               autowidth: true,
               click: function () {
                  const $viewCond = this.getParentView();
                  $$(ids.filterComplex).removeView($viewCond);
               },
            },
         ],
      });
      $$(Filter.ids.save).hide();
      // Filter.applicationLoad(this.object.application);
      Filter.fieldsLoad(this.object.fields());
      if (settings && settings.rules) Filter.setValue(settings.rules);
   }

   /*
    * @method isValid
    * check the current values to make sure they are valid.
    * Here we check the default values provided by ABField.
    *
    * @return null or [{OP.Validation.validator()}] objects.
    */
   isValid() {
      const validator = this.AB.Validation.validator();

      // .columnName must be unique among fileds on the same object
      const isNameUnique =
         this.object.fields((f) => {
            return (
               f.id != this.id &&
               f.columnName.toLowerCase() == this.columnName.toLowerCase()
            );
         }).length == 0;
      if (!isNameUnique) {
         validator.addError(
            "columnName",
            L(
               "Field columnName must be unique ({0} already used in this Application)",
               [this.columnName]
            )
         );
      }

      return validator;
   }

   ///
   /// Instance Methods
   ///

   /// ABApplication data methods

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
      // verify we have been .save() before:
      if (!this.id) return;

      // NOTE: our .migrateXXX() routines expect the object to currently exist
      // in the DB before we perform the DB operations.  So we need to
      // .migrateDrop()  before we actually .objectDestroy() this.
      await this.migrateDrop();

      // the server still references an ABField in relationship to it's
      // ABObject, so we need to destroy the Field 1st, then remove it
      // from it's object.
      await super.destroy();

      await this.object.fieldRemove(this);
   }

   /**
    * @method save()
    *
    * persist this instance of ABField with it's parent ABObject
    *
    *
    * @return {Promise}
    *						.resolve( {this} )
    */
   async save() {
      let isAdd = false;
      // if this is our initial save()
      if (!this.id) {
         isAdd = true;
      }

      // Whenever we update our settings, make sure any
      // existing rows that have NULL values for this field
      // are updated to have our current .default value.
      if (!isAdd && this.settings.required && this.settings.default) {
         const model = this.object.model();

         // pull rows that has null value
         const result = await model.findAll({
            where: {
               glue: "and",
               rules: [
                  {
                     key: this.id,
                     rule: "is_null",
                  },
               ],
            },
         });

         const tasks = [];

         // updating ...
         result.data.forEach((d) => {
            if (!d[this.columnName]) d[this.columnName] = this.settings.default;

            tasks.push(model.update(d.id, d));
         });

         await Promise.all(tasks);
      }

      // New ABDefinition method of saving:
      // when this is done, we now have an .id
      await super.save();

      // incase this was an ADD operation, make sure the
      // parent Obj now includes this object:
      // NOTE: must be done after the .save() so we have an .id
      await this.object.fieldAdd(this);

      // perform any server side migrations for this Field:

      // but not connectObject fields:
      // ABFieldConnect.migrateXXX() gets called from the UI popupNewDataField
      // in order to handle the timings of the 2 fields that need to be created
      if (!this.isConnection) {
         const fnMigrate = isAdd ? this.migrateCreate() : this.migrateUpdate();
         await fnMigrate;
      }

      return this;
   }

   ///
   /// DB Migrations
   ///

   migrateCreate() {
      return this.AB.Network.post({
         url: `/definition/migrate/object/${this.object.id}/field/${this.id}`,
      });
   }

   migrateUpdate() {
      return this.AB.Network.put({
         url: `/definition/migrate/object/${this.object.id}/field/${this.id}`,
      });
   }

   migrateDrop() {
      return this.AB.Network["delete"]({
         url: `/definition/migrate/object/${this.object.id}/field/${this.id}`,
      });
   }

   ///
   /// Working with Actual Object Values:
   ///

   /**
    * @function columnHeader
    * Return the column header for a webix grid component for this specific
    * data field.
    * @param {Object} options
    * {
    *    isObjectWorkspace: {bool},  is this being used in the Object workspace.
    *    width: {int},
    *    height: {int},
    *    editable: {bool}
    * }
    * @return {obj}  configuration obj
    */
   columnHeader(options) {
      options = options || {};

      const config = {
         id: this.columnName, // this.id,
         header: this.label,
      };

      if (options.isObjectWorkspace && this.settings.showIcon) {
         config.header = `<span class="webix_icon fa fa-${this.fieldIcon()}"></span>${
            config.header
         }`;
      }

      return config;
   }

   /*
    * @function customDisplay
    * perform any custom display modifications for this field.  If this isn't
    * a standard value display (think image, Map, graph, etc...) then use this
    * method to create the display in the table/grid cell.
    * @param {object} row
    *        is the {name=>value} hash of the current row of data.
    * @param {App} App
    *        the shared ui App object useful more making globally
    *			 unique id references.
    * @param {HtmlDOM} node
    *        the HTML Dom object for this field's display.
    * @param {object} options
    *        option of additional settings
    */
   customDisplay(row, App, node, options) {}

   /*
    * @function customEdit
    *
    *
    *
    * @param {object} row is the {name=>value} hash of the current row of data.
    * @param {App} App the shared ui App object useful more making globally
    *					unique id references.
    * @param {HtmlDOM} node  the HTML Dom object for this field's display.
    */
   customEdit(row, App, node) {
      return true;
   }

   /**
    * @method getValue
    * this function uses for form component and mass update popup
    * to get value of fields that apply custom editor
    *
    * @param {Object} item - Webix element
    * @param {Object} rowData - data of row
    *
    * @return {Object}
    */
   getValue(item, rowData) {
      return item.getValue();
   }

   /**
    * @method setValue
    * this function uses for form component and mass update popup
    * to get value of fields that apply custom editor
    *
    * @param {Object} item - Webix element
    * @param {Object} rowData - data of row
    *
    */
   setValue(item, rowData, defaultValue) {
      if (!item) return;

      let val;

      if (
         (rowData == null || rowData[this.columnName] == null) &&
         defaultValue != null
      ) {
         val = defaultValue;
      } else if (rowData && rowData[this.columnName] != null) {
         val = rowData[this.columnName];
      } else {
         val = rowData;
      }

      item.setValue(val);
   }

   /**
    * @method formComponent
    * returns a drag and droppable component that is used on the UI
    * interface builder to place form components related to this ABField.
    *
    * an ABField defines which form component is used to edit it's contents.
    * However, what is returned here, needs to be able to create an instance of
    * the component that will be stored with the ABViewForm.
    */
   formComponent(formKey) {
      // NOTE: what is being returned here needs to mimic an ABView CLASS.
      // primarily the .common() and .newInstance() methods.

      return {
         // .common() is used to create the display in the list
         common: () => {
            return {
               key: formKey,

               // // but since this is a common place holder: use the
               // // multilingual label here:
               // labelKey: 'ab.abfield.labelPlaceholder',
               // icon:  'square'
            };
         },

         // .newInstance() is used to create the view instance when the component
         // 		is dropped onto the ABView list.
         newInstance: (application, parent) => {
            // NOTE: in case you were wondering, the base ABField
            // 		 will just return a label with 'ABFieldPlaceholder'
            // 		 as the text.  Any sub class of ABField should overwrite
            // 		 this and return an actual Form Component.

            // store object id and field id to field component
            const values = this.formComponent().common();
            values.settings = values.settings || {};
            values.settings.objectId = this.object.id;
            values.settings.fieldId = this.id;

            const ABFieldPlaceholder = application.viewNew(
               values,
               application,
               parent
            ); // ABViewManager.newView(values, application, parent);
            // ABFieldPlaceholder.formatTitle();
            // ABFieldPlaceholder.text = "ABFieldPlaceholder";

            return ABFieldPlaceholder;
         },
      };
   }

   /**
    * @method detailComponent
    */
   detailComponent() {
      return {
         common: () => {
            return {
               icon: "square",
            };
         },

         // .newInstance() is used to create the view instance when the component
         // 		is dropped onto the ABView list.
         newInstance: (application, parent) => {
            // store object id and field id to field component
            const values = this.detailComponent().common();
            values.settings = values.settings || {};
            values.settings.objectId = this.object.id;
            values.settings.fieldId = this.id;

            const ABFieldPlaceholder = application.viewNew(
               values,
               application,
               parent
            ); // ABViewManager.newView(values, application, parent);

            return ABFieldPlaceholder;
         },
      };
   }
};
