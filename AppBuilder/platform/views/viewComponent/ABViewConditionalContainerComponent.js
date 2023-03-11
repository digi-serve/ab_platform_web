const ABViewContainerComponent = require("./ABViewContainerComponent");

module.exports = class ABViewConditionalContainerComponent extends (
   ABViewContainerComponent
) {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewConditionalContainer_${baseView.id}`,
         Object.assign(
            {
               batch: "",
            },
            ids
         )
      );

      this._ifComponent = null;
      this._elseComponent = null;

      // Set filter value
      this.__filterComponent = baseView.AB.filterComplexNew(
         `${baseView.id}_filterComponent`
      );
      // this.__filterComponent.applicationLoad(application);
      this.populateFilterComponent();
   }

   ui() {
      const _uiConditionalContainer = {
         id: this.ids.batch,
         view: "multiview",
         cells: [
            {
               batch: "wait",
               view: "layout",
               rows: [
                  {
                     view: "label",
                     label: this.label("Please wait..."),
                  },
               ],
            },
         ],
      };
      const _ui = super.ui([_uiConditionalContainer]);

      _uiConditionalContainer.cells.push(
         Object.assign({ batch: "if" }, this.ifComponent.ui()),
         Object.assign({ batch: "else" }, this.elseComponent.ui())
      );

      delete _ui.type;

      return _ui;
   }

   async init(AB, accessLevel) {
      await super.init(AB, accessLevel);

      await Promise.all([
         this.ifComponent.init(AB, accessLevel),
         this.elseComponent.init(AB, accessLevel),
      ]);

      this.populateFilterComponent();

      const dc = this.datacollection;

      if (dc) {
         const baseView = this.view;

         // listen DC events
         baseView.eventAdd({
            emitter: dc,
            eventName: "loadData",
            listener: () => this.displayView(), // Q? does this need to remain empty param?
         });

         baseView.eventAdd({
            emitter: dc,
            eventName: "initializedData",
            listener: () => this.displayView(), // Q? does this need to remain empty param?
         });

         baseView.eventAdd({
            emitter: dc,
            eventName: "changeCursor",
            listener: (...p) => this.displayView(...p),
         });
      }

      this.displayView();
   }

   onShow() {
      super.onShow();

      this.populateFilterComponent();
      this.displayView();
   }

   get ifComponent() {
      return (this._ifComponent =
         this._ifComponent ||
         this.view
            .views()
            .find((v) => v?.name === "If")
            .component());
   }

   get elseComponent() {
      return (this._elseComponent =
         this._elseComponent ||
         this.view
            .views()
            .find((v) => v?.name === "Else")
            .component());
   }

   displayView(currData) {
      const dc = this.datacollection;
      const ids = this.ids;
      const $batch = $$(ids.batch);

      if (dc) {
         if (!currData) currData = dc.getCursor();

         // show 'waiting' panel
         if (
            !currData &&
            (dc.dataStatus === dc.dataStatusFlag.notInitial ||
               dc.dataStatus === dc.dataStatusFlag.initializing)
         ) {
            $batch.showBatch("wait");

            return;
         }
      }

      const isValid = this.__filterComponent.isValid(currData);

      if (isValid) {
         // if (isValid && currData) {
         $batch.showBatch("if");
         this.ifComponent?.onShow?.();
      } else {
         $batch.showBatch("else");
         this.elseComponent?.onShow?.();
      }
   }

   populateFilterComponent() {
      const dc = this.datacollection;
      const __filterComponent = this.__filterComponent;

      if (dc?.datasource) __filterComponent.fieldsLoad(dc.datasource.fields());
      else __filterComponent.fieldsLoad([]);

      __filterComponent.setValue(
         this.settings.filterConditions ??
            this.view.constructor.defaultValues().filterConditions
      );
   }
};
