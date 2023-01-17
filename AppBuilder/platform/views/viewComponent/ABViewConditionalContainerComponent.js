const ABViewConditionalContainerCore = require("../../../core/views/ABViewConditionalContainerCore");
const ABViewContainerComponent = require("./ABViewContainerComponent");

const ABViewPropertyDefaults = ABViewConditionalContainerCore.defaultValues();

module.exports = class ABViewConditionalContainerComponent extends (
   ABViewContainerComponent
) {
   constructor(baseView, idBase, ids) {
      idBase = idBase ?? `ABViewConditionalContainerComponent_${baseView.id}`;
      super(baseView, idBase, {
         component: "",
      });

      // Set filter value
      this.__filterComponent = this.view.AB.filterComplexNew(
         `${this.view.id}_filterComponent`
      );
      // this.__filterComponent.applicationLoad(application);
      this.populateFilterComponent();
   }

   ui() {
      // NOTE: call this to listen "changePage" event !!!
      super.ui();

      const ifComp = this.ifComponent;
      const elseComp = this.elseComponent;

      let uiIf = { fillspace: true };
      let uiElse = { fillspace: true };

      if (ifComp) {
         uiIf = ifComp.ui();
         uiIf.batch = "if";
      }

      if (elseComp) {
         uiElse = elseComp.ui();
         uiElse.batch = "else";
      }

      return {
         id: this.ids.component,
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
            uiIf,
            uiElse,
         ],
      };
   }

   init(options, accessLevel) {
      const view = this.view;

      super.init(view.AB, accessLevel);
      this.ifComponent?.init(view.AB, accessLevel);
      this.elseComponent?.init(view.AB, accessLevel);

      this.populateFilterComponent();

      const dc = view.datacollection;
      if (dc) {
         // listen DC events
         view.eventAdd({
            emitter: dc,
            eventName: "loadData",
            listener: () => this.displayView(), // Q? does this need to remain empty param?
         });

         view.eventAdd({
            emitter: dc,
            eventName: "changeCursor",
            listener: (...p) => this.displayView(...p),
         });
      }

      this.displayView();
   }

   async onShow() {
      this.populateFilterComponent();
      this.displayView();
   }

   get ifComponent() {
      if (!this._ifComponent)
         this._ifComponent = this.view.views()[0]?.component();

      return this._ifComponent;
   }

   get elseComponent() {
      if (!this._elseComponent)
         this._elseComponent = this.view.views()[1]?.component();

      return this._elseComponent;
   }

   displayView(currData) {
      const dc = this.view.datacollection;
      if (dc) {
         if (currData == null) {
            currData = dc.getCursor();
         }

         // show 'waiting' panel
         if (
            !currData &&
            (dc.dataStatus == dc.dataStatusFlag.notInitial ||
               dc.dataStatus == dc.dataStatusFlag.initializing)
         ) {
            $$(this.ids.component)?.showBatch("wait");
            return;
         }
      }

      const isValid = this.__filterComponent.isValid(currData);
      if (isValid) {
         // if (isValid && currData) {
         $$(this.ids.component).showBatch("if");
         this.ifComponent?.onShow?.();
      } else {
         $$(this.ids.component).showBatch("else");
         this.elseComponent?.onShow?.();
      }
   }

   populateFilterComponent() {
      const dc = this.view.datacollection;
      if (dc?.datasource)
         this.__filterComponent.fieldsLoad(dc.datasource.fields());
      else this.__filterComponent.fieldsLoad([]);

      this.__filterComponent.setValue(
         this.view.settings.filterConditions ??
            ABViewPropertyDefaults.filterConditions
      );
   }
};
