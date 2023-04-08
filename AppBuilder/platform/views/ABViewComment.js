const ABViewCommentCore = require("../../core/views/ABViewCommentCore");
const ABViewCommentComponent = require("./viewComponent/ABViewCommentComponent");

module.exports = class ABViewComment extends ABViewCommentCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewCommentComponent(this);
   }

   warningsEval() {
      super.warningsEval();

      let field = this.getUserField();
      if (!field) {
         this.warningsMessage(
            `can't resolve user field[${this.settings.columnUser}]`
         );
      }

      field = this.getCommentField();
      if (!field) {
         this.warningsMessage(
            `can't resolve comment field[${this.settings.columnComment}]`
         );
      }

      field = this.getDateField();
      if (!field) {
         this.warningsMessage(
            `can't resolve date field[${this.settings.columnDate}]`
         );
      }
   }
};
