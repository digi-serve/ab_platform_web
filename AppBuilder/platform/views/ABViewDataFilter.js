import ABViewDataFilterCore from "../../core/views/ABViewDataFilterCore";
import ABViewDataFilterComponent from "./viewComponent/ABViewDataFilterComponent";

export default class ABViewDataFilter extends ABViewDataFilterCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false) {
      let component = new ABViewDataFilterComponent(this);

      // if this is our v1Interface
      if (v1App) {
         var newComponent = component;
         component = {
            ui: newComponent.ui(),
            init: (options, accessLevel) => {
               return newComponent.init(this.AB, accessLevel);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
      }
      return component;
   }
}
