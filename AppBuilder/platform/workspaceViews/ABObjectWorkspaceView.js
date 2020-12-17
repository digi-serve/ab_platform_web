// ABObjectWorkspaceView.js
//
// Manages the settings for a view in the AppBuilder Object Workspace

module.exports = class ABObjectWorkspaceView {
   constructor(attributes, object, defaultLabel) {
      this.defaultLabel = defaultLabel || "default view";
      /*
	{
		id:uuid(),

	}

*/
      this.fromObj(attributes || {});

      this.object = object;

      // multilingual fields: label
      this.object.translate(this, this, ["label"]);

      // user ids.  if has user id, then only those users can see this.
      // this.users = [];
   }

   /**
    * unique key describing this View.
    * @return {string}
    */
   static type() {
      return "view";
   }

   /**
    * @method fromObj
    * take our persisted data, and properly load it
    * into this object instance.
    * @param {json} data  the persisted data
    */
   fromObj(data) {
      this.id = data.id || this.object.AB.uuid();
      this.isDefaultView = JSON.parse(data.isDefaultView || false);
      this.translations =
         data.translations ||
         this.object.defaultTranslations(["label"], {
            label: this.defaultLabel,
         });
   }

   /**
    * @method toObj()
    * compile our current state into a {json} object
    * that can be persisted.
    */
   toObj() {
      this.object.unTranslate(this, this, ["label"]);
      return {
         id: this.id,
         translations: this.translations,
         isDefaultView: this.isDefaultView,
      };
   }

   update(view) {
      for (var key in view) {
         this[key] = view[key];
      }
   }
};
