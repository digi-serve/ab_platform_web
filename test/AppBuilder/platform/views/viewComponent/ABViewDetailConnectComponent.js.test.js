import assert from "assert";
import sinon from "sinon";
import ABFactory from "../../../../../AppBuilder/ABFactory";
import ABViewDetailConnect from "../../../../../AppBuilder/platform/views/ABViewDetailConnect";
import ABViewDetailConnectComponent from "../../../../../AppBuilder/platform/views/viewComponent/ABViewDetailConnectComponent";

function getTarget() {
   const AB = new ABFactory();
   const application = AB.applicationNew({});
   const detailConnectView = new ABViewDetailConnect({}, application);
   return new ABViewDetailConnectComponent(detailConnectView);
}

describe("ABViewDetailConnectComponent item widget", function () {
   it(".ui - should return UI json that has properly .id", function () {
      const target = getTarget();
      const result = target.ui();

      assert.equal(true, result != null);
      assert.equal(target.ids.component, result.id);
   });

   it(".setValue - should display connected text items", function () {
      const target = getTarget();
      const mockWebixElem = global.$$(target.ids.component);
      const stubWebixElem = sinon
         .stub(global, "$$")
         .callsFake(() => mockWebixElem);
      const spySetValues = sinon.spy(mockWebixElem, "setValues");

      const input = [
         { id: "ID", text: "TEXT" },
         { id: "ID2", text: "TEXT2" },
         { id: "ID3", text: "TEXT3" },
      ];
      target.setValue(input);

      assert.equal(true, stubWebixElem.calledWith(target.ids.component));
      assert.equal(
         true,
         spySetValues.calledOnceWith({
            display: input
               .map(
                  (item) =>
                     `<span class="webix_multicombo_value">${item.text}</span>`
               )
               .join(""),
         })
      );

      stubWebixElem.restore();
   });
});
