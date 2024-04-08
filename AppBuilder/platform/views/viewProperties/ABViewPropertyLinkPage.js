import ABViewProperty from "./ABViewProperty";
import ABViewComponent from "../viewComponent/ABViewComponent";

let L = (...params) => AB.Multilingual.label(...params);

class ABViewPropertyLinkPageComponent extends ABViewComponent {
   constructor(linkPageHelper, idBase) {
      let base = idBase || `ABViewPropertyLinkPage_xxx`;
      super(base, {});

      this.linkPageHelper = linkPageHelper;
      this.AB = linkPageHelper.AB;

      this.view = null;
      // {ABViewXXXX}
      // the ABView object this link references.

      this.datacollection = null;
      // {ABDataCollection}
      // The related Datacollection to this view that drives it's data.
      // we usually have to set the cursor before the view displays the
      // appropriate data.
   }

   ui() {
      return {};
   }

   init(options) {
      if (options.view) this.view = options.view;

      if (options.datacollection) this.datacollection = options.datacollection;
   }

   changePage(pageId, rowId) {
      if (this.datacollection) {
         this.datacollection.once("changeCursor", () => {
            this.view?.changePage(pageId);
         });
         this.datacollection.setCursor(rowId);
      } else {
         this.view?.changePage(pageId);
      }
   }
}

export default class ABViewPropertyLinkPage extends ABViewProperty {
   // constructor() {
   //    super();
   // }

   /** == UI == */
   /**
    * @param {object} App
    *      The shared App object that is created in OP.Component
    * @param {string} idBase
    *      Identifier for this component
    */
   component(v1App = false) {
      let component = new ABViewPropertyLinkPageComponent(this);

      // if this is our v1Interface
      if (v1App) {
         var newComponent = component;
         component = {
            ui: newComponent.ui(),
            init: (...params) => {
               return newComponent.init(...params);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
            changePage: (...params) => {
               return newComponent.changePage(...params);
            },
         };
      }

      return component;
   }
}
