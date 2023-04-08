const ABViewFormDatepickerCore = require("../../core/views/ABViewFormDatepickerCore");
const ABViewFormDatepickerComponent = require("./viewComponent/ABViewFormDatepickerComponent");

module.exports = class ABViewFormDatepicker extends ABViewFormDatepickerCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewFormDatepickerComponent(this);
   }
};
