const ABViewComponent = require("./ABViewComponent").default;

const L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABViewCommentComponent extends ABViewComponent {
   constructor(baseView, idBase) {
      idBase = idBase ?? `ABViewComment_${baseView.id}`;

      super(baseView, idBase, {});

      this.view = baseView;
      this.AB = this.view.AB;
   }

   ui() {
      const ids = this.ids;
      const baseView = this.view;
      const userList = baseView.getUserData();
      const userId = baseView.getCurrentUserId();
      const _ui = {
         id: ids.component,
         view: "comments",
         users: userList,
         currentUser: userId,
         height: baseView.settings.height,
         data: this.getCommentData(),
         on: {
            onBeforeAdd: (id, obj, index) => {
               this.addComment(obj.text, new Date());
            },
            // NOTE: no update event of comment widget !!
            // Updating event handles in .init function
            // https://docs.webix.com/api__ui.comments_onbeforeeditstart_event.html#comment-4509366150

            // onAfterEditStart: function (rowId) {
            // 	let item = this.getItem(rowId);

            // 	_logic.updateComment(rowId, item);
            // },
            onAfterDelete: (rowId) => {
               this.deleteComment(rowId);
            },
         },
      };

      return _ui;
   }

   async init(AB) {
      this.AB = AB;

      const baseView = this.view;

      baseView.__dvEvents = baseView.__dvEvents || {};

      const ids = this.ids;
      const $comment = $$(ids.component);

      if ($comment) {
         const $commentList = $comment.queryView({ view: "list" });

         if ($commentList) {
            // Updating comment event
            if (!baseView.__dvEvents.onStoreUpdated)
               baseView.__dvEvents.onStoreUpdated = $commentList.data.attachEvent(
                  "onStoreUpdated",
                  (rowId, data, operate) => {
                     if (operate == "update") {
                        this.updateComment(rowId, (data || {}).text);
                     }
                  }
               );

            // Implement progress bar
            webix.extend($commentList, webix.ProgressBar);
         }
      }

      const dv = baseView.datacollection;

      if (!dv) return;

      // bind dc to component
      // dv.bind($$(ids.component));

      if (!baseView.__dvEvents.create)
         baseView.__dvEvents.create = dv.on("create", () =>
            this.refreshComment()
         );

      if (!baseView.__dvEvents.update)
         baseView.__dvEvents.update = dv.on("update", () =>
            this.refreshComment()
         );

      if (!baseView.__dvEvents.delete)
         baseView.__dvEvents.delete = dv.on("delete", () =>
            this.refreshComment()
         );

      if (!baseView.__dvEvents.loadData)
         baseView.__dvEvents.loadData = dv.on("loadData", () =>
            this.refreshComment()
         );
   }

   getCommentData() {
      const baseView = this.view;
      const dv = baseView.datacollection;

      if (!dv) return null;

      const userCol = baseView.getUserField();
      const commentCol = baseView.getCommentField();
      const dateCol = baseView.getDateField();

      if (!userCol || !commentCol) return null;

      const userColName = userCol.columnName;
      const commentColName = commentCol.columnName;
      const dateColName = dateCol ? dateCol.columnName : null;
      const dataObject = dv.getData();
      const dataList = [];

      dataObject.forEach((item, index) => {
         if (item[commentColName]) {
            const user = baseView.getUserData().find((user) => {
               return user.value == item[userColName];
            });
            const data = {
               id: item.id,
               user_id: user ? user.id : 0,
               date: item[dateColName] ? new Date(item[dateColName]) : null,
               default_date: new Date(item["created_at"]),
               text: item[commentColName],
            };

            dataList.push(data);
         }
      });

      dataList.sort(function (a, b) {
         if (dateColName) {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
         } else {
            return (
               new Date(a.default_date).getTime() -
               new Date(b.default_date).getTime()
            );
         }
      });

      return dataList;
   }

   refreshComment() {
      const baseView = this.view;

      if (baseView.__refreshTimeout) clearTimeout(baseView.__refreshTimeout);

      this.busy();

      const ids = this.ids;

      baseView.__refreshTimeout = setTimeout(() => {
         const $component = $$(ids.component) ?? null;

         if (!$component) return;

         // clear comments
         const $commentList = $component.queryView({ view: "list" }) ?? null;

         if ($commentList) $commentList.clearAll();

         // populate comments
         const commentData = this.getCommentData();

         if (commentData) {
            $component.parse(commentData);
         }

         // scroll to the last item
         if ($commentList) $commentList.scrollTo(0, Number.MAX_SAFE_INTEGER);

         delete baseView.__refreshTimeout;

         this.ready();
      }, 90);
   }

   addComment(commentText, dateTime) {
      this.saveData(commentText, dateTime);
   }

   async updateComment(rowId, commentText) {
      const baseView = this.view;
      const model = baseView.model() ?? null;

      if (!model) return; // already notified

      const commentField = baseView.getCommentField();

      if (!commentField); // already notified

      const values = {};

      values[commentField.columnName] = commentText || "";

      return await model.update(rowId, values);
   }

   async deleteComment(rowId) {
      const baseView = this.view;
      const model = baseView.model() ?? null;

      if (!model) return;

      return await model.delete(rowId);
   }

   busy() {
      const ids = this.ids;
      const $component = $$(ids.component) ?? null;

      if (!$component) return;

      const $commentList = $component.queryView({ view: "list" }) ?? null;

      if (!$commentList) return;

      $commentList.disable();

      if ($commentList.showProgress)
         $commentList.showProgress({ type: "icon" });
   }

   ready() {
      const ids = this.ids;
      const $component = $$(ids.component) ?? null;

      if (!$component) return;

      const $commentList = $component.queryView({ view: "list" }) ?? null;

      if (!$commentList) return;

      $commentList.enable();

      if ($commentList.hideProgress) $commentList.hideProgress();
   }

   async saveData(commentText, dateTime) {
      if (!commentText) return;

      const baseView = this.view;
      const dv = baseView.datacollection;

      if (!dv) return;

      const model = baseView.model();

      if (!model) {
         this.AB.notify.builder(
            {},
            {
               message:
                  "ABViewComment.saveData(): could not pull a model to work with.",
               viewName: baseView.label,
            }
         );

         return;
      }

      const comment = {};
      const userField = baseView.getUserField();

      if (userField) comment[userField.columnName] = this.AB.Account.username();

      const commentField = baseView.getCommentField();

      if (commentField) comment[commentField.columnName] = commentText;

      const dateField = baseView.getDateField();

      if (dateField) comment[dateField.columnName] = dateTime;

      // add parent cursor to default
      const dvLink = dv.datacollectionLink;

      if (dvLink && dvLink.getCursor()) {
         const objectLink = dvLink.datasource;
         const fieldLink = dv.fieldLink;

         if (objectLink && fieldLink) {
            comment[fieldLink.columnName] = {};
            comment[fieldLink.columnName][
               objectLink.PK()
            ] = dvLink.getCursor().id;
         }
      }

      return await model.create(comment);
   }

   onShow(viewId) {
      const ids = this.ids;

      const baseView = this.view;

      super.onShow(viewId);
   }
};
