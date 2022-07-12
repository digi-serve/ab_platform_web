import assert from "assert";
import ABFactory from "../../../../AppBuilder/ABFactory";
import ABViewDetailTree from "../../../../AppBuilder/platform/views/ABViewDetailTree";
import ABViewDetailTreeComponent from "../../../../AppBuilder/platform/views/viewComponent/ABViewDetailTreeComponent";

function getTarget() {
   const AB = new ABFactory();
   const application = AB.applicationNew({});
   return new ABViewDetailTree({}, application);
}

describe("ABViewDetailTree widget", function () {
   it(".component - should return a instance of ABViewDetailTreeComponent", function () {
      const target = getTarget();

      const result = target.component();

      assert.equal(true, result instanceof ABViewDetailTreeComponent);
   });
});
