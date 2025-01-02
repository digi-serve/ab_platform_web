/*
 * ABQLSetFirst
 *
 * An ABQLFind depends on a BASE QL object (Object, Datacollection, Query)
 * and can perform a DB query based upon that BASE object.
 *
 */
const ABQLSetFirstCore = require("../../core/ql/ABQLSetFirstCore.js");
class ABQLSetFirst extends ABQLSetFirstCore {}

module.exports = ABQLSetFirst;
