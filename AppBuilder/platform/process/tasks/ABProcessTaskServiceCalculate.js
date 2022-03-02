const CalculateTaskCore = require("../../../core/process/tasks/ABProcessTaskServiceCalculateCore.js");

let L = (...params) => AB.Multilingual.label(...params);

module.exports = class CalculateTask extends CalculateTaskCore {
   ////
   //// Process Instance Methods
   ////

   propertyIDs(id) {
      return {
         name: `${id}_name`,
         formulaText: `${id}_formulaText`,

         variablePopup: `${id}_variablePopup`,
         operatorPopup: `${id}_operatorPopup`,
      };
   }

   /**
    * @method propertiesShow()
    * display the properties panel for this Process Element.
    * @param {string} id
    *        the webix $$(id) of the properties panel area.
    */
   propertiesShow(id) {
      let ids = this.propertyIDs(id);

      let list = (this.process.processDataFields(this) || []).map((item) => {
         return {
            id: item.key,
            value: item.label,
         };
      });

      let labelWidth = 120;
      let ui = {
         id: id,
         view: "form",
         elementsConfig: {
            labelWidth: labelWidth,
         },
         elements: [
            {
               id: ids.name,
               view: "text",
               label: L("Name"),
               name: "name",
               value: this.name,
            },
            {
               id: ids.formulaText,
               view: "texthighlight",
               height: 200,
               label: L("Formula"),
               type: "textarea",
               value: this.formulaText || "",
               highlight: (text) => {
                  list.forEach(function (item) {
                     text = text.replace(
                        new RegExp(`{${item.value}}`, "g"),
                        `<span style='background: #90adb5; color:#000000;'>{${item.value}}</span>`
                     );
                  });
                  return text;
               },
            },
            {
               cols: [
                  {
                     width: labelWidth,
                     fillspace: true,
                  },
                  {
                     view: "button",
                     css: "webix_primary",
                     type: "icon",
                     icon: "fa fa-at",
                     label: L("Parameters"),
                     click: function () {
                        // show popup
                        $$(ids.variablePopup).show(this.$view);
                     },
                  },
                  {
                     view: "button",
                     css: "webix_primary",
                     type: "icon",
                     icon: "fa fa-hashtag",
                     label: L("Operators"),
                     click: function () {
                        // show popup
                        $$(ids.operatorPopup).show(this.$view);
                     },
                  },
               ],
            },
         ],
      };

      webix.ui(ui, $$(id));

      if ($$(ids.variablePopup) == null) {
         webix.ui({
            id: ids.variablePopup,
            view: "popup",
            hidden: true,
            body: {
               view: "list",
               template: (item) => {
                  return item.value;
               },
               data: list,
               on: {
                  onItemClick: function (id, e, node) {
                     var component = this.getItem(id);

                     insertFormula(`{${component.value}}`);

                     $$(ids.variablePopup).hide();
                  },
               },
            },
         });
      }

      if ($$(ids.operatorPopup) == null) {
         webix.ui({
            id: ids.operatorPopup,
            view: "popup",
            hidden: true,
            width: 180,
            body: {
               view: "list",
               template: (item) => {
                  var template = "";

                  if (item.icon) {
                     template += `<i class="fa fa-${item.icon}" aria-hidden="true"></i> `;
                  }

                  if (item.label) {
                     template += item.label;
                  }

                  return template;
               },
               data: [
                  {
                     label: L("+ Adds"),
                     symbol: "+",
                  },
                  {
                     label: L("- Subtracts"),
                     symbol: "-",
                  },
                  {
                     label: L("* Multiples"),
                     symbol: "*",
                  },
                  {
                     label: L("/ Divides"),
                     symbol: "/",
                  },
                  {
                     label: L("( Open Bracket"),
                     symbol: "(",
                  },
                  {
                     label: L(") Closed Bracket"),
                     symbol: ")",
                  },
               ],
               on: {
                  onItemClick: function (id, e, node) {
                     var component = this.getItem(id);

                     insertFormula(component.symbol);

                     $$(ids.operatorPopup).hide();
                  },
               },
            },
         });
      }

      let insertFormula = (message) => {
         let formula = $$(ids.formulaText).getValue();

         $$(ids.formulaText).setValue(`${formula}${message} `);
      };

      $$(id).show();
   }

   /**
    * @method propertiesStash()
    * pull our values from our property panel.
    * @param {string} id
    *        the webix $$(id) of the properties panel area.
    */
   propertiesStash(id) {
      let ids = this.propertyIDs(id);

      this.name = this.property(ids.name);
      this.formulaText = this.property(ids.formulaText);
   }
};
