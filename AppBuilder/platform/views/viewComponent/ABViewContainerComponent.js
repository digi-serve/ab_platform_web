const ABViewContainerCore = require("../../../core/views/ABViewContainerCore");
const ABViewComponent = require("./ABViewComponent").default;

const ABPropertyComponentDefaults = ABViewContainerCore.defaultValues();

module.exports = class ABViewContainerComponent extends ABViewComponent {
   constructor(baseView, idBase) {
      super(baseView, idBase);

      this.idBase = idBase;

      this.viewComponents = {
         /* view.id : {viewComponent} */
      };
      // {hash}
      // a reference of all our child views that we manage

      this.viewComponentIDs = {
         /* view.id : {viewComponent} */
      };
      // {hash}
      // a reference of all our child.ui().ids of the views we manage

      this._handlerChangePage = (pageId) => {
         this.view.changePage(pageId);
      };
   }

   ui() {
      // Generate rows & cols of views to .layout
      let views = this.view.viewsSortByPosition();
      let rowViews = this.getElements(views);

      return {
         id: this.ids.component,
         view: "layout",
         rows: rowViews,
      };
   }

   // make sure each of our child views get .init() called
   init(AB, parentAccessLevel = 0) {
      this.AB = AB;

      let allInits = [];

      // // register our callbacks:
      // if (options) {
      //    for (var c in _logic.callbacks) {
      //       _logic.callbacks[c] = options[c] || _logic.callbacks[c];
      //    }
      // }

      // see access by CSS class
      if ($$(this.ids.component))
         $$(this.ids.component).define(
            "css",
            `accessLevel-${parentAccessLevel}`
         );

      // attach all the .UI views:
      for (var key in this.viewComponents) {
         // skip when the view is removed.
         if (this.view.views((v) => v.id == key)[0] == null) return;

         var component = this.viewComponents[key];

         // Initial component along with options in case there are callbacks we need to listen for
         if (parentAccessLevel > 0) {
            allInits.push(component.init(AB, parentAccessLevel));
         } else {
            $$(this.viewComponentIDs[key]).hide();
         }
      }

      return Promise.all(allInits);
   }

   getElements(views) {
      var rows = [];
      var curRowIndex;
      var curColIndex;
      var componentMap = {};

      views.forEach((v) => {
         // let component = v.component(/* App, idPrefix */);
         // NOTE: PONG - Just temporary to be compatible old & new versions
         let component;
         try {
            component = v.component();
         } catch (err) {
            component = v.component(this.AB._App);
            component.ui = () => component.ui;
         }

         this.viewComponents[v.id] = component;

         ////
         //// TODO: figure out the embedded Callbacks => emit()
         ////
         // if key == "form" or "button" register the callbacks to the parent
         // NOTE this will only work on the last form of a page!
         // if (v.key == "form" && v._logic.callbacks) {
         //    _logic.callbacks = v._logic.callbacks;
         // }

         // Create a new row
         if (v.position.y == null || v.position.y != curRowIndex) {
            curRowIndex = v.position.y || rows.length;
            curColIndex = 0;

            var rowNew = {
               cols: [],
            };

            // Create columns following setting value
            var colNumber =
               this.settings.columns || ABPropertyComponentDefaults.columns;
            for (var i = 0; i < colNumber; i++) {
               var grav =
                  this.settings.gravity && this.settings.gravity[i]
                     ? parseInt(this.settings.gravity[i])
                     : ABPropertyComponentDefaults.gravity;
               rowNew.cols.push({
                  gravity: grav,
               });
            }

            rows.push(rowNew);
         }

         // Get the last row
         let rowIndx = rows.length - 1;
         var curRow = rows[rowIndx];

         var newPos = v.position.x || 0;
         var getGrav = 1;

         let mapKey = `${rowIndx}-${newPos}`;
         if (componentMap[mapKey]) {
            console.error(
               `Component[${component.ids.component}] is overwriting component[${componentMap[mapKey].ids.component}]. <-- Reorder them to fix.`
            );
         }
         componentMap[mapKey] = component;

         if (curRow.cols[newPos] && curRow.cols[newPos].gravity) {
            getGrav = curRow.cols[newPos].gravity;
         }

         let _ui = component.ui();
         this.viewComponentIDs[v.id] = _ui.id;

         _ui.gravity = getGrav;

         // Add ui of sub-view to column
         curRow.cols[newPos] = _ui;

         curColIndex += 1;

         // Trigger 'changePage' event to parent
         this.eventAdd({
            emitter: v,
            eventName: "changePage",
            listener: this._handlerChangePage,
         });
      });

      return rows;
   }

   onShow() {
      let dv = this.view.datacollection;
      if (dv && dv.dataStatus == dv.dataStatusFlag.notInitial) {
         // load data when a widget is showing
         dv.loadData();
      }

      // calll .onShow in child components
      this.view.views().forEach((v) => {
         var component = this.viewComponents[v.id];
         component?.onShow?.();
      });
   }
};
