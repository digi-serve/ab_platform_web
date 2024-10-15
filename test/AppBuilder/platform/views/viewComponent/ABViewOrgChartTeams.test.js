import { assert } from "chai";
import sinon from "sinon";
import ABFactory from "../../../../../AppBuilder/ABFactory";
import ABViewOrgChartTeams from "../../../../../AppBuilder/platform/views/ABViewOrgChartTeams";
import ABViewOrgChartTeamsComponent from "../../../../../AppBuilder/platform/views/viewComponent/ABViewOrgChartTeamsComponent";

describe("ABViewDetailCheckboxComponent item widget", function () {
   let sandbox;
   let selectorStub;
   let modelCreate;
   let teamChart;

   beforeEach(function () {
      sandbox = sinon.createSandbox();
      const AB = new ABFactory();
      const application = AB.applicationNew({});
      sinon.stub(AB, "definitionByID").returns({});
      const view = new ABViewOrgChartTeams({}, application);
      teamChart = new ABViewOrgChartTeamsComponent(view);
      modelCreate = sinon.fake.resolves({ id: "new" });
      teamChart.datacollection = { model: {} };
      teamChart.datacollection.model.create = modelCreate;
      sinon.replace(teamChart, "getSettingField", (n) => ({
         columnName: n,
         settings: {},
      }));
      teamChart.__orgchart = {
         addSiblings: sinon.fake(),
         addChildren: sinon.fake(),
         removeNodes: sinon.fake(),
      };
      selectorStub = sinon.stub(document, "querySelector");
   });

   afterEach(function () {
      selectorStub.restore();
      sandbox.restore();
   });

   it(".pullData prepares data for org-chart", async function () {
      const dc = {};
      sinon.stub(teamChart.view, "datacollection").get(() => dc);
      assert.equal(teamChart.view.datacollection, dc);
      dc.waitForDataCollectionToInitialize = sinon.fake.resolves();
      dc.getCursor = sinon.fake.returns({
         id: "1",
         teamName: "One",
         teamLink: ["2", "3", "7"],
      });
      const data = (id, teamName, teamLink = []) => [
         {
            id,
            teamName,
            teamLink,
            __rawData: { teamLink },
            teamInactive: false,
         },
      ];
      dc.getData = sinon
         .stub()
         .onCall(0)
         .returns(data("2", "Two"))
         .onCall(1)
         .returns(data("3", "Three", ["4", "6"]))
         .onCall(2)
         .returns(data("4", "Four", ["5"]))
         .onCall(3)
         .returns(data("5", "Five"))
         .onCall(4)
         .returns(data("6", "Six"))
         .onCall(5)
         .returns(data("7", "Seven"));
      await teamChart.pullData();
      const expected = (i, n) => ({ id: `teamnode_${i}`, name: n });
      assert(dc.getData.callCount, 6);
      // Check expected data strucutre, note: the calls will process children
      // before siblings. Also siblings get sorted alphabetically by name so we
      // expect: 1 ---- 7
      //            \-- 3 --- 4 - 5
      //             \- 2  \- 11
      assert.include(teamChart.chartData, expected(1, "One"));
      assert.include(teamChart.chartData.children[2], expected(2, "Two"));
      assert.include(teamChart.chartData.children[1], expected(3, "Three"));
      assert.include(
         teamChart.chartData.children[1].children[0],
         expected(4, "Four")
      );
      assert.include(
         teamChart.chartData.children[1].children[0].children[0],
         expected(5, "Five")
      );
      assert.include(
         teamChart.chartData.children[1].children[1],
         expected(6, "Six")
      );
      assert.include(teamChart.chartData.children[0], expected(7, "Seven"));
   });

   describe(".teamAddChild", function () {
      const values = { teamName: "Test" };

      before(function () {});

      beforeEach(function () {
         sinon.stub(teamChart, "closest").returns({
            querySelector: function () {
               return this;
            },
         });
      });

      it("adds a team node as child", async function () {
         selectorStub.returns({ parentNode: { colSpan: 0 } });
         await teamChart.teamAddChild(values);
         assert(modelCreate.calledOnce);
         assert(teamChart.__orgchart.addChildren.calledOnce);
         assert.deepEqual(
            teamChart.__orgchart.addChildren.lastArg.children[0],
            { relationship: "100", name: "Test", id: "teamnode_new" }
         );
      });

      it("adds a team node as sibling", async function () {
         selectorStub.returns({ parentNode: { colSpan: 2 } });
         await teamChart.teamAddChild(values);
         assert(modelCreate.calledOnce);
         assert(teamChart.__orgchart.addSiblings.calledOnce);
         assert.deepEqual(
            teamChart.__orgchart.addSiblings.lastArg.siblings[0],
            { relationship: "110", name: "Test", id: "teamnode_new" }
         );
      });
   });

   it(".teamCanInactivate", function () {
      const tests = [
         {
            values: {
               teamInactive: false,
               teamCanInactivate: true,
               teamLink: [],
            },
            expected: true,
         },
         {
            values: {
               teamInactive: false,
               teamCanInactivate: false,
               teamLink: [],
            },
            expected: false,
         },
         {
            values: {
               teamInactive: true,
               teamCanInactivate: false,
               teamLink: [],
            },
            expected: true,
         },
         {
            values: {
               teamInactive: false,
               teamCanInactivate: true,
               teamLink: [1],
            },
            expected: false,
         },
      ];
      tests.forEach((t, i) => {
         const result = teamChart.teamCanInactivate(t.values);
         assert.equal(result, t.expected, `case ${i + 1}`);
      });
   });

   it(".teamCanDelete", function () {
      const tests = [
         {
            values: {
               teamCanInactivate: true,
               teamLink: [],
            },
            expected: true,
         },
         {
            values: {
               teamCanInactivate: false,
               teamLink: [],
            },
            expected: false,
         },
         {
            values: {
               teamCanInactivate: true,
               teamLink: [1],
            },
            expected: false,
         },
      ];
      tests.forEach((t, i) => {
         const result = teamChart.teamCanDelete(t.values);
         assert.equal(result, t.expected, `case ${i + 1}`);
      });
   });

   it(".teamDelete - calls model.delete & updates ui", async function () {
      const canDeleteFake = sinon.fake.returns(true);
      sinon.replace(teamChart, "teamCanDelete", canDeleteFake);
      const values = { id: "delete" };
      teamChart.AB.Webix.confirm = sinon.fake.resolves();
      teamChart.datacollection.model.delete = sinon.fake.resolves();
      await teamChart.teamDelete(values);
      assert(canDeleteFake.calledOnceWith(values));
      assert(teamChart.datacollection.model.delete.calledOnceWith(values.id));
      assert(teamChart.__orgchart.removeNodes.calledOnce);
   });

   it(".teamEdit - calls model.update", function () {
      teamChart.datacollection.model.update = sinon.fake.resolves();
      selectorStub.returnsThis();

      const values = { id: "update", teamName: "update" };
      teamChart.teamEdit(values);
      assert(
         teamChart.datacollection.model.update.calledOnceWith("update", values)
      );
   });

   it(".teamNodeID/teamRecordID can insert & extract ID", function () {
      const id = "c43f40d9-6d6a-40d8-adaf-7c61a54b439e";
      const result = teamChart.teamRecordID(teamChart.teamNodeID(id));
      assert.equal(id, result);
   });
});
