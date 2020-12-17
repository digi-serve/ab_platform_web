//
// Dialog
// A common set of UI dialogs to show the User.
//
// NOTE: IN TRANSITION: this is our previous method of handling
// dialogs.  In future, refactor to use webix directly in code.
//

export default {
   // Instance properties

   // Alert
   // A dialogue that popup with a message, and requires an [ok] button press
   Alert: function (opts) {
      webix.alert({
         title:
            opts.title ||
            AB.Multilingual.Label("opp.dialog.alert.title", "*Alert"),
         text:
            opts.text ||
            opts.message ||
            AB.Multilingual.Label(
               "opp.dialog.alert.text",
               "*Something is wrong."
            ),
         ok: opts.ok || AB.Multilingual.Label("opp.dialog.alert.ok", "*OK"),
      });
   },

   // Confirm
   // A [Yes] [No] dialogue that pops up with a message
   Confirm: function (opts) {
      var title =
         opts.title ||
         AB.Multilingual.Label("opp.dialog.confirm.confirmTitle", "* Confirm");
      var message =
         opts.text ||
         opts.message ||
         AB.Multilingual.Label(
            "opp.dialog.confirm.confirmMsg",
            "* Are you sure you want to do this?"
         );

      var labelYes =
         opts.labelYes ||
         opts.ok ||
         AB.Multilingual.Label("opp.common.yes", "* yes");
      var labelNo =
         opts.labelNo ||
         opts.cancel ||
         AB.Multilingual.Label("opp.common.no", "* no");

      // var fnYes = opts.fnYes || function () { };
      // var fnNo = opts.fnNo || function () { };

      webix.confirm({
         title: title,
         text: message,

         ok: labelYes,
         cancel: labelNo,

         callback: function (result) {
            if (result) {
               if (opts.fnYes) opts.fnYes();
            } else {
               if (opts.fnNo) opts.fnNo();
            }

            if (opts.callback) opts.callback(result);
         },
      });

      // bootbox.dialog({
      //     title: title,
      //     message: message,
      //     buttons: {
      //         yes: {
      //             label: labelYes,
      //             className: 'btn-primary',
      //             callback: fnYes
      //         },
      //         no: {
      //             label: labelNo,
      //             className: 'btn-default',
      //             callback: fnNo
      //         }
      //     }
      // });
   },

   // ConfirmDelete
   // A Confirm dialogue geared towards deleting items.
   // [delete] [cancel]
   ConfirmDelete: function (opts) {
      this.Confirm({
         title:
            opts.title ||
            AB.Multilingual.Label(
               "opp.dialog.confirm.deleteTitle",
               "* Confirm Delete"
            ),
         ok: opts.ok || AB.Multilingual.Label("opp.common.delete", "* Delete"),
         cancel:
            opts.cancel ||
            AB.Multilingual.Label("opp.common.cancel", "* Cancel"),
         text:
            opts.text ||
            opts.message ||
            AB.Multilingual.Label(
               "opp.dialog.confirm.deleteMsg",
               "* Are you sure you want to delete this?",
               ["this"]
            ),
         callback: function (result) {
            if (result) {
               if (opts.fnYes) opts.fnYes();
            } else {
               if (opts.fnNo) opts.fnNo();
            }

            if (opts.callback) opts.callback(result);
         },
      });
   },

   // Message
   // A simple message displayed to the user.  Can time out
   Message: function (opts) {
      var message = opts.text || opts.message;
      var timeout = opts.timeout || 2000;

      webix.message({
         text: message,
         expire: timeout,
      });
   },
};
