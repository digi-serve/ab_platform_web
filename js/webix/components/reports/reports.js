/*
@license
Webix Reports v.8.1.1
This software is covered by Webix Commercial License.
Usage without proper license is prohibited.
(c) XB Software Ltd.
*/
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.reports = {}));
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
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
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
    function ignoreInitial(code) {
        var init = false;
        return function () {
            if (init)
                return code.apply(this, arguments);
            else
                init = true;
        };
    }
    var context = null;
    function withContext(value, code) {
        context = value;
        code();
        context = null;
    }
    function link(source, target, key) {
        Object.defineProperty(target, key, {
            get: function () { return source[key]; },
            set: function (value) { return (source[key] = value); },
        });
    }
    function debounce(handler, delay) {
        delay = delay || 200;
        var timer = null;
        var data = null;
        return function () {
            var _this = this;
            data = arguments;
            if (!timer) {
                timer = setTimeout(function () {
                    clearTimeout(timer);
                    timer = null;
                    handler.apply(_this, data);
                }, delay);
            }
        };
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

    var ChartView = (function (_super) {
        __extends(ChartView, _super);
        function ChartView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ChartView.prototype.config = function () {
            var page = {
                type: "wide",
                margin: 5,
                cols: [{}],
            };
            return page;
        };
        ChartView.prototype.init = function () {
            this.State = this.getParam("state", true);
            this.Charts = this.app.getService("charts");
            this.Local = this.app.getService("local");
        };
        ChartView.prototype.ready = function () {
            var _this = this;
            this.Host = this.getRoot();
            this.on(this.State.$changes, "module", function (mod) { return _this.Show(mod); });
        };
        ChartView.prototype.Show = function (mod) {
            var _this = this;
            var host = this.Host;
            if (mod && mod.type === "chart" && this.CheckColumns(mod.columns)) {
                var config_1 = this.GetChartConfig(mod);
                if (!config_1.view)
                    return;
                this.GetChartData(mod).then(function (_a) {
                    var data = _a[0], options = _a[1];
                    if (mod.meta.chart.seriesFrom == "rows")
                        data = _this.ConvertDataBySeries(data);
                    config_1.data = _this.FormatLabels(data.slice(0, _this.Charts.numLimit), options);
                    webix.ui([config_1], host);
                    _this.Chart = host.getChildViews()[0];
                });
            }
            else {
                webix.ui([{ template: " " }], host);
                this.Chart = null;
            }
        };
        ChartView.prototype.FormatLabels = function (data, options) {
            var labelColumn = this.State.module.meta.chart.labelColumn;
            var labelOptions = labelColumn && options.length
                ? options.find(function (op) { return op.field == labelColumn; })
                : null;
            if (labelOptions)
                data.forEach(function (item) {
                    var option = labelOptions.data.find(function (o) { return o.id == item[labelColumn]; });
                    item[labelColumn] = option ? option.value : item[labelColumn];
                });
            else {
                var field = (this.State.module.fields || this.State.module.columns).find(function (field) { return field.id == labelColumn; });
                if (field && field.type == "date") {
                    data.forEach(function (item) {
                        item[labelColumn] = webix.i18n.dateFormatStr(new Date(item[labelColumn]));
                    });
                }
            }
            return data;
        };
        ChartView.prototype.CheckColumns = function (columns) {
            var result = columns.length && columns.indexOf(webix.undefined) == -1;
            return result;
        };
        ChartView.prototype.GetChartConfig = function (mod) {
            var _this = this;
            var columns = mod.columns, meta = mod.meta;
            if (!columns || !meta.chart)
                return {};
            var _a = meta.chart, chartType = _a.chartType, labelColumn = _a.labelColumn, legendPosition = _a.legendPosition, series = _a.series, axises = _a.axises;
            if (!series)
                return {};
            var seriesConfig = [];
            series.forEach(function (s) {
                if (s.show !== false) {
                    var type = s.chartType || chartType;
                    seriesConfig.push(__assign(__assign({}, _this.ApplyTypeConfig(s, type)), { value: function (item) { return item[s.id]; } }));
                }
            });
            var config = {
                view: "chart",
                type: chartType,
                localId: "chart",
                series: seriesConfig,
                padding: {
                    left: 80,
                    right: 40,
                    top: 50,
                    bottom: 80,
                },
                on: {
                    onAfterRender: function () { return _this.CorrectLabels(); },
                },
                legend: this.GetLegendConfig(series, chartType, legendPosition),
            };
            if (axises) {
                config.xAxis = __assign({ template: function (item) {
                        return ("<div class='webix_rpt_chart_label'>" +
                            (item[labelColumn] || "") +
                            "</div>");
                    } }, axises.x);
                config.yAxis = __assign({}, axises.y);
                if (axises.y.logarithmic)
                    config.scale = "logarithmic";
                if (axises.x.verticalLabels)
                    config.css = "webix_rpt_vertical_chart_labels";
            }
            if (config.legendPosition == "right")
                config.padding.right = config.legend.width + 10;
            else {
                config.padding.bottom = 90;
            }
            return config;
        };
        ChartView.prototype.GetLegendConfig = function (series, type, legendPosition) {
            if (legendPosition == "none")
                return null;
            var values = [];
            var text = [];
            var itemTypes = this.Charts.itemSupport;
            series.forEach(function (s) {
                if (s.show !== false) {
                    values.push({
                        text: s.meta.name,
                        color: s.meta.color,
                        markerType: itemTypes.indexOf(series.chartType || type) != -1
                            ? "item"
                            : "square",
                    });
                    text.push(s.name);
                }
            });
            var config = {
                values: values,
                margin: 8,
            };
            if (legendPosition == "right") {
                config.width = webix.html.getTextSize(text).width + 30;
                config.valign = "middle";
                config.align = "right";
            }
            else {
                config.layout = "x";
                config.valign = "bottom";
                config.align = "center";
            }
            return config;
        };
        ChartView.prototype.GetChartData = function (mod) {
            return Promise.all([
                this.Local.getData(this.Local.getDataConfig(mod), this.State.mode == "edit"),
                this.Local.getOptions(mod.columns),
            ]);
        };
        ChartView.prototype.ApplyTypeConfig = function (series, type) {
            var meta = series.meta;
            if (this.Charts.itemSupport.indexOf(type) != -1) {
                return {
                    fill: meta.area ? meta.color : null,
                    alpha: meta.area ? 0.2 : 1,
                    item: {
                        type: meta.markerType,
                        radius: meta.markerType == "no" ? 0 : 3,
                        borderColor: meta.color,
                        color: meta.fillMarker ? meta.color : "#ffffff",
                    },
                    line: {
                        color: meta.color,
                        width: meta.area ? 1 : 2,
                    },
                    disableItems: meta.area ? true : false,
                };
            }
            else if (type == "area" || type == "splineArea")
                return {
                    border: true,
                    alpha: 0.3,
                    color: meta.color,
                };
            else
                return {
                    color: meta.color,
                };
        };
        ChartView.prototype.ConvertDataBySeries = function (data) {
            var _a = this.State.module.meta.chart, labelColumn = _a.labelColumn, baseColumn = _a.baseColumn, dataColumn = _a.dataColumn;
            if (!(labelColumn && baseColumn && dataColumn))
                return [];
            var arr = [];
            data.forEach(function (row) {
                var group = arr.find(function (aRow) { return aRow[labelColumn] == row[labelColumn]; });
                if (!group) {
                    group = {};
                    group[labelColumn] = row[labelColumn];
                }
                if (!group[row[baseColumn]])
                    group[row[baseColumn]] = row[dataColumn];
                arr.push(group);
            });
            return arr;
        };
        ChartView.prototype.CorrectLabels = function () {
            var chart = this.$$("chart");
            if (chart && !chart.config.offset) {
                var res = chart.$view.querySelector(".webix_axis_item_x");
                if (res)
                    res.className += " webix_rpt_chart_label0";
            }
        };
        return ChartView;
    }(JetView));

    function bind(obj, key, ctrl, view) {
        bindOut(obj, key, ctrl);
        return bindIn(obj, key, ctrl, view);
    }
    function bindIn(obj, key, ctrl, view) {
        var handler = function (v, o, k, meta) {
            if (k === "*") {
                var els = ctrl.elements;
                for (var subkey in els) {
                    if (typeof v[subkey] !== "undefined")
                        els[subkey].setValue(v[subkey]);
                }
            }
            else if (key === "*") {
                var el = ctrl.elements[k];
                if (el && el != meta)
                    el.setValue(v);
            }
            else if (meta != ctrl)
                ctrl.setValue(v);
        };
        return view
            ? view.on(obj.$changes, key, handler)
            : obj.$changes.attachEvent(key, handler);
    }
    function bindOut(obj, key, ctrl) {
        if (key === "*") {
            var els = ctrl.elements;
            for (var subkey in els) {
                if (typeof obj[subkey] !== "undefined")
                    bindOut(obj, subkey, els[subkey]);
            }
            return;
        }
        var trigger = function (newValue) {
            var oldValue = obj[key];
            if (newValue !== oldValue) {
                obj[key] = newValue;
            }
        };
        if (!ctrl.getList)
            ctrl.attachEvent("onTimedKeyPress", function () {
                var newValue = this.getValue();
                if (this.config.value !== newValue) {
                    this.config.value = newValue;
                    this.callEvent("onChange", [newValue]);
                }
            });
        ctrl.attachEvent("onChange", function () {
            var _this = this;
            withContext(this, function () {
                trigger(_this.getValue());
            });
        });
    }

    webix.protoUI({
        name: "input-list",
        getValue: function () {
            return this._value || [];
        },
        setValue: function (data) {
            this._value = data;
            this.clearAll();
            this.parse([].concat(data));
        },
    }, webix.ui.list);

    var removeRight = "<span style='float:right' class='webix_icon webix_rpt_action_remove rpi-delete'></span>";
    var sortAsc = "<span class='webix_icon rpi-sort-alphabetical-ascending'></span>";
    var sortDesc = "<span class='webix_icon rpi-sort-alphabetical-descending'></span>";
    var types = {
        table: "<span class='rpi-table'></span>",
        chart: "<span class='rpi-poll'></span>",
        heatmap: "<span class='rpi-chart-tree'></span>",
    };

    var CommonView = (function (_super) {
        __extends(CommonView, _super);
        function CommonView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        CommonView.prototype.config = function () {
            var _this = this;
            var _ = (this._ = this.app.getService("locale")._);
            var form = {
                view: "form",
                scroll: "auto",
                elementsConfig: {
                    labelWidth: 130,
                    labelPosition: "top",
                },
                elements: [
                    {
                        rows: [
                            { view: "label", label: _("Report name") },
                            {
                                view: "text",
                                name: "name",
                                localId: "name",
                            },
                        ],
                    },
                    {
                        rows: [
                            { view: "label", label: _("Description") },
                            {
                                view: "textarea",
                                labelPosition: "top",
                                height: 150,
                                name: "desc",
                            },
                        ],
                    },
                    {
                        rows: [
                            { view: "label", label: _("Data source") },
                            {
                                view: "combo",
                                name: "data",
                                options: [],
                            },
                        ],
                    },
                    {
                        view: "input-list",
                        name: "joins",
                        template: this.JoinListTemplate.bind(this),
                        data: [],
                        autoheight: true,
                        borderless: true,
                        onClick: {
                            webix_rpt_action_remove: function (ev, id) { return _this.RemoveJoin(id); },
                        },
                    },
                    {
                        view: "button",
                        localId: "add",
                        label: _("Join data"),
                        click: function () { return _this.ShowJoins(); },
                    },
                    {},
                    {
                        view: "button",
                        label: _("Delete report"),
                        localId: "delete",
                        inputWidth: 170,
                        align: "left",
                        css: "webix_rpt_delete",
                        click: function () { return _this.app.callEvent("onMenuAction", [null, "delete"]); },
                    },
                ],
            };
            return form;
        };
        CommonView.prototype.init = function () {
            var _this = this;
            var els = this.getRoot().elements;
            this.State = this.getParam("state", true);
            this.AppState = this.app.getParam("state");
            this.Local = this.app.getService("local");
            this.Models = this.Local.getModels(true);
            var keys = Object.keys(this.Models);
            var combo = els.data;
            combo.getList().parse(keys.map(function (a) {
                var m = _this.Models[a];
                return { id: m.id, value: m.name };
            }));
            bind(this.State, "*", this.getRoot(), this);
            this.on(this.State.$changes, "id", function (v) { return _this.ShowDeleteButton(v); });
            this.on(this.AppState.$changes, "toolbar", function (v) { return _this.ShowDeleteButton(v); });
            this.SourcesList = this.ui({
                view: "popup",
                body: {
                    view: "list",
                    autoheight: true,
                    type: {
                        template: this.JoinTemplate.bind(this),
                    },
                    click: function (id) {
                        var item = _this.SourcesList.getBody().getItem(id);
                        _this.AddJoin(item);
                        _this.SourcesList.hide();
                    },
                },
            });
        };
        CommonView.prototype.AddJoin = function (item) {
            var batch = this.Local.addJoin(item.tid, this.State);
            batch.joins = __spreadArrays(this.State.joins, [item]);
            this.State.$batch(batch);
        };
        CommonView.prototype.RemoveJoin = function (id) {
            var next = this.Local.cleanLinkedModels(id, this.State);
            if (!next.block)
                this.State.$batch(next);
            else {
                if (next.block.filter)
                    webix.alert(this._("Please delete the related query filter first"));
                if (next.block.group)
                    webix.alert(this._("Please delete the related group rule first"));
            }
        };
        CommonView.prototype.JoinTemplate = function (obj) {
            var s = this.Models[obj.sid];
            var t = this.Models[obj.tid];
            var f = obj.sf || obj.tf;
            var n = (obj.sf ? s : t).data.find(function (a) { return a.id === f; }).name;
            return t.name + " <span class='webix_rpt_sources_path'>" + s.name + (obj.sf ? " (" + n + ")" : "") + " -> " + t.name + (obj.tf ? " (" + n + ")" : "") + "</span>";
        };
        CommonView.prototype.JoinListTemplate = function (obj) {
            return removeRight + this.JoinTemplate(obj);
        };
        CommonView.prototype.ShowJoins = function () {
            var data = this.Local.getLinkedModels([this.State.data].concat(this.State.joins.map(function (a) { return a.tid; })), true);
            var list = this.SourcesList.getBody();
            list.clearAll();
            list.parse(data);
            this.SourcesList.show(this.$$("add").$view);
        };
        CommonView.prototype.ShowDeleteButton = function () {
            if (this.State.id && this.AppState.toolbar)
                this.$$("delete").show();
            else
                this.$$("delete").hide();
        };
        return CommonView;
    }(JetView));

    function prompt(config) {
        var result = new webix.promise.defer();
        var p = webix.ui({
            view: "popup",
            head: false,
            position: config.master ? "" : "center",
            body: {
                view: "form",
                padding: { top: 5, left: 20, right: 20, bottom: 20 },
                rows: [
                    { view: "label", label: config.text },
                    {
                        margin: 10,
                        cols: [
                            {
                                view: "text",
                                name: "name",
                                value: config.value,
                                width: 230,
                                css: "fm-prompt-input",
                            },
                            {
                                view: "button",
                                value: config.button,
                                width: 100,
                                hotkey: "enter",
                                click: function () {
                                    var popup = this.getTopParentView();
                                    var newname = popup.getBody().getValues().name;
                                    result.resolve(newname);
                                    popup.close();
                                },
                            },
                        ],
                    },
                ],
            },
            on: {
                onShow: function () {
                    var input = this.getBody().elements.name.getInputNode();
                    input.focus();
                    if (config.selectMask)
                        config.selectMask(input);
                    else
                        input.select();
                },
                onHide: function () {
                    result.reject("prompt cancelled");
                    this.destructor();
                },
            },
        });
        var position = config.master ? { x: 50 } : null;
        webix.delay(function () { return p.show(config.master, position); });
        return result;
    }

    webix.protoUI({
        name: "query-select",
        $cssName: "richselect",
        $init: function () {
            webix.extend(this.on_click, {
                webix_rpt_qselect_icon: function () {
                    this.callEvent("onClearClick", []);
                    return false;
                },
            });
        },
    }, webix.ui.richselect);

    (function (global, factory) {
        typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
            typeof define === 'function' && define.amd ? define(['exports'], factory) :
                (global = global || self, factory(global.query = {}));
    }(undefined, (function (exports) {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b)
                    if (b.hasOwnProperty(p))
                        d[p] = b[p]; };
            return extendStatics(d, b);
        };
        function __extends(d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        }
        var __assign = function () {
            __assign = Object.assign || function __assign(t) {
                for (var s, i = 1, n = arguments.length; i < n; i++) {
                    s = arguments[i];
                    for (var p in s)
                        if (Object.prototype.hasOwnProperty.call(s, p))
                            t[p] = s[p];
                }
                return t;
            };
            return __assign.apply(this, arguments);
        };
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
                    return root_1.queryView((function (obj) {
                        return (obj.config.id === id || obj.config.localId === id) &&
                            (obj.$scope === root_1.$scope);
                    }), "self");
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
                var cb = function (a) {
                    return setTimeout(function () {
                        _this.show(a).catch(function (e) {
                            if (!(e instanceof NavigationBlocked))
                                throw e;
                        });
                    }, 1);
                };
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
                getLang: getLang, setLang: setLang, setLangData: setLangData, _: null, polyglot: null
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
        function ignoreInitial(code) {
            var init = false;
            return function () {
                if (init)
                    return code.apply(this, arguments);
                else
                    init = true;
            };
        }
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
            for (var key2 in data) {
                if (data.hasOwnProperty(key2)) {
                    var test = data[key2];
                    if (config.nested && typeof test === "object" && test) {
                        out[key2] = createState(test, config);
                    }
                    else {
                        reactive(out, test, key2, notify);
                    }
                }
            }
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
        var ActionsPopupView = (function (_super) {
            __extends(ActionsPopupView, _super);
            function ActionsPopupView() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ActionsPopupView.prototype.config = function () {
                var _this = this;
                var _ = this.app.getService("locale")._;
                return {
                    view: "popup",
                    point: false,
                    body: {
                        view: "list",
                        yCount: 4,
                        width: 120,
                        borderless: true,
                        data: [
                            { id: "edit", value: _("Edit") },
                            { id: "add-filter", value: _("Add Filter") },
                            { id: "add-group", value: _("Add Group") },
                            { id: "delete", value: _("Delete") },
                        ],
                        click: function (id) {
                            _this.app.callEvent("action", [id, _this.Item]);
                            _this.Hide();
                        },
                    },
                };
            };
            ActionsPopupView.prototype.Hide = function () {
                this.getRoot().hide();
            };
            ActionsPopupView.prototype.Show = function (node, item) {
                this.Item = item;
                var pos = webix.html.offset(node);
                this.getRoot().show({
                    x: pos.x + pos.width + webix.skin.$active.dataPadding,
                    y: pos.y - 10,
                });
            };
            return ActionsPopupView;
        }(JetView));
        var menuRight = "<span style='float:right' class='webix_icon action-menu wxi-dots'></span>";
        var menuClose = "<span style='float:right' class='webix_icon action-close wxi-close'></span>";
        var BaseView = (function (_super) {
            __extends(BaseView, _super);
            function BaseView() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            BaseView.prototype.GetButton = function () {
                var _this = this;
                var _ = this.app.getService("locale")._;
                var button = {
                    view: "button",
                    value: _("Add filter"),
                    localId: "button",
                    css: "webix_primary",
                    click: function () { return _this.Add(null, null); },
                };
                return button;
            };
            BaseView.prototype.GetList = function () {
                var _this = this;
                var _ = this.app.getService("locale")._;
                var simple = this.getParam("simple");
                var icon = simple ? menuClose : menuRight;
                var AND = _("and");
                var OR = _("or");
                var GLUE = function (obj) { return (obj.glue == "and" ? AND : OR); };
                var list = {
                    view: "tree",
                    borderless: true,
                    localId: "list",
                    glue: "and",
                    css: "wbq-query_list",
                    scheme: {
                        $serialize: function (obj) {
                            if (obj.group) {
                                return { group: obj.group, glue: obj.glue };
                            }
                            var out = {
                                glue: obj.glue,
                                field: obj.field,
                                condition: obj.condition,
                            };
                            if (obj.includes && obj.includes.length)
                                out.includes = obj.includes;
                            return out;
                        },
                        $init: function (obj) {
                            if (obj.group) {
                                obj.$css = "group";
                                obj.open = true;
                            }
                        },
                    },
                    type: {
                        template: function (obj) {
                            if (obj.group) {
                                return "<div class='wbq-filter_join wbq-filter_join_" + obj.glue + "'>" + GLUE(obj) + "</div>";
                            }
                            return (_this.Template(obj, _this.app.config.fields, icon, _) +
                                ("<div class='wbq-filter_join wbq-filter_join_" + obj.glue + "'>" + GLUE(obj) + "</div>"));
                        },
                    },
                    onClick: {
                        "action-menu": function (e, id) {
                            this.$scope.Actions.Show(e.target, id);
                        },
                        "action-close": function (e, id) {
                            _this.Delete(id);
                        },
                        "wbq-filter_join": function (e, id) {
                            _this.SwitchGlue(id);
                        },
                    },
                    on: {
                        onItemDblClick: function (id) { return _this.EditStart(id); },
                    },
                };
                return list;
            };
            BaseView.prototype.init = function () {
                var _this = this;
                this.Actions = this.ui(ActionsPopupView);
                this.on(this.app, "applyFilter", function (v) { return _this.EditStop(v); });
                this.on(this.app, "action", function (type, id) {
                    if (type === "delete") {
                        _this.Delete(id);
                    }
                    else if (type === "add-filter") {
                        _this.Add(null, id);
                    }
                    else if (type === "add-group") {
                        _this.AddGroup(null, id);
                    }
                    else if (type === "edit") {
                        webix.delay(function () { return _this.EditStart(id); });
                    }
                });
                this.State = this.getParam("state");
                this.on(this.State.$changes, "value", function (v) {
                    _this.LastValue = JSON.stringify(v);
                    _this.$$("list").clearAll();
                    if (v) {
                        _this.$$("list").parse(_this.ConvertTo(v));
                    }
                });
            };
            BaseView.prototype.ConvertTo = function (v, glue) {
                var _this = this;
                if (v.rules) {
                    var data = v.rules.map(function (a) { return _this.ConvertTo(a, v.glue); });
                    if (!glue)
                        return data;
                    return { group: true, glue: glue, data: data };
                }
                var out = __assign(__assign({}, v), { glue: glue });
                return out;
            };
            BaseView.prototype.ConvertFrom = function (id, source) {
                var _this = this;
                var glue = "and";
                var branch = source.getBranch(id);
                var rules = branch.map(function (_a) {
                    var id = _a.id, field = _a.field, type = _a.type, condition = _a.condition, includes = _a.includes;
                    if (field)
                        return { field: field, type: type, condition: condition, includes: includes };
                    return _this.ConvertFrom(id, source);
                });
                if (!rules.length)
                    return null;
                glue = branch[0].glue;
                return { glue: glue, rules: rules };
            };
            BaseView.prototype.Add = function (obj, after) {
                this.EditStop();
                obj = obj || { field: "" };
                var list = this.$$("list");
                var parent = after ? list.getParentId(after) : 0;
                var index = after ? list.getBranchIndex(after) + 1 : -1;
                if (!after && list.count())
                    after = list.getFirstId();
                var glue = after ? list.getItem(after).glue : list.config.glue;
                obj.glue = glue;
                var id = list.add(obj, index, parent);
                this.EditStart(id);
                this.CreateMode = true;
            };
            BaseView.prototype.SwitchGlue = function (id) {
                var list = this.$$("list");
                var branch = list.data.getBranch(list.getParentId(id));
                for (var i = 0; i < branch.length; i++) {
                    list.updateItem(branch[i].id, {
                        glue: branch[i].glue == "and" ? "or" : "and",
                    });
                }
                this.Save();
            };
            BaseView.prototype.AddGroup = function (obj, after) {
                this.EditStop();
                obj = obj || {};
                var list = this.$$("list");
                var parent = after ? list.getParentId(after) : 0;
                var index = after ? list.getBranchIndex(after) + 1 : -1;
                var node = { id: webix.uid(), group: true };
                var glue = after ? list.getItem(after).glue : list.config.glue;
                node.glue = glue;
                obj.glue = node.glue == "and" ? "or" : "and";
                list.add(node, index, parent);
                var id = list.add(obj, null, node.id);
                this.EditStart(id);
                this.CreateMode = true;
            };
            BaseView.prototype.Delete = function (id) {
                this.EditStop();
                this.DeleteSilent(id);
                this.Save();
            };
            BaseView.prototype.DeleteSilent = function (id) {
                var list = this.$$("list");
                var parent = list.getParentId(id);
                list.remove(id);
                var branch = list.data.branch[parent];
                if (parent && !branch) {
                    this.DeleteSilent(parent);
                }
                else if (branch.length == 1 && list.getItem(branch[0]).group) {
                    var sub = branch[0];
                    if (parent) {
                        var grand = list.getParentId(parent);
                        var pIndex = list.getBranchIndex(parent, grand);
                        list.move(sub, pIndex, list, { parent: grand });
                        this.DeleteSilent(parent);
                    }
                    else {
                        var pIndex = list.getBranchIndex(sub, 0);
                        var kids = [].concat(list.data.branch[sub]);
                        list.move(kids, pIndex, list, { parent: 0 });
                        this.DeleteSilent(sub);
                    }
                }
            };
            BaseView.prototype.EditStop = function (v) {
                if (!this.Active)
                    return;
                var list = this.$$("list");
                if (!v) {
                    if (this.CreateMode)
                        this.DeleteSilent(this.ActiveId);
                    else
                        list.refresh(this.ActiveId);
                }
                else {
                    v = v || this.Active.GetValue();
                    v.includes = v.includes || [];
                    list.updateItem(this.ActiveId, __assign({}, v));
                }
                var t = this.Active;
                this.Active = null;
                t.destructor();
                this.Save();
            };
            BaseView.prototype.Save = function () {
                var v = this.ConvertFrom(0, this.$$("list").data);
                var asString = JSON.stringify(v);
                if (this.LastValue !== asString) {
                    this.State.value = v;
                }
            };
            BaseView.prototype.Template = function (obj, fields, icon, _) {
                var op = "&nbsp;";
                var field = fields.find(function (a) { return a.id === obj.field; }) || { value: "" };
                if (obj.includes && obj.includes.length) {
                    op = _("in") + " ";
                    for (var i = 0; i < obj.includes.length; i++) {
                        op +=
                            (i > 0 ? ", " : "") +
                                ("<span class='wbq-field-value'>" + obj.includes[i] + "</span>");
                    }
                }
                else {
                    if (obj.condition && obj.condition.type) {
                        op = _(obj.condition.type) + " <span class='wbq-field-value'>" + this.Format(obj.condition.filter, field.format, field.type) + "</span>";
                    }
                }
                return "<span class='wbq-field-box'><span class='wbq-field-name'>" + field.value + "</span> " + op + " </span>" + icon;
            };
            BaseView.prototype.Format = function (value, format, type) {
                if (!value)
                    return "";
                if (value.start)
                    value =
                        this.Format(value.start, format, type) +
                            (value.end ? " - " + this.Format(value.end, format, type) : "");
                else {
                    var parser = format || (type == "date" ? webix.i18n.dateFormatStr : null);
                    if (parser)
                        value = parser(value);
                }
                return value;
            };
            return BaseView;
        }(JetView));
        var FilterView = (function (_super) {
            __extends(FilterView, _super);
            function FilterView() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            FilterView.prototype.config = function () {
                var _this = this;
                var _ = this.app.getService("locale")._;
                var fieldselect = {
                    view: "richselect",
                    options: [],
                    localId: "field",
                    on: {
                        onChange: function () { return _this.AdjustToField(); },
                    },
                };
                var filter = { localId: "filter" };
                var bottombar = {
                    type: "clean",
                    cols: [
                        {
                            view: "button",
                            value: _("Cancel"),
                            width: 100,
                            click: function () { return _this.Hide(); },
                        },
                        {},
                        {
                            view: "button",
                            value: _("Apply"),
                            width: 100,
                            css: "webix_primary",
                            click: function () { return _this.ApplyFilter(); },
                        },
                    ],
                };
                return {
                    padding: 10,
                    margin: 6,
                    css: "webix_shadow_small",
                    rows: [fieldselect, filter, bottombar],
                };
            };
            FilterView.prototype.GetField = function () {
                var fselect = this.$$("field");
                return fselect.getList().getItem(fselect.getValue());
            };
            FilterView.prototype.AdjustToField = function () {
                var field = this.GetField();
                this.CreateFilter(field.id, field.type, field.format, field.conditions, this.$$("filter"));
            };
            FilterView.prototype.CreateFilter = function (field, type, format, conditions, place) {
                var ui = {
                    view: "filter",
                    localId: "filter",
                    conditions: conditions,
                    field: field,
                    mode: type,
                    template: function (o) {
                        var str = o[field];
                        var parser = format || (type == "date" ? webix.i18n.dateFormatStr : null);
                        if (parser)
                            str = parser(str);
                        return str;
                    },
                    margin: 6,
                };
                var filter = webix.ui(ui, place);
                var data = this.app.getService("backend").data(field);
                filter.parse(data);
                return filter;
            };
            FilterView.prototype.ApplyFilter = function () {
                this.app.callEvent("applyFilter", [this.GetValue()]);
            };
            FilterView.prototype.GetValue = function () {
                var field = this.GetField();
                var rule = __assign(__assign({}, this.$$("filter").getValue()), { field: field.id, type: field.type });
                if (rule.condition.filter == "" &&
                    (!rule.includes || !rule.includes.length))
                    rule = null;
                return rule;
            };
            FilterView.prototype.Hide = function () {
                this.app.callEvent("applyFilter", [null]);
            };
            FilterView.prototype.Show = function (value, fields) {
                var fselect = this.$$("field");
                fselect.getList().parse(fields);
                if (value.field) {
                    fselect.setValue(value.field);
                }
                else {
                    fselect.setValue(fields[0].id);
                }
                this.$$("filter").setValue(webix.copy(value));
            };
            return FilterView;
        }(JetView));
        var FilterPopup = (function (_super) {
            __extends(FilterPopup, _super);
            function FilterPopup() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            FilterPopup.prototype.config = function () {
                return {
                    view: "popup",
                    point: false,
                    body: { $subview: FilterView, name: "body" },
                };
            };
            FilterPopup.prototype.Show = function (value, fields, at) {
                var _this = this;
                setTimeout(function () {
                    _this.getRoot().show(at);
                    _this.getSubView("body").Show(value, fields);
                }, 100);
            };
            return FilterPopup;
        }(JetView));
        var TopBarView = (function (_super) {
            __extends(TopBarView, _super);
            function TopBarView() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            TopBarView.prototype.config = function () {
                var button = this.GetButton();
                button.width = 100;
                var list = this.GetList();
                list.scroll = this.app.config.scroll !== false ? "x" : "";
                list.borderless = true;
                list.css = "wbq-query_bar";
                var small = webix.skin.$name == "mini" || webix.skin.$name == "compact";
                var padding = 8, height = 58;
                if (small) {
                    padding = 4;
                    height = 50;
                }
                return {
                    view: "toolbar",
                    paddingX: padding * 2,
                    paddingY: padding,
                    height: height,
                    borderless: true,
                    cols: [list, button],
                };
            };
            TopBarView.prototype.EditStart = function (id) {
                var _this = this;
                this.EditStop();
                var list = this.$$("list");
                this.ActiveId = id;
                this.Active = this.ui(FilterPopup);
                this.Active.getRoot().attachEvent("onHide", function () {
                    if (_this.Active)
                        _this.EditStop();
                });
                var at = webix.html.offset(list.getItemNode(id));
                this.Active.Show(list.getItem(id), this.app.config.fields, at);
                this.CreateMode = false;
            };
            return TopBarView;
        }(BaseView));
        var TopListView = (function (_super) {
            __extends(TopListView, _super);
            function TopListView() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            TopListView.prototype.config = function () {
                return {
                    paddingX: 16,
                    paddingY: 8,
                    margin: 0,
                    rows: [this.GetButton(), this.GetList()],
                };
            };
            TopListView.prototype.EditStart = function (id) {
                var _this = this;
                if (this.ActiveId && this.ActiveId == id)
                    return;
                this.EditStop();
                var list = this.$$("list");
                var container = list.getItemNode(id);
                container.classList.add("active-editor");
                container.innerHTML = "";
                this.ActiveId = id;
                this.Active = this.ui(FilterView, { container: container });
                this.$$("list").attachEvent("onAfterRender", function () { return _this.EditStop(); });
                this.Active.Show(list.getItem(id), this.app.config.fields);
                this.CreateMode = false;
            };
            return TopListView;
        }(BaseView));
        var views = { JetView: JetView };
        views["actions"] = ActionsPopupView;
        views["bar"] = TopBarView;
        views["base"] = BaseView;
        views["filter"] = FilterView;
        views["list"] = TopListView;
        views["popup"] = FilterPopup;
        var en = {
            "Add filter": "Add filter",
            in: "=",
            equal: "=",
            notEqual: "<>",
            less: "<",
            greater: ">",
            greaterOrEqual: ">=",
            lessOrEqual: "<=",
            contains: "contains",
            notContains: "not contains",
            beginsWith: "begins",
            notBeginsWith: "not begings",
            endsWith: "ends",
            notEndsWith: "not ends",
            between: "between",
            notBetween: "not between",
            and: "and",
            or: "or",
            Edit: "Edit",
            "Add Filter": "Add Filter",
            "Add Group": "Add Group",
            Delete: "Delete",
            Apply: "Apply",
            Cancel: "Cancel",
        };
        var Backend = (function () {
            function Backend(app) {
                this._app = app;
            }
            Backend.prototype.data = function (field) {
                var data = this._app.config.data;
                if (typeof data == "function")
                    return Promise.resolve(data(field)).then(function (a) {
                        return a.map(function (b) {
                            var _a;
                            return (_a = {}, _a[field] = b, _a);
                        });
                    });
                return Promise.resolve(data);
            };
            Backend.prototype.save = function (v) {
                console.log(v);
            };
            return Backend;
        }());
        function query(query, fields) {
            var ops = webix.filters;
            var types = {};
            fields.forEach(function (a) {
                if (a.conditions)
                    a.conditions.forEach(function (op) {
                        if (typeof op === "object") {
                            ops[op.id] = op.handler;
                        }
                    });
                if (a.type)
                    types[a.id] = a.type;
            });
            return queryToFilter(query, ops, types);
        }
        function queryToFilter(query, ops, types) {
            if (!query || !query.rules.length)
                return function () { return true; };
            var filters = query.rules.map(function (a) { return singleFilter(a, ops, types); });
            return (query.glue === "or" ? glueOr : glueAnd)(filters);
        }
        function glueAnd(f) {
            return function (v) {
                for (var i = 0; i < f.length; i++) {
                    if (!f[i](v))
                        return false;
                }
                return true;
            };
        }
        function glueOr(f) {
            return function (v) {
                for (var i = 0; i < f.length; i++) {
                    if (f[i](v))
                        return true;
                }
                return false;
            };
        }
        function singleFilter(rule, ops, types) {
            if (rule.rules) {
                return queryToFilter(rule, ops, types);
            }
            return function (v) {
                var test = v[rule.field];
                if (rule.includes && rule.includes.length) {
                    return rule.includes.findIndex(function (a) { return a === test; }) !== -1;
                }
                if (test) {
                    var con = rule.condition.type;
                    var filter = ops[con] || ops[types[rule.field]][con];
                    return filter(test, rule.condition.filter);
                }
                return false;
            };
        }
        var App = (function (_super) {
            __extends(App, _super);
            function App(config) {
                var _this = this;
                var state = createState({
                    value: config.value || null,
                });
                var defaults = {
                    router: EmptyRouter,
                    version: "8.1.1",
                    debug: true,
                };
                _this = _super.call(this, __assign(__assign({}, defaults), config)) || this;
                _this.config.start = config.type === "bar" ? "/bar" : "/list";
                _this.config.params = { state: state, simple: config.simple === true };
                _this.setService("backend", new (_this.dynamic(Backend))(_this));
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
            App.prototype.GetFilter = function () {
                return query(this.config.params.state.value, this.config.fields);
            };
            return App;
        }(JetApp));
        webix.protoUI({
            name: "query",
            app: App,
            getState: function () {
                return this.$app.getState();
            },
            getService: function (name) {
                return this.$app.getService(name);
            },
            $init: function () {
                var _this = this;
                var state = this.getState();
                for (var key in state) {
                    link(state, this.config, key);
                }
                state.$changes.attachEvent("value", ignoreInitial(function (v, o) { return _this.callEvent("onChange", v, o); }));
            },
            getFilterFunction: function () {
                return this.$app.GetFilter();
            },
        }, webix.ui.jetapp);
        var services = { Backend: Backend };
        var locales = { en: en };
        exports.App = App;
        exports.locales = locales;
        exports.services = services;
        exports.views = views;
        Object.defineProperty(exports, '__esModule', { value: true });
    })));

    var QueryView = (function (_super) {
        __extends(QueryView, _super);
        function QueryView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        QueryView.prototype.config = function () {
            var _this = this;
            this.State = this.getParam("state", true);
            var local = this.app.getService("local");
            return {
                view: "query",
                localId: "query",
                css: "webix_rpt_query",
                locale: { lang: this.app.getService("locale").getLang() },
                data: function (field) {
                    var column = _this.State.fields.find(function (a) { return a.id === field; });
                    if (column.type === "boolean")
                        return [0, 1];
                    return local.getFieldData(field, column.type);
                },
                fields: this.State.fields
                    .filter(function (a) { return a.type !== "reference" && a.type !== "picklist"; })
                    .map(function (a) {
                    var obj = {
                        id: a.id,
                        value: a.name +
                            " " +
                            (a.model
                                ? "<span class='webix_rpt_sources_path'>" + a.model + "</span>"
                                : ""),
                        type: a.type,
                    };
                    if (obj.type === "boolean") {
                        obj.conditions = ["equal"];
                        obj.type = "number";
                    }
                    return obj;
                }),
            };
        };
        QueryView.prototype.init = function () {
            var _this = this;
            this.State = this.getParam("state", true);
            var query = this.getRoot();
            this.on(this.State.$changes, "query", function (value) {
                query.$app.callEvent("applyFilter", [null]);
                query.config.value = value ? fixDates(JSON.parse(value)) : null;
            });
            query.getState().$observe("value", function (v) {
                _this.State.query = v ? JSON.stringify(v) : "";
            });
        };
        return QueryView;
    }(JetView));
    function fixDates(value) {
        if (value.rules)
            value.rules.forEach(fixDates);
        else {
            if (value.type === "date") {
                var c = value.condition;
                if (c.filter && typeof value.condition.filter === "string")
                    c.filter = new Date(c.filter);
                if (c.filter.start && typeof c.filter.start === "string")
                    c.filter.start = new Date(c.filter.start);
                if (c.filter.end && typeof c.filter.end === "string")
                    c.filter.end = new Date(c.filter.end);
            }
        }
        return value;
    }

    var QueryBuilderView = (function (_super) {
        __extends(QueryBuilderView, _super);
        function QueryBuilderView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        QueryBuilderView.prototype.config = function () {
            var _this = this;
            var _ = (this._ = this.app.getService("locale")._);
            var querySelect = {
                localId: "qblock",
                type: "clean",
                rows: [
                    {
                        type: "form",
                        margin: 5,
                        padding: { bottom: 5 },
                        rows: [
                            {
                                localId: "queryBar",
                                visibleBatch: "def",
                                cols: [
                                    { view: "label", label: _("Filtering query"), width: 120 },
                                    {},
                                    {
                                        batch: "query",
                                        view: "icon",
                                        localId: "delete",
                                        icon: "rpi-delete",
                                        tooltip: _("Delete"),
                                        click: function () { return _this.DeleteQuery(); },
                                    },
                                    {
                                        batch: "query",
                                        view: "icon",
                                        localId: "copy",
                                        icon: "rpi-content-copy",
                                        tooltip: _("Create copy"),
                                        click: function () { return _this.CopyQuery(); },
                                    },
                                    {
                                        batch: "query",
                                        view: "icon",
                                        localId: "rename",
                                        icon: "rpi-pencil",
                                        tooltip: _("Rename"),
                                        click: function () { return _this.RenameQuery(); },
                                    },
                                    {
                                        view: "button",
                                        disabled: true,
                                        css: "webix_primary",
                                        localId: "save",
                                        label: _("Save"),
                                        tooltip: _("Save query"),
                                        width: 150,
                                        click: function () { return _this.SaveQuery(null); },
                                    },
                                ],
                            },
                            {
                                view: "query-select",
                                options: [],
                                name: "id",
                                css: "webix_rpt_qselect",
                                localId: "qselect",
                                suggest: {
                                    css: "webix_rpt_qselect_suggest",
                                    template: function (item) { return _this.QSelectTemplate(item); },
                                    body: {
                                        minHeight: 25,
                                    },
                                    on: {
                                        onShow: function () {
                                            if (!this.getBody().$view.firstChild.getAttribute("placeholder"))
                                                this.getBody().$view.firstChild.setAttribute("placeholder", _("No saved queries"));
                                        },
                                    },
                                },
                                on: {
                                    onClearClick: function () { return _this.NewQuery(); },
                                },
                            },
                            {
                                autoheight: true,
                                borderless: true,
                                template: _("Save filter to use it in other reports"),
                                css: "webix_rpt_description",
                            },
                        ],
                    },
                    QueryView,
                ],
            };
            return querySelect;
        };
        QueryBuilderView.prototype.init = function () {
            var _this = this;
            this.Local = this.app.getService("local");
            var state = (this.State = this.getParam("state", true));
            var qData = (this.Queries = this.Local.getQueries());
            this.LocalState = createState({ id: "", saved: true });
            qData.waitData.then(function () {
                var _a;
                var now = _this.State.query;
                var ctrl = _this.$$("qselect");
                var list = ctrl.getList();
                var tables = (_a = {}, _a[_this.State.data] = 1, _a);
                _this.State.joins.forEach(function (a) { return (tables[a.tid] = 1); });
                qData.filter(function (a) {
                    var res = true;
                    a.models.forEach(function (m) {
                        if (!tables[m])
                            res = false;
                    });
                    return res;
                });
                list.sync(qData);
                qData.data.each(function (v) {
                    if (v.text == now)
                        ctrl.setValue(v.id);
                });
                _this.on(state.$changes, "query", function (v) {
                    var id = _this.LocalState.id;
                    var changed = (!id && v) || (id && qData.getItem(id).text != v);
                    _this.LocalState.saved = !changed;
                });
            });
            bind(this.LocalState, "id", this.$$("qselect"), this);
            var saveBtn = this.$$("save");
            this.on(this.LocalState.$changes, "saved", function (v) {
                if (v)
                    saveBtn.disable();
                else
                    saveBtn.enable();
            });
            this.on(this.LocalState.$changes, "id", function (v) {
                if (v) {
                    var item = qData.getItem(v);
                    _this.State.query = item.text;
                    _this.$$("queryBar").showBatch("query");
                }
                else {
                    _this.$$("queryBar").showBatch("def");
                }
            });
        };
        QueryBuilderView.prototype.NewQuery = function () {
            this.LocalState.id = null;
            this.LocalState.saved = true;
            this.State.query = null;
        };
        QueryBuilderView.prototype.SaveQuery = function (name) {
            var _this = this;
            var id = this.LocalState.id;
            var text = this.State.query;
            if (id) {
                if (name === null)
                    name = this.Queries.getItem(id).name;
                this.Local.saveQuery(id, { name: name, text: text }).then(function () {
                    _this.$$("qselect").setValue(id);
                    _this.LocalState.saved = true;
                });
                return;
            }
            prompt({
                text: this._("Enter query name"),
                button: this._("Save"),
                value: "",
            }).then(function (name) {
                if (name) {
                    _this.Local.saveQuery(null, { name: name, text: text }).then(function (id) {
                        _this.LocalState.saved = true;
                        _this.LocalState.id = id;
                    });
                }
            });
        };
        QueryBuilderView.prototype.RenameQuery = function () {
            var _this = this;
            var id = this.LocalState.id;
            var name = this.Queries.getItem(id).name;
            prompt({
                text: this._("Enter query name"),
                value: name,
                button: this._("Save"),
            }).then(function (name) {
                if (!name)
                    return;
                _this.SaveQuery(name);
            });
        };
        QueryBuilderView.prototype.CopyQuery = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            var _a = this.Queries.getItem(this.LocalState.id), name = _a.name, text = _a.text;
            name = _("Copy of") + " " + name;
            this.Local.saveQuery(null, { name: name, text: text }).then(function (id) {
                _this.LocalState.id = id;
            });
        };
        QueryBuilderView.prototype.DeleteQuery = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            webix
                .confirm({
                title: _("Delete"),
                ok: _("Delete"),
                cancel: _("Cancel"),
                text: _("Are you sure to delete this query?"),
            })
                .then(function () {
                var id = _this.LocalState.id;
                _this.Local.deleteQuery(id).then(function () {
                    _this.LocalState.$batch({ saved: true, id: null });
                    _this.State.query = null;
                });
            });
        };
        QueryBuilderView.prototype.ShowMenu = function (trg) {
            var _this = this;
            if (!this.QueryMenu || !this.QueryMenu.$view)
                this.QueryMenu = this.ui({
                    view: "popup",
                    body: {
                        view: "list",
                        borderless: true,
                        css: "webix_rpt_popup_menu",
                        template: function (obj) { return _this.GetMenuTemplate(obj); },
                        width: 160,
                        autoheight: true,
                        click: function (id) { return _this.ApplyQueryAction(id); },
                        data: this.GetMenuOptions(),
                    },
                });
            var list = this.QueryMenu.getBody();
            list.data.each(function (item) {
                item.disabled = !_this.LocalState.id;
            });
            list.refresh();
            this.QueryMenu.show(trg);
        };
        QueryBuilderView.prototype.GetMenuOptions = function () {
            return [
                { id: "copy", value: "Copy", icon: "rpi-content-copy" },
                { id: "rename", value: "Rename", icon: "rpi-pencil" },
                { id: "delete", value: "Delete", icon: "rpi-delete" },
            ];
        };
        QueryBuilderView.prototype.GetMenuTemplate = function (obj) {
            return "<span class='webix_icon " + obj.icon + "'></span>" + obj.value;
        };
        QueryBuilderView.prototype.ApplyQueryAction = function (id) {
            this.QueryMenu.hide();
            switch (id) {
                case "rename":
                    this.RenameQuery();
                    break;
                case "copy":
                    this.CopyQuery();
                    break;
                case "delete":
                    this.DeleteQuery();
                    break;
            }
        };
        QueryBuilderView.prototype.QSelectTemplate = function (obj) {
            return obj.value + " <span class='webix_icon wxi-close webix_rpt_qselect_icon'></span>";
        };
        return QueryBuilderView;
    }(JetView));

    var DateView = (function (_super) {
        __extends(DateView, _super);
        function DateView(app, name, master) {
            var _this = _super.call(this, app, name) || this;
            _this.Master = master;
            return _this;
        }
        DateView.prototype.config = function () {
            var _this = this;
            return {
                view: "popup",
                body: {
                    view: "list",
                    width: 160,
                    autoheight: true,
                    css: "webix_rpt_grouppopup",
                    template: function (obj) { return _this.GetPopupTemplate(obj); },
                    data: this.Master.config.modifiers,
                    click: function (id) {
                        _this.Master.setModifier(_this.ActiveGroup, id);
                        _this.getRoot().hide();
                    },
                },
            };
        };
        DateView.prototype.$init = function () {
            this.ActiveGroup = null;
        };
        DateView.prototype.GetPopupTemplate = function (obj) {
            var isSelected = obj.id == this.Master.getModifier(this.ActiveGroup);
            return obj.value + " <span class='webix_icon wxi-radiobox-" + (isSelected ? "marked" : "blank") + "'></span>";
        };
        DateView.prototype.Show = function (node, id) {
            this.ActiveGroup = id;
            this.getRoot().show(node, { x: -10 });
            this.getRoot()
                .getBody()
                .refresh();
        };
        return DateView;
    }(JetView));

    var SummaryPopupView = (function (_super) {
        __extends(SummaryPopupView, _super);
        function SummaryPopupView(app, name, master) {
            var _this = _super.call(this, app, name) || this;
            _this.Master = master;
            return _this;
        }
        SummaryPopupView.prototype.config = function () {
            var _this = this;
            return {
                view: "popup",
                body: {
                    view: "list",
                    css: "webix_rpt_popup_menu",
                    width: 160,
                    autoheight: true,
                    template: function (obj) { return _this.GetTemplate(obj); },
                    click: function (id) {
                        _this.app.callEvent("summaryAction", [id]);
                        _this.getRoot().close();
                    },
                    data: this.GetOptions(),
                },
            };
        };
        SummaryPopupView.prototype.Show = function (node, data, index) {
            this.SetActionStates(data, index);
            this.getRoot().show(node);
        };
        SummaryPopupView.prototype.GetOptions = function () {
            var _ = this.app.getService("locale")._;
            return [{ id: "delete", value: _("Delete"), icon: "rpi-delete" }];
        };
        SummaryPopupView.prototype.SetActionStates = function (data) {
            var popup = this.getRoot();
            var list = popup.getBody();
            list.data.each(function (action) {
                if (data.length == 1)
                    list.disableItem(action.id);
                else
                    list.enableItem(action.id);
            });
        };
        SummaryPopupView.prototype.GetTemplate = function (obj) {
            return "<span class='webix_icon " + obj.icon + "'></span> " + obj.value;
        };
        return SummaryPopupView;
    }(JetView));

    var Summaries = (function (_super) {
        __extends(Summaries, _super);
        function Summaries() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Summaries.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            var labels = {
                margin: webix.skin.$active.layoutMargin.form,
                cols: [
                    {
                        view: "label",
                        label: _("Function"),
                        width: 100,
                        css: "webix_rpt_subtitle",
                    },
                    {
                        view: "label",
                        label: _("Column"),
                        css: "webix_rpt_subtitle",
                    },
                    {
                        view: "label",
                        label: _("New column name"),
                        css: "webix_rpt_subtitle",
                    },
                    {
                        width: 38,
                    },
                ],
            };
            var inputs = {
                margin: webix.skin.$active.layoutMargin.form,
                localId: "summaries",
                view: "form",
                type: "clean",
                css: "webix_rpt_summary_form",
                elements: [],
            };
            return {
                borderless: true,
                type: "clean",
                rows: [
                    {
                        cols: [{ view: "label", label: _("Group summaries") }],
                    },
                    labels,
                    inputs,
                    {
                        height: webix.skin.$active.layoutMargin.form,
                    },
                    {
                        view: "button",
                        icon: "wxi-plus",
                        type: "icon",
                        label: _("Add column"),
                        width: 210,
                        align: "left",
                        click: function () { return _this.AddNewAggregation(); },
                    },
                ],
            };
        };
        Summaries.prototype.init = function () {
            var _this = this;
            this.State = this.getParam("state", true);
            this.GroupState = this.getParam("group", true);
            this.SummaryColumns = this.State.fields
                .filter(function (column) {
                return ((column.type == "number" || column.type == "date") && !column.key);
            })
                .sort(function (a, b) { return (a.type < b.type ? 1 : -1); })
                .map(function (a) { return ({ id: a.id, value: a.name, type: a.type }); });
            this.CreateForm();
            this.on(this.app, "summaryAction", function (id) { return _this.ApplyAction(id); });
            this.on(this.GroupState.$changes, "by", function () { return _this.ValidateFormData(); });
        };
        Summaries.prototype.CreateForm = function () {
            var aggregate = this.GroupState.columns;
            if (aggregate && aggregate.length)
                this.LoadAggregations(aggregate);
            else
                this.AddNewAggregation();
            if (!this.SummaryColumns.length) {
                this.ApplyOneRowMode();
            }
        };
        Summaries.prototype.ApplyOneRowMode = function () {
            var rows = this.getRoot().getChildViews();
            rows[3].hide();
            rows[4].hide();
        };
        Summaries.prototype.AddNewAggregation = function () {
            this.AddAggregation();
            this.Changed();
        };
        Summaries.prototype.LoadAggregations = function (data) {
            var _this = this;
            data.forEach(function (summary) {
                _this.AddAggregation(summary);
            });
            this.Changed();
        };
        Summaries.prototype.AddAggregation = function (aggregation) {
            aggregation = aggregation || this.GetDefaultFormData();
            if (!aggregation)
                return false;
            var formId = aggregation.id || "form" + webix.uid();
            this.$$("summaries").addView(this.GetRowForm(formId, aggregation));
        };
        Summaries.prototype.GetRowForm = function (id, data) {
            var _this = this;
            var cols = [
                {
                    width: 100,
                    view: "richselect",
                    name: "op",
                    value: data.op || null,
                    options: this.GetOperations(),
                    on: {
                        onChange: function (v) { return _this.Changed(id, "op", v); },
                    },
                },
                {
                    view: "richselect",
                    name: "id",
                    disabled: data.op == "count",
                    value: data.id || null,
                    options: this.SummaryColumns,
                    on: {
                        onChange: function (v) { return _this.Changed(id, "id", v); },
                    },
                },
                {
                    view: "text",
                    value: data.name || null,
                    name: "name",
                    on: {
                        onTimedKeypress: function (v) { return _this.Changed(id, "name", v); },
                    },
                },
            ];
            cols.push({
                view: "icon",
                icon: "wxi-dots",
                click: function (id, ev) { return _this.ShowPopup(id, ev); },
            });
            return {
                view: "form",
                localId: id,
                type: "clean",
                borderless: true,
                margin: webix.skin.$active.layoutMargin.form,
                rules: {
                    id: function (value) {
                        var groupBy = _this.GroupState.by;
                        return !groupBy || groupBy.indexOf(value) < 0;
                    },
                },
                cols: cols,
            };
        };
        Summaries.prototype.GetDefaultFormData = function () {
            var data = this.GetData();
            var columns = this.SummaryColumns;
            var operations = this.GetOperations();
            if (!columns.length) {
                var op = !data.length ? operations.find(function (op) { return op.id == "count"; }) : null;
                return op
                    ? {
                        op: "count",
                        id: "",
                        name: this.NewColumnTemplate(op),
                        type: "number",
                    }
                    : null;
            }
            else {
                for (var i = 0; i < operations.length; i++) {
                    var _loop_1 = function (j) {
                        var op = operations[i];
                        if (!data.find(function (row) {
                            return row.op == op.id && (op.id == "count" || row.id == columns[j].id);
                        }))
                            return { value: {
                                    op: op.id,
                                    id: op.id != "count" ? columns[j].id : null,
                                    name: this_1.NewColumnTemplate(op, columns[j]),
                                    type: columns[j].type,
                                } };
                    };
                    var this_1 = this;
                    for (var j = 0; j < columns.length; j++) {
                        var state_1 = _loop_1(j);
                        if (typeof state_1 === "object")
                            return state_1.value;
                    }
                }
            }
            return null;
        };
        Summaries.prototype.NewColumnTemplate = function (operation, column) {
            return operation.id == "count"
                ? operation.value
                : operation.value + " " + column.value;
        };
        Summaries.prototype.ShowPopup = function (id, ev) {
            if (!this.Popup || !this.Popup.$view)
                this.Popup = this.ui(SummaryPopupView);
            var form = webix.$$(id).getParentView();
            this.ActiveForm = form;
            this.Popup.Show(ev.target, this.GetData(), form.getParentView().index(form));
        };
        Summaries.prototype.ApplyAction = function (id) {
            if (id == "delete")
                this.DeleteAggregation();
        };
        Summaries.prototype.DeleteAggregation = function (form) {
            form = form || this.ActiveForm;
            var formList = form.getParentView();
            if (formList.getChildViews().length > 1)
                formList.removeView(form);
            else
                form.setValues({});
            this.Changed();
        };
        Summaries.prototype.GetOperations = function () {
            var _ = this.app.getService("locale")._;
            return [
                { id: "sum", value: _("Sum") },
                { id: "count", value: _("Count") },
                { id: "avg", value: _("Average") },
                { id: "max", value: _("Max") },
                { id: "min", value: _("Min") },
            ];
        };
        Summaries.prototype.GetData = function () {
            var data = [];
            this.ForEachFormRow(function (form) {
                data.push(form.getValues());
            });
            return data;
        };
        Summaries.prototype.ForEachFormRow = function (handler) {
            this.$$("summaries")
                .getChildViews()
                .forEach(function (form) {
                if (form && form.elements) {
                    handler(form);
                }
            });
        };
        Summaries.prototype.ValidateFormData = function () {
            var valid = true;
            this.ForEachFormRow(function (form) { return (valid = form.validate() && valid); });
            return valid;
        };
        Summaries.prototype.ChangeNewColumnName = function (formId) {
            var form = this.$$(formId).elements;
            var oId = form.op.getValue();
            var cId = form.id.getValue();
            var operations = this.GetOperations();
            if (oId) {
                if (oId == "count")
                    form.name.setValue(this.NewColumnTemplate(operations.find(function (o) { return o.id == oId; })));
                else if (cId)
                    form.name.setValue(this.NewColumnTemplate(operations.find(function (o) { return o.id == oId; }), this.SummaryColumns.find(function (c) { return c.id == cId; })));
            }
        };
        Summaries.prototype.Changed = function (formId, name, value) {
            var _this = this;
            if (name == "op" || name == "id")
                this.ChangeNewColumnName(formId);
            if (name == "op" && value == "count") {
                this.$$(formId).elements.id.setValue(null);
                this.$$(formId).elements.id.disable();
            }
            else {
                if (formId && name)
                    this.$$(formId).elements.id.enable();
            }
            this.ValidateFormData();
            var columns = this.GetData();
            columns.forEach(function (a) {
                return (a.type = (_this.SummaryColumns.find(function (b) { return b.id == a.id; }) || { type: "number" }).type);
            });
            this.GroupState.columns = columns;
        };
        return Summaries;
    }(JetView));

    webix.protoUI({
        name: "groupselect",
        $cssName: "text",
        defaults: {
            selectIcon: true,
            modifiers: {},
        },
        renderModifier: function (id) {
            var mid = this._modifiers[id];
            if (mid) {
                var option = this.config.modifiers.find(function (a) { return a.id === mid; });
                return ("<div class='webix_rpt_date_selector'>" +
                    (option ? option.value : "") +
                    (this.config.selectIcon
                        ? "<span class='webix_icon wxi-angle-down'></span>"
                        : "") +
                    "</div> | ");
            }
            return "";
        },
        $renderTag: function (text, height, value) {
            var content = this.renderModifier(value);
            content +=
                "<span>" +
                    text +
                    "</span><span class='webix_multicombo_delete' role='button' aria-label='" +
                    webix.i18n.aria.removeItem +
                    "'>x</span>";
            return ("<li class='webix_multicombo_value' style='line-height:" +
                height +
                "px;' optvalue='" +
                webix.template.escape(value) +
                "'>" +
                content +
                "</li>");
        },
        $init: function () {
            this._modifiers = {};
            webix.extend(this.on_click, {
                webix_rpt_date_selector: function (e, id, node) {
                    var value = webix.html.locate(e, "optvalue");
                    this.callEvent("onModifierClick", [value, e, node]);
                    return false;
                },
            });
        },
        setValue: function (value) {
            var _this = this;
            if (value) {
                if (typeof value !== "string" && typeof value[0] !== "string") {
                    this._modifiers = {};
                    value = value.map(function (a) {
                        _this._modifiers[a.id] = a.mod || null;
                        return a.id;
                    });
                }
            }
            else {
                this._modifiers = {};
            }
            return webix.ui.multicombo.prototype.setValue.call(this, value);
        },
        getModifier: function (id) {
            return this._modifiers[id];
        },
        setModifier: function (id, value, silent) {
            this._modifiers[id] = value;
            if (!silent)
                this.callEvent("onChange", []);
            this.refresh();
        },
        $setSize: function (x, y) {
            var config = this.config;
            var _a = this._custom_last_size || [0, 0], px = _a[0], py = _a[1];
            if (x == px && y == py)
                return;
            this._custom_last_size = [x, y];
            if (webix.ui.view.prototype.$setSize.call(this, x, y)) {
                if (!x || !y)
                    return;
                if (config.labelPosition == "top") {
                    config.labelWidth = 0;
                }
                this.render();
            }
        },
    }, webix.ui.multicombo);

    var OtherSettingsView = (function (_super) {
        __extends(OtherSettingsView, _super);
        function OtherSettingsView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        OtherSettingsView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            var groupBy = {
                margin: 5,
                rows: [
                    {
                        autoheight: true,
                        borderless: true,
                        template: _("Specify columns to group by and output(s)"),
                        css: "webix_rpt_description",
                    },
                    {
                        view: "groupselect",
                        localId: "groupBy",
                        modifiers: this.GetDateOptions(),
                        options: [],
                        on: {
                            onChange: function () { return _this.ChangeGroupBy(); },
                            onModifierClick: function (id, e, node) {
                                return _this.ShowModifierPopup(id, e, node);
                            },
                        },
                    },
                ],
            };
            return {
                view: "form",
                borderless: true,
                padding: 0,
                elements: [
                    {
                        localId: "groupByLayout",
                        margin: webix.skin.$active.layoutMargin.form,
                        rows: [groupBy, Summaries],
                    },
                ],
            };
        };
        OtherSettingsView.prototype.init = function () {
            var _this = this;
            this.State = this.getParam("state", true);
            var groupState = this.State.group || {};
            this.GroupState = createState({
                by: groupState.by || null,
                columns: groupState.columns || null,
            });
            this.LoadColumns();
            this.setParam("group", this.GroupState);
            this.on(this.GroupState.$changes, "*", ignoreInitial(function () { return _this.Apply(); }));
        };
        OtherSettingsView.prototype.ChangeGroupBy = function () {
            var group = this.$$("groupBy");
            var list = group.getPopup().getList();
            var arr = group.getValue();
            arr = arr ? (typeof arr === "string" ? arr.split(",") : arr) : [];
            this.GroupState.by = arr.map(function (a) {
                var mod = group.getModifier(a);
                if (list.getItem(a).type === "date" && !mod) {
                    mod = "year";
                    group.setModifier(a, mod, true);
                }
                var obj = { id: a };
                if (mod)
                    obj.mod = mod;
                return obj;
            });
        };
        OtherSettingsView.prototype.FilterGroupByColumns = function (column) {
            return column.id != "id";
        };
        OtherSettingsView.prototype.LoadColumns = function () {
            var _this = this;
            var columns = this.State.fields.map(function (a) { return ({
                id: a.id,
                value: a.name,
                type: a.type,
                model: a.model,
            }); });
            var groupBy = this.$$("groupBy");
            var list = groupBy.getPopup().getList();
            list.type.template = function (obj) { return _this.ListTemplate(obj); };
            list.parse(columns);
            this.$$("groupBy").setValue(this.GroupState.by);
        };
        OtherSettingsView.prototype.ListTemplate = function (obj) {
            return (obj.value +
                (obj.model
                    ? "<span class='webix_rpt_sources_path'>" + obj.model + "</span>"
                    : ""));
        };
        OtherSettingsView.prototype.ShowModifierPopup = function (id, e, node) {
            var _this = this;
            if (!this.DatePopup)
                this.DatePopup = this.ui(new DateView(this.app, "", this.$$("groupBy")));
            webix.delay(function () { return _this.DatePopup.Show(node, id); });
        };
        OtherSettingsView.prototype.GetDateOptions = function () {
            var _ = this.app.getService("locale")._;
            return [
                { id: "day", value: _("Day") },
                { id: "month", value: _("Month") },
                { id: "year", value: _("Year") },
                { id: "yearmonth", value: _("Year") + "/" + _("Month") },
                {
                    id: "yearmonthday",
                    value: _("Year") + "/" + _("Month") + "/" + _("Day"),
                },
            ];
        };
        OtherSettingsView.prototype.Apply = function () {
            var s = this.GroupState;
            this.State.group = {
                by: s.by || null,
                columns: s.columns || [],
            };
        };
        return OtherSettingsView;
    }(JetView));

    var TopView = (function (_super) {
        __extends(TopView, _super);
        function TopView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TopView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            var tabbar = {
                optionWidth: 102,
                tabMinWidth: 102,
                view: "tabbar",
                localId: "tabbar",
                css: "webix_rpt_editor_tabbar",
                type: "bottom",
                borderless: true,
                options: [
                    { id: "common", value: _("Common") },
                    { id: "data", value: _("Query") },
                    { id: "other", value: _("Data") },
                    { id: "structure", value: _("View") },
                ],
                on: {
                    onChange: function (v) { return _this.ShowView(v); },
                },
            };
            var toolbar = {
                view: "toolbar",
                padding: { left: 13, top: 0, bottom: 0 },
                height: webix.skin.$active.barHeight + 6,
                scroll: false,
                cols: [
                    tabbar,
                    {
                        view: "icon",
                        width: 40,
                        localId: "closeBtn",
                        icon: "rpi-close",
                        click: function () { return _this.Hide(); },
                    },
                ],
            };
            var ui = {
                width: 490,
                hidden: false,
                localId: "settings",
                rows: [toolbar, { $subview: true }],
            };
            this.Local = this.app.getService("local");
            return this.Local.ready(ui);
        };
        TopView.prototype.init = function () {
            var _this = this;
            this.AppState = this.app.getParam("state");
            var initial = this.Local.newModule();
            initial.id = -1;
            var state = (this.State = createState(initial));
            this.setParam("state", this.State);
            this.on(this.AppState.$changes, "moduleId", function (v) { return _this.ChangeModule(v); });
            this.on(this.State.$changes, "data", function (id, o, k, ctx) {
                if (id && (!ctx || !ctx.load))
                    _this.ChangeModel(id);
            });
            this.on(this.AppState.$changes, "toolbar", function (v) { return _this.ShowHideButton(v); });
            this.on(this.State.$changes, "*", debounce(function () {
                if (_this.State.id === -1)
                    return;
                _this.TrackChanges();
                _this.AppState.module = Object.assign({}, _this.State);
            }));
            this.on(state.$changes, "group", function (v, old, _key, ctx) {
                if (!v && old) {
                    state.$batch({
                        publicFields: null,
                        columns: state.oldColumns ||
                            _this.Local.getFields(state.data, state.joins, true),
                    });
                }
                else if (v) {
                    var prev_1 = [];
                    if (!ctx || !ctx.load) {
                        if (!old)
                            state.oldColumns = state.columns;
                        else {
                            if (JSON.stringify(v) == JSON.stringify(old))
                                return;
                            prev_1 = __spreadArrays(_this.State.columns);
                        }
                    }
                    else {
                        prev_1 = __spreadArrays(_this.State.columns);
                    }
                    var columns = v.columns.map(function (a) { return ({
                        id: a.op + "." + a.id,
                        name: a.name,
                        type: "number",
                        meta: {},
                        model: "",
                    }); });
                    if (v.by)
                        columns = columns.concat(v.by.map(function (a) {
                            var base = _this.State.fields.find(function (b) { return b.id == a.id; });
                            var id = a.mod ? a.mod + "." + a.id : a.id;
                            var obj = __assign(__assign({}, base), { id: id });
                            if (a.mod)
                                obj.type = "text";
                            return obj;
                        }));
                    var was_1 = {};
                    (state.publicFields || state.columns).forEach(function (a) { return (was_1[a.id] = 1); });
                    var now_1 = {};
                    columns.forEach(function (a) {
                        now_1[a.id] = 1;
                        if (!was_1[a.id])
                            prev_1.push(a);
                    });
                    prev_1 = prev_1.filter(function (a) { return now_1[a.id]; });
                    if (state.meta.freeze && state.meta.freeze >= prev_1.length)
                        delete state.meta.freeze;
                    state.$batch({ publicFields: columns, columns: prev_1 });
                }
            });
            this.on(this.app, "saveModule", function () {
                var save = _this.SaveData();
                var text = JSON.stringify(save);
                _this.Local.saveModule(_this.AppState.moduleId, {
                    name: _this.State.name,
                    text: text,
                }).then(function (id) {
                    _this.AppState.$batch({
                        moduleId: id,
                        mode: "view",
                        module: Object.assign({}, _this.AppState.module),
                        saved: true,
                    });
                });
            });
            this.on(this.app, "resetModule", function () { return _this.Reset(); });
            this.on(this.app, "onColumnResize", function (id, width) {
                var next = __spreadArrays(_this.State.columns);
                next.find(function (a) { return a.id == id; }).width = width;
                _this.State.columns = next;
            });
            this.on(this.AppState.$changes, "readonly", function (mod) {
                if (mod)
                    _this.Reset();
            });
            this.show("./editor.common");
        };
        TopView.prototype.ShowView = function (v) {
            this.$$("tabbar").setValue(v);
            this.show("editor." + v);
        };
        TopView.prototype.Hide = function () {
            this.Reset();
        };
        TopView.prototype.Reset = function () {
            var _this = this;
            var id = this.AppState.moduleId;
            if (!id) {
                this.AppState.$batch({ mode: "list", module: null, saved: true });
            }
            else
                this.Local.getModule(id).then(function (mod) {
                    _this.AppState.$batch({
                        mode: "view",
                        module: Object.assign({}, JSON.parse(mod.text)),
                        saved: true,
                    });
                });
        };
        TopView.prototype.ChangeModel = function (id) {
            if (id)
                this.State.$batch(this.Local.setDataSource(id));
        };
        TopView.prototype.ChangeModule = function (id) {
            var _this = this;
            this.InitStateValue = "";
            if (id) {
                this.Local.getModule(id).then(function (item) {
                    var obj = JSON.parse(item.text);
                    _this.InitStateValue = item.text;
                    _this.InitName = obj.name = item.name;
                    obj.id = item.id;
                    obj.saved = true;
                    obj.fields = _this.Local.getFields(obj.data, obj.joins);
                    withContext({ load: true }, function () { return _this.State.$batch(obj); });
                    _this.AppState.saved = true;
                });
            }
            else {
                this.InitStateValue = null;
                this.State.$batch(this.Local.newModule());
                this.State.fields = this.Local.getFields(this.State.data, this.State.joins);
                this.AppState.saved = false;
            }
        };
        TopView.prototype.TrackChanges = function () {
            this.AppState.saved =
                JSON.stringify(this.SaveData()) == this.InitStateValue &&
                    this.State.name == this.InitName;
        };
        TopView.prototype.SaveData = function () {
            var _a = this.State, desc = _a.desc, data = _a.data, joins = _a.joins, query = _a.query, columns = _a.columns, group = _a.group, meta = _a.meta, sort = _a.sort, type = _a.type;
            return { desc: desc, data: data, joins: joins, query: query, columns: columns, group: group, meta: meta, sort: sort, type: type };
        };
        TopView.prototype.ShowHideButton = function (v) {
            if (v)
                this.$$("closeBtn").show();
            else
                this.$$("closeBtn").hide();
        };
        return TopView;
    }(JetView));

    var OtherSettingsView$1 = (function (_super) {
        __extends(OtherSettingsView, _super);
        function OtherSettingsView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        OtherSettingsView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            var groupByMode = {
                cols: [
                    {
                        view: "switch",
                        localId: "groupBySwitch",
                        css: "webix_rpt_title",
                        width: 65,
                        on: {
                            onChange: function (v) { return _this.ToggleGroupBy(v); },
                        },
                    },
                    {
                        view: "label",
                        label: _("Group"),
                    },
                ],
            };
            var sortByMode = {
                cols: [
                    {
                        view: "switch",
                        localId: "sortBySwitch",
                        css: "webix_rpt_title",
                        width: 65,
                        on: {
                            onChange: function (v) { return _this.ToggleSortBy(v); },
                        },
                    },
                    {
                        view: "label",
                        label: _("Sort"),
                    },
                ],
            };
            return {
                type: "form",
                rows: [
                    groupByMode,
                    { $subview: "_hidden", name: "group" },
                    sortByMode,
                    { $subview: "_hidden", name: "sort" },
                    { gravity: 0.000001 },
                ],
            };
        };
        OtherSettingsView.prototype.init = function () {
            this.State = this.getParam("state", true);
            this.$$("groupBySwitch").setValue(!!this.State.group);
            this.$$("sortBySwitch").setValue(!!this.State.sort);
        };
        OtherSettingsView.prototype.ToggleGroupBy = function (v) {
            if (v) {
                this.show("./editor.groups", { target: "group" });
            }
            else {
                this.State.group = null;
                this.show("_hidden", { target: "group" });
            }
        };
        OtherSettingsView.prototype.ToggleSortBy = function (v) {
            if (v) {
                this.show("./editor.sorts", { target: "sort" });
            }
            else {
                this.State.sort = null;
                this.show("_hidden", { target: "sort" });
            }
        };
        return OtherSettingsView;
    }(JetView));

    var OtherSettingsView$2 = (function (_super) {
        __extends(OtherSettingsView, _super);
        function OtherSettingsView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        OtherSettingsView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            var sortBy = {
                rows: [
                    {
                        view: "label",
                        label: _("Specify columns to sort by"),
                        css: "webix_rpt_subtitle",
                    },
                    {
                        view: "groupselect",
                        localId: "sortBy",
                        selectIcon: false,
                        css: "webix_rpt_sort_selector",
                        modifiers: [
                            { id: "asc", value: sortAsc },
                            { id: "desc", value: sortDesc },
                        ],
                        options: [],
                        on: {
                            onChange: function () { return _this.ChangeSortBy(); },
                            onModifierClick: function (id) { return _this.ChangeDirection(id); },
                        },
                    },
                ],
            };
            return sortBy;
        };
        OtherSettingsView.prototype.init = function () {
            var _this = this;
            this.State = this.getParam("state", true);
            this.on(this.State.$changes, "publicFields", function (v) {
                if (v)
                    _this.LoadColumns();
            });
            this.on(this.State.$changes, "fields", function () {
                if (!_this.State.publicFields)
                    _this.LoadColumns();
            });
        };
        OtherSettingsView.prototype.LoadColumns = function () {
            var _this = this;
            var columns = (this.State.publicFields || this.State.fields).map(function (a) { return ({
                id: a.id,
                value: a.name,
                type: a.type,
                model: a.model,
            }); });
            var sortBy = this.$$("sortBy");
            var list = sortBy.getPopup().getList();
            list.type.template = function (obj) { return _this.ListTemplate(obj); };
            list.clearAll();
            list.parse(columns);
            var sort = this.State.sort;
            if (sort)
                sort = sort.filter(function (a) { return !!columns.find(function (b) { return b.id == a.id; }); });
            sortBy.setValue(sort);
        };
        OtherSettingsView.prototype.ListTemplate = function (obj) {
            return (obj.value +
                (obj.model
                    ? "<span class='webix_rpt_sources_path'>" + obj.model + "</span>"
                    : ""));
        };
        OtherSettingsView.prototype.ChangeSortBy = function () {
            var ui = this.$$("sortBy");
            var arr = ui.getValue();
            arr = arr ? (typeof arr === "string" ? arr.split(",") : arr) : [];
            var state = arr.map(function (id) {
                var mod = ui.getModifier(id);
                if (!mod) {
                    mod = "asc";
                    ui.setModifier(id, mod, true);
                }
                var obj = { id: id };
                if (mod)
                    obj.mod = mod;
                return obj;
            });
            this.State.sort = state.length ? state : null;
        };
        OtherSettingsView.prototype.ChangeDirection = function (id) {
            var ui = this.$$("sortBy");
            ui.setModifier(id, ui.getModifier(id) === "asc" ? "desc" : "asc");
        };
        return OtherSettingsView;
    }(JetView));

    var AxisPropertiesView = (function (_super) {
        __extends(AxisPropertiesView, _super);
        function AxisPropertiesView(app, name, data, chartState) {
            var _this = _super.call(this, app, name) || this;
            _this.Axis = data;
            _this.ChartState = chartState;
            return _this;
        }
        AxisPropertiesView.prototype.config = function () {
            var _ = this.app.getService("locale")._;
            this.Charts = this.app.getService("charts");
            var inputs = [
                {
                    label: _("Logarithmic scale"),
                    view: "checkbox",
                    name: "logarithmic",
                    hidden: true,
                },
                {
                    label: _("Title"),
                    view: "text",
                    name: "title",
                },
                {
                    label: _("Color"),
                    view: "colorpicker",
                    name: "color",
                    css: "webix_rpt_colorpicker",
                    suggest: {
                        padding: 0,
                        type: "colorselect",
                        body: {
                            button: true,
                        },
                    },
                },
                {
                    cols: [
                        {
                            labelWidth: 190,
                            label: _("Gridlines"),
                            view: "checkbox",
                            name: "lines",
                        },
                        {
                            view: "colorpicker",
                            name: "lineColor",
                            width: 150,
                            css: "webix_rpt_colorpicker",
                            suggest: {
                                padding: 0,
                                type: "colorselect",
                                body: {
                                    button: true,
                                },
                            },
                        },
                    ],
                },
                {
                    label: _("Vertical labels"),
                    view: "checkbox",
                    name: "verticalLabels",
                    hidden: true,
                },
            ];
            return {
                view: "form",
                borderless: true,
                elementsConfig: {
                    labelAlign: "right",
                    labelWidth: 190,
                },
                visibleBatch: "default",
                rows: inputs,
            };
        };
        AxisPropertiesView.prototype.init = function () {
            var _this = this;
            this.on(this.Axis.$changes, "id", function (id) {
                if (id == "y")
                    _this.ApplyYAxis();
                else
                    _this.ApplyXAxis();
            });
            this.on(this.Axis.$changes, "lines", function (v) {
                var lineColor = _this.getRoot().elements["lineColor"];
                if (v)
                    lineColor.show();
                else
                    lineColor.hide();
            });
            bind(this.Axis, "*", this.getRoot());
        };
        AxisPropertiesView.prototype.ApplyYAxis = function () {
            this.getRoot().elements["logarithmic"].show();
        };
        AxisPropertiesView.prototype.ApplyXAxis = function () {
            this.getRoot().elements["verticalLabels"].show();
        };
        return AxisPropertiesView;
    }(JetView));

    var BaseStructureView = (function (_super) {
        __extends(BaseStructureView, _super);
        function BaseStructureView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        BaseStructureView.prototype.HideField = function (id) {
            this.$$("fields").updateItem(id, { show: false });
            this.SaveOrder();
        };
        BaseStructureView.prototype.ShowField = function (id) {
            this.$$("fields").updateItem(id, { show: true });
            this.SaveOrder();
        };
        BaseStructureView.prototype.HideAllEditors = function (id, name) {
            var _this = this;
            if (!name)
                name = "fields";
            if (this._ActiveEditor[name])
                this.$$(name).closeSub(this._ActiveEditor[name]);
            this._ActiveEditor[name] = id;
            if (id) {
                webix.delay(function () {
                    return _this.$$(name)
                        .getSubView(id)
                        .focus();
                }, null, null, 100);
            }
        };
        BaseStructureView.prototype.ResetEditor = function (name) {
            this._ActiveEditor[name || "fields"] = null;
        };
        BaseStructureView.prototype.ToggleSub = function (id, name) {
            var table = this.$$(name || "fields");
            var row = table.getItem(id);
            if (row.$subopen)
                table.closeSub(id);
            else
                table.openSub(id);
        };
        BaseStructureView.prototype.SaveOrder = function () { };
        return BaseStructureView;
    }(JetView));

    var ColorPopupView = (function (_super) {
        __extends(ColorPopupView, _super);
        function ColorPopupView(app, name, state) {
            var _this = _super.call(this, app, name) || this;
            _this.State = state;
            _this.Id = null;
            return _this;
        }
        ColorPopupView.prototype.config = function () {
            var _this = this;
            return {
                view: "popup",
                body: {
                    view: "colorselect",
                    button: true,
                    on: {
                        onColorSelect: function (color) {
                            var s = _this.GetSeries(_this.Id);
                            if (s)
                                s.meta.color = color;
                            _this.State.updatedSeries = _this.Id;
                            _this.getRoot().close();
                        },
                    },
                },
            };
        };
        ColorPopupView.prototype.Show = function (node, id) {
            var popup = this.getRoot();
            this.Id = id;
            popup.show(node);
            popup.getBody().setValue(this.GetSeries(id).meta.color);
        };
        ColorPopupView.prototype.GetSeries = function (id) {
            return this.State.series.find(function (s) { return s.id == id; });
        };
        return ColorPopupView;
    }(JetView));

    webix.protoUI({
        name: "text-search",
        $cssName: "search",
        defaults: {
            closeIcon: "wxi-close",
            template: function (obj, common) {
                var text = common.$renderInput(obj);
                if (obj.badge || obj.badge === 0)
                    text = text.replace(new RegExp("</div>$"), "<span class='webix_badge'>" + obj.badge + "</span></div>");
                return text;
            },
        },
        on_click: {
            webix_input_icon: function (e) {
                var css = e.target.className;
                this.getInputNode().focus();
                if (css.indexOf(this.config.closeIcon) > -1) {
                    this.setValue("");
                    this.callEvent("onCloseIconClick", [e]);
                    this.hideCloseIcon();
                }
                else {
                    this.callEvent("onSearchIconClick", [e]);
                }
            },
        },
        $init: function () {
            var _this = this;
            this.attachEvent("onTimedKeyPress", function () { return _this._onSearch(); });
            this.attachEvent("onChange", function () { return _this._onSearch(); });
        },
        _onSearch: function () {
            var v = this.getValue();
            if (v)
                this.showCloseIcon();
            else
                this.hideCloseIcon();
            this.callEvent("onSearchChange", [v]);
        },
        setIcon: function (icon) {
            var nodes = this.$view.getElementsByClassName("webix_input_icon");
            if (nodes.length)
                nodes[0].className = "webix_input_icon " + icon;
        },
        showCloseIcon: function () {
            this.setIcon(this.config.closeIcon);
        },
        hideCloseIcon: function () {
            this.setIcon(this.config.icon);
        },
        setBadge: function (value) {
            var node = this.$view.querySelector(".webix_badge");
            if (value || value === 0) {
                if (!node) {
                    node = webix.html.create("SPAN", { class: "webix_badge" }, "" + value);
                    this.$view.querySelector(".webix_el_box").appendChild(node);
                }
                else
                    node.innerHTML = "" + value;
            }
            else if (node)
                webix.html.remove(node);
            this.config.badge = value;
        },
    }, webix.ui.search);

    var SeriesPropertiesView = (function (_super) {
        __extends(SeriesPropertiesView, _super);
        function SeriesPropertiesView(app, name, data, chartState) {
            var _this = _super.call(this, app, name) || this;
            _this.Series = data;
            _this.ChartState = chartState;
            return _this;
        }
        SeriesPropertiesView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            this.Charts = this.app.getService("charts");
            var inputs = [
                {
                    labelAlign: "right",
                    label: _("Title"),
                    view: "text",
                    name: "name",
                },
                {
                    labelAlign: "right",
                    label: _("Color"),
                    view: "colorpicker",
                    name: "color",
                    css: "webix_rpt_colorpicker",
                    suggest: {
                        padding: 0,
                        type: "colorselect",
                        body: {
                            button: true,
                        },
                    },
                },
                {
                    labelAlign: "right",
                    label: _("Marker type"),
                    view: "richselect",
                    css: "webix_rpt_markerselect",
                    name: "markerType",
                    options: {
                        padding: 0,
                        body: {
                            css: "webix_rpt_markerselect_list",
                            template: function (item) { return _this.ItemListTemplate(item); },
                            data: this.Charts.getItemTypes(),
                        },
                    },
                    batch: "marker",
                },
                {
                    labelAlign: "right",
                    label: _("Fill marker"),
                    view: "checkbox",
                    name: "fillMarker",
                    batch: "marker",
                },
            ];
            return {
                view: "form",
                borderless: true,
                elementsConfig: {
                    labelWidth: 170,
                },
                visibleBatch: "default",
                rows: inputs,
            };
        };
        SeriesPropertiesView.prototype.init = function () {
            bind(this.Series, "*", this.getRoot());
            if (this.Charts.itemSupport.indexOf(this.ChartState.chartType) > -1)
                this.getRoot().showBatch("marker");
        };
        SeriesPropertiesView.prototype.ItemListTemplate = function (item) {
            return "<div class=\"webix_rpt_config_row\">" + item.value + " <span class='webix_icon " + item.icon + "' style='color:" + this.Series.color + "'></span></div>";
        };
        return SeriesPropertiesView;
    }(JetView));

    var ChartView$1 = (function (_super) {
        __extends(ChartView, _super);
        function ChartView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ChartView.prototype.config = function () {
            var _this = this;
            var _ = (this._ = this.app.getService("locale")._);
            this.Charts = this.app.getService("charts");
            this.Local = this.app.getService("local");
            this._ActiveEditor = {};
            var type = {
                rows: [
                    { view: "label", label: this._("Chart type") },
                    {
                        view: "richselect",
                        localId: "type",
                        options: this.Charts.getTypes(),
                        on: {
                            onChange: function (v) { return (_this.ChartState.chartType = v); },
                        },
                    },
                ],
            };
            var labelField = {
                rows: [
                    { view: "label", label: _("X axis column") },
                    {
                        view: "richselect",
                        localId: "labelColumn",
                        options: [],
                        on: {
                            onChange: function (v) { return _this.ChangeLabelField(v); },
                        },
                    },
                ],
            };
            var valueFields = {
                view: "datatable",
                css: "webix_rpt_columns_list",
                localId: "fields",
                borderless: true,
                autoheight: true,
                header: false,
                select: false,
                editable: true,
                subview: function (obj, target) {
                    if (!_this.SubState)
                        _this.SubState = {};
                    var series = (_this.SubState[obj.id] = createState({
                        name: obj.meta.name,
                        color: obj.meta.color,
                        type: obj.meta.type || null,
                        markerType: obj.meta.markerType || null,
                        fillMarker: obj.meta.fillMarker || null,
                    }));
                    _this.on(series.$changes, "*", ignoreInitial(function () {
                        _this.UpdateSeries(obj.id, series);
                    }));
                    var sub = new SeriesPropertiesView(_this.app, "", series, _this.ChartState);
                    _this.ui(sub, { container: target });
                    return sub.getRoot();
                },
                columns: [
                    {
                        fillspace: true,
                        template: function (item, common) { return _this.RowTemplate(item, common); },
                    },
                ],
                drag: "order",
                on: {
                    onItemDblClick: function (id) {
                        this.openSub(id);
                    },
                    onAfterRender: function () {
                        if (_this._hasFocus) {
                            var el = _this._hasFocus;
                            _this._hasFocus = null;
                            if (el && document.contains(el) && el !== document.activeElement)
                                el.focus();
                        }
                    },
                    onAfterDrop: function () { return _this.SaveOrder(); },
                    onSubViewOpen: function (id) { return _this.HideAllEditors(id); },
                    onSubViewClose: function () { return _this.ResetEditor(); },
                },
                onClick: {
                    webix_rpt_chart_color: function (e, id) { return _this.ShowColorPopup(e, id); },
                    "action-visible": function (e, id) { return _this.HideField(id); },
                    "action-hidden": function (e, id) { return _this.ShowField(id); },
                    webix_rpt_config_row_name: function (e, id) { return _this.ToggleSub(id); },
                },
            };
            var axisFields = {
                rows: [
                    { view: "label", label: _("Axes") },
                    {
                        view: "datatable",
                        css: "webix_rpt_columns_list",
                        localId: "axisFields",
                        borderless: true,
                        autoheight: true,
                        header: false,
                        select: false,
                        subview: function (obj, target) {
                            var axis = createState(__assign({ id: obj.id }, obj.meta));
                            _this.on(axis.$changes, "*", ignoreInitial(function () {
                                _this.UpdateAxis(obj.id, axis);
                            }));
                            var sub = new AxisPropertiesView(_this.app, "", axis, _this.ChartState);
                            _this.ui(sub, { container: target });
                            return sub.getRoot();
                        },
                        columns: [
                            {
                                fillspace: true,
                                template: function (item, common) { return _this.AxisRowTemplate(item, common); },
                            },
                        ],
                        on: {
                            onItemClick: function (id) { return _this.ToggleSub(id, "axisFields"); },
                            onAfterRender: function () {
                                if (_this._hasFocus) {
                                    var el = _this._hasFocus;
                                    _this._hasFocus = null;
                                    if (el &&
                                        document.contains(el) &&
                                        el !== document.activeElement)
                                        el.focus();
                                }
                            },
                            onSubViewOpen: function (id) { return _this.HideAllEditors(id, "axisFields"); },
                            onSubViewClose: function () { return _this.ResetEditor("axisFields"); },
                        },
                    },
                ],
            };
            var legendFields = {
                rows: [
                    { view: "label", label: _("Legend") },
                    {
                        view: "radio",
                        localId: "legendPosition",
                        options: [
                            { id: "bottom", value: _("Bottom") },
                            { id: "right", value: _("Right") },
                            { id: "none", value: _("None") },
                        ],
                        on: {
                            onChange: function (v) { return _this.ChangeLegend(v); },
                        },
                    },
                ],
            };
            return {
                view: "form",
                scroll: "auto",
                css: "webix_rpt_chart_config",
                padding: { top: webix.skin.$active.layoutPadding.toolbar },
                rows: [
                    type,
                    labelField,
                    {
                        localId: "dataInputs",
                        rows: this.GetDataInputs(),
                    },
                    valueFields,
                    axisFields,
                    legendFields,
                    {},
                ],
            };
        };
        ChartView.prototype.init = function () {
            var _this = this;
            this.State = this.getParam("state", true);
            this.Types = this.Charts.getTypes();
            var fields = [];
            (this.State.publicFields || this.State.fields).forEach(function (a) {
                fields.push(__assign({}, a));
            });
            this.Fields = fields
                .filter(function (field) {
                return !field.key;
            })
                .sort(function (a, b) { return (a.type < b.type ? 1 : -1); })
                .map(function (a) { return ({ id: a.id, value: a.name, type: a.type }); });
            this.ValueFields = fields
                .filter(function (field) {
                return field.type == "number" && !field.key;
            })
                .map(function (a) { return ({ id: a.id, value: a.name, type: a.type, model: a.model }); });
            this.ChartState = createState(this.GetInitState());
            this.on(this.ChartState.$changes, "*", function () {
                _this.UpdateModuleState();
            });
            this.on(this.ChartState.$changes, "chartType", function (type, prev) {
                _this.ApplyChartType(type, prev);
            });
            this.on(this.ChartState.$changes, "seriesFrom", function (value, prev) {
                _this.ApplySeriesFrom(value, prev);
            });
            this.on(this.ChartState.$changes, "baseColumn", ignoreInitial(function () {
                _this.GenerateSeries();
            }));
            this.on(this.ChartState.$changes, "dataColumn", ignoreInitial(function () {
                _this.GenerateSeries();
            }));
            this.on(this.ChartState.$changes, "updatedSeries", function (v) {
                if (v) {
                    _this.$$("fields").refresh(v);
                    if (_this.SubState && _this.SubState[v])
                        _this.SubState[v].color = _this.ChartState.series.find(function (s) { return s.id == v; }).meta.color;
                    _this.ChartState.updatedSeries = null;
                }
            });
            this.$$("type").setValue(this.ChartState.chartType);
            this.$$("labelColumn")
                .getList()
                .parse(this.Fields);
            this.$$("labelColumn").setValue(this.ChartState.labelColumn);
            this.$$("seriesFrom").setValue(this.ChartState.seriesFrom);
            this.$$("baseColumn")
                .getList()
                .parse(this.Fields);
            this.$$("baseColumn").setValue(this.ChartState.baseColumn);
            this.$$("dataColumn")
                .getList()
                .parse(this.ValueFields);
            this.$$("dataColumn").setValue(this.ChartState.dataColumn);
            this.$$("legendPosition").setValue(this.ChartState.legendPosition);
        };
        ChartView.prototype.ChangeLabelField = function (label) {
            this.ChartState.labelColumn = label;
        };
        ChartView.prototype.ChangeLegend = function (v) {
            this.ChartState.legendPosition = v;
        };
        ChartView.prototype.GetInitState = function () {
            var meta = this.State.meta.chart || {};
            return {
                chartType: meta.chartType || this.Charts.type,
                labelColumn: meta.labelColumn || null,
                updatedSeries: null,
                seriesFrom: meta.seriesFrom || "columns",
                baseColumn: meta.baseColumn || null,
                dataColumn: meta.dataColumn || null,
                series: meta.series || null,
                legend: meta.legend || { layout: "x" },
                axises: meta.axises || null,
                legendPosition: meta.legendPosition || "bottom",
            };
        };
        ChartView.prototype.ApplyChartType = function (type, prevType) {
            this.ShowAxisInputs(type);
            this.RenderSeries(prevType);
        };
        ChartView.prototype.RenderSeries = function (prevType) {
            var series = this.ChartState.series;
            if (series && typeof prevType == "undefined")
                this.LoadSeries(series);
            else
                this.GenerateSeries();
        };
        ChartView.prototype.ShowAxisInputs = function (type) {
            var isAxises = this.Charts.noAxisSupport.indexOf(type);
            if (isAxises) {
                if (!this.ChartState.axises) {
                    this.ChartState.axises = {
                        x: {
                            title: "",
                            color: "#edeff0",
                            lineColor: "#edeff0",
                            lines: true,
                            verticalLabels: true,
                        },
                        y: {
                            title: "",
                            color: "#edeff0",
                            lineColor: "#edeff0",
                            lines: true,
                            logarithmic: false,
                        },
                    };
                }
                if (!this.$$("axisFields").data.count())
                    this.$$("axisFields").parse([
                        { id: "x", meta: __assign({}, this.ChartState.axises.x) },
                        { id: "y", meta: __assign({}, this.ChartState.axises.y) },
                    ]);
            }
            else {
                this.ChartState.axises = null;
                this.$$("axisFields").clearAll();
            }
        };
        ChartView.prototype.GetDataInputs = function () {
            var _this = this;
            return [
                {
                    rows: [
                        { view: "label", label: this._("Data series") },
                        {
                            cols: [
                                {
                                    rows: [
                                        {
                                            view: "label",
                                            label: this._("Extract series from"),
                                            css: "webix_rpt_subtitle",
                                        },
                                        {
                                            view: "radio",
                                            width: 200,
                                            localId: "seriesFrom",
                                            options: [
                                                { id: "columns", value: this._("columns") },
                                                { id: "rows", value: this._("rows") },
                                            ],
                                            on: {
                                                onChange: function (v) { return (_this.ChartState.seriesFrom = v); },
                                            },
                                        },
                                    ],
                                },
                                {
                                    hidden: true,
                                    localId: "baseColumnLayout",
                                    margin: webix.skin.$active.layoutMargin.form,
                                    cols: [
                                        {
                                            rows: [
                                                {
                                                    view: "label",
                                                    label: this._("Keys column"),
                                                    css: "webix_rpt_subtitle",
                                                },
                                                {
                                                    view: "richselect",
                                                    css: "webix_rpt_subtitle",
                                                    localId: "baseColumn",
                                                    options: [],
                                                    labelPosition: "top",
                                                    on: {
                                                        onChange: function (v) { return (_this.ChartState.baseColumn = v); },
                                                    },
                                                },
                                            ],
                                        },
                                        {
                                            rows: [
                                                {
                                                    view: "label",
                                                    label: this._("Values column"),
                                                    css: "webix_rpt_subtitle",
                                                },
                                                {
                                                    view: "richselect",
                                                    css: "webix_rpdataColumnt_subtitle",
                                                    localId: "dataColumn",
                                                    options: [],
                                                    on: {
                                                        onChange: function (v) { return (_this.ChartState.dataColumn = v); },
                                                    },
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ];
        };
        ChartView.prototype.ApplySeriesKeys = function (sourceArray) {
            var _this = this;
            var data = [];
            var colorIndex = 0;
            sourceArray.forEach(function (field) {
                var series = {
                    id: field.id,
                    name: field.value,
                    model: field.model || null,
                    show: true,
                    meta: {
                        name: field.value,
                        color: _this.Charts.colors[colorIndex] || _this.Charts.colors[0],
                    },
                };
                colorIndex++;
                if (_this.Charts.itemSupport.indexOf(_this.ChartState.type) != -1) {
                    series.meta.markerType = "r";
                    series.meta.fillMarker = false;
                }
                data.push(series);
            });
            this.ChartState.series = data;
            this.LoadSeries(data);
        };
        ChartView.prototype.LoadSeries = function (data) {
            if (!data.length)
                this.$$("fields").hide();
            else
                this.$$("fields").show();
            this.$$("fields").clearAll();
            this.$$("fields").parse(data);
        };
        ChartView.prototype.GetRowKeys = function (base) {
            if (base && this.State.columns.length) {
                var keys_1 = [];
                return this.GetData(base).then(function (_a) {
                    var data = _a[0], baseOptions = _a[1];
                    data.forEach(function (row) {
                        var key = row[base];
                        if (keys_1.indexOf(key) == -1)
                            keys_1.push(key);
                    });
                    if (baseOptions)
                        return keys_1.map(function (key) {
                            var keyOption = baseOptions.data.find(function (option) { return option.id == key; }) || null;
                            return { id: key, value: keyOption ? keyOption.value : key };
                        });
                    return keys_1.map(function (key) { return ({ id: key, value: key }); });
                });
            }
            else
                return Promise.resolve([]);
        };
        ChartView.prototype.GenerateSeries = function () {
            var _this = this;
            var from = this.ChartState.seriesFrom;
            if (from == "columns")
                this.ApplySeriesKeys(__spreadArrays(this.ValueFields), null);
            else {
                this.ChartState.dataColumn = this.$$("dataColumn").getValue();
                var base_1 = (this.ChartState.baseColumn = this.$$("baseColumn").getValue());
                this.GetRowKeys(base_1).then(function (arr) { return _this.ApplySeriesKeys(arr, base_1); });
            }
        };
        ChartView.prototype.ApplySeriesFrom = function (v, prevValue) {
            if (this.$$("baseColumnLayout")) {
                if (v == "columns") {
                    this.$$("baseColumnLayout").hide();
                    this.$$("baseColumn").setValue(null);
                }
                else
                    this.$$("baseColumnLayout").show();
                if (prevValue) {
                    this.GenerateSeries();
                }
            }
        };
        ChartView.prototype.UpdateSeries = function (id, update) {
            this._hasFocus = document.activeElement;
            var series = __spreadArrays(this.ChartState.series);
            var ind = series.findIndex(function (a) { return a.id == id; });
            Object.assign(series[ind].meta, update);
            this.ChartState.series = series;
            this.$$("fields").refresh(id);
        };
        ChartView.prototype.UpdateAxis = function (id, update) {
            this._hasFocus = document.activeElement;
            var axises = __assign({}, this.ChartState.axises);
            Object.assign(axises[id], update);
            this.ChartState.axises = axises;
        };
        ChartView.prototype.RowTemplate = function (item, common) {
            var html = "<div class='webix_rpt_config_row'><div class='webix_icon rpi-drag-vertical'></div>";
            html +=
                "<span class='webix_icon " +
                    (item.show
                        ? "action-visible rpi-eye"
                        : "action-hidden rpi-eye-off-outline") +
                    "'></span>";
            html +=
                "<div class='webix_rpt_chart_color' style='background:" +
                    item.meta.color +
                    "'> </div>";
            html +=
                "<div class='webix_rpt_config_row_name'>" +
                    item.name +
                    (item.model
                        ? "<span class='webix_rpt_sources_path'>" + item.model + "</span>"
                        : "") +
                    "</div>";
            html += common.subrow(item, common);
            return html + "</div>";
        };
        ChartView.prototype.GetData = function (baseColumn) {
            var appState = this.app.getParam("state");
            var moduleConfig = this.Local.getDataConfig(appState.module);
            moduleConfig.columns = this.State.columns.map(function (c) { return c.id; });
            var waitData = [this.Local.getData(moduleConfig)];
            if (baseColumn)
                waitData.push(this.Local.getOptionsList(baseColumn));
            return Promise.all(waitData);
        };
        ChartView.prototype.ShowColorPopup = function (e, id) {
            if (!this.ColorPopup || !this.ColorPopup.$view)
                this.ColorPopup = this.ui(new ColorPopupView(this.app, "", this.ChartState));
            this.ActiveSeries = id;
            this.ColorPopup.Show(e.target, id);
        };
        ChartView.prototype.SaveOrder = function () {
            var _this = this;
            var table = this.$$("fields");
            var columns = [];
            table.data.each(function (a) {
                if (a.show)
                    columns.push((_this.State.publicFields || _this.State.fields).find(function (b) { return b.id === a.id; }));
            });
            this.ChartState.series = table.serialize();
        };
        ChartView.prototype.UpdateModuleState = function () {
            var _this = this;
            var state = this.ChartState;
            var columns = [];
            if (state.labelColumn)
                this.AddColumn(columns, state.labelColumn);
            if (state.seriesFrom == "columns") {
                if (state.series)
                    state.series.forEach(function (a) {
                        if (a.show)
                            _this.AddColumn(columns, a.id);
                    });
            }
            else {
                if (state.baseColumn)
                    this.AddColumn(columns, state.baseColumn);
                if (state.dataColumn)
                    this.AddColumn(columns, state.dataColumn);
            }
            this.State.$batch({
                columns: columns,
                meta: __assign(__assign({}, this.State.meta), { chart: this.ChartState }),
            });
        };
        ChartView.prototype.AddColumn = function (columns, id) {
            var col = (this.State.publicFields || this.State.fields).find(function (b) { return b.id === id; });
            if (col)
                columns.push(col);
        };
        ChartView.prototype.AxisRowTemplate = function (item, common) {
            var html = "<div class='webix_rpt_config_row'>" +
                this._(item.id == "x" ? "X Axis" : "Y Axis");
            html += common.subrow(item, common);
            return html + "</div>";
        };
        return ChartView;
    }(BaseStructureView));

    var ColumnPropertiesView = (function (_super) {
        __extends(ColumnPropertiesView, _super);
        function ColumnPropertiesView(app, name, data) {
            var _this = _super.call(this, app, name) || this;
            _this.Column = data;
            return _this;
        }
        ColumnPropertiesView.prototype.config = function () {
            var _ = this.app.getService("locale")._;
            var inputs = [
                {
                    labelAlign: "right",
                    label: _("Title"),
                    view: "text",
                    name: "name",
                },
                {
                    labelAlign: "right",
                    label: _("Filter"),
                    view: "richselect",
                    name: "header",
                    options: [
                        { id: "none", value: "None" },
                        { id: "text", value: "Text" },
                        { id: "select", value: "Select" },
                    ],
                },
            ];
            return {
                view: "form",
                borderless: true,
                elementsConfig: {
                    labelWidth: 120,
                },
                rows: inputs,
            };
        };
        ColumnPropertiesView.prototype.init = function () {
            bind(this.Column, "*", this.getRoot());
        };
        return ColumnPropertiesView;
    }(JetView));

    var ChartView$2 = (function (_super) {
        __extends(ChartView, _super);
        function ChartView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ChartView.prototype.config = function () {
            var _ = (this._ = this.app.getService("locale")._);
            var labelField = {
                rows: [
                    { view: "label", label: _("Labels column") },
                    {
                        view: "richselect",
                        name: "label",
                        options: [],
                    },
                ],
            };
            var valueField = {
                rows: [
                    { view: "label", label: _("Values column") },
                    {
                        view: "richselect",
                        name: "value",
                        options: [],
                    },
                ],
            };
            var colorField = {
                rows: [
                    { view: "label", label: _("Color column") },
                    {
                        view: "richselect",
                        name: "color",
                        options: [],
                    },
                ],
            };
            return {
                view: "form",
                scroll: false,
                padding: { top: webix.skin.$active.layoutPadding.toolbar },
                rows: [valueField, labelField, colorField, {}],
            };
        };
        ChartView.prototype.init = function () {
            var _this = this;
            this.State = this.getParam("state", true);
            this.Local = this.app.getService("local");
            var fields = (this.Fields = (this.State.publicFields || this.State.fields).map(function (a) { return (__assign({}, a)); }));
            var valueFields = fields.filter(function (field) { return field.type == "number"; });
            var els = this.getRoot().elements;
            var lc = els.label;
            lc.getList().parse(fields);
            lc.getList().type.template = function (obj) { return _this.ListTemplate(obj); };
            lc.setValue(this.State.meta.label || fields[0].id);
            var vc = els.value;
            vc.getList().parse(valueFields);
            vc.getList().type.template = function (obj) { return _this.ListTemplate(obj); };
            vc.setValue(this.State.meta.value || valueFields[0].id);
            var cc = els.color;
            cc.getList().parse(valueFields);
            cc.getList().type.template = function (obj) { return _this.ListTemplate(obj); };
            cc.setValue(this.State.meta.color || valueFields[0].id);
            this.getRoot().attachEvent("onChange", function () { return _this.OnChange(); });
            if (!this.State.meta.value)
                this.OnChange();
        };
        ChartView.prototype.OnChange = function () {
            this.Apply(__assign(__assign({}, this.State.meta), this.getRoot().getValues()));
        };
        ChartView.prototype.Apply = function (meta) {
            var check = [meta.value, meta.label, meta.color];
            var columns = this.Fields.filter(function (a) { return check.indexOf(a.id) !== -1; });
            this.State.$batch({
                meta: meta,
                columns: columns,
            });
        };
        ChartView.prototype.ListTemplate = function (obj) {
            return (obj.name +
                (obj.model
                    ? "<span class='webix_rpt_sources_path'>" + obj.model + "</span>"
                    : ""));
        };
        return ChartView;
    }(BaseStructureView));

    var StructureView = (function (_super) {
        __extends(StructureView, _super);
        function StructureView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        StructureView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            var tabbar = {
                view: "richselect",
                localId: "select",
                borderless: true,
                align: "left",
                inputWidth: 170,
                options: [
                    {
                        id: "table",
                        value: types.table + " " + _("Table"),
                    },
                    {
                        id: "chart",
                        value: types.chart + " " + _("Chart"),
                    },
                    {
                        id: "heatmap",
                        value: types.heatmap + " " + _("Heatmap"),
                    },
                ],
                on: {
                    onChange: function (v) { return _this.ChangeReportType(v); },
                },
            };
            var toolbar = {
                view: "form",
                padding: {
                    left: webix.skin.$active.layoutPadding.form,
                    top: 5,
                    bottom: 0,
                },
                scroll: false,
                cols: [tabbar],
            };
            var ui = {
                width: 480,
                hidden: false,
                localId: "settings",
                type: "clean",
                rows: [toolbar, { $subview: true }],
            };
            this.Local = this.app.getService("local");
            return ui;
        };
        StructureView.prototype.init = function () {
            var _this = this;
            this.State = this.getParam("state", true);
            this.on(this.State.$changes, "type", function (v) {
                _this.show("editor.structure." + v);
            });
            this.$$("select").setValue(this.State.type);
        };
        StructureView.prototype.ChangeReportType = function (type) {
            if (this.State.type != type)
                this.State.$batch({ type: type, meta: {} });
        };
        return StructureView;
    }(JetView));

    var ColumnsView = (function (_super) {
        __extends(ColumnsView, _super);
        function ColumnsView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ColumnsView.prototype.config = function () {
            var _this = this;
            var _ = (this._ = this.app.getService("locale")._);
            this._ActiveEditor = {};
            var header = {
                padding: { top: webix.skin.$active.layoutPadding.toolbar },
                rows: [
                    { view: "label", label: _("Columns") },
                    {
                        view: "text-search",
                        localId: "search",
                        on: {
                            onSearchChange: function () { return _this.FilterFields(); },
                        },
                    },
                ],
            };
            var fields = {
                view: "datatable",
                css: "webix_rpt_columns_list",
                localId: "fields",
                borderless: true,
                autoheight: true,
                header: false,
                select: false,
                subview: function (obj, target) {
                    var column = createState({
                        name: obj.meta.name || obj.name,
                        header: obj.meta.header || "none",
                    });
                    _this.on(column.$changes, "*", ignoreInitial(function () {
                        _this.Update(obj.id, column);
                    }));
                    var sub = new ColumnPropertiesView(_this.app, "", column);
                    _this.ui(sub, { container: target });
                    return sub.getRoot();
                },
                columns: [
                    {
                        fillspace: true,
                        template: function (item, common) { return _this.RowTemplate(item, common); },
                    },
                ],
                drag: "order",
                on: {
                    onItemDblClick: function (id) {
                        if (id.row !== "$freeze")
                            this.openSub(id);
                    },
                    onBeforeDrag: function (ctx) {
                        _this.HideAllEditors();
                        var list = _this.$$("fields");
                        webix.html.addCss(list.$view, "webix_rpt_drag");
                        if (ctx.start === "$freeze") {
                            ctx.html = "<div class=\"webix_drag_zone\"><div class=\"webix_dd_drag wbx-mark_frozen\" style=\"width:" + list.$width + "px;\"><div>" + _this.FrozenTemplate() + "</div></div></div>";
                        }
                        else if (!list.getItem(ctx.start).show)
                            return false;
                    },
                    onAfterRender: function () {
                        if (_this._hasFocus) {
                            var el = _this._hasFocus;
                            _this._hasFocus = null;
                            if (el && document.contains(el) && el !== document.activeElement)
                                el.focus();
                        }
                    },
                    onAfterDrop: function () {
                        webix.html.removeCss(_this.$$("fields").$view, "webix_rpt_drag");
                        _this.SaveOrder();
                    },
                    onSubViewOpen: function (id) { return _this.HideAllEditors(id); },
                    onSubViewClose: function () { return _this.ResetEditor(); },
                },
                onClick: {
                    "action-visible": function (e, id) { return _this.HideField(id); },
                    "action-hidden": function (e, id) { return _this.ShowField(id); },
                    webix_rpt_config_row_name: function (e, id) { return _this.ToggleSub(id); },
                },
            };
            return {
                view: "form",
                scroll: "auto",
                padding: { top: webix.skin.$active.layoutPadding.toolbar },
                rows: [header, fields],
            };
        };
        ColumnsView.prototype.init = function () {
            this.State = this.getParam("state", true);
            var table = this.$$("fields");
            var has = {};
            var columns = this.State.columns.map(function (a) {
                has[a.id] = 1;
                return __assign(__assign({}, a), { show: true });
            });
            (this.State.publicFields || this.State.fields).forEach(function (a) {
                if (!has[a.id])
                    columns.push(__assign(__assign({}, a), { show: false }));
            });
            columns.splice(this.State.meta.freeze || 0, 0, {
                id: "$freeze",
                $css: "wbx-mark_frozen",
                name: this.FrozenTemplate(),
            });
            table.parse(columns);
        };
        ColumnsView.prototype.FilterFields = function () {
            var f = this.$$("search")
                .getValue()
                .toLowerCase();
            this.$$("fields").filter(function (a) { return a.name.toLowerCase().indexOf(f) !== -1; });
        };
        ColumnsView.prototype.Update = function (id, update) {
            this._hasFocus = document.activeElement;
            var columns = __spreadArrays(this.State.columns);
            var ind = columns.findIndex(function (a) { return a.id == id; });
            Object.assign(columns[ind].meta, update);
            this.State.$batch({
                columns: columns,
                meta: __assign(__assign({}, this.State.meta), { freeze: this.GetFreeze() }),
            });
        };
        ColumnsView.prototype.GetFreeze = function () {
            var table = this.$$("fields");
            var order = table.data.order;
            var freezeColumn = 0;
            for (var i = 0; i < order.length; i++) {
                if (order[i] === "$freeze")
                    break;
                freezeColumn += table.getItem(order[i]).show ? 1 : 0;
            }
            return freezeColumn;
        };
        ColumnsView.prototype.SaveOrder = function () {
            var _this = this;
            var table = this.$$("fields");
            var columns = [];
            table.data.each(function (a) {
                if (a.show)
                    columns.push((_this.State.publicFields || _this.State.fields).find(function (b) { return b.id === a.id; }));
            });
            this.State.$batch({
                columns: columns,
                meta: __assign(__assign({}, this.State.meta), { freeze: this.GetFreeze() }),
            });
        };
        ColumnsView.prototype.FrozenTemplate = function () {
            return ("<span class='webix_rpt_frozen webix_icon rpi-arrow-horizontal-lock'></span><span>" +
                this._("Frozen columns above") +
                "</span>");
        };
        ColumnsView.prototype.RowTemplate = function (item, common) {
            var html = "<div class='webix_rpt_config_row'><div class='webix_icon rpi-drag-vertical'></div>";
            html +=
                item.id !== "$freeze"
                    ? "<span class='webix_icon " +
                        (item.show
                            ? "action-visible rpi-eye"
                            : "action-hidden rpi-eye-off-outline") +
                        "'></span>"
                    : "";
            html +=
                "<div class='webix_rpt_config_row_name'>" +
                    item.name +
                    (item.model
                        ? "<span class='webix_rpt_sources_path'>" + item.model + "</span>"
                        : "") +
                    "</div>";
            html += item.id !== "$freeze" ? common.subrow(item, common) : "";
            return html + "</div>";
        };
        return ColumnsView;
    }(BaseStructureView));

    var EmptyView = (function (_super) {
        __extends(EmptyView, _super);
        function EmptyView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        EmptyView.prototype.config = function () {
            var _this = this;
            return {
                css: "webix_rpt_empty",
                view: "template",
                borderless: true,
                template: function (value) { return _this.GetTemplate(value); },
            };
        };
        EmptyView.prototype.init = function () {
            var _this = this;
            var mods = this.app.getService("local").getModules();
            mods.waitData.then(function () {
                var text = _this.GetText(mods.data.count());
                _this.getRoot().setValues({ text: text });
            });
        };
        EmptyView.prototype.GetText = function (count) {
            var _ = this.app.getService("locale")._;
            return count
                ? _("Select any report from the list")
                : _("Click 'New' button to add a new report");
        };
        EmptyView.prototype.GetSVG = function () {
            return "<svg  xmlns='http://www.w3.org/2000/svg' viewBox='0 0 390 320'><defs><style>.cls-1{fill:#9dbabf;fill-opacity:0.25;}.cls-2{fill:#edeff0;}.cls-3{fill:#b4dfea;}.cls-4{fill:#fafbff;}.cls-5{fill:#dedede;}.cls-6{fill:#f2f2f2;}.cls-7{fill:#fff;}.cls-8{fill:#00d1eb;}.cls-9{fill:#f4f5f9;}</style></defs><path class='cls-1' d='M369.51,182.77c-23.18-52.39,32-103.23,13.74-148.28s-77.61-39.42-162.07-20S78.47-6.35,34.66,14.46c-29.39,14-27.27,58.82-5,107,38.95,84.29-51.86,117.32-24.38,166s118.91-.95,183.37,4.22c37.62.59,62.88,6.26,109.52,21.27C387.63,341.7,412.41,279.75,369.51,182.77Z'/><rect class='cls-2' x='111.53' y='226.04' width='212.47' height='0.91'/><rect class='cls-3' x='97' y='89.51' width='212' height='151.96'/><rect class='cls-4' x='67' y='159.96' width='136.33' height='81.98' rx='2'/><polygon class='cls-5' points='199.32 235.55 72.61 235.55 72.61 165.28 71.01 165.28 71.01 235.55 71.01 237.68 71.01 237.68 72.61 237.68 72.61 237.68 199.32 237.68 199.32 235.55'/><rect class='cls-6' x='84.64' y='165.28' width='0.8' height='68.14'/><rect class='cls-6' x='97.47' y='165.28' width='0.8' height='68.14'/><rect class='cls-6' x='110.3' y='165.28' width='0.8' height='68.14'/><rect class='cls-6' x='123.14' y='165.28' width='0.8' height='68.14'/><rect class='cls-6' x='135.97' y='165.28' width='0.8' height='68.14'/><rect class='cls-6' x='148.8' y='165.28' width='0.8' height='68.14'/><rect class='cls-6' x='161.63' y='165.28' width='0.8' height='68.14'/><rect class='cls-6' x='174.46' y='165.28' width='0.8' height='68.14'/><rect class='cls-6' x='187.29' y='165.28' width='0.8' height='68.14'/><rect class='cls-7' x='111.53' y='94.41' width='212.47' height='132.54'/><rect class='cls-8' x='111.53' y='109.85' width='212.47' height='0.91'/><path class='cls-9' d='M111.53,94.41H324v15.44H111.53Z'/><path class='cls-7' d='M111.53,79H324V94.41H111.53Z'/><path class='cls-2' d='M324,125.28v-.91H287.68V109.84h-.91v14.53H250.45V109.84h-.91v14.53H213.22V109.84h-.9v14.53H176V109.85h-.91v14.52H111.53v.91h63.56v13.61H111.53v.91h63.56v13.62H111.53v.91h63.56v13.61H111.53v.91h63.56v13.62H111.53v.91h63.56V197H111.53v.91h63.56v13.62H111.53v.9h63.56V227H176V212.42h36.32V227h.9V212.42h36.32V227h.91V212.42h36.32V227h.91V212.42H324v-.9H287.68V197.9H324V197H287.68V183.38H324v-.91H287.68V168.85H324v-.91H287.68V154.33H324v-.91H287.68V139.8H324v-.91H287.68V125.28Zm-74.46,0v13.61H213.22V125.28Zm-36.32,57.19V168.85h36.32v13.62Zm36.32.91V197H213.22V183.38Zm-36.32-15.44V154.33h36.32v13.61Zm0-14.52V139.8h36.32v13.62ZM176,125.28h36.32v13.61H176Zm0,14.52h36.32v13.62H176Zm0,14.53h36.32v13.61H176Zm0,14.52h36.32v13.62H176Zm0,14.53h36.32V197H176Zm0,28.14V197.9h36.32v13.62Zm37.22,0V197.9h36.32v13.62Zm73.55,0H250.45V197.9h36.32Zm0-14.53H250.45V183.38h36.32Zm0-14.52H250.45V168.85h36.32Zm0-14.53H250.45V154.33h36.32Zm0-14.52H250.45V139.8h36.32Zm0-14.53H250.45V125.28h36.32Z'/><rect class='cls-2' x='175.09' y='94.41' width='0.91' height='15.43'/><rect class='cls-2' x='212.32' y='94.41' width='0.91' height='15.43'/><rect class='cls-2' x='249.54' y='94.41' width='0.91' height='15.43'/><rect class='cls-2' x='286.77' y='94.41' width='0.91' height='15.43'/><rect class='cls-9' x='118.79' y='84.43' width='21.79' height='5.45'/><rect class='cls-9' x='250.45' y='84.43' width='66.28' height='5.45'/></svg>";
        };
        EmptyView.prototype.GetTemplate = function (value) {
            var text = "<div class='webix_rpt_empty_placeholder'>" +
                (value.text || "") +
                "</div>";
            return text + this.GetSVG();
        };
        return EmptyView;
    }(JetView));

    var ChartView$3 = (function (_super) {
        __extends(ChartView, _super);
        function ChartView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ChartView.prototype.config = function () {
            var page = {
                type: "wide",
                margin: 5,
                cols: [{}],
            };
            return page;
        };
        ChartView.prototype.init = function () {
            this.State = this.getParam("state", true);
            this.Charts = this.app.getService("charts");
            this.Local = this.app.getService("local");
        };
        ChartView.prototype.ready = function () {
            var _this = this;
            this.Host = this.getRoot();
            this.on(this.State.$changes, "module", function (mod) { return _this.Show(mod); });
        };
        ChartView.prototype.Show = function (mod) {
            var _this = this;
            var host = this.Host;
            if (mod && mod.meta.value && mod.type === "heatmap") {
                var config_1 = this.GetChartConfig(mod);
                if (!config_1.view)
                    return;
                this.GetChartData(mod).then(function (_a) {
                    var data = _a[0];
                    config_1.data = data;
                    if (data.length && mod.meta.color)
                        config_1.type.cssClass = _this.CssFactory(data, mod.meta.color);
                    webix.ui([config_1], host);
                    _this.Chart = host.getChildViews()[0];
                });
            }
            else {
                webix.ui([{ template: " " }], host);
                this.Chart = null;
            }
        };
        ChartView.prototype.GetChartConfig = function (mod) {
            var meta = mod.meta, columns = mod.columns;
            var obj = {
                view: "treemap",
                css: "webix_rpt",
                value: function (obj) { return obj[meta.value]; },
                tooltip: this.TooltipFactory(meta, columns),
                type: {},
            };
            if (meta.label)
                obj.type.template = function (obj) { return obj[meta.label]; };
            return obj;
        };
        ChartView.prototype.GetChartData = function (mod) {
            return Promise.all([
                this.Local.getData(this.Local.getDataConfig(mod), this.State.mode == "edit"),
                this.Local.getOptions(mod.columns),
            ]);
        };
        ChartView.prototype.CssFactory = function (data, prop) {
            var min = Infinity;
            var max = -Infinity;
            for (var i = 0; i < data.length; i++) {
                var v = data[i][prop];
                if (v > max)
                    max = v * 1;
                if (v < min)
                    min = v * 1;
            }
            var step = (max - min) / 4;
            var bases = [max - step, max - step * 2, max - step * 3, min];
            return function (obj) {
                var v = obj[prop];
                for (var i = 0; i < bases.length; i++)
                    if (v >= bases[i])
                        return "l" + i;
            };
        };
        ChartView.prototype.TooltipFactory = function (obj, columns) {
            var valueColumn = columns.find(function (a) { return a.id === obj.value; });
            var colorColumn = columns.find(function (a) { return a.id === obj.color; });
            if (!valueColumn || !colorColumn)
                return "";
            var props = [obj.value, valueColumn.name];
            if (obj.color && obj.color != obj.value)
                props.push(obj.color, colorColumn.name);
            return function (obj) {
                var out = "";
                for (var i = 0; i < props.length; i += 2) {
                    out += (i ? ", " : "") + props[i + 1] + ": " + obj[props[i]];
                }
                return out;
            };
        };
        return ChartView;
    }(JetView));

    var MenuPopup = (function (_super) {
        __extends(MenuPopup, _super);
        function MenuPopup() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MenuPopup.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            return {
                view: "popup",
                padding: 0,
                point: false,
                body: {
                    view: "list",
                    borderless: true,
                    css: "webix_rpt_popup_menu",
                    template: function (obj) {
                        return "<span class='webix_icon " + obj.icon + "'></span>" + obj.value;
                    },
                    width: 160,
                    autoheight: true,
                    data: [
                        {
                            value: _("Edit"),
                            id: "edit",
                            icon: "rpi-square-edit-outline",
                        },
                        {
                            value: _("Create copy"),
                            id: "copy",
                            icon: "rpi-content-copy",
                        },
                        {
                            value: _("Delete"),
                            id: "delete",
                            icon: "rpi-delete",
                        },
                    ],
                    on: {
                        onItemClick: function (id) {
                            _this.app.callEvent("onMenuAction", [_this.ID, id]);
                            _this.getRoot().hide();
                        },
                    },
                },
            };
        };
        MenuPopup.prototype.init = function () { };
        MenuPopup.prototype.Show = function (trg, id) {
            var _this = this;
            this.ID = id;
            webix.delay(function () {
                if (_this.getRoot())
                    _this.getRoot().show(trg);
            });
        };
        return MenuPopup;
    }(JetView));

    var GridsView = (function (_super) {
        __extends(GridsView, _super);
        function GridsView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        GridsView.prototype.config = function () {
            var _this = this;
            var _ = (this._ = this.app.getService("locale")._);
            var bar = {
                view: "form",
                height: webix.skin.$active.barHeight + 6,
                padding: { left: 10, right: 10, top: 5, bottom: 5 },
                margin: 0,
                localId: "bar",
                cols: [
                    { view: "label", label: _("Reports") },
                    {},
                    {
                        view: "icon",
                        localId: "nameSorting",
                        icon: "rpi-sort-alphabetical-ascending",
                        css: "webix_rpt_sort_icon webix_rpt_btn_active",
                        icons: {
                            asc: "rpi-sort-alphabetical-ascending",
                            desc: "rpi-sort-alphabetical-descending",
                        },
                        click: function () { return _this.Sort("name"); },
                    },
                    {
                        view: "icon",
                        localId: "updatedSorting",
                        css: "webix_rpt_sort_icon",
                        icon: "rpi-sort-calendar-descending",
                        icons: {
                            asc: "rpi-sort-calendar-ascending",
                            desc: "rpi-sort-calendar-descending",
                        },
                        click: function () { return _this.Sort("updated"); },
                    },
                ],
            };
            var menu = {
                view: "form",
                padding: { left: 10, right: 10, top: 2, bottom: 4 },
                cols: [
                    {
                        view: "text-search",
                        localId: "search",
                        placeholder: _("Type to search"),
                    },
                ],
            };
            var table = {
                view: "list",
                localId: "list",
                scroll: true,
                select: true,
                css: "webix_rpt_list",
                type: {
                    height: webix.skin.$active.rowHeight + 24,
                    template: function (data) { return _this.GetListTemplate(data); },
                },
                scheme: {
                    $change: function (obj) {
                        if (obj.date && typeof obj.date === "string")
                            obj.date = new Date(obj.date);
                    },
                },
                onClick: {
                    webix_rpt_action_menu: function (e, id) {
                        _this.Menu.Show(e, id);
                        return false;
                    },
                },
                onDblClick: {},
                on: {
                    onAfterSelect: function (id) { return _this.LoadModule(id, null); },
                    onItemDblClick: function (id) { return _this.LoadModule(id, "edit"); },
                },
            };
            return {
                width: 320,
                type: "clean",
                rows: [bar, { type: "clean", rows: [menu, table] }],
            };
        };
        GridsView.prototype.init = function () {
            var _this = this;
            this.State = this.getParam("state", true);
            this.Menu = this.ui(MenuPopup);
            var list = this.$$("list");
            list.$view.firstChild.setAttribute("placeholder", this._("No reports"));
            var mods = this.app.getService("local").getModules();
            list.sync(mods);
            mods.waitData.then(function () {
                if (_this.State.moduleId)
                    list.select(_this.State.moduleId);
            });
            this.on(this.State.$changes, "readonly", function () { return _this.$$("list").refresh(); });
            this.$$("search").attachEvent("onSearchChange", function (v) { return _this.Find(v); });
            this.Sorting = { by: "name", dir: "asc" };
        };
        GridsView.prototype.LoadModule = function (id, mode) {
            this.app.callEvent("loadModule", [id, mode]);
        };
        GridsView.prototype.Hide = function () {
            this.app.callEvent("hideModuleList");
        };
        GridsView.prototype.Find = function () {
            var _this = this;
            var text = this.$$("search").getValue();
            var list = this.$$("list");
            if (text) {
                text = text.toLowerCase();
                list.filter(function (data) { return _this.SearchCompare(text, data); });
            }
            else {
                list.filter();
            }
        };
        GridsView.prototype.SearchCompare = function (value, item) {
            return item.name.toLowerCase().indexOf(value) > -1;
        };
        GridsView.prototype.GetListTemplate = function (item) {
            var _ = this.app.getService("locale")._;
            var html = "<div class='webix_rpt_list_block'>";
            html +=
                "<div class='webix_rpt_list_report_name'>" +
                    types[item.parsed.type] +
                    " " +
                    item.name +
                    "</div>";
            html +=
                "<div class='webix_rpt_list_report_date'>" +
                    _("Last modified") +
                    ": " +
                    webix.i18n.longDateFormatStr(item.updated || new Date()) +
                    "</div>";
            if (!this.State.readonly)
                html +=
                    "<span class='webix_icon webix_rpt_action_menu rpi-dots-vertical'></span>";
            return html + "</div>";
        };
        GridsView.prototype.Sort = function (by) {
            var sState = this.Sorting;
            var prevState = webix.copy(sState);
            if (sState.by == by)
                sState.dir = sState.dir == "desc" ? "asc" : "desc";
            else {
                sState.by = by;
                sState.dir = "desc";
            }
            sState.as = by == "updated" ? "date" : "string";
            this.ChangeSortButtons(sState, prevState);
            this.$$("list").sort(sState);
        };
        GridsView.prototype.ChangeSortButtons = function (state, prevState) {
            var btn = this.$$(state.by + "Sorting");
            this.webix.html.addCss(btn.$view, "webix_rpt_btn_active");
            btn.config.icon = btn.config.icons[state.dir];
            btn.refresh();
            if (state.by != prevState.by) {
                var prevBtn = this.$$(prevState.by + "Sorting");
                this.webix.html.removeCss(prevBtn.$view, "webix_rpt_btn_active");
            }
        };
        return GridsView;
    }(JetView));

    var ExportView = (function (_super) {
        __extends(ExportView, _super);
        function ExportView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ExportView.prototype.config = function () {
            var _this = this;
            return {
                view: "popup",
                padding: 0,
                point: false,
                body: {
                    view: "list",
                    borderless: true,
                    css: "webix_rpt_popup_menu",
                    template: function (obj) { return _this.GetTemplate(obj); },
                    width: 160,
                    autoheight: true,
                    data: this.GetPopupOptions(),
                    click: function (id, e) { return _this.PopupAction(id, e); },
                },
            };
        };
        ExportView.prototype.GetPopupOptions = function () {
            var _ = this.app.getService("locale")._;
            return [
                { value: _("To Excel"), id: "excel" },
                { value: _("To CSV"), id: "csv" },
            ];
        };
        ExportView.prototype.PopupAction = function (id) {
            this.app.callEvent("exportModule", [id]);
            this.getRoot().hide();
        };
        ExportView.prototype.GetTemplate = function (obj) {
            return "<span class='webix_icon " + obj.icon + "'></span>" + obj.value;
        };
        ExportView.prototype.Show = function (node) {
            var _this = this;
            if (this.getRoot().isVisible())
                return;
            this.webix.delay(function () { return _this.getRoot().show(node); });
        };
        return ExportView;
    }(JetView));

    var ToolbarView = (function (_super) {
        __extends(ToolbarView, _super);
        function ToolbarView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ToolbarView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            var bar = {
                view: "form",
                localId: "toolbar",
                height: webix.skin.$active.barHeight + 6,
                hidden: true,
                padding: { left: 10, right: 10, top: 6, bottom: 6 },
                margin: 10,
                cols: [
                    {
                        view: "button",
                        type: "icon",
                        width: 140,
                        label: _("Export"),
                        icon: "rpi-export",
                        click: function (e) { return _this.ShowExportPopup(e); },
                    },
                    {},
                    {
                        view: "text-search",
                        localId: "search",
                        placeholder: _("Type to search"),
                        maxWidth: 600,
                        minWidth: 200,
                    },
                ],
            };
            return bar;
        };
        ToolbarView.prototype.ready = function () {
            var _this = this;
            this.State = this.getParam("state", true);
            this.$$("search").attachEvent("onSearchChange", function (v) { return (_this.State.search = v); });
            this.on(this.app, "onRecordsSearch", function (value, result) {
                if (value)
                    _this.$$("search").setBadge(result.length);
                else
                    _this.$$("search").setBadge(null);
            });
        };
        ToolbarView.prototype.ShowExportPopup = function (e) {
            if (!this.ExportMenu || !this.ExportMenu.$view)
                this.ExportMenu = this.ui(ExportView);
            var node = webix.$$(e);
            this.ExportMenu.Show(node.$view);
        };
        return ToolbarView;
    }(JetView));

    var typeToSort = {
        number: "int",
        date: "date",
        text: "string",
        boolean: "number",
        picklist: "text",
        reference: "text",
    };
    var TableView = (function (_super) {
        __extends(TableView, _super);
        function TableView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TableView.prototype.config = function () {
            var page = {
                type: "wide",
                margin: 5,
                cols: [{}],
            };
            return { rows: [ToolbarView, page] };
        };
        TableView.prototype.init = function () {
            this.State = this.getParam("state", true);
            this.LocalState = createState({ search: "" });
            this.setParam("state", this.LocalState);
            this.Local = this.app.getService("local");
        };
        TableView.prototype.ready = function () {
            var _this = this;
            var parts = this.getRoot().getChildViews();
            this.Bar = parts[0];
            this.Host = parts[1];
            this.on(this.State.$changes, "module", function (mod) { return _this.Show(mod); });
            this.on(this.app, "exportModule", function (mode) { return _this.Export(mode); });
            this.on(this.LocalState.$changes, "search", function (v) { return _this.Find(v); });
        };
        TableView.prototype.Export = function (mode) {
            var params = {
                ignore: { $selection: true },
                plainOutput: true,
                filterHTML: true,
            };
            if (this.Table) {
                if (mode == "excel")
                    webix.toExcel(this.Table, params);
                else if (mode == "csv")
                    webix.toCSV(this.Table, params);
            }
        };
        TableView.prototype.Show = function (mod) {
            var host = this.Host;
            if (mod && mod.columns.length && mod.type === "table") {
                var config = this.GetTableConfig(mod);
                if (!config)
                    return;
                this.Bar.show();
                webix.ui([config], host);
                var table_1 = (this.Table = host.getChildViews()[0]);
                this.GetTableData(mod).then(function (_a) {
                    var data = _a[0], options = _a[1];
                    if (table_1.$destructed)
                        return;
                    options.forEach(function (_a) {
                        var field = _a.field, data = _a.data;
                        table_1.getColumnConfig(field).collection.parse(data);
                    });
                    table_1.parse(data);
                });
            }
            else {
                webix.ui([{}], host);
                this.Table = null;
                this.Bar.hide();
            }
        };
        TableView.prototype.GetTableConfig = function (mod) {
            var _this = this;
            var groups = mod.groups, columns = mod.columns, meta = mod.meta;
            if (!columns)
                return null;
            var dateColumns = [];
            var gColumns = columns.map(function (a) {
                if (a.type == "date")
                    dateColumns.push(a.id);
                return _this.GetColumnConfig(a);
            });
            var edit = this.State.mode === "edit";
            var grid = {
                view: groups ? "treetable" : "datatable",
                columns: gColumns,
                resizeColumn: edit ? { headerOnly: true } : false,
                leftSplit: meta.freeze ? meta.freeze : 0,
                css: edit ? "webix_header_border" : "",
                on: {
                    onColumnResize: function (id, width, old, byUser) {
                        return _this.SetColWidth(id, width, old, byUser);
                    },
                },
            };
            if (dateColumns.length)
                grid.scheme = {
                    $change: function (row) {
                        return dateColumns.forEach(function (cId) { return (row[cId] = new Date(row[cId])); });
                    },
                };
            return grid;
        };
        TableView.prototype.GetColumnConfig = function (a) {
            var column = {
                id: a.id,
                header: !a.meta.header || a.meta.header === "none"
                    ? a.meta.name || a.name
                    : [
                        a.meta.name || a.name,
                        {
                            content: a.header === "text" ? "textFilter" : "richSelectFilter",
                        },
                    ],
                type: a.type,
                sort: typeToSort[a.type],
                width: a.width || 200,
            };
            if (a.type === "date")
                column.format = webix.i18n.dateFormatStr;
            if (a.type === "boolean") {
                var _1 = this.app.getService("locale")._;
                column.template = function (obj) { return (obj[a.id] == 1 ? _1("True") : _1("False")); };
            }
            if (a.type === "reference" || a.type === "picklist")
                column.options = [];
            return column;
        };
        TableView.prototype.SetColWidth = function (id, width, old, byUser) {
            if (byUser) {
                if (id === "$selection" || id === "$subrow") {
                    var table = this.Tbl;
                    table.blockEvent();
                    table.setColumnWidth(id, old);
                    table.unblockEvent();
                    return;
                }
                this.app.callEvent("onColumnResize", [id, width]);
            }
        };
        TableView.prototype.GetTableData = function (mod) {
            return Promise.all([
                this.Local.getData(this.Local.getDataConfig(mod), this.State.mode == "edit"),
                this.Local.getOptions(mod.columns),
            ]);
        };
        TableView.prototype.Find = function (value) {
            var h = this.app.getService("helpers");
            var table = this.Table;
            var result = [];
            if (!table)
                return;
            table.clearCss("webix_rpt_found_record", true);
            if (value) {
                var ignoreDateNumber_1 = h.hasNonDigits(value);
                var regexp_1 = new RegExp(h.wildToRegexp(value), "gi");
                var fields = table.config.columns.filter(function (c) {
                    return !(c.id === "$selection" || c.id === "$subrow") &&
                        (!ignoreDateNumber_1 || !(c.type === "number" || c.type === "date"));
                });
                var matchers_1 = [];
                var _loop_1 = function (i) {
                    var type = fields[i].type;
                    var colId = fields[i].id;
                    if (type === "text" || type === "number") {
                        matchers_1.push(function (o) { return regexp_1.test(o[colId]); });
                    }
                    else if (type === "reference" || type === "picklist") {
                        var collection = table.getColumnConfig(colId).collection;
                        var optionsMatch_1 = h.findOptions(collection, regexp_1);
                        matchers_1.push(h.matchPerColumn(colId, function (a) { return optionsMatch_1[a]; }));
                    }
                    else if (type === "bool") {
                        switch (value) {
                            case "true":
                                matchers_1.push(function (o) { return o[colId]; });
                                break;
                            case "false":
                                matchers_1.push(function (o) { return !o[colId]; });
                                break;
                        }
                    }
                    else if (type === "date") {
                        var dateFormats_1 = table.getColumnConfig(colId).format;
                        matchers_1.push(function (o) { return regexp_1.test(dateFormats_1(o[colId])); });
                    }
                };
                for (var i = 0; i < fields.length; ++i) {
                    _loop_1(i);
                }
                var found_1 = false;
                result = table.find(function (obj) {
                    for (var i = 0; i < matchers_1.length; ++i) {
                        if (matchers_1[i](obj)) {
                            if (!found_1) {
                                found_1 = true;
                                table.showItem(obj.id);
                            }
                            table.addCss(obj.id, "webix_rpt_found_record", true);
                            return true;
                        }
                    }
                    return false;
                });
            }
            table.refresh();
            this.app.callEvent("onRecordsSearch", [value, result]);
        };
        return TableView;
    }(JetView));

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

    var TopBarView = (function (_super) {
        __extends(TopBarView, _super);
        function TopBarView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TopBarView.prototype.config = function () {
            var _this = this;
            var app = this.app;
            var _ = this.app.getService("locale")._;
            var bar = {
                view: "toolbar",
                localId: "bar",
                padding: { left: 10, right: 10, top: 6, bottom: 6 },
                margin: 10,
                visibleBatch: "default",
                height: webix.skin.$active.barHeight + 6,
                elements: [
                    {
                        localId: "defaultButtons",
                        margin: 10,
                        width: 300,
                        cols: [
                            {
                                view: "toggle",
                                type: "icon",
                                label: _("All reports"),
                                localId: "list",
                                width: 150,
                                offIcon: "rpi-menu",
                                onIcon: "rpi-menu-open",
                                on: {
                                    onChange: function () {
                                        app.callEvent("showModules", [this.getValue()]);
                                    },
                                },
                            },
                            {
                                view: "button",
                                type: "icon",
                                localId: "newBtn",
                                icon: "rpi-plus",
                                label: _("New"),
                                click: function () {
                                    _this.$$("bar").showBatch("edit");
                                    app.callEvent("loadModule", [null, "edit"]);
                                },
                            },
                        ],
                    },
                    { width: 300, batch: "edit" },
                    { view: "label", localId: "name", align: "center", label: "" },
                    { width: 330, batch: "default" },
                    {
                        batch: "report",
                        width: 290,
                        cols: [
                            {},
                            {
                                view: "button",
                                type: "icon",
                                align: "right",
                                css: "webix_primary",
                                icon: "wxi-pencil",
                                label: _("Edit"),
                                width: 140,
                                click: function () { return app.callEvent("onMenuAction", [null, "edit"]); },
                            },
                        ],
                    },
                    {
                        width: 290,
                        batch: "edit",
                        margin: 10,
                        cols: [
                            {
                                view: "button",
                                type: "icon",
                                icon: "rpi-close",
                                label: _("Cancel"),
                                localId: "reset",
                                click: function () { return app.callEvent("resetModule", []); },
                            },
                            {
                                view: "button",
                                css: "webix_primary",
                                type: "icon",
                                icon: "wxi-check",
                                localId: "save",
                                width: 140,
                                label: _("Save"),
                                disabled: true,
                                click: function () { return app.callEvent("saveModule", []); },
                            },
                        ],
                    },
                    { popup: true, $subview: true, name: "popup" },
                ],
            };
            return bar;
        };
        TopBarView.prototype.init = function () {
            var _this = this;
            this.State = this.app.getParam("state", true);
            this.on(this.State.$changes, "module", function (mod) {
                if (mod) {
                    if (typeof mod.name != "undefined")
                        _this.$$("name").setValue(mod.name);
                    else if (_this.State.moduleId)
                        _this.app
                            .getService("local")
                            .getModule(_this.State.moduleId)
                            .then(function (module) {
                            _this.$$("name").setValue(module.name);
                        });
                }
                else {
                    _this.$$("name").setValue("");
                }
            });
            this.on(this.State.$changes, "saved", function (v) {
                var name = _this.$$("name").$view;
                if (v) {
                    _this.$$("save").disable();
                    name.classList.remove("webix_rpt_not_saved");
                }
                else {
                    _this.$$("save").enable();
                    name.classList.add("webix_rpt_not_saved");
                }
            });
            this.on(this.State.$changes, "mode", function () { return _this.SetVisibleButtons(); });
            this.on(this.State.$changes, "moduleId", function () { return _this.SetVisibleButtons(); });
            this.on(this.State.$changes, "readonly", function () { return _this.SetVisibleButtons(); });
            this.on(handler(), "ctrl+e", function () {
                _this.app.callEvent("onMenuAction", [null, "edit"]);
                return false;
            });
            this.on(handler(), "ctrl+s", function () {
                _this.app.callEvent("saveModule", []);
                return false;
            });
            this.on(handler(), "ctrl+l", function () {
                _this.app.callEvent("showModules", [true]);
                return false;
            });
        };
        TopBarView.prototype.SetVisibleButtons = function () {
            var mode = this.State.mode;
            if (mode == "list") {
                this.$$("list").setValue(true);
            }
            else {
                this.$$("list").setValue(false);
            }
            if (mode == "edit") {
                this.$$("defaultButtons").hide();
                this.$$("bar").showBatch("edit");
            }
            else {
                this.$$("defaultButtons").show();
                if (this.State.moduleId && !this.State.readonly) {
                    this.$$("bar").showBatch("report");
                }
                else {
                    this.$$("bar").showBatch("default");
                }
            }
            var newBtn = this.$$("newBtn");
            if (newBtn) {
                if (this.State.readonly) {
                    if (newBtn.isVisible())
                        newBtn.hide();
                }
                else if (!newBtn.isVisible()) {
                    newBtn.show();
                }
            }
        };
        TopBarView.prototype.TitleTemplate = function (data) {
            return "<div class=\"rep_title\">" + data.name + "</div>";
        };
        return TopBarView;
    }(JetView));

    var TopView$1 = (function (_super) {
        __extends(TopView, _super);
        function TopView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TopView.prototype.config = function () {
            var page = {
                type: "wide",
                margin: 5,
                cols: [
                    {
                        $subview: true,
                        name: "left",
                    },
                    { $subview: true, name: "right", css: "webix_rpt_right" },
                ],
            };
            return {
                type: "wide",
                margin: 5,
                css: "webix_reports",
                rows: [{ $subview: true, name: "top" }, page],
            };
        };
        TopView.prototype.init = function () {
            var _this = this;
            this.State = this.app.getParam("state");
            var _ = this.app.getService("locale")._;
            this.on(this.State.$changes, "toolbar", function (v) {
                _this.show(v ? "toolbar" : "_hidden", { target: "top" });
            });
            this.on(this.State.$changes, "mode", function (v) {
                if (v === "edit")
                    _this.show("./editor", { target: "left" });
                else if (v === "list")
                    _this.show("./modules", { target: "left" });
                else
                    _this.show("_hidden", { target: "left" });
            });
            this.on(this.State.$changes, "moduleId", function (id) {
                if (id)
                    _this.app
                        .getService("local")
                        .getModule(id)
                        .then(function (mod) {
                        _this.State.module = JSON.parse(mod.text);
                    });
                else
                    _this.State.module = null;
            });
            this.on(this.State.$changes, "module", function (mod) {
                var type = (mod ? mod.type : "empty") || "table";
                _this.show("./" + type, { target: "right" });
            });
            this.on(this.app, "loadModule", function (id, mode) { return _this.LoadModule(id, mode); });
            this.on(this.app, "onMenuAction", function (id, action) {
                if (!id && _this.State.moduleId)
                    id = _this.State.moduleId;
                if (!id)
                    return;
                if (action === "edit") {
                    _this.LoadModule(id, "edit");
                }
                else if (action === "delete") {
                    webix
                        .confirm({
                        title: _("Delete report"),
                        ok: _("Delete"),
                        cancel: _("Cancel"),
                        text: _("Are you sure to delete this report?"),
                    })
                        .then(function () {
                        _this.app
                            .getService("local")
                            .deleteModule(id)
                            .then(function () {
                            if (id == _this.State.moduleId)
                                _this.State.$batch({ moduleId: null, mode: "list" });
                        });
                    });
                }
                else if (action === "copy") {
                    _this.app
                        .getService("local")
                        .copyModule(id)
                        .then(function (id) {
                        _this.State.$batch({ moduleId: id, mode: "edit" });
                    });
                }
            });
            this.on(this.app, "showModules", function (v) {
                if (v) {
                    _this.State.mode = "list";
                }
                else if (_this.State.mode == "list") {
                    _this.State.mode = "view";
                }
            });
        };
        TopView.prototype.LoadModule = function (id, mode) {
            this.State.moduleId = id;
            if (mode)
                this.State.mode = mode;
        };
        return TopView;
    }(JetView));

    var views = { JetView: JetView };
    views["chart"] = ChartView;
    views["editor/common"] = CommonView;
    views["editor/data"] = QueryBuilderView;
    views["editor/datepopup"] = DateView;
    views["editor/groups"] = OtherSettingsView;
    views["editor"] = TopView;
    views["editor/other"] = OtherSettingsView$1;
    views["editor/query"] = QueryView;
    views["editor/sorts"] = OtherSettingsView$2;
    views["editor/structure/axis"] = AxisPropertiesView;
    views["editor/structure/baseview"] = BaseStructureView;
    views["editor/structure/chart"] = ChartView$1;
    views["editor/structure/chartseries"] = SeriesPropertiesView;
    views["editor/structure/colorpopup"] = ColorPopupView;
    views["editor/structure/column"] = ColumnPropertiesView;
    views["editor/structure/heatmap"] = ChartView$2;
    views["editor/structure"] = StructureView;
    views["editor/structure/table"] = ColumnsView;
    views["editor/summary"] = Summaries;
    views["editor/summarypopup"] = SummaryPopupView;
    views["empty"] = EmptyView;
    views["heatmap"] = ChartView$3;
    views["menu"] = MenuPopup;
    views["modules"] = GridsView;
    views["table/export"] = ExportView;
    views["table"] = TableView;
    views["table/toolbar"] = ToolbarView;
    views["toolbar"] = TopBarView;
    views["top"] = TopView$1;

    var en = {
        "Add column": "Add column",
        "All reports": "All reports",
        "Are you sure to delete this report?": "Are you sure to delete this report?",
        "Are you sure to delete this query?": "Are you sure to delete this query?",
        Average: "Average",
        Cancel: "Cancel",
        Chart: "Chart",
        Column: "Column",
        Columns: "Columns",
        "Color column": "Color column",
        Common: "Common",
        "Copy of": "Copy of",
        Count: "Count",
        "Created on": "Created on",
        Data: "Data",
        "Data source": "Data source",
        Day: "Day",
        Delete: "Delete",
        "Delete report": "Delete report",
        Description: "Description",
        Query: "Query",
        Edit: "Edit",
        "Enter query name": "Enter query name",
        Export: "Export",
        "To Excel": "To Excel",
        "To CSV": "To CSV",
        Filter: "Filter",
        "Filtering query": "Filtering query",
        "Frozen columns above": "Frozen columns above",
        Function: "Function",
        Group: "Group",
        "Group summaries": "Group summaries",
        "Join data": "Join data",
        Heatmap: "Heatmap",
        "Labels column": "Labels column",
        Max: "Max",
        Min: "Min",
        Month: "Month",
        New: "New",
        "Click 'New' button to add a new report": "Click 'New' button to add a new report",
        "Select any report from the list": "Select any report from the list",
        "No reports": "No reports",
        "No saved queries": "No saved queries",
        "Last modified": "Last modified",
        "New column name": "New column name",
        "New report": "New report",
        "Please delete the related query filter first": "Please delete the related query filter first",
        "Please delete the related group rule first": "Please delete the related group rule first",
        Rename: "Rename",
        "Report name": "Report name",
        Reports: "Reports",
        Save: "Save",
        "Save query": "Save query",
        Sort: "Sort",
        "Specify columns to group by and output(s)": "Specify columns to group by and output(s)",
        "Specify columns to sort by": "Specify columns to sort by",
        Sum: "Sum",
        Table: "Table",
        Title: "Title",
        "Type to search": "Type to search",
        View: "View",
        Year: "Year",
        Axes: "Axes",
        "X Axis": "X Axis",
        "Y Axis": "Y Axis",
        columns: "columns",
        rows: "rows",
        "Data series": "Data series",
        "Chart type": "Chart type",
        "Keys column": "Keys column",
        "X axis column": "X axis column",
        "Values column": "Values column",
        Color: "Color",
        "Marker type": "Marker type",
        "Fill marker": "Fill marker",
        Legend: "Legend",
        "Logarithmic scale": "Logarithmic scale",
        Gridlines: "Gridlines",
        Bottom: "Bottom",
        None: "None",
        Right: "Right",
        Line: "Line",
        Spline: "Spline",
        Area: "Area",
        "Stacked area": "Stacked area",
        "Spline area": "Spline area",
        Bar: "Bar",
        "Stacked bar": "Stacked bar",
        Radar: "Radar",
        Pie: "Pie",
        Donut: "Donut",
        "Create copy": "Create copy",
        circle: "circle",
        square: "square",
        triangle: "triangle",
        diamond: "diamond",
        "no markers": "no markers",
        "Vertical labels": "Vertical labels",
        "Extract series from": "Extract series from",
        True: "True",
        False: "False",
        "Save filter to use it in other reports": "Save filter to use it in other reports",
    };

    var Local = (function () {
        function Local(_app) {
            this._app = _app;
            this._fieldData = new Map();
            this._optionsData = new Map();
            this._data = new Map();
        }
        Local.prototype.ready = function (obj) {
            return this.getModels().then(function () { return obj; });
        };
        Local.prototype.getModules = function () {
            if (!this._modules) {
                this._modules = new webix.DataCollection({
                    scheme: {
                        $change: function (obj) {
                            obj.value = obj.name;
                            obj.parsed = JSON.parse(obj.text);
                            if (typeof obj.updated === "string")
                                obj.updated = new Date(obj.updated);
                        },
                        $sort: {
                            by: "name",
                            dir: "asc",
                            as: "string",
                        },
                    },
                });
                this._modules.parse(this._app.getService("backend").getModules());
            }
            return this._modules;
        };
        Local.prototype.getModule = function (id) {
            var _this = this;
            var mods = this.getModules();
            return mods.waitData.then(function () { return _this._modules.getItem(id); });
        };
        Local.prototype.deleteModule = function (id) {
            var _this = this;
            return this._app
                .getService("backend")
                .deleteModule(id)
                .then(function () {
                _this._modules.remove(id);
            });
        };
        Local.prototype.copyModule = function (id) {
            var mod = this._modules.getItem(id);
            return this.saveModule(0, { name: "Copy of " + mod.name, text: mod.text });
        };
        Local.prototype.saveModule = function (id, data) {
            var _this = this;
            return this._app
                .getService("backend")
                .saveModule(id, data)
                .then(function (res) {
                if (id) {
                    _this._modules.updateItem(id, data);
                }
                else {
                    _this._modules.add(__assign({ id: res.id }, data));
                }
                return res.id;
            });
        };
        Local.prototype.getModels = function (now) {
            var _this = this;
            if (now)
                return this._models || {};
            if (!this._models_async) {
                this._models_async = this._app
                    .getService("backend")
                    .getModels()
                    .then(function (models) {
                    var refs = {};
                    Object.keys(models).forEach(function (m) {
                        var obj = models[m];
                        obj.data.forEach(function (f) {
                            if (f.type == "reference") {
                                if (!refs[m])
                                    refs[m] = [];
                                if (!refs[f.ref])
                                    refs[f.ref] = [];
                                var id = m + "/" + f.id + "//" + f.ref;
                                refs[m].push({ sid: m, tid: f.ref, sf: f.id, id: id });
                                refs[f.ref].push({ sid: f.ref, tid: m, tf: f.id, id: id });
                            }
                        });
                    });
                    _this._refs = refs;
                    _this._models = models;
                    return models;
                });
            }
            return this._models_async;
        };
        Local.prototype.getRefs = function () {
            return this._refs;
        };
        Local.prototype.getModel = function (id) {
            return this._models[id];
        };
        Local.prototype.getFieldData = function (field, type) {
            var id = field;
            var list = this._fieldData.get(id);
            if (list)
                return list;
            list = this._app
                .getService("backend")
                .getFieldData(field)
                .then(function (list) {
                if (type === "date")
                    list = list.map(function (a) { return new Date(a); });
                return list;
            });
            this._fieldData.set(id, list);
            return list;
        };
        Local.prototype.getFields = function (data, joins, major) {
            var _this = this;
            var m = this._models;
            var fields = [];
            m[data].data.forEach(function (a) { return fields.push(_this.newField(m[data], a)); });
            joins.forEach(function (j) {
                return m[j.tid].data.forEach(function (a) {
                    if (!major || a.show)
                        fields.push(_this.newField(m[j.tid], a));
                });
            });
            return fields;
        };
        Local.prototype.setDataSource = function (id) {
            var columns = this.getFields(id, []);
            return {
                query: "",
                sort: null,
                fields: columns,
                columns: __spreadArrays(columns),
                oldColumns: null,
                group: null,
                joins: [],
            };
        };
        Local.prototype.newField = function (model, a) {
            var obj = {
                id: model.id + "." + a.id,
                name: a.name,
                type: a.type,
                ref: a.ref,
                mid: model.id,
                model: model.name,
                meta: {},
            };
            if (a.key)
                obj.key = true;
            return obj;
        };
        Local.prototype.newModule = function (type) {
            var _ = this._app.getService("locale")._;
            var name = _("New report");
            var desc = _("Created on") + " " + webix.i18n.dateFormatStr(new Date());
            return {
                id: 0,
                name: name,
                desc: desc,
                data: Object.keys(this._models)[0],
                joins: [],
                query: "",
                type: type || "table",
                sort: null,
                columns: [],
                fields: [],
                publicFields: null,
                group: null,
                meta: {},
            };
        };
        Local.prototype.addJoin = function (id, config) {
            var _this = this;
            var model = this._models[id];
            var fields = config.fields, columns = config.columns, group = config.group;
            model.data.forEach(function (a) {
                fields.push(_this.newField(model, a));
                if (a.show && !group)
                    columns.push(_this.newField(model, a));
            });
            return { fields: fields, columns: columns };
        };
        Local.prototype.getData = function (config, limit) {
            var id = JSON.stringify(config);
            var list = this._data.get(id);
            if (list)
                return list;
            if (limit) {
                config.limit = 30;
                id = JSON.stringify(config);
                list = this._data.get(id);
                if (list)
                    return list;
            }
            list = this._app.getService("backend").getData(config);
            this._data.set(id, list);
            return list;
        };
        Local.prototype.getDataConfig = function (module) {
            return {
                data: module.data,
                query: module.query,
                columns: module.columns.map(function (a) { return a.id; }).sort(),
                joins: module.joins,
                sort: module.sort,
                group: module.group && module.group.by
                    ? module.group.by.map(function (a) { return (a.mod ? a.mod + "." : "") + a.id; })
                    : "",
            };
        };
        Local.prototype.getOptions = function (columns) {
            var _this = this;
            var options = columns
                .filter(function (a) { return a.type === "picklist" || a.type === "reference"; })
                .map(function (a) { return _this.getOptionsList(a.id); });
            return Promise.all(options);
        };
        Local.prototype.getOptionsList = function (field) {
            var list = this._optionsData.get(field);
            if (list)
                return list.then(function (data) { return ({ field: field, data: data }); });
            list = this._app.getService("backend").getOptions(field);
            this._optionsData.set(field, list);
            return list.then(function (data) { return ({ field: field, data: data }); });
        };
        Local.prototype.getLinkedModels = function (base, onlyNew) {
            var out = [];
            var refs = this.getRefs();
            for (var i = 0; i < base.length; i++) {
                var sid = base[i];
                if (!refs[sid])
                    continue;
                refs[sid].forEach(function (ref) {
                    if (onlyNew && base.indexOf(ref.tid) != -1)
                        return;
                    out.push(__assign({}, ref));
                });
            }
            return out;
        };
        Local.prototype.cleanLinkedModels = function (id, config) {
            var _a;
            var data = config.data, joins = config.joins, fields = config.fields, columns = config.columns, query = config.query, group = config.group, publicFields = config.publicFields;
            var was = (_a = {}, _a[data] = 1, _a);
            var next, origin = joins, links = [];
            joins = next = joins.filter(function (a) { return a.id != id; });
            do {
                joins = next;
                next = [];
                for (var i = 0; i < joins.length; i++) {
                    if (was[joins[i].sid])
                        was[joins[i].tid] = 1;
                    else
                        next.push(joins[i]);
                }
            } while (next.length && next.length !== joins.length);
            var queryObj = query ? collectTables(JSON.parse(query)) : [];
            var _loop_1 = function (i) {
                var j = origin[i];
                if (was[j.tid]) {
                    links.push(j);
                }
                else {
                    if (queryObj.indexOf(j.tid) !== -1)
                        return { value: { block: { filter: 1 } } };
                    if (group) {
                        var check_1 = "." + j.tid + ".";
                        if (publicFields.find(function (a) { return a.id.indexOf(check_1) != -1; }))
                            return { value: { block: { group: 1 } } };
                    }
                    columns = columns.filter(function (a) { return a.mid != j.tid; });
                    fields = fields.filter(function (a) { return a.mid != j.tid; });
                }
            };
            for (var i = 0; i < origin.length; i++) {
                var state_1 = _loop_1(i);
                if (typeof state_1 === "object")
                    return state_1.value;
            }
            return {
                joins: links,
                columns: columns,
                fields: fields,
            };
        };
        Local.prototype.getQueries = function () {
            if (this._queries)
                return this._queries;
            return (this._queries = new webix.DataCollection({
                scheme: {
                    $change: function (obj) {
                        obj.value = obj.name;
                        obj.models = collectTables(JSON.parse(obj.text));
                    },
                },
                data: this._app.getService("backend").getQueries(),
            }));
        };
        Local.prototype.saveQuery = function (id, data) {
            var _this = this;
            return this._app
                .getService("backend")
                .saveQuery(id, data)
                .then(function (res) {
                if (id) {
                    _this._queries.updateItem(id, data);
                }
                else {
                    _this._queries.add(__assign({ id: res.id }, data));
                }
                return res.id;
            });
        };
        Local.prototype.deleteQuery = function (id) {
            var _this = this;
            return this._app
                .getService("backend")
                .deleteQuery(id)
                .then(function () {
                _this._queries.remove(id);
            });
        };
        return Local;
    }());
    function collectTables(q, mods) {
        mods = mods || [];
        if (q.rules)
            q.rules.forEach(function (r) {
                if (r.rules)
                    collectTables(r, mods);
                else {
                    var parts = r.field.split(".");
                    mods.push(parts[0]);
                }
            });
        return mods;
    }

    var Backend = (function () {
        function Backend(app) {
            this.app = app;
            this._url = app.config.url;
        }
        Backend.prototype.saveQuery = function (id, data) {
            if (!id) {
                return webix
                    .ajax()
                    .post(this._url + "api/queries", data)
                    .then(function (a) { return a.json(); });
            }
            else {
                return webix
                    .ajax()
                    .put(this._url + "api/queries/" + id, data)
                    .then(function (a) { return a.json(); });
            }
        };
        Backend.prototype.deleteQuery = function (id) {
            return webix
                .ajax()
                .del(this._url + "api/queries/" + id)
                .then(function (a) { return a.json(); });
        };
        Backend.prototype.getQueries = function () {
            return webix.ajax(this._url + "api/queries").then(function (a) { return a.json(); });
        };
        Backend.prototype.getModules = function () {
            return webix.ajax(this._url + "api/modules").then(function (a) { return a.json(); });
        };
        Backend.prototype.saveModule = function (id, data) {
            if (id) {
                return webix
                    .ajax()
                    .put(this._url + "api/modules/" + id, data)
                    .then(function (a) { return a.json(); });
            }
            else {
                return webix
                    .ajax()
                    .post(this._url + "api/modules", data)
                    .then(function (a) { return a.json(); });
            }
        };
        Backend.prototype.deleteModule = function (id) {
            return webix
                .ajax()
                .del(this._url + "api/modules/" + id)
                .then(function (a) { return a.json(); });
        };
        Backend.prototype.getModels = function () {
            return webix.ajax(this._url + "api/objects").then(function (a) { return a.json(); });
        };
        Backend.prototype.getData = function (config) {
            var query = config.query, columns = config.columns, joins = config.joins, limit = config.limit, group = config.group, sort = config.sort;
            return webix
                .ajax()
                .post(this._url + "api/objects/" + config.data + "/data", {
                query: query,
                columns: columns,
                joins: joins,
                limit: limit,
                sort: sort,
                group: group,
            })
                .then(function (a) { return a.json(); });
        };
        Backend.prototype.getOptions = function (field) {
            return webix
                .ajax(this._url + "api/fields/" + field + "/options")
                .then(function (a) { return a.json(); });
        };
        Backend.prototype.getFieldData = function (field) {
            return webix
                .ajax(this._url + "api/fields/" + field + "/suggest")
                .then(function (a) { return a.json(); });
        };
        return Backend;
    }());

    var Helpers = (function () {
        function Helpers() {
            this.replacements = [
                { from: /(^ +)/g, to: "" },
                { from: /(^\w+)/g, to: "^($&)" },
                { from: /^(\?)/g, to: "^\\S{1}" },
                { from: /(\?)/g, to: "\\S{1}" },
                { from: /(\*)/g, to: "\\S*" },
                { from: /( +)$/g, to: "$" },
            ];
        }
        Helpers.prototype.wildToRegexp = function (wild) {
            for (var i = 0; i < this.replacements.length; ++i) {
                wild = wild.replace(this.replacements[i].from, this.replacements[i].to);
            }
            return wild;
        };
        Helpers.prototype.matchPerColumn = function (id, match) {
            return function (a) { return match(a[id]); };
        };
        Helpers.prototype.findOptions = function (collection, regexp) {
            var res = {};
            collection
                .find(function (obj) { return regexp.test(obj.value); })
                .forEach(function (a) { return (res[a.id] = 1); });
            return res;
        };
        Helpers.prototype.hasNonDigits = function (input) {
            return /\D/gi.test(input.replace(/[?*/. ]/g, ""));
        };
        return Helpers;
    }());

    var Charts = (function () {
        function Charts(_app) {
            this._app = _app;
            this.type = "line";
            this.type = "line";
            this.colors = [
                "#FF9700",
                "#4CB050",
                "#00BCD4",
                "#3F51B5",
                "#9C28B1",
                "#F34336",
                "#FFEA3B",
                "#009788",
                "#2196F3",
                "#673BB7",
                "#EA1E63",
            ];
            this.itemSupport = ["line", "spline", "radar"];
            this.noAxisSupport = ["pie", "donut"];
            this.lineTypes = ["line", "spline"];
            this.multiTypeSupport = [
                "bar",
                "stackedBar",
                "area",
                "stackedArea",
                "splineArea",
            ];
            this.numLimit = 30;
        }
        Charts.prototype.getTypes = function () {
            var _ = this._app.getService("locale")._;
            if (!this.types)
                this.types = [
                    { id: "line", value: _("Line"), icon: "rpi-chart-line" },
                    {
                        id: "spline",
                        value: _("Spline"),
                        icon: "rpi-chart-bell-curve-cumulative",
                    },
                    {
                        id: "area",
                        value: _("Area"),
                        icon: "rpi-chart-areaspline",
                    },
                    {
                        id: "stackedArea",
                        value: _("Stacked area"),
                        icon: "rpi-chart-line-stacked",
                    },
                    {
                        id: "splineArea",
                        value: _("Spline area"),
                        icon: "rpi-chart-areaspline-variant",
                    },
                    { id: "bar", value: _("Bar"), icon: "rpi-chart-bar" },
                    {
                        id: "stackedBar",
                        value: _("Stacked bar"),
                        icon: "rpi-chart-bar-stacked",
                    },
                    {
                        id: "radar",
                        value: _("Radar"),
                        icon: "rpi-vector-triangle",
                    },
                ];
            return this.types;
        };
        Charts.prototype.getItemTypes = function () {
            var _ = this._app.getService("locale")._;
            if (!this.itemTypes)
                this.itemTypes = [
                    {
                        id: "r",
                        value: _("circle"),
                        icon: "rpi-circle-outline",
                    },
                    {
                        id: "s",
                        value: _("square"),
                        icon: "rpi-square-outline",
                    },
                    {
                        id: "t",
                        value: _("triangle"),
                        icon: "rpi-triangle-outline",
                    },
                    {
                        id: "d",
                        value: _("diamond"),
                        icon: "rpi-rhombus-outline",
                    },
                    {
                        id: "no",
                        value: _("no markers"),
                    },
                ];
            return this.itemTypes;
        };
        return Charts;
    }());

    var App = (function (_super) {
        __extends(App, _super);
        function App(config) {
            var _this = this;
            var state = createState({
                moduleId: config.moduleId || null,
                module: null,
                mode: config.mode || "list",
                toolbar: config.toolbar === false ? false : true,
                saved: true,
                readonly: config.readonly || false,
            });
            var params = { state: state };
            if (config.compaсt)
                params.forceCompact = config.compact;
            var defaults = {
                router: EmptyRouter,
                debug: true,
                start: "/top/empty",
                compactWidth: 650,
                params: params,
            };
            _this = _super.call(this, __assign(__assign({}, defaults), config)) || this;
            if (_this.config.debug) {
                webix.Promise = window.Promise;
            }
            var dynamic = function (obj) {
                return _this.config.override ? _this.config.override.get(obj) || obj : obj;
            };
            _this.setService("local", new (dynamic(Local))(_this));
            _this.setService("backend", new (dynamic(Backend))(_this));
            _this.setService("helpers", new (dynamic(Helpers))(_this));
            _this.setService("charts", new (dynamic(Charts))(_this));
            _this.use(plugins.Locale, _this.config.locale || {
                lang: "en",
                webix: {
                    en: "en-US",
                },
            });
            return _this;
        }
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
        name: "reports",
        app: App,
        getState: function () {
            return this.$app.getState();
        },
        getService: function (name) {
            return this.$app.getService(name);
        },
        $init: function () {
            var state = this.$app.getState();
            for (var key in state) {
                link(state, this.config, key);
            }
        },
    }, webix.ui.jetapp);
    var services = {
        Local: Local,
        Backend: Backend,
        Helpers: Helpers,
        Charts: Charts,
    };
    var locales = { en: en };

    exports.App = App;
    exports.locales = locales;
    exports.services = services;
    exports.views = views;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
