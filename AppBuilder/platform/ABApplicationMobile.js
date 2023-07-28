const _ = require("lodash");

// prettier-ignore
const ABApplicationMobileCore = require("../core/ABApplicationMobileCore.js");

const ABViewPage = require("./views/ABViewPage");
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
      return new ABViewPageMobile(values, this);
   }
};
