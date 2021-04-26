const ABProcessCore = require("../core/ABProcessCore");

module.exports = class ABProcess extends ABProcessCore {
   constructor(attributes, AB) {
      super(attributes, AB);

      // listen
      this.AB.on("ab.abprocess.update", (data) => {
         if (this.id == data.objectId) this.fromValues(data.data);
      });
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
      // remove all my Elements
      var allElements = this.elements();
      var allDestroy = [];
      allElements.forEach((e) => {
         allDestroy.push(e.destroy());
      });

      return Promise.all(allDestroy).then(() => {
         // now remove myself
         return new Promise((resolve, reject) => {
            this.toDefinition()
               .destroy()
               .catch((err) => {
                  reject(err);
               })
               .then(() => {
                  // allow normal processing to contine now:
                  resolve();
               })
               .then(() => {
                  // in the background
                  // remove this reference from ALL Applications that link
                  // to me:
                  console.error(
                     "TODO: ABProcess.destroy(): refactor to .emit('destroyed') and let containing Apps self remove."
                  );
                  var appsWithProcess = this.AB.applications().find((a) => {
                     return a.hasProcess(this);
                  });
                  if (appsWithProcess.length > 0) {
                     appsWithProcess.forEach((a) => {
                        a.processRemove(this);
                     });
                  }
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
    *						.resolve( {this} )
    */
   save() {
      // if this is an update:
      // if (this.id) {
      // 	return ABDefinition.update(this.id, this.toDefinition());
      // } else {

      // 	return ABDefinition.create(this.toDefinition());
      // }

      // make sure all our tasks have save()ed.
      var allSaves = [];
      var allTasks = this.elements();
      allTasks.forEach((t) => {
         allSaves.push(t.save());
      });
      return Promise.all(allSaves).then(() => {
         // now we can save our Process definition
         return this.toDefinition()
            .save()
            .then((data) => {
               // if I didn't have an .id then this was a create()
               // and I need to update my data with the generated .id

               if (!this.id) {
                  this.id = data.id;
               }

               // Also, our embedded elements now all have .ids
               // where they might not have before.  So now
               // rebuild our this._elements hash with all id
               var _new = {};
               Object.keys(this._elements).forEach((k) => {
                  _new[this._elements[k].id] = this._elements[k];
               });
               this._elements = _new;
            });
      });
   }

   isValid() {
      var validator = this.AB.Validation.validator();

      var L = this.AB.Label();

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
               `Process name must be unique ("{0}" already in use)`,
               [this.name]
            )
         );
      }

      return validator;
   }

   /**
    * @method elementNewForModelDefinition()
    * create a new process element defined by the given BPMN:Element
    *
    * the BPMN:Element definition comes from the BPMN Modeler when a new
    * diagram element is created.
    *
    * @param {BPMN:Element} element
    *        the BPMN modeler diagram element definition
    * @return {ABProcess[OBJ]}
    */
   elementNewForModelDefinition(element) {
      var task = this.AB.processElementNewForModelDefinition(element, this);
      if (task) {
         this.elementAdd(task);
      }
      return task;
   }
};
