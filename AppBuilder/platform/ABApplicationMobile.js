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
};
