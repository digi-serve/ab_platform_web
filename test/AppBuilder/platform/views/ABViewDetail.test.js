import assert from "assert";
import ABFactory from "../../../../AppBuilder/ABFactory";
import ABViewDetail from "../../../../AppBuilder/platform/views/ABViewDetail";
import ABViewDetailComponent from "../../../../AppBuilder/platform/views/viewComponent/ABViewDetailComponent";

function getTarget() {
   const AB = new ABFactory();
   const application = AB.applicationNew({});
   return new ABViewDetail({}, application);
}

describe("ABViewDetail widget", function () {
   it(".component - should return a instance of ABViewDetailComponent", function () {
      const target = getTarget();

      const result = target.component();

      assert.equal(true, result instanceof ABViewDetailComponent);
   });
});
