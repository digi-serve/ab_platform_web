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

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   componentOld(App) {
      var idBase = "ABViewConditionalContainer_" + this.id;
      var ids = {
         component: App.unique(`${idBase}_component`),
      };

      var baseComp = super.component(App);

      const ifComp = this.views()[0].component(App);
      const elseComp = this.views()[1].component(App);

      ifComp.ui.batch = "if";
      elseComp.ui.batch = "else";

      var _ui = {
         id: ids.component,
         view: "multiview",
         cells: [
            {
               batch: "wait",
               view: "layout",
               rows: [
                  {
                     view: "label",
                     label: L("Please wait..."),
                  },
               ],
            },
            ifComp.ui,
            elseComp.ui,
         ],
      };

      var _init = (options, accessLevel) => {
         baseComp.init(options);
         ifComp.init(options, accessLevel);
         elseComp.init(options, accessLevel);

         this.populateFilterComponent();

         var dv = this.datacollection;
         if (dv) {
            // listen DC events
            this.eventAdd({
               emitter: dv,
               eventName: "loadData",
               listener: _logic.displayView.bind(this),
            });
            this.eventAdd({
               emitter: dv,
               eventName: "initializedData",
               listener: () => _logic.displayView(),
            });

            this.eventAdd({
               emitter: dv,
               eventName: "changeCursor",
               listener: _logic.displayView.bind(this),
            });
         }

         _logic.displayView();
      };

      var _logic = {
         displayView: (currData) => {
            let dv = this.datacollection;
            if (dv) {
               if (currData == null) {
                  currData = dv.getCursor();
               }

               // show 'waiting' panel
               if (
                  !currData &&
                  (dv.dataStatus == dv.dataStatusFlag.notInitial ||
                     dv.dataStatus == dv.dataStatusFlag.initializing)
               ) {
                  $$(ids.component).showBatch("wait");
                  return;
               }
            }

            var isValid = this.__filterComponent.isValid(currData);
            if (isValid) {
               // if (isValid && currData) {
               $$(ids.component).showBatch("if");
            } else {
               $$(ids.component).showBatch("else");
            }
         },
      };

      return {
         ui: _ui,
         init: _init,
         logic: _logic,

         onShow: baseComp.onShow,
      };
   }

   async save() {
      const viewIf = this.views()[0];
      const viewElse = this.views()[1];

      return Promise.resolve()
         .then(async () => (viewIf ? await viewIf.save() : Promise.resolve()))
         .then(async () =>
            viewElse ? await viewElse.save() : Promise.resolve()
         )
         .then(async () => await super.save());
   }
};
