/*
 * ABQLFind
 *
 * An ABQLFind depends on a BASE QL object (Object, Datacollection, Query)
 * and can perform a DB query based upon that BASE object.
 *
 */
const ABQLFindCore = require("../../core/ql/ABQLFindCore.js");
class ABQLFind extends ABQLFindCore {}

module.exports = ABQLFind;
