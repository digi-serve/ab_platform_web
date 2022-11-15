/**
 * ABViewComponent
 * A common UI component class for our UI widgets.
 */
import ClassUI from "../../../ui/ClassUI";

export default class ABViewComponent extends ClassUI {
   constructor(...params) {
      super(...params);

      this.__events = [];
      // {array}
      // A collection of any listeners we are managing.
      // {
      //   emitter:   {EventEmitter} the object we are listening on
      //   eventName: {string} the event key we are listening for
      //   listener:  {fn} the function to call on
      // }

      this.CurrentObjectID = null;
      // {string}
      // the ABObject.id of the object we are working with.

      this.CurrentDatacollectionID = null;
      // {string}
      // the ABDataCollection.id of the DC we are working with
   }

   /**
    * @method CurrentObject()
    * A helper to return the current ABObject we are working with.
    * @return {ABObject}
    */
   get CurrentObject() {
      return this.AB.objectByID(this.CurrentObjectID);
   }
   /**
    * @method CurrentDatacollection()
    * A helper to return the current ABDataCollection we are working with.
    * @return {ABDataCollection}
    */
   get CurrentDatacollection() {
      return this.AB.datacollectionByID(this.CurrentDatacollectionID);
   }

   /**
    * @method datacollectionLoad
    *
    * @param datacollection {ABDatacollection}
    */
   datacollectionLoad(datacollection) {
      this.CurrentDatacollectionID = datacollection.id;
   }

   objectLoad(object) {
      this.CurrentObjectID = object.id;
   }

   /**
    * @method eventAdd()
    * Create a new listener on an object. Note, this will prevent multiple
    * listeners being applied to the same Object.
    * @param {object} evt
    *        The definition of the event we are adding:
    *        {
    *           emitter:   {EventEmitter} the object we are listening on
    *           eventName: {string} the event key we are listening for
    *           listener:   {fn} the function to call on
    *        }
    */
   eventAdd(evt) {
      if (!evt || !evt.emitter || !evt.listener) return;

      // make sure we haven't done this before:
      var exists = this.__events.find((e) => {
         return e.emitter == evt.emitter && e.eventName == evt.eventName;
         // && e.listener == evt.listener;
      });

      if (!exists || exists.length < 1) {
         // add to array
         this.__events.push({
            emitter: evt.emitter,
            eventName: evt.eventName,
            listener: evt.listener,
         });

         // listening this event
         evt.emitter.on(evt.eventName, evt.listener);
      }
   }

   /**
    * @method eventsClear()
    * Remove all the attached event listeners and reset our tracking.
    */
   eventsClear() {
      (this.__events || []).forEach((e) => {
         e.emitter.removeListener(e.eventName, e.listener);
      });
      this.__events = [];
   }

   /**
    * @method onShow()
    * perform any preparations necessary when showing this component.
    */
   onShow() {
      // if we manage a datacollection, then make sure it has started
      // loading it's data when we are showing our component.
      var dv = this.datacollection;
      if (dv) {
         if (dv.dataStatus == dv.dataStatusFlag.notInitial) {
            // load data when a widget is showing
            dv.loadData();
         }
      }
   }
}