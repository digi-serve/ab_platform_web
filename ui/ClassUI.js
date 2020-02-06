var EventEmitter = require("events").EventEmitter;

class ClassUI extends EventEmitter {
   constructor() {
      super();
   }

   attach(id) {
      var ui = this.ui();
      if (ui) {
         ui.container = id;
      }

      this.el = webix.ui(ui);
      return this.el;
   }
}

export default ClassUI;
