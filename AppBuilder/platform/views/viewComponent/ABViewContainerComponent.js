const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewContainerComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(baseView, idBase || `ABViewContainer_${baseView.id}`, ids);

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
         baseView.changePage(pageId);
      };
   }

   ui(uiComponents) {
      // Generate rows & cols of views to .layout
      const views = this.view.viewsSortByPosition();
      const rowViews = this.getElements(views);
      const _ui = super.ui(uiComponents || rowViews);

      delete _ui.type;

      return _ui;
   }

   // make sure each of our child views get .init() called
   async init(AB, accessLevel = 0) {
      await super.init(AB);

      const allInits = [];

      // // register our callbacks:
      // if (options) {
      //    for (var c in _logic.callbacks) {
      //       _logic.callbacks[c] = options[c] || _logic.callbacks[c];
      //    }
      // }

      // see access by CSS class
      $$(this.ids.component)?.define("css", `accessLevel-${accessLevel}`);

      const viewComponents = this.viewComponents;

      // attach all the .UI views:
      for (const key in viewComponents) {
         // skip when the view is removed.
         if (
            !viewComponents[key] ??
            !this.view.views((v) => v.id === key).length
         ) {
            !viewComponents[key];

            continue;
         }

         // Initial component along with options in case there are callbacks we need to listen for
         if (accessLevel) {
            allInits.push(viewComponents[key].init(AB, accessLevel));

            continue;
         }

         $$(this.viewComponentIDs[key]).hide();
      }

      await Promise.all(allInits);
   }

   getElements(views) {
      const rows = [];
      const componentMap = {};

      let curRowIndex;
      let curColIndex;

      const settings = this.settings;
      const defaultSettings = this.view.constructor.defaultValues();

      views.forEach((v) => {
         // let component = v.component(/* App, idPrefix */);
         // NOTE: PONG - Just temporary to be compatible old & new versions
         let component;

         try {
            component = v.component();
         } catch (err) {
            component = v.component(this.AB._App);

            const ui = component.ui;

            component.ui = (() => ui).bind(component);
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
         if (v.position.y == null || v.position.y !== curRowIndex) {
            curRowIndex = v.position.y || rows.length;
            curColIndex = 0;

            const rowNew = {
               cols: [],
            };

            // Create columns following setting value
            const colNumber = settings.columns || defaultSettings.columns;

            for (let i = 0; i < colNumber; i++)
               rowNew.cols.push({
                  gravity: settings.gravity?.[i]
                     ? parseInt(settings.gravity[i])
                     : defaultSettings.gravity,
               });

            rows.push(rowNew);
         }

         // Get the last row
         const rowIndx = rows.length - 1;
         const curRow = rows[rowIndx];
         const newPos = v.position.x ?? 0;
         const mapKey = `${rowIndx}-${newPos}`;

         let getGrav = 1;

         if (componentMap[mapKey])
            console.error(
               `Component[${component?.ids?.component}] is overwriting component[${componentMap[mapKey].ids?.component}]. <-- Reorder them to fix.`
            );

         componentMap[mapKey] = component;

         if (curRow.cols[newPos]?.gravity)
            getGrav = curRow.cols[newPos].gravity;

         const _ui = component.ui();

         this.viewComponentIDs[v.id] = _ui.id;
         _ui.gravity = getGrav;

         // Add ui of sub-view to column
         curRow.cols[newPos] = _ui;

         // Trigger 'changePage' event to parent
         this.eventAdd({
            emitter: v,
            eventName: "changePage",
            listener: this._handlerChangePage.bind(this),
         });

         curColIndex++;
      });

      return rows;
   }

   onShow() {
      super.onShow();

      // calll .onShow in child components
      Object.values(this.viewComponents).forEach((val) => {
         val.onShow?.();
      });
   }
};
