const ABViewCarouselCore = require("../../core/views/ABViewCarouselCore");
import ABViewCarouselComponent from "./viewComponent/ABViewCarouselComponent";

// const ABViewPropertyFilterData = require("./viewProperties/ABViewPropertyFilterData");
// const ABViewPropertyLinkPage = require("./viewProperties/ABViewPropertyLinkPage");

import ABViewPropertyFilterData from "./viewProperties/ABViewPropertyFilterData";
import ABViewPropertyLinkPage from "./viewProperties/ABViewPropertyLinkPage";

let PopupCarouselFilterMenu = null;

export default class ABViewCarousel extends ABViewCarouselCore {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues);
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

      // filter property
      this.filterHelper.fromSettings(this.settings.filter);
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false) {
      var dv = this.datacollection;
      if (dv) {
         this.filterHelper.objectLoad(dv.datasource);
         this.filterHelper.fromSettings(this.settings.filter);
      }

      let component = new ABViewCarouselComponent(this);

      // if this is our v1Interface
      if (v1App) {
         var newComponent = component;
         component = {
            ui: newComponent.ui(),
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

   get idBase() {
      return `ABViewCarousel_${this.id}`;
   }

   get filterHelper() {
      if (this.__filterHelper == null)
         this.__filterHelper = new ABViewPropertyFilterData(
            this.AB,
            this.idBase
         );

      return this.__filterHelper;
   }

   get linkPageHelper() {
      if (this.__linkPageHelper == null)
         this.__linkPageHelper = new ABViewPropertyLinkPage();

      return this.__linkPageHelper;
   }

   warningsEval() {
      super.warningsEval();

      let field = this.imageField;
      if (!field) {
         this.warningsMessage(
            `can't resolve image field[${this.settings.field}]`
         );
      }
   }
}
