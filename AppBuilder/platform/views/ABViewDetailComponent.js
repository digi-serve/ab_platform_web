const ABViewDetailComponentCore = require("../../core/views/ABViewDetailComponentCore");
const ABViewDetailItemComponent = require("./viewComponent/ABViewDetailItemComponent");

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewDetailItem extends ABViewDetailComponentCore {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   static propertyEditorDefaultElements(App, ids, _logic, ObjectDefaults) {
      let commonUI = super.propertyEditorDefaultElements(
         App,
         ids,
         _logic,
         ObjectDefaults
      );

      return commonUI.concat([
         {
            name: "fieldLabel",
            view: "text",
            disabled: true,
            label: L("Field"),
         },
      ]);
   }

   static propertyEditorPopulate(App, ids, view) {
      super.propertyEditorPopulate(App, ids, view);

      let field = view.field();

      if (field) {
         $$(ids.fieldLabel).setValue(field.label);
      }
   }

   /**
    * @method component()
    * return a UI component based upon this view.
    * @param {obj} App
    * @return {obj} UI component
    */
   component(v1App = false) {
      let component = new ABViewDetailItemComponent(this);

      // if this is our v1Interface
      if (v1App) {
         let newComponent = component;
         component = {
            ui: newComponent.ui(),
            init: (options, accessLevel) => {
               return newComponent.init(this.AB, accessLevel);
            },
            onShow: (...params) => {
               return newComponent.onShow?.(...params);
            },
         };
      }

      return component;
   }

   componentOld(App, idPrefix) {
      let idBase = "ABViewDetailComponent_" + (idPrefix || "") + this.id;
      let ids = {
         component: App.unique(`${idBase}_component`),
      };
      // setup 'label' of the element
      let detailView = this.detailComponent(),
         field = this.field() || {},
         label = "";

      let settings = {};
      if (detailView) settings = detailView.settings;

      let isUsers = false;
      if (field && field.key == "user") isUsers = true;

      let templateLabel = "";
      if (settings.showLabel == true) {
         if (settings.labelPosition == "top")
            templateLabel =
               "<label style='display:block; text-align: left;' class='webix_inp_top_label'>#label#</label>#display#";
         else
            templateLabel =
               "<label style='width: #width#px; display: inline-block; float: left; line-height: 32px;'>#label#</label><div class='ab-detail-component-holder' style='margin-left: #width#px;'>#display#</div>";
      }
      // no label
      else {
         templateLabel = "#display#";
      }

      let template = templateLabel
         .replace(/#width#/g, settings.labelWidth)
         .replace(/#label#/g, field ? field.label : "");

      let height = 38;
      if (settings.labelPosition == "top") height = height * 2;

      if (
         field &&
         field.settings &&
         typeof field.settings.useHeight != "undefined" &&
         field.settings.useHeight == 1
      ) {
         height = parseInt(field.settings.imageHeight) || height;
      }

      let _ui = {
         id: ids.component,
         view: "template",
         borderless: true,
         height: height,
         isUsers: isUsers,
         template: template,
         data: { display: "" }, // show empty data in template
      };

      // make sure each of our child views get .init() called
      let _init = (options) => {};

      let _logic = {
         setValue: (componentId, val) => {
            if ($$(componentId)) {
               if (field.key == "string" || field.key == "LongText") {
                  val = val.replace(/[<]/g, "&lt;");
               }
               $$(componentId).setValues({ display: val });
            }
         },
      };

      return {
         ui: _ui,
         init: _init,
         logic: _logic,
      };
   }
};
