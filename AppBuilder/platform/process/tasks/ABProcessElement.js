const ABProcessElementCore = require("../../../core/process/tasks/ABProcessElementCore.js");

module.exports = class ABProcessElement extends ABProcessElementCore {
   // constructor(attributes, process, AB, defaultValues) {
   //    super(attributes, process, AB, defaultValues);

   //    // listen
   // }

   /**
    * @method destroy()
    * remove this task definition.
    * @return {Promise}
    */
   destroy() {
      ////
      //// TODO: once our core conversion is complete, this .save() can be
      //// moved to ABProcessTaskCore, and our ABDefinition.save() can take
      //// care of the proper method to save depending on the current Platform.
      ////
      // return this.toDefinition()
      //     .destroy()

      return super.destroy().then(() => {
         return this.process.elementRemove(this);
      });
   }

   isValid() {
      /*
        var validator = OP.Validation.validator();

        // label/name must be unique:
        var isNameUnique =
            this.AB.processes((o) => {
                return o.name.toLowerCase() == this.name.toLowerCase();
            }).length == 0;
        if (!isNameUnique) {
            validator.addError(
                "name",
                L(
                    "ab.validation.object.name.unique",
                    `Process name must be unique ("${this.name}"" already used in this Application)`
                )
            );
        }

        return validator;
        */

      // var isValid =
      //     this.AB.processes((o) => {
      //         return o.name.toLowerCase() == this.name.toLowerCase();
      //     }).length == 0;
      // return isValid;

      return true;
   }

   ////
   //// Modeler Instance Methods
   ////

   findLane(curr, cb) {
      if (!curr) {
         cb(null, null);
         return;
      }

      // if current object has a LANE definition, use that one:
      if (curr.lanes && curr.lanes.length > 0) {
         cb(null, curr.lanes[0]);
      } else if (curr.$type == "bpmn:Participant") {
         // if the current is a Participant, take that one
         cb(null, curr);
      } else {
         // else move upwards and check again:
         curr = curr.$parent;
         this.findLane(curr, cb);
      }
   }

   setLane(Lane) {
      this.laneDiagramID = Lane.diagramID;
   }

   /**
    * fromElement()
    * initialize this Task's values from the given BPMN:Element
    * @param {BPMNElement}
    */
   fromElement(element) {
      this.diagramID = element.id || this.diagramID;
      this.onChange(element);
   }

   /**
    * onChange()
    * update the current Task with information that was relevant
    * from the provided BPMN:Element
    * @param {BPMNElement}
    */
   onChange(defElement) {
      /*
        Sample DefElement:
            {
                "labels": [],
                "children": [],
                "id": "Task_08j07ni",
                "width": 100,
                "height": 80,
                "type": "bpmn:SendTask",
                "x": 20,
                "y": -2130,
                "order": {
                    "level": 5
                },
                "businessObject": {
                    "$type": "bpmn:SendTask",
                    "id": "Task_08j07ni",
                    "name": "ffff",
                    "di": {
                        "$type": "bpmndi:BPMNShape",
                        "bounds": {
                            "$type": "dc:Bounds",
                            "x": 20,
                            "y": -2130,
                            "width": 100,
                            "height": 80
                        },
                        "id": "SendTask_0iidv6o_di"
                    }

                    // Some elements (like EndEvents) have:
                    .eventDefinitions: [
                        {
                            $type: "actual bpmn:ElementType",
                            ...
                        }
                    ]
                },
                "incoming":[],
                "outgoing":[]
            }
         */

      // from the BPMI modeler we can gather a label for this:
      if (
         defElement.businessObject.name &&
         defElement.businessObject.name != ""
      ) {
         this.label = defElement.businessObject.name;
      }

      // our lane may have changed:
      var currObj = defElement.businessObject;
      this.findLane(currObj, (err, obj) => {
         if (obj) {
            this.laneDiagramID = obj.id;
         } else {
            // if my parent shape is a Participant, then use that:
            if (
               defElement.parent &&
               defElement.parent.type == "bpmn:Participant"
            ) {
               this.laneDiagramID = defElement.parent.id;
            } else {
               this.laneDiagramID = null;
            }
         }
      });
   }

   /**
    * diagramProperties()
    * return a set of values for the XML shape definition based upon
    * the current values of this object.
    * @return {json}
    */
   diagramProperties() {
      const warnings = this.warnings();
      return [
         {
            id: this.diagramID,
            def: {
               name: this.name,
            },
            warn: warnings.length ? warnings : null,
         },
      ];
   }

   /**
    * propertiesShow()
    * display the properties panel for this Process Element.
    * @param {string} id
    *        the webix $$(id) of the properties panel area.
    */
   propertiesShow(id) {
      var ui = {
         id: id,
         view: "label",
         label: "this task has not implement properties yet...",
      };

      webix.ui(ui, $$(id));

      $$(id).show();
   }

   /**
    * propertiesStash()
    * pull our values from our property panel.
    * @param {string} id
    *        the webix $$(id) of the properties panel area.
    */
   propertiesStash(id) {}

   /**
    * property()
    * return the specific property value if it exists.
    * @return {mixed} | undefined
    */
   property(id) {
      if ($$(id)) {
         return $$(id).getValue();
      }
   }

   /**
    * switchTo()
    * replace this object with an instance of one of our child classes:
    * @param {ABProcessTask*} child
    *        an instance of the new Process Task we are replaced with.
    * @param {string} propertiesID
    *        the webix ui.id container for the properties panel.
    */
   switchTo(child, propertiesID) {
      // remove myself from our containing process's elements
      this.process.elementRemove(this);

      // add the new Process WITH the same id
      this.process.elementAdd(child);

      // show the child properties:
      child.propertiesShow(propertiesID);

      this.emit("switchTo", child);
   }

   /**
    * @method warningsEval()
    * re-evaluate our warnings for this Process Task.
    * Most of our ProcessTasks need to also verify data related to
    * other available tasks, so we need to call the onProcessReady()
    * so we can access those values.
    */
   warningsEval() {
      super.warningsEval();
      this.onProcessReady();

      // if this isn't an end type of task, then there must be
      // > 0 next tasks
      if (!this.isEndTask()) {
         const myOutgoingConnections = this.process.connectionsOutgoing(
            this.diagramID
         );
         if (myOutgoingConnections.length < 1) {
            this.warningMessage("should have another task after this one");
         }
      }
   }

   /**
    * @method warningMessage(message)
    * Save a warning message in a common format for our ProcessTasks.
    */
   warningMessage(msg, data = {}) {
      let message = `${this.defaults.key}[${
         this.label ? this.label : this.name
      }]: ${msg}`;
      this._warnings.push({ message, data });
   }
};
