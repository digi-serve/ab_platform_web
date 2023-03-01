const ABProcessGatewayExclusiveCore = require("../../../core/process/tasks/ABProcessGatewayExclusiveCore.js");

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABProcessGatewayExclusive extends (
   ABProcessGatewayExclusiveCore
) {
   ////
   //// Process Instance Methods
   ////

   /**
    * diagramProperties()
    * return a set of values for the XML shape definition based upon
    * the current values of this object.
    * @return {json}
    */
   diagramProperties() {
      // the first entry is for the gateway element itself
      var properties = super.diagramProperties();
      /*[
         {
            id: this.diagramID,
            def: {
               name: this.name,
            },
         },
      ];
      */

      // now add any additional updates for each of our connections:
      var myOutgoingConnections = this.process.connectionsOutgoing(
         this.diagramID
      );
      myOutgoingConnections.forEach((conn) => {
         properties.push({
            id: conn.id,
            def: {
               name: this.conditions[conn.id]?.label ?? "",
            },
         });
      });
      return properties;
   }

   warningsEval() {
      super.warningsEval();

      // make sure we have > 1 connection.
      const myOutgoingConnections = this.process.connectionsOutgoing(
         this.diagramID
      );
      if (myOutgoingConnections.length < 2) {
         this.warningMessage("should have multiple outgoing connections");
      }

      // make sure there is no more then 1 connection that doesn't have
      // a condition:
      let numCondWithOne = 0;
      myOutgoingConnections.forEach((c) => {
         if ((this.conditions[c.id]?.filterValue.rules?.length ?? 0) == 0) {
            numCondWithOne++;
         }
      });

      if (numCondWithOne > 1) {
         this.warningMessage(
            "should not have more than 1 unfiltered connection."
         );
      }
   }
};
