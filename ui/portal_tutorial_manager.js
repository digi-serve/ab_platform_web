import ClassUI from "./ClassUI.js";

let L = (...params) => AB.Multilingual.label(...params);

class PortalTutorialManager extends ClassUI {
   constructor() {
      super();
   }

   ui(appId) {
      // this is the modal window that opens when you click a tutorial to edit
      const tutorialStepsManager = (id) => {
         return {
            view: "window",
            id: "stepManager" + id,
            head: {
               view: "toolbar",
               css: "webix_dark",
               cols: [
                  {
                     width: 15,
                  },
                  {
                     view: "label",
                     label: "Tutorial Steps Manager",
                     autowidth: true,
                  },
                  {},
                  {
                     view: "button",
                     type: "icon",
                     icon: "fa fa-plus",
                     label: "Step",
                     autowidth: true,
                     css: "webix_primary",
                     click: async () => {
                        // create ABStep
                        let step = await this.createStep(id);
                        // save it to get an id to store on the ABHint
                        await step.save();

                        // get the current ABHint
                        let hint = this.AB.hints((h) => {
                           return h.id == id;
                        })[0];
                        // store the new ABStep id in the current ABHint
                        if (hint?.stepIDs && Array.isArray(hint.stepIDs)) {
                           hint.stepIDs.push(step.id);
                        } else {
                           hint.stepIDs = [step.id];
                        }
                        // store the ABStep in the ABHint (not saved in definitions)
                        hint._steps[step.id] = step;
                        // add the new step UI to the interface
                        $$("hint_steps_" + hint.id).addView(
                           this.stepUI(step, hint)
                        );
                     },
                  },
                  {
                     view: "button",
                     width: 35,
                     css: "webix_transparent",
                     type: "icon",
                     icon: "nomargin fa fa-times",
                     click: () => {
                        $$("stepManager" + id).close();
                        this.show();
                     },
                  },
               ],
            },
            width: 800,
            height: 500,
            move: true,
            position: "center",
            resize: true,
            body: {
               rows: [
                  {
                     view: "scrollview",
                     body: {
                        rows: [
                           tutorialSettings(id),
                           {
                              id: "hint_steps_" + id,
                              rows: [],
                           },
                        ],
                     },
                  },
                  save(id),
               ],
            },
         };
      };

      // ui that contains the list of current ABHints on this application
      const tutorialManagerBody = {
         view: "scrollview",
         css: "lightgray ab_tutorial",
         body: {
            rows: [
               {
                  view: "list",
                  id: "tutorial_list",
                  template: `<div class="deleteHint">
                                 <i class="fa fa-times"></i>
                              </div>
                              <div class="active#settings.active# abTutorial">
                                 <h1>#name#</h1>
                                 <p>#description#</p>
                              </div>`,
                  data: this._hints,
                  hidden: this._hints.length == 0, // hide if we do not have any hints yet
                  type: {
                     css: "hintItem",
                     height: "auto",
                  },
                  onClick: {
                     deleteHint: (ev, id) => {
                        // Confirm user wants to delete the hint
                        webix
                           .confirm({
                              title: L("Delete Tutorial"),
                              text: L(
                                 "Are you sure you want to delete this tutorial?"
                              ),
                              type: "confirm-error",
                           })
                           .then((result) => {
                              // get the hint that we want to delete
                              let hint = this.AB.hintID(id);
                              // delete the hint (steps will also be deleted)
                              hint.destroy(this.application);
                              // remove the hint from the ui
                              $$("tutorial_list").remove(id);
                              // check if we have any hints if not switch views
                              if ($$("tutorial_list").count() == 0) {
                                 $$("tutorial_list").hide();
                                 $$("tutorial_list_noSelection").show();
                              }
                              return false; // blocks the default click behavior
                           })
                           .fail(() => {
                              // webix.message("Cancel");
                           });
                        return false;
                     },
                     hintItem: (ev, id) => {
                        // open the editor for the hint
                        webix.ui(tutorialStepsManager(id)).show();
                        // insert the steps into the manager to edit
                        this.steps(id);
                        this.hide();
                     },
                  },
               },
               {
                  id: "tutorial_list_noSelection",
                  hidden: this._hints.length > 0,
                  rows: [
                     {},
                     {
                        view: "label",
                        align: "center",
                        height: 200,
                        label: "<div style='display: block; font-size: 180px; background-color: #666; color: transparent; text-shadow: 0px 1px 1px rgba(255,255,255,0.5); -webkit-background-clip: text; -moz-background-clip: text; background-clip: text;' class='fa fa-info-circle'></div>",
                     },
                     {
                        view: "label",
                        align: "center",
                        label: "Add a tutorial to this page.",
                     },
                     {
                        cols: [
                           {},
                           {
                              view: "button",
                              label: "Create Tutorial",
                              type: "form",
                              css: "webix_primary",
                              autowidth: true,
                              click: () => {
                                 // open modal that helps user make a new hint
                                 webix.ui(newTutorialPopup).show();

                                 // populate the optiosn of the page/tab combo
                                 $$("view_popup_options").define(
                                    "options",
                                    this.options
                                 );
                                 // attempt to set the values of the combo based off the
                                 // last visited page would be better if we could look at
                                 // tabs as well
                                 $$("view_popup_options").define(
                                    "value",
                                    this.portal.AppState.lastPages[
                                       this.portal.AppState.lastSelectedApp
                                    ]
                                 );
                                 $$("view_popup_options").refresh();
                              },
                           },
                           {},
                        ],
                     },
                     {},
                  ],
               },
            ],
         },
      };

      // small modal that is displayed when user wants to create a new tutorial/hint
      const newTutorialPopup = {
         view: "popup",
         id: "newTutorialPopup",
         position: "center",
         height: 250,
         width: 350,
         modal: true,
         body: {
            rows: [
               {
                  view: "toolbar",
                  id: "myToolbarABLiveTool",
                  css: "webix_dark",
                  cols: [
                     {
                        view: "label",
                        label: L("Create Tutorial"),
                        align: "center",
                     },
                  ],
               },
               {
                  view: "form",
                  elements: [
                     {
                        view: "combo",
                        label: "",
                        id: "view_popup_options",
                        placeholder: L("Choose Page or Tab"),
                        options: [],
                     },
                     {
                        cols: [
                           {
                              view: "button",
                              value: L("Cancel"),
                              click: () => {
                                 $$("newTutorialPopup").hide();
                              },
                           },
                           {
                              view: "button",
                              value: "Create",
                              id: "view_popup_options_add",
                              css: "webix_primary",
                              click: () => {
                                 let view = $$("view_popup_options").getValue();
                                 let text = $$("view_popup_options")
                                    .getText()
                                    .trim();
                                 // take values from selection to build a new hint
                                 this.createTutorial(view, text);
                                 $$("newTutorialPopup").hide();
                              },
                           },
                        ],
                     },
                  ],
               },
            ],
         },
      };

      // save the hint and step values and close the manager
      const save = (id) => {
         return {
            cols: [
               {},
               {
                  view: "button",
                  value: L("Cancel"),
                  width: 100,
                  click: () => {
                     $$("stepManager" + id).close();
                     this.show();
                  },
               },
               {
                  view: "button",
                  value: L("Save"),
                  width: 100,
                  css: "webix_primary",
                  click: async (element, event) => {
                     // validate form
                     let valid = $$("stepform" + id).validate();
                     // get hint we are going to update
                     let hint = this.AB.hints((h) => {
                        return h.id == id;
                     })[0];
                     // loop through steps to get values and save
                     hint.stepIDs.forEach((step) => {
                        if (hint?._steps?.[step]) {
                           // validate each step to ensure they are ready to save
                           if (
                              !$$("step_form" + step).validate({
                                 disabled: true,
                              })
                           ) {
                              valid = false;
                           } else {
                              // set values so we can save later
                              let values = $$("step_form" + step).getValues();
                              hint._steps[step].name = values.name;
                              hint._steps[step].text = values.text;
                              hint._steps[step].settings.event = values.event;
                              hint._steps[step].settings.el = values.el;
                              // hint._steps[step].save();
                           }
                        }
                     });
                     if (!valid) return false;

                     var values = $$("stepform" + id).getValues();
                     hint.name = values.name;
                     hint.description = values.description;
                     hint.settings.view = values.view;
                     hint.settings.active = values.active;
                     // save the steps data next
                     // hint.stepIDs.forEach((step) => {
                     //    if (hint?._steps?.[step]) {
                     //       hint._steps[step].save();
                     //    }
                     // });
                     for (const step of hint.stepIDs) {
                        if (hint?._steps?.[step]) {
                           await hint._steps[step].save();
                        }
                     }
                     await hint.save();
                     $$("stepManager" + id).close();
                     this.show();
                  },
               },
               {},
            ],
         };
      };

      // ui that is at the top of the tutorial manager for the global tutorial settings
      const tutorialSettings = (id) => {
         let currentTutorial = this.AB.hints((h) => {
            return h.id == id;
         })[0];
         let active = currentTutorial?.settings?.active ?? "1";
         return {
            view: "form",
            id: "stepform" + id,
            borderless: true,
            cols: [
               {
                  id: "step_window",
                  rows: [
                     {
                        view: "text",
                        label: L("Title"),
                        name: "name",
                        validate: webix.rules.isNotEmpty,
                        invalidMessage: L("Title is required"),
                        value: currentTutorial.name,
                     },
                     {
                        view: "textarea",
                        label: L("Text"),
                        labelAlign: "left",
                        height: 100,
                        name: "description",
                        value: currentTutorial?.description || "",
                     },
                  ],
               },
               {
                  width: 300,
                  rows: [
                     {
                        cols: [
                           {
                              view: "label",
                              label: L("Page/Tab"),
                              align: "left",
                              width: 100,
                           },
                           // {
                           //    view: "button",
                           //    icon: "fa fa-crosshairs",
                           //    type: "icon",
                           //    label: L("select"),
                           //    css: "focusPageTab webix_primary",
                           //    currentTutorialID: id,
                           //    width: 100,
                           //    click: () => {
                           //       $$("stepManager" + currentTutorial.id).hide();
                           //       document.addEventListener(
                           //          "click",
                           //          this.handlePageTabClick,
                           //          false
                           //       );
                           //       document.hintId = id;
                           //       webix.ui(this.pageTabWindow(id)).show();
                           //    },
                           // },
                           {
                              view: "combo",
                              name: "view",
                              value: currentTutorial.settings.view,
                              options: {
                                 view: "suggest",
                                 css: "wider_popup",
                                 body: {
                                    view: "list",
                                    css: "wider_popup",
                                    data: this.options,
                                    template: "#value#",
                                 },
                              },
                           },
                        ],
                     },

                     {
                        view: "switch",
                        label: L("Active"),
                        labelWidth: 100,
                        name: "active",
                        value: active,
                     },
                  ],
               },
            ],
         };
      };

      // this is the drawer admin that lists all tutorials
      return {
         view: "window",
         css: "tutorialWindow",
         id: "tutorial_manager",
         position: function (state) {
            state.left = state.maxWidth - 350; // fixed values
            state.top = 0;
            state.width = 350; // relative values
            state.height = state.maxHeight;
         },
         on: {
            onShow: () => {},
         },
         head: {
            view: "toolbar",
            css: "webix_dark",
            cols: [
               {
                  width: 15,
               },
               {
                  view: "label",
                  label: "Tutorial Manager",
                  autowidth: true,
               },
               {},
               {
                  view: "button",
                  type: "icon",
                  icon: "fa fa-plus",
                  label: "Tutorial",
                  width: 95,
                  css: "webix_primary",
                  click: () => {
                     webix.ui(newTutorialPopup).show();

                     $$("view_popup_options").define("options", this.options);
                     $$("view_popup_options").define(
                        "value",
                        this.portal.AppState.lastPages[
                           this.portal.AppState.lastSelectedApp
                        ]
                     );
                     $$("view_popup_options").refresh();
                  },
               },
               {
                  view: "button",
                  width: 35,
                  css: "webix_transparent",
                  type: "icon",
                  icon: "nomargin fa fa-times",
                  click: () => {
                     this.hide();
                  },
               },
            ],
         },
         body: tutorialManagerBody,
      };
   }

   init(portal) {
      this.AB = portal.AB;
      this.portal = portal;
      this.appId = portal.AppState.lastSelectedApp;

      this.application = this.AB.applicationByID(this.appId);
      const pages = this.application.pages();
      this.options = this.getViewOptions(pages);
      // only return tutorials that are on current application
      this._hints = this.AB.hints((hint) => {
         if (this.application.hintIDs.indexOf(hint.id) > -1) {
            return true;
         } else {
            return false;
         }
      });
      webix.ui(this.ui());
   }

   show() {
      // this gets the latest hints and updates them to local list.
      $$("tutorial_manager").show();
      this._hints = this.AB.hints((hint) => {
         if (this.application.hintIDs.indexOf(hint.id) > -1) {
            return true;
         } else {
            return false;
         }
      });
      $$("tutorial_list").define("data", this._hints);
      $$("tutorial_list").refresh();
   }

   hide() {
      $$("tutorial_manager").hide();
   }

   // small modal that gives instructions to user when selecting the page or tab to load this tutorial on
   pageTabWindow(hintID) {
      return {
         view: "window",
         id: "pageTabWindow",
         width: 160,
         height: 160,
         move: true,
         head: {
            view: "toolbar",
            css: "webix_dark",
            cols: [
               {},
               {
                  view: "button",
                  width: 35,
                  css: "webix_transparent",
                  type: "icon",
                  icon: "nomargin fa fa-times",
                  click: () => {
                     $$("stepManager" + hintID).show();
                     $$("pageTabWindow").hide();

                     document.removeEventListener(
                        "contextmenu",
                        this.handleRightClick,
                        false
                     );
                  },
               },
            ],
         },
         position: function (state) {
            state.left = state.maxWidth - state.width;
            state.top = state.maxHeight - state.height;
         },
         body: {
            template:
               "<div class='highlightWin'>" +
               L("Click the page or tab that will start this tutorial") +
               "</div>",
         },
      };
   }

   // small modal that gives instructions to users when they are selecting the highlight element
   focusWindow(hintID) {
      return {
         view: "window",
         id: "focusWindow",
         width: 160,
         height: 160,
         move: true,
         head: {
            view: "toolbar",
            css: "webix_dark",
            cols: [
               {},
               {
                  view: "button",
                  width: 35,
                  css: "webix_transparent",
                  type: "icon",
                  icon: "nomargin fa fa-times",
                  click: () => {
                     $$("stepManager" + hintID).show();
                     $$("focusWindow").hide();

                     document.removeEventListener(
                        "contextmenu",
                        this.handleRightClick,
                        false
                     );
                     document.body.classList.remove("findDataCy");
                  },
               },
            ],
         },
         position: function (state) {
            state.left = state.maxWidth - state.width;
            state.top = state.maxHeight - state.height;
         },
         body: {
            template:
               "<div class='highlightWin'>" +
               L("Right click the element you want to highlight.") +
               "</div>",
         },
      };
   }

   updateStepsUI(id) {
      const views = $$("hint_steps_" + id).getChildViews();
      let viewsToRemove = [];
      views.forEach((view) => {
         viewsToRemove.push(view.config.id);
      });
      viewsToRemove.forEach((view) => {
         $$("hint_steps_" + id).removeView(view);
      });
      this.steps(id);
   }

   addHighlightClass(event) {
      let item = $$(event.currentTarget);
      let formVals = $$("step_form" + item.config.stepId).getValues();
      document.querySelector(formVals?.el).classList.add("highlightMe");
   }
   removeHighlightClass(event) {
      let item = $$(event.currentTarget);
      let formVals = $$("step_form" + item.config.stepId).getValues();
      document.querySelector(formVals?.el).classList.remove("highlightMe");
   }

   // build a list of steps that are included in this hint
   steps(id) {
      let hint = this.AB.hints((h) => {
         return h.id == id;
      })[0];
      // if we do not have steps
      if (!hint?.stepIDs?.length) {
         let addStepBelow = {
            id: "addStepBelow",
            padding: 20,
            rows: [
               {
                  css: "ab-component-form-rules",
                  rows: [
                     {},
                     {
                        view: "label",
                        align: "center",
                        height: 80,
                        label: "<div style='display: block; font-size: 80px; background-color: #666; color: transparent; text-shadow: 0px 1px 1px rgba(255,255,255,0.5); -webkit-background-clip: text; -moz-background-clip: text; background-clip: text;' class='fa fa-info-circle'></div>",
                     },
                     {
                        view: "label",
                        align: "center",
                        label: L("Add a step to this tutorial."),
                     },
                     {
                        cols: [
                           {},
                           {
                              view: "button",
                              type: "icon",
                              icon: "fa fa-plus",
                              label: L("Step"),
                              autowidth: true,
                              css: "webix_primary",
                              click: async () => {
                                 // create an ABStep
                                 let step = await this.createStep(id);
                                 // save it to definitions to get id
                                 await step.save();
                                 // get the hint we are editing
                                 let hint = this.AB.hints((h) => {
                                    return h.id == id;
                                 })[0];
                                 // assign the new ABStep id to the ABHint
                                 if (
                                    hint?.stepIDs &&
                                    Array.isArray(hint.stepIDs)
                                 ) {
                                    hint.stepIDs.push(step.id);
                                 } else {
                                    hint.stepIDs = [step.id];
                                 }
                                 // store the ABStep on the ABHint (not stored in defs)
                                 hint._steps[step.id] = step;
                                 // remove ui that shows when ABHint does not have steps
                                 $$("hint_steps_" + hint.id).removeView(
                                    "addStepBelow"
                                 );
                                 // add the ui to edit the new step to the ui
                                 $$("hint_steps_" + hint.id).addView(
                                    this.stepUI(step, hint)
                                 );
                              },
                           },
                           {},
                        ],
                     },
                     {},
                  ],
               },
            ],
         };
         // add to the ui now that we have it defined
         $$("hint_steps_" + id).addView(addStepBelow);
      } else {
         // if we do have steps
         hint.stepIDs.forEach((step) => {
            $$("hint_steps_" + id).addView(
               this.stepUI(hint._steps[step], hint)
            );
         });
      }
      // set up hover listeners for buttons that help user pick and show the highlight elements
      const focusElements = document.querySelectorAll(".focusElement");
      for (let i = 0; i < focusElements.length; i++) {
         focusElements[i].addEventListener(
            "mouseover",
            this.addHighlightClass,
            false
         );
         focusElements[i].addEventListener(
            "mouseout",
            this.removeHighlightClass,
            false
         );
      }
   }

   // UI for each step that will be used to rebuild steps when moved/deleted/loaded
   stepUI(step, hint) {
      // the position of the step that we display in the top left corner of the ui
      let position = $$("hint_steps_" + hint.id).getChildViews().length + 1;
      return {
         view: "form",
         id: "step_form" + step.id,
         css: "my",
         padding: 15,
         borderless: true,
         rows: [
            {
               borderless: true,
               cols: [
                  {
                     width: 50,
                     rows: [
                        {
                           view: "label",
                           label: `<h1 class="stepPos">${position}</h1>`,
                           align: "center",
                        },
                        {
                           view: "icon",
                           class: "moveStepUp",
                           icon: "fa fa-caret-up",
                           disabled: position == 1 ? true : false, // do not allow moving up if already at the top position
                           align: "center",
                           click: (id, element) => {
                              // move the step up a position
                              this.moveStep(step, hint, "up");
                           },
                        },
                        {
                           view: "icon",
                           class: "moveStepDown",
                           icon: "fa fa-caret-down",
                           disabled:
                              hint.stepIDs.length == position ? true : false, // do not let the last item be moved down
                           align: "center",
                           click: (id, element) => {
                              // move the step down a position
                              this.moveStep(step, hint, "down");
                           },
                        },
                     ],
                  },
                  {
                     css: "ab-component-form-rules",
                     padding: 15,
                     cols: [
                        {
                           minWidth: 300,
                           rows: [
                              {
                                 view: "text",
                                 label: L("Title"),
                                 validate: webix.rules.isNotEmpty,
                                 invalidMessage: L("Title is required"),
                                 labelWidth: 100,
                                 name: "name",
                                 value: step?.name || "",
                              },
                              {
                                 view: "textarea",
                                 label: L("Text"),
                                 labelAlign: "left",
                                 labelWidth: 100,
                                 height: 150,
                                 name: "text",
                                 value: step?.text || "",
                              },
                              {
                                 cols: [
                                    {
                                       view: "label",
                                       label: L("Highlight"),
                                       align: "left",
                                       width: 100,
                                    },
                                    {
                                       view: "button",
                                       icon: "fa fa-crosshairs",
                                       type: "icon",
                                       label: L("select"),
                                       css: "focusElement webix_primary",
                                       stepId: step.id,
                                       width: 100,
                                       click: () => {
                                          // change the ui to support the selecting of the highlight element
                                          $$("stepManager" + hint.id).hide();
                                          // adding this class will allow a css rule to highlight any element with data-cy attribute on hover
                                          document.body.classList.add(
                                             "findDataCy"
                                          );
                                          // when the user sees the element hovered can be a highlight element they right click to save it
                                          document.addEventListener(
                                             "contextmenu",
                                             this.handleRightClick,
                                             false
                                          );
                                          // store the step and hint ids to use in the handleRightClick() function
                                          document.stepId = step.id;
                                          document.hintId = hint.id;
                                          // show a small window in bottom right hand corner that helps user know what to do
                                          webix
                                             .ui(this.focusWindow(hint.id))
                                             .show();
                                       },
                                    },
                                    {
                                       view: "text",
                                       name: "el",
                                       value: step.settings.el,
                                       disabled: true,
                                       placeholder: L(
                                          "Click the 'select' button to pick an element to highlight."
                                       ),
                                       bottomLabel: L(
                                          "Hover over the 'select' button to highlight the chosen element."
                                       ),
                                       validate: webix.rules.isNotEmpty,
                                       invalidMessage: L(
                                          "Please choose an item to highlight"
                                       ),
                                    },
                                 ],
                              },
                              {
                                 cols: [
                                    {
                                       view: "label",
                                       label: L("Event"),
                                       align: "left",
                                       width: 100,
                                    },
                                    {
                                       view: "combo",
                                       value: step.settings.event,
                                       name: "event",
                                       options: [
                                          {
                                             id: "click",
                                             value: L("Click"),
                                          },
                                          {
                                             id: "enter",
                                             value: L("Enter"),
                                          },
                                       ],
                                    },
                                 ],
                              },
                           ],
                        },
                     ],
                  },
                  {
                     view: "template",
                     borderless: true,
                     template: `<div class="deleteStep"><i class="fa fa-times"></i></div>`,
                     width: 15,
                     onClick: {
                        deleteStep: (ev, id) => {
                           // ask user if they want to delete this step
                           webix
                              .confirm({
                                 title: L("Delete Step"),
                                 text: L(
                                    "Are you sure you want to delete this step?"
                                 ),
                                 type: "confirm-error",
                              })
                              .then(async (result) => {
                                 // remove the step from the hint
                                 hint.stepRemove(step.id);
                                 await hint.save();
                                 // rebuild the step ui now that one has been removed
                                 this.updateStepsUI(hint.id);
                                 return false; // blocks the default click behavior
                              })
                              .fail(() => {
                                 // webix.message("Cancel");
                              });
                           return false;
                        },
                     },
                  },
               ],
            },
         ],
      };
   }

   // this function moves a step up or down a position
   async moveStep(step, hint, direction) {
      let currPosition = hint.stepIDs.indexOf(step.id);
      switch (direction) {
         case "up":
            hint.stepIDs.splice(
               currPosition - 1,
               0,
               hint.stepIDs.splice(currPosition, 1)[0]
            );
            break;
         default:
            hint.stepIDs.splice(
               currPosition + 1,
               0,
               hint.stepIDs.splice(currPosition, 1)[0]
            );
      }
      await hint.save();
      this.updateStepsUI(hint.id);
   }

   // this builds the list of page/tab options that a hint can be added to
   getViewOptions(views) {
      // this so it looks right/indented in a tree view:
      // var tree = new webix.TreeCollection();
      var options = [];

      /**
       * @method addOption
       *
       * @param {ABView} page
       * @param {uuid} parentId
       * @param {number} depth
       */
      var addOption = (object, parentId, depth) => {
         // add to tree collection
         if (["page", "tab", "viewcontainer"].indexOf(object.key) != -1) {
            var indent = "";
            for (let i = 0; i < depth; i++) {
               indent += "<i style='display:inline-block; width: 10px;'></i>";
            }
            let icon =
               object.icon == "braille" ? "external-link-square" : object.icon;
            var option = {
               id: object.id,
               value: `${indent} <i class="fa fa-${icon}"></i> ${object.label}`,
            };
            options.push(option);
         }

         var pages = object.pages ? object.pages() : [];
         pages.forEach((page, pageIndex) => {
            addOption(page, object.id, depth + 1);
         });

         var views = object.views();
         views.forEach((view, pageIndex) => {
            addOption(view, object.id, depth + 1);
         });
      };
      views.forEach((p, index) => {
         addOption(p, null, 0);
      });

      return options;
   }

   // This creates a new hint and stores it on the application and view we want to display it on
   async createTutorial(viewID, viewLabel) {
      let hint = this.AB.hintNew({
         name: viewLabel,
         settings: { view: viewID },
      });
      await hint.save();
      if (Array.isArray(this?.application?.hintIDs)) {
         this.application.hintIDs.unshift(hint.id);
      } else {
         this.application.hintIDs = [hint.id];
      }
      this.application.save();
      let hintView = this.application.views((view) => {
         return view.id == viewID;
      })[0];
      hintView.settings.hintID = hint.id;
      hintView.save();
      $$("tutorial_list").add(hint, 0);
      if (this.AB.hints().length) {
         $$("tutorial_list").show();
         $$("tutorial_list_noSelection").hide();
      }
   }

   // create a new step on a hint
   async createStep(hintID) {
      let step = this.AB.stepNew(null, hintID);
      return step;
   }

   // store the data-cy info on a step after right clicking an element on the page
   handleRightClick(event) {
      function getCy(element) {
         if (element?.dataset?.cy) {
            return element.dataset.cy;
         } else if (element?.parentElement) {
            return getCy(element.parentElement);
         } else {
            webix.alert({
               text: L("Sorry, try another element."),
            });
            return "";
         }
      }

      if (document?.stepId) {
         event.preventDefault();
         event.stopPropagation();
         let dataCy = getCy(event.target);
         if (!dataCy) return false;
         $$("step_form" + document.stepId).setValues(
            {
               el: "[data-cy='" + dataCy + "']",
            },
            true
         );
      }
      $$("stepManager" + document.hintId).show();
      $$("focusWindow").hide();

      document.removeEventListener("contextmenu", this.handleRightClick, false);
      document.body.classList.remove("findDataCy");
      delete document.stepId;
      delete document.hintId;

      return false;
   }

   // handlePageTabClick(event) {
   //    event.preventDefault();
   //    event.stopPropagation();
   //    debugger;
   //    // $$("stepform" + document?.hintId).setValues(
   //    //    {
   //    //       view: "[data-cy='" + dataCy + "']",
   //    //    },
   //    //    true
   //    // );

   //    $$("stepManager" + document.hintId).show();
   //    $$("pageTabWindow").hide();

   //    document.removeEventListener("click", this.handlePageTabClick, false);
   //    delete document.hintId;

   //    return false;
   // }
}

export default new PortalTutorialManager();
