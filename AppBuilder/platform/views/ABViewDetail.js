const ABViewDetailCore = require("../../core/views/ABViewDetailCore");
const ABViewDetailComponent = require("./viewComponent/ABViewDetailComponent");
// const ABViewDetailItemComponent = require("./ABViewDetailComponent");
const ABObjectQuery = require("../ABObjectQuery");

const ABViewDetailPropertyComponentDefaults = ABViewDetailCore.defaultValues();

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewDetail extends ABViewDetailCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   /**
    * @method editorComponent
    * return the Editor for this UI component.
    * the editor should display either a "block" view or "preview" of
    * the current layout of the view.
    * @param {string} mode what mode are we in ['block', 'preview']
    * @return {Component}
    */
   // editorComponent(App, mode) {
   //    var comp = super.editorComponent(App, mode);

   //    // Define height of cell
   //    comp.ui.rows[0].cellHeight = 75;

   //    return comp;
   // }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj } v1App
    * @param {string} idPrefix - define to support in 'Datacollection' widget
    *
    * @return {obj } UI component
    */
   component(v1App, idPrefix) {
      let component = new ABViewDetailComponent(this);

      // if this is our v1Interface
      if (v1App) {
         var newComponent = component;
         component = {
            ui: component.ui(),
            init: (options, accessLevel) => {
               return newComponent.init(this.AB, accessLevel);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
      }

      return component;
   }

   componentOld(App, idPrefix) {
      // get webix.dashboard
      var container = super.component(App, idPrefix);

      var _ui = {
         type: "form",
         borderless: true,
         // height: this.settings.height || ABViewDetailPropertyComponentDefaults.height,
         rows: [
            {
               // view: "scrollview",
               body: container.ui,
            },
         ],
      };

      // make sure each of our child views get .init() called
      var _init = (options, parentAccessLevel) => {
         // populate .views to webix.dashboard
         container.init(options, parentAccessLevel);
      };

      var _logic = {
         displayData: (rowData) => {
            rowData = rowData || {};

            let views = this.views() || [];
            views = views.sort((a, b) => {
               if (!a || !b || !a.field || !b.field) return 0;

               // NOTE: sort order of calculated fields.
               // FORMULA field type should be calculated before CALCULATE field type
               if (a.field.key == "formula" && b.field.key == "calculate") {
                  return -1;
               } else if (
                  a.field.key == "calculate" &&
                  b.field.key == "formula"
               ) {
                  return 1;
               } else {
                  return 0;
               }
            });

            views.forEach((f) => {
               if (f.field) {
                  var field = f.field();
                  var val;

                  if (!field) return;

                  if (!rowData) return;

                  // get value of relation when field is a connect field
                  switch (field.key) {
                     case "connectObject":
                        val = field.pullRelationValues(rowData);
                        break;
                     case "list":
                        val = rowData[field.columnName];
                        if (!val) {
                           val = "";
                           break;
                        }

                        if (field.settings.isMultiple == 0) {
                           let myVal = "";

                           field.settings.options.forEach(function (options) {
                              if (options.id == val) myVal = options.text;
                           });

                           if (field.settings.hasColors) {
                              let myHex = "#66666";
                              let hasCustomColor = "";
                              field.settings.options.forEach(function (h) {
                                 if (h.text == myVal) {
                                    myHex = h.hex;
                                    hasCustomColor = "hascustomcolor";
                                 }
                              });
                              myVal = `<span class="webix_multicombo_value ${hasCustomColor}" style="background-color: ${myHex} !important;"><span>${myVal}</span></span>`;
                           }

                           val = myVal;
                        } else {
                           let items = [];
                           let myVal = "";
                           val.forEach((value) => {
                              var hasCustomColor = "";
                              var optionHex = "";
                              if (field.settings.hasColors && value.hex) {
                                 hasCustomColor = "hascustomcolor";
                                 optionHex = `background: ${value.hex};`;
                              }
                              field.settings.options.forEach(function (
                                 options
                              ) {
                                 if (options.id == value.id)
                                    myVal = options.text;
                              });
                              items.push(
                                 `<span class="webix_multicombo_value ${hasCustomColor}" style="${optionHex}" optvalue="${value.id}"><span>${myVal}</span></span>`
                              );
                           });
                           val = items.join("");
                        }
                        break;
                     case "user":
                        val = field.pullRelationValues(rowData);
                        break;
                     case "file":
                        val = rowData[field.columnName];
                        break;
                     case "formula":
                        if (rowData) {
                           let dv = this.datacollection;
                           let ds = dv ? dv.datasource : null;
                           let needRecalculate =
                              !ds || ds instanceof ABObjectQuery ? false : true;

                           val = field.format(rowData, needRecalculate);
                        }
                        break;
                     default:
                        val = field.format(rowData);
                     // break;
                  }
               }

               // set value to each components
               var vComponent = f.component(App, idPrefix);

               // if (vComponent.onShow) vComponent.onShow();

               if (vComponent.logic && vComponent.logic.setValue) {
                  vComponent.logic.setValue(val);
               }

               if (vComponent.logic && vComponent.logic.displayText) {
                  vComponent.logic.displayText(rowData);
               }
            });
         },
      };

      var _onShow = () => {
         container.onShow();
         try {
            const dataCy = `Detail ${this.name.split(".")[0]} ${this.id}`;
            $$(container.ui.id).$view.setAttribute("data-cy", dataCy);
         } catch (e) {
            console.warn("Problem setting data-cy", e);
         }

         // listen DC events
         let dv = this.datacollection;
         if (dv) {
            let currData = dv.getCursor();
            if (currData) {
               _logic.displayData(currData);
            }

            this.eventAdd({
               emitter: dv,
               eventName: "changeCursor",
               listener: _logic.displayData,
            });

            this.eventAdd({
               emitter: dv,
               eventName: "create",
               listener: (createdRow) => {
                  let currCursor = dv.getCursor();
                  if (currCursor && currCursor.id == createdRow.id)
                     _logic.displayData(createdRow);
               },
            });

            this.eventAdd({
               emitter: dv,
               eventName: "update",
               listener: (updatedRow) => {
                  let currCursor = dv.getCursor();
                  if (currCursor && currCursor.id == updatedRow.id)
                     _logic.displayData(updatedRow);
               },
            });
         }
      };

      return {
         ui: _ui,
         init: _init,
         logic: _logic,

         onShow: _onShow,
      };
   }
};
