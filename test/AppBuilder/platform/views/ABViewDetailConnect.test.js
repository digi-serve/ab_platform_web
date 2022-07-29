import assert from "assert";
import ABFactory from "../../../../AppBuilder/ABFactory";
import ABViewDetailConnect from "../../../../AppBuilder/platform/views/ABViewDetailConnect";
import ABViewDetailConnectComponent from "../../../../AppBuilder/platform/views/viewComponent/ABViewDetailConnectComponent";

function getTarget() {
   const AB = new ABFactory();
   const application = AB.applicationNew({});
   return new ABViewDetailConnect({}, application);
}

describe("ABViewDetailConnect widget", function () {
   it(".component - should return a instance of ABViewDetailConnectComponent", function () {
      const target = getTarget();

      const result = target.component();

      assert.equal(true, result instanceof ABViewDetailConnectComponent);
   });
});
