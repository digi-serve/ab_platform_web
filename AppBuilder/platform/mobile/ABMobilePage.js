const ABMobilePageCore = require("../../core/mobile/ABMobilePageCore");

module.exports = class ABMobilePage extends ABMobilePageCore {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues);

      // check to see if I've been updated, if so, alert my parent:
      this.__Handler_ABDEF_UPDATED = (def) => {
         if (def.id == this.id) {
            this.emit("definition.updated", this);
            this.AB.off("ab.abdefinition.update", this.__Handler_ABDEF_UPDATED);
         }
      };
      this.AB.on("ab.abdefinition.update", this.__Handler_ABDEF_UPDATED);

      // check to see if any of my child pages have been updated and
      // update my defintion of them:
      this.__Handler_DEF_UPDATED = (page) => {
         // create a new Field with the updated def
         var def = this.AB.definitionByID(page.id);
         if (!def) return;

         var newPage = this.pageNew(def);

         // we want to keep the same pageID order:
         var newPages = [];
         this.pages().forEach((pg) => {
            if (pg.id === page.id) {
               newPages.push(newPage);
               return;
            }
            newPages.push(pg);
         });

         this._pages = newPages;

         page.off("definition.updated", this.__Handler_DEF_UPDATED);
      };
      this.pages().forEach((p) => {
         p.on("definition.updated", this.__Handler_DEF_UPDATED);
      });
   }

   /**
    * @method refreshInstance()
    * This returns a NEW instance of a ABMobilePage based upon the latest
    * version of it's Definition.  It also resolves any current listeners
    * this copy currently has and prepare this to discard itself.
    */
   refreshInstance(parent) {
      // create a new Field with the updated def
      var def = this.AB.definitionByID(this.id);
      if (!def) return;

      var newPage = (parent ?? this.parent)?.pageNew(def);

      try {
         // detatch ourself from other emitters:
         this.AB.off("ab.abdefinition.update", this.__Handler_ABDEF_UPDATED);
         this.pages().forEach((pg) => {
            pg.removeAllListeners("definition.updated");
         });
      } catch (e) {
         debugger;
         console.error(e);
      }

      return newPage;
   }

   warningsEval() {
      super.warningsEval();
      let allViews = this.views();
      if (allViews.length == 0) {
         this.warningsMessage("has no widgets");
      }
      (this.pages() || []).forEach((p) => {
         p.warningsEval();
      });
   }
};
