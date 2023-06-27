const ABFieldDateTimeCore = require("../../core/dataFields/ABFieldDateTimeCore");

module.exports = class ABFieldDateTime extends ABFieldDateTimeCore {
   constructor(values, object) {
      super(values, object);
   }

   ///
   /// Instance Methods
   ///

   // isValid() {
   //    const validator = super.isValid();

   //    // validator.addError('columnName', L('ab.validation.object.name.unique', 'Field columnName must be unique (#name# already used in this Application)').replace('#name#', this.name) );

   //    return validator;
   // }

   ///
   /// Working with Actual Object Values:
   ///

   // return the grid column header definition for this instance of ABFieldDate
   columnHeader(options) {
      const config = super.columnHeader(options);

      // Ignore date
      if (this.settings.dateFormat == 1) {
         config.editor = "time";
      } else {
         config.editor =
            this.AB.Account?._config?.languageCode == "th"
               ? "thaidatetime"
               : "datetime";
      }

      // allows entering characters in datepicker input, false by default
      config.editable = true;

      // NOTE: it seems that the default value is a string in ISO format.

      //// NOTE: webix seems unable to parse ISO string into => date here.
      // config.map = '(date)#'+this.columnName+'#';   // so don't use this.

      config.template = (row) => {
         if (row.$group) return row[this.columnName];

         return this.format(row);
      };

      config.format = (d) => {
         const rowData = {};
         rowData[this.columnName] = d;

         return this.format(rowData);
      };

      config.editFormat = (d) => {
         // this routine needs to return a Date() object for the editor to work with.

         if (d == "" || d == null) {
            return "";
         }

         // else retun the actual ISO string => Date() value
         return this.AB.rules.toDate(d);
      };

      return config;
   }

   /*
    * @funciton formComponent
    * returns a drag and droppable component that is used on the UI
    * interface builder to place form components related to this ABField.
    *
    * an ABField defines which form component is used to edit it's contents.
    * However, what is returned here, needs to be able to create an instance of
    * the component that will be stored with the ABViewForm.
    */
   formComponent() {
      // NOTE: what is being returned here needs to mimic an ABView CLASS.
      // primarily the .common() and .newInstance() methods.
      const formComponentSetting = super.formComponent("datepicker");

      // .common() is used to create the display in the list
      formComponentSetting.common = () => {
         return {
            key: "datepicker",
         };
      };

      return formComponentSetting;
   }

   detailComponent() {
      const detailComponentSetting = super.detailComponent();

      detailComponentSetting.common = () => {
         return {
            key: "detailtext",
         };
      };

      return detailComponentSetting;
   }

   // Overwrite core.format to use webix locales.
   format(rowData) {
      if (!window.webixLocale) return super.format(rowData);
      const d = this.dataValue(rowData);

      if (d == "" || d == null) {
         return "";
      }
      const dateObj = this.AB.rules.toDate(d);

      const dateFormat = this.settings.dateFormat;
      // @const {int} dateFormat AB Date Format
      // 1 - ignore, 2 - dd/mm/yyyy, 3 - mm/dd/yyyy, 4 - M D, yyyy, 5 - D M, yyyy
      const timeToStr = webix.Date.dateToStr(this.getTimeFormat());

      if (dateFormat >= 4) {
         return `${webix.i18n.longDateFormatStr(dateObj)} ${timeToStr(
            dateObj
         )}`;
      } else {
         return `${webix.i18n.dateFormatStr(dateObj)} ${timeToStr(dateObj)}`;
      }
   }
};
