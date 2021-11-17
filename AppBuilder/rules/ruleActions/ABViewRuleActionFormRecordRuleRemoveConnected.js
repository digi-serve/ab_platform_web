//
// ABViewRuleActionFormRecordRuleRemoveConnected
//
// An action that allows you to update fields on an object that is connected to
// the current object we just Added/Updated
//
//
const ABViewRuleActionFormRecordRuleUpdateConnected = require("./ABViewRuleActionFormRecordRuleUpdateConnected");

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewRuleActionFormRecordRuleRemoveConnected extends (
   ABViewRuleActionFormRecordRuleUpdateConnected
) {
   constructor(App, idBase, currentForm) {
      super(App, idBase, currentForm);

      this.key = "ABViewRuleActionFormRecordRuleRemoveConnected";
      this.label = L("Remove Connected Record");

      this.isUpdateValueDisabled = true; // disable update data of each fields

      this.labels.component.selectField = L(
         "Select which connected object to remove"
      );
   }

   /**
    * process
    * gets called when a form is submitted and the data passes the Query Builder Rules.
    * @param {obj} options
    *				options.data : {obj} the key=>value of the data just entered by the form
    *				options.form : {ABViewForm} the Form object that is processing this rule
    * @return {Promise}
    */
   process(options) {
      let selectedField = this.selectedField();
      this._formData = options.data;

      return new Promise((resolve, reject) => {
         // get the model from the provided Form Obj:
         let dc = options.form.datacollection;
         if (!dc) return resolve();

         let model = dc.model;
         if (!model) return resolve();

         let updatedVals = {};
         updatedVals[selectedField.columnName] = "";

         model
            .update(options.data.id, updatedVals)
            .catch((err) => {
               this.AB.notify.developer(err, {
                  message: "!!! ABViewRuleActionFormRecordRuleUpdate.process(): update error:",
                  data: options.data
               });
               reject(err);
            })
            .then(resolve);
      });
   }
};
