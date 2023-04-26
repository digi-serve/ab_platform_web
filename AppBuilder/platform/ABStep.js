const ABStepCore = require("../core/ABStepCore");

// let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABStep extends ABStepCore {
   constructor(attributes, AB) {
      super(attributes, AB);

      // listen
      // this.AB.on("ab.abprocess.update", (data) => {
      //    if (this.id == data.objectId) this.fromValues(data.data);
      // });
   }

   /**
    * @method destroy()
    *
    * destroy the current instance of ABObject
    *
    * also remove it from our parent application
    *
    * @return {Promise}
    */
   destroy() {
      // debugger;

      return new Promise((resolve, reject) => {
         this.toDefinition()
            .destroy()
            .then(() => {
               resolve();
            })
            .catch((err) => {
               reject(err);
            });
      });

      // remove all my Elements
      // var allElements = this.elements();
      // var allDestroy = [];
      // allElements.forEach((e) => {
      //    allDestroy.push(e.destroy());
      // });

      // return Promise.all(allDestroy).then(() => {
      //    // now remove myself
      //    return new Promise((resolve, reject) => {
      //       this.toDefinition()
      //          .destroy()
      //          .then(() => {
      //             // allow normal processing to contine now:
      //             resolve();
      //          })
      //          .then(() => {
      //             // in the background
      //             // remove this reference from ALL Applications that link
      //             // to me:
      //             console.error(
      //                "TODO: ABProcess.destroy(): refactor to .emit('destroyed') and let containing Apps self remove."
      //             );
      //             var appsWithProcess = this.AB.applications().find((a) => {
      //                return a.hasProcess(this);
      //             });
      //             if (appsWithProcess.length > 0) {
      //                appsWithProcess.forEach((a) => {
      //                   a.processRemove(this);
      //                });
      //             }
      //          })
      //          .catch((err) => {
      //             reject(err);
      //          });
      //    });
      // });
   }

   /**
    * @method save()
    *
    * persist this instance of ABObject with it's parent ABApplication
    *
    *
    * @return {Promise}
    *                .resolve( {this} )
    */
   save() {
      // debugger;
      return this.toDefinition()
         .save()
         .then((data) => {
            // if I didn't have an .id then this was a create()
            // and I need to update my data with the generated .id

            if (!this.id) {
               this.id = data.id;
            }
            return this;
         });
   }

   isValid() {
      // debugger;
      return true;
      // var validator = this.AB.Validation.validator();

      // // label/name must be unique:
      // var isNameUnique =
      //    this.AB.processes((o) => {
      //       return o.name.toLowerCase() == this.name.toLowerCase();
      //    }).length == 0;
      // if (!isNameUnique) {
      //    validator.addError(
      //       "name",
      //       L(`Process name must be unique ("{0}" already in use)`, [this.name])
      //    );
      // }

      // return validator;
   }

   /**
    * @method warningsAll()
    * Return an array of mis configuration warnings for our object or any
    * of our sub elements.
    * @return {array} [ { message: "warning message", data:{} } ]
    */
   warningsAll() {
      // debugger;
      // report both OUR warnings, and any warnings from any of our fields
      // var allWarnings = [].concat(this._warnings);
      // this.elements().forEach((e) => {
      //    e.warningsEval();
      //    allWarnings = allWarnings.concat(e.warnings());
      // });
      // if (this.elements().length == 0) {
      //    allWarnings.push({ message: "No process Tasks defined.", data: {} });
      // }
      // // perform a check of our xml document to see if we have any unknown
      // // shapes
      // if (!this._DOMParser) {
      //    if (window.DOMParser) {
      //       // Handy snippet from https://stackoverflow.com/questions/17604071/parse-xml-using-javascript
      //       this._DOMParser = function (xmlStr) {
      //          return new window.DOMParser().parseFromString(
      //             xmlStr,
      //             "text/xml"
      //          );
      //       };
      //    } else if (
      //       typeof window.ActiveXObject != "undefined" &&
      //       new window.ActiveXObject("Microsoft.XMLDOM")
      //    ) {
      //       this._DOMParser = function (xmlStr) {
      //          var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
      //          xmlDoc.async = "false";
      //          xmlDoc.loadXML(xmlStr);
      //          return xmlDoc;
      //       };
      //    } else {
      //       throw new Error("No XML parser found");
      //    }
      // }
      // // find any references to our generic shapes
      // let xml = this._DOMParser(this.xmlDefinition);
      // const genericShapes = [
      //    "bpmn2:startEvent",
      //    "bpmn2:task",
      //    "bpmn2:endEvent",
      // ];
      // genericShapes.forEach((s) => {
      //    let allElements = xml.getElementsByTagName(s);
      //    for (let x = 0; x < allElements.length; x++) {
      //       // if we don't know about this shape
      //       let ele = allElements[x];
      //       let myEle = this.elementForDiagramID(allElements[x].id);
      //       if (!myEle) {
      //          this.unknownShape(allElements[x]);
      //       }
      //    }
      // });
      // // if any unknown shapes have been reported:
      // if (this._unknownShapes.length) {
      //    allWarnings.push({
      //       message: "Generic Tasks still undefined.",
      //       data: {},
      //    });
      // }
      //
      // return allWarnings;
   }
};
