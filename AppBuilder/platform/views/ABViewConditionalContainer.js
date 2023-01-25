const ABViewConditionalContainerCore = require("../../core/views/ABViewConditionalContainerCore");
const ABViewConditionalContainerComponent = require("./viewComponent/ABViewConditionalContainerComponent");

const L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewConditionalContainer extends (
   ABViewConditionalContainerCore
) {
   /**
    * @function component()
    * return a UI component based upon this view.
    * @param {obj} v1App
    * @return {obj} UI component
    */
   component(v1App) {
      let component = new ABViewConditionalContainerComponent(this);

      // if this is our v1Interface
      if (v1App) {
         const newComponent = component;
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

   // /**
   //  * @method component()
   //  * return a UI component based upon this view.
   //  * @param {obj} App
   //  * @return {obj} UI component
   //  */
   // componentOld(App) {
   //    var idBase = "ABViewConditionalContainer_" + this.id;
   //    var ids = {
   //       component: App.unique(`${idBase}_component`),
   //    };

   //    var baseComp = super.component(App);

   //    const ifComp = this.views()[0].component(App);
   //    const elseComp = this.views()[1].component(App);

   //    ifComp.ui.batch = "if";
   //    elseComp.ui.batch = "else";

   //    var _ui = {
   //       id: ids.component,
   //       view: "multiview",
   //       cells: [
   //          {
   //             batch: "wait",
   //             view: "layout",
   //             rows: [
   //                {
   //                   view: "label",
   //                   label: L("Please wait..."),
   //                },
   //             ],
   //          },
   //          ifComp.ui,
   //          elseComp.ui,
   //       ],
   //    };

   //    var _init = (options, accessLevel) => {
   //       baseComp.init(options);
   //       ifComp.init(options, accessLevel);
   //       elseComp.init(options, accessLevel);

   //       this.populateFilterComponent();

   //       var dv = this.datacollection;
   //       if (dv) {
   //          // listen DC events
   //          this.eventAdd({
   //             emitter: dv,
   //             eventName: "loadData",
   //             listener: _logic.displayView.bind(this),
   //          });
   //          this.eventAdd({
   //             emitter: dv,
   //             eventName: "initializedData",
   //             listener: () => _logic.displayView(),
   //          });

   //          this.eventAdd({
   //             emitter: dv,
   //             eventName: "changeCursor",
   //             listener: (...p) => _logic.displayView(...p),
   //          });
   //       }

   //       _logic.displayView();
   //    };

   //    var _logic = {
   //       displayView: (currData) => {
   //          let dv = this.datacollection;
   //          if (dv && dv.dataStatus === dv.dataStatusFlag.initialized) {
   //             if (currData == null) {
   //                currData = dv.getCursor();
   //             }
   //             var isValid = this.__filterComponent.isValid(currData);

   //             // dataStatus initialized
   //             // filter is valid
   //             // currentData has been loaded from cursor
   //             if (
   //                isValid &&
   //                currData != undefined // if , at this point, there is no cursor; the data collection is empty
   //             ) {
   //                // if (isValid && currData) {
   //                $$(ids.component).showBatch("if");
   //             } else {
   //                $$(ids.component).showBatch("else");
   //             }
   //          } else {
   //             // show 'waiting' panel if data is not loaded
   //             $$(ids.component).showBatch("wait");
   //             return;
   //          }
   //       },
   //    };

   //    return {
   //       ui: _ui,
   //       init: _init,
   //       logic: _logic,

   //       onShow: baseComp.onShow,
   //    };
   // }

   async save() {
      const viewIf = this.views()[0];
      const viewElse = this.views()[1];
      const penddingSave = [];

      if (viewIf) penddingSave.push(viewIf.save());

      if (viewElse) penddingSave.push(viewElse.save());

      await Promise.all(penddingSave);

      await super.save();
   }
};
