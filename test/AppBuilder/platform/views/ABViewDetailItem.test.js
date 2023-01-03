import assert from "assert";
import ABFactory from "../../../../AppBuilder/ABFactory";
import ABViewDetailItem from "../../../../AppBuilder/platform/views/ABViewDetailItem";
import ABViewDetailItemComponent from "../../../../AppBuilder/platform/views/viewComponent/ABViewDetailItemComponent";

function getTarget() {
   const AB = new ABFactory();
   const application = AB.applicationNew({});
   return new ABViewDetailItem({}, application);
}

describe("ABViewDetailItem widget", function () {
   it(".component - should return a instance of ABViewDetailItemComponent", function () {
      const target = getTarget();

      const result = target.component();

      assert.equal(true, result instanceof ABViewDetailItemComponent);
   });
});
