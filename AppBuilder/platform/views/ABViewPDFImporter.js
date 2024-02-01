const ABViewPDFImporterCore = require("../../core/views/ABViewPDFImporterCore");
const ABViewPDFImporterComponent = require("./viewComponent/ABViewPDFImporterComponent");

module.exports = class ABViewPDFImporter extends ABViewPDFImporterCore {
   /**
    * @function component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewPDFImporterComponent(this);
   }
};
