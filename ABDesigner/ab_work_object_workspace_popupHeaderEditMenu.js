/*
 * ab_work_object_workspace_popupHeaderEditMenu
 *
 * Manage the Add New Data Field popup.
 *
 */

const ABComponent = require("../AppBuilder/platform/ABComponent");

module.exports = class ABWorkObjectPopupHeaderEditMenu extends ABComponent {
   constructor(App, idBase) {
      idBase = idBase || "ab_work_object_workspace_popupHeaderEditMenu";

      super(App, idBase);
      var L = this.Label;

      var ids = {
         component: this.unique(`${idBase}_popupEditHeader`),
         list: this.unique(`${idBase}_popupEditHeader_list`),
      };

      // the list of options shown in the popup menu:
      var menuItems = {
         // Normally all items are available
         default: [
            { command: L("Hide field"), icon: "fa-eye-slash" },
            { command: L("Filter field"), icon: "fa-filter" },
            { command: L("Sort field"), icon: "fa-sort" },
            { command: L("Freeze field"), icon: "fa-thumb-tack" },
            { command: L("Edit field"), icon: "fa-pencil-square-o" },
            { command: L("Delete field"), icon: "fa-trash" },
         ],
         // But for imported objects, edit & delete are disabled
         imported: [
            { command: L("Hide field"), icon: "fa-eye-slash" },
            { command: L("Filter field"), icon: "fa-filter" },
            { command: L("Sort field"), icon: "fa-sort" },
            { command: L("Freeze field"), icon: "fa-thumb-tack" },
            //{ command: labels.editField, icon: "fa-pencil-square-o" },
         ],
      };

      // webix UI definition:
      this.ui = {
         view: "popup",
         id: ids.component,
         modal: false,
         autoheight: true,

         width: 180,
         body: {
            id: ids.list,
            view: "list",
            datatype: "json",
            autoheight: true,
            select: false,
            template: "<i class='fa #icon#' aria-hidden='true'></i> #command#",
            data: menuItems["default"], // start with the default set:
            on: {
               onItemClick: function (timestamp, e, node) {
                  _logic.onItemClick(timestamp, e, node);
               },
            },
         },
      };

      var CurrentObject = null;

      // setting up UI
      this.init = (options) => {
         // register callbacks:
         for (var c in _logic.callbacks) {
            _logic.callbacks[c] = options[c] || _logic.callbacks[c];
         }

         // create the instance of our popup
         webix.ui(this.ui);
      };

      // internal business logic
      var _logic = (this.logic = {
         callbacks: {
            /**
             * @function onClick
             * report back which menu action was clicked.
             * possible actions:
             *      [ 'hide', 'filter', 'sort', 'edit', 'delete' ]
             */
            onClick: function (action) {},
         },

         hide: function () {
            $$(ids.component).hide();
         },

         /**
          * @function objectLoad
          * Ready the Popup according to the current object
          * @param {ABObject} object  the currently selected object.
          */
         objectLoad: function (object) {
            CurrentObject = object;
         },

         /**
          * @function onItemClick
          * when an entry in our popup menu is selected, make sure our
          * parent component is alerted to the action requested.
          *
          * possible return action values:
          *      [ 'hide', 'filter', 'sort', 'edit', 'delete' ]
          *
          */
         onItemClick: function (timestamp, e, node) {
            var action = null;
            var menu = node.textContent.trim();
            switch (menu) {
               case L("Hide field"):
                  action = "hide";
                  break;
               case L("Filter field"):
                  action = "filter";
                  break;
               case L("Sort field"):
                  action = "sort";
                  break;
               case L("Freeze field"):
                  action = "freeze";
                  break;
               case L("Edit field"):
                  action = "edit";
                  break;
               case L("Delete field"):
                  action = "delete";
                  break;
            }

            _logic.callbacks.onClick(action);
         },

         /**
          * @function show()
          *
          * Show this component.
          * @param {obj} $view  the webix.$view to hover the popup around.
          */
         show: function ($view, field) {
            // check if field is imported, if so, then switch the
            // shown fields to the imported menu:
            var listItems = field.isImported
               ? menuItems["imported"]
               : menuItems["default"];
            var List = $$(ids.list);
            List.clearAll();
            List.parse(listItems);

            $$(ids.component).show($view);
         },
      });

      // Expose any globally accessible Actions:
      // this.actions({
      //    // populateObjectPopupAddDataField: function(object) {
      //    // 	_currentObject = object;
      //    // }
      // });

      this.hide = _logic.hide;
      this.show = _logic.show;
      this.objectLoad = _logic.objectLoad;
   }
};
