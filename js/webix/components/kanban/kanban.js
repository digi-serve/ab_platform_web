/**
 * @license
 * Webix Kanban v.7.2.0
 * This software is covered by Webix Commercial License.
 * Usage without proper license is prohibited.
 * (c) XB Software Ltd.
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, (function () { 'use strict';

  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  webix.protoUI({
    name: "kanbanheader",
    $kanban: true,
    $skin: function () {
      this.defaults.height = webix.skin.$active.barHeight;
      this._template_types.sub.height = webix.skin.$active.barHeight - 12;
    },
    $init: function (config) {
      var subtype = this._template_types[config.type];
      if (subtype) webix.extend(config, subtype);
    },
    defaults: {
      css: "webix_kanban_header",
      borderless: true,
      template: function () {
        var icon = this.icon || (this.link ? "webix_kanban_icon kbi-plus-circle" : "");
        return (icon ? "<span class='webix_icon " + (this.link ? "webix_kanban_add_icon " : "") + icon + "'></span>" : "") + "<span class='webix_strong' style='line-height:" + this.height + "px'>" + (this.label || "") + "</span>";
      }
    },
    _template_types: {
      "sub": {
        css: "webix_kanban_sub_header"
      }
    },
    on_click: {
      "webix_kanban_add_icon": function () {
        var obj = {
          text: ""
        };
        var kanban = this.getKanban();
        var list = kanban.queryView({
          id: this.config.link
        });

        if (list && this.callEvent("onBeforeCardAdd", [obj, list])) {
          kanban.setListStatus(obj, list);
          kanban.add(obj);
        }
      }
    },
    getKanban: function () {
      return webix.$$(this.config.master);
    }
  }, webix.MouseEvents, webix.ui.template);

  var images = {
    jpg: true,
    jpeg: true,
    png: true,
    gif: true
  };
  var icons = {
    ppt: "-powerpoint",
    pptx: "-powerpoint",
    pptm: "-powerpoint",
    pps: "-powerpoint",
    ppsx: "-powerpoint",
    ppsm: "-powerpoint",
    doc: "-word",
    docx: "-word",
    docm: "-word",
    xls: "-excel",
    xlsx: "-excel",
    xlsm: "-excel",
    xlsb: "-excel",
    pdf: "-pdf",
    wav: "-audio",
    aif: "-audio",
    mp3: "-audio",
    mid: "-audio",
    mpg: "-video",
    mov: "-video",
    wmv: "-video",
    avi: "-video",
    mp4: "-video",
    zip: "-archive",
    jar: "-archive",
    rar: "-archive",
    gz: "-archive",
    jpg: "-image",
    jpeg: "-image",
    png: "-image",
    gif: "-image"
  };
  function isImage(key) {
    return images[key.toString().toLowerCase()];
  }
  function getIconName(key) {
    return icons[key.toString().toLowerCase()] || "";
  }

  var type = {
    height: "auto",
    icons: [{
      id: "attachments",
      icon: "webix_kanban_icon kbi-file",
      show: function (obj) {
        return obj.attachments ? obj.attachments.length : false;
      },
      template: "#attachments.length#"
    }, {
      id: "comments",
      icon: "webix_kanban_icon kbi-comment",
      show: function (obj, kanban) {
        return !!kanban.config.comments;
      },
      template: function (obj) {
        return obj.comments ? obj.comments.length || "" : "";
      }
    }, {
      id: "editor",
      icon: "webix_kanban_icon kbi-pencil",
      show: function (obj, kanban) {
        return kanban.config.editor && !kanban.config.cardActions;
      }
    }, {
      id: "menu",
      icon: "webix_kanban_icon kbi-cogs",
      show: function (obj, kanban) {
        return !!kanban.config.cardActions;
      }
    }],
    templateTags: function (obj, common, kanban) {
      var res = [];

      if (obj.tags) {
        var tags = kanban._tags;

        for (var i = 0; i < obj.tags.length; i++) {
          var tag = obj.tags[i];
          if (tags.exists(tag)) tag = tags.getItem(tag).value;
          res.push("<span class='webix_kanban_tag'>" + tag + "</span>");
        }
      }

      return "<div  class='webix_kanban_tags'>" + (res.length ? res.join("") : "&nbsp;") + "</div>";
    },
    templateIcons: function (obj, common, kanban) {
      var icons = [];
      var icon = null;
      var html = "";

      for (var i = 0; i < common.icons.length; i++) {
        icon = common.icons[i];

        if (!icon.show || icon.show(obj, kanban)) {
          html = "<span webix_icon_id='" + (icon.id || icon.icon || icon) + "' class='webix_kanban_footer_icon' title='" + (icon.tooltip || "") + "'>";
          html += "<span class='" + (icon.icon || icon) + " webix_icon'></span>";

          if (icon.template) {
            html += "<span class='webix_kanban_icon_text'>" + webix.template(icon.template)(obj) + "</span>";
          }

          html += "</span>";
          icons.push(html);
        }
      }

      return "<div  class='webix_kanban_footer_icons'>" + icons.join(" ") + "</div>";
    },
    templateAvatar: function (obj, common, kanban) {
      var users = kanban._users;
      var user = obj.user_id && users.exists(obj.user_id) ? users.getItem(obj.user_id) : {};
      if (user.image) return "<img class='webix_kanban_avatar' src='" + user.image + "' title='" + (user.value || "") + "'>";
      return "<span class='webix_icon webix_kanban_icon kbi-account' title='" + (user.value || "") + "'></span>";
    },
    templateBody: function (obj) {
      return obj.text;
    },
    templateAttachments: function (obj) {
      if (obj.attachments) {
        for (var i in obj.attachments) {
          var v = obj.attachments[i];

          var _type = v.link.split(".").pop();

          if (isImage(_type)) return "<img class='webix_kanban_attachment' src='" + v.link + "'/>";
        }
      }

      return "";
    },
    templateFooter: function (obj, common, kanban) {
      var tags = common.templateTags(obj, common, kanban);
      return (tags ? tags : "&nbsp;") + common.templateIcons(obj, common, kanban);
    },
    templateStart: webix.template("<div webix_l_id='#id#' class='{common.classname()} webix_kanban_list_item' style='width:{common.width}px; height:{common.height}px;'>"),
    template: function (obj, common) {
      var kanban = webix.$$(common.master);
      var color = kanban._colors.exists(obj.color) ? kanban._colors.getItem(obj.color).color : obj.color;
      var avatar = "<div class='webix_kanban_user_avatar' webix_icon_id='$avatar'>" + common.templateAvatar(obj, common, kanban) + "</div>";
      var body = "<div class='webix_kanban_body'>" + common.templateBody(obj, common, kanban) + avatar + "</div>";
      var attachments = kanban.config.attachments ? common.templateAttachments(obj, common, kanban) : "";
      var footer = "<div class='webix_kanban_footer'>" + common.templateFooter(obj, common, kanban) + "</div>";
      return "<div class='webix_kanban_list_content'" + (color ? " style='border-left-color:" + color + "'" : "") + ">" + attachments + body + footer + "</div>";
    }
  };
  webix.KanbanView = {
    $kanban: true,
    on_context: {},
    $skin: function () {// prevent default list's item skin height
    },
    getKanban: function () {
      return webix.$$(this.config.master);
    },
    _kanban_event: function (s, t, i) {
      this.attachEvent(s, function () {
        for (var _len = arguments.length, rest = new Array(_len), _key = 0; _key < _len; _key++) {
          rest[_key] = arguments[_key];
        }

        rest[i] = this;
        return this.getKanban().callEvent(t, rest);
      });
    },
    _fixOrder: function () {
      this.data.each(function (a, i) {
        return a.$index = i + 1;
      });
    },
    move: function (sid, tindex, tobj, details) {
      tobj = tobj || this;
      details = details || {}; // normally only one item is dragged
      // still, it possible to enable multi-selection through API

      if (webix.isArray(sid)) {
        return webix.DataMove.move.call(this, sid, tindex, tobj, details);
      }

      var statusChange = tobj !== this;
      var kanban = this.getKanban();
      var item = kanban.getItem(sid);
      var dp = webix.dp.$$(kanban.config.id);

      if (statusChange) {
        if (!kanban.callEvent("onBeforeStatusChange", [sid, tobj.config.status, tobj])) return;
        kanban.setListStatus(item, tobj);

        if (dp) {
          dp.ignore(function () {
            return kanban.updateItem(sid);
          });
        } else kanban.updateItem(sid);
      }

      item.$index = tindex - 0.1;

      this._fixOrder();

      tobj._fixOrder();

      webix.DataMove.move.call(tobj, sid, tindex); // trigger data saving

      if (dp) {
        var update = webix.copy(item);
        update.webix_move_index = tindex;
        update.webix_move_id = tobj.data.order[tindex + 1]; // we need to identify the target list on server side
        // when we have a complex status ( object or function )
        // use separate property

        update.webix_move_parent = tobj.config.serverStatus || tobj.config.status;
        dp.save(sid, "update", update);
      }

      if (statusChange) kanban.callEvent("onAfterStatusChange", [sid, tobj.config.status, tobj]);
      return sid;
    },
    _setHandlers: function () {
      this.attachEvent("onAfterSelect", function () {
        this.eachOtherList(function (list) {
          list.unselect();
        });
      });

      this._kanban_event("onBeforeSelect", "onListBeforeSelect", 2);

      this._kanban_event("onAfterSelect", "onListAfterSelect", 1);

      this._kanban_event("onBeforeContextMenu", "onListBeforeContextMenu", 3);

      this._kanban_event("onAfterContextMenu", "onListAfterContextMenu", 3);

      this._kanban_event("onItemClick", "onListItemClick", 3);

      this._kanban_event("onItemDblClick", "onListItemDblClick", 3);

      this._kanban_event("onBeforeDrag", "onListBeforeDrag", 2);

      this._kanban_event("onBeforeDrop", "onListBeforeDrop", 2);

      this._kanban_event("onAfterDrop", "onListAfterDrop", 2);

      this._kanban_event("onBeforeDragIn", "onListBeforeDragIn", 2);

      this._kanban_event("onDragOut", "onListDragOut", 2);

      this.on_click.webix_kanban_user_avatar = this._handle_icons;
      this.on_click.webix_kanban_footer_icon = this._handle_icons;
    },
    _handle_icons: function (e, id, node) {
      var icon = node.getAttribute("webix_icon_id");
      var all = this.type.icons; //per-icon click handlers

      if (all) {
        for (var i = 0; i < all.length; i++) {
          if (_typeof(all[i]) === "object" && (all[i].id || all[i].icon) === icon) {
            if (all[i].click) {
              all[i].click.call(this, id, e, node, this);
            }
          }
        }
      }

      if (icon === "$avatar") this.getKanban().callEvent("onAvatarClick", [id, e, node, this]);else this.getKanban().callEvent("onListIconClick", [icon, id, e, node, this]);
    },
    $dragCreate: function (a, e) {
      var text = webix.DragControl.$drag(a, e);
      if (!text) return false;
      var drag_container = document.createElement("DIV");
      drag_container.innerHTML = text;
      drag_container.className = "webix_drag_zone webix_kanban_drag_zone";
      document.body.appendChild(drag_container);
      return drag_container;
    },
    $dropHTML: function () {
      return "<div class='webix_kanban_drop_inner'></div>";
    },
    eachOtherList: function (code) {
      var self = this.config.id;
      var master = this.getKanban();
      master.eachList(function (view) {
        if (view.config.id != self) code.call(webix.$$(self), view);
      });
    },
    defaults: {
      drag: "move",
      select: true
    }
  };

  webix.protoUI({
    name: "kanbanlist",
    $init: function () {
      this.$view.className += " webix_kanban_list";
      this.$ready.push(webix.bind(this._setHandlers, this));
    },
    defaults: {
      scroll: "auto"
    },
    type: type
  }, webix.ui.list, webix.KanbanView);

  var dtype = webix.copy(type);
  dtype.width = 200;
  webix.protoUI({
    name: "kanbandataview",
    $init: function () {
      this.$view.className += " webix_kanban_list";
      this.$ready.push(webix.bind(this._setHandlers, this));
    },
    defaults: {
      prerender: true
    },
    type: dtype
  }, webix.ui.dataview, webix.KanbanView);

  webix.protoUI({
    name: "kanbanuploader",
    $init: function () {
      var _this = this;

      this.files.data.scheme({
        $init: function (obj) {
          if (typeof obj.link === "string" && obj.link) {
            obj.name = obj.name || obj.link.split("/").pop();
            obj.type = obj.type || obj.name.split(".").pop();
            obj.status = obj.status || "server";
          }

          obj.sizetext = obj.sizetext || _this._format_size(obj.size);
        }
      });
      this.files.data.attachEvent("onStoreUpdated", function () {
        var view = webix.$$(_this.config.link);
        var html = "<span class='webix_strong'>" + (webix.i18n.kanban.dnd || "") + "</span>";
        if (!_this.files.data.count()) view.showOverlay(html);else view.hideOverlay();
      });
    },
    defaults: {
      icon: "webix_kanban_icon kbi-upload"
    },
    getValue: function () {
      var data = [];
      this.files.data.each(function (obj) {
        if (obj.status === "server") data.push({
          id: obj.id,
          link: obj.link,
          size: obj.size
        });
      });
      return data;
    },
    _format_size: function (size) {
      var index = 0;

      while (size > 1024) {
        index++;
        size = size / 1024;
      }

      return Math.round(size * 100) / 100 + " " + webix.i18n.fileSize[index];
    }
  }, webix.ui.uploader);
  webix.type(webix.ui.dataview, {
    name: "uploader",
    height: 91,
    width: 161,
    template: function (obj, common) {
      return "<a".concat(obj.status === "server" ? " href=\"".concat(obj.link, "\" download=\"").concat(obj.name, "\"") : "", "></a>\n\t\t\t\t").concat(common.body(obj), "\n\t\t\t\t").concat(common.title(obj, common), "\n\t\t\t\t").concat(common.removeIcon(obj));
    },
    body: function (obj) {
      if (obj.status === "server" && isImage(obj.type)) return "<div class=\"webix_kanban_uploader_body\"><img src=\"".concat(obj.link, "\"></div>");
      return "<div class='webix_kanban_uploader_body'>\n\t\t\t\t\t<span class='webix_icon webix_kanban_icon kbi-file".concat(getIconName(obj.type), "'></span>\n\t\t\t\t</div>");
    },
    title: function (obj, common) {
      return "<div class=\"webix_kanban_uploader_title\" title=\"".concat(obj.name, "\">\n\t\t\t\t\t").concat(common.progress(obj), "\n\t\t\t\t\t<div class=\"webix_kanban_uploader_label\">").concat(obj.name, "</div>\n\t\t\t\t</div>");
    },
    progress: function (obj) {
      switch (obj.status) {
        case "client":
          return "<span class='webix_kanban_uploader_progress'>" + obj.sizetext + "</span>";

        case "transfer":
          return "<span class='webix_kanban_uploader_progress'>" + obj.percent + "%</span>";

        case "server":
          return "<span class='webix_kanban_uploader_progress_server'>" + obj.sizetext + "</span>";

        default:
          return "<span class='webix_kanban_uploader_progress_error'>ERROR</span>";
      }
    },
    removeIcon: function () {
      return "<div class='webix_kanban_remove_upload'><span class='webix_icon wxi-close'></span></div>";
    },
    on_click: {
      "webix_kanban_remove_upload": function (ev, id) {
        webix.$$(this.config.uploader).files.remove(id);
        return webix.html.preventEvent(ev);
      }
    }
  });

  var en = {
    "copy": "Copy",
    "dnd": "Drop Files Here",
    "remove": "Remove",
    "save": "Save",
    "confirm": "The card will be deleted permanently, are you sure?",
    "editor": {
      "add": "Add card",
      "assign": "Assign to",
      "attachments": "Attachments",
      "color": "Color",
      "edit": "Edit card",
      "status": "Status",
      "tags": "Tags",
      "text": "Text",
      "upload": "Upload"
    },
    "menu": {
      "copy": "Copy",
      "edit": "Edit",
      "remove": "Remove"
    }
  };

  webix.i18n.kanban = en;

  webix.protoUI({
    name: "kanbaneditor",
    defaults: {
      width: 534,
      position: "center",
      css: "webix_kanban_editor",
      modal: true,
      move: true
    },
    $init: function (config) {
      var _this = this;

      var kanban = webix.$$(config.master);
      config.head = {
        view: "toolbar",
        paddingX: 17,
        paddingY: 8,
        elements: [{
          view: "label",
          label: webix.i18n.kanban.editor.add,
          localId: "$kanban_header"
        }, {
          view: "icon",
          icon: "wxi-close",
          click: function () {
            return _this._close();
          }
        }]
      };
      var c = kanban.config.editor;
      var form = {
        view: "form",
        borderless: true,
        padding: 0,
        elementsConfig: {
          labelPosition: "top"
        }
      };
      var elements = [{
        view: "textarea",
        label: webix.i18n.kanban.editor.text,
        name: "text",
        height: 90
      }, {
        view: "multicombo",
        label: webix.i18n.kanban.editor.tags,
        name: "tags",
        options: kanban._tags,
        $hide: true
      }, {
        margin: 8,
        cols: [{
          view: "combo",
          label: webix.i18n.kanban.editor.assign,
          name: "user_id",
          $hide: true,
          options: {
            body: {
              data: kanban._users,
              yCount: 5
            }
          }
        }, {
          view: "richselect",
          label: webix.i18n.kanban.editor.color,
          name: "color",
          $hide: true,
          options: {
            body: {
              yCount: 5,
              data: kanban._colors,
              css: "webix_kanban_colorpicker",
              template: "<span class='webix_kanban_color_item' style='background-color: #color#'></span>#value#"
            }
          }
        }, {
          view: "richselect",
          label: webix.i18n.kanban.editor.status,
          name: "$list",
          options: {
            body: {
              data: kanban._statuses,
              yCount: 5
            }
          }
        }]
      }];
      if (webix.isArray(c)) form.elements = c;else if (_typeof(c) === "object") {
        form = webix.extend(form, c, true);
        form.view = "form";
        form.elements = form.elements || form.rows || (form.cols ? [{
          cols: form.cols
        }] : elements);
        delete form.rows;
        delete form.cols;
      } else form.elements = elements;
      if (kanban.config.attachments) form.elements.push({
        margin: 0,
        rows: [{
          cols: [{
            view: "label",
            label: webix.i18n.kanban.editor.attachments
          }, {
            view: "kanbanuploader",
            label: webix.i18n.kanban.editor.upload,
            upload: kanban.config.attachments,
            name: "attachments",
            autowidth: true,
            css: "webix_transparent webix_kanban_uploader",
            type: "icon"
          }]
        }, {
          view: "dataview",
          localId: "$kanban_dataview_uploader",
          yCount: 1,
          borderless: true,
          type: "uploader",
          css: "webix_kanban_dataview_uploader",
          on: {
            onItemDblClick: function (id, e, node) {
              var link = node.getElementsByTagName("a")[0];
              link.click();
            }
          }
        }]
      });
      config.body = {
        paddingX: 17,
        paddingY: 0,
        margin: 16,
        rows: [form, {
          cols: [{
            view: "button",
            label: webix.i18n.kanban.remove,
            type: "danger",
            autowidth: true,
            hidden: true,
            localId: "$kanban_remove",
            click: function () {
              var values = _this.getValues({
                hidden: false
              });

              var kanban = _this.getKanban();

              if (!kanban.callEvent("onBeforeEditorAction", ["remove", _this, values])) return;

              kanban._removeCard(values.id).then(function () {
                return _this._close();
              });
            }
          }, {}, {
            view: "button",
            label: webix.i18n.kanban.save,
            type: "form",
            autowidth: true,
            click: function () {
              var values = _this.getValues({
                hidden: false
              });

              var kanban = _this.getKanban();

              if (!kanban.callEvent("onBeforeEditorAction", ["save", _this, values])) return;

              _this._fixStatus(values, kanban);

              if (kanban.exists(values.id)) {
                values.$list = kanban.getItem(values.id).$list;
                kanban.updateItem(values.id, values);
              } else kanban.add(values);

              _this._close();
            }
          }]
        }, {
          height: 1
        }]
      };
      this.$ready.push(this._afterInit);
    },
    _afterInit: function () {
      this._form = this.queryView({
        view: "form"
      });
      this._removeBtn = this.queryView({
        localId: "$kanban_remove"
      });
      this._header = this.queryView({
        localId: "$kanban_header"
      });
      var uploader = this.queryView({
        view: "kanbanuploader"
      });

      if (uploader) {
        var dataview = this.queryView({
          localId: "$kanban_dataview_uploader"
        });
        uploader.define("link", dataview.config.id);
        uploader.addDropZone(dataview.$view);
        webix.extend(dataview, webix.OverlayBox);
      }

      var views = this.queryView({
        $hide: true
      }, "all");
      if (views.length) this.attachEvent("onShow", function () {
        for (var i = 0; i < views.length; i++) {
          if (views[i].getList().count()) views[i].show();else views[i].hide();
        }
      });
    },
    _fixStatus: function (values, kanban) {
      values.$list = Number(values.$list) || 0;
      if (kanban._sublists[values.$list]) kanban.setListStatus(values, kanban._sublists[values.$list]);
    },
    getForm: function () {
      return this._form;
    },
    getKanban: function () {
      return webix.$$(this.config.master);
    },
    setValues: function (values) {
      if (_typeof(values) !== "object" || !values) values = {};
      var kanban = this.getKanban();

      var listIndex = kanban._assignList(values);

      values.$list = values.$list || (listIndex !== -1 ? listIndex : 0);

      this._prepareEditor(kanban, values.id);

      this._form.setValues(values);
    },
    getValues: function (details) {
      return this._form.getValues(details);
    },
    _prepareEditor: function (kanban, id) {
      if (id && kanban.exists(id)) {
        this._removeBtn.show();

        this._header.define("label", webix.i18n.kanban.editor.edit);
      } else {
        this._removeBtn.hide();

        this._header.define("label", webix.i18n.kanban.editor.add);
      }

      this._header.refresh();
    },
    _close: function () {
      this.hide();

      this._form.clear();

      this._prepareEditor();
    }
  }, webix.ui.window);

  webix.protoUI({
    name: "kanbanuserlist",
    defaults: {
      width: 300,
      layout: "y",
      scroll: true,
      yCount: 4,
      autoheight: false,
      select: true,
      template: function (obj) {
        if (obj.image) return "<img class='webix_kanban_list_avatar' src='" + obj.image + "'>" + obj.value;
        return "<span class='webix_icon webix_kanban_icon kbi-account webix_kanban_list_avatar'></span>" + obj.value;
      }
    },
    $init: function () {
      this.$ready.push(function () {
        var _this = this;

        this.attachEvent("onShow", function () {
          var user_id = _this.getContext().user_id;

          if (user_id && _this.exists(user_id)) {
            _this.select(user_id);

            _this.showItem(user_id);
          } else _this.unselectAll();
        });
        this.attachEvent("onMenuItemClick", function (id) {
          var kanban = _this.getKanban();

          var selectedTask = _this.getContext().id;

          kanban.updateItem(selectedTask, {
            user_id: id
          });
        });
        this.type.master = this.config.masterId;
      });
    },
    getKanban: function () {
      return webix.$$(this.config.masterId);
    }
  }, webix.ui.contextmenu);

  webix.protoUI({
    name: "kanbanmenu",
    $init: function () {
      this.$ready.push(function () {
        this.attachEvent("onItemClick", function (id) {
          var cid = this.getContext().id;
          var kanban = this.getKanban();

          if (kanban.callEvent("onBeforeCardAction", [id, cid])) {
            switch (id) {
              case "edit":
                kanban.showEditor(webix.copy(kanban.getItem(cid)));
                break;

              case "copy":
                kanban.copy(cid);
                break;

              case "remove":
                kanban._removeCard(cid);

                break;
            }
          }
        });
      });
    },
    getKanban: function () {
      return webix.$$(this.config.masterId);
    }
  }, webix.ui.contextmenu);

  webix.protoUI({
    name: "kanbanchat",
    $init: function (config) {
      config.padding = 0;
      this.$ready.push(function () {
        var _this = this;

        this.attachEvent("onHide", this._hide_chat);
        var list = this.queryView({
          view: "list"
        });
        list.data.attachEvent("onStoreUpdated", function (id, obj, mode) {
          if (mode && mode !== "paint") _this._save();
        });
      });
    },
    _save: function () {
      var context = this.getContext();
      var comments = this.getBody();
      var kanban = this.getKanban();
      if (context && kanban.exists(context.id)) kanban.updateItem(context.id, {
        comments: comments.serialize()
      });
    },
    _hide_chat: function () {
      var comments = this.getBody();
      comments.queryView({
        view: "form"
      }).clear();
      comments.queryView({
        view: "list"
      }).clearAll();
    },
    getKanban: function () {
      return webix.$$(this.config.masterId);
    }
  }, webix.ui.context);

  function defaultSetter(a, sub) {
    var status = sub.config.status;

    if (_typeof(status) === "object") {
      for (var key in status) {
        a[key] = status[key];
      }
    } else if (typeof status === "function") {
      status.call(sub, a, true);
    } else {
      a.status = status;
    }
  }

  function defaultFilter(sub) {
    var status = sub.config.status;
    if (_typeof(status) === "object") return function (a) {
      for (var key in status) {
        if (a[key] != status[key]) return false;
      }

      return true;
    };
    if (typeof status === "function") return function (a) {
      return status.call(sub, a);
    };
    return function (a) {
      return a.status === status;
    };
  }

  webix.protoUI({
    name: "kanban",
    defaults: {
      delimiter: ","
    },
    $skin: function () {
      this.defaults.type = "space";
    },
    $init: function (config) {
      var _this = this;

      this.$view.className += " webix_kanban";
      this.data.provideApi(this, true);
      this.data.scheme({
        $change: function (obj) {
          if (typeof obj.tags === "string") obj.tags = _this._strToArr(obj.tags);
        }
      });
      this._destroy_with_me = [];
      this._statuses = new webix.DataCollection();

      this._destroy_with_me.push(this._statuses);

      this._tags = this._data_unification(config.tags);
      this._users = this._data_unification(config.users);
      this._colors = this._data_unification(config.colors);
      this.$ready.push(function () {
        var _this2 = this;

        this.reconstruct();

        this._initEditor();

        this._initUserList();

        this._initMenu();

        this._initComments();

        this.data.attachEvent("onStoreUpdated", function (id, data, mode) {
          return _this2._applyOrder(id, data, mode);
        });
        this.data.attachEvent("onIdChange", function (oldid, newid) {
          _this2.getOwnerList(oldid).data.changeId(oldid, newid);
        });
        this.attachEvent("onDestruct", function () {
          for (var i = 0; i < _this2._destroy_with_me.length; i++) {
            _this2._destroy_with_me[i].destructor();
          }
        });
      }); //override default api of datastore

      this.serialize = this._serialize;
    },
    _strToArr: function (value) {
      if (value) {
        return value.split(this.config.delimiter);
      }

      return [];
    },
    getTags: function () {
      return this._tags;
    },
    getUsers: function () {
      return this._users;
    },
    getColors: function () {
      return this._colors;
    },
    getStatuses: function () {
      return this._statuses.serialize();
    },
    cardActions_setter: function (value) {
      if (value === true) value = ["edit", "copy", "remove"];

      if (webix.isArray(value)) {
        return value.map(function (v) {
          return {
            id: v,
            value: webix.i18n.kanban.menu[v] || v
          };
        });
      }
    },
    showEditor: function (obj) {
      var editor = this.getEditor();

      if (this.callEvent("onBeforeEditorShow", [editor, obj]) && editor) {
        editor.setValues(obj);
        editor.show();
        this.callEvent("onAfterEditorShow", [editor, obj]);
      }
    },
    copy: function (id) {
      if (this.callEvent("onBeforeCopy", [id])) {
        var item = webix.copy(this.getItem(id));
        delete item.id;
        item.text = webix.i18n.kanban.copy + " " + (item.text || "");
        var sid = this.add(item);
        var list = this.getOwnerList(sid);
        list.move(sid, list.getIndexById(id) + 1, list);
        this.callEvent("onAfterCopy", [id]);
      }
    },
    _removeCard: function (id) {
      var _this3 = this;

      var promise = webix.promise.defer();

      if (webix.i18n.kanban.confirm) {
        webix.confirm({
          text: webix.i18n.kanban.confirm,
          callback: function (result) {
            if (result) {
              _this3.remove(id);

              promise.resolve();
            }
          }
        });
      } else {
        this.remove(id);
        promise.resolve();
      }

      return promise;
    },
    _data_unification: function (value) {
      if (value && value.getItem) return value;else {
        var data = new webix.DataCollection();

        this._destroy_with_me.push(data);

        if (value && typeof value === "string") data.load(value);else data.parse(value || []);
        return data;
      }
    },
    getEditor: function () {
      return webix.$$(this._editor);
    },
    getUserList: function () {
      return webix.$$(this._userList);
    },
    getMenu: function () {
      return webix.$$(this._menu);
    },
    getComments: function () {
      return webix.$$(this._comments);
    },
    _initEditor: function () {
      var _this4 = this;

      if (this.config.editor) {
        var editor = webix.ui({
          view: "kanbaneditor",
          master: this.config.id
        });
        this._editor = editor.config.id;

        this._destroy_with_me.push(editor);

        this.attachEvent("onListIconClick", function (icon, id) {
          if (icon === "editor") _this4.showEditor(webix.copy(_this4.getItem(id)));
        });
        this.attachEvent("onListItemDblClick", function (id) {
          return _this4.showEditor(webix.copy(_this4.getItem(id)));
        });
      }
    },
    _initUserList: function () {
      var _this5 = this;

      if (this.config.userList) {
        var userlist = _typeof(this.config.userList) === "object" ? this.config.userList : {};
        webix.extend(userlist, {
          view: "kanbanuserlist",
          masterId: this.config.id,
          data: this._users
        }, true);
        userlist = webix.ui(userlist);
        this._userList = userlist.config.id;

        this._destroy_with_me.push(userlist);

        this.attachEvent("onAvatarClick", function (id, e, node) {
          var userList = _this5.getUserList();

          userList.setContext({
            id: id,
            user_id: _this5.getItem(id).user_id
          });
          userList.show(node);
        });
      }
    },
    _initMenu: function () {
      var _this6 = this;

      if (this.config.cardActions) {
        var menu = webix.ui({
          view: "kanbanmenu",
          data: this.config.cardActions,
          masterId: this.config.id
        });
        this._menu = menu.config.id;

        this._destroy_with_me.push(menu);

        this.attachEvent("onListIconClick", function (icon, id, e, node) {
          if (icon === "menu") {
            var _menu = _this6.getMenu();

            _menu.setContext({
              id: id
            });

            _menu.show(node);
          }
        });
      }
    },
    _initComments: function () {
      var _this7 = this;

      if (this.config.comments) {
        var body = _typeof(this.config.comments) === "object" ? this.config.comments : {};
        body = webix.extend({
          width: 400,
          height: 400
        }, body, true);
        webix.extend(body, {
          view: "comments",
          users: this._users
        }, true);
        var comments = webix.ui({
          view: "kanbanchat",
          body: body,
          masterId: this.config.id
        });
        this._comments = comments.config.id;

        this._destroy_with_me.push(comments);

        this.attachEvent("onListIconClick", function (icon, id, e, node) {
          if (icon === "comments" && _this7.callEvent("onBeforeCommentsShow", [id, e, node])) {
            var chat = _this7.getComments();

            var pos = webix.html.offset(node);
            pos.y += pos.height;
            chat.hide();

            var _comments = chat.getBody();

            var data = _this7.getItem(id).comments || [];

            _comments.parse(webix.copy(data));

            chat.setContext({
              id: id
            });
            chat.show(pos);
          }
        });
      }
    },
    _serialize: function () {
      var d = [];
      this.eachList(function (l) {
        d = d.concat(l.serialize());
      });
      return d;
    },
    _applyOrder: function (id, data, mode) {
      if (!id) {
        this._syncData();

        return;
      }

      if (mode == "add") {
        this._assignList(data);

        this.getOwnerList(id).add(data);
      } else if (mode === "delete") {
        this._sublists[data.$list].remove(id);
      } else if (mode === "update" || mode === "paint") {
        var list = data.$list;

        this._assignList(data);

        if (list === data.$list) this.getOwnerList(id).updateItem(id, data);else {
          this._sublists[list].remove(id);

          this.getOwnerList(id).add(data);
        }
      }
    },
    setListStatus: function (obj, list) {
      for (var i = 0; i < this._sublists.length; i++) {
        if (this._sublists[i] === list) {
          defaultSetter(obj, list);
          return;
        }
      }
    },
    reconstruct: function () {
      this._prepareLists();

      this._syncData();
    },
    _prepareLists: function () {
      this._sublists = [];
      this._subfilters = [];
      var statuses = [];
      var views = this.queryView(function (a) {
        return a.$kanban;
      }, "all");

      for (var i = 0; i < views.length; i++) {
        var sub = views[i];
        if (sub.config.view !== "kanbanheader") this._sublists.push(sub);else sub.config.master = this.config.id;
      }

      for (var _i = 0; _i < this._sublists.length; _i++) {
        var _sub = this._sublists[_i];
        this._subfilters[_i] = defaultFilter(_sub);

        if (this.config.icons) {
          _sub.type.icons = _sub.type.icons || this.config.icons;
        }

        var value = _sub.config.name || (typeof _sub.config.status === "string" && _sub.config.status ? _sub.config.status[0].toUpperCase() + _sub.config.status.slice(1) : _sub.config.id);
        statuses.push({
          id: _i.toString(),
          value: value
        });
        _sub.config.master = this.config.id;
        _sub.type.master = this.config.id;
      }

      this._statuses.clearAll();

      this._statuses.parse(statuses);
    },
    _syncData: function () {
      var i,
          sets = [];

      for (i = 0; i < this._sublists.length; i++) {
        sets[i] = [];
      }

      this.data.each(function (item) {
        var j = this._assignList(item);

        if (j >= 0) sets[j].push(item);
      }, this);

      for (i = 0; i < this._sublists.length; i++) {
        var data = sets[i];
        if (data.length && data[0].$index) data.sort(function (a, b) {
          return a.$index > b.$index ? 1 : -1;
        });

        this._sublists[i].clearAll();

        this._sublists[i].data.importData(data);
      }
    },
    _assignList: function (data) {
      for (var i = 0; i < this._sublists.length; i++) {
        if (this._subfilters[i](data)) {
          return data.$list = i;
        }
      }

      return -1;
    },
    getSelectedId: function () {
      var selected = null;
      this.eachList(function (list) {
        selected = list.getSelectedId() || selected;
      });
      return selected;
    },
    select: function (id) {
      this.getOwnerList(id).select(id);
    },
    getOwnerList: function (id) {
      var item = this.getItem(id);
      return item ? this._sublists[item.$list] : null;
    },
    eachList: function (code) {
      for (var i = 0; i < this._sublists.length; i++) {
        code.call(this, this._sublists[i], this._sublists[i].config.status);
      }
    }
  }, webix.DataLoader, webix.EventSystem, webix.ui.headerlayout);

})));
