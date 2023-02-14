const ABViewFormConnectCore = require("../../core/views/ABViewFormConnectCore");
const ABViewFormConnectComponent = require("./viewComponent/ABViewFormConnectComponent");
const ABViewPropertyAddPage =
   require("./viewProperties/ABViewPropertyAddPage").default;
const ABViewPropertyEditPage =
   require("./viewProperties/ABViewPropertyEditPage").default;

const ABViewFormConnectPropertyComponentDefaults =
   ABViewFormConnectCore.defaultValues();

const ABPopupSort = require("../../../ABDesigner/ab_work_object_workspace_popupSortFields");

let FilterComponent = null;
let SortComponent = null;

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
   component(v1App) {
      let component = new ABViewFormConnectComponent(this);

      // if this is our v1Interface
      if (v1App) {
         const newComponent = component;
         component = {
            ui: component.ui(),
            init: (options, accessLevel) => {
               return newComponent.init(this.AB, accessLevel);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
      }

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
