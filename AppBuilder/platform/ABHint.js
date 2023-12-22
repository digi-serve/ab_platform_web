const ABHintCore = require("../core/ABHintCore");

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABHint extends ABHintCore {
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
   destroy(App) {
      // debugger;
      // remove all my Elements
      var allSteps = this.steps();
      var allDestroy = [];
      allSteps.forEach((e) => {
         allDestroy.push(e.destroy());
      });
      // remove reference on App and View
      let hintIndex = App.hintIDs.indexOf(this.id);
      if (hintIndex > -1) {
         App.hintIDs.splice(hintIndex, 1);
         App.save();
      }

      let view = App.views((v) => {
         return v.id == this.settings.view;
      })[0];

      if (view) {
         delete view.settings.hintID;
         view.save();
      }

      return Promise.all(allDestroy).then(() => {
         // now remove myself
         return new Promise((resolve, reject) => {
            this.toDefinition()
               .destroy()
               .then(() => {
                  webix.message({
                     text: L("Tutorial Deleted"),
                     type: "success",
                     expire: 3000,
                  });
                  resolve();
               })
               .catch((err) => {
                  reject(err);
               });
         });
      });
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

   createHintUI() {
      // if already loaded skip
      if ($$(this.id)) return;

      let steps = [];
      let next = 0;
      let display = webix.storage.cookie.get(this.id);
      if (display?.hide) return;
      let dontShow = `<label class="dontShow">
                        <input onclick="webix.storage.cookie.put(this.dataset.hintId, {'hide': this.checked});" data-hint-id="${
                           this.id
                        }" type="checkbox">
                        ${L("Don't show this again.")}
                     </label>`;
      this.stepIDs.forEach((step) => {
         next++;
         let newStep = {};
         newStep.id = this._steps[step].id;
         newStep.el = this._steps[step].settings.el;
         newStep.event = this._steps[step].settings.event;
         newStep.title = this._steps[step].name;
         newStep.text = this._steps[step].text + dontShow;
         if (this.stepIDs[next]) {
            newStep.nextEl = this._steps[this.stepIDs[next]].settings.el;
            if (newStep.nextEl) {
               newStep.hintId = this.id;
               newStep.eventEl = "button"; // added this so we do not trigger a second advance on the hint when triggering the click below
               newStep.next = function (event) {
                  let nextEl = this.nextEl;
                  let theNextEl = document.querySelector(nextEl);
                  if (theNextEl && theNextEl.checkVisibility()) {
                     return false;
                  } else {
                     document.querySelector(this.el).click();
                     return false;
                  }
               };
            }
         }
         if (newStep.el) steps.push(newStep);
      });

      let ui = {
         view: "hint",
         id: this.id,
         steps: steps,
         on: {
            onNext: (step) => {
               setTimeout(() => {
                  const boxes = document.querySelectorAll(
                     "input[data-hint-id='" + this.id + "']"
                  );
                  let display = webix.storage.cookie.get(this.id);
                  boxes.forEach((b) => {
                     b.checked = display?.hide || false;
                  });
               }, 100);
            },
            onPrevious: (step) => {
               setTimeout(() => {
                  const boxes = document.querySelectorAll(
                     "input[data-hint-id='" + this.id + "']"
                  );
                  let display = webix.storage.cookie.get(this.id);
                  boxes.forEach((b) => {
                     b.checked = display?.hide || false;
                  });
               }, 100);
            },
         },
      };

      webix.delay(
         () => {
            try {
               webix.ui(ui).start();
            } catch (err) {
               this.AB.notify.developer(err, {
                  context:
                     "ABHint.createUIHint() error calling webix.ui(ui).start()",
                  ui,
               });
            }
         },
         null,
         null,
         2000
      );

      // $$(this.id);
   }
};
