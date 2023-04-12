const ABViewDocxBuilderCore = require("../../core/views/ABViewDocxBuilderCore");
const ABViewDocxBuilderComponent = require("./viewComponent/ABViewDocxBuilderComponent");

module.exports = class ABViewDocxBuilder extends ABViewDocxBuilderCore {
   /**
    * @function component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewDocxBuilderComponent(this);
   }

   letUserDownload(blob, filename) {
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a); // we need to append the element to the dom -> otherwise it will not work in firefox
      a.click();
      a.remove(); //afterwards we remove the element again

      window.URL.revokeObjectURL(url);
   }

   warningsEval() {
      super.warningsEval();

      let DC = this.datacollection;
      if (!DC) {
         this.warningsMessage(
            `can't resolve it's datacollection[${this.settings.dataviewID}]`
         );
      }

      if (!this.settings.filename) {
         this.warningsMessage("is missing a DOCX template file");
      } else {
         // TODO: should we check for the existance of the file?
         // this isn't currently an async friendly fn, so how?
         // let url = this.downloadUrl();
      }
   }
};
