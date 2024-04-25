import assert from "assert";
import sinon from "sinon";
import ABFactory from "../../../../../AppBuilder/ABFactory";
import ABViewDetailCheckbox from "../../../../../AppBuilder/platform/views/ABViewDetailCheckbox";
import ABViewDetailCheckboxComponent from "../../../../../AppBuilder/platform/views/viewComponent/ABViewDetailCheckboxComponent";

function getTarget() {
   const AB = new ABFactory();
   const application = AB.applicationNew({});
   const detailCheckboxView = new ABViewDetailCheckbox({}, application);
   return new ABViewDetailCheckboxComponent(detailCheckboxView);
}

describe("ABViewDetailCheckboxComponent item widget", function () {
   let sandbox;

   function getMockStuffs(target) {
      const mockWebixElem = global.$$(target.ids.component);
      const stubWebixElem = sandbox
         .stub(global, "$$")
         .callsFake(() => mockWebixElem);
      const spySetValues = sinon.spy(mockWebixElem, "setValues");

      return { mockWebixElem, stubWebixElem, spySetValues };
   }

   beforeEach(function () {
      sandbox = sinon.createSandbox();
   });

   afterEach(function () {
      sandbox.restore();
   });

   it(".ui - should return UI json that has properly .id", function () {
      const target = getTarget();
      const result = target.ui();

      assert(result != null);
      assert.equal(target.ids.component, result.id);
   });

   it(".setValue - should display checked icon when the parameter is true", function () {
      const target = getTarget();
      const { stubWebixElem, spySetValues } = getMockStuffs(target);

      const input = true;
      target.setValue(input);

      assert(stubWebixElem.calledWith(target.ids.detailItem));
      assert(
         spySetValues.calledOnceWith({
            display:
               '<span class="check webix_icon fa fa-check-square-o"></span>',
         })
      );
   });

   it(".setValue - should display un-checked icon when the parameter is false", function () {
      const target = getTarget();
      const { stubWebixElem, spySetValues } = getMockStuffs(target);

      const input = false;
      target.setValue(input);

      assert(stubWebixElem.calledWith(target.ids.detailItem));
      assert(
         spySetValues.calledOnceWith({
            display: '<span class="check webix_icon fa fa-square-o"></span>',
         })
      );
   });
});
