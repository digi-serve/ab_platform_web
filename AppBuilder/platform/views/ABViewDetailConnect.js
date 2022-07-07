const ABViewDetailConnectCore = require("../../core/views/ABViewDetailConnectCore");
const ABViewPropertyAddPage = require("./viewProperties/ABViewPropertyAddPage")
   .default;

const ABViewDetailConnectComponent = require("./viewComponent/ABViewDetailConnectComponent");

module.exports = class ABViewDetailConnect extends ABViewDetailConnectCore {
   ///
   /// Instance Methods
   ///

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      this.addPageTool.fromSettings(this.settings);
   }

   //
   // Property Editor
   //

   static propertyEditorDefaultElements(App, ids, _logic, ObjectDefaults) {
      let commonUI = super.propertyEditorDefaultElements(
         App,
         ids,
         _logic,
         ObjectDefaults
      );

      let idBase = "ABViewDetailConnectPropertyEditor";

      if (this.addPageProperty == null) {
         this.addPageProperty = ABViewPropertyAddPage.propertyComponent(
            App,
            idBase
         );
         this.addPageProperty.init({
            onSave: () => {
               let currView = _logic.currentEditObject();
               if (!currView) return;

               // refresh settings
               this.propertyEditorValues(ids, currView);

               // trigger a save()
               this.propertyEditorSave(ids, currView);
            },
         });
      }

      // in addition to the common .label  values, we
      // ask for:
      return commonUI.concat([this.addPageProperty.ui]);
   }

   static propertyEditorPopulate(App, ids, view) {
      super.propertyEditorPopulate(App, ids, view);

      this.addPageProperty.setSettings(view, view.settings);
   }

   static propertyEditorValues(ids, view) {
      super.propertyEditorValues(ids, view);

      view.settings = this.addPageProperty.getSettings(view);

      // refresh settings of app page tool
      view.addPageTool.fromSettings(view.settings);
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} v1App
    * @param {string} idPrefix
    *
    * @return {obj} UI component
    */
   component(v1App, idPrefix) {
      let component = new ABViewDetailConnectComponent(this);

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
      let idBase = "ABViewDetailConnect_" + (idPrefix || "") + this.id;
      let baseComp = super.component(App, idBase);
      var ids = {
         detail: this.parentDetailComponent()?.id || this.parent.id,
      };

      let addPageComponent = this.addPageTool.component(App, idBase);

      let _init = (options) => {
         baseComp.init(options);

         addPageComponent.applicationLoad(this.application);
         addPageComponent.init({
            // TODO : callbacks
         });
      };

      baseComp.ui.on = {
         //Add data-cy attribute for Cypress Testing
         onAfterRender: () => {
            let columnName = this.field((fld) => {
               return fld.id == this.settings.fieldId;
            }).columnName;
            const dataCy = `detail connected ${columnName} ${this.settings.fieldId} ${ids.detail}`;
            $$(baseComp.ui.id)?.$view.setAttribute("data-cy", dataCy);
         },
      };

      // Click to open new data form
      // addPageComponent.ui.onClick = addPageComponent.ui.onClick || {};
      let ui = {};
      if (addPageComponent.ui) {
         addPageComponent.ui.click = (e, id, trg) => {
            // e.stopPropagation();

            // TODO: busy cursor

            let dc;
            let detail = this.detailComponent();
            if (detail) dc = detail.datacollection;

            setTimeout(() => {
               addPageComponent.onClick(dc);
            }, 50);

            return false;
         };

         ui = {
            rows: [
               {
                  cols: [baseComp.ui, addPageComponent.ui],
               },
            ],
         };
      } else {
         ui = baseComp.ui;
      }

      return {
         ui: ui,

         init: _init,
         setValue: (val) => {
            let vals = [];
            if (Array.isArray(val)) {
               val.forEach((record) => {
                  vals.push(
                     `<span class="webix_multicombo_value">${record.text}</span>`
                  );
               });
            } else {
               vals.push(
                  `<span class="webix_multicombo_value">${val.text}</span>`
               );
            }
            baseComp.setValue(baseComp.ui().id, vals.join(""));
         },
      };
   }

   get addPageTool() {
      if (this.__addPageTool == null)
         this.__addPageTool = new ABViewPropertyAddPage();

      return this.__addPageTool;
   }
};
