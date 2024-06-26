import webix from "./webix";

const EventEmitter = require("events").EventEmitter;

export default class AB {
   constructor(definitions) {
      this._definitions = definitions || {};

      this.custom = {
         editunitlist: {
            view: "editunitlist",
         },
      };

      this.Class = {
         ABFieldManager: {
            allFields: () => {},
         },
      };
      this.ClassUI = ClassUI;
      this.Config = new Config();
      this.Multilingual = Multilingual;
      this._App = {
         Label: () => {},
         unique: () => {},
      };
      this.UISettings = {
         config: () => {
            return {};
         },
      };
      this.Webix = webix;
   }

   applicationNew() {}

   datacollectionByID() {
      return {
         datasource: {
            fieldByID: () => {
               return { title: "" };
            },
         },
      };
   }

   filterComplexNew() {
      return {
         fieldsLoad: () => {},
         setValue: () => {},
      };
   }
}

class ClassUI extends EventEmitter {
   constructor(definitions) {
      super();
      this.ids = {};
      if (typeof definitions == "string") {
         this.ids.component = definitions;
      } else if (definitions) {
         this.ids = definitions;
      }
   }
}

class Config {
   uiSettings() {
      return {};
   }
}

class Multilingual {
   static labelPlugin(...params) {
      this._params = params;
   }
   static label() {}
}
