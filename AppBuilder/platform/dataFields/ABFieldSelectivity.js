/*
 * ABFieldSelectivity
 *
 * An ABFieldSelectivity defines a single unique Field/Column in a ABObject.
 *
 */

const ABField = require("./ABField");

const defaultSettings = {
   allowClear: true,
   removeOnly: false,
   readOnly: false,
   showDropdown: true,
   placeholder: "",
   multiple: false,
};

const ABFieldSelectivityDefaults = {
   key: "selectivity",
};

module.exports = class ABFieldSelectivity extends ABField {
   constructor(values, object, fieldDefaults = ABFieldSelectivityDefaults) {
      super(values, object, fieldDefaults);
   }

   // return the default values for this DataField
   static defaults() {
      return {
         key: "selectivity",
         icon: "bars",
         menuName: "",
         description: "",
      };
   }

   selectivityRender(domNode, settings, App, row) {
      if (domNode == null) return;

      const cypress = settings.dataCy || "";
      domNode.setAttribute("data-cy", cypress);

      // setting up our specific settings:
      settings = settings || {};
      for (const dv in defaultSettings) {
         if (settings[dv] === null) {
            settings[dv] = null;
         } else {
            settings[dv] = settings[dv] || defaultSettings[dv];
         }
      }

      if (
         settings.multiple &&
         settings.items &&
         settings.data &&
         settings.data.length
      ) {
         settings.data.forEach(function (d) {
            settings.items.map(function (i) {
               if (i.id == d.id) d.hex = i.hex;
            });
         });
         settings["data"] = this.prepareData(
            settings["data"],
            settings.multiple
         );
      } else if (settings["data"] == null || settings["data"] == "") {
         settings["data"] = this.prepareData([], settings.multiple);
      } else {
         settings["data"] = this.prepareData(
            settings["data"],
            settings.multiple
         );
      }

      // store the field id so we can look it up on click events later
      settings["field"] = this.id;

      // Prevent render selectivity duplicate
      if (domNode.selectivity != null) {
         // Refresh selectivity settings
         domNode.selectivity.setOptions(settings);

         return;
      }

      settings.element = domNode;

      // Render selectivity
      let selectivityInput;
      if (settings.multiple) {
         if (settings.isUsers) {
            settings.templates = {
               multipleSelectedItem: function (options) {
                  return `<span class="selectivity-multiple-selected-item ${
                     options.highlighted ? " highlighted" : ""
                  }"
								style="background-color: #eee !important; color: #666 !important; box-shadow: inset 0px 1px 1px #333;"
								data-item-id="${options.uuid}" data-field-id="${settings.field}">
								<i class="fa fa-user" style="color: #666; opacity: 0.6;"></i> 
                        ${
                           settings.additionalText
                              ? settings.additionalText(options)
                              : ""
                        }
								${!settings.isLabelHidden ? options.text : ""}
								${
                           options.removable
                              ? ` <a class="selectivity-multiple-selected-item-remove" style="color: #333;"><i class="fa fa-remove"></i></a>`
                              : ""
                        }
							</span>`;
               },
            };
         } else {
            settings.templates = {
               multipleSelectedItem: function (options) {
                  return `<span class="selectivity-multiple-selected-item ${
                     options.highlighted ? " highlighted" : ""
                  }"
								style="background-color: ${options.hex} !important;"
								data-item-id="${options.uuid}" data-field-id="${settings.field}">
                        ${
                           settings.editPage
                              ? ` <a class="selectivity-multiple-selected-item-edit"><i class="fa fa-edit"></i></a>`
                              : ""
                        }
                        ${
                           settings.additionalText
                              ? settings.additionalText(options)
                              : ""
                        }
                        ${!settings.isLabelHidden ? options.text : ""}
                        ${
                           options.removable
                              ? ` <a class="selectivity-multiple-selected-item-remove"><i class="fa fa-remove"></i></a>`
                              : ""
                        }
							</span>`;
               },
            };
         }
         selectivityInput = new Selectivity.Inputs.Multiple(settings);

         domNode.selectivity = selectivityInput;
         this.selectivitySetBadge(domNode, App, row);
      } else {
         settings.templates = {
            singleSelectedItem: function (options) {
               return `<span class="selectivity-single-selected-item" data-item-id="${
                  options.uuid
               }" data-field-id="${settings.field}">
							${
                        settings.editPage
                           ? '<a class="selectivity-single-selected-item-edit"><i class="fa fa-edit"></i></a>'
                           : ""
                     }
                     ${
                        settings.additionalText
                           ? settings.additionalText(options)
                           : ""
                     }
                     ${!settings.isLabelHidden ? options.text : ""}
                     ${
                        options.removable
                           ? '<a class="selectivity-single-selected-item-remove"><i class="fa fa-remove"></i></a>'
                           : ""
                     }
						</span>`;
            },
         };

         selectivityInput = new Selectivity.Inputs.Single(settings);
         domNode.selectivity = selectivityInput;
      }

      if (settings.editPage) {
         const trigerEditPageEvent = () => {
            const instance = this;
            const editMenus = document.querySelectorAll(
               ".selectivity-single-selected-item-edit, .selectivity-multiple-selected-item-edit"
            );
            for (let i = 0; i < editMenus.length; i++) {
               const eMenu = editMenus[i];
               if (eMenu && !eMenu.__hasClickEvent) {
                  eMenu.addEventListener(
                     "click",
                     function (e) {
                        e.stopPropagation();
                        e.preventDefault();

                        const parentElm = this.parentElement;
                        if (!parentElm) return;

                        const rowId = parentElm.getAttribute("data-item-id");
                        if (!rowId) return;

                        const fieldId = parentElm.getAttribute("data-field-id");
                        if (!fieldId) return;

                        const thisField = instance.object.fieldByID(fieldId);
                        if (!thisField) return;

                        thisField.emit("editPage", rowId);
                     },
                     true
                  );
                  eMenu.__hasClickEvent = true;
               }
            }
         };

         setTimeout(() => {
            trigerEditPageEvent();

            domNode.addEventListener("change", () => {
               trigerEditPageEvent();
            });
         }, 500);
      }

      // WORKAROUND : remove caret icon of selectivity
      if (settings.readOnly) {
         const caretElems = domNode.getElementsByClassName("selectivity-caret");
         for (let i = 0; i < caretElems.length; i++) {
            const caretElm = caretElems[i];
            if (caretElm) {
               caretElm.parentNode.removeChild(caretElm);
            }
         }
      }

      // remember our settings values
      this.selectivitySettings = settings;
   }

   selectivityGet(domNode) {
      if (domNode && domNode.selectivity) {
         if (this.selectivitySettings && this.selectivitySettings.multiple) {
            // on a multiple select, return an array of results, or empty array
            return domNode.selectivity.getData() || [];
         } else {
            // if a single select, return the object or null
            return domNode.selectivity.getData() || null;
         }
      } else {
         if (this.selectivitySettings && this.selectivitySettings.multiple)
            return [];
         else return null;
      }
   }

   selectivitySet(domNode, data) {
      if (!domNode || !domNode.selectivity) return;

      data = this.prepareData(data, domNode.selectivity.options.multiple);

      if (
         (Array.isArray(data) && data[0]) || // Check Array
         (data && data.id)
      )
         // Check a object
         domNode.selectivity.setData(data);
      else domNode.selectivity.clear();
   }

   selectivityDestroy(domNode) {
      if (domNode && domNode.selectivity) {
         domNode.selectivity.destroy();

         delete domNode.selectivity;
      }
   }

   prepareData(data, multiple = true) {
      if (!data && multiple) {
         return [];
      } else if (multiple && data && Array.isArray(data) && data.length == 0) {
         return [];
      } else if (!multiple && data && Array.isArray(data) && data.length == 0) {
         return null;
      } else if (!data && !multiple) {
         return null;
      }

      if (typeof data == "string" && data.length > 0) {
         try {
            data = JSON.parse(data);
         } catch (e) {
            // not JSON parsable, so convert to
            data = { id: data, text: data };
         }
      }

      // if single select, then it should be object
      if (!multiple && Array.isArray(data)) {
         data = data[0];
      } else if (multiple && !Array.isArray(data)) {
         data = [data];
      }

      // check to see if id is present on each item
      if (multiple) {
         data.forEach((d) => {
            if (!d.id && d.uuid) {
               d.id = d.uuid;
            }
         });
      } else {
         if (!data.id && data.uuid) data.id = data.uuid;
      }

      if (data == null && multiple) {
         data = [];
      }

      return data;
   }

   selectivitySetBadge(domNode) {
      if (!domNode.clientHeight) return;
      const innerHeight = domNode.clientHeight;
      const outerHeight = domNode.parentElement.clientHeight;
      if (innerHeight - outerHeight > 5) {
         let count = 0;
         let values = [];
         if (domNode && domNode.selectivity)
            values = domNode.selectivity.getValue() || [];

         count = values.length;
         if (count > 1) {
            const badge = domNode.querySelector(
               ".webix_badge.selectivityBadge"
            );
            if (badge != null) {
               badge.innerHTML = count;
            } else {
               const anchor = document.createElement("A");
               anchor.href = "javascript:void(0);";
               // v2: this just updated the $height property for this row
               // we don't do that anymore:
               // anchor.addEventListener("click", function () {
               //    App.actions.onRowResizeAuto(row.id, innerHeight);
               // });
               const node = document.createElement("SPAN");
               const textnode = document.createTextNode(count);
               node.classList.add("webix_badge", "selectivityBadge");
               node.appendChild(textnode);
               anchor.appendChild(node);
               domNode.appendChild(anchor);
            }
         }
      }
   }
};
