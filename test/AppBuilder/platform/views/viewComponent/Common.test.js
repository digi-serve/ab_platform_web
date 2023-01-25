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

const baseView = {
   id: "base",
   AB: new AB(),
   settings: {},
   detailComponent: sinon.fake.returns({
      settings: {},
   }),
   field: sinon.fake.returns(field),
   getCurrentUserId: sinon.fake(),
   getUserData: sinon.fake(),
   parentFormComponent: sinon.fake(),
   superComponent: sinon.fake.returns({ ui: sinon.fake.returns({}) }),
   views: sinon.fake.returns([]),
   viewsSortByPosition: sinon.fake.returns([]),
};

// TEST
describe("ABViewCoponent* - Common tests", () => {
   describe(".ui() returns ui with correct id", () => {
      // Run a test for each viewComponent
      for (const key in viewComponents) {
         it(key, async () => {
            const { default: Component } = await viewComponents[key];
            const component = new Component(baseView);
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
