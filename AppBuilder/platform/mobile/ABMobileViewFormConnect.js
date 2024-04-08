const ABMobileViewFormConnectCore = require("../../core/mobile/ABMobileViewFormConnectCore");

// const ABViewPropertyAddPage =
//    require("./viewProperties/ABViewPropertyAddPage").default;
// const ABViewPropertyEditPage =
//    require("./viewProperties/ABViewPropertyEditPage").default;

// const ABViewFormConnectPropertyComponentDefaults =
//    ABMobileViewFormConnectCore.defaultValues();

// const ABPopupSort = require("../../../ABDesigner/ab_work_object_workspace_popupSortFields");

// let FilterComponent = null;
// let SortComponent = null;

module.exports = class ABMobileViewFormConnect extends (
   ABMobileViewFormConnectCore
) {
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

      this.__filterComponent.setValue(
         this.settings.filterConditions
         /* ??
            ABViewFormConnectPropertyComponentDefaults.filterConditions
         */
      );
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

      // Does this do anything here?
      // this.addPageTool.fromSettings(this.settings);
      // this.editPageTool.fromSettings(this.settings);
   }

   // static get addPageProperty() {
   //    return ABViewPropertyAddPage.propertyComponent(this.App, this.idBase);
   // }

   // static get editPageProperty() {
   //    return ABViewPropertyEditPage.propertyComponent(this.App, this.idBase);
   // }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   // component() {
   //    return new ABViewFormConnectComponent(this);
   // }

   // get addPageTool() {
   //    if (this.__addPageTool == null)
   //       this.__addPageTool = new ABViewPropertyAddPage();

   //    return this.__addPageTool;
   // }

   // get editPageTool() {
   //    if (this.__editPageTool == null)
   //       this.__editPageTool = new ABViewPropertyEditPage();

   //    return this.__editPageTool;
   // }
};
