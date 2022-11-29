/*
 * ABQLRowSave
 *
 * An ABQLRowSave can store the current Data set into the Process Task it is
 * in, so that this data can be made available to other Process Tasks.
 *
 */

const ABQLRowSaveCore = require("../../core/ql/ABQLRowSaveCore.js");

class ABQLRowSave extends ABQLRowSaveCore {
   paramChanged(pDef, id) {
      super.paramChanged(pDef);
   }
}
ABQLRowSave.uiIndentNext = 20;

module.exports = ABQLRowSave;
