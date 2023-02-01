const ABViewComponent = require("./ABViewComponent").default;

module.exports = class ABViewCommentComponent extends ABViewComponent {
   constructor(baseView, idBase, ids) {
      super(
         baseView,
         idBase || `ABViewComment_${baseView.id}`,
         Object.assign(
            {
               comment: "",
            },
            ids
         )
      );
   }

   ui() {
      const baseView = this.view;
      const _ui = super.ui([
         {
            id: this.ids.comment,
            view: "comments",
            users: baseView.getUserData(),
            currentUser: baseView.getCurrentUserId(),
            height: this.settings.height,
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
         },
      ]);

      delete _ui.type;

      return _ui;
   }

   async init(AB) {
      await super.init(AB);

      const baseView = this.view;

      baseView.__dvEvents = baseView.__dvEvents || {};

      const ids = this.ids;
      const $comment = $$(ids.comment);

      if ($comment) {
         const $commentList = $comment.queryView({ view: "list" });

         if ($commentList) {
            // Updating comment event
            if (!baseView.__dvEvents.onStoreUpdated)
               baseView.__dvEvents.onStoreUpdated =
                  $commentList.data.attachEvent(
                     "onStoreUpdated",
                     (rowId, data, operate) => {
                        if (operate === "update") {
                           this.updateComment(rowId, (data || {}).text);
                        }
                     }
                  );

            // Implement progress bar
            webix.extend($commentList, webix.ProgressBar);
         }
      }

      const dv = this.datacollection;

      if (!dv) return;

      // bind dc to component
      // dv.bind($$(ids.comment));

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
      const dv = this.datacollection;

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
               return user.value === item[userColName];
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
         if (dateColName)
            return new Date(a.date).getTime() - new Date(b.date).getTime();
         else
            return (
               new Date(a.default_date).getTime() -
               new Date(b.default_date).getTime()
            );
      });

      return dataList;
   }

   refreshComment() {
      const baseView = this.view;

      if (baseView.__refreshTimeout) clearTimeout(baseView.__refreshTimeout);

      this.busy();

      const ids = this.ids;

      baseView.__refreshTimeout = setTimeout(() => {
         const $comment = $$(ids.comment);

         if (!$comment) return;

         // clear comments
         const $commentList = $comment.queryView({ view: "list" });

         if ($commentList) $commentList.clearAll();

         // populate comments
         const commentData = this.getCommentData();

         if (commentData) {
            $comment.parse(commentData);
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
      const model = baseView.model();

      if (!model) return; // already notified

      const commentField = baseView.getCommentField();

      if (!commentField) return; // already notified

      const values = {};

      values[commentField.columnName] = commentText ?? "";

      return await model.update(rowId, values);
   }

   async deleteComment(rowId) {
      const baseView = this.view;
      const model = baseView.model();

      if (!model) return;

      return await model.delete(rowId);
   }

   busy() {
      const ids = this.ids;
      const $comment = $$(ids.comment);

      if (!$comment) return;

      const $commentList = $comment.queryView({ view: "list" });

      if (!$commentList) return;

      $commentList.disable();

      if ($commentList.showProgress)
         $commentList.showProgress({ type: "icon" });
   }

   ready() {
      const ids = this.ids;
      const $comment = $$(ids.comment);

      if (!$comment) return;

      const $commentList = $comment.queryView({ view: "list" });

      if (!$commentList) return;

      $commentList.enable();

      if ($commentList.hideProgress) $commentList.hideProgress();
   }

   async saveData(commentText, dateTime) {
      if (!commentText) return;

      const dv = this.datacollection;

      if (!dv) return;

      const baseView = this.view;
      const model = baseView.model();
      const ab = this.AB;

      if (!model) {
         ab.notify.builder(
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

      if (userField) comment[userField.columnName] = ab.Account.username();

      const commentField = baseView.getCommentField();

      if (commentField) comment[commentField.columnName] = commentText;

      const dateField = baseView.getDateField();

      if (dateField) comment[dateField.columnName] = dateTime;

      // add parent cursor to default
      const dvLink = dv.datacollectionLink;

      if (dvLink?.getCursor()) {
         const objectLink = dvLink.datasource;
         const fieldLink = dv.fieldLink;

         if (objectLink && fieldLink) {
            comment[fieldLink.columnName] = {};
            comment[fieldLink.columnName][objectLink.PK()] =
               dvLink.getCursor().id;
         }
      }

      return await model.create(comment);
   }

   onShow(viewId) {
      super.onShow(viewId);
   }
};
