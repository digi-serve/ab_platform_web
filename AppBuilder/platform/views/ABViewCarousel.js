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
    * @return {obj} UI component
    */
   component() {
      var dv = this.datacollection;
      if (dv) {
         this.filterHelper.objectLoad(dv.datasource);
         this.filterHelper.fromSettings(this.settings.filter);
      }

      return new ABViewCarouselComponent(this);
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
