import ABViewConnectDataFilterCore from "../../core/views/ABViewConnectDataFilterCore";
import ABViewConnectDataFilterComponent from "./viewComponent/ABViewConnectDataFilterComponent";

export default class ABViewConnectDataFilter extends ABViewConnectDataFilterCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false) {
      let component = new ABViewConnectDataFilterComponent(this);

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
