import assert from "assert";
import ABFactory from "../../../../AppBuilder/ABFactory";
import ABViewDetailImage from "../../../../AppBuilder/platform/views/ABViewDetailImage";
import ABViewDetailImageComponent from "../../../../AppBuilder/platform/views/viewComponent/ABViewDetailImageComponent";

function getTarget() {
   const AB = new ABFactory();
   const application = AB.applicationNew({});
   return new ABViewDetailImage({}, application);
}

describe("ABViewDetailImage widget", function () {
   it(".component - should return a instance of ABViewDetailImageComponent", function () {
      const target = getTarget();

      const result = target.component();

      assert.equal(true, result instanceof ABViewDetailImageComponent);
   });
});
