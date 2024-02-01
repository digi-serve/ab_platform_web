const _ = require("lodash");

// prettier-ignore
const ABApplicationMobileCore = require("../core/ABApplicationMobileCore.js");

const ABViewPageMobile = require("./mobile/ABMobilePage");
const ABViewManager = require("./ABViewManager");

module.exports = class ABClassApplicationMobile extends (
   ABApplicationMobileCore
) {
   constructor(attributes, AB) {
      super(attributes, AB);
   }

   ///
   /// Definition
   ///

   /**
    * @method pageNew()
    * return a new instance of an ABViewPageMobile
    * @param values
    *        The initial settings for the page.
    * @return {ABViewPageMobile}
    */
   pageNew(values) {
      const newPage = new ABViewPageMobile(values, this);
      newPage.parent = this;
      return newPage;
   }

   async setPageDefault(page) {
      if (this.pageDefault != page.id) {
         let oldPage = this.pageByID(this.pageDefault, true);
         if (oldPage) {
            oldPage.defaultPage = 0;
            await oldPage.save();
         }

         this.pageDefault = page.id;
         await this.save();
      }
   }
};
