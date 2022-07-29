import assert from "assert";
import ABFactory from "../../../../AppBuilder/ABFactory";
import ABViewDetailText from "../../../../AppBuilder/platform/views/ABViewDetailText";
import ABViewDetailTextComponent from "../../../../AppBuilder/platform/views/viewComponent/ABViewDetailTextComponent";

function getTarget() {
   const AB = new ABFactory();
   const application = AB.applicationNew({});
   return new ABViewDetailText({}, application);
}

describe("ABViewDetailText widget", function () {
   it(".component - should return a instance of ABViewDetailTextComponent", function () {
      const target = getTarget();

      const result = target.component();

      assert.equal(true, result instanceof ABViewDetailTextComponent);
   });
});
