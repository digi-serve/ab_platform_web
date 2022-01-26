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
   }

   /**
    * @method eventAdd()
    * Create a new listener on an object.
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
