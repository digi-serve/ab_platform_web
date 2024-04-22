/**
 * common tests to run against all our view components
 */
import { assert } from "chai";
import path from "path";
import fs from "fs";
import sinon from "sinon";
import AB from "../../../../_mock/AB.js";

// Dynamically import all components in the viewComponent folder matching filename ABView*.js
const viewComponents = {};

const filenames = fs.readdirSync(viewComponentPath());
filenames.forEach((file) => {
   if (/^(ABView.+)\.js/.test(file)) {
      const component = /^(ABView.+)\.js/.exec(file)[1];
      viewComponents[component] = import(viewComponentPath(file));
   }
});

/**
 * helper to get the resolved path of the viewComponent folder
 * with optional filename
 * @param {string} [file]
 * @returns {string}
 */
function viewComponentPath(file = "") {
   return path.resolve(
      __dirname,
      "../../../../../AppBuilder/platform/views/viewComponent",
      file
   );
}

/** MOCKS */
const field = {
   settings: {},
   columnHeader: sinon.fake.returns({ template: sinon.fake() }),
   defaultValue: sinon.fake(),
   getFormat: sinon.fake(),
};

class BaseView {
   constructor(settings = {}) {
      this.id = "base";
      this.AB = new AB();
      this.settings = settings;
      (this.detailComponent = sinon.fake.returns({
         settings: {},
      })),
         (this.field = sinon.fake.returns(field));
      this.getCurrentUserId = sinon.fake();
      this.getUserData = sinon.fake();
      this.linkPageHelper = { component: () => {} };
      this.filterHelper = {
         on: () => {},
         externalSearchText: () => {},
         removeAllListeners: () => {},
         ui: () => {},
      };
      this.parentFormComponent = sinon.fake();
      this.superComponent = sinon.fake.returns({ ui: sinon.fake.returns({}) });
      this.views = sinon.fake.returns([]);
      this.viewsSortByPosition = sinon.fake.returns([]);
   }

   static defaultValues() {
      return {};
   }
}

// TEST
describe.only("ABViewCoponent* - Common tests", function () {
   describe(".ui() returns ui with correct id", function () {
      // Run a test for each viewComponent
      for (const key in viewComponents) {
         it(key, async function () {
            const { default: Component } = await viewComponents[key];
            let baseview;
            switch (key) {
               case "ABViewConditionalContainerComponent":
                  baseview = new BaseView();
                  baseview.views = () => [
                     {
                        name: "If",
                        component: () => {
                           return { ui: () => {} };
                        },
                     },
                     {
                        name: "Else",
                        component: () => {
                           return { ui: () => {} };
                        },
                     },
                  ];
                  break;
               case "ABViewGridComponent":
                  baseview = new BaseView({
                     gridFilter: {},
                     summaryColumns: [],
                     countColumns: [],
                  });
                  break;
               case "ABViewFormReadonlyComponent":
               case "ABViewFormTreeComponent":
                  baseview = new BaseView();
                  baseview.parentFormComponent = () => {
                     return {};
                  };
                  break;
               case "ABViewSchedulerComponent":
                  baseview = new BaseView({
                     dataviewFields: {},
                     calendarDataviewFields: {},
                     timeline: {},
                     export: {},
                  });
                  break;
               default:
                  baseview = new BaseView();
                  break;
            }
            const component = new Component(baseview);
            const ui = component.ui();
            assert.property(
               ui,
               "id",
               `missing 'id' property in UI returned by ${key}.ui()`
            );
            assert.equal(
               component.ids.component,
               ui.id,
               `'id' property in UI returned by ${key}.ui() does not match ${key}.ids.component`
            );
         });
      }
   });
});
