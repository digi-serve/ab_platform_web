const ABObjectQuery = require("../../ABObjectQuery");
const ABViewContainerComponent = require("./ABViewContainerComponent");

module.exports = class ABViewDetailComponent extends ABViewContainerComponent {
   constructor(baseView, idBase) {
      super(baseView, idBase ?? `ABViewDetail_${baseView.id}`);
   }

   ui() {
      return super.ui();
   }

   onShow() {
      const baseView = this.view;

      try {
         const dataCy = `Detail ${baseView.name?.split(".")[0]} ${baseView.id}`;

         $$(this.ids.component).$view.setAttribute("data-cy", dataCy);
      } catch (e) {
         console.warn("Problem setting data-cy", e);
      }

      // listen DC events
      const dv = this.datacollection;

      if (dv) {
         const currData = dv.getCursor();

         if (currData) this.displayData(currData);

         this.eventAdd({
            emitter: dv,
            eventName: "changeCursor",
            listener: (...p) => this.displayData(...p),
         });

         this.eventAdd({
            emitter: dv,
            eventName: "create",
            listener: (createdRow) => {
               const currCursor = dv.getCursor();

               if (currCursor?.id === createdRow.id)
                  this.displayData(createdRow);
            },
         });

         this.eventAdd({
            emitter: dv,
            eventName: "update",
            listener: (updatedRow) => {
               const currCursor = dv.getCursor();

               if (currCursor?.id === updatedRow.id)
                  this.displayData(updatedRow);
            },
         });
      }

      super.onShow();
   }

   displayData(rowData = {}) {
      const views = (this.view.views() || []).sort((a, b) => {
         if (!a?.field || !b?.field) return 0;

         // NOTE: sort order of calculated fields.
         // FORMULA field type should be calculated before CALCULATE field type
         if (a.field.key === "formula" && b.field.key === "calculate")
            return -1;
         else if (a.field.key === "calculate" && b.field.key === "formula")
            return 1;

         return 0;
      });

      views.forEach((f) => {
         let val;

         if (f.field) {
            const field = f.field();

            if (!field || !rowData) return;

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

                  if (field.settings.isMultiple === 0) {
                     let myVal = "";

                     field.settings.options.forEach((options) => {
                        if (options.id === val) myVal = options.text;
                     });

                     if (field.settings.hasColors) {
                        let myHex = "#66666";
                        let hasCustomColor = "";

                        field.settings.options.forEach((h) => {
                           if (h.text === myVal) {
                              myHex = h.hex;
                              hasCustomColor = "hascustomcolor";
                           }
                        });

                        myVal = `<span class="webix_multicombo_value ${hasCustomColor}" style="background-color: ${myHex} !important;"><span>${myVal}</span></span>`;
                     }

                     val = myVal;
                  } else {
                     const items = [];

                     let myVal = "";

                     val.forEach((value) => {
                        let hasCustomColor = "";
                        let optionHex = "";

                        if (field.settings.hasColors && value.hex) {
                           hasCustomColor = "hascustomcolor";
                           optionHex = `background: ${value.hex};`;
                        }

                        field.settings.options.forEach((options) => {
                           if (options.id === value.id) myVal = options.text;
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
                     const dv = this.datacollection;
                     const ds = dv ? dv.datasource : null;
                     const needRecalculate =
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
         const vComponent = f.component(null, this.ids.component);

         // vComponent?.onShow();

         vComponent?.setValue?.(val);
         vComponent?.displayText?.(rowData);
      });
   }
};
