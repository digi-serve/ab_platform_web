import assert from "assert";
import ABFactory from "../../../../AppBuilder/ABFactory";
import ABViewDetailCheckbox from "../../../../AppBuilder/platform/views/ABViewDetailCheckbox";
import ABViewDetailCheckboxComponent from "../../../../AppBuilder/platform/views/viewComponent/ABViewDetailCheckboxComponent";

function getTarget() {
   const AB = new ABFactory();
   const application = AB.applicationNew({});
   return new ABViewDetailCheckbox({}, application);
}

describe("ABViewDetailCheckbox widget", function () {
   it(".component - should return a instance of ABViewDetailCheckboxComponent", function () {
      const target = getTarget();

      const result = target.component();

      assert.equal(true, result instanceof ABViewDetailCheckboxComponent);
   });
});
