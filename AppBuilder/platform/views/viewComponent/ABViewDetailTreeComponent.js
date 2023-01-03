const ABViewDetailItemComponent = require("./ABViewDetailItemComponent");

module.exports = class ABViewDetailTreeComponent extends (
   ABViewDetailItemComponent
) {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewDetailTreeComponent_${baseView.id}`;
      super(baseView, idBase);
   }

   get className() {
      return "ab-detail-tree";
   }

   ui() {
      let _ui = super.ui();

      _ui.id = this.ids.component;

      return _ui;
   }

   init(options) {
      super.init(options);

      // add div of tree to detail
      let divTree = `<div class="${this.className}"></div>`;
      this.setValue(divTree);
   }

   getDomTree() {
      let elem = $$(this.ids.component);
      if (!elem) return;

      return elem.$view.getElementsByClassName(this.className)[0];
   }

   setValue(val) {
      // convert value to array
      if (val != null && !(val instanceof Array)) {
         val = [val];
      }

      setTimeout(() => {
         // get tree dom
         let domTree = this.getDomTree();
         if (!domTree) return false;

         let field = this.view.field();
         let branches = [];
         if (typeof field.settings.options.data == "undefined") {
            field.settings.options = new webix.TreeCollection({
               data: field.settings.options,
            });
         }

         field.settings.options.data.each(function (obj) {
            if (val != null && val.indexOf(obj.id) != -1) {
               let html = "";

               let rootid = obj.id;
               while (this.getParentId(rootid)) {
                  field.settings.options.data.each(function (par) {
                     if (
                        field.settings.options.data.getParentId(rootid) ==
                        par.id
                     ) {
                        html = `${par.text}: ${html}`;
                     }
                  });
                  rootid = this.getParentId(rootid);
               }

               html += obj.text;
               branches.push(html);
            }
         });

         let myHex = "#4CAF50";
         let nodeHTML = "<div class='list-data-values'>";
         branches.forEach(function (item) {
            nodeHTML += `<span class="selectivity-multiple-selected-item rendered" style="background-color: ${myHex} !important;">${item}</span>`;
         });
         nodeHTML += "</div>";
         domTree.innerHTML = nodeHTML;

         let height = 33;
         if (domTree.scrollHeight > 33) height = domTree.scrollHeight;

         $$(this.ids.component).config.height = height;
         $$(this.ids.component).resize();
      }, 50);
   }
};
