const ABViewCommentCore = require("../../core/views/ABViewCommentCore");

const ABViewCommentComponent = require("./viewComponent/ABViewCommentComponent");

const ABViewCommentPropertyComponentDefaults = ABViewCommentCore.defaultValues();

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewComment extends ABViewCommentCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false) {
      let component = new ABViewCommentComponent(this);

      // if this is our v1Interface
      if (v1App) {
         const newComponent = component;

         component = {
            ui: newComponent.ui(),
            init: (options, accessLevel) => {
               return newComponent.init(this.AB);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
      }

      return component;
   }

   componentOld() {}
};
