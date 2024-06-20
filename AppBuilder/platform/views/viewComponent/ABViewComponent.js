/**
 * ABViewComponent
 * A common UI component class for our UI widgets.
 */
import ClassUI from "../../../../ui/ClassUI";

export default class ABViewComponent extends ClassUI {
   constructor(baseView, idBase, ids) {
      super(idBase || `ABView_${baseView.id}`, ids);

      this.view = baseView;
      this.settings = baseView.settings;
      this.AB = baseView.AB;
      this.datacollection = baseView.datacollections || baseView.datacollection;

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

   ui(uiComponents = []) {
      // an ABView is a collection of rows:
      const _ui = {
         id: this.ids.component,
         view: "layout",
         type: "space",
         rows: uiComponents,
      };

      // if this form is empty, then force a minimal row height
      // so the component isn't completely hidden on the screen.
      // (important in the editor so we don't loose the ability to edit the
      // component)
      if (!_ui.rows.length) _ui.height = 30;

      return _ui;
   }

   async init(AB) {
      this.AB = AB;
   }

   /**
    * @method datacollectionLoad
    *
    * @param datacollection {ABDatacollection}
    */
   datacollectionLoad(datacollection) {
      this.CurrentDatacollectionID = datacollection?.id;
   }

   objectLoad(object) {
      this.CurrentObjectID = object?.id;
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
      const __events = this.__events;
      const exists = __events.filter(
         (e) => e.emitter === evt.emitter && e.eventName === evt.eventName
         // && e.listener === evt.listener
      );

      if (!exists.length) {
         // add to array
         __events.push({
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
      this.__events.forEach((evt) => {
         evt.emitter.removeListener(evt.eventName, evt.listener);
      });

      this.__events = [];
   }

   /**
    * @method waitInitializingDCEvery()
    * Wait until the DC is initialized, checking every millisecond as specified by the parameter
    * @param {number} milliSeconds
    * The amount of milliseconds to recheck DC status.
    * @param {object} dc
    * the AB DC instance.
    */

   async waitInitializingDCEvery(milliSeconds, dc) {
      if (!this.__isShowing || dc == null) return;
      // if we manage a datacollection, then make sure it has started
      // loading it's data when we are showing our component.
      // load data when a widget is showing
      if (dc.dataStatus === dc.dataStatusFlag.notInitial) await dc.loadData();

      return await new Promise((resolve) => {
         if (dc.dataStatus === dc.dataStatusFlag.initialized) {
            resolve();

            return;
         }

         const interval = setInterval(() => {
            if (dc.dataStatus === dc.dataStatusFlag.initialized) {
               clearInterval(interval);

               resolve();
            }
         }, milliSeconds);
      });
   }

   /**
    * @method onShow()
    * perform any preparations necessary when showing this component.
    */
   onShow() {
      // check if tab has a hint
      if (this?.view?.settings?.hintID) {
         // fetch the steps for the hint
         let hint = this.AB.hintID(this.view.settings.hintID);
         if (hint.settings.active) {
            hint.createHintUI();
         }
      }
      // if we manage a datacollection, then make sure it has started
      // loading it's data when we are showing our component.
      const dc = this.datacollection;

      if (!dc) return;

      if (Array.isArray(dc)) {
         dc.forEach((item) => {
            if (item.dataStatus === item.dataStatusFlag.notInitial)
               // load data when a widget is showing
               item.loadData();
         });
      } else {
         if (dc.dataStatus === dc.dataStatusFlag.notInitial)
            // load data when a widget is showing
            dc.loadData();
      }
   }
}
