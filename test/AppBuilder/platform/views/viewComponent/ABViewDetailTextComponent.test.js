import assert from "assert";
import sinon from "sinon";
import ABFactory from "../../../../../AppBuilder/ABFactory";
import ABViewDetailText from "../../../../../AppBuilder/platform/views/ABViewDetailText";
import ABViewDetailTextComponent from "../../../../../AppBuilder/platform/views/viewComponent/ABViewDetailTextComponent";

function getTarget() {
   const AB = new ABFactory();
   const application = AB.applicationNew({});
   const detailTextView = new ABViewDetailText({}, application);
   return new ABViewDetailTextComponent(detailTextView);
}

describe("ABViewDetailTextComponent item widget", function () {
   it(".ui - should return UI json that has properly .id", function () {
      const target = getTarget();
      const result = target.ui();

      assert.equal(true, result != null);
      assert.equal(target.ids.component, result.id);
      assert.equal("ab-text", result.css);
   });
});
