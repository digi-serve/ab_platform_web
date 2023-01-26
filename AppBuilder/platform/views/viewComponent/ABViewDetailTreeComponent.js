const ABViewDetailItemComponent = require("./ABViewDetailItemComponent");

module.exports = class ABViewDetailTreeComponent extends (
   ABViewDetailItemComponent
) {
   constructor(baseView, idBase) {
      super(baseView, idBase ?? `ABViewDetailTree_${baseView.id}`);
   }

   get className() {
      return "ab-detail-tree";
   }

   ui() {
      return super.ui();
   }

   async init(AB) {
      await super.init(AB);

      // add div of tree to detail
      this.setValue(`<div class="${this.className}"></div>`);
   }

   getDomTree() {
      const $detail = $$(this.ids.detail);

      if (!$detail) return;

      return $detail.$view.getElementsByClassName(this.className)[0];
   }

   setValue(val) {
      // convert value to array
      const vals = [];

      if (val && !Array.isArray(val)) vals.push(val);

      setTimeout(() => {
         // get tree dom
         const domTree = this.getDomTree();

         if (!domTree) return false;

         const field = this.view.field();
         const branches = [];

         if (typeof field.settings.options.data === "undefined")
            field.settings.options = new this.AB.Webix.TreeCollection({
               data: field.settings.options,
            });

         field.settings.options.data.each(function (obj) {
            if (vals.indexOf(obj.id) !== -1) {
               let html = "";
               let rootid = obj.id;

               while (this.getParentId(rootid)) {
                  field.settings.options.data.each(function (par) {
                     if (
                        field.settings.options.data.getParentId(rootid) ===
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

         const myHex = "#4CAF50";

         let nodeHTML = "<div class='list-data-values'>";

         branches.forEach(function (item) {
            nodeHTML += `<span class="selectivity-multiple-selected-item rendered" style="background-color: ${myHex} !important;">${item}</span>`;
         });

         nodeHTML += "</div>";
         domTree.innerHTML = nodeHTML;

         let height = 33;

         if (domTree.scrollHeight > 33) height = domTree.scrollHeight;

         const $detail = $$(this.ids.detail);

         $detail.config.height = height;
         $detail.resize();
      }, 50);
   }
};
