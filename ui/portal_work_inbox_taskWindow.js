import ClassUI from "./ClassUI.js";

class PortalWorkInboxTaskwindow extends ClassUI {
   constructor() {
      super();
      this.id = "portal_work_inbox_taskwindow";
      this.idTaskMultiview = "taskMultiview";
      this.idTaskTitle = "taskTitle";
      this.idTaskPager = "taskPager";
   }

   ui() {
      var L = (...params) => {
         return this.label(...params);
      };
      return {
         id: this.id,
         view: "window",
         position: function (state) {
            state.left = state.maxWidth / 2 - 800 / 2; // fixed values
            state.top = state.maxHeight / 2 - (state.maxHeight * 0.7) / 2;
            state.width = 800; // relative values
            state.height = state.maxHeight * 0.7;
         },
         modal: true,
         head: {
            view: "toolbar",
            css: "webix_dark",
            cols: [
               { width: 17 },
               {
                  id: this.idTaskTitle,
                  view: "label",
                  label: L("Your Tasks"),
               },
               {
                  view: "button",
                  autowidth: true,
                  type: "icon",
                  icon: "nomargin fa fa-times",
                  click: () => {
                     $$(this.id).hide();
                     // we don't want the list to look like it has still selected the item
                     $$(this.idTaskMultiview)
                        .getChildViews()[0]
                        .config.unitlist.unselectAll();
                     // reset the pager so we don't get errors when we open it next
                     $$(this.idTaskPager).select(0);
                  },
                  on: {
                     onAfterRender() {
                        ClassUI.CYPRESS_REF(this, "inbox_taskwindow_close");
                     },
                  },
               },
            ],
         },
         body: {
            rows: [
               {
                  view: "scrollview",
                  scroll: "xy",
                  body: {
                     id: this.idTaskMultiview,
                     cells: [
                        {
                           view: "layout",
                           padding: 20,
                           rows: [
                              {
                                 id: "emptyTasks",
                                 template: L("No more tasks...good job!"),
                              },
                           ],
                        },
                     ],
                  },
               },
               {
                  view: "toolbar",
                  css: "inboxpager",
                  cols: [
                     {
                        id: this.idTaskPager,
                        view: "pager",
                        size: 1,
                        group: 3,
                        height: 45,
                        master: false,
                        template:
                           '<div style="margin-top:9px; text-align: center;">{common.first()} {common.prev()} {common.pages()} {common.next()} {common.last()}</div>',
                        on: {
                           onAfterRender() {
                              // debugger;
                              ClassUI.CYPRESS_REF(this);
                              // this.data.each((a) => {
                              //    ClassUI.CYPRESS_REF(
                              //       this.getItemNode(a.id),
                              //       `${self.id}_${a.id}`
                              //    );
                              // });
                           },
                           onBeforePageChange: (new_page /*, old_page  */) => {
                              var views = $$(
                                 this.idTaskMultiview
                              ).getChildViews();
                              views[parseInt(new_page)].show();
                           },
                        },
                     },
                  ],
               },
            ],
         },
      };
   }

   init(AB) {
      this.AB = AB;
      webix.ui(this.ui());

      return Promise.resolve();
   }

   clearTask(uuid) {
      // find out how many pages are in this multiview
      var views = $$(this.idTaskMultiview).getChildViews();
      // if there is more than one page we need to find out what the next page should be
      if (views.length > 1) {
         var taskHolder = $$("task-holder-" + uuid);
         if (taskHolder) {
            // find out if we are on the last page
            if (
               $$(this.idTaskMultiview).index(taskHolder) + 1 ==
               views.length
            ) {
               // if we are on the last page we will go back to the previous page
               $$(this.idTaskMultiview).setValue(
                  views[$$(this.idTaskMultiview).index(taskHolder) - 1].config
                     .id
               );
            } else {
               // if we are not on the last page we will go to the next page
               $$(this.idTaskMultiview).setValue(
                  views[$$(this.idTaskMultiview).index(taskHolder) + 1].config
                     .id
               );
            }
            // once we move off of the page we can remove it
            $$(this.idTaskMultiview).removeView(
               views[$$(this.idTaskMultiview).index(taskHolder)]
            );
         }

         // // prune the item from the group of similar processes in the unit list
         // if (this.selectedItem) {
         //    this.selectedItem.items = this.selectedItem.items.filter(function (
         //       i
         //    ) {
         //       return i.uuid != uuid;
         //    });
         // }
         // // refresh the unit list so we can get an update badge count
         // this.list.refresh();

         // now we update the pager
         // block events because we don't want it telling the multiview to change pages after we set the new value
         $$(this.idTaskPager).blockEvent();
         // set the page to the first while we rebuild the pager (or it will throw an error)
         $$(this.idTaskPager).select(0);
         // set the current number of pages to the number of views in the multiview
         $$(this.idTaskPager).define(
            "count",
            $$(this.idTaskMultiview).getChildViews().length
         );
         $$(this.idTaskPager).refresh();
         // set the page to the correct number because it probably changed when we removed a view above
         $$(this.idTaskPager).select(
            $$(this.idTaskMultiview).index(
               $$(this.idTaskMultiview).getActiveId()
            )
         );
         $$(this.idTaskPager).unblockEvent();
      } else {
         // no more tasks hide the modal
         $$(this.id).hide();
         // // remove the item from the unit list
         // this.list.remove(this.list.getSelectedId());
         // // if that was the last item in the unit list remove the accordion
         // if (this.list.count() == 0) {
         //    parent.hide();
         // }
      }
   }

   hide() {
      $$(this.id).hide();
   }

   show() {
      $$(this.id).show();
   }

   showTasks(/* unitList, */ selectedItemName, cells) {
      // this.list = unitList;
      // this.selectedItem = selectedItem;
      webix.ui(
         {
            id: this.idTaskMultiview,
            cells: cells,
         },
         $$(this.idTaskMultiview)
      );

      $$(this.idTaskTitle).define("label", selectedItemName);
      $$(this.idTaskPager).define("count", cells.length);
      $$(this.idTaskPager).refresh();
      $$(this.id).show();
   }
}

export default new PortalWorkInboxTaskwindow();
