var ABFieldUserCore = require("../../core/dataFields/ABFieldUserCore");
var ABFieldComponent = require("./ABFieldComponent");

function L(key, altText) {
   return AD.lang.label.getLabel(key) || altText;
}

var ids = {
   editable: "ab-user-editable",
   isMultiple: "ab-user-multiple-option",
   isCurrentUser: "ab-user-current-user-option",
   isShowProfileImage: "ab-user-show-profile-image-option",
   isShowUsername: "ab-user-show-username-option",
};

/**
 * ABFieldUserComponent
 *
 * Defines the UI Component for this Data Field.  The ui component is responsible
 * for displaying the properties editor, populating existing data, retrieving
 * property values, etc.
 */
var ABFieldUserComponent = new ABFieldComponent({
   fieldDefaults: ABFieldUserCore.defaults(),

   elements: function (App, field) {
      ids = field.idsUnique(ids, App);

      return [
         {
            view: "checkbox",
            name: "isMultiple",
            id: ids.isMultiple,
            disallowEdit: true,
            labelRight: L(
               "ab.dataField.user.isMultiple",
               "*Allow multiple users"
            ),
            labelWidth: App.config.labelWidthCheckbox,
         },
         {
            view: "checkbox",
            name: "isCurrentUser",
            id: ids.isCurrentUser,
            labelRight: L(
               "ab.dataField.user.isCurrentUser",
               "*Default value as current user"
            ),
            labelWidth: App.config.labelWidthCheckbox,
            on: {
               onChange: function (newValue, oldValue) {
                  if (newValue == 0) {
                     $$(ids.editable).setValue(1);
                     $$(ids.editable).hide();
                  } else {
                     $$(ids.editable).setValue(1);
                     $$(ids.editable).show();
                  }
               },
            },
         },
         {
            view: "checkbox",
            name: "editable",
            hidden: true,
            id: ids.editable,
            labelRight: L("ab.dataField.user.editableLabel", "*Editable"),
            labelWidth: App.config.labelWidthCheckbox,
         },
         {
            view: "checkbox",
            name: "isShowProfileImage",
            hidden: true, // NOTE: The user field equal to the connect field
            id: ids.isShowProfileImage,
            labelRight: L(
               "ab.dataField.user.isShowProfileImage",
               "*Show Profile Image"
            ),
            labelWidth: App.config.labelWidthCheckbox,
         },
         {
            view: "checkbox",
            name: "isShowUsername",
            hidden: true, // NOTE: The user field equal to the connect field
            id: ids.isShowUsername,
            labelRight: L("ab.dataField.user.showUsername", "*Show Username"),
            labelWidth: App.config.labelWidthCheckbox,
         },
      ];
   },

   // defaultValues: the keys must match a .name of your elements to set it's default value.
   defaultValues: ABFieldUserCore.defaultValues(),

   // rules: basic form validation rules for webix form entry.
   // the keys must match a .name of your .elements for it to apply
   rules: {
      // 'textDefault':webix.rules.isNotEmpty,
      // 'supportMultilingual':webix.rules.isNotEmpty
   },

   // include additional behavior on default component operations here:
   // The base routines will be processed first, then these.  Any results
   // from the base routine, will be passed on to these:
   // 	@param {obj} ids  the list of ids used to generate the UI.  your
   //					  provided .elements will have matching .name keys
   //					  to access them here.
   //  @param {obj} values the current set of values provided for this instance
   // 					  of ABField:
   //					  {
   //						id:'',			// if already .saved()
   // 						label:'',
   // 						columnName:'',
   //						settings:{
   //							showIcon:'',
   //
   //							your element key=>values here
   //						}
   //					  }
   //
   // 		.clear(ids)  : reset the display to an empty state
   // 		.isValid(ids, isValid): perform validation on the current editor values
   // 		.populate(ids, values) : populate the form with your current settings
   // 		.show(ids)   : display the form in the editor
   // 		.values(ids, values) : return the current values from the form
   logic: {},

   // perform any additional setup actions here.
   // @param {obj} ids  the hash of id values for all the current form elements.
   //					 it should have your elements + the default Header elements:
   //						.label, .columnName, .fieldDescription, .showIcon
   init: function (ids) {
      // want to hide the description? :
      // $$(ids.fieldDescription).hide();
   },
});

module.exports = class ABFieldUser extends ABFieldUserCore {
   constructor(values, object) {
      super(values, object);
   }

   /**
    * @function propertiesComponent
    *
    * return a UI Component that contains the property definitions for this Field.
    *
    * @param {App} App the UI App instance passed around the Components.
    * @param {stirng} idBase
    * @return {Component}
    */
   static propertiesComponent(App, idBase) {
      return ABFieldUserComponent.component(App, idBase);
   }

   ///
   /// Working with Actual Object Values:
   ///

   save() {
      // Add new
      if (this.id == null) {
         const SITE_USER_OBJECT_ID = "228e3d91-5e42-49ec-b37c-59323ae433a1"; // TODO: How to get the id of SITE_USER object properly ?
         this.settings.linkObject = SITE_USER_OBJECT_ID;
         if (this.settings.isMultiple) {
            this.settings.linkType = "many";
            this.settings.linkViaType = "many";
            this.settings.isSource = 1;
         } else {
            this.settings.linkType = "one";
            this.settings.linkViaType = "many";
            this.settings.isSource = 1;
         }
         let linkObject = this.datasourceLink;
         let linkCol = linkObject.fieldNew({
            key: ABFieldUserCore.defaults().key,
            columnName: this.object.tableName,
            label: this.object.label,
            settings: {
               showIcon: this.settings.showIcon,
               linkObject: this.object.id,
               linkType: this.settings.linkViaType,
               linkViaType: this.settings.linkType,
               isCustomFK: false,
               isSource: 0
            }
         });
         return (
            Promise.resolve()
               // Create definitions of the connected fields
               .then(() => ABMLClass.prototype.save.call(this))
               .then(() => {
                  linkCol.settings.linkColumn = this.id;
                  return ABMLClass.prototype.save.call(linkCol);
               })
               // Update the id value of linked field to connect together
               .then(() => {
                  this.settings.linkColumn = linkCol.id;
                  return ABMLClass.prototype.save.call(this);
               })
               // Add fields to Objects
               .then(() => this.object.fieldAdd(this))
               .then(() => linkObject.fieldAdd(linkCol))
               // Create column to DB
               .then(() => this.migrateCreate())
               // .then(() => linkCol.migrateCreate())
               .then(() => {
                  this.object.model().refresh();
                  linkCol.object.model().refresh();
                  return Promise.resolve(this);
               })
         );
      } else {
         return super.save();
      }
   }

   // return the grid column header definition for this instance of ABFieldUser
   columnHeader(options) {
      options = options || {};
      options.editable = this.settings.editable;
      return super.columnHeader(options);
   }

   /**
    * @function customDisplay
    * perform any custom display modifications for this field.
    * @param {object} row is the {name=>value} hash of the current row of data.
    * @param {App} App the shared ui App object useful more making globally
    *					unique id references.
    * @param {HtmlDOM} node  the HTML Dom object for this field's display.
    */
   customDisplay(row, App, node, options) {
      options = options || {};
      options.editable = this.settings.editable;
      return super.customDisplay(row, App, node, options);
   }

   /**
    * @method defaultValue
    * insert a key=>value pair that represent the default value
    * for this field.
    * @param {obj} values a key=>value hash of the current values.
    */
   defaultValue(values) {
      if (this.settings.isCurrentUser) {
         if (this.settings.isMultiple) {
            values[this.columnName] = [
               {
                  id: this.AB.Account.username(),
                  text: this.AB.Account.username(),
               },
            ];
         } else {
            values[this.columnName] = this.AB.Account.username();
         }
      }
   }

   setValue(item, rowData) {
      var val = rowData[this.columnName];
      // Select "[Current user]" to update
      if (val == "ab-current-user") val = this.AB.Account.username();

      rowData[this.columnName] = val;

      super.setValue(item, rowData);
   }

   getUsers() {
      console.error(
         "REFACTOR: what is the context of this OP.User.userlise()?"
      );
      return OP.User.userlist().map((u) => {
         var result = {
            id: u.username,
            image: u.image_id,
         };

         if (this.settings.isMultiple) {
            result.text = u.username;
         } else {
            result.value = u.username;
         }

         return result;
      });
   }
};
