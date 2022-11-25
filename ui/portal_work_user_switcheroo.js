import ClassUI from "./ClassUI.js";

var myClass = null;
// Singleton.
// This UI gets imported several times so let's not recreate the class each time.

if (!myClass) {
   myClass = class PortalWorkUserSwitcheroo extends ClassUI {
      constructor() {
         super("portal_work_user_switcheroo", {
            userIcon: "",
            userName: "",
            switchBack: "",
            switchBackReplacer: "",
            list: "",
         });
      }

      ui() {
         var L = (...params) => {
            return this.label(...params);
         };
         const ids = this.ids;
         return {
            id: ids.component,
            view: "window",
            position: "center",
            hidden: true,
            close: true,
            modal: true,
            css: "switcheroo",
            head: L("Switcheroo"),
            body: {
               padding: 10,
               rows: [
                  {
                     height: 30,
                     cols: [
                        {
                           id: ids.userIcon,
                           view: "label",
                           align: "center",
                           width: 44,
                        },
                        {
                           id: ids.userName,
                           view: "label",
                           align: "center",
                        },
                        {
                           id: ids.switchBack,
                           view: "button",
                           value: '<div style="text-align: center; font-size: 12px;"><i class="fa-fw fa fa-times"></i></div>',
                           align: "center",
                           css: "webix_transparent",
                           width: 44,
                           on: {
                              onItemClick: () => {
                                 this.switchUser();
                                 this.hide();
                              },
                           },
                        },
                        {
                           id: ids.switchBackReplacer,
                           width: 44,
                        },
                     ],
                  },
                  {
                     view: "label",
                     label: L("View site as:"),
                     align: "left",
                  },
                  {
                     id: ids.list,
                  },
                  {
                     cols: [
                        {
                           view: "button",
                           value: L("Switch"),
                           css: "webix_primary",
                           on: {
                              onItemClick: () => {
                                 const userID = $$(ids.list).getValue();

                                 if (!userID) {
                                    webix.message(L("Please select a user."));

                                    return;
                                 }

                                 this.switchUser(userID);
                                 this.hide();
                              },
                           },
                        },
                     ],
                  },
               ],
            },
         };
      }

      init(AB, headless = false) {
         this.AB = AB;
         if (!headless) {
            webix.ui(this.ui());
            this.populate();
         }

         return Promise.resolve();
      }

      hide() {
         $$(this.ids.component).hide();
      }

      show() {
         $$(this.ids.component).show();
      }

      // const clearPopupUserMenu = () => {
      //   $$("switcheroo_list").setValue("");
      //   $$("switcheroo").hide();
      //   $$("userMenu_list").unselectAll();
      //   $$("userMenu_list").show();
      // };

      async switcherooClear() {
         return this.switchUser(null);
      }

      async switchUser(userID) {
         const user = (this.AB.Account.userList() || []).find(
            (e) => e.uuid === userID
         );

         // Save to a switched user.
         if (!user || !userID) {
            // if no user, then remove our current Switcheroo assignment
            /* let response = */ await this.AB.Network.delete({
               url: `/auth/switcheroo`,
               // data: {},
            });
         } else {
            /* let response = */ await this.AB.Network.post({
               url: `/auth/switcheroo/${user.uuid}`,
               // data: {},
            });
         }

         window.location.reload(true);
      }

      populate() {
         const ids = this.ids;

         const mainUserID = this.AB.Account.uuid();
         const userList = (this.AB.Account.userList() || [])
            .filter((e) => e.uuid !== mainUserID)
            .map((u) => {
               return { id: u.uuid, value: u.username };
            });

         let switchedUserID = null;
         if (this.AB.Account.isSwitcherood()) {
            switchedUserID = mainUserID;
         }
         webix.ui(
            {
               id: ids.list,
               view: "combo",
               options: {
                  body: {
                     template: (obj) => {
                        if (obj.id === switchedUserID)
                           return `<i class='fa-fw fa fa-user-secret'></i> ${obj.value}`;
                        return obj.value;
                     },
                  },
                  data: userList,
               },
               on: {
                  onItemClick: (id) => {
                     $$(id).setValue("");
                  },
               },
            },
            $$(ids.list)
         );
         $$(ids.userName).setValue(this.AB.Account.username());

         if (this.AB.Account.isSwitcherood()) {
            $$(ids.userIcon).setValue(
               "<i class='fa-fw fa fa-user-secret'></i>"
            );
            $$(ids.switchBackReplacer)?.hide();
            $$(ids.switchBack)?.show();
            return;
         }

         $$(ids.userIcon).setValue("<i class='fa-fw fa fa-user'></i>");
         $$(ids.switchBack).hide();
         $$(ids.switchBackReplacer).show();
      }
   };
}
export default new myClass();
