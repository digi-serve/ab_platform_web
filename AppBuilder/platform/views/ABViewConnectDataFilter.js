import ABViewConnectDataFilterCore from "../../core/views/ABViewConnectDataFilterCore";
import ABViewConnectDataFilterComponent from "./viewComponent/ABViewConnectDataFilterComponent";

export default class ABViewConnectDataFilter extends ABViewConnectDataFilterCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @return {obj} UI component
    */
   component() {
      return new ABViewConnectDataFilterComponent(this);
   }
}
