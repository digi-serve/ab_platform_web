/*
 * ABQLManager
 *
 * An interface for managing the different ABQL Operations available in our
 * AppBuilder.
 *
 */

const ABQLManagerCore = require("../../core/ql/ABQLManagerCore.js");
const ABQLRootObject = require("./ABQLRootObject.js");

const ABQLManager = {
   /**
    * @method fromAttributes()
    * return an {ABQL} object that represents the given attributes that
    * were saved from the previous .toObj()
    * @param {object} attributes
    *		  the values returned from the previous .toObj() call
    * @param {ABProcessTask***} task
    *		  the current ABProcessTaskServiceQuery that contains this QL
    * @param {ABFactory} AB
    *		  the current {ABFactory} active for this interface.
    * @return {ABQL} | null
    */
   fromAttributes: ABQLManagerCore.fromAttributes,

   /**
    * @method ids()
    * return a set of unique webix ids for the ui portions of this object.
    * @param {string} id
    *		  the webix base id of the parameters panel.
    * @return {object}
    */
   ids: (id) => {
      return {
         root: `${id}_root`,
         select: `${id}_root_select`,
         options: `${id}_root_options`,
      };
   },

   /**
    * @method builder
    * return a UI component like object that will display the QL builder.
    * The component will support:
    *		.ui(id) : returns a webix ui definition for the current builder
    *		.init(id) : performs any special actions to prepare the webix ui
    * @param {object} rootOP
    *		  the root ABQLxxxx operation
    * @param {ABProcessTask***} task
    *		  the current Process Task that is requesting the data.
    * @param {ABFactory} AB
    *		  the {ABFactory} active for this display.
    * @return {object}
    */
   builder: (rootOP, task, AB) => {
      // const rootOP = this.fromAttributes(attributes, task, AB);
      // const L = (...params) => AB.Multilingual.label(...params);

      return {
         ui: (id) => {
            rootOP = rootOP ?? new ABQLRootObject({}, task, AB);

            const ids = ABQLManager.ids(id);
            const ui = {
               rows: [
                  {
                     id: ids.root,
                     cols: [],
                  },
               ],
            };

            rootOP.uiAddParams(id, ui);
            rootOP.uiAddNext(id, ui);

            return ui;
         },
         init: (id) => {},
      };
   },

   /**
    * @method parse
    * step through the current properties panel and decode the QL objects
    * and their parameters.
    * Return the .toOBJ() attributes definition as a result.
    * @param {string} id
    *		  the webix base id of the parameters panel.
    * @param {ABProcessTask***} task
    *		  the current Process Task that is requesting the data.
    * @param {ABFactory} AB
    *		  the {ABFactory} object that is currently active.
    * @return {object}
    */
   parse: (id, task, AB) => {
      const ids = ABQLManager.ids(id);
      const root = $$(ids.root);

      if (!root) {
         console.warn("ABQLManager.parse(): unable to find root element");

         return;
      }

      // get all the input rows
      const rows = root.getParentView().getChildViews();

      const parseCurrent = (rows, options, prevOP) => {
         if (rows.length === 0) return null;

         const row = rows.shift();

         // get which operation was selected
         // find the operation selector (skip any indents)
         const views = row.getChildViews();

         let selector = views.shift();

         while (!selector?.getValue) selector = views.shift();

         const value = selector.getValue();

         // figure out the QLOP object
         const OP = options.find((o) => {
            return o.key === value || o.key === ABQLRootObject.key;
         });

         if (OP) {
            let currOP = null;

            if (prevOP) currOP = new OP({}, prevOP, task, AB);
            else currOP = new OP({}, task, AB);

            // now get currOP to initialize from it's parameters:
            currOP.parseRow(row, id);

            // carry forward any .object info if not already established
            // by the .parseRow():
            if (!currOP.object && prevOP) {
               currOP.object = prevOP.object;
               currOP.objectID = currOP.object?.id ?? null;
            }

            const nextRow = parseCurrent(
               rows,
               currOP.constructor.NextQLOps,
               currOP
            );

            currOP.next = nextRow;

            return currOP;
         }

         return null;
      };

      const operation = parseCurrent(rows, ABQLManagerCore.QLOps, null);

      return operation;
   },
};

module.exports = ABQLManager;
