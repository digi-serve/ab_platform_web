const ABMobileViewTimelineCore = require("../../core/mobile/ABMobileViewTimelineCore");

module.exports = class ABMobileViewTimeline extends ABMobileViewTimelineCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }
   warningsEval() {
      super.warningsEval();

      ["linkPageAdd", "linkPageDetail"].forEach((k) => {
         if (this.settings[k]) {
            let page = this.application.pageByID(this.settings[k], true);
            if (!page) {
               this.warningsMessage(`${k} references an unknown Page.`);
            }
         }
      });
   }
};
