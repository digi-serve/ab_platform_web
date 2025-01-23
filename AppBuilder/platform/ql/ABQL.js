/*
 * ABQL
 *
 * An ABQL defines the base class for our AB Query Language Objects.
 * These classes share a common way to
 *   - parse input strings for commands
 *
 *
 */
const ABQLCore = require("../../core/ql/ABQLCore.js");
const RowUpdater = require("../RowUpdater.js").default;

const L = (...params) => AB.Multilingual.label(...params);

class ABQL extends ABQLCore {
   constructor(attributes, parameterDefinitions, prevOP, task, AB) {
      super(attributes, parameterDefinitions, prevOP, task, AB);

      this.on("warning", (message, data) => {
         this._warnings.push({ message, data });
      });
   }

   ///
   /// Instance Methods
   ///

   /**
    * @method parseRow()
    * When it is time to pull the information from the properties panel,
    * use this fn to get the current Row of data.
    *
    * This fn() will populate the this.params with the values for each
    * of our .parameterDefinitions.
    *
    * @param {webixNode} row
    *        the current webix node that contains the ROW defining the
    *        operation and it's parameters.
    * @param {string} id
    *        the unique id for where the properties panel is displayed.
    */
   parseRow(row, id) {
      // const allColumns = row.getChildViews();
      // allColumns.shift(); // remove selector
      this.parameterDefinitions.forEach((pDef) => {
         // const col = allColumns.shift();
         const myID = this.uiID(id);

         this.ids = this.toIDs(myID);
         this.params = this.params ?? {};

         let $uiCondition = null;

         switch (pDef.type) {
            case "objectFields":
               this.params[pDef.name] = $$(this.ids.objectfields).getValue();

               break;

            case "objectName":
               this.params[pDef.name] = $$(this.ids.objectname).getValue();

               break;

            case "objectConditions":
            case "objectValues":
               $uiCondition = $$(this.ids.condition);

               if ($uiCondition) {
                  const condition = $uiCondition.getValue();

                  if (condition && condition !== "") {
                     this.params[pDef.name] = JSON.parse(condition);
                  }
               }

               break;

            case "taskParam":
               this.params[pDef.name] = $$(this.ids.taskparam).getValue();

               break;
         }
      });
   }

   /*
    * @method toIDs()
    * generate a set of unique webix ids to use for our UI.
    * @param {string} myID
    *        the unique id generated by .uiID()
    */
   toIDs(myID) {
      return {
         condition: `${myID}_condition`,
         objectfields: `${myID}_objectfields`,
         objectname: `${myID}_objname`,
         popup: `${myID}_popup`,
         select: `${myID}_select`,
         shorthand: `${myID}_shorthand`,
         taskparam: `${myID}_taskparam`,
         spacer: `${myID}_spacer`,
      };
   }

   /**
    * @method uiAddParamForDef()
    * Add an operation parameter for each parameterDefinition we have defined.
    * @param {obj} pDef
    *        the current parameterDefinition entry we are creating the UI
    *        for.
    * @param {string} id
    *        the unique id for where the properties panel is displayed.
    * @param {obj} ui
    *        the current webix ui definition we are building.
    */
   uiAddParamForDef(pDef, id, ui) {
      // params are added to a .col[] definition.
      // if our ui isn't down to the current .col element, then drill down
      if (!ui.cols) {
         if (ui.rows) {
            for (let i = 0; i < ui.rows.length; i++)
               if (ui.rows[i].cols) {
                  this.uiAddParamForDef(pDef, id, ui.rows[i]);

                  break;
               }
         } else throw new Error("provided ui is not able to add a parameter!");

         return;
      }

      const paramUI = this.uiParamUI(pDef, id);

      if (paramUI) {
         // if we only have 1 param
         if (this.parameterDefinitions.length === 1) {
            ui.cols.pop();
            ui.cols.push(paramUI);
         }
         // if we haven't already added a parameter
         else {
            // create a row stack of parameters:
            if (ui.cols.length < 3)
               ui.cols.push({
                  rows: [paramUI],
               });
            // add to the current stack of parameters
            else ui.cols[2].rows.push(paramUI);
         }
      }
   }

   /**
    * @method uiAddNext()
    * Add the next row selector for this operation:
    * @param {string} id
    *        the unique id for where the properties panel is displayed.
    * @param {obj} ui
    *        the current webix ui definition we are building.
    */
   uiAddNext(id, ui) {
      const uiRow = this.uiNextRow(id);

      // if we have a next operation defined, then add on the ui definitions
      // for that operation:
      if (this.next) {
         this.next.uiAddParams(id, uiRow);
         ui.rows.push(uiRow);
         this.next.uiAddNext(id, ui);
      }
      // otherwise we just leave the selector:
      else ui.rows.push(uiRow);
   }

   /**
    * @method uiAddParams()
    * Add operation parameter(s) for each parameterDefinition we have defined.
    * @param {string} id
    *        the unique id for where the properties panel is displayed.
    * @param {obj} ui
    *        the current webix ui definition we are building.
    */
   uiAddParams(id, ui) {
      this.parameterDefinitions.forEach((pDef) => {
         this.uiAddParamForDef(pDef, id, ui);
      });
   }

   /*
    * @method uiID()
    * generate a unique webix id for this operation.
    * @param {string} id
    *        the webix id of the base property.query holder
    */
   uiID(id) {
      if (this.prevOP) return `${this.prevOP.uiID(id)}_${this.constructor.key}`;

      return `${id}_${this.constructor.key}`;
   }

   /*
    * uiXXX Operations:
    * are UI building operations that are performed BEFORE the webix UI
    * is generated.  They work by filling out a {ui} object definition
    * that webix will eventually create into the DOM.
    *
    * viewXXX Operations:
    * are UI building operations that are performed AFTER the webix UI
    * is generated. They work by adding in child views to an existing
    * DOM.
    */

   /**
    * @method uiNextRow()
    * return the webix UI definition for the next of UI chaining.
    * @param {string} id
    *        the unique id for where the properties panel is displayed.
    * @return {obj}
    */
   uiNextRow(id) {
      const nextOptions = this.NextQLOps ?? this.constructor.NextQLOps;
      const options = nextOptions.map((op) => {
         return { id: op.key, value: op.label };
      });

      options.unshift({ id: 0, value: L("choose next operation") });

      const myID = this.uiID(id);
      const ids = this.toIDs(myID);

      const uiRow = {
         cols: [
            {
               id: ids.select,
               view: "select",
               value: this.next ? this.next.constructor.key : 0,
               options: options,
               on: {
                  onChange: (newValue, oldValue) => {
                     const resetValue = () => {
                        const select = $$(ids.select);

                        select.blockEvent();
                        select.setValue(oldValue);
                        select.unblockEvent();
                     };

                     if (newValue === oldValue) return;

                     const newOP = nextOptions.find(
                        (op) => op.key === newValue
                     );

                     if (!newOP) {
                        resetValue();

                        return;
                     }

                     const thisRow = $$(ids.select).getParentView();
                     const thisQuery = thisRow.getParentView();
                     const addOP = () => {
                        if (newOP) {
                           const nextOP = new newOP(
                              {},
                              this,
                              this.task,
                              this.AB
                           );

                           this.next = nextOP;

                           nextOP.viewAddParams(id, thisRow);
                           nextOP.viewAddNext(id, thisQuery);
                        }
                     };

                     // if there are rows after this one, then warn
                     // about changing
                     const allRows = thisQuery.getChildViews();

                     if (allRows.length - 1 > allRows.indexOf(thisRow))
                        webix.confirm({
                           title: L("continue?"),
                           text: L(
                              "changing this rule will reset any following rules."
                           ),
                           ok: L("Yes"),
                           cancel: L("No"),
                           callback: (result) => {
                              if (result) {
                                 // remove the current additional Rows:
                                 let ir = allRows.length - 1;

                                 while (
                                    allRows[ir].config.id !== thisRow.config.id
                                 ) {
                                    thisQuery.removeView(allRows[ir]);
                                    ir--;
                                 }

                                 // now remove the parameters
                                 const allCols = thisRow.getChildViews();

                                 let ic = allCols.length;

                                 while (ic > 1) {
                                    thisRow.removeView(allCols[ic - 1]);
                                    ic--;
                                 }

                                 addOP();
                              } else resetValue();
                           },
                        });
                     else addOP();
                  },
               },
            },
            {
               id: ids.spacer,
            },
         ],
      };

      return uiRow;
   }

   uiNextRowSelectorRefresh(id) {
      const $select = $$(this.ids.select);

      if (!$select) return;

      const uiNextRow = this.uiNextRow(id);

      const uiNextCol =
         uiNextRow.cols.filter((c) => c.id == $select.config.id)[0] ??
         uiNextRow.cols[1];

      if (uiNextCol) AB.Webix.ui(uiNextCol, $select);
   }

   /**
    * @method uiParamUI()
    * return the webix UI definition for the parameter entry of this current
    * operation.
    * @param {obj} pDef
    *        the current parameterDefinition entry we are creating the UI
    *        for.
    * @param {string} id
    *        the unique id for where the properties panel is displayed.
    * @return {obj}
    */
   uiParamUI(pDef, id) {
      const uiConfig = AB.Config.uiSettings();

      let myID = this.uiID(id);

      this.ids = this.toIDs(myID);

      let paramUI = null;
      let options = null;
      let Filter = null;
      let hashFieldIDs = null;
      let initialCond = null;
      let displayLabel = null;
      let initialValue = null;
      let Updater = null;
      let popUp = null;

      // now add the parameter
      switch (pDef.type) {
         case "objectFields":
            // an objectFields parameter returns a select list of fields
            // available on an Object.
            if (this.object)
               options = this.object.fields().map((f) => {
                  return { id: f.id, value: f.label, icon: `fa fa-${f.icon}` };
               });

            options.unshift({
               id: "_PK",
               value: "[PK]",
            });

            // if not set, default .fieldID to the 1st entry in options
            // so we will have a default.  In use, if a user sees the
            // 1st item and continues on, then we will have chosen it.
            if (!this.fieldID && options.length > 0) {
               // act like it was selected:
               this.params[pDef.name] = options[0].id;
               this.paramChanged(pDef, id);
            }

            paramUI = {
               id: this.ids.objectfields,
               view: "richselect",
               label: L("Field"),
               labelWidth: 70,
               value: this.fieldID,
               options: options,
               on: {
                  onChange: (newValue, oldValue) => {
                     // this.params = this.params ?? {};
                     if (newValue !== this.params[pDef.name]) {
                        this.params[pDef.name] = newValue;
                        this.paramChanged(pDef, id);
                     }
                  },
               },
            };

            break;

         case "objectName":
            // an objectName parameter returns a select list of available
            // objects in this ABFactory.
            options = this.AB.objects().map((o) => {
               return { id: o.id, value: o.label };
            });

            if (!this.objectID && options.length > 0) {
               this.objectID = options[0].id;
               this.params[pDef.name] = this.objectID;
               this.paramChanged(pDef);
            }

            paramUI = {
               id: this.ids.objectname,
               view: "select",
               label: L("Data Source"),
               labelWidth: uiConfig.labelWidthLarge,
               value: this.objectID,
               options: options,
               on: {
                  onChange: (newValue /*, oldValue */) => {
                     this.params = this.params ?? {};

                     if (newValue !== this.params[pDef.name]) {
                        this.params[pDef.name] = newValue;
                        this.paramChanged(pDef);
                     }
                  },
               },
            };

            break;

         case "objectConditions":
            // objectConditions: returns a filter text summary, that when
            // clicked, pops up a Filter Entry Popup.
            // the actual value is stored in a hidden field.

            // we will create a new FilterComplex() object to use for our
            // filtering.
            // Our goal is to create a special filter entry for each avaiable
            // process data value that is available.
            // A filter entry needs to look like:
            // {
            //     id: `{string}`,      // A unique id selector for this filter
            //     name: `{string}`,    // the operation name displayed
            //     type, {obj}          // an object defining the editor to show
            //     fn: ()=>{}           // a function used for filtering elements
            // }
            //
            // In our filters, we are assigning filters to EACH field by the
            // field.id.  So the type definition needs to look like:
            // {
            //     "uniqueID of the field (field.id)" : {webixUI definition}
            // }

            Filter = this.AB.filterComplexNew(id);
            hashFieldIDs = this.availableProcessDataFieldsHash();

            if (this.object) {
               Filter.fieldsLoad(this.object.fields(), this.object);
               // NOTE: this will create default filters based upon the
               // object fields() and their types

               // Now we need to add in the Process Data Fields:
               // for each Process Data Field that matches our same object
               const foundFields = Object.keys(hashFieldIDs).map(
                  (f) => hashFieldIDs[f]
               );

               Filter.processFieldsLoad(foundFields);
               /*
               (foundFields ?? []).forEach((processField) => {
                  const type = {};
                  if (processField.field) {
                     type[processField.field.id] = {
                        view: "select",
                        options: [
                           {
                              id: "empty",
                              value: "choose option"
                           },
                           {
                              id: processField.key,
                              value: `context(${processField.label})`
                           }
                        ]
                     };
                  } else {
                     // if there is no .field, it is probably an embedded special field
                     // like: .uuid
                     const key = processField.key.split(".").pop();
                     type[key] = {
                        view: "select",
                        options: [
                           {
                              id: "empty",
                              value: "choose option"
                           },
                           {
                              id: processField.key,
                              value: `context(${processField.label})`
                           }
                        ]
                     };
                  }

                  // add an "equals" and "not equals" filter for each:
                  Filter.filterAdd([
                     {
                        id: `context_equals`,
                        name: `equals`,
                        type,
                        fn: (a, b) => {
                           return a === b;
                        }
                     },
                     {
                        id: `context_not_equal`,
                        name: `not equals`,
                        type,
                        fn: (a, b) => {
                           return a !== b;
                        }
                     }
                  ]);

               }); */
            }

            // every time the Filter "saves" it's data, it emits this event:
            // take the given condition and store it in our hidden element.
            Filter.on("save", (condition) => {
               // @param {obj} condition an object describing the filter
               // condition.

               this.params = this.params ?? {};
               this.params[pDef.name] = condition;

               const shortHand = $$(this.ids.shorthand);

               shortHand.define({
                  label: Filter.toShortHand(),
               });
               shortHand.refresh();

               // NOTE: the hidden element is a text field, so convert the
               // {condition object} => a string
               const elCondition = $$(this.ids.condition);

               elCondition.define({
                  value: JSON.stringify(this.params[pDef.name]),
               });
               elCondition.refresh();
            });

            // create the initial condition value from our inputs.
            initialCond = "";

            if (this.params && this.params[pDef.name]) {
               Filter.setValue(this.params[pDef.name]);
               initialCond = JSON.stringify(this.params[pDef.name]);
            } else {
               Filter.setValue(null);
            }

            // what we show on the panel, is a text representation
            // of the current condition.
            displayLabel = Filter.toShortHand();

            paramUI = {
               rows: [
                  {
                     id: this.ids.shorthand,
                     view: "button",
                     label: displayLabel,
                     on: {
                        onItemClick: function () {
                           Filter.popUp(this.$view, null, {
                              pos: "center",
                           });
                        },
                     },
                  },
                  // have a hidden field to contain the condition
                  // value we will parse out later
                  {
                     id: this.ids.condition,
                     view: "text",
                     value: initialCond,
                     hidden: true,
                  },
               ],
            };

            break;

         case "objectValues":
            // objectValues : shows a condenced textual representation of the
            // field => value changes.  Clicking on the text will show a popup
            // that allows you to add/remove additional field updates for
            // the current object.

            initialValue = "";
            Updater = new RowUpdater(myID, this.AB);

            if (this.object) Updater.objectLoad(this.object);

            // Set processed data key to value options
            Updater.setExtendedOptions(
               (this.task.process.processDataFields(this.task) ?? []).map(
                  (item) => {
                     return {
                        id: item.key,
                        value: item.label,
                     };
                  }
               )
            );

            // NOTE: .setValue() must be called once the RowUpdater is already
            // displayed.  See the end of popUp() below:
            if (this.params && this.params[pDef.name]) {
               Updater.setValue(this.params[pDef.name]);
               initialValue = JSON.stringify(this.params[pDef.name]);
            }

            popUp = () => {
               // show the RowUpdater in a popup:
               const ui = {
                  id: this.ids.popup,
                  view: "popup",
                  position: "center",
                  minWidth: 700,
                  modal: true,
                  resize: true,
                  body: {
                     rows: [
                        {
                           height: 30,
                           borderless: true,
                           cols: [
                              { fillspace: true },
                              {
                                 view: "button",
                                 value: "X",
                                 width: 30,
                                 click: () => {
                                    $$(this.ids.popup).hide();
                                 },
                              },
                           ],
                        },
                        Updater.ui(),
                        {
                           view: "button",
                           value: L("Save"),
                           css: "webix_primary",
                           click: () => {
                              this.params = this.params ?? {};
                              this.params[pDef.name] = Updater.getValue();
                              const sh = $$(this.ids.shorthand);

                              sh.define({
                                 badge: this.params[pDef.name].length,
                              });
                              sh.refresh();

                              const cond = $$(this.ids.condition);

                              cond.define({
                                 value: JSON.stringify(this.params[pDef.name]),
                              });
                              cond.refresh();

                              $$(this.ids.popup).hide();
                           },
                        },
                     ],
                  },
               };

               // create and show the popup
               this._myPopup = webix.ui(ui);
               this._myPopup.show();

               // NOTE: on a RowUpdater, the values need to be set
               // AFTER it is displayed:
               if (this.params && this.params[pDef.name])
                  Updater.setValue(this.params[pDef.name]);
            };

            paramUI = {
               rows: [
                  // the textual shorthand for these values
                  {
                     id: this.ids.shorthand,
                     view: "button",
                     label: L("Update Popout"),
                     badge: this.params[pDef.name]?.length,
                     on: {
                        onItemClick: () => {
                           popUp();
                        },
                     },
                  },
                  // the hidden field that contains the results
                  {
                     id: this.ids.condition,
                     view: "text",
                     value: initialValue,
                     hidden: true,
                  },
               ],
            };

            break;

         case "taskParam":
            paramUI = {
               id: this.ids.taskparam,
               view: "text",
               label: L("Variable"),
               labelWidth: 70,
               value: this.params[pDef.name],
               placeholder: L("Enter parameter name"),
               on: {
                  onChange: (newValue, oldValue) => {
                     // this.params = this.params ?? {};
                     if (newValue !== this.params[pDef.name]) {
                        this.params[pDef.name] = newValue;
                        this.paramChanged(pDef, id);
                     }
                  },
               },
            };

            break;
      }

      return paramUI;
   }

   /**
    * @method viewAddNext()
    * Add the next selector row After this Operation:
    * @param {string} id
    *        the unique id for where the properties panel is displayed.
    * @param {webixNode} topView
    *        the current webix node that needs this view added to
    *        NOTE: this should be the top container that is adding a new
    *        row for each operation.
    */
   viewAddNext(id, topView) {
      const uiRow = this.uiNextRow(id);

      topView.addView(uiRow);
   }

   /**
    * @method viewAddParams()
    * Add operation parameter(s) for each parameterDefinition we have defined.
    * @param {string} id
    *        the unique id for where the properties panel is displayed.
    * @param {webixNode} rowView
    *        the current webix node that needs this view added to
    *        NOTE: this should be the ROW that the parameters are added to
    */
   viewAddParams(id, rowView) {
      const params = [];

      this.parameterDefinitions.forEach((pDef) => {
         // get the definition from .uiParamUI()
         params.push(this.uiParamUI(pDef, id));
      });

      let toInsert = null;

      // stack parameters in a row if there are more than 1
      if (params.length > 1)
         toInsert = {
            rows: params,
         };
      else toInsert = params.pop();

      if (toInsert) {
         rowView.removeView(rowView.getChildViews()[1]);
         rowView.addView(toInsert);
      }
   }

   warnings() {
      let myWarnings = this._warnings || [];
      if (this.next)
         myWarnings = myWarnings.concat(this.next.warnings()).filter((w) => w);
      return this.AB.uniq(myWarnings);
   }

   warningsEval() {
      this._warnings = [];
      if (this.next) this.next.warningsEval();
   }

   // warningsAll() {
   //    let myWarnings = this.warnings();
   //    if (this.next) {
   //       myWarnings = myWarnings.concat(this.next.warningsAll());
   //    }
   //    return myWarnings;
   // }

   /**
    * @method warningMessage(message)
    * Save a warning message in a common format for our ProcessTasks.
    */
   warningMessage(message) {
      // this.emit("warning", `${this.key}: ${message}`);
      this._warnings = this._warnings || [];
      this._warnings.push({ message: `${this.key}: ${message}` });
   }

   ////
   //// QueryString Parser routines:
   ////
}

module.exports = ABQL;
