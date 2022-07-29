const { EventEmitter } = require("../../core/views/ABViewTabCore");
const ABViewTabCore = require("../../core/views/ABViewTabCore");

const ABViewTabComponent = require("./viewComponent/ABViewTabComponent");

const ABViewTabPropertyComponentDefaults = ABViewTabCore.defaultValues();

let L = (...params) => AB.Multilingual.label(...params);

class TabPopup extends EventEmitter {
   constructor(view, idBase) {
      super();

      this.view = view;
      this.ids = {
         popupTabManager: view.AB._App.unique(`${idBase}_popupTabManager`),
         popupTabManagerForm: view.AB._App.unique(
            `${idBase}_popupTabManagerForm`
         ),
         popupTabManagerSaveButton: view.AB._App.unique(
            `${idBase}_popupTabManagerSaveButton`
         ),
      };
   }

   init() {
      const ids = this.ids;
      webix
         .ui({
            id: ids.popupTabManager,
            view: "window",
            height: 250,
            width: 300,
            modal: true,
            position: "center",
            head: " ",
            body: {
               id: ids.popupTabManagerForm,
               view: "form",
               elements: [
                  {
                     view: "text",
                     name: "id",
                     label: L("ID"),
                     disabled: true,
                  },
                  {
                     view: "text",
                     name: "label",
                     label: L("Label"),
                     required: true,
                  },
                  {
                     view: "combo",
                     name: "tabicon",
                     label: L("Icon"),
                     options: {
                        filter: (item, value) => {
                           if (
                              item.value
                                 .toString()
                                 .toLowerCase()
                                 .indexOf(value.toLowerCase()) === 0
                           )
                              return true;

                           return false;
                        },
                        body: {
                           data: this.view.AB._App.icons ?? [],
                           template:
                              "<i class='fa fa-fw fa-#value#'></i> #value#",
                        },
                     },
                  },
                  // action buttons
                  {
                     cols: [
                        { fillspace: true },
                        {
                           view: "button",
                           value: L("Cancel"),
                           css: "ab-cancel-button",
                           autowidth: true,
                           click: () => {
                              this.hide();
                           },
                        },
                        {
                           id: ids.popupTabManagerSaveButton,
                           view: "button",
                           css: "webix_primary",
                           value: L("Add Tab"),
                           autowidth: true,
                           type: "form",
                           click: () => {
                              const $form = $$(ids.popupTabManagerForm);

                              if ($form.validate()) {
                                 this.busy();

                                 const vals = $form.getValues();

                                 const doneFn = () => {
                                    this.ready();
                                    this.hide();

                                    // Trigger the event - 'saved'
                                    this.emit("saved");
                                    // Refresh UI
                                    // const currView = this.view;

                                    // currView.emit(
                                    //    "properties.updated",
                                    //    currView
                                    // );
                                 };

                                 // add
                                 if (!vals.id) {
                                    this.addTab(vals).then(() => doneFn());
                                 }
                                 // edit
                                 else {
                                    this.editTab(vals).then(() => doneFn());
                                 }
                              }
                           },
                        },
                     ],
                  },
               ],
            },
         })
         .hide();
   }

   show(tab) {
      const ids = this.ids;

      const $popup = $$(ids.popupTabManager);
      const $form = $$(ids.popupTabManagerForm);
      const $button = $$(ids.popupTabManagerSaveButton);

      if ($popup) {
         // Edit tab
         if (tab) {
            $form.setValues({
               id: tab.id,
               label: tab.label,
               tabicon: tab.tabicon,
            });

            $popup.getHead().setHTML(L("Edit Tab"));
            $button.setValue(L("Save"));
         }

         // Add new tab
         else {
            $form.setValues({
               id: null,
               label: "",
               tabicon: "",
            });

            $popup.getHead().setHTML(L("Add Tab"));
            $button.setValue(L("Add"));
         }

         $button.refresh();

         // show 'add new field' popup
         $popup.show();
      }
   }

   hide() {
      const ids = this.ids;

      const $popup = $$(ids.popupTabManager);

      if ($popup) $popup.hide();
   }

   busy() {
      const ids = this.ids;

      const $button = $$(ids.popupTabManagerSaveButton);

      if ($button) $button.disable();
   }

   ready() {
      const ids = this.ids;

      const $button = $$(ids.popupTabManagerSaveButton);

      if ($button) $button.enable();
   }

   addTab(values) {
      // get current instance and .addTab()
      const LayoutView = this.view;

      return LayoutView.addTab(values.label ?? "", values.tabicon ?? null);

      // trigger a save()
      // this.propertyEditorSave(ids, LayoutView);
   }

   editTab(values) {
      // get current instance and rename tab
      const LayoutView = this.view;
      const editedTab = LayoutView.views((view) => view.id === values.id)[0];

      if (!editedTab) return;

      editedTab.label = values.label;
      editedTab.tabicon = values.tabicon;

      // trigger a save()
      // this.propertyEditorSave(ids, LayoutView);

      return editedTab.save();
   }
}

module.exports = class ABViewTab extends ABViewTabCore {
   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false) {
      let component = new ABViewTabComponent(this);

      // if this is our v1Interface
      if (v1App) {
         const newComponent = component;

         component = {
            ui: newComponent.ui(),
            init: (options, accessLevel) => {
               return newComponent.init(this.AB);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
      }

      return component;
   }

   getPopup() {
      if (this._tabPopup == null) {
         this._tabPopup = new TabPopup(this, `${this.id}_popup`);
         this._tabPopup.init();
      }

      return this._tabPopup;
   }
};
