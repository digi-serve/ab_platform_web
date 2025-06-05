const ApiTaskCore = require("../../../core/process/tasks/ABProcessTaskServiceApiCore.js");

// let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ApiTask extends ApiTaskCore {
   static defaults() {
      return { key: "Api" };
   }

   fromValues(values) {
      super.fromValues(values);
      // These are raw values on the client, need to be saved so we can update
      // the server. There they will be encrypted and stored seperate from our
      // definition.
      this.secrets = values.secrets;
   }

   toObj() {
      const obj = super.toObj();
      obj.secrets = this.secrets;
      return obj;
   }

   ////
   //// Process Instance Methods
   ////

   warningsEval() {
      super.warningsEval();

      ["url", "method"].forEach(
         (prop) => !this[prop] && this.warningMessage(`is missing a ${prop}`)
      );

      // Verify secrets / process data patterns are valid
      const dataPattern = /<%= (.+?) %>/g;
      const dataToCheck = [];
      ["body", "url"].forEach((prop) => {
         if (!this[prop]) return;
         const matches = (this[prop].match(dataPattern) ?? []).map((m) => ({
            location: prop,
            match: m,
         }));
         dataToCheck.push(...matches);
      });
      if (this.headers) {
         this.headers.forEach(({ value }) => {
            const matches = (value.match(dataPattern) ?? []).map((m) => ({
               location: "header",
               match: m,
            }));
            dataToCheck.push(...matches);
         });
      }
      if (dataToCheck.length == 0) return;
      const processData = this.process
         .processDataFields(this)
         .filter((i) => i)
         .map((i) => i.key);
      const secrets = this.storedSecrets ?? [];
      this.secrets?.forEach((s) => secrets.push(s.name));
      dataToCheck.forEach(({ location, match }) => {
         const [, secret] = /<%= Secret: (.+?) %>/.exec(match) ?? [];
         if (secret) {
            if (!secrets.includes(secret)) {
               this.warningMessage(
                  `is missing secret '${secret}' in ${location}.`
               );
            }
         } else {
            const [, data] = /<%= (.+?) %>/.exec(match) ?? [];
            if (!processData.includes(data)) {
               this.warningMessage(
                  `references unkown data field '${data}' in ${location}`
               );
            }
         }
      });
   }
};
