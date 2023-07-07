/*
@license
<<<<<<< HEAD
Webix Scheduler v.8.1.1
=======
Webix Scheduler v.10.1.0
>>>>>>> 6388b01 (New widget Scheduler)
This software is covered by Webix Commercial License.
Usage without proper license is prohibited.
(c) XB Software Ltd.
*/
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.scheduler = {}));
}(this, (function (exports) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }

    var NavigationBlocked = (function () {
        function NavigationBlocked() {
        }
        return NavigationBlocked;
    }());
    var JetBase = (function () {
        function JetBase(webix, config) {
            this.webixJet = true;
            this.webix = webix;
            this._events = [];
            this._subs = {};
            this._data = {};
            if (config && config.params)
                webix.extend(this._data, config.params);
        }
        JetBase.prototype.getRoot = function () {
            return this._root;
        };
        JetBase.prototype.destructor = function () {
            this._detachEvents();
            this._destroySubs();
            this._events = this._container = this.app = this._parent = this._root = null;
        };
        JetBase.prototype.setParam = function (id, value, url) {
            if (this._data[id] !== value) {
                this._data[id] = value;
                this._segment.update(id, value, 0);
                if (url) {
                    return this.show(null);
                }
            }
        };
        JetBase.prototype.getParam = function (id, parent) {
            var value = this._data[id];
            if (typeof value !== "undefined" || !parent) {
                return value;
            }
            var view = this.getParentView();
            if (view) {
                return view.getParam(id, parent);
            }
        };
        JetBase.prototype.getUrl = function () {
            return this._segment.suburl();
        };
        JetBase.prototype.getUrlString = function () {
            return this._segment.toString();
        };
        JetBase.prototype.getParentView = function () {
            return this._parent;
        };
        JetBase.prototype.$$ = function (id) {
            if (typeof id === "string") {
                var root_1 = this.getRoot();
                return root_1.queryView((function (obj) { return (obj.config.id === id || obj.config.localId === id) &&
                    (obj.$scope === root_1.$scope); }), "self");
            }
            else {
                return id;
            }
        };
        JetBase.prototype.on = function (obj, name, code) {
            var id = obj.attachEvent(name, code);
            this._events.push({ obj: obj, id: id });
            return id;
        };
        JetBase.prototype.contains = function (view) {
            for (var key in this._subs) {
                var kid = this._subs[key].view;
                if (kid === view || kid.contains(view)) {
                    return true;
                }
            }
            return false;
        };
        JetBase.prototype.getSubView = function (name) {
            var sub = this.getSubViewInfo(name);
            if (sub) {
                return sub.subview.view;
            }
        };
        JetBase.prototype.getSubViewInfo = function (name) {
            var sub = this._subs[name || "default"];
            if (sub) {
                return { subview: sub, parent: this };
            }
            if (name === "_top") {
                this._subs[name] = { url: "", id: null, popup: true };
                return this.getSubViewInfo(name);
            }
            if (this._parent) {
                return this._parent.getSubViewInfo(name);
            }
            return null;
        };
        JetBase.prototype._detachEvents = function () {
            var events = this._events;
            for (var i = events.length - 1; i >= 0; i--) {
                events[i].obj.detachEvent(events[i].id);
            }
        };
        JetBase.prototype._destroySubs = function () {
            for (var key in this._subs) {
                var subView = this._subs[key].view;
                if (subView) {
                    subView.destructor();
                }
            }
            this._subs = {};
        };
        JetBase.prototype._init_url_data = function () {
            var url = this._segment.current();
            this._data = {};
            this.webix.extend(this._data, url.params, true);
        };
        JetBase.prototype._getDefaultSub = function () {
            if (this._subs.default) {
                return this._subs.default;
            }
            for (var key in this._subs) {
                var sub = this._subs[key];
                if (!sub.branch && sub.view && key !== "_top") {
                    var child = sub.view._getDefaultSub();
                    if (child) {
                        return child;
                    }
                }
            }
        };
        JetBase.prototype._routed_view = function () {
            var parent = this.getParentView();
            if (!parent) {
                return true;
            }
            var sub = parent._getDefaultSub();
            if (!sub && sub !== this) {
                return false;
            }
            return parent._routed_view();
        };
        return JetBase;
    }());
    function parse(url) {
        if (url[0] === "/") {
            url = url.substr(1);
        }
        var parts = url.split("/");
        var chunks = [];
        for (var i = 0; i < parts.length; i++) {
            var test = parts[i];
            var result = {};
            var pos = test.indexOf(":");
            if (pos === -1) {
                pos = test.indexOf("?");
            }
            if (pos !== -1) {
                var params = test.substr(pos + 1).split(/[\:\?\&]/g);
                for (var _i = 0, params_1 = params; _i < params_1.length; _i++) {
                    var param = params_1[_i];
                    var dchunk = param.split("=");
                    result[dchunk[0]] = decodeURIComponent(dchunk[1]);
                }
            }
            chunks[i] = {
                page: (pos > -1 ? test.substr(0, pos) : test),
                params: result,
                isNew: true
            };
        }
        return chunks;
    }
    function url2str(stack) {
        var url = [];
        for (var _i = 0, stack_1 = stack; _i < stack_1.length; _i++) {
            var chunk = stack_1[_i];
            url.push("/" + chunk.page);
            var params = obj2str(chunk.params);
            if (params) {
                url.push("?" + params);
            }
        }
        return url.join("");
    }
    function obj2str(obj) {
        var str = [];
        for (var key in obj) {
            if (typeof obj[key] === "object")
                continue;
            if (str.length) {
                str.push("&");
            }
            str.push(key + "=" + encodeURIComponent(obj[key]));
        }
        return str.join("");
    }
    var Route = (function () {
        function Route(route, index) {
            this._next = 1;
            if (typeof route === "string") {
                this.route = {
                    url: parse(route),
                    path: route
                };
            }
            else {
                this.route = route;
            }
            this.index = index;
        }
        Route.prototype.current = function () {
            return this.route.url[this.index];
        };
        Route.prototype.next = function () {
            return this.route.url[this.index + this._next];
        };
        Route.prototype.suburl = function () {
            return this.route.url.slice(this.index);
        };
        Route.prototype.shift = function (params) {
            var route = new Route(this.route, this.index + this._next);
            route.setParams(route.route.url, params, route.index);
            return route;
        };
        Route.prototype.setParams = function (url, params, index) {
            if (params) {
                var old = url[index].params;
                for (var key in params)
                    old[key] = params[key];
            }
        };
        Route.prototype.refresh = function () {
            var url = this.route.url;
            for (var i = this.index + 1; i < url.length; i++) {
                url[i].isNew = true;
            }
        };
        Route.prototype.toString = function () {
            var str = url2str(this.suburl());
            return str ? str.substr(1) : "";
        };
        Route.prototype._join = function (path, kids) {
            var url = this.route.url;
            if (path === null) {
                return url;
            }
            var old = this.route.url;
            var reset = true;
            url = old.slice(0, this.index + (kids ? this._next : 0));
            if (path) {
                url = url.concat(parse(path));
                for (var i = 0; i < url.length; i++) {
                    if (old[i]) {
                        url[i].view = old[i].view;
                    }
                    if (reset && old[i] && url[i].page === old[i].page) {
                        url[i].isNew = false;
                    }
                    else if (url[i].isNew) {
                        reset = false;
                    }
                }
            }
            return url;
        };
        Route.prototype.append = function (path) {
            var url = this._join(path, true);
            this.route.path = url2str(url);
            this.route.url = url;
            return this.route.path;
        };
        Route.prototype.show = function (path, view, kids) {
            var _this = this;
            var url = this._join(path.url, kids);
            this.setParams(url, path.params, this.index + (kids ? this._next : 0));
            return new Promise(function (res, rej) {
                var redirect = url2str(url);
                var obj = {
                    url: url,
                    redirect: redirect,
                    confirm: Promise.resolve()
                };
                var app = view ? view.app : null;
                if (app) {
                    var result = app.callEvent("app:guard", [obj.redirect, view, obj]);
                    if (!result) {
                        rej(new NavigationBlocked());
                        return;
                    }
                }
                obj.confirm.catch(function (err) { return rej(err); }).then(function () {
                    if (obj.redirect === null) {
                        rej(new NavigationBlocked());
                        return;
                    }
                    if (obj.redirect !== redirect) {
                        app.show(obj.redirect);
                        rej(new NavigationBlocked());
                        return;
                    }
                    _this.route.path = redirect;
                    _this.route.url = url;
                    res();
                });
            });
        };
        Route.prototype.size = function (n) {
            this._next = n;
        };
        Route.prototype.split = function () {
            var route = {
                url: this.route.url.slice(this.index + 1),
                path: ""
            };
            if (route.url.length) {
                route.path = url2str(route.url);
            }
            return new Route(route, 0);
        };
        Route.prototype.update = function (name, value, index) {
            var chunk = this.route.url[this.index + (index || 0)];
            if (!chunk) {
                this.route.url.push({ page: "", params: {} });
                return this.update(name, value, index);
            }
            if (name === "") {
                chunk.page = value;
            }
            else {
                chunk.params[name] = value;
            }
            this.route.path = url2str(this.route.url);
        };
        return Route;
    }());
    var JetView = (function (_super) {
        __extends(JetView, _super);
        function JetView(app, config) {
            var _this = _super.call(this, app.webix) || this;
            _this.app = app;
            _this._children = [];
            return _this;
        }
        JetView.prototype.ui = function (ui, config) {
            config = config || {};
            var container = config.container || ui.container;
            var jetview = this.app.createView(ui);
            this._children.push(jetview);
            jetview.render(container, this._segment, this);
            if (typeof ui !== "object" || (ui instanceof JetBase)) {
                return jetview;
            }
            else {
                return jetview.getRoot();
            }
        };
        JetView.prototype.show = function (path, config) {
            config = config || {};
            if (typeof path === "object") {
                for (var key in path) {
                    this.setParam(key, path[key]);
                }
                path = null;
            }
            else {
                if (path.substr(0, 1) === "/") {
                    return this.app.show(path, config);
                }
                if (path.indexOf("./") === 0) {
                    path = path.substr(2);
                }
                if (path.indexOf("../") === 0) {
                    var parent_1 = this.getParentView();
                    if (parent_1) {
                        return parent_1.show(path.substr(3), config);
                    }
                    else {
                        return this.app.show("/" + path.substr(3));
                    }
                }
                var sub = this.getSubViewInfo(config.target);
                if (sub) {
                    if (sub.parent !== this) {
                        return sub.parent.show(path, config);
                    }
                    else if (config.target && config.target !== "default") {
                        return this._renderFrameLock(config.target, sub.subview, {
                            url: path,
                            params: config.params,
                        });
                    }
                }
                else {
                    if (path) {
                        return this.app.show("/" + path, config);
                    }
                }
            }
            return this._show(this._segment, { url: path, params: config.params }, this);
        };
        JetView.prototype._show = function (segment, path, view) {
            var _this = this;
            return segment.show(path, view, true).then(function () {
                _this._init_url_data();
                return _this._urlChange();
            }).then(function () {
                if (segment.route.linkRouter) {
                    _this.app.getRouter().set(segment.route.path, { silent: true });
                    _this.app.callEvent("app:route", [segment.route.path]);
                }
            });
        };
        JetView.prototype.init = function (_$view, _$) {
        };
        JetView.prototype.ready = function (_$view, _$url) {
        };
        JetView.prototype.config = function () {
            this.app.webix.message("View:Config is not implemented");
        };
        JetView.prototype.urlChange = function (_$view, _$url) {
        };
        JetView.prototype.destroy = function () {
        };
        JetView.prototype.destructor = function () {
            this.destroy();
            this._destroyKids();
            if (this._root) {
                this._root.destructor();
                _super.prototype.destructor.call(this);
            }
        };
        JetView.prototype.use = function (plugin, config) {
            plugin(this.app, this, config);
        };
        JetView.prototype.refresh = function () {
            var url = this.getUrl();
            this.destroy();
            this._destroyKids();
            this._destroySubs();
            this._detachEvents();
            if (this._container.tagName) {
                this._root.destructor();
            }
            this._segment.refresh();
            return this._render(this._segment);
        };
        JetView.prototype.render = function (root, url, parent) {
            var _this = this;
            if (typeof url === "string") {
                url = new Route(url, 0);
            }
            this._segment = url;
            this._parent = parent;
            this._init_url_data();
            root = root || document.body;
            var _container = (typeof root === "string") ? this.webix.toNode(root) : root;
            if (this._container !== _container) {
                this._container = _container;
                return this._render(url);
            }
            else {
                return this._urlChange().then(function () { return _this.getRoot(); });
            }
        };
        JetView.prototype._render = function (url) {
            var _this = this;
            var config = this.config();
            if (config.then) {
                return config.then(function (cfg) { return _this._render_final(cfg, url); });
            }
            else {
                return this._render_final(config, url);
            }
        };
        JetView.prototype._render_final = function (config, url) {
            var _this = this;
            var slot = null;
            var container = null;
            var show = false;
            if (!this._container.tagName) {
                slot = this._container;
                if (slot.popup) {
                    container = document.body;
                    show = true;
                }
                else {
                    container = this.webix.$$(slot.id);
                }
            }
            else {
                container = this._container;
            }
            if (!this.app || !container) {
                return Promise.reject(null);
            }
            var response;
            var current = this._segment.current();
            var result = { ui: {} };
            this.app.copyConfig(config, result.ui, this._subs);
            this.app.callEvent("app:render", [this, url, result]);
            result.ui.$scope = this;
            if (!slot && current.isNew && current.view) {
                current.view.destructor();
            }
            try {
                if (slot && !show) {
                    var oldui = container;
                    var parent_2 = oldui.getParentView();
                    if (parent_2 && parent_2.name === "multiview" && !result.ui.id) {
                        result.ui.id = oldui.config.id;
                    }
                }
                this._root = this.app.webix.ui(result.ui, container);
                var asWin = this._root;
                if (show && asWin.setPosition && !asWin.isVisible()) {
                    asWin.show();
                }
                if (slot) {
                    if (slot.view && slot.view !== this && slot.view !== this.app) {
                        slot.view.destructor();
                    }
                    slot.id = this._root.config.id;
                    if (this.getParentView() || !this.app.app)
                        slot.view = this;
                    else {
                        slot.view = this.app;
                    }
                }
                if (current.isNew) {
                    current.view = this;
                    current.isNew = false;
                }
                response = Promise.resolve(this._init(this._root, url)).then(function () {
                    return _this._urlChange().then(function () {
                        _this._initUrl = null;
                        return _this.ready(_this._root, url.suburl());
                    });
                });
            }
            catch (e) {
                response = Promise.reject(e);
            }
            return response.catch(function (err) { return _this._initError(_this, err); });
        };
        JetView.prototype._init = function (view, url) {
            return this.init(view, url.suburl());
        };
        JetView.prototype._urlChange = function () {
            var _this = this;
            this.app.callEvent("app:urlchange", [this, this._segment]);
            var waits = [];
            for (var key in this._subs) {
                var frame = this._subs[key];
                var wait = this._renderFrameLock(key, frame, null);
                if (wait) {
                    waits.push(wait);
                }
            }
            return Promise.all(waits).then(function () {
                return _this.urlChange(_this._root, _this._segment.suburl());
            });
        };
        JetView.prototype._renderFrameLock = function (key, frame, path) {
            if (!frame.lock) {
                var lock = this._renderFrame(key, frame, path);
                if (lock) {
                    frame.lock = lock.then(function () { return frame.lock = null; }, function () { return frame.lock = null; });
                }
            }
            return frame.lock;
        };
        JetView.prototype._renderFrame = function (key, frame, path) {
            var _this = this;
            if (key === "default") {
                if (this._segment.next()) {
                    var params = path ? path.params : null;
                    if (frame.params) {
                        params = this.webix.extend(params || {}, frame.params);
                    }
                    return this._createSubView(frame, this._segment.shift(params));
                }
                else if (frame.view && frame.popup) {
                    frame.view.destructor();
                    frame.view = null;
                }
            }
            if (path !== null) {
                frame.url = path.url;
                if (frame.params) {
                    path.params = this.webix.extend(path.params || {}, frame.params);
                }
            }
            if (frame.route) {
                if (path !== null) {
                    return frame.route.show(path, frame.view).then(function () {
                        return _this._createSubView(frame, frame.route);
                    });
                }
                if (frame.branch) {
                    return;
                }
            }
            var view = frame.view;
            if (!view && frame.url) {
                if (typeof frame.url === "string") {
                    frame.route = new Route(frame.url, 0);
                    if (path)
                        frame.route.setParams(frame.route.route.url, path.params, 0);
                    if (frame.params)
                        frame.route.setParams(frame.route.route.url, frame.params, 0);
                    return this._createSubView(frame, frame.route);
                }
                else {
                    if (typeof frame.url === "function" && !(view instanceof frame.url)) {
                        view = new (this.app._override(frame.url))(this.app, "");
                    }
                    if (!view) {
                        view = frame.url;
                    }
                }
            }
            if (view) {
                return view.render(frame, (frame.route || this._segment), this);
            }
        };
        JetView.prototype._initError = function (view, err) {
            if (this.app) {
                this.app.error("app:error:initview", [err, view]);
            }
            return true;
        };
        JetView.prototype._createSubView = function (sub, suburl) {
            var _this = this;
            return this.app.createFromURL(suburl.current()).then(function (view) {
                return view.render(sub, suburl, _this);
            });
        };
        JetView.prototype._destroyKids = function () {
            var uis = this._children;
            for (var i = uis.length - 1; i >= 0; i--) {
                if (uis[i] && uis[i].destructor) {
                    uis[i].destructor();
                }
            }
            this._children = [];
        };
        return JetView;
    }(JetBase));
    var JetViewRaw = (function (_super) {
        __extends(JetViewRaw, _super);
        function JetViewRaw(app, config) {
            var _this = _super.call(this, app, config) || this;
            _this._ui = config.ui;
            return _this;
        }
        JetViewRaw.prototype.config = function () {
            return this._ui;
        };
        return JetViewRaw;
    }(JetView));
    var SubRouter = (function () {
        function SubRouter(cb, config, app) {
            this.path = "";
            this.app = app;
        }
        SubRouter.prototype.set = function (path, config) {
            this.path = path;
            var a = this.app;
            a.app.getRouter().set(a._segment.append(this.path), { silent: true });
        };
        SubRouter.prototype.get = function () {
            return this.path;
        };
        return SubRouter;
    }());
    var _once = true;
    var JetAppBase = (function (_super) {
        __extends(JetAppBase, _super);
        function JetAppBase(config) {
            var _this = this;
            var webix = (config || {}).webix || window.webix;
            config = webix.extend({
                name: "App",
                version: "1.0",
                start: "/home"
            }, config, true);
            _this = _super.call(this, webix, config) || this;
            _this.config = config;
            _this.app = _this.config.app;
            _this.ready = Promise.resolve();
            _this._services = {};
            _this.webix.extend(_this, _this.webix.EventSystem);
            return _this;
        }
        JetAppBase.prototype.getUrl = function () {
            return this._subSegment.suburl();
        };
        JetAppBase.prototype.getUrlString = function () {
            return this._subSegment.toString();
        };
        JetAppBase.prototype.getService = function (name) {
            var obj = this._services[name];
            if (typeof obj === "function") {
                obj = this._services[name] = obj(this);
            }
            return obj;
        };
        JetAppBase.prototype.setService = function (name, handler) {
            this._services[name] = handler;
        };
        JetAppBase.prototype.destructor = function () {
            this.getSubView().destructor();
            _super.prototype.destructor.call(this);
        };
        JetAppBase.prototype.copyConfig = function (obj, target, config) {
            if (obj instanceof JetBase ||
                (typeof obj === "function" && obj.prototype instanceof JetBase)) {
                obj = { $subview: obj };
            }
            if (typeof obj.$subview != "undefined") {
                return this.addSubView(obj, target, config);
            }
            var isArray = obj instanceof Array;
            target = target || (isArray ? [] : {});
            for (var method in obj) {
                var point = obj[method];
                if (typeof point === "function" && point.prototype instanceof JetBase) {
                    point = { $subview: point };
                }
                if (point && typeof point === "object" &&
                    !(point instanceof this.webix.DataCollection) && !(point instanceof RegExp) && !(point instanceof Map)) {
                    if (point instanceof Date) {
                        target[method] = new Date(point);
                    }
                    else {
                        var copy = this.copyConfig(point, (point instanceof Array ? [] : {}), config);
                        if (copy !== null) {
                            if (isArray)
                                target.push(copy);
                            else
                                target[method] = copy;
                        }
                    }
                }
                else {
                    target[method] = point;
                }
            }
            return target;
        };
        JetAppBase.prototype.getRouter = function () {
            return this.$router;
        };
        JetAppBase.prototype.clickHandler = function (e, target) {
            if (e) {
                target = target || (e.target || e.srcElement);
                if (target && target.getAttribute) {
                    var trigger_1 = target.getAttribute("trigger");
                    if (trigger_1) {
                        this._forView(target, function (view) { return view.app.trigger(trigger_1); });
                        e.cancelBubble = true;
                        return e.preventDefault();
                    }
                    var route_1 = target.getAttribute("route");
                    if (route_1) {
                        this._forView(target, function (view) { return view.show(route_1); });
                        e.cancelBubble = true;
                        return e.preventDefault();
                    }
                }
            }
            var parent = target.parentNode;
            if (parent) {
                this.clickHandler(e, parent);
            }
        };
        JetAppBase.prototype.getRoot = function () {
            return this.getSubView().getRoot();
        };
        JetAppBase.prototype.refresh = function () {
            var _this = this;
            if (!this._subSegment) {
                return Promise.resolve(null);
            }
            return this.getSubView().refresh().then(function (view) {
                _this.callEvent("app:route", [_this.getUrl()]);
                return view;
            });
        };
        JetAppBase.prototype.loadView = function (url) {
            var _this = this;
            var views = this.config.views;
            var result = null;
            if (url === "") {
                return Promise.resolve(this._loadError("", new Error("Webix Jet: Empty url segment")));
            }
            try {
                if (views) {
                    if (typeof views === "function") {
                        result = views(url);
                    }
                    else {
                        result = views[url];
                    }
                    if (typeof result === "string") {
                        url = result;
                        result = null;
                    }
                }
                if (!result) {
                    if (url === "_hidden") {
                        result = { hidden: true };
                    }
                    else if (url === "_blank") {
                        result = {};
                    }
                    else {
                        url = url.replace(/\./g, "/");
                        result = this.require("jet-views", url);
                    }
                }
            }
            catch (e) {
                result = this._loadError(url, e);
            }
            if (!result.then) {
                result = Promise.resolve(result);
            }
            result = result
                .then(function (module) { return module.__esModule ? module.default : module; })
                .catch(function (err) { return _this._loadError(url, err); });
            return result;
        };
        JetAppBase.prototype._forView = function (target, handler) {
            var view = this.webix.$$(target);
            if (view) {
                handler(view.$scope);
            }
        };
        JetAppBase.prototype._loadViewDynamic = function (url) {
            return null;
        };
        JetAppBase.prototype.createFromURL = function (chunk) {
            var _this = this;
            var view;
            if (chunk.isNew || !chunk.view) {
                view = this.loadView(chunk.page)
                    .then(function (ui) { return _this.createView(ui, name, chunk.params); });
            }
            else {
                view = Promise.resolve(chunk.view);
            }
            return view;
        };
        JetAppBase.prototype._override = function (ui) {
            var over = this.config.override;
            if (over) {
                var dv = void 0;
                while (ui) {
                    dv = ui;
                    ui = over.get(ui);
                }
                return dv;
            }
            return ui;
        };
        JetAppBase.prototype.createView = function (ui, name, params) {
            ui = this._override(ui);
            var obj;
            if (typeof ui === "function") {
                if (ui.prototype instanceof JetAppBase) {
                    return new ui({ app: this, name: name, params: params, router: SubRouter });
                }
                else if (ui.prototype instanceof JetBase) {
                    return new ui(this, { name: name, params: params });
                }
                else {
                    ui = ui(this);
                }
            }
            if (ui instanceof JetBase) {
                obj = ui;
            }
            else {
                obj = new JetViewRaw(this, { name: name, ui: ui });
            }
            return obj;
        };
        JetAppBase.prototype.show = function (url, config) {
            if (url && this.app && url.indexOf("//") == 0)
                return this.app.show(url.substr(1), config);
            return this.render(this._container, url || this.config.start, config);
        };
        JetAppBase.prototype.trigger = function (name) {
            var rest = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                rest[_i - 1] = arguments[_i];
            }
            this.apply(name, rest);
        };
        JetAppBase.prototype.apply = function (name, data) {
            this.callEvent(name, data);
        };
        JetAppBase.prototype.action = function (name) {
            return this.webix.bind(function () {
                var rest = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    rest[_i] = arguments[_i];
                }
                this.apply(name, rest);
            }, this);
        };
        JetAppBase.prototype.on = function (name, handler) {
            this.attachEvent(name, handler);
        };
        JetAppBase.prototype.use = function (plugin, config) {
            plugin(this, null, config);
        };
        JetAppBase.prototype.error = function (name, er) {
            this.callEvent(name, er);
            this.callEvent("app:error", er);
            if (this.config.debug) {
                for (var i = 0; i < er.length; i++) {
                    console.error(er[i]);
                    if (er[i] instanceof Error) {
                        var text = er[i].message;
                        if (text.indexOf("Module build failed") === 0) {
                            text = text.replace(/\x1b\[[0-9;]*m/g, "");
                            document.body.innerHTML = "<pre style='font-size:16px; background-color: #ec6873; color: #000; padding:10px;'>" + text + "</pre>";
                        }
                        else {
                            text += "<br><br>Check console for more details";
                            this.webix.message({ type: "error", text: text, expire: -1 });
                        }
                    }
                }
                debugger;
            }
        };
        JetAppBase.prototype.render = function (root, url, config) {
            var _this = this;
            this._container = (typeof root === "string") ?
                this.webix.toNode(root) :
                (root || document.body);
            var firstInit = !this.$router;
            var path = null;
            if (firstInit) {
                if (_once && "tagName" in this._container) {
                    this.webix.event(document.body, "click", function (e) { return _this.clickHandler(e); });
                    _once = false;
                }
                if (typeof url === "string") {
                    url = new Route(url, 0);
                }
                this._subSegment = this._first_start(url);
                this._subSegment.route.linkRouter = true;
            }
            else {
                if (typeof url === "string") {
                    path = url;
                }
                else {
                    if (this.app) {
                        path = url.split().route.path || this.config.start;
                    }
                    else {
                        path = url.toString();
                    }
                }
            }
            var params = config ? config.params : this.config.params || null;
            var top = this.getSubView();
            var segment = this._subSegment;
            var ready = segment
                .show({ url: path, params: params }, top)
                .then(function () { return _this.createFromURL(segment.current()); })
                .then(function (view) { return view.render(root, segment); })
                .then(function (base) {
                _this.$router.set(segment.route.path, { silent: true });
                _this.callEvent("app:route", [_this.getUrl()]);
                return base;
            });
            this.ready = this.ready.then(function () { return ready; });
            return ready;
        };
        JetAppBase.prototype.getSubView = function () {
            if (this._subSegment) {
                var view = this._subSegment.current().view;
                if (view)
                    return view;
            }
            return new JetView(this, {});
        };
        JetAppBase.prototype.require = function (type, url) { return null; };
        JetAppBase.prototype._first_start = function (route) {
            var _this = this;
            this._segment = route;
            var cb = function (a) { return setTimeout(function () {
                _this.show(a).catch(function (e) {
                    if (!(e instanceof NavigationBlocked))
                        throw e;
                });
            }, 1); };
            this.$router = new (this.config.router)(cb, this.config, this);
            if (this._container === document.body && this.config.animation !== false) {
                var node_1 = this._container;
                this.webix.html.addCss(node_1, "webixappstart");
                setTimeout(function () {
                    _this.webix.html.removeCss(node_1, "webixappstart");
                    _this.webix.html.addCss(node_1, "webixapp");
                }, 10);
            }
            if (!route) {
                var urlString = this.$router.get();
                if (!urlString) {
                    urlString = this.config.start;
                    this.$router.set(urlString, { silent: true });
                }
                route = new Route(urlString, 0);
            }
            else if (this.app) {
                var now = route.current().view;
                route.current().view = this;
                if (route.next()) {
                    route.refresh();
                    route = route.split();
                }
                else {
                    route = new Route(this.config.start, 0);
                }
                route.current().view = now;
            }
            return route;
        };
        JetAppBase.prototype._loadError = function (url, err) {
            this.error("app:error:resolve", [err, url]);
            return { template: " " };
        };
        JetAppBase.prototype.addSubView = function (obj, target, config) {
            var url = obj.$subview !== true ? obj.$subview : null;
            var name = obj.name || (url ? this.webix.uid() : "default");
            target.id = obj.id || "s" + this.webix.uid();
            var view = config[name] = {
                id: target.id,
                url: url,
                branch: obj.branch,
                popup: obj.popup,
                params: obj.params
            };
            return view.popup ? null : target;
        };
        return JetAppBase;
    }(JetBase));
    var HashRouter = (function () {
        function HashRouter(cb, config) {
            var _this = this;
            this.config = config || {};
            this._detectPrefix();
            this.cb = cb;
            window.onpopstate = function () { return _this.cb(_this.get()); };
        }
        HashRouter.prototype.set = function (path, config) {
            var _this = this;
            if (this.config.routes) {
                var compare = path.split("?", 2);
                for (var key in this.config.routes) {
                    if (this.config.routes[key] === compare[0]) {
                        path = key + (compare.length > 1 ? "?" + compare[1] : "");
                        break;
                    }
                }
            }
            if (this.get() !== path) {
                window.history.pushState(null, null, this.prefix + this.sufix + path);
            }
            if (!config || !config.silent) {
                setTimeout(function () { return _this.cb(path); }, 1);
            }
        };
        HashRouter.prototype.get = function () {
            var path = this._getRaw().replace(this.prefix, "").replace(this.sufix, "");
            path = (path !== "/" && path !== "#") ? path : "";
            if (this.config.routes) {
                var compare = path.split("?", 2);
                var key = this.config.routes[compare[0]];
                if (key) {
                    path = key + (compare.length > 1 ? "?" + compare[1] : "");
                }
            }
            return path;
        };
        HashRouter.prototype._detectPrefix = function () {
            var sufix = this.config.routerPrefix;
            this.sufix = "#" + ((typeof sufix === "undefined") ? "!" : sufix);
            this.prefix = document.location.href.split("#", 2)[0];
        };
        HashRouter.prototype._getRaw = function () {
            return document.location.href;
        };
        return HashRouter;
    }());
    var isPatched = false;
    function patch(w) {
        if (isPatched || !w) {
            return;
        }
        isPatched = true;
        var win = window;
        if (!win.Promise) {
            win.Promise = w.promise;
        }
        var version = w.version.split(".");
        if (version[0] * 10 + version[1] * 1 < 53) {
            w.ui.freeze = function (handler) {
                var res = handler();
                if (res && res.then) {
                    res.then(function (some) {
                        w.ui.$freeze = false;
                        w.ui.resize();
                        return some;
                    });
                }
                else {
                    w.ui.$freeze = false;
                    w.ui.resize();
                }
                return res;
            };
        }
        var baseAdd = w.ui.baselayout.prototype.addView;
        var baseRemove = w.ui.baselayout.prototype.removeView;
        var config = {
            addView: function (view, index) {
                if (this.$scope && this.$scope.webixJet && !view.queryView) {
                    var jview_1 = this.$scope;
                    var subs_1 = {};
                    view = jview_1.app.copyConfig(view, {}, subs_1);
                    baseAdd.apply(this, [view, index]);
                    var _loop_1 = function (key) {
                        jview_1._renderFrame(key, subs_1[key], null).then(function () {
                            jview_1._subs[key] = subs_1[key];
                        });
                    };
                    for (var key in subs_1) {
                        _loop_1(key);
                    }
                    return view.id;
                }
                else {
                    return baseAdd.apply(this, arguments);
                }
            },
            removeView: function () {
                baseRemove.apply(this, arguments);
                if (this.$scope && this.$scope.webixJet) {
                    var subs = this.$scope._subs;
                    for (var key in subs) {
                        var test = subs[key];
                        if (!w.$$(test.id)) {
                            test.view.destructor();
                            delete subs[key];
                        }
                    }
                }
            }
        };
        w.extend(w.ui.layout.prototype, config, true);
        w.extend(w.ui.baselayout.prototype, config, true);
        w.protoUI({
            name: "jetapp",
            $init: function (cfg) {
                this.$app = new this.app(cfg);
                var id = w.uid().toString();
                cfg.body = { id: id };
                this.$ready.push(function () {
                    this.callEvent("onInit", [this.$app]);
                    this.$app.render({ id: id });
                });
            }
        }, w.ui.proxy, w.EventSystem);
    }
    var JetApp = (function (_super) {
        __extends(JetApp, _super);
        function JetApp(config) {
            var _this = this;
            config.router = config.router || HashRouter;
            _this = _super.call(this, config) || this;
            patch(_this.webix);
            return _this;
        }
        JetApp.prototype.require = function (type, url) {
            return require(type + "/" + url);
        };
        return JetApp;
    }(JetAppBase));
    var UrlRouter = (function (_super) {
        __extends(UrlRouter, _super);
        function UrlRouter() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        UrlRouter.prototype._detectPrefix = function () {
            this.prefix = "";
            this.sufix = this.config.routerPrefix || "";
        };
        UrlRouter.prototype._getRaw = function () {
            return document.location.pathname + (document.location.search || "");
        };
        return UrlRouter;
    }(HashRouter));
    var EmptyRouter = (function () {
        function EmptyRouter(cb, _$config) {
            this.path = "";
            this.cb = cb;
        }
        EmptyRouter.prototype.set = function (path, config) {
            var _this = this;
            this.path = path;
            if (!config || !config.silent) {
                setTimeout(function () { return _this.cb(path); }, 1);
            }
        };
        EmptyRouter.prototype.get = function () {
            return this.path;
        };
        return EmptyRouter;
    }());
    function UnloadGuard(app, view, config) {
        view.on(app, "app:guard", function (_$url, point, promise) {
            if (point === view || point.contains(view)) {
                var res_1 = config();
                if (res_1 === false) {
                    promise.confirm = Promise.reject(new NavigationBlocked());
                }
                else {
                    promise.confirm = promise.confirm.then(function () { return res_1; });
                }
            }
        });
    }
    function has(store, key) {
        return Object.prototype.hasOwnProperty.call(store, key);
    }
    function forEach(obj, handler, context) {
        for (var key in obj) {
            if (has(obj, key)) {
                handler.call((context || obj), obj[key], key, obj);
            }
        }
    }
    function trim(str) {
        return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    }
    function warn(message) {
        message = 'Warning: ' + message;
        if (typeof console !== 'undefined') {
            console.error(message);
        }
        try {
            throw new Error(message);
        }
        catch (x) { }
    }
    var replace = String.prototype.replace;
    var split = String.prototype.split;
    var delimiter = '||||';
    var russianPluralGroups = function (n) {
        var end = n % 10;
        if (n !== 11 && end === 1) {
            return 0;
        }
        if (2 <= end && end <= 4 && !(n >= 12 && n <= 14)) {
            return 1;
        }
        return 2;
    };
    var pluralTypes = {
        arabic: function (n) {
            if (n < 3) {
                return n;
            }
            var lastTwo = n % 100;
            if (lastTwo >= 3 && lastTwo <= 10)
                return 3;
            return lastTwo >= 11 ? 4 : 5;
        },
        bosnian_serbian: russianPluralGroups,
        chinese: function () { return 0; },
        croatian: russianPluralGroups,
        french: function (n) { return n > 1 ? 1 : 0; },
        german: function (n) { return n !== 1 ? 1 : 0; },
        russian: russianPluralGroups,
        lithuanian: function (n) {
            if (n % 10 === 1 && n % 100 !== 11) {
                return 0;
            }
            return n % 10 >= 2 && n % 10 <= 9 && (n % 100 < 11 || n % 100 > 19) ? 1 : 2;
        },
        czech: function (n) {
            if (n === 1) {
                return 0;
            }
            return (n >= 2 && n <= 4) ? 1 : 2;
        },
        polish: function (n) {
            if (n === 1) {
                return 0;
            }
            var end = n % 10;
            return 2 <= end && end <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
        },
        icelandic: function (n) { return (n % 10 !== 1 || n % 100 === 11) ? 1 : 0; },
        slovenian: function (n) {
            var lastTwo = n % 100;
            if (lastTwo === 1) {
                return 0;
            }
            if (lastTwo === 2) {
                return 1;
            }
            if (lastTwo === 3 || lastTwo === 4) {
                return 2;
            }
            return 3;
        }
    };
    var pluralTypeToLanguages = {
        arabic: ['ar'],
        bosnian_serbian: ['bs-Latn-BA', 'bs-Cyrl-BA', 'srl-RS', 'sr-RS'],
        chinese: ['id', 'id-ID', 'ja', 'ko', 'ko-KR', 'lo', 'ms', 'th', 'th-TH', 'zh'],
        croatian: ['hr', 'hr-HR'],
        german: ['fa', 'da', 'de', 'en', 'es', 'fi', 'el', 'he', 'hi-IN', 'hu', 'hu-HU', 'it', 'nl', 'no', 'pt', 'sv', 'tr'],
        french: ['fr', 'tl', 'pt-br'],
        russian: ['ru', 'ru-RU'],
        lithuanian: ['lt'],
        czech: ['cs', 'cs-CZ', 'sk'],
        polish: ['pl'],
        icelandic: ['is'],
        slovenian: ['sl-SL']
    };
    function langToTypeMap(mapping) {
        var ret = {};
        forEach(mapping, function (langs, type) {
            forEach(langs, function (lang) {
                ret[lang] = type;
            });
        });
        return ret;
    }
    function pluralTypeName(locale) {
        var langToPluralType = langToTypeMap(pluralTypeToLanguages);
        return langToPluralType[locale]
            || langToPluralType[split.call(locale, /-/, 1)[0]]
            || langToPluralType.en;
    }
    function pluralTypeIndex(locale, count) {
        return pluralTypes[pluralTypeName(locale)](count);
    }
    function escape(token) {
        return token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    function constructTokenRegex(opts) {
        var prefix = (opts && opts.prefix) || '%{';
        var suffix = (opts && opts.suffix) || '}';
        if (prefix === delimiter || suffix === delimiter) {
            throw new RangeError('"' + delimiter + '" token is reserved for pluralization');
        }
        return new RegExp(escape(prefix) + '(.*?)' + escape(suffix), 'g');
    }
    var dollarRegex = /\$/g;
    var dollarBillsYall = '$$';
    var defaultTokenRegex = /%\{(.*?)\}/g;
    function transformPhrase(phrase, substitutions, locale, tokenRegex) {
        if (typeof phrase !== 'string') {
            throw new TypeError('Polyglot.transformPhrase expects argument #1 to be string');
        }
        if (substitutions == null) {
            return phrase;
        }
        var result = phrase;
        var interpolationRegex = tokenRegex || defaultTokenRegex;
        var options = typeof substitutions === 'number' ? { smart_count: substitutions } : substitutions;
        if (options.smart_count != null && result) {
            var texts = split.call(result, delimiter);
            result = trim(texts[pluralTypeIndex(locale || 'en', options.smart_count)] || texts[0]);
        }
        result = replace.call(result, interpolationRegex, function (expression, argument) {
            if (!has(options, argument) || options[argument] == null) {
                return expression;
            }
            return replace.call(options[argument], dollarRegex, dollarBillsYall);
        });
        return result;
    }
    function Polyglot(options) {
        var opts = options || {};
        this.phrases = {};
        this.extend(opts.phrases || {});
        this.currentLocale = opts.locale || 'en';
        var allowMissing = opts.allowMissing ? transformPhrase : null;
        this.onMissingKey = typeof opts.onMissingKey === 'function' ? opts.onMissingKey : allowMissing;
        this.warn = opts.warn || warn;
        this.tokenRegex = constructTokenRegex(opts.interpolation);
    }
    Polyglot.prototype.locale = function (newLocale) {
        if (newLocale)
            this.currentLocale = newLocale;
        return this.currentLocale;
    };
    Polyglot.prototype.extend = function (morePhrases, prefix) {
        forEach(morePhrases, function (phrase, key) {
            var prefixedKey = prefix ? prefix + '.' + key : key;
            if (typeof phrase === 'object') {
                this.extend(phrase, prefixedKey);
            }
            else {
                this.phrases[prefixedKey] = phrase;
            }
        }, this);
    };
    Polyglot.prototype.unset = function (morePhrases, prefix) {
        if (typeof morePhrases === 'string') {
            delete this.phrases[morePhrases];
        }
        else {
            forEach(morePhrases, function (phrase, key) {
                var prefixedKey = prefix ? prefix + '.' + key : key;
                if (typeof phrase === 'object') {
                    this.unset(phrase, prefixedKey);
                }
                else {
                    delete this.phrases[prefixedKey];
                }
            }, this);
        }
    };
    Polyglot.prototype.clear = function () {
        this.phrases = {};
    };
    Polyglot.prototype.replace = function (newPhrases) {
        this.clear();
        this.extend(newPhrases);
    };
    Polyglot.prototype.t = function (key, options) {
        var phrase, result;
        var opts = options == null ? {} : options;
        if (typeof this.phrases[key] === 'string') {
            phrase = this.phrases[key];
        }
        else if (typeof opts._ === 'string') {
            phrase = opts._;
        }
        else if (this.onMissingKey) {
            var onMissingKey = this.onMissingKey;
            result = onMissingKey(key, opts, this.currentLocale, this.tokenRegex);
        }
        else {
            this.warn('Missing translation for key: "' + key + '"');
            result = key;
        }
        if (typeof phrase === 'string') {
            result = transformPhrase(phrase, opts, this.currentLocale, this.tokenRegex);
        }
        return result;
    };
    Polyglot.prototype.has = function (key) {
        return has(this.phrases, key);
    };
    Polyglot.transformPhrase = function transform(phrase, substitutions, locale) {
        return transformPhrase(phrase, substitutions, locale);
    };
    var webixPolyglot = Polyglot;
    function Locale(app, _view, config) {
        config = config || {};
        var storage = config.storage;
        var lang = storage ? (storage.get("lang") || "en") : (config.lang || "en");
        function setLangData(name, data, silent) {
            if (data.__esModule) {
                data = data.default;
            }
            var pconfig = { phrases: data };
            if (config.polyglot) {
                app.webix.extend(pconfig, config.polyglot);
            }
            var poly = service.polyglot = new webixPolyglot(pconfig);
            poly.locale(name);
            service._ = app.webix.bind(poly.t, poly);
            lang = name;
            if (storage) {
                storage.put("lang", lang);
            }
            if (config.webix) {
                var locName = config.webix[name];
                if (locName) {
                    app.webix.i18n.setLocale(locName);
                }
            }
            if (!silent) {
                return app.refresh();
            }
            return Promise.resolve();
        }
        function getLang() { return lang; }
        function setLang(name, silent) {
            if (config.path === false) {
                return;
            }
            var path = (config.path ? config.path + "/" : "") + name;
            var data = app.require("jet-locales", path);
            setLangData(name, data, silent);
        }
        var service = {
            getLang: getLang, setLang: setLang, setLangData: setLangData,
            _: null, polyglot: null
        };
        app.setService("locale", service);
        setLang(lang, true);
    }
    function show(view, config, value) {
        var _a;
        if (config.urls) {
            value = config.urls[value] || value;
        }
        else if (config.param) {
            value = (_a = {}, _a[config.param] = value, _a);
        }
        view.show(value);
    }
    function Menu(app, view, config) {
        var frame = view.getSubViewInfo().parent;
        var ui = view.$$(config.id || config);
        var silent = false;
        ui.attachEvent("onchange", function () {
            if (!silent) {
                show(frame, config, this.getValue());
            }
        });
        ui.attachEvent("onafterselect", function () {
            if (!silent) {
                var id = null;
                if (ui.setValue) {
                    id = this.getValue();
                }
                else if (ui.getSelectedId) {
                    id = ui.getSelectedId();
                }
                show(frame, config, id);
            }
        });
        view.on(app, "app:route", function () {
            var name = "";
            if (config.param) {
                name = view.getParam(config.param, true);
            }
            else {
                var segment = frame.getUrl()[1];
                if (segment) {
                    name = segment.page;
                }
            }
            if (name) {
                silent = true;
                if (ui.setValue && ui.getValue() !== name) {
                    ui.setValue(name);
                }
                else if (ui.select && ui.exists(name) && ui.getSelectedId() !== name) {
                    ui.select(name);
                }
                silent = false;
            }
        });
    }
    var baseicons = {
        good: "check",
        error: "warning",
        saving: "refresh fa-spin"
    };
    var basetext = {
        good: "Ok",
        error: "Error",
        saving: "Connecting..."
    };
    function Status(app, view, config) {
        var status = "good";
        var count = 0;
        var iserror = false;
        var expireDelay = config.expire;
        if (!expireDelay && expireDelay !== false) {
            expireDelay = 2000;
        }
        var texts = config.texts || basetext;
        var icons = config.icons || baseicons;
        if (typeof config === "string") {
            config = { target: config };
        }
        function refresh(content) {
            var area = view.$$(config.target);
            if (area) {
                if (!content) {
                    content = "<div class='status_" +
                        status +
                        "'><span class='webix_icon fa-" +
                        icons[status] + "'></span> " + texts[status] + "</div>";
                }
                area.setHTML(content);
            }
        }
        function success() {
            count--;
            setStatus("good");
        }
        function fail(err) {
            count--;
            setStatus("error", err);
        }
        function start(promise) {
            count++;
            setStatus("saving");
            if (promise && promise.then) {
                promise.then(success, fail);
            }
        }
        function getStatus() {
            return status;
        }
        function hideStatus() {
            if (count === 0) {
                refresh(" ");
            }
        }
        function setStatus(mode, err) {
            if (count < 0) {
                count = 0;
            }
            if (mode === "saving") {
                status = "saving";
                refresh();
            }
            else {
                iserror = (mode === "error");
                if (count === 0) {
                    status = iserror ? "error" : "good";
                    if (iserror) {
                        app.error("app:error:server", [err.responseText || err]);
                    }
                    else {
                        if (expireDelay) {
                            setTimeout(hideStatus, expireDelay);
                        }
                    }
                    refresh();
                }
            }
        }
        function track(data) {
            var dp = app.webix.dp(data);
            if (dp) {
                view.on(dp, "onAfterDataSend", start);
                view.on(dp, "onAfterSaveError", function (_id, _obj, response) { return fail(response); });
                view.on(dp, "onAfterSave", success);
            }
        }
        app.setService("status", {
            getStatus: getStatus,
            setStatus: setStatus,
            track: track
        });
        if (config.remote) {
            view.on(app.webix, "onRemoteCall", start);
        }
        if (config.ajax) {
            view.on(app.webix, "onBeforeAjax", function (_mode, _url, _data, _request, _headers, _files, promise) {
                start(promise);
            });
        }
        if (config.data) {
            track(config.data);
        }
    }
    function Theme(app, _view, config) {
        config = config || {};
        var storage = config.storage;
        var theme = storage ?
            (storage.get("theme") || "flat-default")
            :
                (config.theme || "flat-default");
        var service = {
            getTheme: function () { return theme; },
            setTheme: function (name, silent) {
                var parts = name.split("-");
                var links = document.getElementsByTagName("link");
                for (var i = 0; i < links.length; i++) {
                    var lname = links[i].getAttribute("title");
                    if (lname) {
                        if (lname === name || lname === parts[0]) {
                            links[i].disabled = false;
                        }
                        else {
                            links[i].disabled = true;
                        }
                    }
                }
                app.webix.skin.set(parts[0]);
                app.webix.html.removeCss(document.body, "theme-" + theme);
                app.webix.html.addCss(document.body, "theme-" + name);
                theme = name;
                if (storage) {
                    storage.put("theme", name);
                }
                if (!silent) {
                    app.refresh();
                }
            }
        };
        app.setService("theme", service);
        service.setTheme(theme, true);
    }
    function copyParams(data, url, route) {
        for (var i = 0; i < route.length; i++) {
            data[route[i]] = url[i + 1] ? url[i + 1].page : "";
        }
    }
    function UrlParam(app, view, config) {
        var route = config.route || config;
        var data = {};
        view.on(app, "app:urlchange", function (subview, segment) {
            if (view === subview) {
                copyParams(data, segment.suburl(), route);
                segment.size(route.length + 1);
            }
        });
        var os = view.setParam;
        var og = view.getParam;
        view.setParam = function (name, value, show) {
            var index = route.indexOf(name);
            if (index >= 0) {
                data[name] = value;
                this._segment.update("", value, index + 1);
                if (show) {
                    return view.show(null);
                }
            }
            else {
                return os.call(this, name, value, show);
            }
        };
        view.getParam = function (key, mode) {
            var val = data[key];
            if (typeof val !== "undefined") {
                return val;
            }
            return og.call(this, key, mode);
        };
        copyParams(data, view.getUrl(), route);
    }
    function User(app, _view, config) {
        config = config || {};
        var login = config.login || "/login";
        var logout = config.logout || "/logout";
        var afterLogin = config.afterLogin || app.config.start;
        var afterLogout = config.afterLogout || "/login";
        var ping = config.ping || 5 * 60 * 1000;
        var model = config.model;
        var user = config.user;
        var service = {
            getUser: function () {
                return user;
            },
            getStatus: function (server) {
                if (!server) {
                    return user !== null;
                }
                return model.status().catch(function () { return null; }).then(function (data) {
                    user = data;
                });
            },
            login: function (name, pass) {
                return model.login(name, pass).then(function (data) {
                    user = data;
                    if (!data) {
                        throw new Error("Access denied");
                    }
                    app.callEvent("app:user:login", [user]);
                    app.show(afterLogin);
                });
            },
            logout: function () {
                user = null;
                return model.logout().then(function (res) {
                    app.callEvent("app:user:logout", []);
                    return res;
                });
            }
        };
        function canNavigate(url, obj) {
            if (url === logout) {
                service.logout();
                obj.redirect = afterLogout;
            }
            else if (url !== login && !service.getStatus()) {
                obj.redirect = login;
            }
        }
        app.setService("user", service);
        app.attachEvent("app:guard", function (url, _$root, obj) {
            if (config.public && config.public(url)) {
                return true;
            }
            if (typeof user === "undefined") {
                obj.confirm = service.getStatus(true).then(function () { return canNavigate(url, obj); });
            }
            return canNavigate(url, obj);
        });
        if (ping) {
            setInterval(function () { return service.getStatus(true); }, ping);
        }
    }
    var webix$1 = window.webix;
    if (webix$1) {
        patch(webix$1);
    }
    var plugins = {
        UnloadGuard: UnloadGuard, Locale: Locale, Menu: Menu, Theme: Theme, User: User, Status: Status, UrlParam: UrlParam
    };
    var w = window;
    if (!w.Promise) {
        w.Promise = w.webix.promise;
    }

    var index = 1;
    function uid() {
        return index++;
    }
    var empty = undefined;
<<<<<<< HEAD
=======
    function ignoreInitial(code) {
        var init = false;
        return function () {
            if (init)
                return code.apply(this, arguments);
            else
                init = true;
        };
    }
>>>>>>> 6388b01 (New widget Scheduler)
    var context = null;
    function link(source, target, key) {
        Object.defineProperty(target, key, {
            get: function () { return source[key]; },
            set: function (value) { return (source[key] = value); },
        });
    }
    function createState(data, config) {
        config = config || {};
        var handlers = {};
        var out = {};
        var observe = function (mask, handler) {
            var key = uid();
            handlers[key] = { mask: mask, handler: handler };
            if (mask === "*")
                handler(out, empty, mask);
            else
                handler(out[mask], empty, mask);
            return key;
        };
        var extend = function (data, sconfig) {
            sconfig = sconfig || config;
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    var test = data[key];
                    if (sconfig.nested && typeof test === "object" && test) {
                        out[key] = createState(test, sconfig);
                    }
                    else {
                        reactive(out, test, key, notify);
                    }
                }
            }
        };
        var observeEnd = function (id) {
            delete handlers[id];
        };
        var queue = [];
        var waitInQueue = false;
        var batch = function (code) {
            if (typeof code !== "function") {
                var values_1 = code;
                code = function () {
                    for (var key in values_1)
                        out[key] = values_1[key];
                };
            }
            waitInQueue = true;
            code(out);
            waitInQueue = false;
            while (queue.length) {
                var obj = queue.shift();
                notify.apply(this, obj);
            }
        };
        var notify = function (key, old, value, meta) {
            if (waitInQueue) {
                queue.push([key, old, value, meta]);
                return;
            }
            var list = Object.keys(handlers);
            for (var i = 0; i < list.length; i++) {
                var obj = handlers[list[i]];
                if (!obj)
                    continue;
                if (obj.mask === "*" || obj.mask === key) {
                    obj.handler(value, old, key, meta);
                }
            }
        };
        Object.defineProperty(out, "$changes", {
            value: {
                attachEvent: observe,
                detachEvent: observeEnd,
            },
            enumerable: false,
            configurable: false,
        });
        Object.defineProperty(out, "$observe", {
            value: observe,
            enumerable: false,
            configurable: false,
        });
        Object.defineProperty(out, "$batch", {
            value: batch,
            enumerable: false,
            configurable: false,
        });
        Object.defineProperty(out, "$extend", {
            value: extend,
            enumerable: false,
            configurable: false,
        });
        out.$extend(data, config);
        return out;
    }
    function reactive(obj, val, key, notify) {
        Object.defineProperty(obj, key, {
            get: function () {
                return val;
            },
            set: function (value) {
                var changed = false;
                if (val === null || value === null) {
                    changed = val !== value;
                }
                else {
                    changed = val.valueOf() != value.valueOf();
                }
                if (changed) {
                    var old = val;
                    val = value;
                    notify(key, old, value, context);
                }
            },
            enumerable: true,
            configurable: false,
        });
    }

<<<<<<< HEAD
=======
    var once = false;
    function initRLayout() {
        if (once)
            return;
        once = true;
        webix.protoUI({
            name: "r-layout",
            sizeTrigger: function (app, handler, value) {
                this._compactValue = value;
                this._compactHandler = handler;
                this._app = app;
                var config = app.config;
                this._forceCompact = typeof config.params.forceCompact !== "undefined";
                this._compactWidth = config.compactWidth;
                if (!this._forceCompact)
                    this._checkTrigger(this.$view.width, value);
            },
            _checkTrigger: function (x, value) {
                if (this._compactWidth) {
                    if ((x <= this._compactWidth && !value) ||
                        (x > this._compactWidth && value)) {
                        this._compactWidth = null;
                        this._compactHandler(!value);
                        return false;
                    }
                }
                return true;
            },
            $setSize: function (x, y) {
                if (this._forceCompact || this._checkTrigger(x, this._compactValue))
                    webix.ui.layout.prototype.$setSize.call(this, x, y);
                if (this._app)
                    this._app.callEvent("view:resize", []);
            },
        }, webix.ui.layout);
    }

    function initJetWin(app) {
        var appId;
        var service = {
            updateConfig: function (config) {
                var appView = app.getRoot();
                var appNode = appView.$view;
                if (!appId) {
                    if (appNode.id)
                        appId = appNode.id;
                    else
                        appNode.id = appId = "webix_" + webix.uid();
                    webix.html.addStyle(".webix_win_inside *:not(.webix_modal_box):not(.webix_modal_cover){ z-index: 0; }");
                    webix.html.addStyle("#" + appId + "{ position: relative; }");
                    webix.html.addStyle("#" + appId + " .webix_window{ z-index:2 !important; }");
                    webix.html.addStyle("#" + appId + " .webix_disabled{ z-index:1 !important; }");
                }
                else if (appId && !appNode.id)
                    appNode.id = appId;
                config.container = appId;
                if (config.fullscreen) {
                    config._fillApp = true;
                    delete config.fullscreen;
                }
                if (!config.on)
                    config.on = {};
                var firstShow = true;
                var defaultHandler = config.on.onShow;
                config.on.onShow = function () {
                    var _this = this;
                    if (defaultHandler)
                        defaultHandler.apply(this, arguments);
                    if (firstShow) {
                        this.$setSize = function (x, y) {
                            setSize(_this, appView, true);
                            webix.ui.window.prototype.$setSize.apply(_this, [x, y]);
                        };
                        setHandlers(this, app);
                        firstShow = null;
                    }
                    webix.callEvent("onClick", []);
                    webix.html.addCss(appNode, "webix_win_inside");
                    appView.disable();
                    setSize(this, appView);
                };
                return config;
            }
        };
        app.setService("jet-win", service);
    }
    function setSize(win, appView, silent) {
        var appWidth = appView.$width;
        var appHeight = appView.$height;
        if (win.config._fillApp)
            win.define({
                width: appWidth,
                height: appHeight,
            });
        else {
            win.define({
                left: (appWidth - win.$width) / 2,
                top: (appHeight - win.$height) / 2,
            });
        }
        if (!silent)
            win.resize();
    }
    function setHandlers(win, app) {
        var appView = app.getRoot();
        win.attachEvent("onHide", function () {
            if (!appView.$destructed) {
                webix.html.removeCss(appView.$view, "webix_win_inside");
                appView.enable();
            }
        });
        var resizeEv = app.attachEvent("view:resize", function () {
            setSize(win, appView);
        });
        win.attachEvent("onDestruct", function () {
            app.detachEvent(resizeEv);
        });
    }

    function waitVisible(view) {
        var promise = webix.promise.defer();
        var interval = setInterval(function () {
            var destructed = view.$destructed;
            if (destructed || view.isVisible()) {
                if (destructed)
                    promise.reject();
                else
                    promise.resolve();
                clearInterval(interval);
            }
        }, 300);
        return promise;
    }

>>>>>>> 6388b01 (New widget Scheduler)
    var AddView = (function (_super) {
        __extends(AddView, _super);
        function AddView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        AddView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            var compact = this.getParam("compact", true);
            var cals = this.app.config.calendars;
            var ui = {
                view: compact ? "icon" : "button",
                type: "icon",
                icon: "wxi-plus",
                css: "webix_primary",
                label: _("Create"),
                width: compact ? 50 : cals ? 185 : 100,
                height: compact ? 50 : webix.skin.$active.inputHeight,
                on: {
                    onItemClick: function () { return _this.AddEvent(); },
                },
            };
            return { view: "align", body: ui, align: "middle" };
        };
        AddView.prototype.AddEvent = function () {
            this.app.getState().selected = { id: "0" };
        };
        return AddView;
    }(JetView));

    var DateView = (function (_super) {
        __extends(DateView, _super);
        function DateView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DateView.prototype.config = function () {
            var _this = this;
            var toolbar = [
                {
                    view: "icon",
                    icon: "wxi-angle-left",
                    tooltip: function () { return _this.NavLabel(-1); },
                    align: "left",
                    on: { onItemClick: function () { return _this.ChangeDate(-1); } },
                },
                { view: "label", localId: "title", align: "center", width: 160 },
                {
                    view: "icon",
                    icon: "wxi-angle-right",
                    tooltip: function () { return _this.NavLabel(1); },
                    align: "right",
                    on: { onItemClick: function () { return _this.ChangeDate(1); } },
                },
            ];
            return {
                cols: toolbar,
            };
        };
        DateView.prototype.init = function () {
            var _this = this;
            this.State = this.app.getState();
            this.on(this.State.$changes, "date", function () { return _this.DateLabel(); });
            this.on(this.State.$changes, "mode", function () { return _this.DateLabel(); });
<<<<<<< HEAD
        };
        DateView.prototype.ChangeDate = function (dir) {
            var state = this.State;
            var step = state.mode == "agenda" ? "month" : state.mode;
=======
            if (this.app.config.timeline)
                this.on(this.State.$changes, "timelineMode", function () { return _this.DateLabel(); });
        };
        DateView.prototype.ChangeDate = function (dir) {
            var state = this.State;
            var step = this.GetStep(state.mode);
>>>>>>> 6388b01 (New widget Scheduler)
            var next = webix.Date.add(state.date, dir, step, true);
            if (state.mode === "month") {
                var diff = Math.abs(state.date.getMonth() - next.getMonth());
                if (diff != 1 && diff < 6)
                    next.setDate(0);
            }
            state.$batch({
                date: next,
                selected: null,
            });
        };
<<<<<<< HEAD
        DateView.prototype.DateLabel = function () {
            var date = this.State.date;
            var label = this.State.mode == "day"
                ? webix.i18n.longDateFormatStr(date)
                : webix.Date.dateToStr("%F %Y")(date);
            this.$$("title").setHTML(label);
=======
        DateView.prototype.GetStep = function (mode) {
            switch (mode) {
                case "agenda":
                    return "month";
                case "units":
                    return "day";
                case "timeline":
                    return this.State.timelineMode;
                default:
                    return mode;
            }
        };
        DateView.prototype.DateLabel = function () {
            var date = this.State.date;
            var mode = this.State.mode;
            var format = webix.Date.dateToStr("%F %Y");
            if (mode === "year")
                format = webix.Date.dateToStr("%Y");
            else if (mode == "day" ||
                mode == "units" ||
                (mode == "timeline" && this.State.timelineMode == "day"))
                format = webix.i18n.longDateFormatStr;
            this.$$("title").setHTML(format(date));
>>>>>>> 6388b01 (New widget Scheduler)
        };
        DateView.prototype.NavLabel = function (dir) {
            var _ = this.app.getService("locale")._;
            var modes = ["month", "week", "day"];
            var mode = this.State.mode;
            mode = modes.indexOf(mode) !== -1 ? " " + mode : "";
            dir = dir > 0 ? "Next" : "Previous";
            return _(dir + mode);
        };
        return DateView;
    }(JetView));

    var NavBarView = (function (_super) {
        __extends(NavBarView, _super);
        function NavBarView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        NavBarView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            var compact = this.getParam("compact", true);
<<<<<<< HEAD
=======
            var units = !!this.app.config.units;
>>>>>>> 6388b01 (New widget Scheduler)
            var toolbar = {
                hidden: compact,
                view: "tabbar",
                bottomOffset: 0,
                localId: "buttons",
                borderless: true,
                width: 320,
                optionWidth: 80,
                options: [
                    { id: "day", value: _("Day") },
                    { id: "week", value: _("Week") },
                    { id: "month", value: _("Month") },
                    { id: "agenda", value: _("Agenda") },
<<<<<<< HEAD
                ],
            };
            if (!compact) {
                toolbar.on = { onChange: function (val) { return _this.SetMode(val); } };
            }
=======
                    { id: "year", value: _("Year") },
                ],
            };
            if (this.app.config.timeline) {
                toolbar.width += 80;
                toolbar.options.push({ id: "timeline", value: _("Timeline") });
            }
            if (!compact) {
                toolbar.on = { onChange: function (val) { return _this.SetMode(val); } };
            }
            if (units) {
                toolbar.width += 80;
                toolbar.options.push({ id: "units", value: _("Units") });
            }
>>>>>>> 6388b01 (New widget Scheduler)
            return toolbar;
        };
        NavBarView.prototype.init = function () {
            var _this = this;
            this.State = this.app.getState();
            this.on(this.State.$changes, "mode", function (val) {
                _this.$$("buttons").setValue(val);
            });
        };
        NavBarView.prototype.SetMode = function (val) {
            this.State.$batch({
                mode: val,
                selected: null,
            });
        };
        return NavBarView;
    }(JetView));

<<<<<<< HEAD
=======
    var defaultPalette = [
        ["#61AEE6", "#01C2A5", "#E88DD9", "#D2FB9E", "#6BA8CB", "#61BBA5", "#CF89D5"],
        ["#EF9C80", "#8289EE", "#74B1A7", "#DD89AF", "#E48882", "#997CEB", "#ADD579"],
        ["#F68896", "#FFE999", "#6D4BCE", "#99CA58", "#D352BE", "#F7CC34", "#DA5C53"],
    ];
    var modernPalette = [
        ["#5890DC", "#3AA3E3", "#045AA3", "#014593", "#01C2A5", "#61A649", "#157B7A"],
        ["#04864F", "#AD44AB", "#CB61C8", "#AC3C6E", "#BA282E", "#BD4E1B", "#B87728"],
        ["#B65F06", "#7A67EB", "#4536AD", "#282A8A", "#36337E", "#585B85", "#2A2F50"],
    ];
    var palettes = {
        material: defaultPalette,
        mini: defaultPalette,
        flat: defaultPalette,
        compact: defaultPalette,
        contrast: defaultPalette,
        willow: modernPalette,
        dark: modernPalette,
    };
>>>>>>> 6388b01 (New widget Scheduler)
    function getPalette() {
        var aSkin = webix.skin.$active;
        return {
            view: "colorboard",
            css: "webix_scheduler_palette",
            height: aSkin.optionHeight * 3 + 4,
            width: aSkin.optionHeight * 7 + 4,
<<<<<<< HEAD
            palette: [
                [
                    "#61AEE6",
                    "#01C2A5",
                    "#E88DD9",
                    "#D2FB9E",
                    "#6BA8CB",
                    "#61BBA5",
                    "#CF89D5",
                ],
                [
                    "#EF9C80",
                    "#8289EE",
                    "#74B1A7",
                    "#DD89AF",
                    "#E48882",
                    "#997CEB",
                    "#ADD579",
                ],
                [
                    "#F68896",
                    "#FFE999",
                    "#6D4BCE",
                    "#99CA58",
                    "#D352BE",
                    "#F7CC34",
                    "#DA5C53",
                ],
            ],
=======
            palette: palettes[webix.skin.$name],
>>>>>>> 6388b01 (New widget Scheduler)
        };
    }

    var SidePopupView = (function (_super) {
        __extends(SidePopupView, _super);
        function SidePopupView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        SidePopupView.prototype.config = function () {
            var _this = this;
            var compact = this.getParam("compact", true);
            var _ = this.app.getService("locale")._;
            var save = {
                view: "button",
                value: _("Save"),
                align: "right",
                inputWidth: 100,
                css: "webix_primary",
                click: function () { return _this.Save(); },
            };
            var aSkin = webix.skin.$active;
            var compactBar = {
                view: "toolbar",
                padding: {
                    left: aSkin.layoutPadding.form - (aSkin.inputHeight - 20) / 2,
                    right: aSkin.layoutPadding.form,
                },
                elements: [
                    { view: "icon", icon: "wxi-close", click: function () { return _this.getRoot().hide(); } },
                    {},
                    save,
                ],
            };
            var controls = [
                {
                    view: "button",
                    localId: "removeBtn",
                    value: _("Delete"),
                    css: "webix_danger webix_scheduler_danger",
                    hidden: true,
                    align: compact ? "center" : "left",
                    inputWidth: compact ? 330 : 100,
                    click: function () { return _this.Delete(); },
                },
            ];
            if (!compact)
                controls.push(save);
<<<<<<< HEAD
            var ui = {
                view: "window",
                width: 400,
                modal: true,
                close: true,
                position: "center",
=======
            var ui = this.app.getService("jet-win").updateConfig({
                view: "window",
                width: 400,
                close: true,
>>>>>>> 6388b01 (New widget Scheduler)
                borderless: compact,
                fullscreen: compact,
                css: "webix_scheduler_cal_popup",
                head: compact ? compactBar : _("Edit calendar"),
                body: {
                    view: "form",
                    localId: "calendars:form",
                    elements: [
                        { view: "text", label: _("Title"), name: "text" },
                        {
                            view: "colorpicker",
                            label: _("Color"),
                            name: "color",
                            suggest: {
                                type: "colorboard",
                                padding: 3,
                                body: getPalette(),
                            },
                        },
                        { view: "checkbox", label: _("Active"), name: "active" },
                        { cols: controls },
                    ],
                },
                on: {
                    onHide: function () {
                        _this.Form.clear();
                        _this.$$("removeBtn").hide();
                    },
                },
<<<<<<< HEAD
            };
=======
            });
>>>>>>> 6388b01 (New widget Scheduler)
            if (compact)
                ui.body.elements.splice(3, 0, {});
            return ui;
        };
        SidePopupView.prototype.init = function () {
            this.Cals = this.app.getService("local").calendars(true);
            this.Ops = this.app.getService("operations");
            this.Form = this.$$("calendars:form");
        };
        SidePopupView.prototype.Show = function (id) {
            if (id) {
                var obj = this.Cals.getItem(id);
                this.Form.setValues(obj);
                this.$$("removeBtn").show();
            }
            else {
                this.Form.setValues({
                    color: "#997CEB",
                    active: 1,
                });
            }
            this.getRoot().show();
            this.Form.focus();
        };
        SidePopupView.prototype.Save = function () {
            var obj = this.Form.getValues();
            if (obj.id)
                this.Ops.updateCalendar(obj.id, obj);
            else
                this.Ops.addCalendar(obj);
            this.getRoot().hide();
        };
        SidePopupView.prototype.Delete = function () {
            var _this = this;
            var obj = this.Form.getValues();
            var _ = this.app.getService("locale")._;
<<<<<<< HEAD
            webix.confirm(_("Do you really want to remove this calendar?")).then(function () {
=======
            webix
                .confirm({
                text: _("Do you really want to remove this calendar?"),
                container: this.app.getRoot().$view,
            })
                .then(function () {
>>>>>>> 6388b01 (New widget Scheduler)
                _this.Ops.removeCalendar(obj.id);
                _this.getRoot().hide();
            });
        };
        return SidePopupView;
    }(JetView));

    var SidePopupView$1 = (function (_super) {
        __extends(SidePopupView$1, _super);
        function SidePopupView$1() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        SidePopupView$1.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            var ui = {
                view: "popup",
                relative: "right",
                body: {
                    rows: [
                        webix.extend(getPalette(), {
                            localId: "colors",
                            on: {
                                onItemClick: function (val) { return _this.UpdateColor(val); },
                            },
                        }),
                        {
                            css: "webix_scheduler_settings",
                            template: _("Settings"),
                            height: webix.skin.$active.inputHeight,
                            onClick: {
                                webix_template: function () { return _this.ShowEditor(); },
                            },
                        },
                    ],
                },
                on: {
                    onHide: function () { return _this.app.callEvent("side:popup:hide", []); },
                },
            };
            return ui;
        };
        SidePopupView$1.prototype.init = function () {
<<<<<<< HEAD
            this.Editor = this.ui(SidePopupView);
=======
            var _this = this;
            waitVisible(this.getRoot()).then(function () {
                _this.Editor = _this.ui(SidePopupView);
            });
>>>>>>> 6388b01 (New widget Scheduler)
        };
        SidePopupView$1.prototype.Show = function (id, node, color) {
            this.Cid = id;
            this.getRoot().show(node);
            this.$$("colors").setValue(color);
        };
        SidePopupView$1.prototype.ShowEditor = function () {
            this.Editor.Show(this.Cid);
            this.getRoot().hide();
        };
        SidePopupView$1.prototype.UpdateColor = function (val) {
            this.app.getService("operations").updateCalendar(this.Cid, {
                color: val,
            });
            this.getRoot().hide();
        };
        SidePopupView$1.prototype.Hide = function () {
            this.getRoot().hide();
        };
        return SidePopupView$1;
    }(JetView));

    var SideView = (function (_super) {
        __extends(SideView, _super);
        function SideView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        SideView.prototype.config = function () {
            var _this = this;
            this.Compact = this.getParam("compact", true);
            var _ = this.app.getService("locale")._;
            var state = this.app.getState();
            var calendar = {
                view: "calendar",
                localId: "calendar",
                height: 276,
                monthSelect: false,
                on: {
<<<<<<< HEAD
                    onDateSelect: function (date) {
=======
                    onAfterDateSelect: function (date) {
>>>>>>> 6388b01 (New widget Scheduler)
                        state.date = webix.Date.dayStart(date);
                    },
                },
            };
            var list = {
                view: "list",
                localId: "calendars",
                type: this.ListType(_, state),
                borderless: true,
                autoheight: true,
                yCount: 5,
                editable: true,
                editValue: "text",
                editaction: "custom",
                editor: "text",
                css: "webix_scheduler_cal_list",
                tooltip: function () { return ""; },
                onClick: {
                    webix_scheduler_cal_edit: function (e, id) { return _this.ShowPopup(e, id); },
                    webix_scheduler_cal_title: function (e, id) { return _this.ToggleCalendar(id); },
                    webix_scheduler_active: function (e, id) { return _this.ToggleCalendar(id); },
                },
                on: {
                    onBeforeEditStop: function (v, editor) { return _this.SetTitle(editor.id, v.value); },
                },
            };
            var rows = [
                { maxHeight: 100 },
                list,
                {
                    view: "button",
                    localId: "add",
                    value: _("Add calendar"),
                    hidden: !state.readonly,
                    inputWidth: 190,
                    align: "center",
                    click: function () { return _this.AddCalendar(); },
                },
                {},
            ];
            var side = {
                type: "form",
                padding: { top: 8 },
                rows: rows,
            };
            if (!this.Compact) {
                list.on.onAfterScroll = function () { return _this.Popup.Hide(); };
                side = {
                    view: "scrollview",
                    body: {
                        type: "clean",
                        rows: [calendar, side],
                    },
                };
            }
            return side;
        };
        SideView.prototype.init = function () {
            var _this = this;
            this.Cals = this.$$("calendars");
            this.Data = this.app.getService("local");
            this.Ops = this.app.getService("operations");
            this.Popup = this.Compact ? this.ui(SidePopupView) : this.ui(SidePopupView$1);
            webix.extend(this.Cals, webix.EditAbility);
            this.Data.calendars().then(function (data) { return _this.Cals.parse(data); });
            var state = this.app.getState();
            if (!this.Compact) {
                this.on(state.$changes, "date", function (value) {
                    _this.$$("calendar").setValue(value);
                });
                this.on(this.app, "side:popup:hide", function () {
                    _this.Cals.unselectAll();
                });
            }
            this.on(state.$changes, "readonly", function (value) { return _this.ToggleState(value); });
        };
        SideView.prototype.ListType = function (_, state) {
            return {
                checkbox: function (obj) {
                    var icon = obj.active * 1 ? "wxi-checkbox-marked" : "wxi-checkbox-blank";
                    return "<span style=\"color:" + obj.color + ";\" \n\t\t\t\t\trole=\"checkbox\" tabindex=\"-1\" \n\t\t\t\t\taria-checked=\"" + (obj.active ? "true" : "false") + "\" \n\t\t\t\t\tclass=\"webix_icon webix_scheduler_active " + icon + "\">\n\t\t\t\t</span>";
                },
                template: function (obj, common) {
                    var edit = "\n\t\t\t\t\t<span\n\t\t\t\t\t\twebix_tooltip=\"" + _("Edit calendar") + "\" \n\t\t\t\t\t\tclass=\"webix_icon wxi-dots webix_scheduler_cal_edit \n\t\t\t\t\t\t\t" + (webix.env.touch ? " webix_scheduler_cal_visible" : "") + "\n\t\t\t\t\t\t\">\n\t\t\t\t\t</span>\n\t\t\t\t";
                    return "\n\t\t\t\t\t" + common.checkbox(obj) + "\n\t\t\t\t\t<span class=\"webix_scheduler_cal_title\">" + (obj.text || _("(no title)")) + "</span>\n\t\t\t\t\t" + (state.readonly ? "" : edit) + "\n\t\t\t\t";
                },
            };
        };
        SideView.prototype.AddCalendar = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            this.Ops.addCalendar().then(function (id) {
                _this.Cals.edit(id);
                _this.Cals.getEditor()
                    .getInputNode()
                    .setAttribute("placeholder", _("(no title)"));
            });
        };
        SideView.prototype.ShowPopup = function (e, id) {
            if (!this.Compact) {
                this.Cals.select(id);
                var color = this.Cals.getItem(id).color;
                this.Popup.Show(id, this.Cals.getItemNode(id), color);
            }
            else
                this.Popup.Show(id);
        };
        SideView.prototype.ToggleCalendar = function (id) {
            var obj = this.Cals.getItem(id);
            this.Ops.updateCalendar(id, { active: obj.active ^ 1 });
        };
        SideView.prototype.ToggleState = function (value) {
            var add = this.$$("add");
            if (value)
                add.hide();
            else
                add.show();
            this.Cals.refresh();
        };
        SideView.prototype.SetTitle = function (id, text) {
            var _this = this;
            this.Ops.updateCalendar(id, { text: text }).then(function () { return _this.EditStopSilent(); }, function () { return _this.EditStopSilent(true); });
            return false;
        };
        SideView.prototype.EditStopSilent = function (fail) {
            this.Cals.blockEvent();
            if (fail)
                this.Cals.editCancel();
            else
                this.Cals.editStop();
            this.Cals.unblockEvent();
        };
        return SideView;
    }(JetView));

    var NavPopupView = (function (_super) {
        __extends(NavPopupView, _super);
        function NavPopupView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        NavPopupView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
<<<<<<< HEAD
=======
            var units = !!this.app.config.units;
>>>>>>> 6388b01 (New widget Scheduler)
            var list = {
                view: "list",
                css: "webix_scheduler_navlist",
                localId: "modes",
                autoheight: true,
                data: [
                    { id: "day", value: _("Day"), icon: "shi-day" },
                    { id: "week", value: _("Week"), icon: "shi-week" },
                    { id: "month", value: _("Month"), icon: "shi-month" },
                    { id: "agenda", value: _("Agenda"), icon: "shi-agenda" },
<<<<<<< HEAD
=======
                    { id: "year", value: _("Year"), icon: "shi-year" },
>>>>>>> 6388b01 (New widget Scheduler)
                ],
                on: {
                    onItemClick: function (id) { return _this.SetMode(id); },
                },
            };
<<<<<<< HEAD
            var ui = {
                view: "sidemenu",
=======
            if (units) {
                list.data.push({ id: "units", value: _("Units"), icon: "shi-units" });
            }
            if (this.app.config.timeline) {
                list.data.push({
                    id: "timeline",
                    value: _("Timeline"),
                    icon: "shi-timeline",
                });
            }
            var ui = {
                view: "sidemenu",
                animate: false,
>>>>>>> 6388b01 (New widget Scheduler)
                borderless: true,
                css: "webix_scheduler_sidemenu",
                width: 300,
                state: function (state) {
                    var tHeight = webix.skin.$active.tabbarHeight + 10;
<<<<<<< HEAD
                    state.top = tHeight + 2;
                    state.height -= tHeight - 2;
=======
                    state.left = _this.Parent.left;
                    state.top = _this.Parent.top + tHeight + 2;
                    state.height = _this.Parent.height - tHeight - 2;
>>>>>>> 6388b01 (New widget Scheduler)
                },
                body: list,
            };
            if (this.app.config.calendars)
                ui.body = {
                    view: "scrollview",
                    body: {
                        type: "clean",
                        rows: [list, SideView],
                    },
                };
            return ui;
        };
        NavPopupView.prototype.init = function () {
<<<<<<< HEAD
            this.State = this.app.getState();
        };
        NavPopupView.prototype.Show = function () {
            var win = this.getRoot();
            if (!win.isVisible()) {
                this.$$("modes").select(this.State.mode);
                win.show();
            }
=======
            var _this = this;
            this.State = this.app.getState();
            this.on(this.app, "view:resize", function () {
                if (_this.getRoot().isVisible())
                    _this.Show(true);
            });
        };
        NavPopupView.prototype.Show = function (updatePos) {
            if (!updatePos && this.getRoot().isVisible())
                return;
            this.Parent = this.app.getRoot().$view.getBoundingClientRect();
            this.$$("modes").select(this.State.mode);
            this.getRoot().show();
>>>>>>> 6388b01 (New widget Scheduler)
        };
        NavPopupView.prototype.SetMode = function (value) {
            var _this = this;
            this.getRoot().hide();
            setTimeout(function () { return _this.State.$batch({ mode: value, selected: null }); }, 500);
        };
        return NavPopupView;
    }(JetView));

    var TopBarView = (function (_super) {
        __extends(TopBarView, _super);
        function TopBarView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TopBarView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            this.Compact = this.getParam("compact", true);
            var todayIcon = {
                view: "icon",
                icon: "wxi-calendar",
                batch: "compact",
                tooltip: _("Today"),
                click: function () { return _this.SetToday(); },
            };
            var todayBtn = {
                view: "align",
                align: "middle",
                batch: "full",
                body: {
                    width: 80,
                    view: "button",
                    css: "webix_transparent",
                    value: _("Today"),
                    click: function () { return _this.SetToday(); },
                },
            };
            var ui = {
                view: "toolbar",
                css: "webix_scheduler_toolbar webix_dark",
                responsive: true,
                paddingY: 0,
                paddingX: 4,
                height: webix.skin.$active.tabbarHeight + 10,
                visibleBatch: this.Compact ? "compact" : "full",
                cols: [
                    {
                        view: "icon",
                        icon: "shi-menu",
                        click: function () { return _this.ShowNav(); },
                        hidden: !this.Compact && !this.app.config.calendars,
                        responsiveCell: false,
                    },
                    {
                        view: "proxy",
                        localId: "add",
                        borderless: true,
                        body: AddView,
                        batch: "full",
                        responsiveCell: false,
                    },
                    {},
                    {
                        view: "proxy",
                        borderless: true,
                        body: DateView,
                        responsiveCell: false,
                    },
                    {},
                    todayBtn,
<<<<<<< HEAD
=======
                    { width: 12 },
>>>>>>> 6388b01 (New widget Scheduler)
                    NavBarView,
                    todayIcon,
                ],
            };
            return ui;
        };
        TopBarView.prototype.init = function () {
            var _this = this;
            this.State = this.app.getState();
            if (this.Compact)
                this.NavPopup = this.ui(NavPopupView);
            this.on(this.State.$changes, "readonly", function (value) {
                _this.ToggleAdd(value);
            });
        };
        TopBarView.prototype.SetToday = function () {
            this.State.date = webix.Date.dayStart(new Date());
        };
        TopBarView.prototype.ShowNav = function () {
            if (this.Compact)
                this.NavPopup.Show();
            else
                this.app.callEvent("show:panel");
        };
        TopBarView.prototype.ToggleAdd = function (value) {
            var add = this.$$("add");
            if (value)
                add.hide();
            else if (!this.Compact)
                add.show();
        };
        return TopBarView;
    }(JetView));

    var EventActionMenu = (function (_super) {
        __extends(EventActionMenu, _super);
        function EventActionMenu() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        EventActionMenu.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            return {
                view: "popup",
                body: {
                    view: "menu",
                    layout: "y",
                    width: 220,
                    autoheight: true,
                    data: [
                        { id: "this", value: _("This event") },
                        { id: "next", value: _("This event and the following") },
                        { id: "all", value: _("All events") },
                    ],
                    on: {
                        onMenuItemClick: function (id) {
                            if (_this.Result)
                                _this.Result.resolve(id);
                            _this.Result = null;
                            _this.Root.hide();
                        },
                    },
                },
                on: {
                    onHide: function () {
                        if (_this.Result)
                            _this.Result.reject();
                        _this.Result = null;
                    },
                },
            };
        };
        EventActionMenu.prototype.init = function (view) {
            this.Root = view;
        };
<<<<<<< HEAD
        EventActionMenu.prototype.Show = function (node, promise) {
            this.Result = promise;
            this.Root.show(node);
=======
        EventActionMenu.prototype.Show = function (node) {
            this.Result = webix.promise.defer();
            this.Root.show(node);
            return this.Result;
>>>>>>> 6388b01 (New widget Scheduler)
        };
        return EventActionMenu;
    }(JetView));

<<<<<<< HEAD
=======
    function shrinkTo(start, end) {
        return function (ev) {
            var before = ev.start_date <= start;
            var after = ev.end_date >= end;
            if (before || after) {
                var t = webix.copy(ev);
                if (before)
                    t.start_date = start;
                if (after)
                    t.end_date = end;
                return t;
            }
            return ev;
        };
    }
    function isToday(date) {
        return webix.Date.equal(webix.Date.datePart(date), webix.Date.datePart(new Date()));
    }
    function isMultiDay(ev) {
        return (ev.all_day ||
            (ev.start_date.getDate() != ev.end_date.getDate() &&
                ev.end_date - ev.start_date >= 1000 * 60 * 60 * 24 * 1));
    }
    function daysBetweenInclusive(start, end) {
        var millisecondsPerDay = 24 * 60 * 60 * 1000;
        return Math.round((webix.Date.dayStart(end) - webix.Date.dayStart(start)) / millisecondsPerDay);
    }
    function isSameDate(adate, bdate) {
        return webix.Date.equal(webix.Date.dayStart(adate), webix.Date.dayStart(bdate));
    }
    function getYearDay(date) {
        var start = webix.Date.yearStart(date);
        return (date - start) / 1000 / 60 / 60 / 24 + 1;
    }

>>>>>>> 6388b01 (New widget Scheduler)
    var icalFormat = webix.Date.dateToStr("%Y%m%dT000000Z");
    function parse$1(string) {
        var parts = string.split(";");
        var config = {};
        for (var i = 0; i < parts.length; i++) {
            var _a = parts[i].split("="), code = _a[0], name_1 = _a[1];
            config[code] = name_1;
        }
        if (config.UNTIL)
            config.UNTIL = strToDate(config.UNTIL);
        if (config.EXDATE) {
            config.EXDATE = config.EXDATE.split(",").map(function (d) { return strToDate(d); });
        }
        return config;
    }
    function strToDate(str) {
        return new Date(str.substr(0, 4) * 1, str.substr(4, 2) * 1 - 1, str.substr(6, 2) * 1);
    }
    function serialize(config) {
        var str = [];
        for (var key in config) {
            var value = config[key];
            if (key === "UNTIL")
                value = icalFormat(value);
            if (key === "EXDATE") {
                value = value.map(function (d) { return icalFormat(d); });
                value = value.join(",");
            }
            if (value)
                str.push(key + "=" + value);
        }
        return str.join(";");
    }

    var WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
    var FREQUENCE = {
        DAILY: "day",
        WEEKLY: "week",
        MONTHLY: "month",
        YEARLY: "year",
    };
    function explodeEvent(sdate, edate, ev) {
        var mode = ev.$recurring;
<<<<<<< HEAD
        if (mode.FREQ === "WEEKLY" && !mode.BYDAY)
            mode.BYDAY = WEEKDAYS[ev.start_date.getDay()];
        if ((mode.FREQ === "MONTHLY" || mode.FREQ === "YEARLY") &&
            !mode.BYSETPOS &&
            !mode.BYMONTHDAY)
            mode.BYMONTHDAY = ev.start_date.getDate();
        if (mode.FREQ === "YEARLY" && !mode.BYMONTH)
            mode.BYMONTH = ev.start_date.getMonth();
=======
>>>>>>> 6388b01 (New widget Scheduler)
        var consts = {};
        var res = [];
        fillWdays(mode, consts);
        var xdate = new Date(ev.start_date);
        var length = ev.end_date - ev.start_date;
        var count = 1;
        while ((sdate - xdate >= (length || 1) &&
            (!mode.UNTIL || xdate < mode.UNTIL) &&
            (!mode.COUNT || count <= mode.COUNT)) ||
            findDate(mode.EXDATE, xdate)) {
            ++count;
            next(xdate, mode, consts);
        }
        while (edate > xdate &&
            (!mode.UNTIL || xdate < mode.UNTIL) &&
            (!mode.COUNT || count <= mode.COUNT)) {
            if (!findDate(mode.EXDATE, xdate)) {
                var copy = webix.copy(ev);
                xdate.setHours(ev.start_date.getHours());
                copy.start_date = new Date(xdate);
                copy.end_date = new Date(xdate * 1 + length);
                copy.$id = ev.id;
                copy.id = copy.start_date.valueOf() + "_" + ev.id;
                res.push(copy);
            }
            count++;
            next(xdate, mode, consts);
        }
        return res;
    }
    function findDate(arr, date) {
        if (!arr)
            return false;
        for (var i = 0; i < arr.length; ++i) {
            if (webix.Date.equal(webix.Date.dayStart(date), arr[i]))
                return true;
        }
        return false;
    }
    function fillWdays(mode, consts) {
        if (mode.BYDAY) {
            var diff = (consts.wdays = [0, 0, 0, 0, 0, 0, 0]);
            var line = mode.BYDAY.split(",")
                .map(function (a) { return WEEKDAYS.indexOf(a); })
                .sort();
            for (var i = 0; i < line.length; i++) {
                var s = line[i];
                var e = line[i + 1] || line[0] + 7;
                for (var j = s; j < e; j++) {
                    diff[j % 7] = e - j;
                }
            }
        }
    }
    function next(date, mode, consts) {
        var interval = (mode.INTERVAL || 1) * 1;
<<<<<<< HEAD
        if (mode.FREQ == "YEARLY")
            interval *= 12;
=======
>>>>>>> 6388b01 (New widget Scheduler)
        var now, step;
        switch (mode.FREQ) {
            case "DAILY":
                date.setDate(date.getDate() + interval);
                break;
            case "WEEKLY":
                now = date.getDay();
                step = consts.wdays ? consts.wdays[now] : 7;
                if (step + now > 6 && interval > 1) {
                    step += 7 * (interval - 1);
                }
                date.setDate(date.getDate() + step);
                break;
<<<<<<< HEAD
            case "YEARLY":
=======
            case "YEARLY": {
                if (mode.BYYEARDAY) {
                    date.setFullYear(date.getFullYear() + interval);
                    date.setMonth(0);
                    date.setDate(1);
                    date.setDate(mode.BYYEARDAY);
                    break;
                }
                interval *= 12;
            }
>>>>>>> 6388b01 (New widget Scheduler)
            case "MONTHLY":
                now = date.getMonth();
                date.setDate(1);
                date.setMonth(now + interval);
                if (mode.BYMONTHDAY) {
                    date.setDate(mode.BYMONTHDAY);
                    if ((now + interval) % 12 != date.getMonth())
                        date.setDate(0);
                }
                else if (mode.BYSETPOS) {
                    date.setDate(0);
                    for (var i = 0; i < mode.BYSETPOS; i++) {
                        step = consts.wdays[date.getDay()];
                        date.setDate(date.getDate() + step);
                    }
                }
                break;
        }
        return date;
    }
    function checkDay(sdate, mode) {
        var start = new Date(sdate);
        var days = mode.BYDAY.split(",");
        var oldDay = WEEKDAYS[start.getDay()];
<<<<<<< HEAD
        var result = days.includes(oldDay);
        return { result: result, start: start, days: days, oldDay: oldDay };
    }
    function datesToRec(sdate, edate, mode) {
        if (mode.FREQ === "WEEKLY") {
            var _a = checkDay(sdate, mode), result = _a.result, start = _a.start, days = _a.days;
            if (result) {
                return [null, null];
            }
            var diff = WEEKDAYS.indexOf(days[0]) - start.getDay();
            start.setDate(start.getDate() + diff);
            var end = new Date(edate);
            end.setDate(end.getDate() + diff);
            return [start, end];
        }
        return [null, null];
    }
    function recToDate(sdate, mode) {
=======
        var result = days.indexOf(oldDay) !== -1;
        return { result: result, start: start, days: days, oldDay: oldDay };
    }
    function datesToWeekdays(sdate, edate, mode) {
        var _a = checkDay(sdate, mode), result = _a.result, start = _a.start, days = _a.days;
        if (result) {
            return [sdate, edate];
        }
        var diff = WEEKDAYS.indexOf(days[0]) - start.getDay();
        start.setDate(start.getDate() + diff);
        var end = new Date(edate);
        end.setDate(end.getDate() + diff);
        return [start, end];
    }
    function WeekdaysToDates(sdate, mode) {
>>>>>>> 6388b01 (New widget Scheduler)
        var _a = checkDay(sdate, mode), result = _a.result, days = _a.days, oldDay = _a.oldDay;
        if (result) {
            return mode.BYDAY;
        }
        if (mode.FREQ === "WEEKLY") {
            days.splice(WEEKDAYS.indexOf(days[0]), 0, oldDay);
        }
        else {
            days = [oldDay];
        }
        return days.join(",");
    }
    function getParams(obj) {
        return { id: obj.$id || obj.id, date: obj.$recurring ? obj.id : null };
    }
    function extractDate(sdate) {
        return webix.Date.dayStart(sdate.getDate ? sdate : new Date(sdate.split("_")[0] * 1));
    }
    function clipSequence(sdate, ev, block) {
        var date = extractDate(sdate);
        if (!block || (!ev.$recurring.UNTIL || ev.$recurring.UNTIL > date))
            ev.$recurring.UNTIL = date;
        if (ev.$recurring.COUNT)
            delete ev.$recurring.COUNT;
        if (ev.$recurring.EXDATE) {
            ev.$recurring.EXDATE = ev.$recurring.EXDATE.filter(function (d) { return d < date; });
        }
        return serialize(ev.$recurring);
    }
    function cutOccurrence(sdate, ev) {
        var date = extractDate(sdate);
        if (!ev.$recurring.EXDATE)
            ev.$recurring.EXDATE = [];
        ev.$recurring.EXDATE.push(date);
        return serialize(ev.$recurring);
    }
    function separateSequence(obj, sdate) {
        var start_date = typeof sdate === "string"
            ? new Date(sdate.split("_")[0] * 1)
            : new Date(sdate);
        var len = (obj.end_date - obj.start_date) / 1000 / 60;
        var end_date = webix.Date.add(start_date, len, "minute", true);
        return { start_date: start_date, end_date: end_date };
    }
    function isFirstOccurrence(sdate, evStart) {
        if (!sdate)
            return false;
        var od = sdate.getDate ? sdate : new Date(sdate.split("_")[0] * 1);
        return od <= evStart;
    }
    function correctMode(obj, mode) {
        if (!obj.origin_id || !obj.recurring) {
            mode = "all";
        }
        else {
            if (this.app.getService("local").isLastPart(obj)) {
                mode = "";
            }
        }
        return mode;
    }
<<<<<<< HEAD
    function movePattern(rec, newEvent, obj) {
        var days = webix.Date.dayStart(newEvent.start_date) -
            webix.Date.dayStart(obj.start_date);
        if (days)
            days /= 1000 * 60 * 60 * 24;
        if (rec.UNTIL && days) {
            rec.UNTIL = webix.Date.add(rec.UNTIL, days, "day", true);
        }
        if (rec.BYDAY && days) {
            days %= 7;
            if (days < 0)
                days += 7;
            rec.BYDAY = rec.BYDAY.split(",")
                .map(function (d) { return WEEKDAYS[(WEEKDAYS.indexOf(d) + days) % 7]; })
                .join(",");
        }
        if (rec.BYMONTHDAY && days) {
            var nmd = newEvent.start_date.getDate();
            if (nmd != rec.BYMONTHDAY) {
                rec.BYMONTHDAY = nmd;
=======
    var dayLength = 86400000;
    function movePattern(rec, newEvent, oldEvent) {
        var days = (webix.Date.dayStart(newEvent.start_date) -
            webix.Date.dayStart(oldEvent.start_date)) /
            dayLength;
        if (days) {
            if (rec.UNTIL) {
                var until = webix.Date.add(rec.UNTIL, days, "day", true);
                if (until > newEvent.end_date)
                    rec.UNTIL = until;
                else
                    rec.UNTIL = webix.Date.dayStart(webix.Date.add(newEvent.end_date, 1, "day", true));
            }
            if (rec.BYDAY) {
                days %= 7;
                if (days < 0)
                    days += 7;
                rec.BYDAY = rec.BYDAY.split(",")
                    .map(function (d) { return WEEKDAYS[(WEEKDAYS.indexOf(d) + days) % 7]; })
                    .join(",");
            }
            if (rec.BYMONTHDAY) {
                var nmd = newEvent.start_date.getDate();
                if (nmd != rec.BYMONTHDAY) {
                    rec.BYMONTHDAY = nmd;
                }
>>>>>>> 6388b01 (New widget Scheduler)
            }
        }
        if (rec.BYSETPOS) {
            var nwn = getWeekNum(newEvent.start_date);
            if (rec.BYSETPOS != nwn)
                rec.BYSETPOS = nwn;
        }
        if (rec.BYMONTH) {
            var nm = newEvent.start_date.getMonth() + 1;
            if (nm != rec.BYMONTH)
                rec.BYMONTH = nm;
        }
        return rec;
    }
    function getWeekNum(date) {
        var day = date.getDate();
        return Math.floor(day / 7) + (day % 7 ? 1 : 0);
    }
<<<<<<< HEAD
=======
    function checkPattern(ev) {
        var mode = ev.$recurring || parse$1(ev.recurring);
        if (mode.FREQ === "WEEKLY" && !mode.BYDAY) {
            mode.BYDAY = WEEKDAYS[ev.start_date.getDay()];
            return;
        }
        if ((mode.FREQ === "MONTHLY" || mode.FREQ === "YEARLY") &&
            !mode.BYSETPOS &&
            !mode.BYMONTHDAY &&
            !mode.BYYEARDAY) {
            mode.BYMONTHDAY = ev.start_date.getDate();
            return;
        }
        if (mode.FREQ === "YEARLY" && !mode.BYMONTH && !mode.BYYEARDAY) {
            mode.BYMONTH = ev.start_date.getMonth();
            return;
        }
        if (mode.BYDAY)
            mode.BYDAY = WeekdaysToDates(ev.start_date, mode);
        if (mode.BYMONTHDAY)
            mode.BYMONTHDAY = ev.start_date.getDate();
        if (mode.BYMONTH)
            mode.BYMONTH = ev.start_date.getMonth() + 1;
        if (mode.BYSETPOS)
            mode.BYSETPOS = getWeekNum(ev.start_date);
        ev.recurring = serialize(mode);
    }
>>>>>>> 6388b01 (New widget Scheduler)

    var RecurringFormView = (function (_super) {
        __extends(RecurringFormView, _super);
        function RecurringFormView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        RecurringFormView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            var compact = this.getParam("compact", true);
            var aSkin = webix.skin.$active;
            var form = {
                view: "form",
                localId: "recurringForm",
                hidden: true,
                elementsConfig: { labelPosition: "left" },
                padding: {
                    top: aSkin.layoutPadding.form,
                    bottom: 0,
                    left: compact ? aSkin.layoutPadding.form : 0,
                    right: compact ? 14 : 0,
                },
                borderless: true,
                rows: [
                    this.CreateIntervalControls(_),
                    {
                        localId: "customRecControls",
                        hidden: true,
<<<<<<< HEAD
                        rows: [this.CreateCheckboxes(_), this.CreateSelect()],
=======
                        rows: [this.CreateCheckboxes(_), this.CreateSelect(_)],
>>>>>>> 6388b01 (New widget Scheduler)
                    },
                    this.CreateRadio(_),
                ],
            };
            if (!compact) {
                form.on = {
<<<<<<< HEAD
                    onChange: function () { return _this.UpdateEvent(); },
=======
                    onChange: function (o, v, m) { return _this.UpdateEvent(m); },
>>>>>>> 6388b01 (New widget Scheduler)
                };
            }
            return form;
        };
        RecurringFormView.prototype.init = function () {
            this.State = this.app.getState();
            this.Form = this.$$("recurringForm");
            this.Events = this.app.getService("local").events(true);
            this.CheckBoxContainer = this.$$("weekly");
            this.Checkboxes = this.CheckBoxContainer.getChildViews().slice(1);
            this.Checkboxes.pop();
            this.PatternSelect = this.$$("patternSelect");
            this.UntilDateContainer = this.$$("untilDate");
            this.UntilDateCalendar = this.Form.elements.untilDate.getPopup().getBody();
            this.UntilNumContainer = this.$$("untilCount");
            this.UntilNum = this.UntilNumContainer.getBody();
            this.CustomRecControls = this.$$("customRecControls");
        };
        RecurringFormView.prototype.CreateIntervalControls = function (_) {
            var _this = this;
            return {
                margin: 8,
                cols: [
                    {
                        view: "counter",
                        label: _("Every"),
                        labelWidth: 50,
                        min: 1,
                        name: "INTERVAL",
                        css: "webix_scheduler_counter",
                    },
                    {
                        view: "richselect",
                        name: "FREQ",
                        options: [
                            { id: "DAILY", value: _("day") },
                            { id: "WEEKLY", value: _("week") },
                            { id: "MONTHLY", value: _("month") },
                            { id: "YEARLY", value: _("year") },
                        ],
                        on: {
                            onChange: function (v) { return _this.ChangeControls(v); },
                        },
                    },
                ],
            };
        };
        RecurringFormView.prototype.ChangeControls = function (v) {
            this._freq = v;
            if (v === "DAILY") {
                this.CustomRecControls.hide();
            }
            else {
                this.CustomRecControls.show();
                if (v === "WEEKLY") {
                    this.CheckBoxContainer.show();
                    this.PatternSelect.hide();
                }
                else {
                    this.CheckBoxContainer.hide();
<<<<<<< HEAD
                    this.PatternSelect.show();
=======
                    if (v === "MONTHLY" && this.PatternSelect.getValue() == 3)
                        this.PatternSelect.setValue(1);
                    this.PatternSelect.show();
                    this.PatternSelect.getList().refresh();
>>>>>>> 6388b01 (New widget Scheduler)
                    this.PatternSelect.refresh();
                }
            }
        };
        RecurringFormView.prototype.CreateCheckboxes = function (_) {
            var days = [];
            for (var i = 0; i < 7; ++i) {
                days.push({
                    view: "checkbox",
                    label: webix.i18n.calendar.dayShort[i],
                    labelPosition: "top",
                    labelAlign: "center",
                    css: "webix_scheduler_day_checkbox",
                    inputWidth: 26,
                    width: 45,
                    align: "center",
                    name: WEEKDAYS[i],
                    on: {
                        onChange: function (v, o) {
<<<<<<< HEAD
                            if (!webix.isUndefined(o) && !v && !this.$scope.GetBYDAY()) {
                                this.$scope.SetSilently(this, 1);
                            }
=======
                            this.$scope.CheckboxGuard(this.config.name, v, o);
>>>>>>> 6388b01 (New widget Scheduler)
                        },
                    },
                });
            }
            return {
                localId: "weekly",
                cols: __spreadArrays([
                    { view: "label", label: _("on"), width: 45 }
                ], days, [
                    { gravity: 0.00001 },
                ]),
            };
        };
<<<<<<< HEAD
=======
        RecurringFormView.prototype.CheckboxGuard = function (day, v, o) {
            var _a;
            if (!webix.isUndefined(o) && !v && !this.GetBYDAY()) {
                this.Form.setValues((_a = {}, _a[day] = 1, _a), true);
            }
        };
>>>>>>> 6388b01 (New widget Scheduler)
        RecurringFormView.prototype.SetBYDAY = function (values) {
            var days = values.BYDAY.split(",");
            this.Checkboxes.forEach(function (check) {
                values[check.config.name] = !!days.find(function (d) { return d == check.config.name; });
            });
        };
        RecurringFormView.prototype.GetBYDAY = function () {
            var BYDAY = [];
            this.Checkboxes.forEach(function (check) {
                if (check.getValue()) {
                    BYDAY.push(check.config.name);
                }
            });
            return BYDAY.join(",");
        };
<<<<<<< HEAD
        RecurringFormView.prototype.CreateSelect = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
=======
        RecurringFormView.prototype.CreateSelect = function (_) {
            var _this = this;
>>>>>>> 6388b01 (New widget Scheduler)
            return {
                view: "richselect",
                localId: "patternSelect",
                name: "rec_pattern",
                suggest: {
                    data: [],
                    body: {
                        template: function (obj) {
<<<<<<< HEAD
=======
                            if (_this._freq === "YEARLY" && obj.BYYEARDAY) {
                                return _("Every") + " " + obj.BYYEARDAY + " " + _("day of year");
                            }
>>>>>>> 6388b01 (New widget Scheduler)
                            var byDay = [];
                            if (obj.BYDAY) {
                                obj.BYDAY.forEach(function (d) {
                                    return byDay.push(webix.i18n.calendar.dayFull[d]);
                                });
                            }
<<<<<<< HEAD
                            return _("Every") + " " + (obj.BYMONTHDAY || obj.BYSETPOS) + " " + (obj.BYDAY ? byDay.join(", ") : "") + " " + (_this._freq === "YEARLY"
                                ? webix.i18n.calendar.monthFull[obj.BYMONTH - 1]
                                : "");
=======
                            var text = _("Every") + " " + (obj.BYMONTHDAY || obj.BYSETPOS) + " " + (obj.BYDAY ? byDay.join(", ") : "");
                            if (_this._freq === "YEARLY")
                                text += " " + _("of") + " " + webix.i18n.calendar.monthFull[obj.BYMONTH - 1];
                            return text;
                        },
                    },
                    on: {
                        onShow: function () {
                            var _this = this;
                            this.getList().filter(function (obj) { return _this.$scope._freq === "YEARLY" || obj.id != 3; });
>>>>>>> 6388b01 (New widget Scheduler)
                        },
                    },
                },
            };
        };
        RecurringFormView.prototype.SetPatternOptions = function (ev, calculated) {
<<<<<<< HEAD
            var byDay;
            if (ev.BYDAY) {
                byDay = ev.BYDAY.split(",").map(function (d) { return WEEKDAYS.indexOf(d); });
            }
            else {
                byDay = [calculated.weekday];
            }
=======
>>>>>>> 6388b01 (New widget Scheduler)
            this.PatternSelect.getList().parse([
                {
                    id: 1,
                    BYMONTH: ev.BYMONTH || calculated.month + 1,
                    BYMONTHDAY: ev.BYMONTHDAY || calculated.day,
                },
                {
                    id: 2,
                    BYSETPOS: ev.BYSETPOS || calculated.weekNum,
<<<<<<< HEAD
                    BYDAY: byDay,
                    BYMONTH: ev.BYMONTH || calculated.month + 1,
                },
            ]);
            this._freq = ev.FREQ;
            ev.rec_pattern = ev.BYSETPOS ? 2 : 1;
=======
                    BYDAY: [calculated.weekday],
                    BYMONTH: ev.BYMONTH || calculated.month + 1,
                },
                {
                    id: 3,
                    BYYEARDAY: ev.BYYEARDAY || calculated.yearday,
                },
            ]);
            this.PatternSelect.refresh();
            this._freq = ev.FREQ;
            ev.rec_pattern = ev.BYSETPOS ? 2 : ev.BYYEARDAY ? 3 : 1;
>>>>>>> 6388b01 (New widget Scheduler)
        };
        RecurringFormView.prototype.GetRecPattern = function (values) {
            var data = webix.copy(this.PatternSelect.getList().getItem(values.rec_pattern));
            if (this._freq === "MONTHLY")
                delete data.BYMONTH;
            if (data.BYDAY)
<<<<<<< HEAD
                data.BYDAY = data.BYDAY.map(function (d) { return WEEKDAYS[d]; });
=======
                data.BYDAY = data.BYDAY.map(function (d) { return WEEKDAYS[d]; }).join(",");
>>>>>>> 6388b01 (New widget Scheduler)
            delete data.id;
            return data;
        };
        RecurringFormView.prototype.CreateRadio = function (_) {
            var _this = this;
            var selectors = {
<<<<<<< HEAD
=======
                width: 130,
>>>>>>> 6388b01 (New widget Scheduler)
                rows: [
                    {
                        localId: "untilDate",
                        align: "middle",
                        view: "align",
                        body: {
                            view: "datepicker",
                            name: "untilDate",
                            icons: false,
                        },
                    },
                    {
                        localId: "untilCount",
                        view: "align",
                        align: "bottom",
                        body: {
                            name: "untilCount",
                            view: "counter",
                            css: "webix_scheduler_counter",
                            min: 1,
                        },
                    },
                ],
            };
            return {
                rows: [
                    { view: "label", label: _("End repeat") },
                    {
                        cols: [
                            {
                                view: "radio",
                                name: "until",
                                localId: "until",
                                vertical: true,
<<<<<<< HEAD
                                gravity: 1.5,
=======
>>>>>>> 6388b01 (New widget Scheduler)
                                options: [
                                    { id: 1, value: _("never") },
                                    { id: 2, value: _("date") },
                                    { id: 3, value: _("after several occurrences") },
                                ],
                                on: {
                                    onChange: function (v) { return _this.ChangeSelectors(v); },
                                },
                            },
                            selectors,
                        ],
                    },
                ],
            };
        };
        RecurringFormView.prototype.ChangeSelectors = function (v) {
            this.UntilDateContainer[v === "2" ? "show" : "hide"]();
            this.UntilNumContainer[v === "3" ? "show" : "hide"]();
        };
<<<<<<< HEAD
        RecurringFormView.prototype.SetUNTIL = function (start, values) {
            values.until = values.COUNT ? 3 : values.UNTIL ? 2 : 1;
            values.untilDate = values.UNTIL || webix.Date.add(start, 1, "year", true);
            values.untilCount = values.COUNT || this.CountNum(start, values);
            this.UntilDateCalendar.define({ minDate: start });
        };
        RecurringFormView.prototype.CountNum = function (start, values) {
=======
        RecurringFormView.prototype.SetUNTIL = function (values) {
            var start = this._StartDate;
            values.until = values.COUNT ? 3 : values.UNTIL ? 2 : 1;
            values.untilDate = values.UNTIL || webix.Date.add(start, 1, "year", true);
            values.untilCount = values.COUNT || this.CountNum(values);
            this.UntilDateCalendar.define({ minDate: start });
        };
        RecurringFormView.prototype.CountNum = function (values) {
>>>>>>> 6388b01 (New widget Scheduler)
            var res = 0;
            if (values.UNTIL) {
                var consts = {};
                fillWdays(values, consts);
<<<<<<< HEAD
                var date = webix.Date.copy(start);
=======
                var date = webix.Date.copy(this._StartDate);
>>>>>>> 6388b01 (New widget Scheduler)
                while (date <= values.UNTIL) {
                    date = next(date, values, consts);
                    res++;
                }
            }
            else {
                res = 3;
            }
            return res;
        };
        RecurringFormView.prototype.SetValues = function (event, calculated, silent) {
<<<<<<< HEAD
=======
            if (!calculated)
                return this.Form.setValues(event, true);
>>>>>>> 6388b01 (New widget Scheduler)
            this._StartDate = event.start_date;
            var values = event.$recurring;
            if (!values) {
                values = { FREQ: "DAILY" };
            }
            if (!values.INTERVAL)
                values.INTERVAL = 1;
            if (!values.BYDAY) {
                values.BYDAY = WEEKDAYS[calculated.weekday];
            }
            if (!values.EXDATE)
                values.EXDATE = [];
<<<<<<< HEAD
            this.SetUNTIL(event.start_date, values);
=======
            this.SetUNTIL(values);
>>>>>>> 6388b01 (New widget Scheduler)
            this.SetBYDAY(values);
            this.SetPatternOptions(values, calculated);
            this.Form.setValues(values, true);
            if (silent)
                this.Form.setDirty();
        };
        RecurringFormView.prototype.GetValues = function () {
            var values = this.Form.getValues();
            var res = {
                FREQ: values.FREQ,
                INTERVAL: values.INTERVAL,
<<<<<<< HEAD
                UNTIL: values.until == 2 ? values.untilDate : null,
=======
                UNTIL: values.until == 2 ? values.untilDate : this.GetUntil(values),
>>>>>>> 6388b01 (New widget Scheduler)
                COUNT: values.until == 3 ? values.untilCount : null,
                EXDATE: values.EXDATE || [],
            };
            if (values.FREQ === "WEEKLY") {
                res.BYDAY = this.GetBYDAY(values);
            }
            else if (values.FREQ === "MONTHLY" || values.FREQ === "YEARLY") {
                res = webix.extend(res, this.GetRecPattern(values));
            }
            this.Form.setDirty();
            return res;
        };
<<<<<<< HEAD
        RecurringFormView.prototype.UpdateEvent = function () {
            if (this.IsDirty()) {
=======
        RecurringFormView.prototype.GetUntil = function (values) {
            if (values.until == 3) {
                var consts = {};
                fillWdays(values, consts);
                var date = webix.Date.copy(this._StartDate);
                for (var i = 1; i < values.untilCount; ++i) {
                    date = next(date, values, consts);
                }
                date = webix.Date.add(date, 1, "day", true);
                this.Form.setValues({ untilDate: date }, true);
                return date;
            }
            else
                return null;
        };
        RecurringFormView.prototype.UpdateEvent = function (mode) {
            if (mode === "user") {
>>>>>>> 6388b01 (New widget Scheduler)
                var change = this.GetValues();
                this.app.callEvent("form:update:recurring", [{ $recurring: change }]);
                this.Form.setDirty();
            }
        };
        RecurringFormView.prototype.IsDirty = function () {
            return this.Form.isDirty();
        };
        RecurringFormView.prototype.Show = function () {
            this.getRoot().show();
        };
        RecurringFormView.prototype.Hide = function () {
            this.getRoot().hide();
        };
<<<<<<< HEAD
        RecurringFormView.prototype.SetSilently = function (control, value) {
            control.blockEvent();
            control.setValue(value);
            control.unblockEvent();
        };
        RecurringFormView.prototype.UpdateSilently = function (values) {
            this.Form.blockEvent();
            this.Form.setValues(values, true);
            this.Form.unblockEvent();
        };
=======
>>>>>>> 6388b01 (New widget Scheduler)
        return RecurringFormView;
    }(JetView));

    function changeMode(mode, obj, start, date_id) {
        if (mode && mode === "next" && isFirstOccurrence(date_id, start)) {
            mode = correctMode.call(this, obj, mode);
        }
        return mode;
    }
    function correctCountUntil(obj, mode, sdate, collection) {
        var oid = obj.origin_id || obj.$id || obj.id;
        var parts = collection
            .find(function (e) {
            return oid == e.origin_id && sdate < e.start_date;
        })
            .sort(function (a, b) {
            if (a.start_date > b.start_date)
                return -1;
            if (a.start_date < b.start_date)
                return 1;
            return 0;
        });
        var rec = webix.copy(obj.$recurring);
        for (var i = 0, last = void 0; i < parts.length; ++i) {
            last = parts[i];
            if (last.$recurring) {
                if (last.$recurring.COUNT) {
                    if (rec.COUNT && obj.$id != last.id) {
                        rec.COUNT = rec.COUNT * 1 + last.$recurring.COUNT * 1;
                    }
                    else {
                        rec.UNTIL = countToUntil(last);
                        break;
                    }
                }
                else {
                    rec.UNTIL = last.$recurring.UNTIL;
                    break;
                }
            }
        }
        if (mode === "next" && !parts.length) {
            if (rec.COUNT) {
                rec.COUNT = cutCount(obj, sdate);
            }
            else if (rec.UNTIL && obj.start_date >= rec.UNTIL) {
                rec.UNTIL = webix.Date.add(webix.Date.dayStart(obj.start_date), 1, FREQUENCE[rec.FREQ], true);
            }
        }
        return rec;
    }
    function hasOneOccurrence(obj) {
        if (!obj.recurring)
            return true;
        if (!obj.$recurring.UNTIL)
            return false;
        var end = webix.Date.dayStart(webix.Date.add(obj.end_date, 1, "day", true));
        return webix.Date.equal(end, obj.$recurring.UNTIL);
    }
    function countToUntil(last) {
        var lr = last.$recurring;
        var step = lr.COUNT * 1;
        if (lr.FREQ === "WEEKLY") {
            step = Math.floor((lr.BYDAY.split(",").length / 7) * lr.COUNT);
        }
        return webix.Date.add(last.start_date, step, FREQUENCE[lr.FREQ], true);
    }
    function cutCount(obj, sdate) {
        var date = extractDate(sdate);
        var consts = {};
        fillWdays(obj.$recurring, consts);
        var nexto = webix.Date.dayStart(obj.start_date);
        var count = 0;
        while (nexto < date) {
            count++;
            nexto = next(nexto, obj.$recurring, consts);
        }
        return obj.$recurring.COUNT - count;
    }
    function EditRecurringMixin(child) {
        child.ChangeMode = changeMode;
        child.CorrectCountUntil = correctCountUntil;
        child.HasOneOccurrence = hasOneOccurrence;
    }

    var EventFormView = (function (_super) {
        __extends(EventFormView, _super);
        function EventFormView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        EventFormView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            this.Compact = this.getParam("compact", true);
            var aSkin = webix.skin.$active;
            var toolbar = {
                view: "toolbar",
                borderless: true,
                padding: {
                    left: aSkin.layoutPadding.form - (aSkin.inputHeight - 20) / 2,
                    right: 14,
                },
                elements: [
                    {
                        view: "icon",
                        icon: "wxi-close",
                        tooltip: _("Close"),
                        hotkey: "esc",
                        click: function () { return _this.Close(); },
                    },
                    { view: "label", label: _("Edit event") },
                    {
                        view: "button",
                        width: 130,
                        css: "webix_primary",
                        value: _("Done"),
                        hotkey: "Ctrl+Enter",
                        click: function () { return _this.Done(); },
                    },
                ],
            };
            var form = {
                view: "form",
                localId: "form",
                scroll: true,
                borderless: true,
                padding: { right: 14 },
                elementsConfig: { labelPosition: "top" },
                elements: [
                    { view: "text", label: _("Event"), name: "text" },
                    {
                        margin: 8,
                        rows: [
                            this.GetDateTime("start", _, aSkin),
                            this.GetDateTime("end", _, aSkin),
                        ],
                    },
                    {
                        view: "checkbox",
                        name: "all_day",
                        labelPosition: "left",
                        labelWidth: 0,
<<<<<<< HEAD
                        labelRight: _("labelAllday"),
=======
                        labelRight: _("All Day"),
>>>>>>> 6388b01 (New widget Scheduler)
                        on: {
                            onChange: function (v) { return _this.ToggleTimeControls(v); },
                        },
                    },
                    this.CreateCalendarColor(_),
                    {
                        view: "textarea",
                        label: _("Notes"),
                        name: "details",
                        height: 150,
                    },
                    {},
                ],
<<<<<<< HEAD
                on: {},
            };
            if (this.app.config.recurring)
                form.elements.splice(3, 0, this.CreateRepeat(_, aSkin));
            if (!this.Compact) {
                form.on.onChange = function (v, o) {
                    _this.Wait(function () { return _this.UpdateEvent(_this.Form.getDirtyValues(), o); });
                };
=======
                on: {
                    onChange: function (v, o, m) {
                        var change = _this.Form.getDirtyValues();
                        if (Object.keys(change).length)
                            _this.PrepareChange(change);
                        if (!_this.Compact && m === "user")
                            _this.Wait(function () { return _this.UpdateEvent(change); });
                    },
                },
            };
            if (this.app.config.recurring)
                form.elements.splice(3, 0, this.CreateRepeat(_, aSkin));
            if (this.app.config.units) {
                var index = this.app.config.recurring ? 5 : 4;
                form.elements.splice(index, 0, this.CreateUnitSelector(_));
            }
            if (this.app.config.timeline) {
                var index = this.app.config.recurring ? 5 : 4;
                if (this.app.config.units)
                    index++;
                form.elements.splice(index, 0, this.CreateSectionSelector(_));
>>>>>>> 6388b01 (New widget Scheduler)
            }
            var config = {
                view: "proxy",
                body: {
                    margin: 0,
                    rows: [toolbar, form],
                },
            };
            return config;
        };
        EventFormView.prototype.init = function () {
            var _this = this;
            this.State = this.app.getState();
            this.Form = this.$$("form");
            this.Local = this.app.getService("local").events(true);
            this.Ops = this.app.getService("operations");
            EditRecurringMixin(this);
            this.RecurringOptions = this.$$("recOption");
            this.StartTime = this.$$("startTime");
            this.EndTime = this.$$("endTime");
            this.on(this.State.$changes, "readonly", function (_v, o) {
                if (!webix.isUndefined(o))
                    _this.Close();
            });
            this.on(this.app, "form:update:recurring", function (update) {
<<<<<<< HEAD
                _this.UpdateEvent(update);
            });
            if (this.app.config.calendars) {
                this.Calendars = this.app.getService("local").calendars(true);
=======
                if (Object.keys(update).length)
                    _this.PrepareChange(update);
                _this.UpdateEvent(update);
            });
            var local = this.app.getService("local");
            if (this.app.config.calendars) {
                this.Calendars = local.calendars(true);
>>>>>>> 6388b01 (New widget Scheduler)
                this.$$("calendar")
                    .getList()
                    .parse(this.Calendars);
            }
<<<<<<< HEAD
=======
            if (this.app.config.units) {
                var waitUnits = local.units();
                var combo_1 = this.Form.elements["units"];
                waitUnits.then(function (units) {
                    combo_1.getList().parse(units);
                    combo_1.refresh();
                });
            }
            if (this.app.config.timeline) {
                this.Sections = local.sections(true);
                this.$$("sections")
                    .getList()
                    .parse(this.Sections);
            }
>>>>>>> 6388b01 (New widget Scheduler)
        };
        EventFormView.prototype.ready = function () {
            var _this = this;
            this.SubForm = this.getSubView("recurringForm");
            this.on(this.State.$changes, "selected", function (v) {
                if (v) {
                    _this.ClearTempEvent();
                    _this.Wait(function () { return _this.FillForm(v); });
                }
            });
        };
        EventFormView.prototype.destroy = function () {
            this.ClearTempEvent();
        };
        EventFormView.prototype.CreateRepeat = function (_, aSkin) {
            var _this = this;
            var rows = [
                { view: "label", label: _("Repeat"), height: aSkin.labelTopHeight },
                {
                    margin: 4,
                    cols: [
                        {
                            view: "richselect",
                            localId: "recOption",
                            name: "rec_option",
                            suggest: {
                                data: [
                                    { id: "none", value: _("never") },
                                    { id: "daily", value: _("daily") },
                                    { id: "weekly" },
                                    { id: "monthly" },
                                    { id: "yearly" },
                                    { id: "work", value: _("every working day") },
                                    { id: "custom", value: _("custom") },
                                ],
                            },
                            on: {
                                onChange: function (v, o) { return _this.ToggleSubform(v, o); },
                            },
                        },
                    ],
                },
            ];
            if (this.Compact) {
                rows[1].cols.push({
                    localId: "editCustomRec",
                    view: "icon",
                    icon: "wxi-pencil",
                    tooltip: _("Change recurring pattern"),
                    hidden: true,
                    click: function () { return _this.ShowSubForm(); },
                });
            }
            rows.push({ $subview: RecurringFormView, name: "recurringForm" });
            return { localId: "repeatControls", rows: rows };
        };
        EventFormView.prototype.ToggleTimeControls = function (v) {
            if (v == 1) {
                this.StartTime.hide();
                this.EndTime.hide();
            }
            else {
                this.StartTime.show();
                this.EndTime.show();
            }
        };
        EventFormView.prototype.ToggleSubform = function (v, o) {
            if (v === "custom") {
                if (this.Compact) {
                    this.$$("editCustomRec").show();
                    if (o)
                        this.ShowSubForm();
                }
                else {
                    this.SubForm.Show();
                }
            }
            else {
                this.SubForm.Hide();
                if (this.Compact)
                    this.$$("editCustomRec").hide();
            }
        };
        EventFormView.prototype.CreateCalendarColor = function (_) {
            var ui = {
                margin: 8,
                cols: [
                    {
                        view: "colorpicker",
                        label: _("Color"),
                        name: "color",
                        value: "#1abc9c",
                        suggest: {
                            type: "colorboard",
                            padding: 3,
                            body: getPalette(),
                        },
                    },
                ],
            };
            if (this.app.config.calendars) {
                ui.cols.unshift({
                    view: "richselect",
                    localId: "calendar",
                    label: _("Calendar"),
                    name: "calendar",
                    css: "webix_scheduler_cal_color",
                    options: {
                        css: "webix_scheduler_cal_color_suggest",
                        data: [],
                        body: {
                            tooltip: function () { return ""; },
                            template: function (obj) {
                                var active = obj.active * 1;
                                var css = active ? "" : "class='webix_scheduler_cal_disabled'";
                                var tooltip = active
                                    ? ""
                                    : "webix_tooltip=\"" + _("Inactive calendar") + "\"";
                                return "<div style=\"overflow: hidden;\" " + tooltip + " " + css + ">" + (obj.text ||
                                    _("(no title)")) + "\n\t\t\t\t\t\t\t\t<span class=\"webix_scheduler_cal_marker\" style=\"background-color:" + obj.color + ";\">\n\t\t\t\t\t\t\t</span></div>";
                            },
                        },
                    },
                });
            }
            return ui;
        };
<<<<<<< HEAD
=======
        EventFormView.prototype.CreateUnitSelector = function (_) {
            var ui = {
                view: "multicombo",
                name: "units",
                label: _("Units"),
                options: [],
            };
            return ui;
        };
>>>>>>> 6388b01 (New widget Scheduler)
        EventFormView.prototype.GetDateTime = function (type, _, aSkin) {
            return {
                rows: [
                    {
                        view: "label",
                        height: aSkin.labelTopHeight,
                        label: type === "start" ? _("Start") : _("End"),
                    },
                    {
                        margin: 8,
                        cols: [
                            {
                                view: "datepicker",
                                name: type + "_date",
                                suggest: {
                                    type: "calendar",
                                    icons: false,
                                },
                            },
                            {
                                view: "datepicker",
                                localId: type + "Time",
                                name: type + "_time",
                                type: "time",
                                format: "%H:%i",
                            },
                        ],
                    },
                ],
            };
        };
<<<<<<< HEAD
        EventFormView.prototype.FillForm = function (ev) {
            var _this = this;
            this.Form.focus();
=======
        EventFormView.prototype.CreateSectionSelector = function (_) {
            return {
                localId: "sections",
                view: "richselect",
                label: _("Section"),
                name: "section",
                options: {
                    data: [],
                    body: {
                        template: "#text#",
                    },
                },
            };
        };
        EventFormView.prototype.FillForm = function (ev) {
            var _this = this;
>>>>>>> 6388b01 (New widget Scheduler)
            this.Id = ev.id;
            this.Form.focus();
            this.Date = ev.date;
            if (typeof this.Date === "string") {
                this.Date = new Date(this.Date.slice(0, this.Date.indexOf("_")) * 1);
            }
            var obj;
            if (ev.id == "0") {
<<<<<<< HEAD
                obj = this.NewEvent();
=======
                if (this.State.clipboard && this.State.clipboard.selected) {
                    obj = this.State.clipboard.selected;
                    this.$$("repeatControls").hide();
                }
                else {
                    obj = this.NewEvent(ev);
                }
>>>>>>> 6388b01 (New widget Scheduler)
                if (obj.then) {
                    return obj.then(function (res) {
                        _this.Local.add(__assign({ id: ev.id }, webix.copy(res)));
                        _this.FillFormContinue(res);
                    });
                }
<<<<<<< HEAD
                else
                    this.Local.add(__assign({ id: ev.id }, webix.copy(obj)));
=======
                else {
                    this.Local.add(__assign({ id: ev.id }, webix.copy(obj)));
                }
>>>>>>> 6388b01 (New widget Scheduler)
            }
            else {
                obj = webix.copy(this.Local.getItem(ev.id));
                var mode = this.getParam("mode", true);
                if (mode)
                    obj = this.AdaptObjToMode(mode, obj);
            }
            this.FillFormContinue(obj);
        };
        EventFormView.prototype.AdaptObjToMode = function (mode, obj) {
            mode = this.ChangeMode(mode, obj, obj.recurring
                ? obj.start_date
                : this.Local.getItem(obj.origin_id).start_date, obj.recurring ? this.State.selected.date : obj.start_date);
            this.setParam("mode", mode, true);
            if (mode === "all" || mode === "next") {
                if (mode === "all" && obj.origin_id) {
                    obj = webix.copy(this.Local.getItem(obj.origin_id));
                }
                if (!obj.$recurring)
                    obj.$recurring = webix.copy(this.Local.getItem(obj.origin_id).$recurring);
                if (obj.$recurring.COUNT || obj.$recurring.UNTIL) {
                    obj.$recurring = this.CorrectCountUntil(obj, mode, obj.start_date, this.Local);
                }
            }
            if (mode === "this" || mode === "next") {
                if (this.State.selected.date)
                    obj = __assign(__assign({}, obj), separateSequence(obj, this.State.selected.date));
                if (mode === "this") {
                    obj.$recurring = null;
                    obj.recurring = "";
                    this.$$("repeatControls").hide();
                }
            }
            return obj;
        };
        EventFormView.prototype.FillFormContinue = function (obj) {
            obj.start_time = webix.Date.copy(obj.start_date);
            obj.end_time = webix.Date.copy(obj.end_date);
            obj.start_date = webix.Date.datePart(obj.start_date);
            obj.end_date = webix.Date.datePart(obj.end_date);
            if (this.app.config.recurring)
                this.SetRecurring(obj);
            this.Form.setValues(obj);
        };
        EventFormView.prototype.GetFromStartDate = function (start) {
            var res = {
                weekday: start.getDay(),
                day: start.getDate(),
                month: start.getMonth(),
<<<<<<< HEAD
=======
                yearday: getYearDay(start),
>>>>>>> 6388b01 (New widget Scheduler)
            };
            res.weekNum = Math.floor(res.day / 7) + (res.day % 7 ? 1 : 0);
            return res;
        };
        EventFormView.prototype.SetRecurring = function (obj) {
            var today = this.GetFromStartDate(obj.start_date);
            var roptions = this.ResetRecurringOptions(today);
            this.RecurringOptions.getList().parse(roptions);
            this.SubForm.SetValues(webix.copy(obj), today, true);
<<<<<<< HEAD
            var _ = this.app.getService("locale")._;
            if (!obj.$recurring) {
                obj.rec_option = _("none");
=======
            if (!obj.$recurring) {
                obj.rec_option = "none";
>>>>>>> 6388b01 (New widget Scheduler)
            }
            else if (obj.$recurring.BYDAY === "MO,TU,WE,TH,FR") {
                obj.rec_option = "work";
            }
            else if (!obj.$recurring.UNTIL &&
                !obj.$recurring.COUNT &&
                (!obj.$recurring.INTERVAL || obj.$recurring.INTERVAL == 1) &&
                (obj.$recurring.FREQ === "DAILY" ||
                    (obj.$recurring.FREQ === "WEEKLY" &&
                        obj.$recurring.BYDAY == WEEKDAYS[today.weekday]) ||
                    (obj.$recurring.FREQ === "MONTHLY" &&
                        obj.$recurring.BYSETPOS &&
                        obj.$recurring.BYSETPOS == today.weekNum &&
                        obj.$recurring.BYDAY == WEEKDAYS[today.weekday]) ||
                    (obj.$recurring.FREQ === "YEARLY" &&
                        obj.$recurring.BYMONTH == today.month + 1 &&
                        obj.$recurring.BYMONTHDAY == today.day))) {
<<<<<<< HEAD
                obj.rec_option = _(obj.$recurring.FREQ.toLowerCase());
            }
            else {
                obj.rec_option = _("custom");
=======
                obj.rec_option = obj.$recurring.FREQ.toLowerCase();
            }
            else {
                obj.rec_option = "custom";
>>>>>>> 6388b01 (New widget Scheduler)
            }
        };
        EventFormView.prototype.ResetRecurringOptions = function (start) {
            var _ = this.app.getService("locale")._;
            return [
                {
                    id: "weekly",
                    value: _("weekly, every") + " " + webix.i18n.calendar.dayFull[start.weekday],
                },
                {
                    id: "monthly",
                    value: _("monthly, every") + " " + start.weekNum + " " + _("week on") + " " + webix.i18n.calendar.dayFull[start.weekday],
                },
                {
                    id: "yearly",
                    value: _("yearly, every") + " " + webix.i18n.calendar.monthFull[start.month] + " " + start.day,
                },
            ];
        };
        EventFormView.prototype.Join = function (date, time) {
            return webix.Date.add(date, webix.Date.timePart(time) / 60, "minute", true);
        };
<<<<<<< HEAD
        EventFormView.prototype.NewEvent = function () {
            var _this = this;
            var start = this.GetStartDate();
            var end = webix.Date.add(start, 1, "hour", true);
=======
        EventFormView.prototype.NewEvent = function (params) {
            var _this = this;
            var start = this.GetStartDate();
            var end = this.State.selected.end_date || webix.Date.add(start, 1, "hour", true);
>>>>>>> 6388b01 (New widget Scheduler)
            var obj = {
                start_date: start,
                end_date: end,
                text: "",
<<<<<<< HEAD
            };
            if (this.app.config.recurring)
                obj.recurring = "";
=======
                details: "",
            };
            if (this.app.config.recurring)
                obj.recurring = "";
            if (this.app.config.timeline) {
                obj.section = params.section || this.Sections.getFirstId();
            }
>>>>>>> 6388b01 (New widget Scheduler)
            if (this.app.config.calendars) {
                var active = this.State.active[0];
                if (!active) {
                    var first = this.Calendars.getFirstId();
                    var wait = first
                        ? this.Ops.updateCalendar(first, { active: 1 })
                        : this.Ops.addCalendar();
                    return wait.then(function () {
                        obj.calendar = _this.State.active[0];
                        obj.$color = _this.Calendars.getItem(obj.calendar).color;
                        return obj;
                    });
                }
                obj.calendar = active;
                obj.$color = this.Calendars.getItem(obj.calendar).color;
            }
            else
                obj.$color = "#01C2A5";
<<<<<<< HEAD
=======
            if (this.app.config.calendars && params.unit) {
                obj.units = params.unit;
            }
>>>>>>> 6388b01 (New widget Scheduler)
            return obj;
        };
        EventFormView.prototype.GetStartDate = function () {
            if (this.Date) {
                return webix.Date.copy(this.Date);
            }
            else {
                var date = new Date();
                var minutes = Math.ceil(date.getMinutes() / 30) * 30;
                var res = webix.Date.copy(this.State.date);
                res.setHours(date.getHours(), minutes);
                return res;
            }
        };
<<<<<<< HEAD
        EventFormView.prototype.UpdateEvent = function (change, prev) {
            var _this = this;
            if (Object.keys(change).length)
                this.PrepareChange(change, this.Form.getValues(), prev);
            this.Form.setDirty();
            var sid = this.Id;
            if (sid === "0") {
                this._inProgress = this.Ops.addEvent(this.PrepareOut(change), sid);
            }
            else if (Object.keys(change).length) {
                var mode = this.getParam("mode", true);
                var obj = this.Local.getItem(sid);
                if ((mode === "this" && !this.HasOneOccurrence(obj)) || mode === "next") {
                    change.origin_id = obj.origin_id || obj.id;
                    var newEvent_1 = this.PrepareOut(change);
                    var recurring = "";
                    if (mode === "this") {
                        recurring = cutOccurrence(this.State.selected.date, obj);
                    }
                    else {
                        var params = void 0;
                        if (obj.recurring) {
                            params = [this.State.selected.date, obj];
                        }
                        else {
                            sid = obj.origin_id;
                            params = [newEvent_1.start_date, this.Local.getItem(sid)];
                        }
                        recurring = clipSequence.apply(void 0, params);
                    }
                    this._inProgress = this.Ops.updateEvent(sid, { recurring: recurring }, mode, webix.Date.dayStart(newEvent_1.start_date)).then(function () {
                        if (change.rec_option === "none")
                            _this.State.selected.date = null;
                        return _this.Ops.addEvent(newEvent_1);
                    });
                }
                else {
                    if (mode === "all") {
                        var recVals = this.Form.getValues().$recurring;
                        if (recVals && webix.isUndefined(change.recurring)) {
                            delete recVals.EXDATE;
                            change.recurring = serialize(recVals);
                            this.SetFormSilently({
                                $recurring: recVals,
                                recurring: change.recurring,
                            });
                            this.SubForm.UpdateSilently({ EXDATE: null });
                        }
                        if (obj.origin_id)
                            this.Id = this.State.selected.id = obj.origin_id;
                    }
                    this._inProgress = this.Ops.updateEvent(this.Id, change, mode).then(function () {
                        if (change.rec_option === "none")
                            _this.State.selected.date = null;
                    });
                }
=======
        EventFormView.prototype.UpdateEvent = function (change) {
            var _this = this;
            this.Form.setDirty();
            if (this.Id === "0") {
                var data = this.PrepareOut(change);
                this._inProgress = this.Ops.addEvent(data, true, this.Id);
            }
            else if (Object.keys(change).length) {
                this._inProgress = this.UpdateExisting(this.Id, change);
>>>>>>> 6388b01 (New widget Scheduler)
            }
            if (this._inProgress) {
                this.app.callEvent("backend:operation", [this._inProgress]);
                this._inProgress
                    .then(function (id) {
                    if (id)
<<<<<<< HEAD
                        _this.State.selected.id = _this.Id = id;
                    if (!id || change.recurring)
                        _this.ChangeDate(change, _this.Form.getValues(), prev);
=======
                        _this.UpdateSelection(id);
                    _this.ChangeDate(change, _this.Form.getValues());
>>>>>>> 6388b01 (New widget Scheduler)
                    _this.setParam("mode", "", true);
                })
                    .finally(function () {
                    _this._inProgress = null;
                });
            }
            return this._inProgress || webix.promise.resolve();
        };
<<<<<<< HEAD
        EventFormView.prototype.PrepareChange = function (change, fvals, prev) {
            var _a;
            if (change.rec_option) {
                if (change.rec_option === "custom") {
                    if (fvals.$recurring) {
                        this.SubForm.SetValues(__assign(__assign({}, fvals), change), this.GetFromStartDate(fvals.start_date));
                    }
                    change.$recurring = this.SubForm.GetValues();
                    if (!fvals.$recurring) {
                        this.SetFormSilently({ $recurring: change.$recurring });
                    }
                }
                else {
                    this.GetRecurring(change.rec_option, change, fvals);
                }
                delete change.rec_option;
            }
            if (!webix.isUndefined(change.$recurring)) {
                if (change.$recurring) {
                    var recurring = serialize(change.$recurring);
                    var old = this.Local.getItem(fvals.id);
                    if (!old || recurring !== old.recurring) {
                        change.recurring = recurring;
                        var _b = datesToRec(fvals.start_date, fvals.end_date, change.$recurring), ns = _b[0], es = _b[1];
                        if (ns && es) {
                            _a = [ns, es], change.start_date = _a[0], change.end_date = _a[1];
                        }
                        this.SetFormSilently(change);
                    }
                }
                delete change.$recurring;
            }
            if (change.start_date ||
                change.end_date ||
                change.start_time ||
                change.end_time) {
                this.SumupDateTime(change, fvals);
=======
        EventFormView.prototype.UpdateExisting = function (sid, change) {
            var _this = this;
            var mode = this.getParam("mode", true);
            var obj = this.Local.getItem(sid);
            if ((mode === "this" && !this.HasOneOccurrence(obj)) || mode === "next") {
                change.origin_id = obj.origin_id || obj.id;
                var newEvent_1 = this.PrepareOut(change);
                var recurring = "";
                if (mode === "this") {
                    recurring = cutOccurrence(this.State.selected.date, obj);
                }
                else {
                    var params = void 0;
                    if (obj.recurring) {
                        params = [this.State.selected.date, obj];
                    }
                    else {
                        sid = obj.origin_id;
                        params = [newEvent_1.start_date, this.Local.getItem(sid)];
                    }
                    recurring = clipSequence.apply(void 0, params);
                }
                return this.Ops.updateEvent(sid, { recurring: recurring }, mode, webix.Date.dayStart(newEvent_1.start_date), true).then(function () {
                    if (change.rec_option === "none")
                        _this.State.selected.date = null;
                    return _this.Ops.addEvent(newEvent_1, true);
                });
            }
            else {
                if (mode === "all") {
                    var recVals = this.Form.getValues().$recurring;
                    if (recVals && webix.isUndefined(change.recurring)) {
                        delete recVals.EXDATE;
                        change.recurring = serialize(recVals);
                        this.Form.setValues({
                            $recurring: recVals,
                            recurring: change.recurring,
                        }, true);
                        this.SubForm.SetValues({ EXDATE: null });
                    }
                    if (obj.origin_id)
                        this.Id = this.State.selected.id = obj.origin_id;
                }
                return this.Ops.updateEvent(this.Id, change, mode, undefined, true).then(function () {
                    if (change.rec_option === "none")
                        _this.State.selected.date = null;
                });
            }
        };
        EventFormView.prototype.UpdateSelection = function (id) {
            this.State.selected.id = this.Id = id;
            var sdate = this.State.selected.date;
            if (sdate instanceof Date) {
                this.State.selected.date = null;
            }
            else if (sdate) {
                var fvals = this.Form.getValues();
                this.State.selected.date =
                    this.Join(fvals.start_date, fvals.start_time).valueOf() + "_" + id;
            }
        };
        EventFormView.prototype.PrepareChange = function (change) {
            if (change.rec_option)
                this.ProcessRecurringOption(change);
            else if (!webix.isUndefined(change.$recurring)) {
                this.ProcessRecurringPattern(change);
            }
            this.ProcessDates(change);
            if (this.app.config.recurring && change.start_date)
                this.ApplyDatechangeToRecurring(change);
            this.ProcessText(change, "text");
            this.ProcessText(change, "details");
            this._changedValues = change;
        };
        EventFormView.prototype.ProcessRecurringOption = function (change) {
            var fvals = this.Form.getValues();
            if (change.rec_option === "none") {
                change.recurring = "";
                change.series_end_date = "";
            }
            else if (change.rec_option === "custom") {
                if (fvals.$recurring) {
                    this.SubForm.SetValues(__assign(__assign({}, fvals), change), this.GetFromStartDate(fvals.start_date));
                }
                change.$recurring = this.SubForm.GetValues();
                this.ProcessRecurringPattern(change);
                if (!fvals.$recurring) {
                    this.Form.setValues({ $recurring: change.$recurring }, true);
                }
            }
            else {
                this.GetRecurring(change.rec_option, change, fvals.start_date);
                change.series_end_date = "";
            }
            delete change.rec_option;
            delete change.$recurring;
        };
        EventFormView.prototype.ProcessRecurringPattern = function (change) {
            var _a;
            var fvals = this.Form.getValues();
            var recurring = serialize(change.$recurring);
            var old = this.Local.getItem(this.State.selected.id);
            if (!old || recurring !== old.recurring) {
                change.recurring = recurring;
                change.series_end_date = change.$recurring.UNTIL;
                if (change.$recurring.BYDAY) {
                    _a = datesToWeekdays(fvals.start_date, fvals.end_date, change.$recurring), change.start_date = _a[0], change.end_date = _a[1];
                }
                this.Form.setValues(change, true);
            }
            delete change.$recurring;
        };
        EventFormView.prototype.ProcessDates = function (change) {
            var fvals = this.Form.getValues();
            if (webix.isUndefined(change.all_day)) {
                if ((change.start_date || change.start_time) && fvals.all_day == 0) {
                    change.start_date = this.Join(fvals.start_date, fvals.start_time);
                }
                if ((change.end_date || change.end_time) && fvals.all_day == 0) {
                    change.end_date = this.Join(fvals.end_date, fvals.end_time);
                }
>>>>>>> 6388b01 (New widget Scheduler)
            }
            else if (change.all_day == 1) {
                change.start_date = fvals.start_date;
                change.end_date = fvals.end_date;
            }
            else if (change.all_day == 0) {
                change.start_date = this.Join(fvals.start_date, fvals.start_time);
                change.end_date = this.Join(fvals.end_date, fvals.end_time);
            }
<<<<<<< HEAD
            if (change.start_date || change.end_date) {
                this.CorrectDateTime(change, fvals);
                if (change.start_time)
                    delete change.start_time;
                if (change.end_time)
                    delete change.end_time;
                this.ApplyDatechangeToRecurring(change, fvals);
            }
            this.ProcessText(change, "text", prev);
            this.ProcessText(change, "details", prev);
        };
        EventFormView.prototype.ProcessText = function (change, field, prev) {
            if (change[field]) {
                change[field] = webix.template.escape(change[field].trim());
                if (!prev)
                    prev = this.Local.getItem(this.State.selected.id)[field];
=======
            if (change.start_date || change.end_date)
                this.CorrectDateTime(change);
        };
        EventFormView.prototype.CorrectDateTime = function (change) {
            var fvals = this.Form.getValues();
            var old = this.Local.getItem(this.State.selected.id);
            var ev_length = (old.end_date - old.start_date) / 1000 / 60;
            var type = change.start_date ? "start" : "end";
            var opposite = type === "start" ? "end" : "start";
            var start = change.start_date || old.start_date;
            var end = change.end_date || old.end_date;
            if ((start >= end && !fvals.all_day) || start > end) {
                change[opposite + "_date"] = webix.Date.add(change[type + "_date"], (type === "start" ? 1 : -1) * (ev_length || 60), "minute", true);
                this.Form.setValues({
                    start_date: webix.Date.datePart(change.start_date, true),
                    end_date: webix.Date.datePart(change.end_date, true),
                    start_time: change.start_time || webix.Date.copy(change.start_date),
                    end_time: change.end_time || webix.Date.copy(change.end_date),
                }, true);
            }
            delete change.start_time;
            delete change.end_time;
        };
        EventFormView.prototype.ProcessText = function (change, field) {
            if (!this.webix.isUndefined(change[field])) {
                change[field] = change[field].replace(/(<[^>]+>|^\s+|\s+$)/gi, "");
                var prev = this.Local.getItem(this.State.selected.id)[field] || "";
>>>>>>> 6388b01 (New widget Scheduler)
                if (change[field] === prev.trim())
                    delete change[field];
            }
        };
<<<<<<< HEAD
        EventFormView.prototype.ApplyDatechangeToRecurring = function (change, fvals) {
            if (this.app.config.recurring && change.start_date) {
                var today = this.GetFromStartDate(change.start_date);
                if (!change.recurring) {
                    if (fvals.rec_option === "custom") {
                        var recurring = fvals.$recurring;
                        if (recurring.BYMONTH) {
                            recurring.BYMONTH = today.month + 1;
                        }
                        if (recurring.BYMONTHDAY) {
                            recurring.BYMONTHDAY = today.day;
                        }
                        if (recurring.BYSETPOS) {
                            recurring.BYSETPOS = today.weekNum;
                        }
                        if (recurring.BYDAY) {
                            recurring.BYDAY = recToDate(change.start_date, fvals.$recurring);
                        }
                        if (recurring.UNTIL && recurring.UNTIL < change.start_date) {
                            var oldStart = this.Local.getItem(this.State.selected.id)
                                .start_date;
                            var length_1 = (fvals.$recurring.UNTIL - oldStart) / 1000 / 60;
                            recurring.UNTIL = webix.Date.add(change.start_date, length_1, "minute", true);
                        }
                        change.recurring = serialize(recurring);
                        this.SubForm.SetValues(__assign(__assign({}, fvals), change), today);
                    }
                    else {
                        this.GetRecurring(fvals.rec_option, change, fvals);
                        delete change.$recurring;
                    }
                }
                this.RecurringOptions.getList().parse(this.ResetRecurringOptions(today));
                this.RecurringOptions.refresh();
            }
        };
        EventFormView.prototype.ChangeDate = function (dirty, fvals, prev) {
            if ((dirty.start_date && !fvals.$recurring) || dirty.recurring === "") {
                this.UpdateStateDate(webix.Date.datePart(dirty.start_date || fvals.start_date, true));
            }
            else if (dirty.start_date || dirty.recurring) {
                if (dirty.recurring &&
                    (((fvals.$recurring.FREQ === "WEEKLY" ||
                        fvals.$recurring.FREQ === "DAILY") &&
                        (!fvals.$recurring.INTERVAL || fvals.$recurring.INTERVAL == 1)) ||
                        (this.Date &&
                            webix.Date.equal(this.Date, this.Join(fvals.start_date, fvals.start_time))))) {
                    var wday = (this.Date || fvals.start_date).getDay();
                    if (!fvals.$recurring.BYDAY ||
                        fvals.$recurring.BYDAY.split(",").includes(WEEKDAYS[wday])) {
                        if (prev === "none") {
                            this.State.selected.date =
                                this.Join(fvals.start_date, fvals.start_time).valueOf() +
                                    "_" +
                                    this.State.selected.id;
                        }
                        return;
                    }
                }
                var consts = {};
                fillWdays(fvals.$recurring, consts);
                var date = webix.Date.copy(dirty.start_date || this.Join(fvals.start_date, fvals.start_time));
                var end = this.GetModeBounds().end;
                while (date >= end) {
                    end = webix.Date.add(end, 1, this.State.mode, true);
                }
                var start = void 0;
                var sdate = new Date(this.State.selected.date.split("_")[0] * 1);
                if (fvals.$recurring.UNTIL && fvals.$recurring.UNTIL < end) {
                    end = fvals.$recurring.UNTIL;
                }
                while (date < end) {
                    start = webix.Date.copy(date);
                    if (webix.Date.equal(start, sdate))
                        break;
                    date = next(date, fvals.$recurring, consts);
                }
                this.State.selected.date = start.valueOf() + "_" + this.State.selected.id;
                this.UpdateStateDate(start);
            }
        };
        EventFormView.prototype.UpdateStateDate = function (date) {
            var state = this.State;
            if (state.mode === "day") {
                var sdate = webix.Date.datePart(state.date, true);
=======
        EventFormView.prototype.ApplyDatechangeToRecurring = function (change) {
            var today = this.GetFromStartDate(change.start_date);
            var fvals = this.Form.getValues();
            if (!change.recurring && fvals.$recurring) {
                if (fvals.rec_option === "custom") {
                    var recurring = fvals.$recurring;
                    if (recurring.BYYEARDAY) {
                        recurring.BYYEARDAY = today.yearday;
                    }
                    if (recurring.BYMONTH) {
                        recurring.BYMONTH = today.month + 1;
                    }
                    if (recurring.BYMONTHDAY) {
                        recurring.BYMONTHDAY = today.day;
                    }
                    if (recurring.BYSETPOS) {
                        recurring.BYSETPOS = today.weekNum;
                    }
                    if (recurring.BYDAY) {
                        recurring.BYDAY = WeekdaysToDates(change.start_date, fvals.$recurring);
                    }
                    if (recurring.UNTIL && recurring.UNTIL < change.start_date) {
                        var oldStart = this.Local.getItem(this.State.selected.id)
                            .start_date;
                        var length_1 = (fvals.$recurring.UNTIL - oldStart) / 1000 / 60;
                        recurring.UNTIL = webix.Date.add(change.start_date, length_1, "minute", true);
                    }
                    change.recurring = serialize(recurring);
                    this.SubForm.SetValues(__assign(__assign({}, fvals), change), today);
                }
                else {
                    this.GetRecurring(fvals.rec_option, change, fvals.start_date);
                    delete change.$recurring;
                }
            }
            this.RecurringOptions.getList().parse(this.ResetRecurringOptions(today));
            this.RecurringOptions.refresh();
        };
        EventFormView.prototype.GetRecurring = function (r, change, start) {
            var $recurring = this.GetRecurringPreset(r, start);
            if (r === "work" && change.start_date) {
                var BYDAY = WeekdaysToDates(change.start_date, $recurring);
                if ($recurring.BYDAY !== BYDAY) {
                    $recurring.BYDAY = BYDAY;
                    r = "custom";
                }
            }
            var recurring = serialize($recurring);
            var old = this.Local.getItem(this.State.selected.id);
            if (!old || recurring !== old.recurring) {
                change.$recurring = $recurring;
                change.recurring = recurring;
                this.Form.setValues({
                    $recurring: change.$recurring,
                    recurring: recurring,
                    rec_option: r,
                }, true);
            }
        };
        EventFormView.prototype.GetRecurringPreset = function (r, start) {
            var today = this.GetFromStartDate(start);
            switch (r) {
                case "daily":
                    return { FREQ: "DAILY", INTERVAL: 1 };
                case "weekly":
                    return {
                        FREQ: "WEEKLY",
                        INTERVAL: 1,
                        BYDAY: WEEKDAYS[today.weekday],
                    };
                case "work":
                    return {
                        FREQ: "WEEKLY",
                        INTERVAL: 1,
                        BYDAY: "MO,TU,WE,TH,FR",
                    };
                case "monthly":
                    return {
                        FREQ: "MONTHLY",
                        INTERVAL: 1,
                        BYSETPOS: today.weekNum,
                        BYDAY: WEEKDAYS[today.weekday],
                    };
                case "yearly":
                    return {
                        FREQ: "YEARLY",
                        INTERVAL: 1,
                        BYMONTH: today.month + 1,
                        BYMONTHDAY: today.day,
                    };
                default:
                    return { FREQ: "DAILY", INTERVAL: 1 };
            }
        };
        EventFormView.prototype.ChangeDate = function (dirty, fvals) {
            if (dirty) {
                if ((dirty.start_date && !fvals.recurring) || dirty.recurring === "") {
                    this.State.selected.date = null;
                    this.UpdateStateDate(dirty.start_date || fvals.start_date);
                }
                else if (dirty.start_date || dirty.recurring) {
                    var date = this.GetClosestOccurrenceDate(dirty, fvals);
                    this.State.selected.date =
                        date.valueOf() + "_" + this.State.selected.id;
                    this.UpdateStateDate(date);
                }
            }
        };
        EventFormView.prototype.GetClosestOccurrenceDate = function (dirty, fvals) {
            var date = dirty.start_date
                ? webix.Date.copy(dirty.start_date)
                : this.Join(fvals.start_date, fvals.start_time);
            var end = webix.Date.dayStart(this.State.selected.date
                ? new Date(this.State.selected.date.split("_")[0] * 1)
                : date);
            if (fvals.series_end_date) {
                end = new Date(Math.min(webix.Date.add(fvals.series_end_date, -1, "day", true), end));
            }
            var consts = {};
            fillWdays(fvals.$recurring, consts);
            var temp = webix.Date.copy(date);
            while (webix.Date.dayStart(temp) < end) {
                temp = next(temp, fvals.$recurring, consts);
                if (Math.abs(end - temp) < Math.abs(end - date)) {
                    date = webix.Date.copy(temp);
                }
            }
            return date;
        };
        EventFormView.prototype.UpdateStateDate = function (date) {
            date = webix.Date.dayStart(date);
            var state = this.State;
            if (state.mode === "day" ||
                state.mode === "units" ||
                (state.mode === "timeline" && state.timelineMode === "day")) {
                var sdate = webix.Date.dayStart(state.date);
>>>>>>> 6388b01 (New widget Scheduler)
                if (!webix.Date.equal(date, sdate)) {
                    state.date = webix.Date.dayStart(date);
                }
            }
<<<<<<< HEAD
            else if (state.mode === "week" || state.mode === "month") {
=======
            else {
>>>>>>> 6388b01 (New widget Scheduler)
                var _a = this.GetModeBounds(), start = _a.start, end = _a.end;
                if (date < start || date >= end) {
                    state.date = webix.Date.dayStart(date);
                }
            }
        };
        EventFormView.prototype.GetModeBounds = function () {
            var state = this.State;
<<<<<<< HEAD
            var start = webix.Date[state.mode + "Start"](state.date);
            var end = webix.Date.add(start, 1, state.mode, true);
            return { start: start, end: end };
        };
        EventFormView.prototype.GetRecurring = function (r, change, fvals) {
            var weekday = WEEKDAYS[fvals.start_date.getDay()];
            var day = fvals.start_date.getDate();
            var rObj = null;
            switch (r) {
                case "daily":
                    rObj = { FREQ: "DAILY", INTERVAL: 1 };
                    break;
                case "weekly":
                    rObj = {
                        FREQ: "WEEKLY",
                        INTERVAL: 1,
                        BYDAY: weekday,
                    };
                    break;
                case "work":
                    rObj = {
                        FREQ: "WEEKLY",
                        INTERVAL: 1,
                        BYDAY: "MO,TU,WE,TH,FR",
                    };
                    break;
                case "monthly":
                    rObj = {
                        FREQ: "MONTHLY",
                        INTERVAL: 1,
                        BYSETPOS: Math.floor(day / 7) + (day % 7 ? 1 : 0),
                        BYDAY: weekday,
                    };
                    break;
                case "yearly":
                    rObj = {
                        FREQ: "YEARLY",
                        INTERVAL: 1,
                        BYMONTH: fvals.start_date.getMonth() + 1,
                        BYMONTHDAY: day,
                    };
                    break;
            }
            if (r === "work" && change.start_date) {
                var BYDAY = recToDate(change.start_date, rObj);
                if (rObj.BYDAY !== BYDAY) {
                    rObj.BYDAY = BYDAY;
                    r = "custom";
                }
            }
            var recurring = rObj ? serialize(rObj) : "";
            var old = this.Local.getItem(fvals.id);
            if (!old || recurring !== old.recurring) {
                change.$recurring = rObj;
                change.recurring = recurring;
                this.SetFormSilently({
                    $recurring: change.$recurring,
                    recurring: recurring,
                    rec_option: r,
                });
            }
        };
=======
            var mode = state.mode;
            if (mode === "timeline")
                mode = state.timelineMode;
            else if (mode === "agenda")
                mode = "month";
            var start = webix.Date[mode + "Start"](state.date);
            var end = webix.Date.add(start, 1, mode, true);
            if (state.mode === "month") {
                start = webix.Date.weekStart(start);
                var weeks = Math.ceil((end - start) / (24 * 60 * 60 * 1000) / 7);
                end = webix.Date.add(start, weeks, "week", true);
            }
            return { start: start, end: end };
        };
>>>>>>> 6388b01 (New widget Scheduler)
        EventFormView.prototype.PrepareOut = function (change) {
            var obj = this.Form.getValues();
            if (!obj.all_day) {
                obj.start_date = this.Join(obj.start_date, obj.start_time);
                obj.end_date = this.Join(obj.end_date, obj.end_time);
            }
            obj = webix.extend(obj, change || {}, true);
            if (!(change && change.recurring) && obj.$recurring) {
                obj.$recurring.EXDATE = [];
                obj.recurring = serialize(obj.$recurring);
            }
<<<<<<< HEAD
            var res = {
                origin_id: obj.origin_id || 0,
                text: webix.template.escape(obj.text),
                start_date: obj.start_date,
                end_date: obj.end_date,
                all_day: obj.all_day,
                calendar: obj.calendar,
                color: obj.color,
                details: webix.template.escape(obj.details),
                recurring: obj.recurring,
            };
            return res;
        };
        EventFormView.prototype.SumupDateTime = function (change, fvals) {
            var type = change.start_date || change.start_time ? "start" : "end";
            var dateField = type + "_date";
            var timeField = type + "_time";
            change[dateField] = this.Join(change[dateField] || fvals[dateField], change[timeField] || fvals[timeField]);
        };
        EventFormView.prototype.CorrectDateTime = function (change, fvals) {
            var old = this.Local.getItem(this.State.selected.id);
            var ev_length = (old.end_date - old.start_date) / 1000 / 60;
            var type = change.start_date ? "start" : "end";
            var opposite = type === "start" ? "end" : "start";
            if ((change.start_date >= old.end_date && !fvals.all_day) ||
                change.start_date > old.end_date ||
                (old.start_date >= change.end_date && !fvals.all_day) ||
                old.start_date > change.end_date) {
                change[opposite + "_date"] = webix.Date.add(change[type + "_date"], (type === "start" ? 1 : -1) * (ev_length || 60), "minute", true);
                this.SetFormSilently({
                    start_date: webix.Date.datePart(change.start_date, true),
                    end_date: webix.Date.datePart(change.end_date, true),
                    start_time: change.start_time || webix.Date.copy(change.start_date),
                    end_time: change.end_time || webix.Date.copy(change.end_date),
                });
            }
        };
        EventFormView.prototype.SetFormSilently = function (change) {
            this.Form.blockEvent();
            this.Form.setValues(change, true);
            this.Form.unblockEvent();
=======
            if (!obj.origin_id)
                obj.origin_id = 0;
            if (this.app.config.timeline && !obj.section)
                obj.section = 0;
            return obj;
>>>>>>> 6388b01 (New widget Scheduler)
        };
        EventFormView.prototype.ClearTempEvent = function () {
            var sid = this.Id;
            if (sid === "0" && this.Local.exists(sid)) {
                this.Local.remove(sid);
            }
        };
        EventFormView.prototype.Back = function (close) {
            this.Form.clear();
            if (close || this.State.selected.id === "0") {
                this.State.selected = null;
            }
            else {
                var path = this.Compact ? "event.formpopup/" : "../";
                this.show(path + "event.info", { target: "edit" });
            }
        };
        EventFormView.prototype.Close = function () {
            var _this = this;
            if (this._inProgress) {
                this._inProgress.then(function () {
                    _this.Back(true);
                });
            }
            else {
                var dirty = this.Form.isDirty() || (this.Subform && this.SubForm.IsDirty());
                if (this.Compact && dirty) {
                    var _ = this.app.getService("locale")._;
                    webix
                        .confirm({
                        text: _("Save changes?"),
<<<<<<< HEAD
=======
                        container: this.app.getRoot().$view,
>>>>>>> 6388b01 (New widget Scheduler)
                    })
                        .then(function () { return _this.Done(true); })
                        .catch(function () { return _this.Back(true); });
                }
                else
                    this.Back(true);
            }
        };
        EventFormView.prototype.Done = function (close) {
            var _this = this;
            if (this._inProgress) {
                this._inProgress.then(function () {
                    _this.Back();
                });
            }
            else if (this.State.selected.id === "0" || this.Compact) {
                var change = {};
                if (this.Compact) {
<<<<<<< HEAD
                    change = this.Form.getDirtyValues();
                    if (this.SubForm.IsDirty()) {
                        change.$recurring = this.SubForm.GetValues();
=======
                    if (this._changedValues)
                        change = this._changedValues;
                    if (this.SubForm.IsDirty()) {
                        change.$recurring = this.SubForm.GetValues();
                        change.series_end_date = change.$recurring.UNTIL;
>>>>>>> 6388b01 (New widget Scheduler)
                        delete change.rec_option;
                    }
                }
                this.UpdateEvent(change).then(function () { return _this.Back(close); });
            }
            else {
                this.Back();
            }
        };
        EventFormView.prototype.Wait = function (handler) {
            if (this._inProgress) {
                this._inProgress.then(handler);
            }
            else {
                handler.call();
            }
        };
        EventFormView.prototype.ShowSubForm = function () {
            var _this = this;
            this.SubForm.Show();
            var _ = this.app.getService("locale")._;
            var subform = this.SubForm.getRoot();
            var aSkin = webix.skin.$active;
            webix.fullscreen.set(subform, {
                head: {
                    view: "toolbar",
                    padding: {
                        left: aSkin.layoutPadding.form - (aSkin.inputHeight - 20) / 2,
                        right: 14,
                    },
                    elements: [
                        { view: "icon", icon: "shi-back", click: function () { return _this.HideSubPop(); } },
                        { view: "label", label: _("Change recurring pattern") },
                        {
                            view: "button",
                            value: _("Done"),
                            width: 130,
                            css: "webix_primary",
                            click: function () { return _this.HideSubPop(); },
                        },
                    ],
                },
            });
            var win = subform.getTopParentView();
            win.define({ css: "webix_scheduler_subform_popup" });
        };
        EventFormView.prototype.HideSubPop = function () {
            this.SubForm.Hide();
            webix.fullscreen.exit();
        };
        return EventFormView;
    }(JetView));

    var FormPopup = (function (_super) {
        __extends(FormPopup, _super);
        function FormPopup() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        FormPopup.prototype.config = function () {
<<<<<<< HEAD
            return {
=======
            return this.app.getService("jet-win").updateConfig({
>>>>>>> 6388b01 (New widget Scheduler)
                view: "window",
                fullscreen: true,
                head: false,
                body: { $subview: true },
<<<<<<< HEAD
            };
=======
            });
>>>>>>> 6388b01 (New widget Scheduler)
        };
        return FormPopup;
    }(JetView));

<<<<<<< HEAD
=======
    function handler(view) {
        return {
            attachEvent: function (key, handler) {
                webix.UIManager.addHotKey(key, handler, view);
                return { key: key, handler: handler };
            },
            detachEvent: function (_a) {
                var key = _a.key, handler = _a.handler;
                return webix.UIManager.removeHotKey(key, handler, view);
            },
        };
    }

    function cleanEventData(newEvent) {
        var isRecurring = newEvent.recurring || newEvent.$id || newEvent.origin_id;
        if (isRecurring) {
            newEvent.recurring = "";
            delete newEvent.$recurring;
            if (!newEvent.origin_id)
                newEvent.origin_id = newEvent.$id || newEvent.id;
            delete newEvent.$id;
        }
        delete newEvent.id;
        var _ = this.app.getService("locale")._;
        if (newEvent.text)
            newEvent.text = _("Copy of") + " " + newEvent.text.replace(_("Copy of") + " ", "");
    }
    function HandleCopyPaste(view) {
        var _this = this;
        this.clipboardModes = ["copy", "cut"];
        this.Ops = this.app.getService("operations");
        var ctrlKey = webix.env.isMac ? "COMMAND" : "CTRL";
        this.on(handler(view), ctrlKey + "+C", function (v) { return _this.AddToClipboard(v, "copy"); });
        this.on(handler(view), ctrlKey + "+X", function (v) { return _this.AddToClipboard(v, "cut"); });
        this.on(handler(view), ctrlKey + "+V", function (v, e) { return _this.PasteFromClipboard(e); });
        this.on(handler(view), "Esc", function (v, e) { return _this.PurgeClipboard(v, e); });
        this.on(this.State.$changes, "mode", function () {
            webix.UIManager.setFocus(view);
        });
        this.on(this.State.$changes, "clipboard", function (v, o) {
            if (v) {
                webix.html.addCss(view.$view, "webix_scheduler_clipboard_target");
            }
            else if (o) {
                webix.html.removeCss(view.$view, "webix_scheduler_clipboard_target");
            }
        });
        this.on(this.app, "events:rendered", function () {
            _this.RestoreClipboardSource(view);
        });
        if (this.$multi) {
            this._globalClickHandler = webix.event(this.List.$view, "click", function () {
                if (_this.State.clipboard && _this.State.clipboard.source) {
                    _this.ChangePasteTarget(_this.List.$view);
                }
            });
        }
        else {
            this.on(view, "onItemClick", function (id, e, node) {
                if (_this.State.clipboard && _this.State.clipboard.source) {
                    if (_this.State.mode === "timeline") {
                        node = _this.CreatePasteTarget(view, e);
                    }
                    _this.ChangePasteTarget(node);
                }
            });
        }
    }
    function OnDestroy() {
        if (this._globalClickHandler) {
            webix.eventRemove(this._globalClickHandler);
            this._globalClickHandler = null;
        }
    }
    function CreatePasteTarget(view, e) {
        var scroll = view.getScrollState();
        var x = e.clientX - view.$view.offsetLeft + scroll.x;
        var y = e.clientY - view.$view.offsetTop + scroll.y;
        this.mousePosUnit = Math.floor(x / this.Scales.cellWidth);
        var target = webix.html.create("div");
        var sheight = this.GetSectionHeight();
        target.style.top = y - (y % sheight) + "px";
        target.style.left = x - (x % this.Scales.cellWidth) + "px";
        target.style.width = this.Scales.cellWidth + "px";
        target.style.height = sheight + "px";
        target.style.position = "absolute";
        var parent = view.$view.firstChild;
        parent.insertBefore(target, parent.childNodes[0]);
        return target;
    }
    function SetPasteTargetStyle(node) {
        webix.html.addCss(node, "webix_scheduler_paste_target");
        this.State.clipboard.target = node;
    }
    function ClearPasteTargetStyle() {
        var clipboard = this.State.clipboard;
        if (clipboard && clipboard.target) {
            webix.html.removeCss(this.State.clipboard.target, "webix_scheduler_paste_target");
            if (this.State.mode === "timeline" && clipboard.target.parentNode) {
                var target = clipboard.target;
                target.parentNode.removeChild(target);
            }
            this.State.clipboard.target = null;
        }
    }
    function ChangePasteTarget(node) {
        if (this.State.clipboard.target !== node) {
            this.ClearPasteTargetStyle();
            this.SetPasteTargetStyle(node);
        }
    }
    function locateEvent(view, node, id) {
        if (node && view.contains(node))
            return node;
        return (view.querySelectorAll("[webix_e_id=\"" + id + "\"]")[0] ||
            view.querySelectorAll("[webix_l_id=\"" + id + "\"]")[0]);
    }
    function AddToClipboard(view, mode) {
        var sel = this.State.selected;
        if (sel && sel.id !== "0") {
            this.ClearPasteTargetStyle();
            var source = locateEvent(view.$view, sel.node, sel.date || sel.id);
            if (source)
                this.SetClipboardSourceStyle(mode, source);
            var event_1 = this.GetEvent(sel.date || sel.id);
            this.State.clipboard = {
                mode: mode,
                selected: webix.copy(event_1),
                source: source,
            };
        }
    }
    function SetClipboardSourceStyle(mode, node) {
        var css = "webix_scheduler_" + mode;
        if (node.className.indexOf(css) === -1)
            webix.html.addCss(node, css);
        var opMode = this.clipboardModes[this.clipboardModes.indexOf(mode) ^ 1];
        var prevCss = "webix_scheduler_" + opMode;
        webix.html.removeCss(node, prevCss);
        var clipboard = this.State.clipboard;
        if (clipboard && clipboard.source && node != clipboard.source) {
            webix.html.removeCss(this.State.clipboard.source, css);
            webix.html.removeCss(this.State.clipboard.source, prevCss);
        }
    }
    function RestoreClipboardSource(view) {
        var clip = this.State.clipboard;
        if (clip) {
            var source = locateEvent(view.$view, clip.source, clip.selected.id);
            if (source) {
                if (source !== clip.source) {
                    this.State.clipboard.source = source;
                }
                this.SetClipboardSourceStyle(clip.mode, source);
            }
        }
    }
    function PasteFromClipboard(e) {
        var clipboard = this.State.clipboard;
        if (clipboard && clipboard.source) {
            var newEvent = this.GetEventData(clipboard, e);
            if (clipboard.mode === "copy") {
                this.CopyEvent(newEvent);
            }
            else if (clipboard.mode === "cut") {
                this.MoveEvent(newEvent);
            }
            this.PurgeClipboard();
        }
    }
    function GetEventData(clipboard, e) {
        var newEvent = clipboard.selected;
        var evLength = Math.floor(newEvent.end_date - newEvent.start_date) / (60 * 1000);
        newEvent.start_date = this.GetTargetDate(e.target.getAttribute("webix_l_id"));
        newEvent.end_date = webix.Date.add(newEvent.start_date, evLength, "minute", true);
        if (this.State.mode === "units") {
            newEvent.units = this.Unit.id;
        }
        else if (this.State.mode === "timeline") {
            var sec = e.target.getAttribute("webix_l_id");
            if (sec)
                newEvent.section = sec;
        }
        return newEvent;
    }
    function CopyEvent(newEvent) {
        var _this = this;
        cleanEventData.call(this, newEvent);
        this.Ops.addEvent(newEvent, true).then(function (id) {
            return _this.UpdateSelection(id, newEvent);
        });
    }
    function MoveEvent(newEvent) {
        var _this = this;
        if (newEvent.recurring) {
            var recurring = cutOccurrence(newEvent.id, newEvent);
            var updateId = newEvent.$id;
            cleanEventData.call(this, newEvent);
            this.Ops.updateEvent(updateId, { recurring: recurring }, "this", newEvent.start_date, true).then(function () {
                return _this.Ops.addEvent(newEvent, true).then(function (id) {
                    return _this.UpdateSelection(id, newEvent);
                });
            });
        }
        else {
            var update = {
                start_date: newEvent.start_date,
                end_date: newEvent.end_date,
            };
            if (newEvent.units)
                update.units = newEvent.units;
            if (newEvent.section)
                update.section = newEvent.section;
            this.Ops.updateEvent(newEvent.id, update, null, null, true).then(function () {
                _this.UpdateSelection(newEvent.id, newEvent);
            });
        }
    }
    function PurgeClipboard() {
        var clip = this.State.clipboard;
        if (clip) {
            var mode = clip.mode, source = clip.source;
            webix.html.removeCss(source, "webix_scheduler_" + mode);
            this.ClearPasteTargetStyle();
            this.State.clipboard = null;
            return false;
        }
    }
    function CopyPasteMixin(child, mainWidget, config) {
        child.AddToClipboard = AddToClipboard;
        child.SetClipboardSourceStyle = SetClipboardSourceStyle;
        child.RestoreClipboardSource = RestoreClipboardSource;
        child.PasteFromClipboard = PasteFromClipboard;
        child.GetEventData = GetEventData;
        child.CopyEvent = CopyEvent;
        child.MoveEvent = MoveEvent;
        child.ClearPasteTargetStyle = ClearPasteTargetStyle;
        child.SetPasteTargetStyle = SetPasteTargetStyle;
        child.ChangePasteTarget = ChangePasteTarget;
        child.CreatePasteTarget = CreatePasteTarget;
        child.PurgeClipboard = PurgeClipboard;
        if (config && config.multi) {
            child.$multi = true;
            child.destroy = OnDestroy;
        }
        HandleCopyPaste.call(child, mainWidget);
    }

>>>>>>> 6388b01 (New widget Scheduler)
    var EventView = (function (_super) {
        __extends(EventView, _super);
        function EventView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        EventView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            var aSkin = webix.skin.$active;
            var bar = {
                view: "toolbar",
                borderless: true,
                padding: {
                    left: aSkin.layoutPadding.form - (aSkin.inputHeight - 20) / 2,
                    right: 14,
                },
                elements: [
                    {
                        view: "icon",
                        icon: "wxi-close",
                        hotkey: "esc",
                        click: function () { return _this.Back(); },
                    },
                    {},
                    {
                        width: 130,
                        view: "button",
                        localId: "edit",
                        label: _("Edit"),
                        css: "webix_primary",
                        click: function () {
                            this.$scope.StartAction("Edit", this.$view);
                        },
                    },
                ],
            };
<<<<<<< HEAD
=======
            if (this.app.config.copypaste) {
                bar.elements.splice(-1, 0, {
                    view: "icon",
                    icon: "shi-content-copy",
                    tooltip: _("Copy event"),
                    click: function () { return _this.CopyEvent(); },
                });
            }
>>>>>>> 6388b01 (New widget Scheduler)
            var info = {
                localId: "text",
                view: "template",
                css: "webix_scheduler_info",
                template: function (obj) { return (obj.start_date ? _this.InfoTemplate(obj) : ""); },
                borderless: true,
            };
            var deleteButton = {
                view: "button",
                localId: "remove",
                label: _("Delete event"),
                css: "webix_danger webix_scheduler_danger",
                align: "center",
                inputWidth: 330,
                click: function () {
                    this.$scope.StartAction("Delete", this.$view);
                },
            };
            return {
                view: "proxy",
                body: {
                    margin: 0,
                    rows: [
                        bar,
                        {
                            type: "form",
                            padding: { right: 14 + 2 },
                            borderless: true,
                            rows: [info, deleteButton],
                        },
                    ],
                },
            };
        };
        EventView.prototype.init = function () {
            var _this = this;
            this.State = this.app.getState();
<<<<<<< HEAD
=======
            this.UnitsLocal = this.app.getService("local").units(true);
>>>>>>> 6388b01 (New widget Scheduler)
            this.on(this.State.$changes, "readonly", function (v) {
                var action = v ? "hide" : "show";
                _this.$$("edit")[action]();
                _this.$$("remove")[action]();
            });
<<<<<<< HEAD
=======
            var template = this.$$("text");
>>>>>>> 6388b01 (New widget Scheduler)
            this.on(this.State.$changes, "selected", function (v) {
                if (v) {
                    _this.EventObj = _this.app
                        .getService("local")
                        .events(true)
                        .getItem(v.id);
<<<<<<< HEAD
                    _this.$$("text").setValues(_this.EventObj);
                }
            });
            this.Menu = this.ui(EventActionMenu);
=======
                    template.setValues(_this.EventObj);
                }
            });
            this.Menu = this.ui(EventActionMenu);
            if (this.app.config.units) {
                var waitUnits = this.app.getService("local").units();
                waitUnits.then(function () {
                    template.refresh();
                });
            }
            if (this.app.config.timeline) {
                var local = this.app.getService("local");
                local.sections().then(function (data) {
                    _this.Sections = data;
                    template.refresh();
                });
            }
>>>>>>> 6388b01 (New widget Scheduler)
        };
        EventView.prototype.StartAction = function (mode, node) {
            var _this = this;
            if (this.app.config.recurring &&
                (typeof this.State.selected.date === "string" || this.EventObj.origin_id)) {
<<<<<<< HEAD
                this._waitMenu = webix.promise.defer();
                this._waitMenu
                    .then(function (o) {
                    return mode === "Delete" ? _this.DeleteEvent(o) : _this.EditEvent(o);
                })
                    .finally(function () { return (_this._waitMenu = null); });
                this.Menu.Show(node, this._waitMenu);
=======
                this.Menu.Show(node).then(function (o) {
                    if (mode === "Delete")
                        _this.DeleteEvent(o);
                    else
                        _this.EditEvent(o);
                });
>>>>>>> 6388b01 (New widget Scheduler)
            }
            else {
                if (mode === "Delete")
                    this.DeleteEvent();
                else
                    this.EditEvent();
            }
        };
        EventView.prototype.EditEvent = function (o) {
            var compact = this.getParam("compact", true);
            var path = compact ? "event.formpopup/" : "../";
            this.show(path + "event.form", { target: "edit", params: { mode: o } });
        };
        EventView.prototype.DeleteEvent = function (mode) {
            var _this = this;
            var _ = this.app.getService("locale")._;
            webix
                .confirm({
                title: _("Delete event"),
                text: _("The event will be deleted permanently, are you sure?"),
<<<<<<< HEAD
=======
                container: this.app.getRoot().$view,
>>>>>>> 6388b01 (New widget Scheduler)
            })
                .then(function () {
                var obj = _this.EventObj;
                var sdate = "";
                if (mode && mode !== "all") {
                    if (_this.State.selected)
                        sdate = _this.State.selected.date;
                    else if (obj.$id)
                        sdate = obj.id;
                }
                _this.app
                    .getService("operations")
<<<<<<< HEAD
                    .removeEvent(mode, _this.EventObj, sdate);
                _this.Back();
            });
        };
        EventView.prototype.Back = function () {
            this.State.selected = null;
        };
        EventView.prototype.InfoTemplate = function (obj) {
=======
                    .removeEvent(_this.EventObj, mode, sdate);
                _this.Back(true);
            });
        };
        EventView.prototype.CopyEvent = function () {
            var data = webix.copy(this.EventObj);
            cleanEventData.call(this, data);
            this.State.$batch({
                selected: { id: "0" },
                clipboard: { mode: "copy", selected: data },
            });
        };
        EventView.prototype.Back = function (removal) {
            if (removal) {
                var clip = this.State.clipboard;
                if (clip &&
                    (clip.selected.id === this.EventObj.id ||
                        clip.selected.id.indexOf("_" + this.EventObj.id) > -1)) {
                    this.State.clipboard = null;
                }
            }
            this.State.selected = null;
        };
        EventView.prototype.InfoTemplate = function (obj) {
            var _this = this;
>>>>>>> 6388b01 (New widget Scheduler)
            var _ = this.app.getService("locale")._;
            if (this.app.config.recurring && this.State.selected.date) {
                obj = __assign(__assign({}, obj), separateSequence(obj, this.State.selected.date));
            }
            var _a = [obj.start_date, obj.end_date], start = _a[0], end = _a[1];
            var oneday = webix.Date.equal(webix.Date.datePart(start, true), webix.Date.datePart(end, true));
            var allday = webix.Date.equal(webix.Date.datePart(start, true), start) &&
                webix.Date.equal(webix.Date.datePart(end, true), end) &&
                obj.all_day;
            var time = webix.i18n.timeFormatStr;
            var date = webix.i18n.longDateFormatStr;
            var title = "<div class=\"webix_scheduler_event_title\">" + (obj.text ||
                _("(No title)")) + "</div>";
            var startDate = date(start);
            var endDate = date(end);
<<<<<<< HEAD
            var startTime = "" + time(start);
            var endTime = "" + time(end);
            var fromTo = "";
            if (oneday) {
                fromTo = "<div class=\"webix_scheduler_event_text\">" + startDate + "</div><div class=\"webix_scheduler_event_text\">" + _("from") + " " + startTime + " " + _("to") + " " + endTime + "</div>";
=======
            var startTime = time(start);
            var endTime = time(end);
            var fromTo = "";
            if (oneday) {
                fromTo = "<div class=\"webix_scheduler_event_text\">" + startDate + "</div>";
                if (!allday)
                    fromTo += "<div class=\"webix_scheduler_event_text\">" + _("from") + " " + startTime + " " + _("to") + " " + endTime + "</div>";
>>>>>>> 6388b01 (New widget Scheduler)
            }
            else {
                fromTo = "<div class=\"webix_scheduler_event_text\">" + _("from") + " " + (!allday ? startTime : "") + " " + startDate + "</div><div class=\"webix_scheduler_event_text\">" + _("to") + " " + (!allday ? endTime : "") + " " + endDate + "</div>";
            }
<<<<<<< HEAD
            var recurring = "";
            if (obj.recurring) {
                var interval = obj.$recurring.INTERVAL && obj.$recurring.INTERVAL > 1
                    ? obj.$recurring.INTERVAL
                    : "";
                var pattern = (obj.$recurring.BYDAY
                    ? " " + _("on") + " " + obj.$recurring.BYDAY.split(",")
                        .map(function (d) { return webix.i18n.calendar.dayFull[WEEKDAYS.indexOf(d)]; })
                        .join(", ")
                    : "") +
                    (obj.$recurring.BYMONTHDAY ? " " + _("on") + " " : "") +
                    (obj.$recurring.BYMONTH
                        ? " " + webix.i18n.calendar.monthFull[obj.$recurring.BYMONTH - 1]
                        : "") +
                    (obj.$recurring.BYMONTHDAY ? " " + obj.$recurring.BYMONTHDAY : "");
                recurring = _("Repeats each") + " " + interval + " " + _(FREQUENCE[obj.$recurring.FREQ] + (interval ? "s" : "")) + " " + pattern + (obj.$recurring.COUNT
                    ? ", " + obj.$recurring.COUNT + " " + _("times")
                    : obj.$recurring.UNTIL
                        ? " " + _("till") + " " + date(obj.$recurring.UNTIL)
                        : "");
            }
            var details = "";
            if (obj.details)
                details = "<div class=\"webix_scheduler_event_details_title\">" + _("Notes") + "</div>\n\t\t\t\t<div class=\"webix_scheduler_event_text\">" + obj.details.replace(/(?:\r\n|\r|\n)/g, "<br>") + "</div>";
            return title + "\n\t\t\t<div class='webix_scheduler_event_from_to'>" + fromTo + "</div>\n\t\t\t<div class='webix_scheduler_event_recurring_pattern'>" + recurring + "</div>" + details;
=======
            var recurring = this.app.config.recurring && obj.recurring
                ? this.GetRecurringText(obj, _)
                : "";
            var units = "";
            if (this.app.config.units) {
                units += "<div class=\"webix_scheduler_event_units_title\">" + _("Assigned to units") + ":</div><div class=\"webix_scheduler_event_units\">";
                if (obj.units) {
                    var unitIDs_1 = obj.units.split(",");
                    unitIDs_1.forEach(function (id, index) {
                        var isLast = index === unitIDs_1.length - 1;
                        var unitObj = _this.UnitsLocal.getItem(id);
                        var unitValue = unitObj && unitObj.value ? unitObj.value : _("Unknown unit");
                        units += "<div class=\"webix_scheduler_event_unit_item\">" + unitValue + (isLast ? "" : ",") + "</div>";
                    });
                }
                else {
                    units += _("No units");
                }
                units += "</div>";
            }
            var section = this.app.config.timeline && this.Sections ? this.GetSection(obj, _) : "";
            var details = "";
            if (obj.details)
                details = "<div class=\"webix_scheduler_event_details_title\">" + _("Notes") + "</div>\n\t\t\t\t<div class=\"webix_scheduler_event_text\">" + obj.details.replace(/(?:\r\n|\r|\n)/g, "<br>") + "</div>";
            return title + "\n\t\t\t<div class='webix_scheduler_event_from_to'>" + fromTo + "</div>\n\t\t\t<div class='webix_scheduler_event_recurring_pattern'>" + recurring + "</div>" + units + section + details;
        };
        EventView.prototype.GetRecurringText = function (obj, _) {
            var mode = obj.$recurring;
            var interval = mode.INTERVAL && mode.INTERVAL > 1 ? mode.INTERVAL : "";
            var pattern = "";
            if (mode.BYDAY) {
                pattern = " " + _("on") + " " + (mode.BYSETPOS || "") + " " + mode.BYDAY.split(",")
                    .map(function (d) { return webix.i18n.calendar.dayFull[WEEKDAYS.indexOf(d)]; })
                    .join(", ") + " " + (mode.BYMONTH
                    ? _("of") + " " + webix.i18n.calendar.monthFull[mode.BYMONTH - 1]
                    : "");
            }
            else if (mode.BYMONTHDAY) {
                pattern =
                    (mode.BYMONTHDAY ? " " + _("on") + " " : "") +
                        (mode.BYMONTH
                            ? (mode.BYSETPOS ? _("of") : "") + " " + webix.i18n.calendar.monthFull[mode.BYMONTH - 1]
                            : "") +
                        (mode.BYMONTHDAY ? " " + mode.BYMONTHDAY : "");
            }
            else if (mode.BYYEARDAY) {
                pattern = _("day") + " " + mode.BYYEARDAY;
            }
            return _("Repeats each") + " " + interval + " " + _(FREQUENCE[mode.FREQ] + (interval ? "s" : "")) + " " + pattern + (mode.COUNT
                ? ", " + mode.COUNT + " " + _("times")
                : mode.UNTIL
                    ? " " + _("till") + " " + webix.i18n.longDateFormatStr(mode.UNTIL)
                    : "");
        };
        EventView.prototype.GetSection = function (obj, _) {
            var section = this.Sections.getItem(obj.section);
            if (section)
                return "<div class=\"webix_scheduler_section_tpl\"><span class=\"webix_scheduler_section_title\">" + _("Section") + ":</span> " + section.text + "</div>";
            return "";
>>>>>>> 6388b01 (New widget Scheduler)
        };
        return EventView;
    }(JetView));

    var EventActionPopup = (function (_super) {
        __extends(EventActionPopup, _super);
        function EventActionPopup() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        EventActionPopup.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            var buttons = {
                margin: webix.skin.$active.layoutMargin.form,
                cols: [
                    {
                        view: "button",
                        value: _("Cancel"),
                        hotkey: "esc",
                        click: function () { return _this.Cancel(); },
                    },
                    {
                        view: "button",
                        value: _("Apply"),
                        css: "webix_primary",
                        hotkey: "enter",
                        click: function () { return _this.Done(); },
                    },
                ],
            };
<<<<<<< HEAD
            return {
                view: "window",
                modal: true,
                head: _("Edit recurring event"),
                position: "center",
=======
            return this.app.getService("jet-win").updateConfig({
                view: "window",
                head: _("Edit recurring event"),
>>>>>>> 6388b01 (New widget Scheduler)
                autoheight: true,
                css: "webix_scheduler_action_popup",
                body: {
                    type: "form",
                    padding: { top: 0 },
                    width: 340,
                    rows: [
                        {
                            view: "radio",
                            localId: "option",
                            vertical: true,
                            options: [
                                { id: "this", value: _("This event") },
                                { id: "next", value: _("This event and the following") },
                                { id: "all", value: _("All events") },
                            ],
                        },
                        buttons,
                    ],
                },
                on: {
                    onHide: function () { return (_this.Result = null); },
                },
<<<<<<< HEAD
            };
=======
            });
>>>>>>> 6388b01 (New widget Scheduler)
        };
        EventActionPopup.prototype.init = function (view) {
            this.Root = view;
        };
        EventActionPopup.prototype.Show = function (promise) {
            this.Result = promise;
            this.$$("option").setValue("this");
            this.Root.show();
        };
        EventActionPopup.prototype.Done = function () {
            var id = this.$$("option").getValue();
            if (this.Result)
                this.Result.resolve(id);
            this.Root.hide();
        };
        EventActionPopup.prototype.Cancel = function () {
            if (this.Result)
                this.Result.reject();
            this.Root.hide();
        };
        return EventActionPopup;
    }(JetView));

<<<<<<< HEAD
    webix.protoUI({
        name: "r-layout",
        sizeTrigger: function (width, handler, value) {
            this._compactValue = value;
            this._compactWidth = width;
            this._compactHandler = handler;
            this._checkTrigger(this.$view.width, value);
        },
        _checkTrigger: function (x, value) {
            if (this._compactWidth) {
                if ((x <= this._compactWidth && !value) ||
                    (x > this._compactWidth && value)) {
                    this._compactWidth = null;
                    this._compactHandler(!value);
                    return false;
                }
            }
            return true;
        },
        $setSize: function (x, y) {
            if (this._checkTrigger(x, this._compactValue))
                return webix.ui.layout.prototype.$setSize.call(this, x, y);
        },
    }, webix.ui.layout);

=======
>>>>>>> 6388b01 (New widget Scheduler)
    var MainView = (function (_super) {
        __extends(MainView, _super);
        function MainView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MainView.prototype.config = function () {
<<<<<<< HEAD
            this.fCompact = this.getParam("forceCompact");
            if (!webix.isUndefined(this.fCompact))
                this.setParam("compact", this.fCompact);
=======
            initRLayout();
            var fCompact = this.getParam("forceCompact");
            if (!webix.isUndefined(fCompact))
                this.setParam("compact", fCompact);
>>>>>>> 6388b01 (New widget Scheduler)
            this.Compact = this.getParam("compact");
            this.Calendars = !this.Compact && this.app.config.calendars;
            var rows = [
                TopBarView,
                {
<<<<<<< HEAD
                    view: webix.isUndefined(this.fCompact) ? "r-layout" : "layout",
=======
                    view: "r-layout",
>>>>>>> 6388b01 (New widget Scheduler)
                    localId: "main",
                    cols: [{ $subview: true }],
                },
            ];
            if (this.Compact) {
                rows.push({
                    $subview: true,
                    name: "edit",
                    popup: true,
                });
            }
            else {
                rows[1].cols.push({
                    view: "proxy",
                    width: 400,
                    localId: "edit",
                    css: "webix_shadow_medium",
                    borderless: true,
                    hidden: true,
                    body: { $subview: true, name: "edit" },
                });
            }
            if (this.Calendars)
                rows[1].cols.unshift({
                    view: "proxy",
                    localId: "side",
                    borderless: true,
                    body: SideView,
                    hidden: true,
                });
            var config = {
                css: "webix_scheduler",
                view: "abslayout",
                cells: [
                    {
                        relative: true,
                        margin: 0,
                        rows: rows,
                    },
                    {
                        view: "proxy",
                        css: "webix_scheduler_absbutton",
                        body: AddView,
                        localId: "add",
                        borderless: true,
                        right: 20,
                        bottom: 20,
                        hidden: !this.Compact,
                    },
                ],
            };
            return config;
        };
        MainView.prototype.init = function (view) {
            var _this = this;
<<<<<<< HEAD
            if (!this.fCompact)
                this.$$("main").sizeTrigger(this.app.config.compactWidth, function (mode) { return _this.SetCompactMode(mode); }, !!this.Compact);
=======
            this.$$("main").sizeTrigger(this.app, function (mode) { return _this.SetCompactMode(mode); }, !!this.Compact);
>>>>>>> 6388b01 (New widget Scheduler)
            webix.extend(view, webix.ProgressBar);
            this.on(this.app, "backend:operation", function (res) {
                view.showProgress({ type: "top", delay: 2000 });
                res.finally(function () {
                    view.hideProgress();
                });
            });
            if (this.Calendars)
                this.$$("side").show();
            var state = this.app.getState();
            this.on(state.$changes, "mode", function (value) {
                _this.show("./modes." + value);
            });
            this.on(state.$changes, "readonly", function (value) {
                _this.ToggleAdd(value);
            });
            this.on(state.$changes, "selected", function (v, o) { return _this.ToggleEvent(v, o); });
            this.on(this.app, "show:panel", function () { return _this.ToggleSidePanel(); });
<<<<<<< HEAD
            this.app._dndActionPopup = this.ui(EventActionPopup);
=======
            waitVisible(this.getRoot()).then(function () { return (_this.app._dndActionPopup = _this.ui(EventActionPopup)); });
>>>>>>> 6388b01 (New widget Scheduler)
        };
        MainView.prototype.ToggleEvent = function (ev, old) {
            if (ev) {
                this.ShowEvent(ev, old);
            }
            else if (old) {
                this.HideEvent();
            }
        };
        MainView.prototype.ShowEvent = function (ev, old) {
            var sameEvent = old && old.id == ev.id;
            var edit = this.getSubView("edit");
            var path = edit && sameEvent
                ? edit.getUrl()[0].page
                : "event." + (ev.id === "0" ? "form" : "info");
            if (this.Compact) {
                this.show("event.formpopup/" + path, {
                    target: "edit",
                });
            }
            else {
                this.ToggleSidePanel("hide");
                this.$$("edit").show();
                this.show(path, {
                    target: "edit",
                });
            }
        };
        MainView.prototype.HideEvent = function () {
            this.show("_blank", { target: "edit" });
            if (!this.Compact) {
                this.$$("edit").hide();
                this.ToggleSidePanel("show");
            }
        };
        MainView.prototype.SetCompactMode = function (mode) {
            var _this = this;
            webix.delay(function () {
                _this.setParam("compact", mode);
                if (!mode)
                    webix.fullscreen.exit();
                _this.refresh();
            });
        };
        MainView.prototype.ToggleSidePanel = function (state) {
            var side = this.$$("side");
            if (side) {
                if (state !== "show" && side.isVisible()) {
                    this._sidePanel = state === "hide";
                    side.hide();
                }
                else if (!state || (this._sidePanel && state !== "hide")) {
                    side.show();
                    this._sidePanel = false;
                }
            }
        };
        MainView.prototype.ToggleAdd = function (value) {
            var add = this.$$("add");
            if (value)
                add.hide();
            else if (this.Compact)
                add.show();
        };
        return MainView;
    }(JetView));

<<<<<<< HEAD
    function marker(obj) {
        return "<div class=\"webix_event_marker\"><div class=\"webix_event_marker_inner\" style=\"background-color:" + (obj.color ||
            obj.$color) + ";\"></div></div>";
    }
    function events(_) {
        return function (obj, common) {
            return "<div class=\"webix_event_overall\"><div class=\"webix_event_time\">" + common.timeStart(obj) + "</div>" + marker(obj) + "<div class=\"webix_event_text\">" + (obj.text ||
                _("(No title)")) + "</div></div>";
        };
    }
    function dayEventColor(obj) {
        return "border-color:" + obj.$color + "; background-color:" + (obj.color ||
            obj.$color) + "; color:" + obj.$textColor + ";";
=======
    var BRIGHTNESS;
    var FONT;
    webix.ready(function () {
        var dark = webix.skin.$name === "contrast" || webix.skin.$name === "dark";
        BRIGHTNESS = dark ? 0.35 : 0.75;
        FONT = dark ? "#9f9d9d" : "#ffffff";
    });
    function getContrastingColor(color) {
        var rgb = webix.color.toRgb(color);
        var brightness = Math.round((rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000);
        return brightness > 180 ? "#475466" : "#ffffff";
    }
    function getDimmedColor(color) {
        var _a = hexToHsv(color), hue = _a[0], saturation = _a[1];
        hue *= 0.95;
        saturation *= 0.4;
        return "rgb(" + webix.color.hsvToRgb(hue, saturation, BRIGHTNESS) + ")";
    }
    function getDimmedFont() {
        return FONT;
    }
    function hexToHsv(hex) {
        var _a = webix.color.toRgb(hex), red = _a[0], green = _a[1], blue = _a[2];
        return webix.color.rgbToHsv(red, green, blue);
    }

    function marker(obj) {
        var color = obj.color || obj.$color;
        return "<div class=\"webix_event_marker\"><div class=\"webix_event_marker_inner\" style=\"background-color:" + (obj.$past ? getDimmedColor(color) : color) + ";\"></div></div>";
    }
    function events(_) {
        return function (obj, common) {
            return "<div class=\"webix_event_overall " + (obj.$past ? "webix_scheduler_past_event" : "") + "\"><div class=\"webix_event_time\">" + common.timeStart(obj) + "</div>" + marker(obj) + "<div class=\"webix_event_text\">" + (obj.text || _("(No title)")) + "</div></div>";
        };
    }
    function dayEventColor(obj) {
        var color = obj.color || obj.$color;
        return "border-color:" + (obj.$past ? getDimmedColor(obj.$color) : obj.$color) + "; background-color:" + (obj.$past ? getDimmedColor(color) : color) + "; color:" + (obj.$past ? getDimmedFont() : obj.$textColor) + ";";
>>>>>>> 6388b01 (New widget Scheduler)
    }
    function timeStart(start, end) {
        return "<div class=\"start\">" + webix.i18n.timeFormatStr(start) + "</div><div class=\"end\">" + webix.i18n.timeFormatStr(end) + "</div>";
    }
    function fill(obj, common, size) {
        var v = common.master;
        return (v["$" + size] -
            (v.config[size == "width" ? "xCount" : "yCount"] - 1) * common[size]);
    }
    function templateStart(obj, common, marks) {
        var width = common.width, height = common.height;
        if (obj.right)
            width = fill(obj, common, "width");
        if (obj.bottom)
            height = fill(obj, common, "height");
        return ("<div " +
            "webix_l_id" +
            ("=\"" + obj.id + "\" class=\"" + common.classname(obj, common, marks) + "\" " + common.aria(obj, common, marks) + " style=\"width:" + width + "px; height:" + height + "px; float:left; overflow:hidden;\">"));
    }

<<<<<<< HEAD
    function shrinkTo(start, end) {
        return function (ev) {
            var before = ev.start_date <= start;
            var after = ev.end_date >= end;
            if (before || after) {
                var t = webix.copy(ev);
                if (before)
                    t.start_date = start;
                if (after)
                    t.end_date = end;
                return t;
            }
            return ev;
        };
    }
    function isToday(date) {
        return webix.Date.equal(webix.Date.datePart(date), webix.Date.datePart(new Date()));
    }
    function isMultiDay(ev) {
        return (ev.all_day ||
            (ev.start_date.getDate() != ev.end_date.getDate() &&
                ev.end_date - ev.start_date >= 1000 * 60 * 60 * 24 * 1));
    }
    function daysBetweenInclusive(start, end) {
        var millisecondsPerDay = 24 * 60 * 60 * 1000;
        return Math.round((webix.Date.dayStart(end) - webix.Date.dayStart(start)) / millisecondsPerDay);
    }

=======
>>>>>>> 6388b01 (New widget Scheduler)
    var UnitListView = (function (_super) {
        __extends(UnitListView, _super);
        function UnitListView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        UnitListView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            return {
                view: "unitlist",
                localId: "list",
                uniteBy: function () { return "custom"; },
                type: {
                    template: events(_),
                    templateHeader: function (obj) { return _this.TemplateHeader(obj); },
                    timeStart: function (obj) { return _this.TimeStart(obj); },
                    height: 50,
                },
                on: {
                    onUnits: function () { return _this.SetUnits(); },
                    onItemClick: function (id, node) { return _this.ShowEvent(id, node); },
                },
            };
        };
        UnitListView.prototype.init = function () {
            this.State = this.app.getState();
            this.List = this.$$("list");
            webix.extend(this.List, webix.OverlayBox);
        };
        UnitListView.prototype.ShowEvent = function (id, node) {
            var obj = this.List.getItem(id);
            var sel = getParams(obj);
            sel.node = node;
            this.State.selected = sel;
        };
        UnitListView.prototype.ToggleOverlay = function () {
            if (!this.List.count()) {
                var _ = this.app.getService("locale")._;
                this.List.showOverlay(_("No Events"));
            }
            else {
                this.List.hideOverlay();
            }
        };
        UnitListView.prototype.SetUnits = function () {
            var units = this.List.units;
            var data = this.data.all;
            if (Object.keys(units).length) {
                this.List.units = {};
                var start_1 = this.data.start;
                var end = this.data.end;
                var _loop_1 = function () {
                    var next = webix.Date.add(start_1, 1, "day", true);
                    var result = data
                        .filter(function (d) {
                        return d.start_date < next &&
                            (d.end_date > start_1 || (d.end_date >= start_1 && d.all_day));
                    })
                        .map(function (ev) { return ev.id; });
                    if (result.length) {
                        this_1.List.units[start_1.valueOf()] = result;
                    }
                    start_1 = webix.Date.add(start_1, 1, "day", true);
                };
                var this_1 = this;
                while (start_1 < end) {
                    _loop_1();
                }
            }
        };
        UnitListView.prototype.TimeStart = function (ev) {
            var _ = this.app.getService("locale")._;
            if (isMultiDay(ev))
                return _("All Day");
            else
                return timeStart(ev.start_date, ev.end_date);
        };
        return UnitListView;
    }(JetView));

    var AgendaView = (function (_super) {
        __extends(AgendaView, _super);
        function AgendaView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        AgendaView.prototype.config = function () {
            var _this = this;
            var compact = this.getParam("compact", true);
            var ui = _super.prototype.config.call(this);
            ui.css = "webix_scheduler_agenda";
            webix.extend(ui.type, {
                height: "auto",
                headerHeight: 50,
                classname: function (obj) { return _this.TemplateCss(obj); },
            }, true);
            webix.extend(ui.on, {
                onItemRender: function (obj) {
                    if (obj.$unit)
                        _this.CurrentUnit = obj.$unit;
                },
                onItemClick: function (id, e, node) {
                    node = node.firstChild;
                    _this.ShowEvent(id, node);
                    if (!compact)
                        _this.SelectEvent(node);
                },
            }, true);
            return ui;
        };
        AgendaView.prototype.init = function () {
            var _this = this;
            _super.prototype.init.call(this);
            this.Data = this.app.getService("local");
            var events = this.Data.events(true);
            this.on(this.State.$changes, "date", function () { return _this.RefreshData(); });
            this.on(this.State.$changes, "active", function () { return _this.RefreshData(); });
            this.on(this.State.$changes, "selected", function (v) {
                if (!v)
                    _this.SelectEvent();
            });
            this.on(this.app, "events:refresh", function () { return _this.RefreshData(); });
            this.on(events.data, "onStoreUpdated", function (_i, _o, mode) { return mode && _this.RefreshData(); });
        };
        AgendaView.prototype.RefreshData = function () {
            var _this = this;
            var start = webix.Date.monthStart(this.State.date);
            var end = webix.Date.add(start, 1, "month", true);
            this.Data.getEvents(start, end).then(function (data) {
                _this.data = { all: data, start: start, end: end };
                if (_this.app) {
                    _this.List.clearAll();
                    _this.List.parse(data.map(shrinkTo(start, end)));
                    _this.ToggleOverlay();
                }
            });
        };
        AgendaView.prototype.SelectEvent = function (node) {
            if (node == this._selected)
                return;
            var name = "webix_agenda_selected";
            if (this._selected)
                webix.html.removeCss(this._selected, name);
            if (node)
                webix.html.addCss(node, name);
            this._selected = node;
        };
        AgendaView.prototype.TemplateHeader = function (datestring) {
            var date = new Date(datestring * 1);
            var today = isToday(date);
            var fstring = "%F <span class='webix_scheduler_monthday" + (today ? " webix_scheduler_today" : "") + "'>%j</span><br><span class='webix_scheduler_dayofweek'>%l</span>";
            return webix.Date.dateToStr(fstring)(date);
        };
        AgendaView.prototype.TemplateCss = function (obj) {
            var ids = this.List.getUnitList(this.CurrentUnit);
            var css = "webix_list_item";
            if (obj.id == ids[ids.length - 1])
                css += " webix_event_last";
            if (obj.id == ids[0])
                css += " webix_event_first";
            return css;
        };
        return AgendaView;
    }(UnitListView));

    var HourscaleView = (function (_super) {
        __extends(HourscaleView, _super);
        function HourscaleView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        HourscaleView.prototype.config = function () {
            var _this = this;
            return {
                view: "list",
                borderless: true,
                localId: "scale",
                css: "webix_scheduler_scale",
                type: {
                    height: 42,
                    heightSize: function (obj, common) {
                        var ind = _this.List.getIndexById(obj.id);
                        return common.height - (ind === 0 ? 17 : 0) + "px";
                    },
                },
                scroll: false,
                autoheight: true,
                width: 51,
                template: function (obj) { return _this.HourScaleItem(obj); },
            };
        };
        HourscaleView.prototype.init = function () {
            this.List = this.$$("scale");
            this.ParseHours();
        };
        HourscaleView.prototype.ParseHours = function () {
            var data = [];
            for (var h = 0; h < 24; h++) {
                data.push({ id: h + "" });
            }
            this.List.parse(data);
        };
        HourscaleView.prototype.HourScaleItem = function (obj) {
            if (this.List.getIndexById(obj.id) === 0)
                return "";
            else
                return (obj.id < 10 ? "0" : "") + obj.id + ":00";
        };
        return HourscaleView;
    }(JetView));

    var MultiMoreView = (function (_super) {
        __extends(MultiMoreView, _super);
        function MultiMoreView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MultiMoreView.prototype.config = function () {
            var _this = this;
            var more = {
                view: "template",
                localId: "more",
                width: 50,
                css: "webix_scheduler_multi_space",
                tooltip: function () { return ""; },
                onClick: {
                    "wxi-angle-down": function () { return _this.ExpandData(); },
                    "wxi-angle-up": function () { return _this.WrapData(); },
                },
            };
            return {
                cols: [more, {}],
            };
        };
        MultiMoreView.prototype.init = function () {
            this.List = this.$$("multiDayList");
            this.MoreIcon = this.$$("more");
            this._expandState = "down";
            this.maxVisibleLines = 3;
        };
        MultiMoreView.prototype.SetMoreIcon = function (mode) {
            if (!mode) {
                this.MoreIcon.setHTML("");
            }
            else {
                var tooltip = mode === "up" ? "Collapse" : "Expand";
                var _ = this.app.getService("locale")._;
                this.MoreIcon.setHTML("<div class=\"webix_scheduler_more_icon webix_icon wxi-angle-" + mode + "\" webix_tooltip=\"" + _(tooltip + " all-day events") + "\"><div>");
            }
        };
        MultiMoreView.prototype.Animate = function (mode, height, handler) {
            var _this = this;
<<<<<<< HEAD
            this.List.$view.style.transition = "height 150ms";
=======
            var delay = 150;
            this.List.$view.style.transition = "height " + delay + "ms";
>>>>>>> 6388b01 (New widget Scheduler)
            if (height)
                this.List.$view.style.height = height + "px";
            setTimeout(function () {
                if (handler)
                    handler();
                _this.List.$view.style.transition = "";
                _this._inAnimation = false;
                _this.SetMoreIcon(mode);
<<<<<<< HEAD
            }, 150);
=======
            }, delay);
>>>>>>> 6388b01 (New widget Scheduler)
        };
        return MultiMoreView;
    }(JetView));

    function _select(id, functor) {
        var trgs = this.LocateSelected(id);
        if (trgs) {
            for (var i = 0; i < trgs.length; i++)
                functor(trgs[i], "webix_scheduler_event_selected");
        }
    }
    function Select(id) {
        return _select.call(this, id, webix.html.addCss);
    }
    function Unselect(id) {
        return _select.call(this, id, webix.html.removeCss);
    }
    function HandleSelection() {
        var _this = this;
        var mode = this._SelectionMode;
        this.State = this.app.getState();
        this.on(this.State.$changes, "selected", function (v, o) {
            if (o)
                _this.Unselect(o.date && typeof o.date === "string" ? o.date : o.id);
            if (v) {
                var id_1 = v.id === "0" || !v.date ? v.id : v.date;
                setTimeout(function () { return _this.Select(id_1); }, mode !== "multi" && id_1 === "0" ? 150 : 0);
            }
        });
        if (mode !== "multi") {
            var events = this.app.getService("local").events(true);
            this.on(events.data, "onStoreUpdated", function (id, o, operation) {
                if (operation === "add" &&
                    id != "0" &&
                    _this.State.selected &&
                    _this.State.selected.id === "0") {
                    _this.State.selected.id = id;
                }
            });
        }
    }
    function locate(inner) {
        return function LocateSelected(id) {
            if (this._DataObj) {
                return Array.prototype.map.call(this._DataObj.querySelectorAll("[webix_" + (inner ? "l" : "e") + "_id=\"" + id + "\"]"), function (el) { return (inner ? el.firstElementChild : el); });
            }
            return null;
        };
    }
    function SelectionMixin(child, mode, inner) {
        child._SelectionMode = mode;
        child.Select = Select;
        child.Unselect = Unselect;
        child.HandleSelection = HandleSelection;
        child.LocateSelected = locate(inner);
        child.HandleSelection();
    }

    var Resizer = {
        $dragIn: function () {
            var ctx = this.getContext();
            if (ctx.from.mode !== this.mode)
                return false;
            return true;
        },
        $dragPos: function (pos) {
            var ctx = this.getContext();
            var box = webix.html.offset(ctx.target);
            var y = pos.y - box.y;
            if (y < ctx.y_diff)
                y = ctx.y_diff;
            else if (y > box.height)
                y = box.height;
            var height = y - ctx.y_diff;
            Resizer.updateNodeHeight.call(this, height);
            if (ctx.duration !== height) {
                ctx.duration = height;
                this.updateText(ctx);
            }
            pos.x = ctx.x_diff;
            pos.y = ctx.y_diff;
        },
        updateNodeHeight: function (height) {
            var node = webix.DragControl.getNode();
            node.style.height = Math.max(this.master.minEventHeight, height) + "px";
        },
        getActualDate: function (master, any) {
            var ctx = this.getContext();
            var date = webix.Date.copy(ctx.event.start_date);
            var minutes = (Math.round((ctx.duration * 60) / master.List.type.height / 5) || 1) * 5;
            webix.Date.add(date, minutes, "minute");
            if (!any && webix.Date.equal(date, ctx.event.end_date))
                return null;
            return {
                start_date: webix.Date.copy(ctx.event.start_date),
                end_date: date,
            };
        },
    };

<<<<<<< HEAD
=======
    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var wgantt = createCommonjsModule(function (module, exports) {
        Object.defineProperty(exports, '__esModule', { value: true });
        var d = webix.Date;
        function addMinutes(date, inc) {
            return d.add(date, inc * 1, "minute", true);
        }
        function addHours(date, inc) {
            return d.add(date, inc * 1, "hour", true);
        }
        function addDays(date, inc) {
            return d.add(date, inc * 1, "day", true);
        }
        function addWeeks(date, inc) {
            return d.add(date, inc * 1, "week", true);
        }
        function addMonths(date, inc) {
            return d.add(date, inc * 1, "month", true);
        }
        function addQuarters(date, inc) {
            return d.add(date, inc * 3, "month", true);
        }
        function addYears(date, inc) {
            return d.add(date, inc * 1, "year", true);
        }
        function differenceInYears(a, b) {
            return a.getFullYear() - b.getFullYear();
        }
        function differenceInMonths(a, b) {
            return ((a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth()));
        }
        var day_length = 86400000;
        function differenceInCalendarDays(a, b) {
            a = new Date(a);
            a.setHours(0, 0, 0, 0);
            b = new Date(b);
            b.setHours(0, 0, 0, 0);
            return Math.round((a.getTime() - b.getTime()) / day_length);
        }
        function differenceInQuarters(a, b) {
            return ((a.getFullYear() - b.getFullYear()) * 4 +
                (Math.floor(a.getMonth() / 3) + 1) -
                (Math.floor(b.getMonth() / 3) + 1));
        }
        function differenceInWeeks(a, b) {
            var diff = differenceInCalendarDays(a, b) / 7;
            var end = getDay(a);
            var start = getDay(b);
            return Math.ceil(Math.abs(diff) - (end <= start ? 0 : 1)) * Math.sign(diff);
        }
        function differenceInHours(a, b) {
            return differenceInCalendarDays(a, b) * 24 + (a.getHours() - b.getHours());
        }
        function differenceInMinutes(a, b) {
            return differenceInHours(a, b) * 60 + (a.getMinutes() - b.getMinutes());
        }
        var f_cache = {};
        function format(date, format) {
            return formatFunction(format)(date);
        }
        function formatFunction(format) {
            var cb = f_cache[format];
            if (!cb) {
                cb = f_cache[format] = d.dateToStr(format);
            }
            return cb;
        }
        function getDay(date) {
            var shift = date.getDay();
            if (d.startOnMonday) {
                if (shift === 0)
                    shift = 6;
                else
                    shift--;
            }
            return shift;
        }
        function getDatePart(date) {
            return d.datePart(date, true);
        }
        function getTimePart(date) {
            return d.timePart(date);
        }
        var diff = {
            year: differenceInYears,
            quarter: differenceInQuarters,
            month: differenceInMonths,
            week: differenceInWeeks,
            day: differenceInCalendarDays,
            hour: differenceInHours,
            minute: differenceInMinutes,
        };
        function countDaysInMonth(sdate) {
            if (!sdate)
                return 30;
            var m = sdate.getMonth();
            if (m === 1) {
                var y = sdate.getFullYear();
                if (y % 4)
                    return 28;
                if (y % 100)
                    return 29;
                if (y % 400)
                    return 28;
                return 29;
            }
            if ((m % 2 && m < 7) || (!(m % 2) && m > 7)) {
                return 30;
            }
            return 31;
        }
        var smallerCount = {
            year: ["quarter", 4],
            quarter: ["month", 3],
            month: ["day", countDaysInMonth],
            week: ["day", 7],
            day: ["hour", 24],
            hour: ["minute", 60],
        };
        var add = {
            year: addYears,
            quarter: addQuarters,
            month: addMonths,
            week: addWeeks,
            day: addDays,
            hour: addHours,
            minute: addMinutes,
        };
        function innerDiff(unit, next, prev, precise, wt) {
            var minUnit = precise ? smallerCount[unit][0] : unit;
            var start = prev;
            var end = next;
            if (wt) {
                start = getUnitStart(minUnit, prev);
                end = getUnitStart(minUnit, next);
                if (end < next)
                    end = addUnit(minUnit)(end, 1);
            }
            if (precise) {
                var filled = diff[minUnit](end, start);
                var all = smallerCount[unit][1];
                return filled / (typeof all === "number" ? all : all(prev));
            }
            else {
                return diff[minUnit](end, start);
            }
        }
        function getDiff(unit) {
            return function (next, prev, precise, wt) {
                if (unit === "month" && precise) {
                    return getMonthDayDiff(next, prev, wt);
                }
                else {
                    return innerDiff(unit, next, prev, precise, wt);
                }
            };
        }
        function getMonthDayDiff(end, start, wt) {
            if (sameMonth(start, end)) {
                return innerDiff("month", end, start, true, wt);
            }
            var daysOfFirstMonth = 0;
            if (start.getDate() > 1) {
                var me = new Date(start.getFullYear(), start.getMonth() + 1, 1);
                daysOfFirstMonth = innerDiff("month", me, start, true);
                start = me;
            }
            var months = 0;
            if (!sameMonth(start, end)) {
                months = innerDiff("month", webix.Date.monthStart(end), start);
                start = webix.Date.add(start, months, "month", true);
            }
            return daysOfFirstMonth + months + innerDiff("month", end, start, true);
        }
        function sameMonth(a, b) {
            return webix.Date.equal(webix.Date.monthStart(a), webix.Date.monthStart(b));
        }
        function addUnit(unit) {
            return add[unit];
        }
        function getUnitStart(unit, start) {
            var t;
            switch (unit) {
                case "year":
                    return new Date(start.getFullYear(), 0, 1);
                case "quarter":
                    return new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1);
                case "month":
                    return new Date(start.getFullYear(), start.getMonth(), 1);
                case "week":
                    t = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                    t.setDate(start.getDate() - getDay(start));
                    return t;
                case "day":
                    t = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                    t.setHours(0, 0, 0, 0);
                    return t;
                case "hour":
                    t = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                    t.setHours(start.getHours(), 0, 0, 0);
                    return t;
                default:
                    return new Date(start);
            }
        }
        function getMinUnit(scales) {
            var start = new Date();
            return scales
                .map(function (item) { return ({ item: item, len: addUnit(item.unit)(start, 1) }); })
                .sort(function (a, b) { return (a.len < b.len ? -1 : 1); })[0].item.unit;
        }
        function resetScales(start, end, precise, width, height, scales, isHoliday) {
            var minUnit = getMinUnit(scales);
            var diff = getDiff(minUnit);
            var tempEnd = getUnitStart(minUnit, end);
            start = getUnitStart(minUnit, start);
            end = tempEnd < end ? addUnit(minUnit)(tempEnd, 1) : tempEnd;
            var fullWidth = diff(end, start) * width;
            var fullHeight = height * scales.length;
            var rows = scales.map(function (line) {
                var cells = [];
                var add = addUnit(line.unit);
                var step = line.step || 1;
                var countInWeeks = minUnit === "week" && line.unit !== "week";
                var date = getUnitStart(line.unit, start);
                while (date < end) {
                    var next = add(date, step);
                    if (date < start)
                        date = start;
                    if (next > end)
                        next = end;
                    var cdate = date;
                    var cnext = next;
                    if (countInWeeks) {
                        if (getDay(date) > 3) {
                            cdate = webix.Date.add(date, 1, "week", true);
                        }
                        if (getDay(next) > 3) {
                            cnext = webix.Date.add(next, 1, "week", true);
                        }
                    }
                    var cellWidth = (diff(cnext, cdate) || 1) * width;
                    var value = typeof line.format === "function"
                        ? line.format(date, next)
                        : format(date, line.format);
                    var css = "";
                    if (line.css)
                        css += typeof line.css === "function" ? line.css(date) : line.css;
                    cells.push({
                        width: cellWidth,
                        value: value,
                        css: css,
                        date: date,
                        format: formatFunction(line.format),
                    });
                    date = next;
                }
                return { cells: cells, add: add, height: height, type: line.unit, step: line.step || 1 };
            });
            precise = !!(minUnit === "day" ? precise : precise != false);
            return {
                rows: rows,
                width: fullWidth,
                height: fullHeight,
                cellWidth: width,
                cellHeight: height,
                diff: diff,
                start: start,
                end: end,
                minUnit: minUnit,
                precise: precise,
                isHoliday: isHoliday,
            };
        }
        function grid(width, height, color) {
            var canvas = document.createElement("canvas");
            canvas.setAttribute("width", width);
            canvas.setAttribute("height", height);
            var ctx = canvas.getContext("2d");
            ctx.strokeStyle = color;
            ctx.moveTo(0, height);
            ctx.lineTo(width, height);
            ctx.lineTo(width, 0);
            ctx.stroke();
            return canvas.toDataURL();
        }
        function updateTask(task, i, scales, taskHeight, y) {
            if (task.type === "split" && task.$data && task.$data.length) {
                task.$data.forEach(function (k) { return getSizes(k, i, scales, taskHeight); });
            }
            else {
                getSizes(task, i, scales, taskHeight, y);
            }
            return task;
        }
        function getSizes(task, i, scales, taskHeight, y) {
            var start = scales.start, end = scales.end, cellWidth = scales.cellWidth, cellHeight = scales.cellHeight, diff = scales.diff, minUnit = scales.minUnit, precise = scales.precise;
            var startDate = task.start_date < start ? start : task.start_date;
            var endDate = task.end_date > end ? end : task.end_date;
            var astart = getUnitStart(minUnit, start);
            var ms = task.type == "milestone";
            task.$h = taskHeight;
            task.$x =
                Math.round(diff(startDate, astart, precise) * cellWidth) -
                    (ms ? task.$h / 2 : 0);
            task.$w = ms
                ? task.$h
                : Math.round(diff(endDate, startDate, precise, true) * cellWidth);
            task.$y = webix.isUndefined(y)
                ? cellHeight * i + (cellHeight - taskHeight) / 2
                : y;
        }
        function updateTaskDuration(task, scales, mode, dir) {
            if (task.start_date &&
                task.end_date &&
                task.start_date.valueOf() >= task.end_date.valueOf()) {
                task.end_date = null;
                task.duration = 1;
                if (mode)
                    mode = "move";
            }
            if (scales) {
                excludeHolidays(task, scales, mode, dir);
            }
            else {
                if (task.type == "milestone") {
                    getMilestone(task);
                }
                else {
                    if (!task.duration) {
                        task.duration = getDuration(task);
                    }
                    if (!task.end_date) {
                        task.end_date = getEnd(task);
                    }
                }
            }
        }
        function excludeHolidays(task, scales, mode, dir) {
            if (task.type == "milestone") {
                task.start_date = mode
                    ? toWorkday(task.start_date, false, scales, dir)
                    : toClosestWorkday(task.start_date, scales);
                return getMilestone(task);
            }
            if (!mode) {
                task.start_date = toClosestWorkday(task.start_date, scales);
                task.end_date = getEndWorkday(task, scales);
                task.duration = getDuration(task, scales);
            }
            else {
                if (mode == "start" || mode == "move") {
                    task.start_date = toWorkday(task.start_date, false, scales, dir);
                    if (!task.duration)
                        task.duration = getDuration(task, scales);
                    if (!task.end_date)
                        task.end_date = getEndWorkday(task, scales);
                }
                else {
                    if (!task.end_date)
                        task.end_date = getEndWorkday(task, scales);
                    if (!task.duration) {
                        task.end_date = toWorkday(task.end_date, true, scales, dir);
                        task.duration = getDuration(task, scales);
                    }
                }
            }
        }
        function getMilestone(task) {
            task.duration = 0;
            task.end_date = task.start_date;
        }
        function getEnd(task) {
            if (task.duration < 1)
                return addUnit("hour")(task.start_date, Math.floor(24 * task.duration));
            else
                return addUnit("day")(task.start_date, task.duration);
        }
        function getEndWorkday(task, scales) {
            if (task.duration < 1)
                return getEnd(task);
            var date = getDatePart(task.start_date);
            for (var w = 0, d_1 = 0; w < task.duration;) {
                if (!scales.isHoliday(date)) {
                    ++w;
                    d_1 = 0;
                }
                else {
                    if (++d_1 === 30)
                        holidayGuard();
                }
                date = addDays(date, 1);
            }
            return date;
        }
        function getDuration(task, scales) {
            var d = getDiff("day")(task.end_date, task.start_date, true);
            if (d < 1)
                return parseFloat(d.toFixed(2));
            if (!scales)
                return Math.floor(d);
            var date = task.start_date;
            var duration = 0;
            while (date < task.end_date) {
                if (!scales.isHoliday(date))
                    ++duration;
                date = addDays(date, 1);
            }
            return duration;
        }
        function toClosestWorkday(date, scales) {
            var left = date;
            var right = date;
            var notRight;
            var d = 0;
            while (d < 30 &&
                (notRight = scales.isHoliday(right)) &&
                scales.isHoliday(left)) {
                left = addDays(left, -1);
                right = addDays(right, 1);
                d++;
            }
            if (d === 30)
                holidayGuard();
            return !notRight ? right : left;
        }
        function holidayGuard() {
            alert("No work days found within 30 days, check your isHoliday function!", "error");
            throw "Wrong isHoliday function";
        }
        function toWorkday(date, end, scales, dir) {
            var d = 0;
            while (d < 30 && scales.isHoliday(getCheckDate(date, end))) {
                date = addDays(date, dir);
                d++;
            }
            if (d === 30)
                holidayGuard();
            return date;
        }
        function getCheckDate(date, end) {
            return end && !getTimePart(date) ? addDays(date, -1) : date;
        }
        var delta = 20;
        var updateLink = function (link, startTask, endTask, height) {
            var dy = Math.round(height / 2);
            if (!startTask || !endTask) {
                link.$p = "";
                return link;
            }
            var sx, sy, ex, ey;
            var s_start = false;
            var e_start = false;
            switch (link.type) {
                case 0:
                    e_start = true;
                    break;
                case 1:
                    s_start = true;
                    e_start = true;
                    break;
                case 3:
                    s_start = true;
                    break;
            }
            sx = s_start ? startTask.$x : startTask.$x + startTask.$w;
            sy = startTask.$y;
            ex = e_start ? endTask.$x : endTask.$x + endTask.$w;
            ey = endTask.$y;
            if (differentX(startTask, endTask, sx, ex, height) || sy !== ey) {
                var lineCoords = getLineCoords(sx, sy + dy, ex, ey + dy, s_start, e_start, 38 / 2);
                var arrowCoords = getArrowCoords(ex, ey + dy, e_start);
                link.$p = lineCoords + "," + arrowCoords;
            }
            else {
                link.$p = "";
            }
            return link;
        };
        function differentX(startTask, endTask, sx, ex, height) {
            return startTask.type === "milestone" || endTask.type === "milestone"
                ? Math.abs(sx - ex) > height / 2
                : sx !== ex;
        }
        function getLineCoords(sx, sy, ex, ey, s_start, e_start, gapp) {
            var shift = delta * (s_start ? -1 : 1);
            var backshift = delta * (e_start ? -1 : 1);
            var sx1 = sx + shift;
            var ex1 = ex + backshift;
            var line = [sx, sy, sx1, sy, 0, 0, 0, 0, ex1, ey, ex, ey];
            var dx = ex1 - sx1;
            var dy = ey - sy;
            var same = e_start === s_start;
            if (!same && ((ex1 <= sx && e_start) || (ex1 > sx && !e_start))) {
                dy -= gapp;
            }
            if ((same && e_start && sx1 > ex1) || (same && !e_start && sx1 < ex1)) {
                line[4] = line[2] + dx;
                line[5] = line[3];
                line[6] = line[4];
                line[7] = line[5] + dy;
            }
            else {
                line[4] = line[2];
                line[5] = line[3] + dy;
                line[6] = line[4] + dx;
                line[7] = line[5];
            }
            return line.join(",");
        }
        function getArrowCoords(x, y, start) {
            if (start) {
                return x - 5 + "," + (y - 3) + "," + (x - 5) + "," + (y + 3) + "," + x + "," + y;
            }
            else {
                return x + 5 + "," + (y + 3) + "," + (x + 5) + "," + (y - 3) + "," + x + "," + y;
            }
        }
        function newLink(box, start, end) {
            if (start && end) {
                var width = end.x - start.x;
                var height = end.y - start.y;
                var left = (width > 0 ? start.x : end.x) - box.left;
                var top_1 = (height > 0 ? start.y : end.y) - box.top;
                var p = (width > 0 ? 0 : -width) + "," + (height > 0 ? 0 : -height) + "," + (width > 0 ? width : 0) + "," + (height > 0 ? height : 0);
                return { width: Math.abs(width), height: Math.abs(height), left: left, top: top_1, p: p };
            }
            else {
                return null;
            }
        }
        exports.addUnit = addUnit;
        exports.getDiff = getDiff;
        exports.getUnitStart = getUnitStart;
        exports.grid = grid;
        exports.newLink = newLink;
        exports.resetScales = resetScales;
        exports.smallerCount = smallerCount;
        exports.updateLink = updateLink;
        exports.updateTask = updateTask;
        exports.updateTaskDuration = updateTaskDuration;
    });
    unwrapExports(wgantt);
    var wgantt_1 = wgantt.addUnit;
    var wgantt_2 = wgantt.getDiff;
    var wgantt_3 = wgantt.getUnitStart;
    var wgantt_4 = wgantt.grid;
    var wgantt_5 = wgantt.newLink;
    var wgantt_6 = wgantt.resetScales;
    var wgantt_7 = wgantt.smallerCount;
    var wgantt_8 = wgantt.updateLink;
    var wgantt_9 = wgantt.updateTask;
    var wgantt_10 = wgantt.updateTaskDuration;

    function updateDragPos(e, pos) {
        if (webix.DragControl.active) {
            var node = webix.DragControl.getNode();
            pos = webix.copy(pos);
            webix.DragControl.$dragPos(pos, e);
            node.style.top = pos.y + webix.DragControl.top + "px";
            node.style.left = pos.x + webix.DragControl.left + "px";
        }
    }
    var DragScroll = {
        start: function (ctx, e) {
            ctx._auto_scroll_delay = webix.delay(DragScroll.autoScroll, ctx, [e, webix.html.pos(e)], 250);
        },
        reset: function (ctx) {
            if (ctx._auto_scroll_delay)
                ctx._auto_scroll_delay = window.clearTimeout(ctx._auto_scroll_delay);
        },
        autoScroll: function (e, pos) {
            var yScroll = this.direction.indexOf("y") !== -1;
            var xScroll = this.direction.indexOf("x") !== -1;
            var box = webix.html.offset(this.from.view.$view);
            var reset = false;
            if (yScroll && DragScroll.autoYScroll.call(this, pos, box, this.senseY))
                reset = true;
            if (xScroll && DragScroll.autoXScroll.call(this, pos, box, this.senseX))
                reset = true;
            if (reset) {
                updateDragPos(e, pos);
                this._auto_scroll_delay = webix.delay(DragScroll.autoScroll, this, [e, pos], 100);
            }
        },
        autoYScroll: function (pos, box, sense) {
            var scroll = this.from.view.getScrollState();
            if (pos.y < box.y + sense) {
                return DragScroll.autoScrollTo.call(this, scroll.x, scroll.y - sense, "y");
            }
            else if (pos.y > box.y + box.height - sense) {
                return DragScroll.autoScrollTo.call(this, scroll.x, scroll.y + sense, "y");
            }
            return false;
        },
        autoXScroll: function (pos, box, sense) {
            var scroll = this.from.view.getScrollState();
            if (pos.x < box.x + sense) {
                return DragScroll.autoScrollTo.call(this, scroll.x - sense, scroll.y, "x");
            }
            else if (pos.x > box.x + box.width - sense) {
                var x = this.snode
                    ? Math.min(scroll.x + sense, this.snode.scrollWidth - box.width)
                    : scroll.x + sense;
                return x == scroll.x
                    ? false
                    : DragScroll.autoScrollTo.call(this, x, scroll.y, "x");
            }
            return false;
        },
        autoScrollTo: function (x, y, mode) {
            this.from.view.scrollTo(x, y);
            this.from.view.callEvent("onAfterAutoScroll", []);
            var scroll = this.from.view.getScrollState();
            return Math.abs((mode === "x" ? x : y) - scroll[mode]) < 1;
        },
    };

>>>>>>> 6388b01 (New widget Scheduler)
    function initDnD(view, mode, dragOnly) {
        var ctrl = webix.copy(modes[mode]);
        ctrl.view = view;
        ctrl.master = this;
        ctrl.State = this.app.getState();
<<<<<<< HEAD
        ctrl.Local = this.app.getService("local").events(true);
=======
        var local = this.app.getService("local");
        ctrl.Local = local.events(true);
        ctrl.Calendars = local.calendars(true);
>>>>>>> 6388b01 (New widget Scheduler)
        ctrl.Ops = this.app.getService("operations");
        webix.DragControl.addDrag(view.$view, ctrl);
        if (!dragOnly)
            webix.DragControl.addDrop(view.$view, ctrl, true);
    }
<<<<<<< HEAD
    function locateEvent(e, view) {
        var target = e.target;
        var id, node;
        do {
            id = target.getAttribute("webix_e_id");
            node = id ? target : null;
            target = target.parentNode;
        } while (!id && target !== view);
=======
    function locateEvent$1(e, view, attr) {
        var target = e.target;
        var id, node;
        do {
            id = target.getAttribute ? target.getAttribute(attr || "webix_e_id") : null;
            node = id ? target : null;
            target = target.parentNode;
        } while (!id && target && target !== view);
>>>>>>> 6388b01 (New widget Scheduler)
        return { id: id, node: node };
    }
    function updateSelection(prev, date) {
        if (this.State.selected) {
            var selection = getParams(prev);
            if (prev.$recurring)
                selection.date = date.start_date.valueOf() + "_" + prev.$id;
            this.State.selected = selection;
        }
    }
    function editRecurring(mode, obj, change) {
        var _this = this;
        var id = obj.$id || obj.id;
<<<<<<< HEAD
        if (mode === "this" && this.master.HasOneOccurrence(obj)) {
            return this.Ops.updateEvent(id, change);
=======
        var data = this.Local.getItem(id);
        if (mode === "this" &&
            this.master.HasOneOccurrence(__assign(__assign({}, obj), { start_date: data.start_date, end_date: data.end_date }))) {
            return this.Ops.updateEvent(id, change, undefined, undefined, true);
>>>>>>> 6388b01 (New widget Scheduler)
        }
        mode = this.master.ChangeMode(mode, obj, this.Local.getItem(obj.recurring ? id : obj.origin_id).start_date, obj.recurring ? obj.id : obj.start_date);
        if (!mode) {
            obj.$recurring = movePattern(obj.$recurring, change, obj);
            change.recurring = serialize(obj.$recurring);
<<<<<<< HEAD
            return this.Ops.updateEvent(id, change);
=======
            return this.Ops.updateEvent(id, change, undefined, undefined, true);
>>>>>>> 6388b01 (New widget Scheduler)
        }
        if (mode === "this" || mode === "next") {
            var recurring = "";
            var parent_1;
            if (mode === "this") {
                recurring = cutOccurrence(obj.id, obj);
            }
            else {
                if (obj.recurring) {
                    recurring = clipSequence(obj.id, webix.copy(obj));
                }
                else {
                    id = obj.origin_id;
                    parent_1 = webix.copy(this.Local.getItem(id));
                    recurring = clipSequence(change.start_date, webix.copy(parent_1), true);
                }
            }
            var newEvent_1 = newSubEvent.call(this, id, mode, obj, change, parent_1);
<<<<<<< HEAD
            return this.Ops.updateEvent(id, { recurring: recurring }, mode, webix.Date.dayStart(change.start_date)).then(function () {
                return _this.Ops.addEvent(newEvent_1);
=======
            return this.Ops.updateEvent(id, { recurring: recurring }, mode, webix.Date.dayStart(newEvent_1.start_date), true).then(function () {
                return _this.Ops.addEvent(newEvent_1, true);
>>>>>>> 6388b01 (New widget Scheduler)
            });
        }
        if (mode === "all") {
            var oid = obj.origin_id || obj.$id;
            var all = webix.copy(this.Local.getItem(oid));
            var rec = all.$recurring;
            if (rec.COUNT || rec.UNTIL) {
                rec = this.master.CorrectCountUntil(all, mode, change.start_date, this.Local);
            }
<<<<<<< HEAD
            rec = movePattern(rec, change, all);
            if (rec.EXDATE)
                delete rec.EXDATE;
            change.recurring = serialize(rec);
            return this.Ops.updateEvent(obj.origin_id || id, change, mode);
        }
    }
    function newSubEvent(id, mode, obj, change, parent) {
        var newEvent = {
            text: obj.text,
            details: obj.details,
            color: obj.color,
            all_day: obj.all_day,
            start_date: change.start_date,
            end_date: change.end_date,
            origin_id: obj.origin_id || id,
        };
=======
            if (!change.start_date || isSameDate(obj.start_date, change.start_date)) {
                if (change.start_date) {
                    change.start_date = joinDateTime(all.start_date, change.start_date);
                }
                if (change.end_date) {
                    if (isSameDate(obj.end_date, change.end_date)) {
                        change.end_date = joinDateTime(all.end_date, change.end_date);
                    }
                    else {
                        change.end_date = shiftDate(all.end_date, obj.end_date, change.end_date);
                    }
                }
            }
            else {
                if (!change.end_date) {
                    change.start_date = shiftDate(all.start_date, obj.start_date, change.start_date);
                }
                rec = movePattern(rec, change, all);
            }
            if (change.start_date) {
                if (rec.EXDATE)
                    delete rec.EXDATE;
                change.recurring = serialize(rec);
            }
            return this.Ops.updateEvent(obj.origin_id || id, change, mode, undefined, true);
        }
    }
    function shiftDate(mainDate, occDate, changeDate) {
        return new Date(mainDate * 1 + (changeDate - occDate));
    }
    function joinDateTime(ddate, dtime) {
        var time = webix.Date.timePart(dtime) * 1000;
        return new Date(webix.Date.dayStart(ddate) * 1 + time);
    }
    function newSubEvent(id, mode, obj, change, parent) {
        var newEvent = __assign(__assign(__assign({}, obj), change), { recurring: "" });
        if (!newEvent.origin_id)
            newEvent.origin_id = id;
>>>>>>> 6388b01 (New widget Scheduler)
        if (mode === "next") {
            var rec = webix.copy(obj.recurring ? obj.$recurring : parent.$recurring);
            if (rec.COUNT || rec.UNTIL) {
                rec = this.master.CorrectCountUntil(__assign(__assign({}, this.Local.getItem(id)), { $recurring: rec }), mode, newEvent.start_date, this.Local);
            }
            rec = movePattern(rec, newEvent, obj);
            rec.EXDATE = [];
            newEvent.recurring = serialize(rec);
        }
<<<<<<< HEAD
        if (this.master.app.config.calendars) {
            newEvent.calendar = obj.calendar;
        }
=======
        delete newEvent.$id;
>>>>>>> 6388b01 (New widget Scheduler)
        return newEvent;
    }
    var common = {
        mode: "common",
<<<<<<< HEAD
        $dragDestroy: function (target, node) {
            var ctx = this.getContext();
            if (!ctx.$waitUpdate)
=======
        $longTouchLimit: true,
        $dragDestroy: function (target, node) {
            var ctx = this.getContext();
            if (!ctx.$waitUpdate && ctx.node)
>>>>>>> 6388b01 (New widget Scheduler)
                ctx.node.style.visibility = "visible";
            if (ctx.$resize)
                webix.html.removeCss(document.body, "webix_active_resize");
            webix.html.remove(node);
<<<<<<< HEAD
=======
            if (ctx.moveMode === "move" && !ctx.more)
                DragScroll.reset(ctx);
>>>>>>> 6388b01 (New widget Scheduler)
            return false;
        },
        getContext: function () {
            return webix.DragControl.getContext();
        },
        setDragOffset: function (node, target, e) {
            var ctx = this.getContext();
            var pos = webix.html.pos(e);
            var offset = webix.html.offset(node);
            ctx.width = offset.width;
            ctx.height = offset.height;
            ctx.x_offset = offset.x - pos.x;
            ctx.y_offset = offset.y - pos.y;
        },
<<<<<<< HEAD
        updateEvent: function (event, data, ctx) {
            var _this = this;
            if (ctx.event.$id || ctx.event.origin_id) {
                this.master._waitPopup = webix.promise.defer();
                this.master._waitPopup
                    .then(function (o) {
                    var res = editRecurring.call(_this, o, ctx.event, data);
=======
        updateEvent: function (event, data) {
            var _this = this;
            if (event.$id || event.origin_id) {
                this.master._waitPopup = webix.promise.defer();
                this.master._waitPopup
                    .then(function (o) {
                    var res = editRecurring.call(_this, o, event, data);
>>>>>>> 6388b01 (New widget Scheduler)
                    res.then(function () { return updateSelection.call(_this, event, data); });
                    _this.master.app.callEvent("backend:operation", [res]);
                })
                    .finally(function () { return (_this.master._waitPopup = null); });
                this.master.app._dndActionPopup.Show(this.master._waitPopup);
            }
            else {
<<<<<<< HEAD
                var res = this.Ops.updateEvent(event.$id || event.id, data);
                this.finishOperation(res, event, data, ctx);
            }
        },
        addEvent: function (event, data, ctx) {
=======
                var res = this.Ops.updateEvent(event.$id || event.id, data, undefined, undefined, true);
                this.finishOperation(res, event, data);
            }
        },
        addEvent: function (event, data) {
>>>>>>> 6388b01 (New widget Scheduler)
            var newEvent = {
                text: event.text,
                start_date: data.start_date,
                end_date: data.end_date,
                details: "",
            };
            if (this.master.app.config.calendars) {
                newEvent.calendar = event.calendar;
            }
<<<<<<< HEAD
            var res = this.Ops.addEvent(newEvent);
            this.finishOperation(res, newEvent, data, ctx);
        },
        finishOperation: function (res, event, data, ctx) {
            var _this = this;
=======
            if (this.master.app.config.timeline) {
                newEvent.section = data.section || event.section;
            }
            if (this.master.app.config.units && event.units) {
                newEvent.units = data.units || event.units;
            }
            var res = this.Ops.addEvent(newEvent, true);
            this.finishOperation(res, newEvent, data);
        },
        copyEvent: function (event, data) {
            var newEvent = __assign(__assign({}, event), data);
            cleanEventData.call(this.master, newEvent);
            var res = this.Ops.addEvent(newEvent, true);
            this.finishOperation(res, newEvent, data);
        },
        finishOperation: function (res, event, data) {
            var _this = this;
            var ctx = this.getContext();
>>>>>>> 6388b01 (New widget Scheduler)
            res.then(function (id) {
                return updateSelection.call(_this, id ? __assign(__assign({}, event), { id: id }) : event, data);
            });
            this.master.app.callEvent("backend:operation", [res]);
            ctx["$waitUpdate"] = true;
        },
    };
    var day = webix.extend({
        mode: "day",
        $dragIn: function (source, target) {
            var ctx = this.getContext();
            if (ctx.$resize)
                return Resizer.$dragIn.apply(this, arguments);
            if (ctx.from.mode !== this.mode)
                return false;
            if (ctx.target != target) {
                var node = webix.DragControl.getNode();
                target.firstChild.appendChild(node);
                ctx.target = target;
            }
            return true;
        },
<<<<<<< HEAD
        $drop: function () {
            var ctx = this.getContext();
            if (ctx.from.mode !== this.mode)
                return false;
            var date = this.getActualDate(this.master);
            if (date) {
                if (ctx.event.id == "0") {
                    this.addEvent(ctx.event, date, ctx);
                }
                else
                    this.updateEvent(ctx.event, date, ctx);
=======
        $drop: function (source, target, e) {
            var ctx = this.getContext();
            webix.extend(ctx, { to: this });
            var app = this.master.app;
            var cancelDrop = ctx.from.mode !== this.mode ||
                !app.callEvent("app:beforedrop", [ctx, e]);
            if (cancelDrop) {
                return false;
            }
            var date = this.getActualDate(this.master);
            if (date) {
                if (ctx.event.id == "0") {
                    if (ctx.$creation) {
                        this.State.selected = {
                            id: "0",
                            date: ctx.event.start_date,
                            end_date: date.end_date,
                        };
                    }
                    else {
                        this.addEvent(ctx.event, date);
                    }
                }
                else if (ctx.$copy && !ctx.$resize) {
                    this.copyEvent(ctx.event, date);
                }
                else {
                    this.updateEvent(ctx.event, date);
                }
>>>>>>> 6388b01 (New widget Scheduler)
            }
        },
        $dragPos: function (pos) {
            var ctx = this.getContext();
            if (ctx.$resize)
                return Resizer.$dragPos.apply(this, arguments);
            var box = webix.html.offset(ctx.target);
            var max = box.height - ctx.height;
            pos.x = ctx.x_diff;
            pos.y += ctx.y_offset - box.y;
            if (pos.y < 0)
                pos.y = 0;
            else if (pos.y > max)
                pos.y = max;
            webix.extend(ctx, pos, true);
            if (ctx.$last_y !== pos.y) {
                this.updateText(ctx);
                ctx.$last_y = pos.y;
            }
        },
        $dragCreate: function (target, e) {
            if (this.State.readonly)
                return false;
<<<<<<< HEAD
            var event = locateEvent(e, target);
            if (event.id) {
                var ctx = this.getContext();
=======
            var ctx = this.getContext();
            var event = locateEvent$1(e, target);
            if (event.id) {
>>>>>>> 6388b01 (New widget Scheduler)
                webix.extend(ctx, event, true);
                webix.extend(ctx, { from: this, target: target }, true);
                ctx.event = this.master.GetEvent(event.id);
                this.setDragOffset(event.node, target, e);
                if (e.target.getAttribute("webix_resizer")) {
<<<<<<< HEAD
                    webix.html.addCss(document.body, "webix_active_resize", true);
                    ctx["$resize"] = true;
                }
                var html = event.node.cloneNode(true);
                html.className += " webix_drag_zone webix_" + (ctx.$resize ? "resize" : "drag") + "_event";
                target.firstChild.appendChild(html);
                event.node.style.visibility = "hidden";
                return html;
            }
=======
                    ctx["$resize"] = true;
                }
                var app = this.master.app;
                if (!app.callEvent("app:beforedrag", [ctx, e])) {
                    return false;
                }
                else if (ctx.$resize) {
                    webix.html.addCss(document.body, "webix_active_resize", true);
                }
                var html = event.node.cloneNode(true);
                html.className += " webix_drag_zone webix_" + (ctx.$resize ? "resize" : "drag") + "_event";
                target.firstChild.appendChild(html);
                ctx.$copy = (e.ctrlKey || e.metaKey) && app.config.copypaste;
                if (!ctx.$copy || event.id === "0" || ctx.$resize)
                    event.node.style.visibility = "hidden";
                return html;
            }
            else if (this.master.app.config.dragCreate && !this.State.clipboard) {
                var scrollY_1 = this.view.getScrollState().y;
                var parentTopOffset = webix.html.offset(target).y;
                ctx.y = webix.html.pos(e).y - parentTopOffset + scrollY_1;
                var _a = this.getActualDate(this.master, true), start_date = _a.start_date, end_date = _a.end_date;
                ctx.event = {
                    id: "0",
                    text: "",
                    start_date: start_date,
                    end_date: end_date,
                    $color: "#997CEB",
                    $textColor: "#fff",
                    $top: ctx.y,
                    $left: 0,
                    $height: this.master.minEventHeight,
                    $width: this.master.List.$width - 8,
                };
                var calId = this.Calendars.getFirstId();
                if (calId)
                    ctx.event.$color = this.Calendars.getItem(calId).color;
                webix.extend(ctx, { from: this, target: target }, true);
                var html = webix.html.create("div");
                html.innerHTML = this.master.ToHTML(ctx.event);
                html.firstChild.className += " webix_drag_zone webix_resize_event";
                webix.html.addCss(document.body, "webix_active_resize", true);
                var node = target.firstChild.appendChild(html.firstChild);
                this.setDragOffset(node, target, e);
                ctx.$resize = true;
                ctx.$creation = true;
                return node;
            }
>>>>>>> 6388b01 (New widget Scheduler)
            return false;
        },
        getActualDate: function (master, any) {
            var ctx = this.getContext();
            if (ctx.$resize)
                return Resizer.getActualDate.apply(this, arguments);
            var date = webix.Date.copy(master.Day);
            var delta = master.List.getFirstId() * master.List.type.height;
            var minutes = Math.round(((ctx.y + delta) * 60) / master.List.type.height / 5) * 5;
            webix.Date.add(date, minutes, "minute");
            if (!any && webix.Date.equal(date, ctx.event.start_date))
                return null;
<<<<<<< HEAD
            var duration = ctx.event.end_date - ctx.event.start_date;
=======
            var duration = ctx.event
                ? ctx.event.end_date - ctx.event.start_date
                : 3600000;
>>>>>>> 6388b01 (New widget Scheduler)
            return {
                start_date: date,
                end_date: new Date(date.valueOf() + duration),
            };
        },
        updateText: function (ctx) {
            var node = webix.DragControl.getNode();
            var ctrl = webix.DragControl.getMaster(ctx.target);
            var event = this.getActualDate(ctrl.master, true);
            event.text = ctx.event.text;
            node.innerHTML = "";
            node.innerHTML = ctrl.master.EventTemplate(event);
        },
        setDragOffset: function (node, target, e) {
            var ctx = this.getContext();
            var pos = webix.html.pos(e);
            var noff = webix.html.offset(node);
            ctx.height = noff.height;
            ctx.x_offset = noff.x - pos.x;
            ctx.y_offset = noff.y - pos.y;
            var toff = webix.html.offset(target);
            ctx.x_diff = noff.x - toff.x - 1;
            ctx.y_diff = noff.y - toff.y;
        },
    }, common);
    var month = webix.extend({
        mode: "month",
        $dragIn: function (source, target, e) {
            var ctx = this.getContext();
            if (ctx.from.mode !== this.mode)
                return false;
            ctx.offset = ctx.offset || webix.html.offset(target);
            var index = this.locate(e);
            var id = this.view.getIdByIndex(index);
            var node = this.view.getItemNode(id);
            if (ctx.$marked !== id)
                this.markDropArea(id);
            return node;
        },
        $dragOut: function (source, target, drop) {
            if (target !== drop)
                this.markDropArea();
            return null;
        },
        $drop: function (source, target, e) {
            var ctx = this.getContext();
<<<<<<< HEAD
            if (ctx.from.mode !== this.mode)
                return false;
            this.markDropArea();
            var date = this.getActualDate(e);
            if (date) {
                if (ctx.event.id == "0") {
                    this.addEvent(ctx.event, date, ctx);
                }
                else
                    this.updateEvent(ctx.event, date, ctx);
=======
            webix.extend(ctx, { to: this });
            var app = this.master.app;
            var cancelDrop = ctx.from.mode !== this.mode ||
                !app.callEvent("app:beforedrop", [ctx, e]);
            if (cancelDrop) {
                return false;
            }
            this.markDropArea();
            var copy = ctx.$copy;
            var date = this.getActualDate(e, copy);
            if (date) {
                if (ctx.event.id == "0") {
                    this.addEvent(ctx.event, date);
                }
                else if (copy) {
                    this.copyEvent(ctx.event, date);
                }
                else
                    this.updateEvent(ctx.event, date);
>>>>>>> 6388b01 (New widget Scheduler)
            }
        },
        $dragPos: function (pos) {
            var ctx = this.getContext();
            pos.x += ctx.x_offset;
            pos.y += ctx.y_offset;
        },
        $dragCreate: function (target, e) {
            if (this.State.readonly)
                return false;
<<<<<<< HEAD
            var event = locateEvent(e, target);
=======
            var event = locateEvent$1(e, target);
>>>>>>> 6388b01 (New widget Scheduler)
            if (event.id && event.id != "$wsh_multi_more") {
                var ctx = this.getContext();
                webix.extend(ctx, event, true);
                webix.extend(ctx, { from: this, offset: webix.html.offset(target) }, true);
                ctx.event = this.master.Events.getItem(event.id);
                ctx.start = this.view.getIdByIndex(this.locate(e));
                this.setDragOffset(event.node, target, e);
<<<<<<< HEAD
=======
                var app = this.master.app;
                if (!app.callEvent("app:beforedrag", [ctx, e])) {
                    return false;
                }
>>>>>>> 6388b01 (New widget Scheduler)
                var drag_container = document.createElement("DIV");
                var html = event.node.cloneNode(true);
                html.style.position = "static";
                drag_container.appendChild(html);
                drag_container.className =
                    target.className + " webix_drag_zone webix_drag_event";
                document.body.appendChild(drag_container);
<<<<<<< HEAD
                event.node.style.visibility = "hidden";
=======
                ctx.$copy = (e.ctrlKey || e.metaKey) && app.config.copypaste;
                if (!ctx.$copy || ctx.event.id === "0")
                    event.node.style.visibility = "hidden";
>>>>>>> 6388b01 (New widget Scheduler)
                webix.callEvent("onClick", [e]);
                return drag_container;
            }
            return false;
        },
<<<<<<< HEAD
        getActualDate: function (e) {
            var ctx = this.getContext();
            var diff = this.locate(e) - this.view.getIndexById(ctx.start);
            if (!diff)
=======
        getActualDate: function (e, any) {
            var ctx = this.getContext();
            var diff = this.locate(e) - this.view.getIndexById(ctx.start);
            if (!diff && !any)
>>>>>>> 6388b01 (New widget Scheduler)
                return null;
            return {
                start_date: webix.Date.add(ctx.event.start_date, diff, "day", true),
                end_date: webix.Date.add(ctx.event.end_date, diff, "day", true),
            };
        },
        markDropArea: function (id) {
            var ctx = this.getContext();
            if (ctx.$marked && ctx.$marked != id) {
                this.view.removeCss(ctx.$marked, "webix_drag_over");
                ctx.$marked = null;
                if (ctx.$extra) {
                    webix.html.removeCss(this.view.$view, ctx.$extra);
                    ctx.$extra = null;
                }
            }
            if (!ctx.$marked && id) {
                this.view.addCss(id, "webix_drag_over");
                ctx.$marked = id;
                var extra = void 0;
                if (this.view.getFirstId() == id)
                    extra = "webix_scheduler_dnd_1";
                else if (this.view.getLastId() == id)
                    extra = "webix_scheduler_dnd_n";
                if (extra) {
                    webix.html.addCss(this.view.$view, extra, true);
                    ctx.$extra = extra;
                }
            }
        },
        locate: function (e) {
            var ctx = this.getContext();
            var pos = webix.html.pos(e);
            pos.x -= ctx.offset.x;
            pos.y -= ctx.offset.y;
            return (Math.min(Math.floor(pos.y / this.view.type.height), this.view.config.yCount - 1) *
                this.view.config.xCount +
                Math.min(Math.floor(pos.x / this.view.type.width), this.view.config.xCount - 1));
        },
    }, common);
    var multiday = webix.extend({
        mode: "multiday",
    }, month);
    var more = webix.extend({
        $dragCreate: function (target, e) {
            if (this.State.readonly)
                return false;
            var id = this.view.locate(e);
            if (id) {
                var ctx = this.getContext();
                var node = this.view.getItemNode(id).children[0];
                webix.extend(ctx, { from: this, id: id }, true);
                ctx.event = this.master.Events.getItem(id);
                ctx.start = this.master.ID;
                this.setDragOffset(node, target, e);
<<<<<<< HEAD
=======
                if (!this.master.app.callEvent("app:beforedrag", [ctx, e])) {
                    return false;
                }
>>>>>>> 6388b01 (New widget Scheduler)
                var drag_container = document.createElement("DIV");
                drag_container.style.width = ctx.width + "px";
                drag_container.style.height = ctx.height + "px";
                drag_container.appendChild(node.cloneNode(true));
                drag_container.className =
                    target.className + " webix_drag_zone webix_drag_event";
                document.body.appendChild(drag_container);
                this.master.HideWindow();
                return drag_container;
            }
            return false;
        },
        $dragDestroy: function (target, node) {
            webix.html.remove(node);
            return false;
        },
    }, month);
<<<<<<< HEAD
=======
    var units = webix.extend({
        mode: "units",
        $drop: function (source, target, e) {
            var ctx = this.getContext();
            webix.extend(ctx, { to: this });
            var app = this.master.app;
            var cancelDrop = ctx.from.mode !== this.mode ||
                !app.callEvent("app:beforedrop", [ctx, e]);
            if (cancelDrop) {
                return false;
            }
            var copy = ctx.$copy;
            var date = this.getActualDate(this.master, copy);
            var units = this.getEventUnits(ctx);
            if (date || units) {
                var update = webix.extend(date || {}, units || {});
                if (ctx.event.id == "0") {
                    if (ctx.$creation) {
                        this.State.selected = {
                            id: "0",
                            date: ctx.event.start_date,
                            end_date: update.end_date,
                            unit: update.units,
                        };
                    }
                    else {
                        this.addEvent(ctx.event, update);
                    }
                }
                else if (copy && !ctx.$resize) {
                    this.copyEvent(ctx.event, update);
                }
                else {
                    this.updateEvent(ctx.event, update);
                }
            }
        },
        getEventUnits: function (ctx) {
            var sourceUnit = ctx.from.master.Unit.id + "";
            if (ctx.event.units) {
                var currentUnits = ctx.event.units.split(",");
                var targetUnit = this.master.Unit.id + "";
                if (targetUnit == sourceUnit || ctx.$resize)
                    return;
                var newUnits = currentUnits.filter(function (unit) { return unit != sourceUnit; });
                if (currentUnits.indexOf(targetUnit) === -1) {
                    newUnits.push(targetUnit);
                }
                return { units: newUnits.join(",") };
            }
            else {
                return { units: sourceUnit };
            }
        },
    }, day);
    var multidayUnits = webix.extend({
        mode: "multidayUnits",
        $dragCreate: function (target, e) {
            if (this.State.readonly)
                return false;
            var event = locateEvent$1(e, target, "webix_l_id");
            if (event.id && event.id != "$wsh_multi_more") {
                var ctx = this.getContext();
                webix.extend(ctx, event, true);
                webix.extend(ctx, { from: this, target: target }, true);
                ctx.event = this.master.GetEvent(event.id);
                this.setDragOffset(event.node, target, e);
                var app = this.master.app;
                if (!app.callEvent("app:beforedrag", [ctx, e])) {
                    return false;
                }
                var html = event.node.cloneNode(true);
                html.className += " webix_drag_zone webix_drag_event";
                html.style.width = "100%";
                target.firstChild.appendChild(html);
                ctx.$copy = (e.ctrlKey || e.metaKey) && app.config.copypaste;
                if (!ctx.$copy)
                    event.node.style.visibility = "hidden";
                return html;
            }
            return false;
        },
        $dragPos: function (pos) {
            var ctx = this.getContext();
            var box = webix.html.offset(ctx.target);
            var max = box.height - ctx.height;
            pos.x = ctx.x_diff;
            pos.y += ctx.y_offset - box.y;
            if (pos.y < 0)
                pos.y = 0;
            else if (pos.y > max)
                pos.y = max;
            webix.extend(ctx, pos, true);
        },
        getActualDate: function (master, any) {
            var date = master.State.date;
            var ctx = this.getContext();
            if (!any && webix.Date.equal(date, ctx.event.start_date))
                return null;
            var duration = ctx.event.end_date - ctx.event.start_date;
            return {
                start_date: date,
                end_date: new Date(date.valueOf() + duration),
            };
        },
    }, units);
    var timeline = webix.extend({
        mode: "timeline",
        dragScroll: {
            direction: "xy",
        },
        locate: function (e) {
            var ctx = this.getContext();
            var nscroll = this.view.getScrollState();
            var height = this.view.$scope.Sections.count();
            var y = this.getEventContext(e, ctx).y - ctx.offset.y + nscroll.y;
            return Math.min(Math.floor(y / this.view.type.height), height - 1);
        },
        $dragCreate: function (target, e, pointer) {
            var ctx = this.getContext();
            ctx.$touch = pointer === "touch";
            var app = this.master.app;
            if (this.State.readonly)
                return false;
            var event = locateEvent$1(e, target);
            if (event.id && event.id != "$wsh_multi_more") {
                var node = event.node;
                var evContext = this.getEventContext(e, ctx);
                var moveMode = getMoveMode(node, evContext.x);
                var scroll_1 = this.view.getScrollState();
                webix.extend(ctx, __assign(__assign({}, event), { from: this, offset: webix.html.offset(target), moveMode: moveMode, step: this.getStep(), dx: 0, scroll: scroll_1, x: evContext.x, t: parseInt(node.style.top), l: parseInt(node.style.left), w: parseInt(node.style.width) }), true);
                ctx.event = this.master.Events.getItem(event.id);
                ctx.start = this.view.getIdByIndex(this.locate(e));
                this.setDragOffset(node, target, e);
                if (!app.callEvent("app:beforedrag", [ctx, e])) {
                    return false;
                }
                if (ctx.moveMode === "move")
                    webix.extend(ctx, updateDragScrollConfig.call(this, this.dragScroll, this.view.$scope.Scales));
                var drag_container = document.createElement("DIV");
                var html = node.cloneNode(true);
                html.style.position = "static";
                drag_container.appendChild(html);
                drag_container.className =
                    target.className + " webix_drag_zone webix_drag_event";
                node.parentNode.appendChild(drag_container);
                ctx.$copy = (e.ctrlKey || e.metaKey) && app.config.copypaste;
                if (!ctx.$copy || ctx.event.id === "0" || ctx.moveMode !== "move")
                    node.style.visibility = "hidden";
                webix.callEvent("onClick", [e]);
                return drag_container;
            }
            return false;
        },
        getEventContext: function (e, ctx) {
            if (ctx.$touch) {
                if (e.changedTouches && !(e.touches && e.touches[0])) {
                    var t = e.changedTouches[0];
                    return { x: t.pageX, y: t.pageY };
                }
                return e.time ? e : webix.env.touch.context(e);
            }
            return { x: e.clientX, y: e.clientY };
        },
        $dragIn: function (source, target, e) {
            var ctx = this.getContext();
            if (ctx.from.mode !== this.mode)
                return false;
            ctx.offset = ctx.offset || webix.html.offset(target);
            if (ctx.moveMode === "move" && !ctx.more) {
                DragScroll.reset(ctx);
                DragScroll.start(ctx, e);
            }
            return true;
        },
        $dragPos: function (pos) {
            var ctx = this.getContext();
            var x = ctx.x, t = ctx.t, l = ctx.l, w = ctx.w, scroll = ctx.scroll, step = ctx.step, moveMode = ctx.moveMode;
            var nscroll = this.view.getScrollState();
            ctx.dx = pos.x - x - (scroll ? scroll.x : 0) + nscroll.x;
            var node = webix.DragControl.getNode();
            if (moveMode === "move") {
                var offset = ctx.more ? { x: 0, y: 0 } : ctx.offset;
                pos.x += ctx.x_offset - offset.x + nscroll.x;
                pos.y += ctx.y_offset - offset.y + nscroll.y;
            }
            else if (moveMode === "start") {
                pos.x = Math.min(l + ctx.dx, l + w - step);
                pos.y = t;
                node.childNodes[0].style.width = node.style.width = Math.max(step, w - ctx.dx) + "px";
            }
            else if (moveMode === "end") {
                pos.x = l;
                pos.y = t;
                node.childNodes[0].style.width = node.style.width = Math.max(w + ctx.dx, step) + "px";
            }
        },
        $drop: function (source, target, e) {
            var ctx = this.getContext();
            webix.extend(ctx, { to: this });
            var app = this.master.app;
            var cancelDrop = ctx.from.mode !== this.mode ||
                !app.callEvent("app:beforedrop", [ctx, e]);
            if (cancelDrop) {
                return false;
            }
            var data = this.getData(e);
            if (data) {
                if (ctx.event.id == "0") {
                    this.addEvent(ctx.event, data);
                }
                else if (ctx.$copy && ctx.moveMode === "move") {
                    this.copyEvent(ctx.event, data);
                }
                else
                    this.updateEvent(ctx.event, data);
            }
        },
        getData: function (e) {
            var ctx = this.getContext();
            var res = {};
            var section = this.view.getIdByIndex(this.locate(e));
            var moveMode = ctx.moveMode, dx = ctx.dx, step = ctx.step;
            var time = Math.round(dx / (step || this.getStep()));
            if (section != ctx.start || (ctx.$copy && ctx.event.id !== "0") || time) {
                if (moveMode === "move")
                    res.section = section;
                var scales = this.view.$scope.Scales;
                webix.extend(res, updateEventDates(ctx.event, scales, moveMode, time));
                return res;
            }
            return null;
        },
        getStep: function () {
            var scales = this.view.$scope.Scales;
            var step = scales.cellWidth;
            if (scales.precise) {
                var nsc = wgantt_7[scales.minUnit][1];
                step = Math.round(step / (typeof nsc === "number" ? nsc : nsc()));
            }
            return step;
        },
    }, common);
    var timelineMore = webix.extend({
        mode: "timeline",
        dragScroll: null,
        $dragCreate: function (target, e, pointer) {
            var ctx = this.getContext();
            ctx.$touch = pointer === "touch";
            if (this.State.readonly)
                return false;
            var id = this.view.locate(e);
            if (id) {
                var node = this.view.getItemNode(id).children[0];
                webix.extend(ctx, { from: this, id: id, moveMode: "move", more: true }, true);
                ctx.event = this.master.Events.getItem(id);
                ctx.x = ctx.event.$x + parseInt(target.offsetParent.style.left);
                ctx.start = this.master.ID;
                this.setDragOffset(node, target, e);
                if (!this.master.app.callEvent("app:beforedrag", [ctx, e])) {
                    return false;
                }
                var drag_container = document.createElement("DIV");
                drag_container.style.width = ctx.width + "px";
                drag_container.style.height = ctx.height + "px";
                drag_container.appendChild(node.cloneNode(true));
                drag_container.className =
                    target.className + " webix_drag_zone webix_drag_event";
                document.body.appendChild(drag_container);
                this.master.HideWindow();
                return drag_container;
            }
            return false;
        },
        $dragDestroy: function (target, node) {
            webix.html.remove(node);
            return false;
        },
    }, timeline);
    function updateEventDates(event, scales, mode, time) {
        var obj = {};
        var unit = scales.precise
            ? wgantt_7[scales.minUnit][0]
            : scales.minUnit;
        if (mode === "start" || mode === "move") {
            var offsetDate = scales.precise
                ? event.start_date
                : wgantt_3(unit, event.start_date);
            obj.start_date = wgantt_1(unit)(offsetDate, time);
            if (mode === "start" &&
                wrongDates(obj.start_date, event.end_date, obj.all_day))
                obj.start_date = wgantt_1(unit)(event.end_date, -1);
            if (webix.Date.equal(obj.start_date, event.start_date)) {
                delete obj.start_date;
            }
        }
        if (mode === "end" || mode === "move") {
            var us = wgantt_3(unit, event.end_date);
            var offsetDate = scales.precise || webix.Date.equal(us, event.end_date)
                ? event.end_date
                : wgantt_1(unit)(us, 1);
            obj.end_date = wgantt_1(unit)(offsetDate, time);
            if (wrongDates(obj.start_date || event.start_date, obj.end_date, obj.all_day))
                obj.end_date = wgantt_1(unit)(event.start_date, 1);
            if (webix.Date.equal(obj.end_date, event.end_date)) {
                delete obj.end_date;
            }
        }
        return obj;
    }
    function wrongDates(start, end, allDay) {
        return allDay ? end < start : end <= start;
    }
    function getMoveMode(node, x) {
        var rect = node.getBoundingClientRect();
        var p = (x - rect.left) / rect.width;
        var minWidth = webix.env.touch ? 400 : 200;
        var delta = 0.2 / (rect.width > minWidth ? rect.width / minWidth : 1);
        if (p < delta &&
            node.className.indexOf("webix_scheduler_event_break_left") == -1)
            return "start";
        if (p > 1 - delta &&
            node.className.indexOf("webix_scheduler_event_break_right") == -1)
            return "end";
        return "move";
    }
    function updateDragScrollConfig(ds, scales) {
        ds.senseX = Math.round(scales.cellWidth * (webix.env.touch ? 1 : 0.5));
        ds.senseY = Math.round(scales.cellHeight * (webix.env.touch ? 3 : 1));
        return ds;
    }
    function switchCursor(e, view) {
        if (webix.DragControl.active)
            return;
        var _a = locateEvent$1(e, view), id = _a.id, node = _a.node;
        if (id) {
            var mode = getMoveMode(node, e.clientX);
            node.style.cursor = mode == "move" ? "pointer" : "ew-resize";
        }
    }
>>>>>>> 6388b01 (New widget Scheduler)
    var modes = {
        day: day,
        month: month,
        more: more,
        multiday: multiday,
<<<<<<< HEAD
=======
        units: units,
        multidayUnits: multidayUnits,
        timeline: timeline,
        timelineMore: timelineMore,
>>>>>>> 6388b01 (New widget Scheduler)
    };

    var DayEventsView = (function (_super) {
        __extends(DayEventsView, _super);
<<<<<<< HEAD
        function DayEventsView(app, name, config) {
            var _this = _super.call(this, app, name) || this;
=======
        function DayEventsView(app, config) {
            var _this = _super.call(this, app) || this;
>>>>>>> 6388b01 (New widget Scheduler)
            if (config) {
                _this.WeekDayNum = config.day;
            }
            return _this;
        }
        DayEventsView.prototype.config = function () {
            var _this = this;
            return {
                view: "list",
                localId: "dayList",
                css: "webix_scheduler_day_events",
                scroll: false,
                autoheight: true,
                template: "",
                type: {
                    height: 42,
                    css: "webix_scheduler_day_scale_item",
                },
                onClick: {
                    webix_scheduler_day_event: function (e) { return _this.ShowEvent(e); },
                },
                onDblClick: {
                    webix_scheduler_day_scale_item: function (_e, h) { return _this.ShowNew(h); },
                },
            };
        };
        DayEventsView.prototype.init = function () {
            var _this = this;
            this.State = this.app.getState();
            this.List = this.$$("dayList");
            SelectionMixin(this, "scale");
            EditRecurringMixin(this);
            this.List.$setSize = function (x, y) {
                if (webix.ui.view.prototype.$setSize.call(this, x, y)) {
                    this.render();
                }
            };
            this.minEventHeight = 62;
            this.ParseHours();
            this.on(this.State.$changes, "readonly", function () { return _this.List.render(); });
            this.List.attachEvent("onAfterRender", function () { return _this.RenderEvents(); });
            initDnD.call(this, this.List, "day");
<<<<<<< HEAD
=======
            var compact = this.getParam("compact", true);
            if (this.app.config.copypaste && !webix.env.mobile && !compact)
                CopyPasteMixin(this, this.List);
>>>>>>> 6388b01 (New widget Scheduler)
        };
        DayEventsView.prototype.urlChange = function () {
            var _this = this;
            this.data = this.getParam("data");
            if (this.data) {
                this.Day = webix.Date.datePart(this.State.date, true);
                if (this.WeekDayNum > -1) {
                    var weekStart = this.data.start;
                    this.Day = webix.Date.add(weekStart, this.WeekDayNum, "day", true);
                }
                var to = webix.Date.add(this.Day, 1, "day", true);
                this.Events = this.FilterToday(this.Day, to);
                if (this._marker_update_interval)
                    this._marker_update_interval = clearInterval(this._marker_update_interval);
                if (isToday(this.Day))
                    this._marker_update_interval = setInterval(function () {
                        if (isToday(_this.Day))
                            _this.UpdateMarkerPosition();
                        else {
                            webix.html.remove(_this._Marker);
                            _this._Marker = _this._marker_update_interval = clearInterval(_this._marker_update_interval);
                        }
                    }, 5 * 60 * 1000);
                this.List.render();
            }
        };
        DayEventsView.prototype.GetEvent = function (id) {
            for (var i = 0; i < this.Events.length; i++)
                if (this.Events[i].id == id)
                    return this.Events[i];
            return null;
        };
        DayEventsView.prototype.FilterToday = function (value, to) {
            if (this.WeekDayNum > -1) {
                return this.data.single.filter(function (ev) {
<<<<<<< HEAD
                    if (ev.start_date < to && ev.end_date > value)
                        return true;
=======
                    return ev.start_date < to && ev.end_date > value;
>>>>>>> 6388b01 (New widget Scheduler)
                });
            }
            return this.data.single;
        };
        DayEventsView.prototype.MarkToday = function () {
            if (this.Day && isToday(this.Day)) {
                var marker = webix.html.create("div", {
                    class: "webix_scheduler_today_marker",
                });
                this._Marker = this.List.$view.firstChild.appendChild(marker);
                this.UpdateMarkerPosition();
            }
            else {
                this._Marker = null;
            }
        };
        DayEventsView.prototype.UpdateMarkerPosition = function () {
            if (this._Marker) {
                var current = new Date();
                var time = current.getHours() * 60 + current.getMinutes();
                this._Marker.style.top =
                    Math.round((time * this.List.type.height) / 60) + "px";
            }
        };
        DayEventsView.prototype.RenderEvents = function () {
            var _this = this;
            var evs = this.Events;
            if (evs && evs.length) {
                this.PrepareEvents();
                var container = webix.html.create("div", {
                    role: "presentation",
                });
                container.innerHTML = evs.map(function (i) { return _this.ToHTML(i); }).join("");
                this._DataObj = this.List.$view.firstChild.appendChild(container);
<<<<<<< HEAD
=======
                this.app.callEvent("events:rendered", []);
>>>>>>> 6388b01 (New widget Scheduler)
            }
            this.MarkToday();
        };
        DayEventsView.prototype.PrepareEvents = function () {
            var evs = this.Events;
            var stack = [];
            for (var i = 0; i < evs.length; i++) {
                var ev = evs[i];
                ev.$inner = false;
                var orderSet = this.PruneStack(ev, stack);
                if (stack.length) {
                    stack[stack.length - 1].$inner = true;
                }
                if (!orderSet) {
                    if (stack.length) {
                        ev.$sorder = stack[stack.length - 1].$sorder + 1;
                        ev.$inner = false;
                    }
                    else {
                        ev.$sorder = 0;
                    }
                }
                stack.splice(ev.$sorder, 0, ev);
                if (stack.length > (stack.max_count || 0)) {
                    stack.max_count = stack.length;
                }
            }
            this.SetPosition(stack, evs);
        };
        DayEventsView.prototype.PruneStack = function (newEvent, stack) {
            while (stack.length &&
                this.GetEventEndDate(stack[stack.length - 1]) <= newEvent.start_date) {
                stack.splice(stack.length - 1, 1);
            }
            for (var j = 0; j < stack.length; j++) {
                if (this.GetEventEndDate(stack[j]) <= newEvent.start_date) {
                    newEvent.$sorder = stack[j].$sorder;
                    stack.splice(j, 1);
                    newEvent.$inner = true;
                    return true;
                }
            }
            return false;
        };
        DayEventsView.prototype.SetPosition = function (stack, evs) {
            var delta = this.List.getFirstId() * this.List.type.height;
            for (var i = 0; i < evs.length; i++) {
                var ev = evs[i];
                ev.$count = stack.max_count;
                var temp_width = Math.floor(this.List.$width / ev.$count);
                ev.$left = ev.$sorder * temp_width;
                if (!ev.$inner)
                    temp_width = temp_width * (ev.$count - ev.$sorder);
                ev.$width = temp_width - 8;
                var evCorrectedCopy = shrinkTo(this.Day, webix.Date.add(this.Day, 1, "day", true))(ev);
                var sm = evCorrectedCopy.start_date.getHours() * 60 +
                    evCorrectedCopy.start_date.getMinutes();
                var em = evCorrectedCopy.end_date.getHours() * 60 +
                    evCorrectedCopy.end_date.getMinutes() || 24 * 60;
                ev.$top = Math.round((sm * this.List.type.height) / 60) - delta;
                ev.$height = Math.max(this.minEventHeight, ((em - sm) * this.List.type.height) / 60);
            }
        };
        DayEventsView.prototype.ToHTML = function (obj) {
            var content = this.EventTemplate(obj);
            return this.EventTemplateStart(obj) + content + "</div>";
        };
        DayEventsView.prototype.GetEventEndDate = function (ev) {
            var end_date = ev.end_date;
            var duration = (((ev.end_date - ev.start_date) / 60000) * this.List.type.height) / 60;
            if (duration < this.minEventHeight) {
                end_date = webix.Date.add(ev.start_date, Math.ceil((this.minEventHeight / this.List.type.height) * 60), "minute", true);
            }
            return end_date;
        };
        DayEventsView.prototype.EventTemplateStart = function (obj) {
            var css = "class=\"webix_scheduler_day_event " + (this.State.selected &&
                (obj.id == this.State.selected.id || obj.id == this.State.selected.date)
                ? "webix_scheduler_event_selected"
<<<<<<< HEAD
                : "") + "\"";
=======
                : "") + " " + (obj.$past ? "webix_scheduler_past_event" : "") + "\"";
>>>>>>> 6388b01 (New widget Scheduler)
            return "<div webix_e_id='" + obj.id + "' " + css + " style='left:" + obj.$left + "px; top:" + obj.$top + "px; width:" + obj.$width + "px; height:" + obj.$height + "px; " + dayEventColor(obj) + "'>";
        };
        DayEventsView.prototype.EventTemplate = function (obj) {
            var _ = this.app.getService("locale")._;
            var resizer = this.State.readonly
                ? ""
                : "<div class='webix_icon webix_scheduler_resizer' webix_resizer='true'></div>";
            return "<div class=\"webix_scheduler_inner_day\"><span class=\"webix_scheduler_event_name\">" + (obj.text ||
                _("(No title)")) + "</span><div class=\"webix_scheduler_event_time\">" + webix.i18n.timeFormatStr(obj.start_date) + " - " + webix.i18n.timeFormatStr(obj.end_date) + "</div></div>" + resizer;
        };
        DayEventsView.prototype.ShowEvent = function (e) {
<<<<<<< HEAD
            var event = locateEvent(e, this.List.$view);
=======
            var event = locateEvent$1(e, this.List.$view);
>>>>>>> 6388b01 (New widget Scheduler)
            if (event.id && event.id != "0") {
                var obj = this.GetEvent(event.id);
                var sel = webix.extend(event, getParams(obj), true);
                this.State.selected = sel;
            }
            return false;
        };
<<<<<<< HEAD
        DayEventsView.prototype.ShowNew = function (h) {
            var date = webix.Date.copy(this.Day || this.State.date);
            date.setHours(h);
            this.State.selected = { id: "0", date: date };
=======
        DayEventsView.prototype.GetTargetDate = function (h) {
            var date = webix.Date.copy(this.Day || this.State.date);
            if (h)
                date.setHours(h);
            return date;
        };
        DayEventsView.prototype.ShowNew = function (h) {
            var state = this.State;
            if (!state.readonly && !state.clipboard) {
                state.selected = { id: "0", date: this.GetTargetDate(h) };
            }
        };
        DayEventsView.prototype.UpdateSelection = function (id, newEvent) {
            if (this.State.selected) {
                newEvent.id = id;
                this.State.selected = getParams(newEvent);
            }
>>>>>>> 6388b01 (New widget Scheduler)
        };
        return DayEventsView;
    }(HourscaleView));

    var MultidayEventList = (function (_super) {
        __extends(MultidayEventList, _super);
        function MultidayEventList() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MultidayEventList.prototype.config = function () {
            var _this = this;
            var ui = _super.prototype.config.call(this);
            ui.cols[1] = {
                view: "list",
                localId: "multiDayList",
                autoheight: true,
                scroll: false,
                css: "webix_scheduler_multilist",
                type: {
<<<<<<< HEAD
                    height: 32,
=======
                    height: 36,
>>>>>>> 6388b01 (New widget Scheduler)
                    template: function (obj, common) { return _this.EventTemplate(obj, common); },
                },
                onClick: {
                    webix_scheduler_multiday_event: function (e, id, node) {
                        return _this.ShowEvent(id, node);
                    },
                },
            };
            return ui;
        };
        MultidayEventList.prototype.init = function () {
<<<<<<< HEAD
=======
            var _this = this;
>>>>>>> 6388b01 (New widget Scheduler)
            this.State = this.app.getState();
            _super.prototype.init.call(this);
            this._DataObj = this.List.$view.firstChild;
            SelectionMixin(this, "multi", true);
            this.MoreIcon = this.$$("more");
            this._moreBtn = {
                id: "$wsh_multi_more",
                $css: "webix_scheduler_multi_more",
            };
<<<<<<< HEAD
=======
            this.on(this.$$("multiDayList"), "onAfterRender", function () {
                _this.app.callEvent("events:rendered", []);
            });
            if (this.app.config.copypaste && !webix.env.mobile) {
                EditRecurringMixin(this);
                CopyPasteMixin(this, this.List, { multi: true });
            }
>>>>>>> 6388b01 (New widget Scheduler)
        };
        MultidayEventList.prototype.urlChange = function () {
            var data = this.getParam("data");
            if (data) {
                this.LimitData(data.multi);
                this.List.clearAll();
                this.List.parse(data.multi);
            }
        };
        MultidayEventList.prototype.EventTemplate = function (obj, common) {
<<<<<<< HEAD
            var height = common.height - 4;
=======
            var height = common.height - 8;
>>>>>>> 6388b01 (New widget Scheduler)
            var size = "height:" + height + "px; line-height:" + height + "px; width:calc(100% - 5px);";
            var color = obj.id !== "$wsh_multi_more" ? dayEventColor(obj) : "";
            var css = this.GetStyle(obj);
            var _ = this.app.getService("locale")._;
            return "\n\t\t\t<div\n\t\t\t\tclass=\"" + css + "\"\n\t\t\t\tstyle=\"" + size + " " + color + "\">\n\t\t\t\t\t" + (obj.text || _("(No title)")) + "\n\t\t\t</div>\n\t\t";
        };
        MultidayEventList.prototype.GetStyle = function (obj) {
<<<<<<< HEAD
=======
            var css = "webix_scheduler_multiday_event";
            if (obj.id == "$wsh_multi_more")
                return css;
>>>>>>> 6388b01 (New widget Scheduler)
            var date = this.State.date;
            var end = !obj.all_day && !webix.Date.timePart(obj.end_date)
                ? webix.Date.add(obj.end_date, -1, "day", true)
                : obj.end_date;
<<<<<<< HEAD
            var css = "webix_scheduler_multiday_event";
=======
>>>>>>> 6388b01 (New widget Scheduler)
            css +=
                this.State.selected &&
                    (obj.id == this.State.selected.id || obj.id == this.State.selected.date)
                    ? " webix_scheduler_event_selected"
                    : "";
<<<<<<< HEAD
=======
            css += obj.$past ? " webix_scheduler_past_event" : "";
>>>>>>> 6388b01 (New widget Scheduler)
            if (obj.start_date < date)
                css += " webix_scheduler_event_break_left";
            if (end >= webix.Date.add(date, 1, "day", true))
                css += " webix_scheduler_event_break_right";
            return css;
        };
        MultidayEventList.prototype.LimitData = function (data) {
            if (data.length > this.maxVisibleLines) {
                var excess = data.length - 2;
                var _ = this.app.getService("locale")._;
                this._moreBtn.text = excess + " " + _("more");
                if (this._expandState === "down") {
                    this._reserve = data.splice(2, excess, this._moreBtn);
                }
                else {
                    this._reserve = data.slice(2);
                }
                this.SetMoreIcon(this._expandState);
                this._reserveIds = this._reserve.map(function (d) { return d.id; });
            }
            else {
                this.SetMoreIcon();
            }
        };
        MultidayEventList.prototype.WrapData = function () {
            var _this = this;
            if (!this._inAnimation) {
                this._inAnimation = true;
                this._expandState = "down";
                var height = this.List.$height -
                    (this._reserveIds.length - 1) * this.List.type.height;
                this.Animate("down", height, function () {
                    _this.List.add(_this._moreBtn);
                    _this.List.remove(_this._reserveIds);
                });
            }
        };
        MultidayEventList.prototype.ExpandData = function () {
            if (!this._inAnimation) {
                this._inAnimation = true;
                this._expandState = "up";
                this.Animate("up");
                this.List.remove("$wsh_multi_more");
                this.List.parse(this._reserve);
            }
        };
        MultidayEventList.prototype.Animate = function (mode, height, handler) {
            var _this = this;
            this.List.$view.style.transition = "height 150ms";
            if (height)
                this.List.$view.style.height = height + "px";
            setTimeout(function () {
                if (handler)
                    handler();
                _this.List.$view.style.transition = "";
                _this._inAnimation = false;
                _this.SetMoreIcon(mode);
            }, 150);
        };
        MultidayEventList.prototype.SetMoreIcon = function (mode) {
            if (!mode) {
                this.MoreIcon.setHTML("");
            }
            else {
                this._expandState = mode;
                var tooltip = mode === "up" ? "Collapse" : "Expand";
                var _ = this.app.getService("locale")._;
                this.MoreIcon.setHTML("<div class=\"webix_scheduler_more_icon webix_icon wxi-angle-" + mode + "\" webix_tooltip=\"" + _(tooltip + " all-day events") + "\"><div>");
            }
        };
        MultidayEventList.prototype.ShowEvent = function (id, node) {
            if (id === "$wsh_multi_more") {
                this.ExpandData();
            }
            else {
                var obj = this.List.getItem(id);
                var sel = getParams(obj);
                sel.node = node;
                this.State.selected = sel;
            }
            return false;
        };
<<<<<<< HEAD
=======
        MultidayEventList.prototype.GetEvent = function (id) {
            return this.List.getItem(id);
        };
        MultidayEventList.prototype.GetTargetDate = function () {
            return this.State.date;
        };
>>>>>>> 6388b01 (New widget Scheduler)
        return MultidayEventList;
    }(MultiMoreView));

    var DayView = (function (_super) {
        __extends(DayView, _super);
        function DayView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DayView.prototype.config = function () {
            var header = {
                view: "template",
                localId: "header",
                css: "webix_scheduler_day_header",
                height: 32,
                template: function (obj) {
                    return obj.date ? webix.Date.dateToStr("%l")(obj.date) : "";
                },
            };
            var config = {
                css: "webix_scheduler_day",
                rows: [
                    header,
                    {
                        localId: "multi",
                        hidden: true,
                        cols: [MultidayEventList],
                    },
                    {
                        localId: "scroll",
                        view: "scrollview",
                        css: "webix_scheduler_day_scroll",
                        body: {
                            cols: [HourscaleView, DayEventsView],
                        },
                    },
                ],
            };
            return config;
        };
        DayView.prototype.init = function () {
            var _this = this;
            var state = this.app.getState();
            this.on(state.$changes, "date", function (value) { return _this.RefreshData(value); });
            this.on(state.$changes, "active", function () { return _this.RefreshData(state.date); });
            this.on(this.app, "events:refresh", function () { return _this.RefreshData(state.date); });
            var events = this.app.getService("local").events(true);
            this.on(events.data, "onStoreUpdated", function (_i, _o, mode) { return mode && _this.RefreshData(state.date); });
<<<<<<< HEAD
            this.on(state.$changes, "selected", function (v) { return v && _this.ScrollScale(v); });
=======
            this.on(state.$changes, "selected", function (v) {
                if (v && !state.clipboard)
                    _this.ScrollScale(v);
            });
>>>>>>> 6388b01 (New widget Scheduler)
        };
        DayView.prototype.RefreshData = function (value) {
            var _this = this;
            this.$$("header").setValues({ date: value });
            this.GetDay(value).then(function (data) {
                if (_this.app)
                    _this.setParam("data", data, true);
                if (data.multi.length) {
                    _this.$$("multi").show();
                }
                else
                    _this.$$("multi").hide();
            });
        };
        DayView.prototype.GetDay = function (date) {
            var end = webix.Date.add(date, 1, "day", true);
            return this.app
                .getService("local")
                .getEvents(date, end)
                .then(function (evs) {
                var multi = [], single = [];
                evs.forEach(function (ev) {
                    if (isMultiDay(ev)) {
                        multi.push(ev);
                    }
                    else {
                        single.push(ev);
                    }
                });
                return { multi: multi, single: single };
            });
        };
        DayView.prototype.ScrollScale = function (v) {
            var _this = this;
            if (v.id === "0" && !v.date) {
                setTimeout(function () {
                    var y = (new Date().getHours() + 2) * 40;
                    _this.$$("scroll").scrollTo(0, y);
                }, 100);
            }
        };
        return DayView;
    }(JetView));

    var CalendarView = (function (_super) {
        __extends(CalendarView, _super);
        function CalendarView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        CalendarView.prototype.config = function () {
            var _this = this;
            this.Events = {};
            return {
                view: "calendar",
                localId: "calendar",
                events: function (day, isOutside) { return _this.MarkEvent(day, isOutside); },
                icons: false,
                navigation: false,
                monthHeader: false,
                skipEmptyWeeks: true,
                width: 0,
                height: 410,
            };
        };
        CalendarView.prototype.init = function () {
            var _this = this;
            this.Calendar = this.getRoot();
<<<<<<< HEAD
            this.Calendar.attachEvent("onDateSelect", function (date) {
=======
            this.Calendar.attachEvent("onAfterDateSelect", function (date) {
>>>>>>> 6388b01 (New widget Scheduler)
                _this.app.getState().date = webix.Date.dayStart(date);
            });
        };
        CalendarView.prototype.urlChange = function () {
            this.data = this.getParam("data");
            if (this.data)
                this.RefreshData();
        };
        CalendarView.prototype.RefreshData = function () {
            var _a = this.data, start = _a.start, weeks = _a.weeks, data = _a.data;
            var end = webix.Date.add(start, weeks, "week", true);
            this.Events = {};
            while (start < end) {
                var next = webix.Date.add(start, 1, "day", true);
                for (var i = 0; i < data.length; i++)
                    if ((data[i].all_day
                        ? data[i].end_date >= start
                        : data[i].end_date > start) &&
                        data[i].start_date < next)
                        this.Events[start.valueOf()] = true;
                start = next;
            }
            this.Calendar.setValue(this.app.getState().date);
        };
        CalendarView.prototype.MarkEvent = function (day, isOutside) {
            var css = "";
            if (!isOutside)
                css += webix.Date.isHoliday(day) || "";
            if (this.Events[day.valueOf()])
                css += " webix_cal_day_with_event";
            return css;
        };
        return CalendarView;
    }(JetView));

    var MoreWindowView = (function (_super) {
        __extends(MoreWindowView, _super);
<<<<<<< HEAD
        function MoreWindowView(app, name, c) {
            var _this = _super.call(this, app, name) || this;
            _this.Events = c.events;
=======
        function MoreWindowView(app, c) {
            var _this = _super.call(this, app) || this;
            _this.Events = c.events;
            _this.drag = webix.isUndefined(c.drag) ? true : c.drag;
>>>>>>> 6388b01 (New widget Scheduler)
            return _this;
        }
        MoreWindowView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            return {
                view: "popup",
                width: 266,
                padding: 8,
                minHeight: 70,
                relative: "right",
                body: {
                    view: "list",
                    css: "webix_scheduler_more_list",
                    borderless: true,
                    autoheight: true,
                    yCount: 3,
                    tooltip: {
                        template: "",
                    },
                    onClick: {
                        webix_scheduler_month_event: function (e, id) { return _this.ShowEvent(id); },
                        webix_scheduler_month_event_single: function (e, id) { return _this.ShowEvent(id); },
                    },
                    type: {
                        height: 56,
                        template: function (o, c) { return _this.MoreTemplate(o, c, _); },
                    },
                },
            };
        };
        MoreWindowView.prototype.init = function (view) {
            this.Win = view;
            EditRecurringMixin(this);
<<<<<<< HEAD
            initDnD.call(this, view.getBody(), "more", true);
        };
        MoreWindowView.prototype.MoreTemplate = function (obj, _c, _) {
            var i18n = webix.i18n;
            var single = !daysBetweenInclusive(obj.start_date, obj.end_date);
            var style = single ? "" : dayEventColor(obj);
            return "\n\t\t\t<div\n\t\t\t\tclass=\"webix_scheduler_month_event" + (single ? "_single" : "") + "\"\n\t\t\t\tstyle=\"" + style + "\"\n\t\t\t>\n\t\t\t\t" + (single ? marker(obj) : "") + "\n\t\t\t\t<div webix_tooltip=\"" + obj.text + "\" class=\"webix_event_text\">" + (obj.text ||
                _("(No title)")) + "</div>\n\t\t\t\t<div class=\"webix_event_time\">\n\t\t\t\t\t" + this.DayFormatStr(obj.start_date) + "\n\t\t\t\t\t" + i18n.timeFormatStr(obj.start_date) + " -\n\t\t\t\t\t" + (single ? "" : " " + this.DayFormatStr(obj.end_date)) + "\n\t\t\t\t\t" + i18n.timeFormatStr(obj.end_date) + "\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t";
=======
            if (this.drag)
                initDnD.call(this, view.getBody(), "more", true);
        };
        MoreWindowView.prototype.MoreTemplate = function (obj, _c, _) {
            var i18n = webix.i18n;
            var single = !daysBetweenInclusive(obj.start_date, obj.all_day ? webix.Date.add(obj.end_date, 1, "day", true) : obj.end_date);
            var style = single ? "" : dayEventColor(obj);
            var oneDay = !single && this.webix.Date.equal(obj.start_date, obj.end_date);
            var css = "webix_scheduler_month_event" + (single ? "_single" : "");
            if (obj.$past)
                css += " webix_scheduler_past_event";
            return "\n\t\t\t<div\n\t\t\t\tclass=\"" + css + "\"\n\t\t\t\tstyle=\"" + style + "\"\n\t\t\t>\n\t\t\t\t" + (single ? marker(obj) : "") + "\n\t\t\t\t<div webix_tooltip=\"" + obj.text + "\" class=\"webix_event_text\">" + (obj.text ||
                _("(No title)")) + "</div>\n\t\t\t\t<div class=\"webix_event_time\">\n\t\t\t\t\t" + this.DayFormatStr(obj.start_date) + "\n\t\t\t\t\t" + (oneDay
                ? ""
                : i18n.timeFormatStr(obj.start_date) + " -\n\t\t\t\t\t\t" + (single ? "" : " " + this.DayFormatStr(obj.end_date)) + "\n\t\t\t\t\t\t" + i18n.timeFormatStr(obj.end_date)) + "\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t";
>>>>>>> 6388b01 (New widget Scheduler)
        };
        MoreWindowView.prototype.DayFormatStr = function (date) {
            return webix.Date.dateToStr("%F %j")(date);
        };
        MoreWindowView.prototype.ShowEvent = function (id) {
            var obj = this.Events.getItem(id);
            this.app.getState().selected = getParams(obj);
<<<<<<< HEAD
=======
            this.HideWindow();
>>>>>>> 6388b01 (New widget Scheduler)
        };
        MoreWindowView.prototype.ShowWindow = function (id, node, data) {
            var _this = this;
            if (this.ID === id && this.Win.isVisible())
                return this.Win.hide();
            this.ID = id;
            data = data.map(function (v) { return _this.Events.getItem(v); });
            var list = this.Win.getBody();
            list.clearAll();
            list.parse(data);
            this.Win.show(node);
        };
        MoreWindowView.prototype.HideWindow = function () {
            this.Win.hide();
        };
        return MoreWindowView;
    }(JetView));

    var MonthEventsView = (function (_super) {
        __extends(MonthEventsView, _super);
        function MonthEventsView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MonthEventsView.prototype.config = function () {
            var _this = this;
            return {
                view: "dataview",
                css: "webix_scheduler_calendar",
                prerender: true,
                xCount: 7,
                yCount: 5,
                width: 0,
                height: 0,
                scroll: false,
                tooltip: {
                    template: "",
                },
                onClick: {
                    webix_cal_date: function (_ev, id) { return _this.ShowDay(id); },
                    webix_scheduler_month_event: function (ev) { return _this.ShowEvent(ev); },
                    webix_scheduler_month_event_single: function (ev) { return _this.ShowEvent(ev); },
                    webix_scheduler_more: function (_ev, id) { return _this.ShowMore(id); },
                },
                onDblClick: {
                    webix_cal_day: function (_e, id) { return _this.ShowNew(id); },
                },
                type: {
                    height: "auto",
                    width: "auto",
                    template: function (o, c) { return _this.CalendarTemplate(o, c); },
                    templateStart: templateStart,
                    headerHeight: 32,
                    eventHeight: 28,
                    padding: 8,
                },
            };
        };
        MonthEventsView.prototype.init = function (view) {
            var _this = this;
            this.State = this.app.getState();
            this.Calendar = view;
            view.type.master = this.Calendar;
            SelectionMixin(this, "month");
            EditRecurringMixin(this);
            this.Events = new webix.DataCollection({});
<<<<<<< HEAD
            this.MoreWindow = this.ui(new (this.app.dynamic(MoreWindowView))(this.app, "", {
=======
            this.MoreWindow = this.ui(new (this.app.dynamic(MoreWindowView))(this.app, {
>>>>>>> 6388b01 (New widget Scheduler)
                events: this.Events,
            }));
            view.attachEvent("onAfterRender", function () { return _this.RenderEvents(); });
            initDnD.call(this, this.Calendar, "month");
<<<<<<< HEAD
        };
        MonthEventsView.prototype.urlChange = function () {
            this.data = this.getParam("data");
=======
            if (this.app.config.copypaste && !webix.env.mobile)
                CopyPasteMixin(this, view);
        };
        MonthEventsView.prototype.urlChange = function () {
            this.data = this.getParam("data", true);
>>>>>>> 6388b01 (New widget Scheduler)
            if (this.data)
                this.RefreshData();
        };
        MonthEventsView.prototype.CalendarTemplate = function (obj) {
            var _ = this.app.getService("locale")._;
            var html = "<span class=\"webix_cal_date\">" + obj.date.getDate() + "</span>";
            if (obj.$more && obj.$more.length) {
                html += "<div class=\"webix_scheduler_more\">" + obj.$more.length + " " + _("more") + "</div>";
            }
            return html;
        };
        MonthEventsView.prototype.GetDayCss = function (day, month) {
            var css = "webix_cal_day";
            if (isToday(day))
                css += " webix_cal_today";
            if (day.getMonth() != month)
                css += " webix_cal_outside";
            else
                css += " " + (webix.Date.isHoliday(day) || "");
            return css;
        };
        MonthEventsView.prototype.GetMonthData = function () {
            var data = [];
            var _a = this.data, start = _a.start, weeks = _a.weeks;
            var month = webix.Date.add(start, 1, "week", true).getMonth();
            var day = webix.Date.copy(start);
            for (var i = 0; i < weeks * 7; i++) {
                var obj = {
                    date: webix.Date.copy(day),
                    $css: this.GetDayCss(day, month),
                };
                if ((i + 1) % 7 === 0)
                    obj.right = true;
                if (i >= (weeks - 1) * 7)
                    obj.bottom = true;
                data.push(obj);
                webix.Date.add(day, 1, "day");
            }
            return data;
        };
        MonthEventsView.prototype.RenderEvents = function () {
            if (!this.Events.count() || !this.Calendar.count())
                return;
            var container = webix.html.create("div", {
                role: "presentation",
                class: "webix_scheduler_month_events",
            });
            var start = this.data.start;
            var type = this.Calendar.type;
            var maxLines = Math.floor((type.height - type.headerHeight + type.padding - 2) /
                (type.eventHeight + type.padding));
            var wStart = webix.Date.copy(start);
            var wEnd = webix.Date.add(wStart, 1, "week", true);
            var html = "";
            var cache = {};
<<<<<<< HEAD
            var me = this.Calendar.getItem(this.Calendar.getLastId()).date;
            var ms = this.Calendar.getItem(this.Calendar.getFirstId()).date;
=======
            var me = this.GetTargetDate(this.Calendar.getLastId());
            var ms = this.GetTargetDate(this.Calendar.getFirstId());
>>>>>>> 6388b01 (New widget Scheduler)
            this.Calendar.data.each(function (day, dayIndex) {
                if (day.date >= wEnd) {
                    cache = {};
                    wStart = wEnd;
                    wEnd = webix.Date.add(wStart, 1, "week", true);
                }
                var more = [];
                var dayHTML = [];
                this.Events.data.each(function (ev) {
                    var id = ev.id;
                    if (ev.start_date >= wEnd ||
                        ev.end_date < wStart ||
                        (!ev.all_day && webix.Date.equal(ev.end_date, wStart)))
                        return;
                    if (!webix.isUndefined(cache[id])) {
                        if ((day.date <= ev.end_date && ev.all_day) ||
                            day.date < ev.end_date) {
                            if (cache[id] >= maxLines) {
                                more.push(id);
                            }
                            else
                                dayHTML[cache[id]] = "";
                        }
                        else
                            delete cache[id];
                        return;
                    }
                    if (ev.start_date < webix.Date.add(day.date, 1, "day", true) &&
                        ev.end_date >= day.date) {
                        var index = 0;
                        while (!webix.isUndefined(dayHTML[index]))
                            index++;
                        cache[id] = index;
                        if (index >= maxLines)
                            return more.push(id);
                        var config = { ms: ms, me: me };
<<<<<<< HEAD
                        config.single = !daysBetweenInclusive(ev.start_date, ev.all_day
                            ? webix.Date.add(ev.end_date, 1, "day", true)
                            : ev.end_date);
=======
                        config.single = this.IsSingleDay(ev);
>>>>>>> 6388b01 (New widget Scheduler)
                        config.length = 1;
                        if (!config.single) {
                            config.es = ev.start_date;
                            config.ee =
                                !ev.all_day && !webix.Date.timePart(ev.end_date)
                                    ? webix.Date.add(ev.end_date, -1, "day", true)
                                    : ev.end_date;
                            config.length += daysBetweenInclusive((config.ls = new Date(Math.max(wStart, config.es))), (config.le = new Date(Math.min(wEnd - 1, config.ee))));
                        }
                        config.index = dayIndex;
                        dayHTML[index] = this.ToHTML(ev, index, config);
                    }
                }, this);
                var prevLength = day.$more && day.$more.length;
                day.$more = more;
                if (prevLength != more.length)
                    this.Calendar.render(day.id, day, "paint");
                html += dayHTML.join("");
            }, this);
            container.innerHTML = html;
            this._DataObj = this.Calendar.$view.firstChild.appendChild(container);
<<<<<<< HEAD
=======
            this.app.callEvent("events:rendered", []);
        };
        MonthEventsView.prototype.IsSingleDay = function (ev) {
            if (ev.all_day)
                return !daysBetweenInclusive(ev.start_date, webix.Date.add(ev.end_date, 1, "day", true));
            var len = daysBetweenInclusive(ev.start_date, ev.end_date);
            if (len === 1 &&
                webix.Date.timePart(ev.start_date) &&
                !webix.Date.timePart(ev.end_date))
                len = 0;
            return !len;
>>>>>>> 6388b01 (New widget Scheduler)
        };
        MonthEventsView.prototype.ToHTML = function (obj, index, c) {
            var type = this.Calendar.type;
            var style = c.single ? "" : dayEventColor(obj);
            var width = c.length * type.width - type.padding;
            var height = type.eventHeight;
            var pos = this.GetPosition(type, index, c.index);
            var extra = "";
            if (c.single) {
                extra =
                    marker(obj) +
                        ("<span class=\"webix_event_time\">" + webix.i18n.timeFormatStr(obj.start_date) + "</span>");
            }
            var css = this.GetStyle(obj, c);
            var _ = this.app.getService("locale")._;
            return "\n\t\t\t<div\n\t\t\t\twebix_tooltip=\"" + obj.text + "\"\n\t\t\t\twebix_e_id=\"" + obj.id + "\"\n\t\t\t\tclass=\"" + css + "\"\n\t\t\t\tstyle=\"height:" + height + "px;line-height:" + height + "px; width:" + width + "px; " + (pos +
                style) + "\">\n\t\t\t\t\t" + (extra + (obj.text || _("(No title)"))) + "\n\t\t\t</div>\n\t\t";
        };
        MonthEventsView.prototype.GetStyle = function (obj, c) {
            var css = "webix_scheduler_month_event" + (c.single ? "_single" : "");
            css +=
                this.State.selected &&
                    (obj.id == this.State.selected.id || obj.id == this.State.selected.date)
                    ? " webix_scheduler_event_selected"
                    : "";
<<<<<<< HEAD
=======
            css += obj.$past ? " webix_scheduler_past_event" : "";
>>>>>>> 6388b01 (New widget Scheduler)
            if (!c.single) {
                if (c.es < c.ms && webix.Date.equal(c.ms, webix.Date.dayStart(c.ls)))
                    css += " webix_scheduler_event_break_left";
                else if (c.ee >= webix.Date.add(c.me, 1, "day", true) &&
                    webix.Date.equal(c.me, webix.Date.dayStart(c.le)))
                    css += " webix_scheduler_event_break_right";
            }
            return css;
        };
        MonthEventsView.prototype.GetPosition = function (type, index, dayIndex) {
            var row = Math.floor(dayIndex / this.Calendar.config.xCount);
            var col = dayIndex % this.Calendar.config.xCount;
            return "\n\t\t\ttop:" + (row * type.height +
                type.headerHeight +
                index * (type.eventHeight + type.padding)) + "px;\n\t\t\tleft:" + col * type.width + "px;\n\t\t";
        };
        MonthEventsView.prototype.RefreshData = function () {
            var _a = this.data, data = _a.data, weeks = _a.weeks;
            this.Events.clearAll();
            this.Events.parse(data);
            this.Events.sort(function (a, b) {
                var start_a = webix.Date.dayStart(a.start_date);
                var start_b = webix.Date.dayStart(b.start_date);
                if (webix.Date.equal(start_a, start_b)) {
                    var days_a = daysBetweenInclusive(a.start_date, a.end_date);
                    var days_b = daysBetweenInclusive(b.start_date, b.end_date);
                    return days_b - days_a || a.start_date - b.start_date;
                }
                return start_a - start_b;
            });
            var monthData = this.GetMonthData();
            this.Calendar.clearAll();
            if (this.Calendar.config.yCount != weeks) {
                this.Calendar.define("yCount", weeks);
                this.Calendar.resize();
            }
            this.Calendar.parse(monthData);
        };
        MonthEventsView.prototype.ShowMore = function (id) {
            this.MoreWindow.ShowWindow(id, this.Calendar.getItemNode(id), this.Calendar.getItem(id).$more || []);
            return false;
        };
        MonthEventsView.prototype.ShowEvent = function (e) {
<<<<<<< HEAD
            var event = locateEvent(e, this.Calendar.$view);
=======
            var event = locateEvent$1(e, this.Calendar.$view);
>>>>>>> 6388b01 (New widget Scheduler)
            if (event.id && event.id != "0") {
                var obj = this.Events.getItem(event.id);
                var sel = webix.extend(event, getParams(obj), true);
                this.State.selected = sel;
            }
            return false;
        };
        MonthEventsView.prototype.ShowNew = function (id) {
<<<<<<< HEAD
            var date = this.Calendar.getItem(id).date;
            this.State.selected = { id: "0", date: date };
=======
            var state = this.State;
            if (!state.readonly && !state.clipboard) {
                var date = this.GetTargetDate(id);
                state.selected = { id: "0", date: date };
            }
>>>>>>> 6388b01 (New widget Scheduler)
        };
        MonthEventsView.prototype.ShowDay = function (id) {
            var state = this.app.getState();
            state.$batch({
<<<<<<< HEAD
                date: this.Calendar.getItem(id).date,
=======
                date: this.GetTargetDate(id),
>>>>>>> 6388b01 (New widget Scheduler)
                mode: "day",
            });
            return false;
        };
<<<<<<< HEAD
=======
        MonthEventsView.prototype.GetTargetDate = function (id) {
            return id ? this.Calendar.getItem(id).date : this.State.date;
        };
        MonthEventsView.prototype.GetEvent = function (id) {
            return this.Events.getItem(id);
        };
        MonthEventsView.prototype.UpdateSelection = function (id, newEvent) {
            if (this.State.selected) {
                newEvent.id = id;
                this.State.selected = getParams(newEvent);
            }
        };
>>>>>>> 6388b01 (New widget Scheduler)
        return MonthEventsView;
    }(JetView));

    var MonthHeaderView = (function (_super) {
        __extends(MonthHeaderView, _super);
        function MonthHeaderView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MonthHeaderView.prototype.config = function () {
            return {
                view: "dataview",
                css: "webix_scheduler_calendar_header",
                xCount: 7,
                yCount: 1,
                width: 0,
                height: 32,
                scroll: false,
                type: {
                    height: "auto",
                    width: "auto",
                    templateStart: templateStart,
                },
            };
        };
        MonthHeaderView.prototype.init = function (view) {
            view.type.master = view;
            view.parse(this.GetHeaderData());
        };
        MonthHeaderView.prototype.GetHeaderData = function () {
            var data = [];
            var k = webix.Date.startOnMonday ? 1 : 0;
            for (var i = 0; i < 7; i++)
                data.push({ value: webix.i18n.calendar.dayShort[(k + i) % 7] });
            data[data.length - 1]["right"] = true;
            return data;
        };
        return MonthHeaderView;
    }(JetView));

    var MonthListView = (function (_super) {
        __extends(MonthListView, _super);
        function MonthListView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MonthListView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            var config = {
                view: "list",
                type: {
                    height: 50,
                    template: events(_),
                    timeStart: function (ev) { return _this.TimeStart(ev); },
                },
                on: {
                    onItemClick: function (id) { return _this.ShowEvent(id); },
                },
            };
            return config;
        };
        MonthListView.prototype.init = function () {
            this.List = this.getRoot();
            this.State = this.app.getState();
            webix.extend(this.List, webix.OverlayBox);
        };
        MonthListView.prototype.urlChange = function () {
            this.data = this.getParam("data");
            if (this.data)
                this.RefreshData();
        };
        MonthListView.prototype.RefreshData = function () {
            var _this = this;
            var start = webix.Date.datePart(this.State.date, true);
            var end = webix.Date.add(start, 1, "day", true);
            this.app
                .getService("local")
                .getEvents(start, end)
                .then(function (evs) {
                _this.List.clearAll();
                _this.List.parse(evs.map(shrinkTo(start, end)));
                _this.ToggleOverlay();
            });
        };
        MonthListView.prototype.ToggleOverlay = function () {
            if (!this.List.count()) {
                var _ = this.app.getService("locale")._;
                this.List.showOverlay(_("No Events"));
            }
            else {
                this.List.hideOverlay();
            }
        };
        MonthListView.prototype.ShowEvent = function (id) {
            var obj = this.List.getItem(id);
            this.State.selected = getParams(obj);
        };
        MonthListView.prototype.TimeStart = function (ev) {
            var _ = this.app.getService("locale")._;
            if (isMultiDay(ev))
                return _("All Day");
            else
                return timeStart(ev.start_date, ev.end_date);
        };
        return MonthListView;
    }(JetView));

    var MonthView = (function (_super) {
        __extends(MonthView, _super);
        function MonthView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MonthView.prototype.config = function () {
            var compact = this.getParam("compact", true);
            var views = compact
                ? [CalendarView, MonthListView]
                : [MonthHeaderView, MonthEventsView];
            return {
                rows: views,
            };
        };
        MonthView.prototype.init = function () {
            var _this = this;
            this.Data = this.app.getService("local");
            var state = this.app.getState();
            this.on(state.$changes, "date", function (value) { return _this.RefreshData(value); });
            this.on(state.$changes, "active", function () { return _this.RefreshData(state.date); });
            this.on(this.app, "events:refresh", function () { return _this.RefreshData(state.date); });
            var events = this.app.getService("local").events(true);
            this.on(events.data, "onStoreUpdated", function (_i, _o, mode) { return mode && _this.RefreshData(state.date); });
        };
        MonthView.prototype.RefreshData = function (value) {
            var _this = this;
            var start = webix.Date.monthStart(value);
            var end = webix.Date.add(start, 1, "month", true);
            start = webix.Date.weekStart(new Date(start.getFullYear(), start.getMonth(), 1));
            var weeks = Math.ceil((end - start) / (24 * 60 * 60 * 1000) / 7);
<<<<<<< HEAD
            end = webix.Date.add(end, weeks, "week", true);
=======
            end = webix.Date.add(start, weeks, "week", true);
>>>>>>> 6388b01 (New widget Scheduler)
            this.Data.getEvents(start, end).then(function (data) {
                if (_this.app)
                    _this.setParam("data", { start: start, weeks: weeks, data: data }, true);
            });
        };
        return MonthView;
    }(JetView));

<<<<<<< HEAD
=======
    var BarView = (function (_super) {
        __extends(BarView, _super);
        function BarView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        BarView.prototype.config = function () {
            var active = webix.skin.$active;
            var _ = this.app.getService("locale")._;
            var state = this.getParam("state", true);
            return {
                view: "toolbar",
                height: active.barHeight,
                elements: [
                    {},
                    {
                        view: "richselect",
                        label: _("Timeline scale"),
                        labelWidth: 120,
                        width: 260,
                        value: state.timelineMode,
                        options: [
                            { id: "day", value: _("Day") },
                            { id: "week", value: _("Week") },
                            { id: "month", value: _("Month") },
                        ],
                        on: {
                            onChange: function (v) {
                                state.timelineMode = v;
                            },
                        },
                    },
                ],
            };
        };
        return BarView;
    }(JetView));

    var MoreView = (function (_super) {
        __extends(MoreView, _super);
        function MoreView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MoreView.prototype.config = function () {
            var ui = _super.prototype.config.call(this);
            ui.width = 360;
            ui.relative = "bottom";
            return ui;
        };
        MoreView.prototype.init = function (view) {
            this.Win = view;
            EditRecurringMixin(this);
            initDnD.call(this, view.getBody(), "timelineMore", true);
        };
        MoreView.prototype.ShowWindow = function (id, node, data) {
            var _this = this;
            if (this.ID === id && this.Win.isVisible())
                return this.Win.hide();
            this.ID = id;
            data = data.map(function (v) { return _this.Events.getItem(v); });
            var list = this.Win.getBody();
            list.clearAll();
            list.parse(data);
            this.Win.show(node, { x: node.clientWidth });
        };
        return MoreView;
    }(MoreWindowView));

    var ChartView = (function (_super) {
        __extends(ChartView, _super);
        function ChartView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ChartView.prototype.config = function () {
            var _this = this;
            var height = this.GetSectionHeight();
            var compact = this.getParam("compact", true);
            return {
                cols: [
                    {
                        view: "treetable",
                        localId: "sections",
                        css: "webix_scheduler_timeline_sections",
                        width: compact ? 80 : 200,
                        header: false,
                        scroll: "y",
                        rowHeight: height,
                        scrollAlignY: false,
                        columns: [
                            {
                                id: "text",
                                header: "",
                                fillspace: true,
                            },
                        ],
                    },
                    {
                        view: "list",
                        localId: "list",
                        type: { height: height, template: "" },
                        css: "webix_scheduler_timeline" + (webix.env.touch ? "_touch" : "") + "_bars",
                        onClick: {
                            webix_scheduler_timeline_event: function (e) { return _this.ShowEvent(e); },
                        },
                        onDblClick: {
                            webix_list_item: function (e, id) { return _this.ShowNew(e, id); },
                        },
                        tooltip: {
                            template: "",
                        },
                        scroll: "xy",
                    },
                ],
            };
        };
        ChartView.prototype.init = function () {
            var _this = this;
            this.Tree = this.$$("sections");
            this.Bars = this.$$("list");
            this.State = this.getParam("state", true);
            this.InnerState = this.getParam("innerState", true);
            this.Data = this.app.getService("local");
            this.Events = new webix.DataCollection({
                scheme: {
                    $change: function (obj) { return _this.RefreshTask(obj.id); },
                },
            });
            this.MoreWindow = this.ui(new (this.app.dynamic(MoreView))(this.app, {
                events: this.Events,
            }));
            SelectionMixin(this, "month");
            EditRecurringMixin(this);
            this._sectionsReady = this.Data.sections().then(function (data) {
                _this.Sections = data;
                _this.Tree.parse(data);
                _this.Bars.parse(data);
            });
            this.HandleScroll();
            var events = this.app.getService("local").events(true);
            this.on(events.data, "onStoreUpdated", function (_i, _o, mode) { return mode && _this.RefreshData(); });
            this.on(this.app, "events:refresh", function () { return _this.RefreshData(); });
            this.on(this.State.$changes, "active", function (_v, o) { return o && _this.RefreshData(); });
            initDnD.call(this, this.Bars, "timeline");
            this._mousemove_handler = webix.event(this.Bars.$view, "pointermove", function (e) {
                if (e.pointerType == "mouse")
                    switchCursor(e, _this.Bars.$view);
            });
            var compact = this.getParam("compact", true);
            if (this.app.config.copypaste && !webix.env.mobile && !compact)
                CopyPasteMixin(this, this.Bars);
        };
        ChartView.prototype.urlChange = function () {
            var scales = (this.Scales = this.getParam("scales", true));
            this.DrawGrid(scales);
            this.RefreshData(scales);
        };
        ChartView.prototype.GetSectionHeight = function () {
            var active = webix.skin.$active;
            this._sectionSize = 5;
            return (active.barHeight - active.borderWidth * 2) * this._sectionSize;
        };
        ChartView.prototype.RefreshData = function (scales) {
            var _this = this;
            if (!scales)
                scales = this.Scales;
            webix.promise
                .all([this._sectionsReady, this.Data.getEvents(scales.start, scales.end)])
                .then(function (res) {
                _this.ClearCollections();
                _this.Events.parse(res[1]);
                _this.RenderEvents();
            });
        };
        ChartView.prototype.ClearCollections = function () {
            this.Events.clearAll();
            this._processed = [];
            this._lastRow = {};
            this._moreEvents = {};
        };
        ChartView.prototype.RefreshTask = function (updID) {
            var _this = this;
            var t = this.GetEvent(updID);
            var sectionIndex = indexOf(this.Sections.data.order, t.section);
            if (sectionIndex == -1) {
                t.$hide = true;
                return;
            }
            var type = this.State.timelineMode;
            var unit = this.GetUnitCount(type);
            if (type !== "day" || type !== "week")
                unit = this.GetUnitCount(unit);
            var prev = this._processed.find(function (obj) {
                if (obj.section == t.section) {
                    if (type === "day")
                        return _this.CheckDates(obj.end_date, t.start_date, obj.all_day);
                    var prev_1 = webix.Date.timePart(obj.end_date)
                        ? _this.GetUnitStart(unit, webix.Date.add(obj.end_date, 1, unit, true))
                        : obj.end_date;
                    var next = _this.GetUnitStart(unit, t.start_date);
                    return _this.CheckDates(prev_1, next, obj.all_day);
                }
                return false;
            });
            var y;
            if (prev) {
                y = prev.$y;
                this._processed.splice(this._processed.findIndex(function (p) { return prev.id == p.id; }), 1);
            }
            else {
                if (webix.isUndefined(this._lastRow[t.section]))
                    this._lastRow[t.section] = 0;
                else
                    this._lastRow[t.section]++;
                if (this._lastRow[t.section] >= this._sectionSize - 1)
                    t.$more = true;
                else
                    t.$more = false;
            }
            this.UpdateTask(t, sectionIndex, y);
            this._processed.push(t);
            this._processed.sort(function (a, b) { return a.$y - b.$y; });
        };
        ChartView.prototype.CheckDates = function (prev, next, all_day) {
            return (all_day ? webix.Date.add(prev, 1, "day", true) : prev) <= next;
        };
        ChartView.prototype.RenderEvents = function () {
            var _this = this;
            if (this._DataObj) {
                this.Bars.$view.firstChild.removeChild(this._DataObj);
                delete this._DataObj;
            }
            if (!this.Events.count() || !this.Bars.count())
                return;
            var container = webix.html.create("div", {
                role: "presentation",
            });
            var html = "";
            var _ = this.app.getService("locale")._;
            this.Events.data.each(function (obj) {
                if (!obj.$hide) {
                    if (!obj.$more || _this._lastRow[obj.section] == 4) {
                        html += _this.BarsTemplate(obj, _);
                    }
                    else {
                        if (!_this._moreEvents[obj.section]) {
                            _this._moreEvents[obj.section] = [];
                            html += _this.MoreBarTemplate(obj, _);
                        }
                        _this._moreEvents[obj.section].push(obj.id);
                    }
                }
            });
            container.innerHTML = html;
            this._DataObj = this.Bars.$view.firstChild.appendChild(container);
            this.app.callEvent("events:rendered", []);
        };
        ChartView.prototype.DrawGrid = function (scales) {
            var view = this.Bars;
            var colors = { contrast: "#808080", dark: "#384047" };
            view.$view.style.backgroundImage = "url(" + this.GetGrid(scales, colors[webix.skin.$name] || "#ddd") + ")";
            view.$view.style.marginTop = "0px";
            view.$view.style.backgroundPosition = "-" + this.InnerState.left + "px -" + this.InnerState.top + "px";
            this.Resize(scales.width);
        };
        ChartView.prototype.Resize = function (width) {
            var area = this.Bars.$view.querySelector(".webix_scroll_cont");
            area.style.width = width + "px";
            area.style.minHeight = "1px";
        };
        ChartView.prototype.HandleScroll = function () {
            var _this = this;
            this.InnerState = this.getParam("innerState", true);
            this._scroll_handler = webix.event(this.Bars.$view, "scroll", function (ev) {
                var bars = ev.target;
                var top = Math.round(bars.scrollTop);
                var left = Math.round(bars.scrollLeft);
                _this.Bars.$view.style.backgroundPosition = "-" + left + "px -" + top + "px";
                _this.InnerState.$batch({ top: top, left: left });
                _this.Tree.scrollTo(0, top);
                _this.MoreWindow.HideWindow();
            });
            this.on(this.Tree, "onScrollY", function () {
                var y = this.getScrollState().y;
                this.$scope.Bars.scrollTo(this.$scope.InnerState.left, y);
            });
        };
        ChartView.prototype.BarsTemplate = function (obj, _) {
            var style = dayEventColor(obj);
            var scales = this.Scales;
            var w = obj.$w - 2;
            if (obj.all_day && obj.end_date < scales.end) {
                w += this.GetUnitWidth(scales, obj.start_date);
            }
            var content = "<div class=\"webix_scheduler_timeline_content\">" + (obj.text ||
                _("(no title)")) + "</div>";
            var css = "webix_scheduler_timeline_event";
            css +=
                this.State.selected &&
                    (obj.id == this.State.selected.id || obj.id == this.State.selected.date)
                    ? " webix_scheduler_event_selected"
                    : "";
            if (obj.start_date < this.Scales.start)
                css += " webix_scheduler_event_break_left";
            else if (obj.end_date > this.Scales.end)
                css += " webix_scheduler_event_break_right";
            var tooltip = this.GetTooltip(obj);
            return "<div webix_e_id=\"" + obj.id + "\" \n\t\t\twebix_tooltip=\"" + tooltip + "\" class=\"" + css + "\" \n\t\t\tstyle=\"left:" + obj.$x + "px;top:" + obj.$y + "px;width:" + w + "px;height:" + obj.$h + "px;" + style + "\">\n\t\t\t" + content + "\n\t\t</div>";
        };
        ChartView.prototype.GetTooltip = function (obj) {
            return obj.text;
        };
        ChartView.prototype.MoreBarTemplate = function (obj, _) {
            var text = _("Show more");
            var content = "<div class=\"webix_scheduler_timeline_content\" webix_tooltip=\"" + text + "\">" + text + "</div>";
            var css = "webix_scheduler_timeline_event webix_scheduler_multi_more";
            return "<div webix_e_id=\"$wsh_multi_more\" webix_r_id=\"" + obj.section + "\" class=\"" + css + "\" style=\"left:0px;top:" + obj.$y + "px;width:100%;height:" + obj.$h + "px;\">\n\t\t\t" + content + "\n\t\t</div>";
        };
        ChartView.prototype.ShowEvent = function (e) {
            var event = locateEvent$1(e, this.Bars.$view);
            if (event.id === "$wsh_multi_more") {
                var id = event.node.getAttribute("webix_r_id");
                this.MoreWindow.ShowWindow(id, this.Tree.getItemNode(id), this._moreEvents[id] || []);
            }
            else if (event.id && event.id != "0") {
                var obj = this.GetEvent(event.id);
                var sel = webix.extend(event, getParams(obj), true);
                this.State.selected = sel;
            }
            return false;
        };
        ChartView.prototype.ShowNew = function (e, id) {
            var state = this.State;
            if (!state.readonly && !state.clipboard) {
                var scales = this.Scales;
                var start = scales.start;
                var unit = scales.precise
                    ? this.GetUnitCount(scales.minUnit)
                    : scales.minUnit;
                var n = Math.floor(e.offsetX / this.GetUnitWidth(scales));
                var date = this.AddUnit(unit, start, n);
                state.selected = { id: "0", date: date, section: id };
            }
        };
        ChartView.prototype.GetEvent = function (id) {
            return this.Events.getItem(id);
        };
        ChartView.prototype.UpdateSelection = function (id, newEvent) {
            if (this.State.selected) {
                newEvent.id = id;
                this.State.selected = getParams(newEvent);
            }
        };
        ChartView.prototype.GetTargetDate = function () {
            var clickedUnit = this.mousePosUnit || 0;
            var scales = this.Scales;
            return this.AddUnit(scales.minUnit, scales.start, clickedUnit);
        };
        ChartView.prototype.GetUnitCount = function (type) {
            return wgantt_7[type][0];
        };
        ChartView.prototype.GetUnitStart = function (unit, date) {
            return wgantt_3(unit, date);
        };
        ChartView.prototype.AddUnit = function (unit, date, count) {
            return wgantt_1(unit)(date, count);
        };
        ChartView.prototype.GetGrid = function (scales, color) {
            return wgantt_4(scales.cellWidth, scales.cellHeight, color);
        };
        ChartView.prototype.UpdateTask = function (task, sectionIndex, y) {
            return wgantt_9(task, this._lastRow[task.section] + sectionIndex * this._sectionSize, this.Scales, this.Scales.cellHeight - 12, y);
        };
        ChartView.prototype.GetUnitWidth = function (scales, date) {
            if (scales.precise &&
                (scales.minUnit !== "day" || scales.minUnit !== "month")) {
                var count = wgantt_7[scales.minUnit][1];
                var number = typeof count === "number" ? count : count(date);
                return Math.floor(scales.cellWidth / number);
            }
            return scales.cellWidth;
        };
        return ChartView;
    }(JetView));
    function indexOf(arr, el) {
        for (var i = 0; i < arr.length; ++i) {
            if (arr[i] == el)
                return i;
        }
        return -1;
    }

    var ScalesView = (function (_super) {
        __extends(ScalesView, _super);
        function ScalesView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ScalesView.prototype.config = function () {
            var compact = this.getParam("compact", true);
            return {
                cols: [
                    {
                        width: compact ? 80 : 200,
                        css: "webix_scheduler_timeline_space",
                        borderless: false,
                    },
                    {
                        view: "template",
                        localId: "scale",
                        height: 20,
                        css: "webix_scheduler_timeline_scale",
                    },
                ],
            };
        };
        ScalesView.prototype.init = function () {
            var scale = this.$$("scale");
            var innerState = (this.InnerState = this.getParam("innerState", true));
            this.on(innerState.$changes, "left", function (x) { return scale.scrollTo(x, null); });
        };
        ScalesView.prototype.urlChange = function () {
            this.RenderScales();
        };
        ScalesView.prototype.RenderScales = function () {
            var _this = this;
            var scales = this.getParam("scales", true);
            var view = this.$$("scale");
            var html = scales.rows
                .map(function (line) {
                return ("<div class=\"webix_scheduler_timeline_scale_row\" style='height:" + line.height + "px;width:" + scales.width + "px'>" +
                    line.cells.map(function (cell) { return _this.CellTemplate(cell, line.type); }).join("") +
                    "</div>");
            })
                .join("");
            view.config.height = scales.height;
            view.setHTML(html);
            view.resize();
        };
        ScalesView.prototype.CellTemplate = function (cell) {
            var css = "webix_scheduler_timeline_scale_cell " + cell.css;
            return "<div class=\"" + css + "\" style=\"width:" + cell.width + "px;\">" + cell.format(cell.date) + "</div>";
        };
        ScalesView.prototype.DateIsToday = function (date) {
            var today = webix.Date.dayStart(new Date());
            return webix.Date.equal(today, webix.Date.dayStart(date));
        };
        return ScalesView;
    }(JetView));

    var TimelineView = (function (_super) {
        __extends(TimelineView, _super);
        function TimelineView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TimelineView.prototype.config = function () {
            var ui = {
                rows: [BarView, ScalesView, ChartView],
            };
            return ui;
        };
        TimelineView.prototype.init = function () {
            var _this = this;
            var state = (this.State = this.getParam("state", true));
            var innerState = (this.InnerState = createState({
                top: 0,
                left: 0,
            }));
            this.setParam("innerState", innerState, true);
            this.on(state.$changes, "date", function (v) { return _this.SetScales(v, state.timelineMode); });
            this.on(state.$changes, "timelineMode", function (t, o) {
                if (o)
                    _this.SetScales(state.date, t);
            });
        };
        TimelineView.prototype.SetScales = function (date, type) {
            var scales = this.ResetScales(type, date);
            this.setParam("scales", scales, true);
        };
        TimelineView.prototype.GetScalesArray = function (type) {
            switch (type) {
                case "day":
                    return [{ unit: "hour", format: "%H:00" }];
                case "week":
                    return [{ unit: "day", step: 1, format: "%d" }];
                case "month":
                    return [
                        {
                            unit: "week",
                            format: function (start) {
                                var parser = webix.Date.dateToStr("%d %M");
                                var wstart = webix.Date.weekStart(start);
                                var wend = webix.Date.add(webix.Date.add(wstart, 1, "week", true), -1, "day", true);
                                return parser(wstart) + " - " + parser(wend);
                            },
                        },
                    ];
                default: {
                    var unit = this.GetDefaultScaleUnit(type);
                    return [
                        {
                            unit: unit,
                            format: function (start, end) {
                                var parser = webix.Date.dateToStr("%d %M %YYYY");
                                return parser(start) + " - " + parser(end);
                            },
                        },
                    ];
                }
            }
        };
        TimelineView.prototype.GetScalesCellWidth = function (type) {
            switch (type) {
                case "day":
                    return 80;
                case "week":
                    return 300;
                case "month":
                    return 400;
                default:
                    return 100;
            }
        };
        TimelineView.prototype.GetScalePrecision = function (type) {
            switch (type) {
                case "day":
                    return false;
                case "week":
                    return false;
                case "month":
                    return true;
                default:
                    return true;
            }
        };
        TimelineView.prototype.AddUnit = function (unit, date, step) {
            return wgantt_1(unit)(date, step);
        };
        TimelineView.prototype.GetUnitStart = function (unit, date) {
            return wgantt_3(unit, date);
        };
        TimelineView.prototype.ResetScales = function (unit, date) {
            var start = this.GetUnitStart(unit, date);
            var end = this.AddUnit(unit, start, 1);
            var active = webix.skin.$active;
            return wgantt_6(start, end, this.GetScalePrecision(unit), this.GetScalesCellWidth(unit), active.barHeight - active.borderWidth * 2, this.GetScalesArray(unit));
        };
        TimelineView.prototype.GetDefaultScaleUnit = function (type) {
            return wgantt_7[type][0] || type;
        };
        return TimelineView;
    }(JetView));

    var UnitEventsView = (function (_super) {
        __extends(UnitEventsView, _super);
        function UnitEventsView(app, config) {
            var _this = _super.call(this, app) || this;
            if (config) {
                _this.Unit = config.unit;
            }
            return _this;
        }
        UnitEventsView.prototype.config = function () {
            var _this = this;
            return {
                view: "list",
                localId: "unitList",
                css: "webix_scheduler_day_events",
                scroll: false,
                autoheight: true,
                template: "",
                type: {
                    height: 42,
                    css: "webix_scheduler_day_scale_item",
                },
                onClick: {
                    webix_scheduler_day_event: function (e) { return _this.ShowEvent(e); },
                },
                onDblClick: {
                    webix_scheduler_day_scale_item: function (_e, h) { return _this.ShowNew(h); },
                },
            };
        };
        UnitEventsView.prototype.init = function () {
            var _this = this;
            this.State = this.app.getState();
            this.List = this.$$("unitList");
            SelectionMixin(this, "scale");
            EditRecurringMixin(this);
            this.List.$setSize = function (x, y) {
                if (webix.ui.view.prototype.$setSize.call(this, x, y)) {
                    this.render();
                }
            };
            this.minEventHeight = 62;
            this.ParseHours();
            this.on(this.State.$changes, "readonly", function () { return _this.List.render(); });
            this.List.attachEvent("onAfterRender", function () { return _this.RenderEvents(); });
            initDnD.call(this, this.List, "units");
            var compact = this.getParam("compact", true);
            if (this.app.config.copypaste && !webix.env.mobile && !compact)
                CopyPasteMixin(this, this.List);
        };
        UnitEventsView.prototype.FilterToday = function (value, to) {
            var _this = this;
            var dayEvents = _super.prototype.FilterToday.call(this, value, to);
            return dayEvents.filter(function (obj) {
                if (obj.units) {
                    var units = obj.units.split(",");
                    var unitID = _this.Unit.id + "";
                    return units.indexOf(unitID) !== -1;
                }
                return false;
            });
        };
        UnitEventsView.prototype.ShowNew = function (h) {
            var state = this.State;
            if (!state.readonly && !state.clipboard) {
                var date = webix.Date.copy(this.Day || state.date);
                var unit = this.Unit.id;
                date.setHours(h);
                state.selected = { id: "0", date: date, unit: unit };
            }
        };
        return UnitEventsView;
    }(DayEventsView));

    var UnitsHeaderView = (function (_super) {
        __extends(UnitsHeaderView, _super);
        function UnitsHeaderView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        UnitsHeaderView.prototype.config = function () {
            return {
                type: "clean",
                cols: [
                    { borderless: false, width: 51 },
                    {
                        view: "dataview",
                        localId: "header",
                        css: "webix_scheduler_day_header",
                        xCount: 1,
                        yCount: 1,
                        width: 0,
                        height: 32,
                        scroll: false,
                        type: {
                            height: "auto",
                            width: "auto",
                        },
                        template: function (obj) { return obj.value; },
                    },
                ],
            };
        };
        UnitsHeaderView.prototype.init = function () {
            var _this = this;
            this.Header = this.$$("header");
            this.Units = this.app.getService("local").units();
            this.Units.then(function (unitsCache) {
                _this.Header.sync(unitsCache, function () {
                    _this.Header.define({ xCount: unitsCache.count() });
                    _this.Header.resize();
                });
            });
        };
        return UnitsHeaderView;
    }(JetView));

    var UnitMultidayList = (function (_super) {
        __extends(UnitMultidayList, _super);
        function UnitMultidayList(app, config) {
            var _this = _super.call(this, app) || this;
            if (config) {
                _this.Unit = config.unit;
            }
            return _this;
        }
        UnitMultidayList.prototype.config = function () {
            var _this = this;
            return {
                view: "list",
                localId: "multiDayList",
                autoheight: true,
                scroll: false,
                css: "webix_scheduler_multilist",
                type: {
                    height: 36,
                    template: function (obj, common) { return _this.EventTemplate(obj, common); },
                },
                onClick: {
                    webix_scheduler_multiday_event: function (e, id, node) {
                        return _this.ShowEvent(id, node);
                    },
                },
            };
        };
        UnitMultidayList.prototype.init = function () {
            var _this = this;
            this.State = this.app.getState();
            this.List = this.$$("multiDayList");
            this._expandState = "down";
            this.maxVisibleLines = 3;
            this._DataObj = this.List.$view.firstChild;
            SelectionMixin(this, "multi", true);
            this._moreBtn = {
                id: "$wsh_multi_more",
                $css: "webix_scheduler_multi_more",
            };
            this.on(this.app, "units:multi:state", function (state) {
                if (state !== _this._expandState) {
                    state === "down" ? _this.WrapData() : _this.ExpandData();
                }
            });
            initDnD.call(this, this.List, "multidayUnits");
            EditRecurringMixin(this);
            if (this.app.config.copypaste && !webix.env.mobile)
                CopyPasteMixin(this, this.List, { multi: true });
        };
        UnitMultidayList.prototype.urlChange = function () {
            var data = this.getParam("data");
            if (data) {
                var copy = webix.copy(data.multi);
                var multi = this.FilterByUnits(copy);
                this.LimitData(multi);
                this.List.clearAll();
                this.List.parse(multi);
            }
        };
        UnitMultidayList.prototype.EventTemplate = function (obj, common) {
            var height = common.height - 8;
            var size = "height:" + height + "px; line-height:" + height + "px; width:calc(100% - 5px);";
            var color = obj.id !== "$wsh_multi_more" ? dayEventColor(obj) : "";
            var css = this.GetStyle(obj);
            var _ = this.app.getService("locale")._;
            return "\n\t\t\t<div\n\t\t\t\tclass=\"" + css + "\"\n\t\t\t\tstyle=\"" + size + " " + color + "\">\n\t\t\t\t\t" + (obj.text || _("(No title)")) + "\n\t\t\t</div>\n\t\t";
        };
        UnitMultidayList.prototype.GetStyle = function (obj) {
            var css = "webix_scheduler_multiday_event";
            if (obj.id == "$wsh_multi_more")
                return css;
            var date = this.State.date;
            var end = !obj.all_day && !webix.Date.timePart(obj.end_date)
                ? webix.Date.add(obj.end_date, -1, "day", true)
                : obj.end_date;
            css +=
                this.State.selected &&
                    (obj.id == this.State.selected.id || obj.id == this.State.selected.date)
                    ? " webix_scheduler_event_selected"
                    : "";
            css += obj.$past ? " webix_scheduler_past_event" : "";
            if (obj.start_date < date)
                css += " webix_scheduler_event_break_left";
            if (end >= webix.Date.add(date, 1, "day", true))
                css += " webix_scheduler_event_break_right";
            return css;
        };
        UnitMultidayList.prototype.LimitData = function (data) {
            delete this._reserve;
            delete this._reserveIds;
            if (data.length > this.maxVisibleLines) {
                var excess = data.length - 2;
                var _ = this.app.getService("locale")._;
                this._moreBtn.text = excess + " " + _("more");
                if (this._expandState === "down") {
                    this._reserve = data.splice(2, excess, this._moreBtn);
                }
                else {
                    this._reserve = data.slice(2);
                }
                this._reserveIds = this._reserve.map(function (d) { return d.id; });
                this.app.callEvent("units:multi:state", [this._expandState, false]);
            }
        };
        UnitMultidayList.prototype.WrapData = function () {
            var _this = this;
            if (!this._inAnimation) {
                this._expandState = "down";
                if (this._reserveIds) {
                    this._inAnimation = true;
                    var height = this.List.$height -
                        (this._reserveIds.length - 1) * this.List.type.height;
                    this.Animate("down", height, function () {
                        _this.List.add(_this._moreBtn);
                        _this.List.remove(_this._reserveIds);
                    });
                }
            }
        };
        UnitMultidayList.prototype.ExpandData = function () {
            var expandable = this.List.exists("$wsh_multi_more");
            if (!this._inAnimation) {
                this._expandState = "up";
                if (expandable) {
                    this._inAnimation = true;
                    this.Animate("up");
                    this.List.remove("$wsh_multi_more");
                    this.List.parse(this._reserve);
                }
            }
        };
        UnitMultidayList.prototype.Animate = function (mode, height, handler) {
            var _this = this;
            this.List.$view.style.transition = "height 150ms";
            if (height)
                this.List.$view.style.height = height + "px";
            setTimeout(function () {
                if (handler)
                    handler();
                _this.List.$view.style.transition = "";
                _this._inAnimation = false;
            }, 150);
        };
        UnitMultidayList.prototype.ShowEvent = function (id, node) {
            if (id === "$wsh_multi_more") {
                this.app.callEvent("units:multi:state", ["up", true]);
            }
            else {
                var obj = this.List.getItem(id);
                var sel = getParams(obj);
                sel.node = node;
                this.State.selected = sel;
            }
            return false;
        };
        UnitMultidayList.prototype.FilterByUnits = function (multiEvents) {
            var _this = this;
            return multiEvents.filter(function (obj) {
                if (obj.units) {
                    var units = obj.units.split(",");
                    var unitID = _this.Unit.id + "";
                    return units.indexOf(unitID) !== -1;
                }
                return false;
            });
        };
        UnitMultidayList.prototype.GetEvent = function (id) {
            return this.List.getItem(id);
        };
        UnitMultidayList.prototype.GetTargetDate = function () {
            return this.State.date;
        };
        return UnitMultidayList;
    }(JetView));

    var UnitMultidayView = (function (_super) {
        __extends(UnitMultidayView, _super);
        function UnitMultidayView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        UnitMultidayView.prototype.config = function () {
            var _this = this;
            var ui = _super.prototype.config.call(this);
            var units = this.app.getService("local").units();
            var more = ui.cols[0];
            more.onClick = {
                "wxi-angle-down": function () {
                    return _this.app.callEvent("units:multi:state", ["up", true]);
                },
                "wxi-angle-up": function () {
                    return _this.app.callEvent("units:multi:state", ["down", true]);
                },
            };
            ui.cols[1] = { cols: [] };
            return units.then(function (unitsCache) {
                var data = unitsCache.serialize();
                for (var i = 0; i < data.length; ++i) {
                    ui.cols[1].cols.push(new (_this.app.dynamic(UnitMultidayList))(_this.app, {
                        unit: data[i],
                    }));
                }
                return ui;
            });
        };
        UnitMultidayView.prototype.init = function () {
            var _this = this;
            this.State = this.app.getState();
            this.MoreIcon = this.$$("more");
            this.on(this.State.$changes, "date", function () {
                _this.SetMoreIcon();
            });
            this.on(this.app, "units:multi:state", function (state, animate) {
                _this.Animate(state, animate ? 150 : 1);
            });
        };
        UnitMultidayView.prototype.Animate = function (mode, delay) {
            var _this = this;
            setTimeout(function () {
                _this.SetMoreIcon(mode);
            }, delay);
        };
        return UnitMultidayView;
    }(MultiMoreView));

    var UnitsView = (function (_super) {
        __extends(UnitsView, _super);
        function UnitsView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        UnitsView.prototype.config = function () {
            var _this = this;
            this.Compact = this.getParam("compact", true);
            var units = this.app.getService("local").units();
            var multi = {
                localId: "multi",
                hidden: true,
                cols: [UnitMultidayView],
            };
            var days = {
                localId: "scroll",
                view: "scrollview",
                scroll: "y",
                css: "webix_scheduler_week_days",
                body: {
                    cols: [HourscaleView],
                },
            };
            return units.then(function (unitsCache) {
                var data = unitsCache.serialize();
                for (var i = 0; i < data.length; ++i) {
                    days.body.cols.push(new (_this.app.dynamic(UnitEventsView))(_this.app, {
                        unit: data[i],
                    }));
                }
                return {
                    rows: [UnitsHeaderView, multi, days],
                };
            });
        };
        UnitsView.prototype.init = function () {
            var _this = this;
            var state = this.app.getState();
            this.on(state.$changes, "date", function (value) { return _this.RefreshData(value); });
            this.on(state.$changes, "active", function () { return _this.RefreshData(state.date); });
            this.on(this.app, "events:refresh", function () { return _this.RefreshData(state.date); });
            var events = this.app.getService("local").events(true);
            this.on(events.data, "onStoreUpdated", function (_i, _o, mode) { return mode && _this.RefreshData(state.date); });
        };
        UnitsView.prototype.RefreshData = function (value) {
            var _this = this;
            this.GetDay(value).then(function (data) {
                if (_this.app)
                    _this.setParam("data", data, true);
                if (data.multi.length) {
                    _this.$$("multi").show();
                }
                else
                    _this.$$("multi").hide();
            });
        };
        UnitsView.prototype.GetDay = function (date) {
            var end = webix.Date.add(date, 1, "day", true);
            return this.app
                .getService("local")
                .getEvents(date, end)
                .then(function (evs) {
                var multi = [], single = [];
                evs.forEach(function (ev) {
                    if (isMultiDay(ev)) {
                        multi.push(ev);
                    }
                    else {
                        single.push(ev);
                    }
                });
                return { multi: multi, single: single };
            });
        };
        return UnitsView;
    }(JetView));

>>>>>>> 6388b01 (New widget Scheduler)
    var WeekEventsView = (function (_super) {
        __extends(WeekEventsView, _super);
        function WeekEventsView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        WeekEventsView.prototype.config = function () {
            var ui = _super.prototype.config.call(this);
            ui.css = "webix_scheduler_week";
            ui.type.headerHeight = 28;
            return ui;
        };
        WeekEventsView.prototype.urlChange = function () {
            this.data = this.getParam("data");
            if (this.data) {
                this.List.clearAll();
                this.List.parse(this.data.all);
                this.ToggleOverlay();
            }
        };
        WeekEventsView.prototype.TemplateHeader = function (datestring) {
            var date = new Date(datestring * 1);
            var today = isToday(date);
            var fstring = "%l, %F <span class='webix_scheduler_monthday" + (today ? " webix_scheduler_today" : "") + "'>%j</span>";
            return "<span class=\"webix_unit_header_inner\">" + webix.Date.dateToStr(fstring)(date) + "</span>";
        };
        return WeekEventsView;
    }(UnitListView));

    var WeekHeaderView = (function (_super) {
        __extends(WeekHeaderView, _super);
        function WeekHeaderView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        WeekHeaderView.prototype.config = function () {
            return {
                type: "clean",
                cols: [
                    { borderless: false, width: 51 },
                    {
                        view: "dataview",
                        localId: "header",
                        css: "webix_scheduler_day_header",
                        xCount: 7,
                        yCount: 1,
                        width: 0,
                        height: 32,
                        scroll: false,
                        type: {
                            height: "auto",
                            width: "auto",
                        },
                        template: function (obj) {
                            return "<span class=\"webix_scheduler_weekday\">" + obj.day + "</span> <span class=\"webix_scheduler_monthday\">" + obj.date + "</span>";
                        },
                    },
                ],
            };
        };
        WeekHeaderView.prototype.urlChange = function () {
            this.data = this.getParam("data");
            if (this.data) {
                this.RefreshData();
            }
        };
        WeekHeaderView.prototype.RefreshData = function () {
            var start = this.data.start;
            var data = [];
            while (start < this.data.end) {
                var obj = {
                    day: webix.i18n.calendar.dayShort[start.getDay()],
                    date: start.getDate(),
                };
                if (isToday(start)) {
                    obj.$css = "webix_scheduler_list_today";
                }
                data.push(obj);
                start = webix.Date.add(start, 1, "day", true);
            }
            var header = this.$$("header");
            header.clearAll();
            header.parse(data);
        };
        return WeekHeaderView;
    }(JetView));

    var MultiDayEventsView = (function (_super) {
        __extends(MultiDayEventsView, _super);
        function MultiDayEventsView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MultiDayEventsView.prototype.config = function () {
            var _this = this;
            var ui = _super.prototype.config.call(this);
            ui.cols[1] = {
                view: "dataview",
                localId: "multiDayList",
                css: "webix_scheduler_multidays",
                scroll: false,
                height: 32,
                xCount: 7,
                yCount: 1,
                width: 0,
                type: {
                    width: "auto",
                    height: "auto",
<<<<<<< HEAD
                    itemHeight: 32,
=======
                    itemHeight: 36,
>>>>>>> 6388b01 (New widget Scheduler)
                },
                template: "",
                tooltip: {
                    template: "",
                },
                onClick: {
                    webix_scheduler_multiday_event: function (e) { return _this.ShowEvent(e); },
                },
            };
            return ui;
        };
        MultiDayEventsView.prototype.init = function () {
            var _this = this;
            this.State = this.app.getState();
            _super.prototype.init.call(this);
            SelectionMixin(this, "multi");
            EditRecurringMixin(this);
            this.Events = new webix.DataCollection({});
            this.List.attachEvent("onAfterRender", function () { return _this.RenderEvents(); });
            initDnD.call(this, this.List, "multiday");
<<<<<<< HEAD
=======
            if (this.app.config.copypaste && !webix.env.mobile)
                CopyPasteMixin(this, this.List);
>>>>>>> 6388b01 (New widget Scheduler)
        };
        MultiDayEventsView.prototype.urlChange = function () {
            this.data = this.getParam("data");
            if (this.data) {
                this.ParseDays(this.data.multi);
            }
        };
        MultiDayEventsView.prototype.ParseDays = function (events) {
            if (!events.length)
                return;
            this.Events.clearAll();
            this.Events.parse(events);
            var days = [];
            for (var d = 0; d < 7; d++) {
                days.push({
                    id: d + 1,
                    date: webix.Date.add(this.data.start, d, "day", true),
                });
            }
            this.BreakEventsByDay(days);
            this.SetMoreIcon(this._maxEvents > this.maxVisibleLines ? this._expandState : null);
            this.List.blockEvent();
            this.List.parse(days);
            this.ResetListHeight();
            this.List.unblockEvent();
            this.RenderEvents();
        };
        MultiDayEventsView.prototype.BreakEventsByDay = function (data) {
            var _this = this;
            this.Days = [];
            var processed = {};
            this._maxEvents = 0;
            data.forEach(function (day, dayIndex) {
                var today = day.date;
                _this.Days.push([]);
                _this.Events.data.each(function (ev) {
                    if (!webix.isUndefined(processed[ev.id])) {
                        if ((today <= ev.end_date && ev.all_day) || today < ev.end_date) {
                            _this.Days[dayIndex][processed[ev.id]] = "";
                        }
                        else
                            delete processed[ev.id];
                    }
                    else if (ev.start_date < webix.Date.add(today, 1, "day", true) &&
                        ev.end_date >= today) {
                        var index = 0;
                        while (!webix.isUndefined(_this.Days[dayIndex][index]))
                            index++;
                        processed[ev.id] = index;
                        var config = {};
                        config.es = ev.start_date;
                        config.ee =
                            !ev.all_day && !webix.Date.timePart(ev.end_date)
                                ? webix.Date.add(ev.end_date, -1, "day", true)
                                : ev.end_date;
                        config.length =
                            1 +
                                daysBetweenInclusive((config.ls = new Date(Math.max(_this.data.start, config.es))), (config.le = new Date(Math.min(_this.data.end - 1, config.ee))));
                        ev.$config = config;
                        _this.Days[dayIndex][index] = ev;
                    }
                });
                if (_this.Days[dayIndex].length > _this._maxEvents)
                    _this._maxEvents = _this.Days[dayIndex].length;
            });
        };
        MultiDayEventsView.prototype.RenderEvents = function () {
            var _this = this;
            var allEvents = this.Events.count();
            if (!allEvents)
                return;
            var container = webix.html.create("div", {
                role: "presentation",
            });
            var html = "";
            var renderedEvents = 0;
            var toHide = this._expandState === "down" && this._maxEvents > this.maxVisibleLines;
            this.List.data.each(function (_day, dayIndex) {
                var dayHTML = [];
                var visible = toHide
                    ? _this.maxVisibleLines - 1
                    : _this.Days[dayIndex].length;
                for (var i = 0; i < visible; ++i) {
                    dayHTML[i] = _this.Days[dayIndex][i];
                    if (dayHTML[i]) {
                        dayHTML[i] = _this.ToHTML(dayHTML[i], dayIndex, i);
                        renderedEvents++;
                    }
                }
                html += dayHTML.join("");
            });
            if (toHide) {
                html += this.MoreOption(allEvents - renderedEvents);
            }
            container.innerHTML = html;
            this._DataObj = this.List.$view.firstChild.appendChild(container);
<<<<<<< HEAD
=======
            this.app.callEvent("events:rendered", []);
>>>>>>> 6388b01 (New widget Scheduler)
        };
        MultiDayEventsView.prototype.ToHTML = function (obj, cIndex, rIndex) {
            var style = dayEventColor(obj);
            var size = this.GetSizePosition(obj.$config.length, cIndex, rIndex);
            var css = this.GetStyle(obj, obj.$config);
            var _ = this.app.getService("locale")._;
            return "\n\t\t\t<div\n\t\t\t\twebix_tooltip=\"" + (obj.text || _("(No title)")) + "\"\n\t\t\t\twebix_e_id=\"" + obj.id + "\"\n\t\t\t\tclass=\"" + css + "\"\n\t\t\t\tstyle=\"" + size + " " + style + "\">\n\t\t\t\t\t" + (obj.text || _("(No title)")) + "\n\t\t\t</div>\n\t\t";
        };
        MultiDayEventsView.prototype.GetStyle = function (obj, c) {
            var _a = this.data, start = _a.start, end = _a.end;
            var css = "webix_scheduler_multiday_event";
            css +=
                this.State.selected &&
                    (obj.id == this.State.selected.id || obj.id == this.State.selected.date)
                    ? " webix_scheduler_event_selected"
                    : "";
            if (c.es < start && webix.Date.equal(start, webix.Date.dayStart(c.ls)))
                css += " webix_scheduler_event_break_left";
            if (c.ee >= end &&
                webix.Date.equal(webix.Date.add(end, -1, "day", true), webix.Date.dayStart(c.le)))
                css += " webix_scheduler_event_break_right";
<<<<<<< HEAD
=======
            css += obj.$past ? " webix_scheduler_past_event" : "";
>>>>>>> 6388b01 (New widget Scheduler)
            return css;
        };
        MultiDayEventsView.prototype.MoreOption = function (excess) {
            var _ = this.app.getService("locale")._;
            var size = this.GetSizePosition(this.List.config.xCount, 0, this.maxVisibleLines - 1);
            return "<div webix_e_id=\"$wsh_multi_more\" class=\"webix_scheduler_multiday_event webix_scheduler_multi_more\" style=\"" + size + "\">" + excess + " " + _("more") + "</div>";
        };
        MultiDayEventsView.prototype.GetSizePosition = function (length, cIndex, rIndex) {
            var width = length * this.List.type.width - 4;
<<<<<<< HEAD
            var height = this.List.type.itemHeight - 4;
            var left = this.List.type.width * cIndex + 1;
            var top = rIndex * this.List.type.itemHeight + 1;
            return "width:" + width + "px; height:" + height + "px; line-height:" + height + "px; left:" + left + "px; top:" + top + "px;";
        };
        MultiDayEventsView.prototype.ShowEvent = function (e) {
            var event = locateEvent(e, this.List.$view);
=======
            var height = this.List.type.itemHeight - 8;
            var left = this.List.type.width * cIndex + 1;
            var top = rIndex * this.List.type.itemHeight + 4;
            return "width:" + width + "px; height:" + height + "px; line-height:" + height + "px; left:" + left + "px; top:" + top + "px;";
        };
        MultiDayEventsView.prototype.ShowEvent = function (e) {
            var event = locateEvent$1(e, this.List.$view);
>>>>>>> 6388b01 (New widget Scheduler)
            if (event.id) {
                if (event.id === "$wsh_multi_more")
                    return this.ExpandData();
                var obj = this.Events.getItem(event.id);
                var sel = webix.extend(event, getParams(obj), true);
                this.State.selected = sel;
            }
            return false;
        };
        MultiDayEventsView.prototype.ExpandData = function () {
            if (!this._inAnimation) {
                this._inAnimation = true;
                this._expandState = "up";
                this.Animate("up");
                this.ResetListHeight(this._maxEvents);
            }
        };
        MultiDayEventsView.prototype.WrapData = function () {
            var _this = this;
            if (!this._inAnimation) {
                this._inAnimation = true;
                this._expandState = "down";
                var height = this.List.$height -
                    (this._maxEvents - this.maxVisibleLines) * this.List.type.height;
                this.Animate("down", height, function () {
                    _this.ResetListHeight(_this.maxVisibleLines);
                });
            }
        };
        MultiDayEventsView.prototype.ResetListHeight = function (count) {
            if (!count)
                count =
                    this._expandState === "down"
                        ? Math.min(this._maxEvents, this.maxVisibleLines)
                        : this._maxEvents;
            var height = count * this.List.type.itemHeight;
            if (this.List.type.height !== height) {
                this.List.type.height = height;
                this.List.define("height", height);
                this.List.resize();
            }
        };
<<<<<<< HEAD
=======
        MultiDayEventsView.prototype.GetEvent = function (id) {
            return this.Events.getItem(id);
        };
        MultiDayEventsView.prototype.GetTargetDate = function (id) {
            return id ? this.List.getItem(id).date : this.State.date;
        };
>>>>>>> 6388b01 (New widget Scheduler)
        return MultiDayEventsView;
    }(MultiMoreView));

    var WeekView = (function (_super) {
        __extends(WeekView, _super);
        function WeekView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        WeekView.prototype.config = function () {
            this.Compact = this.getParam("compact", true);
            if (this.Compact) {
                return {
                    rows: [WeekEventsView],
                };
            }
            else {
                var days = {
                    localId: "scroll",
                    view: "scrollview",
                    scroll: "y",
                    css: "webix_scheduler_week_days",
                    body: {
                        cols: [HourscaleView],
                    },
                };
                var weekLength = 7;
                for (var i = 0; i < weekLength; ++i) {
<<<<<<< HEAD
                    days.body.cols.push(new (this.app.dynamic(DayEventsView))(this.app, "", {
=======
                    days.body.cols.push(new (this.app.dynamic(DayEventsView))(this.app, {
>>>>>>> 6388b01 (New widget Scheduler)
                        day: i,
                    }));
                }
                return {
                    rows: [
                        WeekHeaderView,
                        { localId: "multi", hidden: true, cols: [MultiDayEventsView] },
                        days,
                    ],
                };
            }
        };
        WeekView.prototype.init = function () {
            var _this = this;
            var state = this.app.getState();
            this.on(state.$changes, "date", function (value) { return _this.RefreshData(value); });
            this.on(state.$changes, "active", function () { return _this.RefreshData(state.date); });
            this.on(this.app, "events:refresh", function () { return _this.RefreshData(state.date); });
            var events = this.app.getService("local").events(true);
            this.on(events.data, "onStoreUpdated", function (_i, _o, mode) { return mode && _this.RefreshData(state.date); });
            if (!this.Compact) {
                this.on(state.$changes, "selected", function (v) { return v && _this.ScrollScale(v); });
            }
        };
        WeekView.prototype.RefreshData = function (date) {
            var _this = this;
            var start = webix.Date.weekStart(date);
            var end = webix.Date.add(start, 1, "week", true);
            this.GetWeek(start, end).then(function (data) {
                if (_this.app)
                    _this.setParam("data", data, true);
                if (data.multi.length) {
                    _this.$$("multi").show();
                }
                else
                    _this.$$("multi").hide();
            });
        };
        WeekView.prototype.GetWeek = function (start, end) {
            var _this = this;
            return this.app
                .getService("local")
                .getEvents(start, end)
                .then(function (evs) {
                if (_this.Compact) {
                    return { start: start, end: end, all: evs };
                }
                var multi = [], single = [];
                evs.forEach(function (ev) {
                    if (isMultiDay(ev)) {
                        multi.push(ev);
                    }
                    else {
                        single.push(ev);
                    }
                });
                return { start: start, end: end, multi: multi, single: single };
            });
        };
        WeekView.prototype.ScrollScale = function (v) {
            var _this = this;
            if (v.id === "0" && !v.date) {
                setTimeout(function () {
                    var y = (new Date().getHours() + 2) * 40;
                    _this.$$("scroll").scrollTo(0, y);
                }, 100);
            }
        };
        return WeekView;
    }(JetView));

<<<<<<< HEAD
=======
    var YearCalendarView = (function (_super) {
        __extends(YearCalendarView, _super);
        function YearCalendarView(app, config) {
            var _this = _super.call(this, app, config) || this;
            _this._month = config.month;
            return _this;
        }
        YearCalendarView.prototype.config = function () {
            var _this = this;
            this.DayEvents = {};
            return {
                view: "calendar",
                localId: "calendar",
                events: function (day) { return _this.MarkEvent(day); },
                icons: false,
                navigation: false,
                calendarHeader: "%F",
                skipEmptyWeeks: true,
                borderless: true,
                onClick: {
                    webix_cal_day_with_event: function (e) { return _this.ShowEvents(e); },
                    webix_cal_month: function () { return _this.ShowMonth(); },
                },
                onDblClick: {
                    webix_cal_day: function (e) { return _this.ShowNew(e); },
                },
                on: {
                    onChange: function (date, mode) { return mode === "user" && _this.SetStateDate(date); },
                },
            };
        };
        YearCalendarView.prototype.init = function () {
            var _this = this;
            this.Data = this.app.getService("local");
            this.Calendar = this.getRoot();
            this.Events = new webix.DataCollection({});
            var state = (this.State = this.app.getState());
            this.on(state.$changes, "date", function (date) { return _this.ManageDateChange(date); });
            this.on(state.$changes, "active", ignoreInitial(function () { return _this.RefreshData(_this.GetMonthStart(state.date)); }));
            this.on(this.app, "events:refresh", function () {
                return _this.RefreshData(_this.GetMonthStart(state.date));
            });
            var events = this.app.getService("local").events(true);
            this.on(events.data, "onStoreUpdated", function (_i, _o, mode) { return mode && _this.RefreshData(_this.GetMonthStart(state.date)); });
            this.Popup = this.ui(new (this.app.dynamic(MoreWindowView))(this.app, {
                events: this.Events,
                drag: false,
            }));
        };
        YearCalendarView.prototype.SetStateDate = function (date) {
            this.State.date = webix.Date.dayStart(date);
        };
        YearCalendarView.prototype.ManageDateChange = function (date) {
            if (!this._date || this._date.getFullYear() != date.getFullYear()) {
                var monthStart = (this.MonthStart = this.GetMonthStart(date));
                this.Calendar.showCalendar(monthStart);
                this.RefreshData(monthStart);
            }
            if (this._month === date.getMonth())
                this.Calendar.setValue(date);
            else if (this.Calendar.getValue())
                this.Calendar.setValue();
            this._date = date;
        };
        YearCalendarView.prototype.GetMonthStart = function (date) {
            return new Date(date.getFullYear(), this._month, 1);
        };
        YearCalendarView.prototype.RefreshData = function (monthStart) {
            var _this = this;
            this.DayEvents = {};
            var monthEnd = webix.Date.add(monthStart, 1, "month", true);
            this.Data.getEvents(monthStart, monthEnd).then(function (data) {
                _this.Events.clearAll();
                _this.Events.parse(data);
                var _loop_1 = function () {
                    var next = webix.Date.add(monthStart, 1, "day", true);
                    data.forEach(function (obj) {
                        if ((obj.all_day
                            ? obj.end_date >= monthStart
                            : obj.end_date > monthStart) &&
                            obj.start_date < next) {
                            var dateKey = monthStart.valueOf();
                            if (!_this.DayEvents[dateKey])
                                _this.DayEvents[dateKey] = [];
                            _this.DayEvents[dateKey].push(obj.id);
                        }
                    });
                    monthStart = next;
                };
                while (monthStart < monthEnd) {
                    _loop_1();
                }
                _this.Calendar.refresh();
            });
        };
        YearCalendarView.prototype.MarkEvent = function (day) {
            var css = webix.Date.isHoliday(day) || "";
            if (this.DayEvents[day.valueOf()])
                css += " webix_cal_day_with_event";
            return css;
        };
        YearCalendarView.prototype.GetDay = function (e) {
            var day = e.target.innerHTML;
            if (day)
                return new Date(this.MonthStart).setDate(day * 1);
            return null;
        };
        YearCalendarView.prototype.ShowEvents = function (e) {
            var date = this.GetDay(e);
            if (date) {
                var data = this.DayEvents[date];
                this.Popup.ShowWindow(date, e.target.parentNode, data || []);
            }
        };
        YearCalendarView.prototype.ShowNew = function (e) {
            var state = this.State;
            if (!state.readonly && !state.clipboard) {
                var date = this.GetDay(e);
                if (date) {
                    state.mode = "day";
                    state.selected = { id: "0", date: date };
                }
            }
        };
        YearCalendarView.prototype.ShowMonth = function () {
            this.State.$batch({
                mode: "month",
                date: this.MonthStart,
            });
        };
        return YearCalendarView;
    }(JetView));

    var YearView = (function (_super) {
        __extends(YearView, _super);
        function YearView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        YearView.prototype.config = function () {
            return {
                view: "scrollview",
                body: {
                    padding: 20,
                    view: "flexlayout",
                    css: "webix_scheduler_year",
                    cols: this.GetCalendars(),
                },
            };
        };
        YearView.prototype.GetCalendars = function () {
            var calendars = [];
            for (var i = 0; i < 12; i++) {
                calendars.push(new (this.app.dynamic(YearCalendarView))(this.app, { month: i }));
            }
            return calendars;
        };
        return YearView;
    }(JetView));

>>>>>>> 6388b01 (New widget Scheduler)
    var views = { JetView: JetView };
    views["bars/add"] = AddView;
    views["bars/date"] = DateView;
    views["bars"] = TopBarView;
    views["bars/nav"] = NavBarView;
    views["bars/navpopup"] = NavPopupView;
    views["event/actionmenu"] = EventActionMenu;
    views["event/form"] = EventFormView;
    views["event/formpopup"] = FormPopup;
    views["event/info"] = EventView;
    views["event/recurringform"] = RecurringFormView;
    views["main"] = MainView;
    views["modes/agenda"] = AgendaView;
    views["modes/common/actionpopup"] = EventActionPopup;
    views["modes/common/hourscale"] = HourscaleView;
    views["modes/common/multimore"] = MultiMoreView;
    views["modes/common/unitlist"] = UnitListView;
    views["modes/day/events"] = DayEventsView;
    views["modes/day"] = DayView;
    views["modes/day/multiday"] = MultidayEventList;
    views["modes/month/compact"] = CalendarView;
    views["modes/month/events"] = MonthEventsView;
    views["modes/month/header"] = MonthHeaderView;
    views["modes/month"] = MonthView;
    views["modes/month/list"] = MonthListView;
    views["modes/month/more"] = MoreWindowView;
<<<<<<< HEAD
=======
    views["modes/timeline/bar"] = BarView;
    views["modes/timeline/chart"] = ChartView;
    views["modes/timeline"] = TimelineView;
    views["modes/timeline/more"] = MoreView;
    views["modes/timeline/scale"] = ScalesView;
    views["modes/units/events"] = UnitEventsView;
    views["modes/units/header"] = UnitsHeaderView;
    views["modes/units"] = UnitsView;
    views["modes/units/multiday"] = UnitMultidayView;
    views["modes/units/multidaylist"] = UnitMultidayList;
>>>>>>> 6388b01 (New widget Scheduler)
    views["modes/week/compact"] = WeekEventsView;
    views["modes/week/header"] = WeekHeaderView;
    views["modes/week"] = WeekView;
    views["modes/week/multiday"] = MultiDayEventsView;
<<<<<<< HEAD
=======
    views["modes/year/calendar"] = YearCalendarView;
    views["modes/year"] = YearView;
>>>>>>> 6388b01 (New widget Scheduler)
    views["side/editor"] = SidePopupView;
    views["side"] = SideView;
    views["side/popup"] = SidePopupView$1;

    var en = {
        Week: "Week",
        Day: "Day",
        Month: "Month",
<<<<<<< HEAD
        Agenda: "Agenda",
=======
        Year: "Year",
        Agenda: "Agenda",
        Units: "Units",
        Timeline: "Timeline",
>>>>>>> 6388b01 (New widget Scheduler)
        Today: "Today",
        Create: "Create",
        Next: "Next",
        Previous: "Previous",
        "Next day": "Next day",
        "Previous day": "Previous day",
        "Next week": "Next week",
        "Previous week": "Previous week",
        "Next month": "Next month",
        "Previous month": "Previous month",
        "Add calendar": "Add calendar",
        "Do you really want to remove this calendar?": "Do you really want to remove this calendar?",
        "Edit calendar": "Edit calendar",
        Delete: "Delete",
        Save: "Save",
        Title: "Title",
        Color: "Color",
        Active: "Active",
        Settings: "Settings",
        "(no title)": "(no title)",
        "Inactive calendar": "Inactive calendar",
        "No Events": "No Events",
        "All Day": "All Day",
        more: "more",
        "Expand all-day events": "Expand all-day events",
        "Collapse all-day events": "Collapse all-day events",
        "The event will be deleted permanently, are you sure?": "The event will be deleted permanently, are you sure?",
        Done: "Done",
        "Delete event": "Delete event",
        Close: "Close",
        Edit: "Edit",
        "(No title)": "(No title)",
        Event: "Event",
        Start: "Start",
        End: "End",
        Calendar: "Calendar",
        Notes: "Notes",
        from: "from",
        to: "to",
<<<<<<< HEAD
        labelAllday: "All day",
        labelTime: "Time",
        "Edit event": "Edit event",
=======
        "Edit event": "Edit event",
        "Assigned to units": "Assigned to units",
        "No units": "No units",
        "Unknown unit": "Unknown unit",
>>>>>>> 6388b01 (New widget Scheduler)
        never: "never",
        none: "none",
        daily: "daily",
        day: "day",
        days: "days",
        every: "Every",
        weekly: "weekly",
        week: "week",
        weeks: "weeks",
        each: "Every",
        monthly: "monthly",
        month: "month",
        months: "months",
        yearly: "yearly",
        year: "year",
        years: "years",
        Repeat: "Repeat",
        "End repeat": "End repeat",
        "Repeats each": "Repeats each",
        till: "till",
        times: "times",
        "weekly, every": "weekly, every",
        "monthly, every": "monthly, every",
        "yearly, every": "yearly, every",
        "every working day": "every working day",
        custom: "custom",
        Every: "Every",
        on: "on",
<<<<<<< HEAD
=======
        of: "of",
        "day of year": "day of year",
>>>>>>> 6388b01 (New widget Scheduler)
        "after several occurrences": "after several occurrences",
        date: "date",
        "week on": "week on",
        "Change recurring pattern": "Change recurring pattern",
        "Save changes?": "Save changes?",
        "All events": "All events",
        "This event": "This event",
        "This event and the following": "This event and the following",
        Cancel: "Cancel",
        Apply: "Apply",
        "Edit recurring event": "Edit recurring event",
<<<<<<< HEAD
=======
        "Timeline scale": "Timeline scale",
        Section: "Section",
        "Show more": "Show more",
        "Copy of": "Copy of",
        "Copy event": "Copy event",
>>>>>>> 6388b01 (New widget Scheduler)
    };

    var LocalData = (function () {
        function LocalData(app) {
            this.app = app;
            this.store = this.createEvents();
            this.events_ready = null;
            if (app.config.calendars !== false) {
                this.cals = this.createCalendars();
                this.cals_ready = null;
            }
<<<<<<< HEAD
=======
            if (app.config.units !== false) {
                this.unitsCache = this.createUnits();
                this.units_ready = null;
            }
            if (app.config.timeline) {
                this._sections = this.createSections();
                this.sections_ready = null;
            }
>>>>>>> 6388b01 (New widget Scheduler)
            var utc = app.config.serverUTC;
            this.strToDate = webix.Date.strToDate(webix.i18n.parseFormat, utc);
            this.dateToStr = webix.Date.dateToStr(webix.i18n.parseFormat, utc);
            this.dateToLocalStr = webix.Date.dateToStr(webix.i18n.parseFormat);
            this.loaded_ranges = {};
        }
        LocalData.prototype.createEvents = function () {
            var _this = this;
<<<<<<< HEAD
            return new webix.DataCollection({
=======
            var c = new webix.DataCollection({
>>>>>>> 6388b01 (New widget Scheduler)
                scheme: {
                    $change: function (data) {
                        if (typeof data.start_date === "string")
                            data.start_date = _this.strToDate(data.start_date);
                        if (typeof data.end_date === "string")
                            data.end_date = _this.strToDate(data.end_date);
                        if (_this.app.config.recurring) {
                            data.$recurring = data.recurring ? parse$1(data.recurring) : null;
<<<<<<< HEAD
=======
                            if (data.$recurring)
                                checkPattern(data);
>>>>>>> 6388b01 (New widget Scheduler)
                            if (typeof data.origin_id === "string" && !isNaN(data.origin_id)) {
                                data.origin_id *= 1;
                            }
                        }
                        if (typeof data.all_day === "string")
                            data.all_day *= 1;
                        _this.getColor(data, _this.cals && _this.cals.getItem(data.calendar));
                    },
                    $serialize: function (data) { return _this.eventOut(data); },
                    $export: function (data) { return _this.eventOut(data); },
                },
            });
<<<<<<< HEAD
=======
            return c;
>>>>>>> 6388b01 (New widget Scheduler)
        };
        LocalData.prototype.events = function (sync, force) {
            var _this = this;
            var store = this.store;
            if (sync)
                return store;
            return this.calendars().then(function () {
                if (_this.app.config.dynamic) {
                    if (!_this.events_ready)
                        _this.events_ready = webix.promise.resolve(_this.store);
                }
                else if (!_this.events_ready || force) {
                    _this.events_ready = _this.app
                        .getService("backend")
                        .events()
                        .then(function (data) {
                        store.clearAll();
                        store.parse(data);
                        return store;
                    });
                }
                return _this.events_ready;
            });
        };
        LocalData.prototype.getEvents = function (start, end) {
            var _this = this;
            var mode = this.app.config.dynamic;
            var evs;
            if (mode) {
                var params = this.getParams(mode);
                if (params.then) {
                    evs = params.then(function () {
                        return _this.getLocal(start, end);
                    });
                }
                else if (params === true) {
                    evs = this.getLocal(start, end);
                }
                else {
                    evs = this.loaded_ranges[params.from] = this.getDynamic(params).then(function () {
                        return _this.getLocal(start, end);
                    });
                }
            }
            else {
                evs = this.getLocal(start, end);
            }
            return evs;
        };
        LocalData.prototype.getLocal = function (start, end) {
            var _this = this;
            return this.events().then(function (store) {
                var config = _this.app.config;
                var active = _this.app.getState().active;
                var evs = [];
<<<<<<< HEAD
=======
                var now = new Date();
                var dimPastEvents = _this.app.config.dimPastEvents;
>>>>>>> 6388b01 (New widget Scheduler)
                store.data.each(function (ev) {
                    if ((!config.calendars || findCalendar(active, ev.calendar)) &&
                        ev.start_date < end &&
                        (ev.end_date > start ||
                            (ev.end_date >= start && ev.all_day) ||
                            (ev.$recurring &&
                                (!ev.$recurring.UNTIL || ev.$recurring.UNTIL > start)))) {
                        if (_this.app.config.recurring && ev.recurring) {
<<<<<<< HEAD
                            evs = evs.concat(explodeEvent(start, end, ev));
                        }
                        else {
                            delete ev.recurring;
=======
                            evs = evs.concat(explodeEvent(start, end, ev).map(function (e) {
                                if (dimPastEvents)
                                    e.$past = _this.isPast(e, now);
                                return e;
                            }));
                        }
                        else {
                            delete ev.recurring;
                            if (dimPastEvents)
                                ev.$past = _this.isPast(ev, now);
>>>>>>> 6388b01 (New widget Scheduler)
                            evs.push(ev);
                        }
                    }
                    ev.start_date = _this.roundTime(ev.start_date);
                    ev.end_date = _this.roundTime(ev.end_date);
                });
                evs.sort(function (a, b) {
<<<<<<< HEAD
                    a = a.start_date;
                    b = b.start_date;
                    return a > b ? 1 : a < b ? -1 : 0;
=======
                    return a.start_date - b.start_date || a.end_date - b.end_date;
>>>>>>> 6388b01 (New widget Scheduler)
                });
                return evs;
            });
        };
<<<<<<< HEAD
=======
        LocalData.prototype.isPast = function (ev, now) {
            if (ev.all_day)
                return ev.end_date < webix.Date.dayStart(now);
            return ev.end_date < now;
        };
>>>>>>> 6388b01 (New widget Scheduler)
        LocalData.prototype.getDynamic = function (params) {
            var _this = this;
            return this.app
                .getService("backend")
                .events(params)
                .then(function (data) {
                _this.store.parse(data);
                _this.loaded_ranges[params.from] = true;
                return data;
            });
        };
        LocalData.prototype.getParams = function (mode) {
            var state = this.app.getState();
            var format = webix.i18n.parseFormatStr;
            var from = webix.Date[mode + "Start"](state.date);
<<<<<<< HEAD
=======
            var to = webix.Date.add(from, 1, mode, true);
            if ((mode === "month" || mode === "year") &&
                (state.mode === "week" || state.mode === "month")) {
                if (from.getDay())
                    from = webix.Date.weekStart(from);
                if (to.getDay())
                    to = webix.Date.add(webix.Date.weekStart(to), 1, "week");
            }
>>>>>>> 6388b01 (New widget Scheduler)
            var fromStr = format(from);
            var res;
            if (!this.loaded_ranges[fromStr]) {
                res = {
                    from: fromStr,
<<<<<<< HEAD
                    to: format(webix.Date.add(from, 1, mode, true)),
=======
                    to: format(to),
>>>>>>> 6388b01 (New widget Scheduler)
                };
            }
            else
                res = this.loaded_ranges[fromStr];
            return res;
        };
        LocalData.prototype.createCalendars = function () {
            var _this = this;
            return new webix.DataCollection({
                scheme: {
                    $sort: {
                        dir: "desc",
                        by: "active",
                        as: sortCalendars,
                    },
                },
                on: {
                    onAfterDelete: function () { return _this.setActive(); },
                    onAfterAdd: function () { return _this.setActive(); },
                    "data->onDataUpdate": function (id, data, old) {
                        if (old) {
                            if (data.color !== old.color) {
                                _this.store.data.each(function (obj) {
                                    if (obj.calendar == id)
                                        _this.getColor(obj, data);
                                });
                                _this.app.callEvent("events:refresh");
                            }
                            if (data.active !== old.active) {
                                _this.setActive();
                                setTimeout(function () {
                                    _this.cals.sort("#active#", "desc", sortCalendars);
                                }, 400);
                            }
                        }
                    },
                },
            });
        };
        LocalData.prototype.calendars = function (sync, force) {
            var _this = this;
            if (this.app.config.calendars == false) {
                if (sync)
                    return false;
                return webix.promise.resolve();
            }
            var cals = this.cals;
            if (sync)
                return cals;
            if (this.cals_ready && !force)
                return this.cals_ready;
            this.cals_ready = this.app
                .getService("backend")
                .calendars()
                .then(function (data) {
                cals.clearAll();
                cals.parse(data);
                _this.setActive();
                return cals;
            });
            return this.cals_ready;
        };
<<<<<<< HEAD
        LocalData.prototype.eventOut = function (data, save) {
            data = webix.copy(data);
=======
        LocalData.prototype.eventOut = function (data, save, inner) {
            data = webix.copy(data);
            if (!inner && data.recurring)
                checkPattern(data);
>>>>>>> 6388b01 (New widget Scheduler)
            var format = save ? this.dateToStr : this.dateToLocalStr;
            if (data.start_date)
                data.start_date = format(data.start_date);
            if (data.end_date)
                data.end_date = format(data.end_date);
            if (!save) {
                delete data.$recurring;
                delete data.$textColor;
                delete data.$color;
<<<<<<< HEAD
=======
                delete data.$past;
>>>>>>> 6388b01 (New widget Scheduler)
            }
            return data;
        };
        LocalData.prototype.setActive = function () {
            var active = [];
            this.cals.data.each(function (d) {
                if (d.active * 1)
                    active.push(d.id);
            });
            this.app.getState().active = active;
        };
        LocalData.prototype.getColor = function (data, calendar) {
            data.$color = calendar ? calendar.color : data.color || "#01C2A5";
            data.$textColor = getContrastingColor(data.color || data.$color);
        };
        LocalData.prototype.roundTime = function (date) {
            var res = webix.Date.copy(date);
            res.setMinutes(Math.round(res.getMinutes() / 5) * 5);
            return res;
        };
        LocalData.prototype.isLastPart = function (event) {
            var hasParts = this.store.find(function (e) {
                return event.origin_id == e.origin_id &&
                    (event.$id || event.id) != e.id &&
                    event.start_date < e.start_date;
            }, true);
            return !hasParts;
        };
<<<<<<< HEAD
        return LocalData;
    }());
    function getContrastingColor(color) {
        var rgb = webix.color.toRgb(color);
        var brightness = Math.round((rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000);
        return brightness > 180 ? "#475466" : "#ffffff";
    }
=======
        LocalData.prototype.createUnits = function () {
            return new webix.DataCollection({
                data: [],
            });
        };
        LocalData.prototype.units = function (sync, force) {
            if (this.app.config.units == false) {
                if (sync)
                    return false;
                return webix.promise.resolve();
            }
            var unitsCache = this.unitsCache;
            if (sync)
                return unitsCache;
            if (this.units_ready && !force)
                return this.units_ready;
            this.units_ready = this.app
                .getService("backend")
                .units()
                .then(function (data) {
                unitsCache.clearAll();
                unitsCache.parse(data);
                return unitsCache;
            });
            return this.units_ready;
        };
        LocalData.prototype.createSections = function () {
            return new webix.DataCollection({});
        };
        LocalData.prototype.sections = function (sync, force) {
            var sections = this._sections;
            if (sync)
                return sections;
            if (this.sections_ready && !force)
                return this.sections_ready;
            this.sections_ready = this.app
                .getService("backend")
                .sections()
                .then(function (data) {
                sections.clearAll();
                sections.parse(data);
                return sections;
            });
            return this.sections_ready;
        };
        LocalData.prototype.clearAll = function () {
            this.loaded_ranges = {};
            this.store.clearAll();
            this.events_ready = null;
            if (this.app.config.calendars !== false) {
                this.cals.clearAll();
                this.cals_ready = null;
            }
            if (this.app.config.units !== false) {
                this.unitsCache.clearAll();
                this.units_ready = null;
            }
            if (this.app.config.timeline !== false) {
                this._sections.clearAll();
                this.sections_ready = null;
            }
        };
        return LocalData;
    }());
>>>>>>> 6388b01 (New widget Scheduler)
    function findCalendar(arr, c) {
        for (var i = 0; i < arr.length; ++i) {
            if (arr[i] == c)
                return true;
        }
        return false;
    }
<<<<<<< HEAD
    function sortCalendars(a, b) {
        return a * 1 > b * 1 ? 1 : -1;
=======
    function sortCalendars(a, b, prop) {
        return a[prop] * 1 > b[prop] * 1 ? 1 : -1;
>>>>>>> 6388b01 (New widget Scheduler)
    }

    var Operations = (function () {
        function Operations(app) {
            this.app = app;
            this.Back = app.getService("backend");
            var local = (this.Local = app.getService("local"));
            this.Events = local.events(true);
            this.Cals = local.calendars(true);
            this.State = app.getState();
        }
<<<<<<< HEAD
        Operations.prototype.addEvent = function (obj, temp) {
            var _this = this;
            var tosave = this.Local.eventOut(obj, true);
=======
        Operations.prototype.addEvent = function (obj, inner, temp) {
            var _this = this;
            var tosave = this.Local.eventOut(obj, true, inner);
>>>>>>> 6388b01 (New widget Scheduler)
            return this.Back.addEvent(tosave).then(function (res) {
                if (temp)
                    _this.Events.remove(temp);
                obj.id = res.id;
                return _this.Events.add(obj);
            });
        };
<<<<<<< HEAD
        Operations.prototype.updateEvent = function (id, obj, mode, date) {
            var _this = this;
            var tosave = this.Local.eventOut(obj, true);
=======
        Operations.prototype.updateEvent = function (id, obj, mode, date, inner) {
            var _this = this;
            var tosave = this.Local.eventOut(obj, true, inner);
>>>>>>> 6388b01 (New widget Scheduler)
            return this.Back.updateEvent(id, tosave, mode, date).then(function () {
                _this.Events.updateItem(id, obj);
                if (mode === "all") {
                    var parts = _this.Events.find(function (e) { return e.origin_id == id; }).map(function (e) { return e.id; });
                    _this.Events.remove(parts);
                }
                else if (mode === "next" && date) {
                    var cev = _this.Events.getItem(id);
                    if (cev.origin_id)
                        id = cev.origin_id;
                    var parts = _this.Events.find(function (e) { return e.origin_id == id && e.start_date >= date; }).map(function (e) { return e.id; });
                    _this.Events.remove(parts);
                }
            });
        };
<<<<<<< HEAD
        Operations.prototype.removeEvent = function (mode, obj, date_id) {
=======
        Operations.prototype.removeEvent = function (obj, mode, date_id) {
>>>>>>> 6388b01 (New widget Scheduler)
            var _this = this;
            var id = this.State.selected ? this.State.selected.id : obj.$id || obj.id;
            var isFirst = mode ? isFirstOccurrence(date_id, obj.start_date) : false;
            if (mode === "next" && isFirst) {
                mode = correctMode.call(this, obj, mode);
            }
            if (!mode ||
                mode === "all" ||
                (mode === "this" && !date_id) ||
                (mode === "next" && obj.origin_id && isFirst)) {
                if (mode === "all" && obj.origin_id)
                    id = obj.origin_id;
                this.Back.removeEvent(id).then(function () {
                    _this.Events.remove(id);
                    var parts = _this.Events.find(function (e) { return e.origin_id == id; }).map(function (e) { return e.id; });
                    _this.Events.remove(parts);
                });
            }
            else {
                if (mode === "this" || mode === "next") {
                    if (!date_id) {
                        id = obj.origin_id;
                        obj = this.Events.getItem(id);
                    }
                    var date = webix.Date.dayStart(date_id ? new Date(date_id.split("_")[0] * 1) : obj.start_date);
                    var recurring = mode === "this" ? cutOccurrence(date, obj) : clipSequence(date, obj);
<<<<<<< HEAD
                    this.updateEvent(id, { recurring: recurring }, mode, date);
=======
                    this.updateEvent(id, { recurring: recurring }, mode, date, true);
>>>>>>> 6388b01 (New widget Scheduler)
                }
            }
        };
        Operations.prototype.addCalendar = function (obj) {
            var _this = this;
            if (!obj)
                obj = { text: "", color: "#997CEB", active: 1 };
            return this.Back.addCalendar(obj).then(function (res) {
                obj.id = res.id;
                _this.Cals.add(obj, 0);
                return obj.id;
            });
        };
        Operations.prototype.updateCalendar = function (id, obj) {
            var _this = this;
            if (!this.app.getState().readonly)
                return this.Back.updateCalendar(id, obj).then(function () {
                    return _this.Cals.updateItem(id, obj);
                });
            else
                return webix.promise.resolve(this.Cals.updateItem(id, obj));
        };
        Operations.prototype.removeCalendar = function (id) {
            var _this = this;
            this.Back.removeCalendar(id).then(function () {
                _this.Cals.remove(id);
            });
        };
        return Operations;
    }());

    var Backend = (function () {
        function Backend(app, url) {
            this.app = app;
            this._url = url;
        }
        Backend.prototype.url = function (path) {
            return this._url + path;
        };
        Backend.prototype.events = function (params) {
            return webix.ajax(this.url("events"), params).then(function (res) { return res.json(); });
        };
        Backend.prototype.addEvent = function (obj) {
            return webix
                .ajax()
                .post(this.url("events"), obj)
                .then(function (res) { return res.json(); });
        };
        Backend.prototype.updateEvent = function (id, obj, mode, date) {
            var params = obj;
            if (mode)
                params.recurring_update_mode = mode;
            if (date)
                params.recurring_update_date = date;
            return webix
                .ajax()
                .put(this.url("events/" + id), params)
                .then(function (res) { return res.json(); });
        };
        Backend.prototype.removeEvent = function (id) {
            return webix
                .ajax()
                .del(this.url("events/" + id))
                .then(function (res) { return res.json(); });
        };
        Backend.prototype.calendars = function () {
            return webix.ajax(this.url("calendars")).then(function (res) { return res.json(); });
        };
        Backend.prototype.addCalendar = function (obj) {
            return webix
                .ajax()
                .post(this.url("calendars"), obj)
                .then(function (res) { return res.json(); });
        };
        Backend.prototype.updateCalendar = function (id, obj) {
            return webix
                .ajax()
                .put(this.url("calendars/" + id), obj)
                .then(function (res) { return res.json(); });
        };
        Backend.prototype.removeCalendar = function (id) {
            return webix
                .ajax()
                .del(this.url("calendars/" + id))
                .then(function (res) { return res.json(); });
        };
<<<<<<< HEAD
=======
        Backend.prototype.units = function (params) {
            return webix
                .ajax()
                .get(this.url("units"), params)
                .then(function (res) { return res.json(); });
        };
        Backend.prototype.sections = function () {
            return webix.ajax(this.url("sections")).then(function (res) { return res.json(); });
        };
>>>>>>> 6388b01 (New widget Scheduler)
        return Backend;
    }());

    var App = (function (_super) {
        __extends(App, _super);
        function App(config) {
            var _this = this;
            var state = createState({
                mode: config.mode || "month",
<<<<<<< HEAD
                date: webix.Date.dayStart(config.date || new Date()),
                readonly: config.readonly || false,
                active: [],
                selected: null,
            });
            config = config || {};
            var defaults = webix.extend({
                router: EmptyRouter,
                version: "8.1.1",
=======
                date: webix.Date.datePart(config.date || new Date()),
                readonly: config.readonly || false,
                active: [],
                selected: null,
                timelineMode: config.timelineMode || "week",
            });
            config = config || {};
            var defaults = {
                router: EmptyRouter,
                version: "10.1.0",
>>>>>>> 6388b01 (New widget Scheduler)
                debug: true,
                start: "/main",
                params: { state: state, forceCompact: config.compact },
                compactWidth: 780,
<<<<<<< HEAD
                recurring: typeof config.recurring != "undefined" ? config.recurring : true,
                calendars: typeof config.calendars != "undefined" ? config.calendars : true,
            }, config);
            _this = _super.call(this, __assign({}, defaults)) || this;
            _this.setService("backend", new (_this.dynamic(Backend))(_this, _this.config.url));
            _this.setService("local", new (_this.dynamic(LocalData))(_this, config));
            _this.setService("operations", new (_this.dynamic(Operations))(_this));
=======
                recurring: true,
                calendars: true,
                timeline: !!config.timeline,
                copypaste: true,
                dragCreate: true,
                dimPastEvents: false,
            };
            _this = _super.call(this, __assign(__assign({}, defaults), config)) || this;
            _this.setService("backend", new (_this.dynamic(Backend))(_this, _this.config.url));
            _this.setService("local", new (_this.dynamic(LocalData))(_this, config));
            _this.setService("operations", new (_this.dynamic(Operations))(_this));
            initJetWin(_this);
>>>>>>> 6388b01 (New widget Scheduler)
            _this.use(plugins.Locale, _this.config.locale || {
                lang: "en",
                webix: {
                    en: "en-US",
                },
            });
            return _this;
        }
        App.prototype.dynamic = function (obj) {
            return this.config.override ? this.config.override.get(obj) || obj : obj;
        };
        App.prototype.require = function (type, name) {
            if (type === "jet-views")
                return views[name];
            else if (type === "jet-locales")
                return locales[name];
            return null;
        };
        App.prototype.getState = function () {
            return this.config.params.state;
        };
        return App;
    }(JetApp));
    webix.protoUI({
        name: "scheduler",
        app: App,
        defaults: {
            borderless: true,
        },
        $init: function () {
<<<<<<< HEAD
=======
            var _this = this;
>>>>>>> 6388b01 (New widget Scheduler)
            this.name = "scheduler";
            var state = this.$app.getState();
            for (var key in state) {
                link(state, this.config, key);
            }
            state.$changes.attachEvent("date", function () {
            });
<<<<<<< HEAD
        },
        $exportView: function () {
=======
            this.$app.attachEvent("app:beforedrag", function (ctx, e) {
                return _this.callEvent("onBeforeEventDrag", [ctx, e]);
            });
            this.$app.attachEvent("app:beforedrop", function (ctx, e) {
                return _this.callEvent("onBeforeEventDrop", [ctx, e]);
            });
        },
        $exportView: function (options) {
            if (options.export_mode === "png" ||
                (options.export_mode === "pdf" && options.display === "image"))
                return this.$app.getRoot();
>>>>>>> 6388b01 (New widget Scheduler)
            return this.$app.getService("local").events(true);
        },
        getState: function () {
            return this.$app.getState();
        },
        getService: function (name) {
            return this.$app.getService(name);
        },
<<<<<<< HEAD
=======
        clearAll: function () {
            this.$app.getService("local").clearAll();
        },
>>>>>>> 6388b01 (New widget Scheduler)
    }, webix.ui.jetapp);
    var services = { Backend: Backend, LocalData: LocalData, Operations: Operations };
    var locales = { en: en };

    exports.App = App;
    exports.locales = locales;
    exports.services = services;
    exports.views = views;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
