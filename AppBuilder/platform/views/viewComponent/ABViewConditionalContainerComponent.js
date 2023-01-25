const ABViewContainerComponent = require("./ABViewContainerComponent");

module.exports = class ABViewConditionalContainerComponent extends (
   ABViewContainerComponent
) {
   constructor(baseView, idBase) {
      super(baseView, idBase ?? `ABViewConditionalContainer_${baseView.id}`, {
         conditionalContainer: "",
      });

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
      const uiConditionalContainer = {
         id: this.ids.conditionalContainer,
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
      const _ui = super.ui([uiConditionalContainer]);

      uiConditionalContainer.cells.push(
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
         // listen DC events
         this.eventAdd({
            emitter: dc,
            eventName: "loadData",
            listener: () => this.displayView(), // Q? does this need to remain empty param?
         });

         this.eventAdd({
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
            .find((v) => v.name === "If")
            .component());
   }

   get elseComponent() {
      return (this._elseComponent =
         this._elseComponent ||
         this.view
            .views()
            .find((v) => v.name === "Else")
            .component());
   }

   displayView(currData) {
      const dc = this.datacollection;
      const ids = this.ids;
      const $conditionalContainer = $$(ids.conditionalContainer);

      if (dc) {
         if (!currData) currData = dc.getCursor();

         // show 'waiting' panel
         if (
            !currData &&
            (dc.dataStatus === dc.dataStatusFlag.notInitial ||
               dc.dataStatus === dc.dataStatusFlag.initializing)
         ) {
            $conditionalContainer?.showBatch("wait");

            return;
         }
      }

      const isValid = this.__filterComponent.isValid(currData);

      if (isValid) {
         // if (isValid && currData) {
         $conditionalContainer.showBatch("if");
         this.ifComponent?.onShow?.();
      } else {
         $conditionalContainer.showBatch("else");
         this.elseComponent?.onShow?.();
      }
   }

   populateFilterComponent() {
      const dc = this.datacollection;
      const __filterComponent = this.__filterComponent;

      if (dc?.datasource) __filterComponent.fieldsLoad(dc.datasource.fields());
      else __filterComponent.fieldsLoad([]);

      const baseView = this.view;
      const defaultSettings = baseView.constructor.defaultValues();

      __filterComponent.setValue(
         baseView.settings.filterConditions ?? defaultSettings.filterConditions
      );
   }
};
