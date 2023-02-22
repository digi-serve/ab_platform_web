// import ABApplication from "./ABApplication"
// const ABApplication = require("./ABApplication"); // NOTE: change to require()
const ABProcessTriggerCore = require("../../../core/process/tasks/ABProcessTriggerCore.js");

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABProcessTrigger extends ABProcessTriggerCore {};
