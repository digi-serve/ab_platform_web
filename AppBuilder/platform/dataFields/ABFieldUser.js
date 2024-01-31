const ABFieldConnectCore = require("../../core/dataFields/ABFieldConnectCore");
const ABFieldUserCore = require("../../core/dataFields/ABFieldUserCore");

module.exports = class ABFieldUser extends ABFieldUserCore {
   constructor(values, object, fieldDefaults) {
      super(values, object, fieldDefaults);
   }

   ///
   /// Working with Actual Object Values:
   ///

   async save() {
      // Add new
      if (this.id == null) {
         const SiteUser = this.AB.objectUser();
         const Defaults = ABFieldUserCore.defaults();

         this.settings.linkObject = SiteUser.id;
         this.settings.isCustomFK = 1;

         if (this.settings.isMultiple) {
            this.settings.indexField2 = Defaults.USERNAME_FIELD_ID;
            this.settings.linkType = "many";
            this.settings.linkViaType = "many";
            this.settings.isSource = 1;
         } else {
            this.settings.indexField = Defaults.USERNAME_FIELD_ID;
            this.settings.linkType = "one";
            this.settings.linkViaType = "many";
            this.settings.isSource = 1;
         }

         // TODO: .fieldCustomNew() for saving "local" changes.
         // NOTE: The Object adding this Field sees it's data as a ABFieldUser
         //       connection.
         //       However, the SiteUser will see the data as a ABFieldConnect
         //       connection
         const linkCol = SiteUser.fieldNew({
            key: ABFieldConnectCore.defaults().key,
            columnName: `${this.object.name}_${this.label}`,
            label: this.object.label,
            settings: {
               showIcon: this.settings.showIcon,
               linkObject: this.object.id,
               linkType: this.settings.linkViaType,
               linkViaType: this.settings.linkType,
               isCustomFK: this.settings.isCustomFK,
               indexField: this.settings.indexField,
               indexField2: this.settings.indexField2,
               isSource: 0,
            },
         });

         // // Create definitions of the connected fields
         // // NOTE: skip directly to the ABMLClass.save() to avoid the
         // // migrations caused during the ABField.save() operations.
         // await ABFieldUserCore.prototype.save.call(this);

         // linkCol.settings.linkColumn = this.id;
         // await ABFieldUserCore.prototype.save.call(linkCol);

         // // Update the id value of linked field to connect together
         // this.settings.linkColumn = linkCol.id;
         // await ABFieldUserCore.prototype.save.call(this);

         let newDef = await this.toDefinition().save();
         this.id = newDef.id;

         linkCol.settings.linkColumn = this.id;
         let newLinkDef = await linkCol.toDefinition().save();
         linkCol.id = newLinkDef.id;

         this.settings.linkColumn = linkCol.id;
         await this.toDefinition().save();

         // Add fields to Objects
         await this.object.fieldAdd(this);

         await SiteUser.fieldAdd(linkCol);

         // Create column to DB
         await this.migrateCreate();

         await linkCol.migrateCreate();

         return this;
      } else {
         return super.save();
      }
   }

   // return the grid column header definition for this instance of ABFieldUser

   columnHeader(options) {
      // debugger;
      options = this.setDisplayOptions(options);
      return super.columnHeader(options);
   }

   /**
    * @function customDisplay
    * perform any custom display modifications for this field.
    * @param {object} row is the {name=>value} hash of the current row of data.
    * @param {App} App the shared ui App object useful more making globally
    *             unique id references.
    * @param {HtmlDOM} node  the HTML Dom object for this field's display.
    */
   // customDisplay(row, App, node, options = {}) {
   //    debugger;
   //    options = this.setDisplayOptions(options);
   //
   //    return super.customDisplay(row, App, node, options);
   // }

   setDisplayOptions(options) {
      options = options || {};
      options.editable =
         this.settings.editable != null ? this.settings.editable : true;

      options.isLabelHidden =
         this.settings.isShowUsername != null
            ? !this.settings.isShowUsername
            : false;

      options.additionalText = (opt) => {
         if (!this.settings.isShowProfileImage) return "";

         if (opt.image_id)
            return `<img src='/file/${opt.image_id}' style='border-radius:100%; object-fit: cover; margin: 0 5px 0 -10px;' width='28' height='28' />`;
         else return '<i style="opacity: 0.6;" class="fa fa-user"></i> ';
      };

      return options;
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

   getValue(item) {
      let val = super.getValue(item);

      if (val) {
         if (typeof val == "string")
            val = val.replace(/ab-current-user/g, this.AB.Account.username());
         else if (Array.isArray(val))
            val = val.map((v) =>
               (v?.username ?? v?.uuid ?? v?.id ?? v)?.replace(
                  /ab-current-user/g,
                  this.AB.Account.username()
               )
            );
      }

      return val;
   }

   setValue(item, rowData) {
      let val = rowData[this.columnName];
      // Select "[Current user]" to update
      if (val == "ab-current-user") val = this.AB.Account.username();

      rowData[this.columnName] = val;

      super.setValue(item, rowData);
   }

   getUsers() {
      return this.AB.Account.userList().map((u) => {
         const result = {
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

   getOptions(...params) {
      return super.getOptions(...params).then((options) => {
         // in a ABFieldUser, our options.id elements need to have
         // the username, not the .uuid:
         (options || []).forEach((o) => {
            if (o.username) {
               o.id = o.username;
            }
         });

         return options;
      });
   }
};
