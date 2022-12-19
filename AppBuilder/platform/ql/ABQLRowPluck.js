const ABQLRowPluckCore = require("../../core/ql/ABQLRowPluckCore.js");

class ABQLRowPluck extends ABQLRowPluckCore {
   /*
    * @method paramChanged()
    * respond to an update to the given parameter.
    * NOTE: the value will ALREADY be saved in this.params[pDef.name].
    * @param {obj} pDef
    *        the this.parameterDefinition entry of the parameter that was
    *        changed.
    */
   paramChanged(pDef, id) {
      super.paramChanged(pDef);

      // Re-generate next select options
      if (pDef.name === "fieldID") this.uiNextRowSelectorRefresh(id);
   }
}

module.exports = ABQLRowPluck;
