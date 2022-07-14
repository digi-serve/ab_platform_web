import assert from "assert";
import ABFactory from "../../../../AppBuilder/ABFactory";
import ABViewDetailCustom from "../../../../AppBuilder/platform/views/ABViewDetailCustom";
import ABViewDetailCustomComponent from "../../../../AppBuilder/platform/views/viewComponent/ABViewDetailCustomComponent";

function getTarget() {
   const AB = new ABFactory();
   const application = AB.applicationNew({});
   return new ABViewDetailCustom({}, application);
}

describe("ABViewDetailCustom widget", function () {
   it(".component - should return a instance of ABViewDetailCustomComponent", function () {
      const target = getTarget();

      const result = target.component();

      assert.equal(true, result instanceof ABViewDetailCustomComponent);
   });
});
