/**
 * ABProcessParticipant
 * manages the participant lanes in a Process Diagram.
 *
 * Participants manage users in the system (when there are no lanes defined)
 * and provide a way to lookup a SiteUser.
 */
var ABProcessParticipantCore = require("../../core/process/ABProcessParticipantCore");

module.exports = class ABProcessParticipant extends ABProcessParticipantCore {
   // constructor(attributes, process, AB) {
   //    super(attributes, process, AB);
   // }

   ////
   //// Modeler Instance Methods
   ////

   /**
    * fromElement()
    * initialize this Participant's values from the given BPMN:Participant
    * @param {BPMNParticipant}
    */
   fromElement(element) {
      this.diagramID = element.id || this.diagramID;
      this.onChange(element);
   }

   /**
    * onChange()
    * update the current Participant with information that was relevant
    * from the provided BPMN:Participant
    * @param {BPMNParticipant}
    */
   onChange(defElement) {
      /*
        Sample DefElement:
            {
                "labels": [],
                "children": [],
                "id": "Participant_185ljkg",
                "width": 958,
                "height": 240,
                "type": "bpmn:Participant",
                "x": -810,
                "y": -2010,
                "order": {
                    "level": -2
                },
               "businessObject": {
                    "$type": "bpmn:Participant",
                    "id": "Participant_185ljkg",
                    "di": {
                        "$type": "bpmndi:BPMNShape",
                        "bounds": {
                            "$type": "dc:Bounds",
                            "x": -810,
                            "y": -2010,
                            "width": 958,
                            "height": 240
                        },
                        "id": "Participant_185ljkg_di",
                        "isHorizontal": true
                    },
                    "processRef": {
                        "$type": "bpmn:Process",
                        "id": "Process_0x3sul5"
                    }
                }
         */

      // from the BPMI modeler we can gather a label for this:
      if (
         defElement.businessObject.name &&
         defElement.businessObject.name != ""
      ) {
         this.label = defElement.businessObject.name;
      }

      if (defElement.children) {
         var laneIDs = [];
         defElement.children.forEach((c) => {
            if (c.type == "bpmn:Lane") {
               laneIDs.push(c.id);
            }
         });
         this.laneIDs = laneIDs;
      }
   }

   /**
    * diagramProperties()
    * return a set of values for the XML shape definition based upon
    * the current values of this objec.
    * @return {json}
    */
   diagramProperties() {
      return [
         {
            id: this.diagramID,
            def: {
               name: this.name,
            },
         },
      ];
   }

   // static propertyIDs(id) {
   //    return {
   //       form: `${id}_form`,
   //       name: `${id}_name`,
   //       role: `${id}_role`,
   //       useRole: `${id}_useRoles`,
   //       useAccount: `${id}_useAccounts`,
   //       account: `${id}_account`,
   //    };
   // }
   /**
    * propertiesShow()
    * display the properties panel for this Process Element.
    * @param {string} id
    *        the webix $$(id) of the properties panel area.
    */
   propertiesShow(id) {
      console.error("TODO: refactor to ABDesigner");

      var ids = ABProcessParticipant.propertyIDs(id);

      var ui = {
         id: id,
         rows: [
            { view: "label", label: `${this.type} :` },
            {
               view: "form",
               id: ids.form,
               // width: 300,
               elements: [
                  {
                     id: ids.name,
                     view: "text",
                     label: "Name",
                     name: "name",
                     value: this.name,
                  },
                  // { template: "Select Users", type: "section" },
                  // {
                  //     id: id + "_userView",
                  //     cols: [
                  //         {
                  //             view: "checkbox",
                  //             id: ids.useRole,
                  //             labelRight: "by Role",
                  //             value: this.useRole || 0
                  //         },
                  //         {
                  //             id: ids.role,
                  //             view: "select",
                  //             label: "Role",
                  //             value: this.role,
                  //             options: __Roles,
                  //             labelAlign: "left"
                  //         }
                  //     ]
                  // }
                  // {
                  //     margin: 5,
                  //     cols: [
                  //         {
                  //             view: "button",
                  //             value: "Login",
                  //             css: "webix_primary"
                  //         },
                  //         { view: "button", value: "Cancel" }
                  //     ]
                  // }
               ],
            },
         ],
      };

      // If we don't have any sub lanes, then offer the select user options:
      if (this.laneIDs && this.laneIDs.length == 0) {
         var userUI = ABProcessParticipant.selectUsersUi(id, this);
         ui.rows[1].elements.push(userUI);
      }

      webix.ui(ui, $$(id));

      $$(id).show();
   }

   /**
    * selectUsersUi()
    * A resuable fn to return the webix ui for a reusable Select User picker.
    * @param {ABFactory} AB
    * @param {string} id
    *        the webix $$(id) of the properties panel area.
    * @param {json} values
    *        the current values represented for this user selection.
    */
   static selectUsersUi(AB, id, values) {
      console.warn("!!! Where is this used???");

      var L = (...params) => {
         return AB.Multilingual.label(...params);
      };

      var ids = ABProcessParticipant.propertyIDs(id);
      var __Roles = AB.Account.rolesAll();
      var __Users = AB.Account.userList();

      __Roles.unshift({ id: "--", value: L("select a role") });
      __Users.unshift({ id: "--", value: L("select a user") });

      return {
         view: "fieldset",
         label: L("Select Users"),
         body: {
            rows: [
               {
                  cols: [
                     {
                        view: "checkbox",
                        id: ids.useRole,
                        labelRight: L("by Role"),
                        labelWidth: 0,
                        width: 120,
                        value: values.useRole ? values.useRole : 0,
                        click: function (id /*, event */) {
                           if ($$(id).getValue()) {
                              $$(ids.role).enable();
                           } else {
                              $$(ids.role).disable();
                           }
                        },
                     },
                     {
                        id: ids.role,
                        view: "select",
                        value: values.role ? values.role : "",
                        disabled: values.useRole ? false : true,
                        options: __Roles,
                        labelAlign: "left",
                     },
                  ],
               },
               {
                  cols: [
                     {
                        view: "checkbox",
                        id: ids.useAccount,
                        labelRight: L("by Account"),
                        labelWidth: 0,
                        width: 120,
                        value: values.useAccount ? values.useAccount : 0,
                        click: function (id /*, event */) {
                           if ($$(id).getValue()) {
                              $$(ids.account).enable();
                           } else {
                              $$(ids.account).disable();
                           }
                        },
                     },
                     {
                        id: ids.account,
                        view: "multicombo",
                        value: values.account ? values.account : 0,
                        disabled: values.useAccount ? false : true,
                        suggest: __Users,
                        labelAlign: "left",
                        placeholder: L("Click or type to add user..."),
                        stringResult: false /* returns data as an array of [id] */,
                     },
                  ],
               },
            ],
         },
      };
   }

   /**
    * selectManagersUi()
    * A resuable fn to return the webix ui for a reusable Select Managers picker.
    * This UI is used in the ABDesigner New Application form.
    * @param {ABFactory} AB
    * @param {string} id
    *        the webix $$(id) of the properties panel area.
    * @param {jsonobj} obj
    *        the default values for these fields.
    */

   /*
    * Moving this to ABDesigner/src/rootPages/Designer/forms/process
    */
   // static selectManagersUi(AB, id, obj) {
   //    var L = (...params) => {
   //       return AB.Multilingual.label(...params);
   //    };

   //    var ids = ABProcessParticipant.propertyIDs(id);
   //    var __Roles = AB.Account.rolesAll().map((r) => {
   //       return { id: r.id, value: r.name };
   //    });
   //    var __Users = AB.Account.userList().map((u) => {
   //       return { id: u.uuid, value: u.username };
   //    });

   //    return {
   //       type: "form",
   //       css: "no-margin",
   //       rows: [
   //          {
   //             cols: [
   //                {
   //                   view: "checkbox",
   //                   id: ids.useRole,
   //                   labelRight: L("by Role"),
   //                   labelWidth: 0,
   //                   width: 120,
   //                   value: obj.useRole == "1" ? 1 : 0,
   //                   click: function (id /*, event */) {
   //                      if ($$(id).getValue()) {
   //                         $$(ids.role).enable();
   //                      } else {
   //                         $$(ids.role).disable();
   //                      }
   //                   },
   //                },
   //                {
   //                   id: ids.role,
   //                   view: "multicombo",
   //                   value: obj.role ? obj.role : 0,
   //                   disabled: obj.useRole == "1" ? false : true,
   //                   suggest: __Roles,
   //                   placeholder: L("Click or type to add role..."),
   //                   labelAlign: "left",
   //                   stringResult: false /* returns data as an array of [id] */,
   //                },
   //             ],
   //          },
   //          {
   //             cols: [
   //                {
   //                   view: "checkbox",
   //                   id: ids.useAccount,
   //                   labelRight: L("by Account"),
   //                   labelWidth: 0,
   //                   width: 120,
   //                   value: obj.useAccount == "1" ? 1 : 0,
   //                   click: function (id /*, event */) {
   //                      if ($$(id).getValue()) {
   //                         $$(ids.account).enable();
   //                      } else {
   //                         $$(ids.account).disable();
   //                      }
   //                   },
   //                },
   //                {
   //                   id: ids.account,
   //                   view: "multicombo",
   //                   value: obj.account ? obj.account : 0,
   //                   disabled: obj.useAccount == "1" ? false : true,
   //                   suggest: __Users,
   //                   labelAlign: "left",
   //                   placeholder: L("Click or type to add user..."),
   //                   stringResult: false /* returns data as an array of [id] */,
   //                },
   //             ],
   //          },
   //       ],
   //    };
   // }

   /**
    * stashUsersUi()
    * A resuable fn to return the values from our static selectUsersUI().
    * @param {string} id
    *        the webix $$(id) of the properties panel area.
    */
   /*
    * Moving this to ABDesigner/src/rootPages/Designer/forms/process
    */
   // static stashUsersUi(id) {
   //    var obj = {};
   //    var ids = ABProcessParticipant.propertyIDs(id);

   //    if ($$(ids.useRole)) {
   //       obj.useRole = $$(ids.useRole).getValue();
   //    }

   //    if ($$(ids.role) && obj.useRole) {
   //       obj.role = $$(ids.role).getValue();
   //       if (obj.role === "--") obj.role = null;
   //    } else {
   //       obj.role = null;
   //    }

   //    if ($$(ids.useAccount)) {
   //       obj.useAccount = $$(ids.useAccount).getValue();
   //    }

   //    if ($$(ids.account) && obj.useAccount) {
   //       obj.account = $$(ids.account).getValue(/*{ options: true }*/);
   //       if (obj.account === "--") obj.account = null;
   //    } else {
   //       obj.account = null;
   //    }

   //    return obj;
   // }

   /**
    * propertiesStash()
    * pull our values from our property panel.
    * @param {string} id
    *        the webix $$(id) of the properties panel area.
    */
   propertiesStash(id) {
      var ids = ABProcessParticipant.propertyIDs(id);
      this.name = $$(ids.name).getValue();
      if (this.laneIDs.length == 0) {
         var userDef = ABProcessParticipant.stashUsersUi(id);
         Object.keys(userDef).forEach((k) => {
            this[k] = userDef[k];
         });
      }
      this.stashed = true;
   }
};
