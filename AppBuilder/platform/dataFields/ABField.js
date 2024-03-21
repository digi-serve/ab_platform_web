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
               "Field columnName must be unique ({0} already used in this Object)",
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
   async save(skipMigrate = false) {
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
      if (!this.isConnection && !skipMigrate) {
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

      try {
         item.setValue(val);
      } catch (err) {
         // this error is fine because we handled it already
      }
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

      let FC = {
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
            application = application ?? this.AB._mockApp;

            // NOTE: in case you were wondering, the base ABField
            // 		 will just return a label with 'ABFieldPlaceholder'
            // 		 as the text.  Any sub class of ABField should overwrite
            // 		 this and return an actual Form Component.

            // store object id and field id to field component
            const values = FC.common();
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
      return FC;
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
            application = application ?? this.AB._mockApp;

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

   /**
    * @method getSettings()
    * return a copy of this.settings.
    * @return {object}
    */
   getSettings() {
      return Object.assign({}, this.settings);
   }

   /**
    * @method warningsMessage()
    * generate a commonly formatted warning message for this ABField.
    * This is expected to be called from within a .warningsEval()
    * method when generating warnings.
    * @param {string} msg
    *        the warning string to display
    * @param {json} data
    *        any relevant additional information for a developer to refer to.
    */
   warningsMessage(msg, data = {}) {
      let message = `${this.fieldKey()}[${this.label}]: ${msg}`;
      this._warnings.push({ message, data });
   }

   async getDbInfo() {
      return this.AB.Network.get({
         url: `/definition/info/object/${this.object.id}/field/${this.id}`,
      });
   }
};
