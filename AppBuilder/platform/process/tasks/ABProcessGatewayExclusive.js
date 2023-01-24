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
};
