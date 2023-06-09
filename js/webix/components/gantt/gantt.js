/*
@license
Webix Gantt v.10.1.0
This software is covered by Webix Commercial License.
Usage without proper license is prohibited.
(c) XB Software Ltd.
*/
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.gantt = {}));
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

    var index = 1;
    function uid() {
        return index++;
    }
    var empty = undefined;
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
            var box = webix.html.offset(this.from.$view);
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
            var scroll = this.from.getScrollState();
            if (pos.y < box.y + sense) {
                return DragScroll.autoScrollTo.call(this, scroll.x, scroll.y - sense, "y");
            }
            else if (pos.y > box.y + box.height - sense) {
                return DragScroll.autoScrollTo.call(this, scroll.x, scroll.y + sense, "y");
            }
            return false;
        },
        autoXScroll: function (pos, box, sense) {
            var scroll = this.from.getScrollState();
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
            this.from.scrollTo(x, y);
            this.from.callEvent("onAfterAutoScroll", []);
            var scroll = this.from.getScrollState();
            return Math.abs((mode === "x" ? x : y) - scroll[mode]) < 1;
        },
    };

    function initDnD(view) {
        var ctrl = webix.copy(DragControl);
        ctrl.view = view;
        ctrl.master = this;
        ctrl.Local = this.app.getService("local");
        webix.DragControl.addDrag(view.$view, ctrl);
        webix.DragControl.addDrop(view.$view, ctrl, true);
    }
    function switchCursor(e, view) {
        if (webix.DragControl.active)
            return;
        var id = webix.html.locate(e, "webix_l_id");
        if (id && view.getItem(id).type == "task") {
            var node = view.getItemNode(id);
            var mode = getMoveMode(node, e.clientX);
            node.style.cursor = mode == "move" ? "pointer" : "ew-resize";
        }
    }
    function getMoveMode(node, x) {
        var rect = node.getBoundingClientRect();
        var p = (x - rect.left) / rect.width;
        var minWidth = webix.env.touch ? 400 : 200;
        var delta = 0.2 / (rect.width > minWidth ? rect.width / minWidth : 1);
        if (p < delta)
            return "start";
        if (p > 1 - delta)
            return "end";
        return "move";
    }
    function updateDragScrollConfig(ds) {
        var scales = this.Local.getScales();
        ds.senseX = Math.round(scales.cellWidth * (webix.env.touch ? 1 : 0.5));
        ds.senseY = Math.round(scales.cellHeight * (webix.env.touch ? 3 : 1));
        return ds;
    }
    function isProgressDrag(t, node) {
        while (t != node) {
            if (t.classList.contains("webix_gantt_progress_drag"))
                return true;
            t = t.parentNode;
        }
        return false;
    }
    var DragControl = {
        $longTouchLimit: true,
        $dragCreate: function (t, e, pointer) {
            if (this.master.State.readonly)
                return false;
            var ctx = this.getContext();
            ctx.$touch = pointer === "touch";
            var id = this.locateEvent(e);
            if (id) {
                var item = this.view.getItem(id);
                if (item.$group)
                    return false;
                var target = e.target;
                if (target.classList.contains("webix_gantt_link")) {
                    ctx.mode = "links";
                    return Modes[ctx.mode].$dragCreate.call(this, t, e, id);
                }
                var node = this.view.getItemNode(id);
                if (!ctx.$touch && isProgressDrag(target, node)) {
                    ctx.mode = "progress";
                    return Modes[ctx.mode].$dragCreate.call(this, t, e, id);
                }
                var scroll_1 = this.view.getScrollState();
                var evContext = this.getEventContext(e, ctx);
                var mode = getMoveMode(node, evContext.x);
                if (item.type != "task" && (mode == "start" || mode == "end"))
                    mode = "move";
                var scales = this.Local.getScales();
                var step = scales.cellWidth;
                if (scales.precise) {
                    var nsc = this.master.app
                        .getService("helpers")
                        .getSmallerCount(scales.minUnit);
                    step = Math.round(step / (typeof nsc === "number" ? nsc : nsc()));
                }
                webix.extend(ctx, {
                    id: id,
                    mode: mode,
                    node: node,
                    step: step,
                    dx: 0,
                    from: this.view,
                    snode: t.querySelector(".webix_scroll_cont"),
                    x: evContext.x,
                    scroll: scroll_1,
                    t: parseInt(node.style.top),
                    l: parseInt(node.style.left),
                    w: parseInt(node.style.width),
                }, true);
                if (!this.master.app.callEvent("bars:beforedrag", [item, ctx]))
                    return false;
                if (Modes[ctx.mode].dragScroll)
                    webix.extend(ctx, updateDragScrollConfig.call(this, Modes[ctx.mode].dragScroll));
                var html = node.cloneNode(true);
                html.className += " webix_drag_zone webix_gantt_mode_" + mode;
                node.style.visibility = "hidden";
                webix.html.addCss(t, "webix_gantt_in_action", true);
                t.style.cursor = mode == "move" ? "move" : "ew-resize";
                t.appendChild(html);
                return html;
            }
            else if (this.master.app.config.split &&
                this.master.State.display !== "resources" &&
                e.target == t) {
                ctx.mode = "split";
                return Modes[ctx.mode].$dragCreate.call(this, t, e);
            }
            return false;
        },
        $dragDestroy: function (t, node) {
            var _this = this;
            var ctx = this.getContext();
            if (Modes[ctx.mode].dragScroll)
                DragScroll.reset(ctx);
            if (ctx.mode && Modes[ctx.mode].$dragDestroy)
                return Modes[ctx.mode].$dragDestroy.call(this, t, node);
            if (ctx.$waitUpdate) {
                ctx.$waitUpdate.catch(function () {
                    _this.master.Action({ action: "update-task-time", id: ctx.id });
                });
            }
            else
                ctx.$waitUpdate = this.master.Action({
                    action: "update-task-time",
                    id: ctx.id,
                });
            ctx.$waitUpdate.finally(function () {
                ctx.node.style.visibility = "";
                webix.html.remove(node);
                if (_this.master.app.config.split && ctx.id)
                    _this.master.Action({
                        action: "split-resize",
                        id: ctx.id,
                    });
            });
            t.style.cursor = "";
            webix.html.removeCss(t, "webix_gantt_in_action");
            return false;
        },
        $dragIn: function (s, t, e) {
            var ctx = this.getContext();
            if (!ctx.mode)
                return false;
            if (Modes[ctx.mode].dragScroll) {
                DragScroll.reset(ctx);
                DragScroll.start(ctx, e);
            }
            if (Modes[ctx.mode].$dragIn)
                return Modes[ctx.mode].$dragIn.call(this, s, t, e);
            return true;
        },
        $dragPos: function (pos) {
            var ctx = this.getContext();
            return Modes[ctx.mode].$dragPos.call(this, pos);
        },
        $dragOut: function (s, t, n, e) {
            var ctx = this.getContext();
            if (Modes[ctx.mode].$dragOut)
                return Modes[ctx.mode].$dragOut.call(this, s, t, n, e);
            return null;
        },
        $drop: function (s, t, e) {
            var ctx = this.getContext();
            if (!ctx.mode)
                return false;
            if (Modes[ctx.mode].$drop)
                return Modes[ctx.mode].$drop.call(this, s, t, e);
            var id = ctx.id, mode = ctx.mode, dx = ctx.dx, step = ctx.step;
            var time = Math.round(dx / step);
            ctx.timeShift = time;
            if (!this.master.app.callEvent("bars:beforedrop", [
                this.view.getItem(ctx.id),
                ctx,
            ]))
                return false;
            ctx["$waitUpdate"] = this.master.Action({
                action: "update-task-time",
                mode: mode,
                time: time,
                id: id,
            });
        },
        locateEvent: function (ev, context) {
            if (context) {
                ev = document.elementFromPoint(context.x, context.y);
            }
            return webix.html.locate(ev, "webix_l_id");
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
    };
    var links = {
        dragScroll: {
            direction: "xy",
        },
        $dragCreate: function (t, e, id) {
            var ctx = this.getContext();
            var link = e.target;
            var node = this.view.getItemNode(id);
            var scroll = this.view.getScrollState();
            var offset = webix.html.offset(link);
            var css = link.classList;
            webix.extend(ctx, {
                id: id,
                from: this.view,
                node: node,
                link: link,
                fromStart: css.contains("webix_gantt_link_left"),
                start: {
                    x: offset.x + offset.width / 2 + scroll.x,
                    y: offset.y + offset.height / 2 + scroll.y,
                },
            }, true);
            if (!this.master.app.callEvent("bars:beforedrag", [
                this.view.getItem(id),
                ctx,
            ]))
                return false;
            if (Modes[ctx.mode].dragScroll)
                webix.extend(ctx, updateDragScrollConfig.call(this, Modes[ctx.mode].dragScroll));
            link.style.opacity = 1;
            webix.html.addCss(node, "webix_gantt_task_in_action", true);
            var html = webix.html.create("div", { visibility: "hidden" });
            document.body.appendChild(html);
            return html;
        },
        $dragDestroy: function (t, node) {
            var ctx = this.getContext();
            this.master.Action({ action: "temp-link" });
            if (ctx.target) {
                var node_1 = this.view.getItemNode(ctx.target);
                webix.html.removeCss(node_1, "webix_gantt_link_visible");
            }
            ctx.link.style.opacity = "";
            webix.html.removeCss(ctx.node, "webix_gantt_task_in_action");
            webix.html.remove(node);
            return false;
        },
        $dragIn: function (s, t, e) {
            var ctx = this.getContext();
            var evContext = this.getEventContext(e, ctx);
            var id = this.locateEvent(e, ctx.$touch ? evContext : null);
            if (!id)
                return false;
            var node = this.view.getItemNode(id);
            if (id != ctx.target) {
                webix.html.addCss(node, "webix_gantt_link_visible", true);
                ctx.target = id;
            }
            return node;
        },
        $dragPos: function (pos) {
            var ctx = this.getContext();
            var nscroll = this.view.getScrollState();
            ctx.end = {
                x: pos.x + nscroll.x,
                y: pos.y + nscroll.y,
            };
            this.master.Action({ action: "temp-link", start: ctx.start, end: ctx.end });
        },
        $dragOut: function (s, t, n, e) {
            var ctx = this.getContext();
            var evContext = this.getEventContext(e, ctx);
            var id = this.locateEvent(e, ctx.$touch ? evContext : null);
            if (ctx.target && id != ctx.target) {
                var node = this.view.getItemNode(ctx.target);
                webix.html.removeCss(node, "webix_gantt_link_visible");
                ctx.target = null;
            }
            return null;
        },
        $drop: function (s, t, e) {
            var ctx = this.getContext();
            var source = ctx.id;
            var evContext = this.getEventContext(e, ctx);
            var target = this.locateEvent(e, ctx.$touch ? evContext : null);
            if (!target || source == target)
                return false;
            var node = this.view.getItemNode(target);
            var rect = node.getBoundingClientRect();
            var toStart = evContext.x - rect.left < rect.width / 2;
            var type = (ctx.linkType = (ctx.fromStart ? 1 : 0) + (toStart ? 0 : 2));
            ctx.targetId = target;
            if (this.master.app.callEvent("bars:beforedrop", [
                this.view.getItem(source),
                ctx,
            ]))
                this.master.Action({ action: "add-link", source: source, target: target, type: type });
        },
    };
    var resize = {
        $dragPos: function (pos) {
            var ctx = this.getContext();
            var nscroll = this.view.getScrollState();
            var node = webix.DragControl.getNode();
            var mode = ctx.mode, l = ctx.l, t = ctx.t, w = ctx.w, x = ctx.x, id = ctx.id, scroll = ctx.scroll, step = ctx.step;
            var dx = (ctx.dx = pos.x - x - scroll.x + nscroll.x);
            if (mode === "start") {
                pos.x = Math.min(l + dx, l + w - step);
                node.style.width = Math.max(w - dx, step) + "px";
            }
            else if (mode === "end") {
                pos.x = l;
                node.style.width = Math.max(w + dx, step) + "px";
            }
            pos.y = t;
            this.master.Action({
                action: "drag-task",
                id: id,
                left: pos.x,
                width: parseInt(node.style.width),
            });
            if (this.master.app.config.split)
                this.master.Action({
                    action: "split-resize",
                    id: id,
                });
        },
    };
    var move = {
        dragScroll: {
            direction: "x",
        },
        $dragPos: function (pos) {
            var ctx = this.getContext();
            var node = ctx.node, l = ctx.l, t = ctx.t, x = ctx.x, id = ctx.id, scroll = ctx.scroll;
            var nscroll = this.view.getScrollState();
            var dx = (ctx.dx = pos.x - x - scroll.x + nscroll.x);
            pos.x = l + dx;
            pos.y = t;
            this.master.Action({
                action: "drag-task",
                id: id,
                left: pos.x,
                width: parseInt(node.style.width),
            });
            if (this.master.app.config.split)
                this.master.Action({
                    action: "split-resize",
                    id: id,
                });
        },
    };
    var progress = {
        $dragCreate: function (t, e, id) {
            var ctx = this.getContext();
            var node = this.view.getItemNode(id);
            var prevProgress = this.view.getItem(id).progress;
            var progressNode = node.querySelector(".webix_gantt_progress");
            var evContext = this.getEventContext(e, ctx);
            var scroll = this.view.getScrollState();
            webix.extend(ctx, {
                id: id,
                node: node,
                prevProgress: prevProgress,
                progressNode: progressNode,
                from: this.view,
                x: evContext.x,
                w: parseInt(node.style.width),
                scroll: scroll,
            }, true);
            if (!this.master.app.callEvent("bars:beforedrag", [
                this.view.getItem(id),
                ctx,
            ]))
                return false;
            t.style.cursor = "ew-resize";
            webix.html.addCss(t, "webix_gantt_in_action", true);
            webix.html.addCss(node, "webix_gantt_mode_progress", true);
            var html = webix.html.create("div", { visibility: "hidden" });
            document.body.appendChild(html);
            return html;
        },
        $dragPos: function (pos) {
            var ctx = this.getContext();
            var x = ctx.x, scroll = ctx.scroll, w = ctx.w, node = ctx.node;
            var nscroll = this.view.getScrollState();
            var dx = pos.x - x - scroll.x + nscroll.x;
            var progress = Math.min(Math.max(ctx.prevProgress + Math.round((dx * 100) / w), 0), 100);
            if (ctx.progress != progress) {
                ctx.progress = progress;
                Modes[ctx.mode].updateTaskTemplate.call(this, ctx, progress);
            }
            var colors = { contrast: "#393939", dark: "#20262B" };
            node.style.zIndex = "3";
            node.style.boxShadow = colors[webix.skin.$name || "#ffffff"] + " -1px 0px 0px";
        },
        $drop: function () {
            var ctx = this.getContext();
            var id = ctx.id, progress = ctx.progress, prevProgress = ctx.prevProgress;
            if (!webix.isUndefined(progress) &&
                progress != prevProgress &&
                this.master.app.callEvent("bars:beforedrop", [this.view.getItem(id), ctx]))
                ctx["$waitUpdate"] = this.master.Action({
                    action: "update-task-progress",
                    progress: progress,
                    id: id,
                });
        },
        $dragDestroy: function (t, node) {
            var _this = this;
            var ctx = this.getContext();
            if (ctx.$waitUpdate) {
                ctx.$waitUpdate.catch(function () {
                    _this.master.Action({ action: "update-task-progress", id: ctx.id });
                });
            }
            else
                ctx.$waitUpdate = this.master.Action({
                    action: "update-task-progress",
                    id: ctx.id,
                });
            t.style.cursor = "";
            webix.html.removeCss(t, "webix_gantt_in_action");
            webix.html.removeCss(ctx.node, "webix_gantt_mode_progress");
            webix.html.remove(node);
            return false;
        },
        updateTaskTemplate: function (ctx, progress) {
            var node = ctx.progressNode;
            node.style.width = progress + "%";
            node.innerHTML = this.master.DragProgressTemplate(progress);
        },
    };
    var split$1 = {
        $dragCreate: function (t, e) {
            var selection = webix.html.create("DIV", {
                class: "webix_gantt_split_selection",
            });
            var scales = this.Local.getScales();
            var scroll = this.view.getScrollState();
            var tb = e.target.getBoundingClientRect();
            var index = Math.floor((e.y - tb.y + scroll.y) / scales.cellHeight);
            var offsetX = e.x - tb.x;
            selection.style.top = index * scales.cellHeight + 6 + "px";
            selection.style.left = offsetX + scroll.x + "px";
            selection.style.height = scales.cellHeight - 14 + "px";
            selection.style.width = "0px";
            var step = scales.cellWidth;
            if (scales.precise) {
                var nsc = this.master.app
                    .getService("helpers")
                    .getSmallerCount(scales.minUnit);
                step = Math.round(step / (typeof nsc === "number" ? nsc : nsc()));
            }
            var ctx = this.getContext();
            webix.extend(ctx, {
                from: this.view,
                node: selection,
                start: { offsetX: offsetX, clientX: e.clientX },
                index: index,
                step: step,
                scroll: scroll,
            }, true);
            t.appendChild(selection);
            var html = webix.html.create("div", { visibility: "hidden" });
            document.body.appendChild(html);
            return html;
        },
        $dragPos: function (pos) {
            var ctx = this.getContext();
            var width = (ctx.dx = pos.x - ctx.start.clientX);
            if (pos.x < ctx.start.clientX) {
                ctx.node.style.left = ctx.start.offsetX + ctx.scroll.x + width + "px";
                ctx.node.style.width = -width + "px";
            }
            else {
                ctx.node.style.left = ctx.start.offsetX + ctx.scroll.x + "px";
                ctx.node.style.width = pos.x - ctx.start.clientX + "px";
            }
        },
        $drop: function () {
            var ctx = this.getContext();
            var id = this.view.getIdByIndex(ctx.index);
            var start = Math.round((ctx.start.offsetX + ctx.scroll.x) / ctx.step);
            var end = Math.round(ctx.dx / ctx.step);
            if (end < 0) {
                start = start + end;
                end *= -1;
            }
            this.master.Action({ action: "add-task", id: id, dates: { start: start, end: end } });
        },
        $dragDestroy: function (t, node) {
            var ctx = this.getContext();
            webix.html.remove(node);
            webix.html.remove(ctx.node);
            return false;
        },
    };
    var Modes = {
        links: links,
        move: move,
        progress: progress,
        start: resize,
        end: resize,
        split: split$1,
    };

    var BarsView = (function (_super) {
        __extends(BarsView, _super);
        function BarsView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        BarsView.prototype.config = function () {
            var _this = this;
            this.State = this.getParam("state", true);
            var _ = this.app.getService("locale")._;
            return {
                view: "abslayout",
                css: this.State.readonly || !this.app.config.links
                    ? "webix_gantt_readonly"
                    : "",
                borderless: true,
                cells: [
                    {
                        view: "template",
                        css: "webix_gantt_holidays",
                        borderless: true,
                        relative: true,
                    },
                    {
                        view: "template",
                        css: "webix_gantt_links",
                        borderless: true,
                        relative: true,
                    },
                    {
                        view: "list",
                        borderless: true,
                        type: this.BarsType(_),
                        css: "webix_gantt" + (webix.env.touch ? "_touch" : "") + "_bars",
                        on: {
                            onItemClick: function (id) { return _this.ItemClickHandler(id); },
                        },
                        tooltip: function (obj) { return _this.GetTooltip(obj, _); },
                        scroll: "xy",
                        relative: true,
                    },
                ],
            };
        };
        BarsView.prototype.init = function (view) {
            var _this = this;
            var _a = view.getChildViews(), holidays = _a[0], links = _a[1], bars = _a[2];
            this.Holidays = holidays;
            this.Links = links;
            this.Bars = bars;
            this.Ops = this.app.getService("operations");
            this.Helpers = this.app.getService("helpers");
            var local = (this.Local = this.app.getService("local"));
            var scales = local.getScales();
            var linkCollection = local.links();
            var ldata = (this.LinksData = linkCollection.data);
            this.Calendars = this.app.config.resourceCalendars;
            this.HandleScroll();
            this.HandleDrag(scales);
            this.HandleSelection(scales);
            this.InitMarkers();
            this.HandleHolidays(scales);
            this.on(this.State.$changes, "display", function (v, old) {
                _this.SyncData(true);
                if (old) {
                    _this.Local.refreshLinks();
                    _this.RefreshLinks();
                    if (_this.Calendars)
                        _this.RenderResourceHolidays();
                }
            });
            this.DrawGrid(view, scales);
            if (this.Calendars)
                this.RenderResourceHolidays(scales);
            this.on(this.app, "onScalesUpdate", function (scales) {
                _this.DrawGrid(view, scales);
                _this.Bars.refresh();
                _this.RefreshLinks();
            });
            this.on(this.VisibleTasks.data, "onStoreUpdated", function (id, data, action) {
                _this.RefreshLinks();
                if (action !== "update")
                    _this.ApplySelection();
                if (!action && _this.Calendars)
                    _this.RenderResourceHolidays();
            });
            this.on(ldata, "onStoreUpdated", function () {
                _this.RefreshLinks();
            });
            this.on(this.State.$changes, "criticalPath", function (v, o) {
                if (!webix.isUndefined(o)) {
                    _this.Local.showCriticalPath(!v);
                    _this.RefreshLinks();
                }
            });
            this.on(this.State.$changes, "compact", function () {
                _this.RefreshLinks();
            });
            if (this.Calendars)
                this.on(this.Local.assignments().data, "onStoreUpdated", function (id, data, action) {
                    _this.RenderResourceHolidays();
                    if (_this.app.config.excludeHolidays && action) {
                        var task = _this.Local.tasks().getItem(data.task);
                        if (task)
                            _this.Ops.updateAssignedTaskDates(task);
                    }
                });
            this.on(this.State.$changes, "baseline", function (v, o) {
                if (!webix.isUndefined(o))
                    _this.Local.updateScaleMinMax(_this.VisibleTasks);
            });
        };
        BarsView.prototype.ItemClickHandler = function (id) {
            if (!this.Bars.getItem(id).$group)
                this.State.$batch({
                    parent: null,
                    selected: id,
                });
        };
        BarsView.prototype.DrawGrid = function (view, scales) {
            var colors = { contrast: "#808080", dark: "#384047" };
            view.$view.style.backgroundImage = "url(" + this.app
                .getService("helpers")
                .drawGridInner(scales.cellWidth, scales.cellHeight, colors[webix.skin.$name] || "#ccc") + ")";
            view.$view.style.marginTop = "0px";
            var state = this.app.getState();
            view.$view.style.backgroundPosition = "-" + state.left + "px -" + state.top + "px";
            this.Resize(scales.width);
        };
        BarsView.prototype.SyncData = function (unselect) {
            var _this = this;
            this.Bars.clearAll();
            this.VisibleTasks = this.Local.getVisibleTasksCollection();
            if (this.Calendars) {
                this.Local.taskCalendarMap().then(function () {
                    _this.Bars.sync(_this.VisibleTasks);
                });
            }
            else
                this.Bars.sync(this.VisibleTasks);
            this.ApplySelection(unselect);
        };
        BarsView.prototype.BarsTemplate = function (obj, _) {
            var text = obj.text || (obj.$group ? _("Unassigned") : _("(no title)"));
            return obj.type == "milestone" ? "<span>" + text + "</span>" : text;
        };
        BarsView.prototype.BarsType = function (_) {
            var _this = this;
            return {
                template: function (obj) {
                    if (_this.State.display === "tasks" &&
                        obj.type === "split" &&
                        obj.$data &&
                        obj.$data.length) {
                        var _a = _this.GetSplitBox(obj), height = _a.height, width = _a.width, left = _a.left, top_1 = _a.top;
                        var html_1 = "<div class=\"webix_gantt_split_container\" webix_s_id=\"" + obj.id + "\" style=\"top:" + top_1 + "px;left:" + left + "px;height:" + height + "px;width:" + width + "px;\"></div>";
                        var order = _this.VisibleTasks.data.order;
                        var isLast_1 = order.length > 1 && obj.id == order[order.length - 1];
                        obj.$data.forEach(function (kid) {
                            html_1 +=
                                _this.TemplateStart(kid, isLast_1, true) +
                                    _this.BarsTemplate(kid, _) +
                                    _this.TemplateEnd(kid);
                        });
                        return html_1;
                    }
                    else
                        return _this.BarsTemplate(obj, _);
                },
                templateStart: function (task) {
                    if (_this.State.display === "tasks" &&
                        task.type === "split" &&
                        task.$data &&
                        task.$data.length)
                        return "";
                    var order = _this.VisibleTasks.data.order;
                    var isLast = order.length > 1 && task.id == order[order.length - 1];
                    return _this.TemplateStart(task, isLast);
                },
                templateEnd: function (task) {
                    if (_this.State.display === "tasks" &&
                        task.type === "split" &&
                        task.$data &&
                        task.$data.length)
                        return "";
                    return _this.TemplateEnd();
                },
            };
        };
        BarsView.prototype.GetSplitBox = function (obj) {
            var last = obj.$data[0];
            var first = obj.$data[obj.$data.length - 1];
            var left = first.$x + (first.type == "milestone" ? Math.floor(first.$w / 2) : 0);
            var rwidth = last.type == "milestone" ? Math.floor(last.$w / 2) : last.$w;
            return {
                top: last.$y,
                left: left,
                height: last.$h,
                width: last.$x - left + rwidth,
            };
        };
        BarsView.prototype.TemplateStart = function (task, last, split) {
            var w = task.$w, h = task.$h, diff = 0, progress = "";
            var css = this.BarCSS(task, last);
            var contentCss = this.ContentCss(task);
            if (task.type == "milestone") {
                w = h = Math.ceil(Math.sqrt(Math.pow(task.$w, 2) / 2));
                diff = Math.ceil((task.$w - w) / 2);
            }
            else {
                var drag = task.type == "task" ? this.DragProgressTemplate(task.progress) : "";
                progress = "<div class=\"webix_gantt_progress\" style=\"width:" + task.progress + "%;\">" + drag + "</div>";
            }
            var baseline = "";
            if (this.State.baseline &&
                task.type !== "milestone" &&
                task.planned_start &&
                !split)
                baseline = this.TemplateBaseline(task);
            return (baseline +
                ("<div webix_l_id=\"" + task.id + "\" class=\"" + css + "\" \n\t\t\tstyle=\"left:" + (task.$x + diff) + "px;top:" + (task.$y +
                    diff -
                    (baseline ? 1 : 0)) + "px;width:" + w + "px;height:" + h + "px;\" \n\t\t\tdata-id=\"" + task.id + "\">\n\t\t\t\t<div class=\"webix_gantt_link webix_gantt_link_left\"></div>\n\t\t\t\t" + progress + "\n\t\t\t\t<div class=\"webix_gantt_content " + contentCss + "\">"));
        };
        BarsView.prototype.TemplateBaseline = function (t) {
            return "<div  \n\t\t\tclass=\"webix_gantt_baseline_" + t.type + "\" \n\t\t\tstyle=\"left:" + t.$x0 + "px;top:" + (t.$y + t.$h - 2) + "px;width:" + t.$w0 + "px; \" \n\t\t\tdata-baseid=\"" + t.id + "\"></div>";
        };
        BarsView.prototype.BarCSS = function (task, last) {
            var css = "webix_gantt_task_base webix_gantt_" + (task.type === "split" ? "task" : task.type);
            if (task.$critical)
                css += " webix_gantt_critical";
            if (task.$group)
                css += " webix_gantt_group";
            if (last)
                css += " webix_gantt_last";
            if (task.css && task.type != "milestone")
                css += " " + task.css;
            return css;
        };
        BarsView.prototype.ContentCss = function (task) {
            return task.css && task.type == "milestone" ? " " + task.css : "";
        };
        BarsView.prototype.TemplateEnd = function () {
            return "</div><div class=\"webix_gantt_link webix_gantt_link_right\"></div></div>";
        };
        BarsView.prototype.DragProgressTemplate = function (progress) {
            return "<div class=\"webix_gantt_progress_drag\" style=\"left:" + progress + "%\">\n\t\t\t<span class=\"webix_gantt_progress_percent\">" + progress + "</span>\n\t\t</div>";
        };
        BarsView.prototype.HandleDrag = function () {
            var _this = this;
            initDnD.call(this, this.Bars);
            this._mousemove_handler = webix.event(this.Bars.$view, "pointermove", function (e) {
                if (e.pointerType == "mouse")
                    switchCursor(e, _this.Bars);
            });
        };
        BarsView.prototype.destroy = function () {
            this._mousemove_handler = webix.eventRemove(this._mousemove_handler);
            this._scroll_handler = webix.eventRemove(this._scroll_handler);
            var markers = this.app.config.markers;
            if (markers)
                for (var i = 0; i < markers.length; i++) {
                    var m = markers[i];
                    if (m.$interval)
                        m.$interval = clearInterval(m.$interval);
                }
        };
        BarsView.prototype.GetLinks = function (temp) {
            return this.Links.$view.querySelector(".webix_gantt_" + (temp ? "temp_line" : "lines"));
        };
        BarsView.prototype.HandleScroll = function () {
            var _this = this;
            this._scroll_handler = webix.event(this.Bars.$view, "scroll", function (ev) {
                var bars = ev.target;
                var top = Math.round(bars.scrollTop);
                var left = Math.round(bars.scrollLeft);
                _this.holidaysContainer.style.height = 0 + "px";
                _this.containerForMarkers.style.height = 0 + "px";
                if (_this.app.config.links) {
                    var lines = _this.GetLinks();
                    var temp = _this.GetLinks(true);
                    var attrs = {
                        viewBox: left + " " + top + " " + bars.scrollWidth + " " + bars.scrollHeight,
                        width: bars.scrollWidth,
                        height: bars.scrollHeight,
                    };
                    for (var key in attrs) {
                        lines.setAttribute(key, attrs[key]);
                        temp.setAttribute(key, attrs[key]);
                    }
                }
                _this.SetHolidaysScroll(bars.scrollHeight, left, top);
                _this.containerForMarkers.style.height = bars.scrollHeight + "px";
                _this.getRoot().$view.style.backgroundPosition = "-" + left + "px -" + top + "px";
                _this.State.$batch({ top: top, left: left });
            });
            this.on(this.State.$changes, "top", function (y) {
                _this.Bars.scrollTo(_this.State.left, y);
            });
            if (this.app.config.resources) {
                this.on(this.State.$changes, "left", function (v) {
                    if (_this.State.resourcesDiagram)
                        _this.Bars.scrollTo(v, _this.State.top);
                });
                this.on(this.app, "rdiagram:resize", function () {
                    _this.holidaysContainer.style.height =
                        _this.Bars.$view.scrollHeight + "px";
                    _this.containerForMarkers.style.height =
                        _this.Bars.$view.scrollHeight + "px";
                });
            }
        };
        BarsView.prototype.SetHolidaysScroll = function (height, x, y) {
            this.holidaysContainer.style.height = height + "px";
            this.holidaysContainer.style.left = -x + "px";
            this.holidaysContainer.style.top = -y + "px";
            if (this.Calendars) {
                this.resHolidaysContainer.style.height = height + "px";
                this.resHolidaysContainer.style.left = -x + "px";
                this.resHolidaysContainer.style.top = -y + "px";
            }
        };
        BarsView.prototype.HandleSelection = function (scales) {
            var _this = this;
            this.selLine = webix.html.create("DIV", {
                class: "webix_gantt_bar_selection",
                style: "height:" + scales.cellHeight + "px;width:" + scales.width + "px",
            });
            this.Bars.$view.insertBefore(this.selLine, this.Bars.$view.firstChild);
            this.on(this.State.$changes, "selected", function () { return _this.ApplySelection(); });
        };
        BarsView.prototype.ApplySelection = function (unselect) {
            var id = this.State.selected;
            var top = -100;
            if (id && this.Bars.data.order.length) {
                var ind = (top = this.Bars.getIndexById(id));
                var task = this.Bars.getItem(id);
                if (ind < 0) {
                    if (this.State.display == "tasks" &&
                        task &&
                        task.parent != 0 &&
                        this.Bars.getItem(task.parent).type === "split") {
                        ind = this.Bars.getIndexById(task.parent);
                    }
                    else if (unselect && !this.Bars.exists(id)) {
                        this.State.selected = null;
                    }
                }
                top = ind * this.Local.getScales().cellHeight;
                this.ScrollToTask(task);
            }
            this.selLine.style.top = top + "px";
        };
        BarsView.prototype.ScrollToTask = function (task) {
            if (task) {
                var bars = this.Bars;
                if (task.$x > bars.$width - this.Local.getScales().cellWidth ||
                    task.$x < bars.$view.scrollLeft) {
                    this.State.left = task.$x - 30;
                }
            }
            this.Bars.scrollTo(this.State.left, this.State.top);
        };
        BarsView.prototype.InitMarkers = function () {
            var _this = this;
            this.containerForMarkers = webix.html.create("DIV", {
                class: "webix_gantt_markers",
                style: "height:" + this.Bars.$view.scrollHeight + "px",
            });
            this.Bars.$view.insertBefore(this.containerForMarkers, this.Bars.$view.firstChild);
            this.RenderMarkers(this.app.config.markers);
            this.on(this.app, "onScalesUpdate", function () {
                return _this.RenderMarkers(_this.app.config.markers);
            });
        };
        BarsView.prototype.RenderMarkers = function (markers) {
            var _this = this;
            if (!markers)
                return;
            var html = [];
            for (var i = 0; i < markers.length; i++) {
                var m = markers[i];
                if (m.now) {
                    m.start_date = new Date();
                    if (!m.$interval)
                        m.$interval = setInterval(function (item) {
                            var node = _this.containerForMarkers.querySelector("[gantt_now=\"" + item.$interval + "\"]");
                            node.style.left = _this.GetMarkerPosition(new Date()) + "px";
                        }, 5 * 60 * 1000, m);
                }
                html.push(this.MarkerTemplate(markers[i]));
            }
            this.containerForMarkers.innerHTML = html.join("");
        };
        BarsView.prototype.MarkerTemplate = function (obj) {
            var text = obj.text
                ? "<span class=\"webix_gantt_marker_text\">" + obj.text + "</span>"
                : "";
            return "<div\n\t\t\tgantt_now=\"" + obj.$interval + "\"\n\t\t\tclass=\"webix_gantt_marker " + (obj.css || "") + "\"\n\t\t\tstyle=\"left:" + this.GetMarkerPosition(obj.start_date) + "px\">" + text + "</div>";
        };
        BarsView.prototype.GetMarkerPosition = function (date) {
            var _a = this.Local.getScales(), start = _a.start, end = _a.end, cellWidth = _a.cellWidth, diff = _a.diff, minUnit = _a.minUnit;
            var astart = this.Helpers.getUnitStart(minUnit, start);
            return date < start || date > end
                ? -100
                : Math.round(diff(date, astart, webix.Date.startOnMonday, true) * cellWidth);
        };
        BarsView.prototype.LinksTemplate = function (lines, css) {
            var bars = this.Bars.$view;
            return "<svg\n\t\t\tclass=\"" + css + "\"\n\t\t\tviewBox=\"" + this.State.left + " " + this.State.top + " " + bars.scrollWidth + " " + bars.scrollHeight + "\"\n\t\t\twidth=\"" + bars.scrollWidth + "\"\n\t\t\theight=\"" + bars.scrollHeight + "\"\n\t\t>" + lines + "</svg>";
        };
        BarsView.prototype.RefreshLinks = function () {
            var _this = this;
            var lines = [];
            if (this.LinksData.count() && this.VisibleTasks.count()) {
                var links_1 = this.LinksData;
                links_1.order.each(function (id) {
                    var link = links_1.getItem(id);
                    if (link.$p) {
                        var critical = _this.State.criticalPath && _this.Local.isLinkCritical(link);
                        lines.push("<polyline data-id=\"" + id + "\" " + (critical ? "class='webix_gantt_line_critical'" : "") + " points=\"" + link.$p + "\" />");
                    }
                });
            }
            var html = this.LinksTemplate(lines.join(""), "webix_gantt_lines") +
                this.LinksTemplate('<polyline points="" />', "webix_gantt_temp_line");
            this.Links.setHTML(html);
        };
        BarsView.prototype.RefreshTaskLinks = function (tid) {
            var _this = this;
            this.LinksData.find(function (a) { return a.source == tid || a.target == tid; }).forEach(function (obj) {
                var l = _this.Links.$view.querySelector("[data-id=\"" + obj.id + "\"]");
                if (l) {
                    var s = _this.VisibleTasks.getItem(obj.source);
                    var e = _this.VisibleTasks.getItem(obj.target);
                    _this.Helpers.updateLink(obj, s, e);
                    l.setAttribute("points", obj.$p);
                }
            });
        };
        BarsView.prototype.Resize = function (width) {
            var area = this.Bars.$view.querySelector(".webix_scroll_cont");
            area.style.width = width + "px";
            area.style.minHeight = "1px";
            if (this.selLine)
                this.selLine.style.width = width + "px";
        };
        BarsView.prototype.Action = function (obj) {
            var ops = this.app.getService("operations");
            var inProgress = null;
            if (obj.action === "update-task-time") {
                if (obj.time) {
                    inProgress = ops.updateTaskTime(obj.id, obj.mode, obj.time);
                }
                else {
                    this.Local.refreshTasks(obj.id);
                    if (this.State.display === "resources") {
                        this.VisibleTasks.refresh(obj.id);
                    }
                    this.RefreshTaskLinks(obj.id);
                }
            }
            else if (obj.action === "update-task-progress") {
                if (!webix.isUndefined(obj.progress)) {
                    inProgress = ops.updateTask(obj.id, { progress: obj.progress });
                }
                else {
                    var task = this.VisibleTasks.getItem(obj.id);
                    this.Bars.render(obj.id, task, "paint");
                }
            }
            else if (obj.action === "drag-task") {
                var task = this.VisibleTasks.getItem(obj.id);
                task.$x = parseInt(obj.left);
                task.$w = parseInt(obj.width);
                this.RefreshTaskLinks(obj.id);
            }
            else if (obj.action === "add-link") {
                var source = obj.source, target = obj.target, type = obj.type;
                inProgress = ops.addLink({ source: source, target: target, type: type });
            }
            else if (obj.action === "temp-link") {
                var start = obj.start, end = obj.end;
                var link = this.GetLinks(true).firstChild;
                if (!start) {
                    link.setAttribute("points", "");
                }
                else {
                    var _a = this.app
                        .getService("helpers")
                        .newLink(this.Links.$view.getBoundingClientRect(), start, end), left = _a.left, top_2 = _a.top, p = _a.p;
                    var shift_1 = [left, top_2];
                    var points = p
                        .split(",")
                        .map(function (a, i) { return a * 1 + shift_1[i % 2]; })
                        .join(",");
                    link.setAttribute("points", points);
                }
            }
            else if (obj.action === "add-task") {
                var scales = this.Local.getScales();
                var unit = scales.precise
                    ? this.Helpers.getSmallerUnit(scales.minUnit)
                    : scales.minUnit;
                var start = this.Helpers.addUnit(unit, scales.start, obj.dates.start);
                var end = this.Helpers.addUnit(unit, start, obj.dates.end);
                this.app.callEvent("task:add", [obj.id, { start: start, end: end }]);
            }
            else if (obj.action === "split-resize" &&
                this.State.display !== "resources") {
                var task = this.VisibleTasks.getItem(obj.id);
                if (task.parent != 0) {
                    var parent_1 = this.VisibleTasks.getItem(task.parent);
                    if (parent_1.type === "split") {
                        var splitCont = this.Bars.$view.querySelector("[webix_s_id=\"" + task.parent + "\"]");
                        parent_1.$data.sort(function (a, b) { return b.$x - a.$x; });
                        var _b = this.GetSplitBox(parent_1), width = _b.width, left = _b.left;
                        splitCont.style.width = width + "px";
                        splitCont.style.left = left + "px";
                    }
                }
            }
            return inProgress || webix.promise.resolve();
        };
        BarsView.prototype.HandleHolidays = function (scales) {
            var _this = this;
            var html = "<div class='webix_gantt_bar_holidays' style='height:" +
                this.Bars.$view.scrollHeight +
                "px'></div>";
            if (this.Calendars)
                html +=
                    "<div class='webix_gantt_bar_resource_holidays' style='height:" +
                        this.Bars.$view.scrollHeight +
                        "px'></div>";
            this.Holidays.setHTML(html);
            this.holidaysContainer = this.Holidays.$view.querySelector(".webix_gantt_bar_holidays");
            this.resHolidaysContainer = this.Holidays.$view.querySelector(".webix_gantt_bar_resource_holidays");
            this.RenderHolidays(scales);
            this.on(this.app, "onScalesUpdate", function (scales) { return _this.RenderHolidays(scales); });
            this.on(this.app.getRoot(), "onViewShow", function () {
                _this.refresh();
            });
        };
        BarsView.prototype.EachScaleDate = function (scales, func) {
            if (scales.minUnit === "day" || scales.minUnit === "hour") {
                var date = webix.Date.copy(scales.start);
                var end = webix.Date.dayStart(scales.end);
                if (!(scales.end - end)) {
                    end = webix.Date.add(end, -1, "day", true);
                }
                var hourOffset = scales.start.getHours();
                while (date <= end) {
                    func.call(this, date, hourOffset);
                    date = webix.Date.add(webix.Date.dayStart(date), 1, "day", true);
                    hourOffset = webix.Date.equal(date, end)
                        ? 24 - Math.ceil(webix.Date.timePart(scales.end) / 60 / 60)
                        : 0;
                }
            }
        };
        BarsView.prototype.RenderHolidays = function (scales) {
            var _this = this;
            if (this.holidaysContainer) {
                var html_2 = "";
                this.EachScaleDate(scales, function (date, hourOffset) {
                    if (scales.isHoliday(date)) {
                        html_2 += _this.HolidayTemplate(scales, date, hourOffset);
                    }
                });
                this.holidaysContainer.innerHTML = html_2;
                if (this.Calendars)
                    this.RenderResourceHolidays(scales);
            }
        };
        BarsView.prototype.MarkResourceHolidays = function (scales, id, calendar) {
            var _this = this;
            var index = this.Bars.getIndexById(id);
            if (index < 0)
                return "";
            var html = "", n = 0, dateStart = null;
            this.EachScaleDate(scales, function (date, hourOffset) {
                var isHoliday = scales.isHoliday(date);
                if (_this.Helpers.isResourceHoliday(date, calendar)) {
                    if (!isHoliday) {
                        if (!n)
                            dateStart = date;
                        n++;
                    }
                    else if (n) {
                        html += _this.ResourceHolidayTemplate(scales, dateStart, hourOffset, index, n);
                        n = 0;
                    }
                }
                else if (isHoliday) {
                    if (n) {
                        html += _this.ResourceHolidayTemplate(scales, dateStart, hourOffset, index, n);
                        n = 0;
                    }
                    html += _this.ResourceWorkDayTemplate(scales, date, hourOffset, index);
                }
            });
            return html;
        };
        BarsView.prototype.RenderResourceHolidays = function (scales) {
            var _this = this;
            if (this.resHolidaysContainer) {
                scales = scales || this.Local.getScales();
                this.Local.taskCalendarMap().then(function (data) {
                    var html = "";
                    if (data)
                        for (var taskId in data)
                            html += _this.MarkResourceHolidays(scales, taskId, data[taskId]);
                    _this.resHolidaysContainer.innerHTML = html;
                });
            }
        };
        BarsView.prototype.GetDateBox = function (scales, date, hourOffset, i) {
            var astart = this.Helpers.getUnitStart(scales.minUnit, scales.start);
            var x = Math.round(scales.diff(date, astart) * scales.cellWidth);
            var w = (scales.minUnit === "hour" ? 24 - hourOffset : 1) * scales.cellWidth;
            var box = { x: x, w: w };
            if (i || i === 0) {
                box.y = scales.cellHeight * i;
                box.h = scales.cellHeight;
            }
            return box;
        };
        BarsView.prototype.HolidayTemplate = function (scales, date, hourOffset) {
            var _a = this.GetDateBox(scales, date, hourOffset), x = _a.x, w = _a.w;
            var style = "left:" + x + "px;width:" + w + "px;";
            return "<div class='webix_gantt_holiday' style='" + style + "'></div>";
        };
        BarsView.prototype.ResourceHolidayTemplate = function (scales, date, hourOffset, i, n) {
            var _a = this.GetDateBox(scales, date, hourOffset, i), x = _a.x, y = _a.y, w = _a.w, h = _a.h;
            var style = "left:" + x + "px;width:" + w * n + "px;top:" + y + "px;height:" + h + "px;";
            return "<div class='webix_gantt_holiday' style='" + style + "'></div>";
        };
        BarsView.prototype.ResourceWorkDayTemplate = function (scales, date, hourOffset, i) {
            var _a = this.GetDateBox(scales, date, hourOffset, i), x = _a.x, y = _a.y, w = _a.w, h = _a.h;
            var style = "left:" + (x + 0.2) + "px;width:" + (w - 1.2) + "px;top:" + y + "px;height:" + (h -
                1) + "px;";
            return "<div class='webix_gantt_work_day' style='" + style + "'></div>";
        };
        BarsView.prototype.GetTooltip = function (obj, _) {
            var parser = webix.i18n.longDateFormatStr;
            var tip = (obj.text || _("(no title)")) + "<br>\n\t\t\t<br>" + _("Start date") + ": " + parser(obj.start_date);
            if (obj.type != "milestone") {
                tip += "<br>" + _("End date") + ": " + parser(obj.end_date) + "\n\t\t\t<br>" + _("Lasts") + " " + obj.duration + " " + (obj.duration > 1 ? _("days") : _("day"));
            }
            return tip;
        };
        return BarsView;
    }(JetView));

    var ScalesView = (function (_super) {
        __extends(ScalesView, _super);
        function ScalesView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ScalesView.prototype.config = function () {
            return { view: "template", height: 20, css: "webix_gantt_scale" };
        };
        ScalesView.prototype.init = function () {
            var _this = this;
            this.State = this.getParam("state", true);
            this.Local = this.app.getService("local");
            var scales = this.Local.getScales();
            this.RenderScales(scales);
            this.on(this.app, "onScalesUpdate", function (scales) { return _this.RenderScales(scales); });
        };
        ScalesView.prototype.ready = function () {
            var view = this.getRoot();
            this.on(this.State.$changes, "left", function (x) { return view.scrollTo(x, null); });
        };
        ScalesView.prototype.RenderScales = function (s) {
            var _this = this;
            var view = this.getRoot();
            var html = s.rows
                .map(function (line) {
                var canMarkHolidays = (line.type === "hour" || line.type === "day") && line.step === 1;
                return ("<div class=\"webix_gantt_scale_row\" style='height:" + line.height + "px;width:" + s.width + "px'>" +
                    line.cells
                        .map(function (cell) { return _this.CellTemplate(cell, canMarkHolidays); })
                        .join("") +
                    "</div>");
            })
                .join("");
            view.config.height = s.height;
            view.setHTML(html);
            view.resize();
        };
        ScalesView.prototype.CellTemplate = function (cell, canMarkHolidays) {
            return "<div class=\"webix_gantt_scale_cell " + (cell.css +
                (canMarkHolidays && this.app.config.isHoliday(cell.date)
                    ? "webix_gantt_holiday_scale"
                    : "")) + "\" style=\"width:" + cell.width + "px;\">" + this.FormatDate(cell.date, cell.format) + "</div>";
        };
        ScalesView.prototype.FormatDate = function (date, format) {
            if (typeof format === "string")
                format = webix.Date.dateToStr(format);
            return format(date);
        };
        return ScalesView;
    }(JetView));

    var ChartView = (function (_super) {
        __extends(ChartView, _super);
        function ChartView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ChartView.prototype.config = function () {
            return { rows: [ScalesView, BarsView] };
        };
        ChartView.prototype.init = function () {
            var _this = this;
            this.on(this.app, "bars:toggle", function (v) {
                if (v)
                    _this.getRoot().show();
                else
                    _this.getRoot().hide();
            });
        };
        return ChartView;
    }(JetView));

    var DiagramView = (function (_super) {
        __extends(DiagramView, _super);
        function DiagramView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DiagramView.prototype.config = function () {
            this.State = this.getParam("state", true);
            return {
                view: "abslayout",
                css: " webix_gantt_readonly",
                cells: [
                    {
                        view: "template",
                        css: "webix_gantt_holidays",
                        borderless: true,
                        relative: true,
                    },
                    {
                        view: "tree",
                        borderless: true,
                        type: this.WorkloadMarkersType(),
                        css: "webix_gantt" + (webix.env.touch ? "_touch" : "") + "_bars webix_gantt_resdiagram_chart",
                        scroll: "xy",
                        relative: true,
                        filterMode: {
                            showSubItems: false,
                            level: 0,
                        },
                    },
                ],
            };
        };
        DiagramView.prototype.init = function (view) {
            var _this = this;
            var _a = view.getChildViews(), holidays = _a[0], bars = _a[1];
            this.Holidays = holidays;
            this.Bars = bars;
            this.LocalState = this.getParam("localState");
            this.Unit = "hours";
            var local = (this.Local = this.app.getService("local"));
            var scales = (this.Scales = local.getScales());
            this.RDCollection = this.app.getService("grouping").getRDCollection();
            this.Helpers = this.app.getService("helpers");
            this.on(this.Bars.data, "onSyncApply", function () {
                _this.Scales = _this.Local.getScales();
                _this.RestoreTreeState();
                if (_this.Calendars)
                    _this.RenderResourceHolidays();
            });
            this.Bars.sync(this.RDCollection, function () {
                this.filter(function (t) { return t.$group; });
            });
            this.Calendars = this.app.config.resourceCalendars;
            this.DrawGrid(view, scales);
            this.HandleScroll();
            this.HandleHolidays(scales);
            this.on(this.app, "onScalesUpdate", function (scales) {
                _this.DrawGrid(view, scales);
            });
            this.on(this.app, "rdiagram:branch:toggle", function (id, v) {
                _this.ToggleBranch(id, v);
            });
            this.on(this.app, "rdiagram:resize", function () {
                _this.holidaysContainer.style.height = _this.Bars.$view.scrollHeight + "px";
            });
            this.on(this.app, "rdiagram:sort", function (by, dir, as) {
                if (by)
                    _this.Bars.sort(by, dir, as);
                else
                    _this.Bars.sort(as, dir);
            });
            if (this.Calendars)
                this.on(this.Local.assignments().data, "onStoreUpdated", function () {
                    _this.RenderResourceHolidays();
                });
        };
        DiagramView.prototype.ToggleBranch = function (id, v) {
            var _this = this;
            if (v)
                this.Bars.open(id);
            else
                this.Bars.close(id);
            var root = this.Bars.data.getBranch("0");
            var opened = this.Bars.getState().open.filter(function (i) {
                return root.find(function (o) { return o.id == i; });
            });
            this._treeOpened = opened.map(function (id) { return _this.Bars.getIndexById(id); });
            this.holidaysContainer.style.height = this.Bars.$view.clientHeight + "px";
            if (this.Calendars) {
                this.resHolidaysContainer.style.height =
                    this.Bars.$view.clientHeight + "px";
                this.RenderResourceHolidays();
            }
        };
        DiagramView.prototype.RestoreTreeState = function () {
            var _this = this;
            if (this._treeOpened && this._treeOpened.length) {
                var t_1 = this._treeOpened;
                var root_1 = this.Bars.data.getBranch("0");
                root_1.forEach(function (b) {
                    var ind = root_1.indexOf(b);
                    b.open = !t_1.indexOf(ind);
                    _this.Bars.data.callEvent("onStoreUpdated", [b.id, 0, "branch"]);
                });
            }
            else
                this.Bars.openAll();
        };
        DiagramView.prototype.HandleScroll = function () {
            var _this = this;
            this._scroll_handler = webix.event(this.Bars.$view, "scroll", function (ev) {
                var bars = ev.target;
                var top = Math.round(bars.scrollTop);
                var left = Math.round(bars.scrollLeft);
                _this.getRoot().$view.style.backgroundPosition = "-" + left + "px -" + top + "px";
                _this.State.left = left;
                _this.LocalState.top = top;
                _this.SetHolidaysScroll(bars.scrollHeight, left, top);
            });
            this.on(this.LocalState.$changes, "top", function (y) {
                _this.Bars.scrollTo(_this.State.left, y);
            });
            this.on(this.State.$changes, "left", function (v) {
                _this.Bars.scrollTo(v, _this.LocalState.top);
            });
            this.on(this.app, "rdiagram:unit:change", function (u) {
                _this.Unit = u;
                _this.Bars.render();
            });
        };
        DiagramView.prototype.WorkloadMarkersType = function () {
            var _this = this;
            return {
                template: function (task) { return _this.MarkerTemplate(task); },
                templateStart: function (task, common) { return _this.MarkerStartTemplate(task, common); },
                templateEnd: function () { return "</div>"; },
            };
        };
        DiagramView.prototype.MarkerStartTemplate = function (task, common) {
            return "<div webix_tm_id=\"" + task.id + "\" style=\"height:" + (this.Scales
                .cellHeight - 8) + "px; padding: 4px;\" class=\"" + common.classname(task, common) + " webix_gantt_diagram_line\" " + common.aria(task) + ">";
        };
        DiagramView.prototype.MarkerTemplate = function (task) {
            if (task.$level === 2) {
                var markers = this.GetMarkerData(task);
                var html = [];
                for (var x in markers) {
                    html.push(this.MarkerToHTML(markers[x]));
                }
                return html.join("");
            }
            return "";
        };
        DiagramView.prototype.CheckResourceHoliday = function (date, id) {
            if (this.Calendars) {
                var resId = this.Bars.getItem(id).resource_id;
                if (resId) {
                    var calendarId = this.Local.resources().getItem(resId).calendar_id;
                    if (calendarId) {
                        var calendar = this.Local.calendars().getItem(calendarId);
                        return this.Helpers.isResourceHoliday(date, calendar);
                    }
                }
            }
            return this.app.config.isHoliday(date);
        };
        DiagramView.prototype.GetMarkerData = function (task) {
            var markers = {};
            for (var a = 0; a < task.duration.length; ++a) {
                var d = task.duration[a];
                var hourParts = task.units[a];
                var delta = task.$x[a] - Math.min.apply(Math, task.$x);
                var markerWidth = this.Scales.cellHeight > 40 ? 28 : 20;
                var step = this.Scales.cellWidth - markerWidth;
                var halfStep = Math.round(step / 2);
                var x = delta ? -2 : halfStep;
                var date = webix.Date.copy(task.start_date[a]);
                for (var i = 0; i < d; ++i, x += step) {
                    if (this.app.config.excludeHolidays &&
                        this.CheckResourceHoliday(date, task.id)) {
                        ++d;
                    }
                    else {
                        var hours = 0;
                        if (this.Scales.minUnit !== "hour")
                            hours =
                                (i === d - 1 ? hourParts[1] : i ? hourParts[2] : hourParts[0]) ||
                                    hourParts[2];
                        else {
                            hours = hourParts[2];
                        }
                        var cell = task.$x[a] + i * this.Scales.cellWidth - 2;
                        if (!markers[cell]) {
                            markers[cell] = { hours: hours, x: cell + halfStep, count: 1 };
                        }
                        else {
                            markers[cell].hours += hours;
                            markers[cell].count += 1;
                        }
                        markers[cell].overloaded = this.CheckOverload(markers[cell], task);
                    }
                    webix.Date.add(date, 1, this.Scales.minUnit);
                }
            }
            return markers;
        };
        DiagramView.prototype.CheckOverload = function (marker) {
            if (this.Scales.minUnit === "hour") {
                return Math.round(marker.hours * 24) > this.Helpers.unitLoadNorm.day;
            }
            return marker.hours > this.Helpers.unitLoadNorm[this.Scales.minUnit];
        };
        DiagramView.prototype.MarkerToHTML = function (marker) {
            var over = marker.overloaded ? "webix_gantt_overload" : "";
            var number = this.Unit === "hours"
                ? marker.hours >= 1
                    ? marker.hours
                    : " "
                : marker.count;
            return "<div class=\"webix_gantt_diagram_marker " + over + "\" style=\"left:" + marker.x + "px;\">" + number + "</div>";
        };
        DiagramView.prototype.RenderResourceHolidays = function (scales) {
            var _this = this;
            scales = scales || this.Local.getScales();
            var html = "";
            this.Bars.data.each(function (data) {
                if (data.resource_id) {
                    var calendarId = _this.Local.resources().getItem(data.resource_id)
                        .calendar_id;
                    if (calendarId)
                        html += _this.MarkResourceHolidays(scales, data.id, _this.Local.calendars().getItem(calendarId));
                }
            });
            this.resHolidaysContainer.innerHTML = html;
        };
        return DiagramView;
    }(BarsView));

    function sort(by) {
        return function (a, b) {
            return a[by].localeCompare(b[by], undefined, {
                ignorePunctuation: true,
                numeric: true,
            });
        };
    }
    function arrayEquals(a, b) {
        return a && a.length == b.length && a.every(function (item) { return b.includes(item); });
    }

    var TreeView = (function (_super) {
        __extends(TreeView, _super);
        function TreeView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TreeView.prototype.config = function () {
            var _this = this;
            this.State = this.getParam("state", true);
            var scales = this.app.getService("local").getScales();
            var _ = (this._ = this.app.getService("locale")._);
            var compact = (this.Compact = this.getParam("compact", true));
            var columns = [
                {
                    id: "name",
                    css: "webix_gantt_title",
                    header: compact ? "<span class='webix_icon gti-menu'>" : _("Name"),
                    template: function (obj, common) { return _this.TreeTemplate(obj, common); },
                    fillspace: true,
                    sort: compact ? "" : sort("name"),
                    minWidth: compact ? 44 : 150,
                },
                {
                    id: "load",
                    header: _("Hours"),
                    hidden: compact,
                    batch: "hours",
                    sort: "int",
                    minWidth: 50,
                    resize: false,
                },
                {
                    id: "count",
                    header: _("Tasks"),
                    batch: "tasks",
                    sort: "int",
                    minWidth: 50,
                    hidden: true,
                    resize: false,
                },
            ];
            var skin = webix.skin.$name;
            var headerCss = skin == "material" || skin == "mini" ? "webix_header_border" : "";
            var tree = {
                view: "treetable",
                css: "webix_gantt_resdiagram_tree " + headerCss,
                prerender: true,
                borderless: skin === "contrast",
                width: compact ? 44 : this.State.treeWidth,
                rowHeight: scales.cellHeight,
                headerRowHeight: scales.height,
                scroll: "xy",
                scrollAlignY: false,
                sort: true,
                resizeColumn: {
                    headerOnly: true,
                    size: 10,
                },
                columns: columns,
                tooltip: function () { return ""; },
                on: {
                    onViewResize: function () {
                        _this.State.treeWidth = _this.Tree.$width;
                    },
                    onAfterOpen: function (id) { return _this.ToggleBranch(id, 1); },
                    onAfterClose: function (id) { return _this.ToggleBranch(id, 0); },
                    onAfterSort: function (by, dir, as) { return _this.SortTasks(by, dir, as); },
                    onColumnResize: function (id, v, o, user) { return _this.NormalizeColumns(id, user); },
                },
                onClick: {
                    "gti-menu": function () { return _this.ToggleColumns(); },
                },
                filterMode: {
                    showSubItems: false,
                    level: 0,
                },
            };
            var ls = (this.LocalState = this.getParam("localState"));
            tree.on["onScrollY"] = tree.on["onSyncScroll"] = tree.on["onAfterScroll"] = function () {
                ls.top = this.getScrollState().y;
            };
            return tree;
        };
        TreeView.prototype.init = function (view) {
            var _this = this;
            this.Tree = view;
            this.Helpers = this.app.getService("helpers");
            this.Local = this.app.getService("local");
            this.RDCollection = this.app.getService("grouping").getRDCollection();
            this._unit = "hours";
            this._collapsed = true;
            this.on(this.LocalState.$changes, "top", function (y) {
                _this.Tree.scrollTo(null, y);
            });
            this.on(this.Tree.data, "onSyncApply", function () { return _this.RestoreTreeState(); });
            view.sync(this.RDCollection, function () {
                this.filter(function (t) { return t.$group; });
            });
            this.on(this.State.$changes, "treeWidth", function (v) {
                if (!_this.Compact && view.$width !== v) {
                    view.define({ width: v });
                    view.resize();
                }
            });
            this.on(this.app, "rdiagram:unit:change", function (u) { return _this.ShowInUnits(u); });
            this.on(this.app, "onScalesUpdate", function (scales) {
                var col = _this.Tree.columnId(0);
                _this.Tree.getColumnConfig(col).header[0].height = scales.height;
                _this.Tree.refreshColumns();
            });
        };
        TreeView.prototype.RestoreTreeState = function () {
            var _this = this;
            if (this._treeOpened && this._treeOpened.length) {
                var t_1 = this._treeOpened;
                var root_1 = this.Tree.data.getBranch("0");
                root_1.forEach(function (b) {
                    var ind = root_1.indexOf(b);
                    b.open = !t_1.indexOf(ind);
                    _this.Tree.data.callEvent("onStoreUpdated", [b.id, 0, "branch"]);
                });
            }
            else
                this.Tree.openAll();
        };
        TreeView.prototype.TreeTemplate = function (obj, common) {
            var compact = this.Compact && this._collapsed;
            if (obj.$level == 1)
                return compact
                    ? common.icon(obj)
                    : common.treetable(obj, common) + obj.category;
            if (compact)
                return this.Helpers.resourceAvatar(obj);
            return common.space(obj) + this.Helpers.resourceAvatar(obj) + obj.name;
        };
        TreeView.prototype.ShowInUnits = function (u) {
            this._unit = u;
            var tree = this.Tree;
            var cols = tree.config.columns;
            var lastFillspace = cols[cols.length - 1].fillspace;
            if (!this.Compact || !this._collapsed)
                tree.showColumnBatch(u);
            this.SetColumns(0, lastFillspace);
        };
        TreeView.prototype.NormalizeColumns = function (id, user) {
            if (!user)
                return;
            this.SetColumns(this.Tree.getColumnIndex(id), true);
        };
        TreeView.prototype.SetColumns = function (index, fillspace) {
            var columns = this.Tree.config.columns;
            var last = columns.length - 1;
            if (index === 0) {
                columns[last].fillspace = fillspace;
                columns[last].width = 0;
                columns[last].resize = false;
            }
            else if (index === last) {
                columns[0].fillspace = true;
                columns[0].width = 0;
            }
            this.Tree.refreshColumns();
        };
        TreeView.prototype.ToggleColumns = function () {
            var tree = this.Tree;
            var lv = tree.isColumnVisible("load");
            var cv = tree.isColumnVisible("count");
            var vis = (this._collapsed = lv || cv);
            if (vis) {
                if (lv)
                    tree.hideColumn("load");
                if (cv)
                    tree.hideColumn("count");
            }
            else {
                if (this._unit === "hours")
                    tree.showColumn("load");
                else
                    tree.showColumn("count");
            }
            tree.config.width = vis ? 44 : 0;
            var nameCol = tree.config.columns[0];
            nameCol.minWidth = vis ? 44 : 150;
            tree.resize();
            tree.refreshColumns();
            this.app.callEvent("rdiagram:tree:toggle", [vis]);
        };
        TreeView.prototype.ToggleBranch = function (id, v) {
            var _this = this;
            var root = this.Tree.data.getBranch("0");
            var opened = this.Tree.getState().open.filter(function (i) {
                return root.find(function (o) { return o.id == i; });
            });
            this._treeOpened = opened.map(function (id) { return _this.Tree.getIndexById(id); });
            this.app.callEvent("rdiagram:branch:toggle", [id, v]);
        };
        TreeView.prototype.SortTasks = function (by, dir, as) {
            this.app.callEvent("rdiagram:sort", [by, dir, as]);
        };
        return TreeView;
    }(JetView));

    var RDiagramView = (function (_super) {
        __extends(RDiagramView, _super);
        function RDiagramView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        RDiagramView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            var compact = this.getParam("compact", true);
            var contrast = webix.skin.$name === "contrast";
            var unit = this.app.getService("local").getScales().minUnit;
            return {
                type: contrast ? "clean" : "line",
                rows: [
                    {
                        view: "toolbar",
                        borderless: contrast,
                        elements: [
                            {},
                            {
                                view: "radio",
                                width: 330,
                                value: "hours",
                                localId: "radio",
                                options: [
                                    { id: "hours", value: _("Hours per") + " " + _(unit) },
                                    { id: "tasks", value: _("Tasks per") + " " + _(unit) },
                                ],
                                on: {
                                    onChange: function (v) {
                                        _this.app.callEvent("rdiagram:unit:change", [v]);
                                    },
                                },
                            },
                        ],
                    },
                    {
                        type: "clean",
                        cols: [
                            TreeView,
                            {
                                view: compact ? "spacer" : "resizer",
                                css: "webix_gantt_resizer",
                                width: compact ? 1 : 4,
                            },
                            {
                                localId: "diagram",
                                rows: [ScalesView, DiagramView],
                            },
                        ],
                    },
                ],
            };
        };
        RDiagramView.prototype.init = function () {
            var _this = this;
            var localState = createState({
                top: 0,
            });
            this.setParam("localState", localState);
            this.on(this.app, "rdiagram:tree:toggle", function (v) {
                if (v)
                    _this.$$("diagram").show();
                else
                    _this.$$("diagram").hide();
            });
            var _ = this.app.getService("locale")._;
            var radio = this.$$("radio");
            this.on(this.app, "onScalesUpdate", function (scales, old) {
                if (scales.minUnit !== old.minUnit) {
                    radio.config.options.map(function (o) {
                        var words = o.value.split(" ");
                        words[words.length - 1] = _(scales.minUnit);
                        o.value = words.join(" ");
                    });
                    radio.refresh();
                }
            });
        };
        return RDiagramView;
    }(JetView));

    var BaselineView = (function (_super) {
        __extends(BaselineView, _super);
        function BaselineView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        BaselineView.prototype.config = function () {
            var _this = this;
            var _ = (this._ = this.app.getService("locale")._);
            var calendar = {
                css: "webix_gantt_datepicker",
                type: "calendar",
                body: {
                    height: 270,
                    width: 250,
                    icons: true,
                    events: function (date) { return _this.app.config.isHoliday(date) && "webix_cal_event"; },
                },
            };
            var form = {
                view: "form",
                localId: "form",
                borderless: true,
                autoheight: true,
                elementsConfig: {
                    labelPosition: "top",
                },
                padding: {
                    left: 3,
                    right: 3,
                },
                visibleBatch: "added",
                elements: [
                    {
                        batch: "added",
                        rows: [
                            {
                                view: "datepicker",
                                name: "planned_start",
                                label: _("Start date"),
                                suggest: webix.copy(calendar),
                            },
                            {
                                view: "datepicker",
                                name: "planned_end",
                                label: _("End date"),
                                suggest: webix.copy(calendar),
                            },
                            {
                                view: "counter",
                                name: "planned_duration",
                                css: "webix_gantt_form_counter",
                                min: 1,
                                max: 1000,
                                label: _("Duration"),
                            },
                        ],
                    },
                    {
                        batch: "none",
                        cols: [
                            {
                                view: "button",
                                type: "icon",
                                icon: "wxi-plus",
                                autowidth: true,
                                label: _("Add dates"),
                                click: function () { return _this.AddBtnClickHandler(); },
                                css: "webix_transparent",
                            },
                            {},
                        ],
                    },
                    {
                        batch: "added",
                        cols: [
                            {},
                            {
                                view: "button",
                                type: "icon",
                                icon: "wxi-trash",
                                autowidth: true,
                                label: _("Remove dates"),
                                click: function () { return _this.RemoveBtnClickHandler(); },
                                css: "webix_transparent",
                            },
                            {},
                        ],
                    },
                ],
                on: {
                    onChange: function (n, o, config) {
                        if (_this.Compact)
                            _this.UpdateTaskTime();
                        else {
                            if (config == "user")
                                _this.UpdateTask();
                        }
                    },
                },
            };
            return form;
        };
        BaselineView.prototype.init = function () {
            var _this = this;
            this.State = this.getParam("state", true);
            this.Ops = this.app.getService("operations");
            this.Form = this.$$("form");
            this.Tasks = this.app.getService("local").tasks();
            this.on(this.State.$changes, "selected", function (id) {
                if (id)
                    _this.FillData(id);
            });
            this.on(this.Tasks.data, "onStoreUpdated", function (id, obj, mode) {
                if (mode == "update" && id == _this.State.selected)
                    _this.FillData(id);
            });
        };
        BaselineView.prototype.FillData = function (id) {
            var task = this.Tasks.getItem(id);
            if (task.planned_start)
                this.$$("form").showBatch("added");
            else
                this.$$("form").showBatch("none");
            this.Form.setValues(this.Tasks.getItem(id));
        };
        BaselineView.prototype.PrepareDates = function (vals) {
            var f = (this._eventSource = this.Form.$eventSource.config.name);
            var updateDates = true;
            if (f == "planned_duration" ||
                (f == "planned_start" && vals.type == "project"))
                vals.planned_end = null;
            else if (f == "planned_end" || f == "planned_start")
                vals.planned_duration = null;
            else
                updateDates = false;
            return updateDates;
        };
        BaselineView.prototype.UpdateTaskTime = function () {
            var vals = this.Form.getValues();
            var updateDates = this.PrepareDates(vals);
            if (updateDates) {
                var mode = this._eventSource ? this._eventSource.split("_")[1] : null;
                if (mode == "duration")
                    mode = null;
                this.Ops.updatePlannedTaskDuration(vals, mode);
                this.Form.blockEvent();
                this.Form.setValues(vals, true);
                this.Form.unblockEvent();
            }
        };
        BaselineView.prototype.UpdateTask = function () {
            var id = this.State.selected;
            var vals = this.Form.getValues();
            if (!this.Compact)
                this.PrepareDates(vals);
            var mode = this._eventSource ? this._eventSource.split("_")[1] : null;
            if (mode == "duration")
                mode = null;
            this.Ops.updateTask(id, vals, mode, false, true);
        };
        BaselineView.prototype.AddBtnClickHandler = function () {
            var id = this.State.selected;
            var vals = this.Form.getValues();
            var obj = {
                planned_start: vals.start_date,
                planned_end: vals.end_date,
                planned_duration: vals.duration,
            };
            this.Ops.updateTask(id, obj, null, false, true);
        };
        BaselineView.prototype.RemoveBtnClickHandler = function () {
            var _this = this;
            var id = this.State.selected;
            webix
                .confirm(this._("Planned dates will be removed, are you sure?"))
                .then(function () {
                _this.Ops.updateTask(id, { planned_start: null, planned_end: null, planned_duration: null }, null, false, true);
            });
        };
        return BaselineView;
    }(JetView));

    var TableView = (function (_super) {
        __extends(TableView, _super);
        function TableView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TableView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            var table = {
                view: "treetable",
                css: "webix_gantt_tree webix_gantt_form_tree",
                header: false,
                borderless: true,
                localId: "links",
                autoheight: true,
                editable: true,
                scroll: false,
                hover: "webix_gantt_link_table_hover",
                scheme: {
                    $group: {
                        by: "ttype",
                    },
                },
                columns: [
                    {
                        id: "task",
                        css: "webix_gantt_title",
                        header: _("Task"),
                        fillspace: true,
                        template: function (obj) {
                            if (obj.$group)
                                return "<span class=\"webix_strong\">" + _(obj.ttype == "source" ? _("Successors") : _("Predecessors")) + "</span>";
                            else
                                return obj.text || _("(no title)");
                        },
                    },
                    {
                        id: "type",
                        css: "webix_gantt_type",
                        header: _("Link"),
                        width: 140,
                        template: function (obj, c, v, conf) {
                            if (obj.$group)
                                return "";
                            else {
                                var type = conf.collection.getItem(v).value;
                                return type + "<span class=\"webix_icon wxi-menu-down\"></span>";
                            }
                        },
                        editor: "richselect",
                        options: [
                            { id: "0", value: _("End to start") },
                            { id: "1", value: _("Start to start") },
                            { id: "2", value: _("End to end") },
                            { id: "3", value: _("Start to end") },
                        ],
                    },
                    {
                        width: 30,
                        css: "webix_gantt_action",
                        template: function (obj) {
                            return obj.$group
                                ? ""
                                : "<span class='webix_icon wxi-trash'></span>";
                        },
                    },
                ],
                on: {
                    onBeforeEditStart: function (id) {
                        return !this.getItem(id).$group;
                    },
                    onBeforeEditStop: function (v, editor) {
                        if (v.value != v.old) {
                            _this.UpdateLink(editor.row, { type: v.value * 1 });
                            return false;
                        }
                    },
                    onAfterLoad: function () {
                        this.openAll();
                    },
                },
                onClick: {
                    "wxi-trash": function (e, id) {
                        webix
                            .confirm({
                            container: _this.app.getRoot().$view,
                            title: _("Delete link"),
                            text: _("The link will be deleted permanently, are you sure?"),
                        })
                            .then(function () { return _this.DeleteLink(id); });
                    },
                },
            };
            return {
                padding: { top: webix.skin.$active.layoutMargin.form, bottom: 5 },
                rows: [table],
            };
        };
        TableView.prototype.init = function () {
            var _this = this;
            this.State = this.getParam("state", true);
            this.Ops = this.app.getService("operations");
            this.Links = this.$$("links");
            this.on(this.State.$changes, "selected", function (id) {
                if (id)
                    _this.FillData(id);
            });
            var links = this.app.getService("local").links();
            this.on(links.data, "onStoreUpdated", function (_id, obj) {
                if (obj) {
                    var tid = _this.State.selected;
                    if (obj.target === tid || obj.source === tid) {
                        _this.FillData(tid);
                    }
                }
            });
        };
        TableView.prototype.FillData = function (id) {
            var local = this.app.getService("local");
            var related = local
                .getLinks(id, "target")
                .concat(local.getLinks(id, "source"));
            this.Links.clearAll();
            if (related.length) {
                this.Links.parse(related);
                this.getRoot().show();
            }
            else {
                this.getRoot().hide();
            }
        };
        TableView.prototype.UpdateLink = function (id, obj) {
            var _this = this;
            this.Ops.updateLink(id, obj).then(function () {
                _this.Links.blockEvent();
                _this.Links.editCancel();
                _this.Links.unblockEvent();
                obj.type += "";
                _this.Links.updateItem(id, obj);
            });
        };
        TableView.prototype.DeleteLink = function (id) {
            var _this = this;
            this.Ops.removeLink(id).then(function () {
                _this.FillData(_this.State.selected);
            });
        };
        return TableView;
    }(JetView));

    webix.editors.gantt_numeditor = webix.extend({
        render: function () {
            var node = webix.editors.text.render.call(this);
            var inp = node.querySelector("input");
            inp.type = "number";
            inp.min = 0;
            return node;
        },
    }, webix.editors.text);

    var ResourcesView = (function (_super) {
        __extends(ResourcesView, _super);
        function ResourcesView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ResourcesView.prototype.config = function () {
            var _this = this;
            var _ = (this._ = this.app.getService("locale")._);
            this.Local = this.app.getService("local");
            this.Helpers = this.app.getService("helpers");
            var conf = this.app.config;
            var single = (this.IsSingle =
                conf.resources == "single" || conf.resourceCalendars);
            var button = {
                cols: [
                    {
                        view: "button",
                        type: "icon",
                        icon: "wxi-plus",
                        autowidth: true,
                        localId: "addBtn",
                        label: _("Add assignment"),
                        click: function () { return _this.AddBtnClickHandler(); },
                        css: "webix_transparent",
                    },
                    {},
                ],
            };
            var table = {
                view: "treetable",
                css: "webix_gantt_resource_table webix_gantt_tree webix_gantt_form_tree",
                header: false,
                borderless: true,
                localId: "resources",
                autoheight: true,
                editable: true,
                editaction: "custom",
                scroll: false,
                hover: "webix_gantt_table_hover",
                rowHeight: Math.max(webix.skin.$active.rowHeight, 32),
                columns: [
                    {
                        id: "resource",
                        css: "webix_gantt_title",
                        fillspace: true,
                        template: function (obj) { return _this.ResourceTemplate(obj); },
                        editor: "richselect",
                        suggest: {
                            width: 250,
                            css: "webix_gantt_select_editor_popup",
                            padding: 0,
                            point: 0,
                            body: {
                                width: 250,
                                type: {
                                    height: Math.max(webix.skin.$active.listItemHeight, 32),
                                },
                                template: function (r) {
                                    return single ? _this.OptionTemplate(r) : _this.EditorOptionTemplate(r);
                                },
                            },
                        },
                    },
                    {
                        id: "value",
                        width: 85,
                        css: "webix_gantt_value",
                        template: function (obj) { return _this.ValueTemplate(obj); },
                        editFormat: function (v) {
                            return parseFloat(v);
                        },
                        editParse: function (v) {
                            v = parseFloat(v);
                            return isNaN(v) ? 0 : v;
                        },
                        editor: "gantt_numeditor",
                    },
                    {
                        id: "remove",
                        width: 30,
                        css: "webix_gantt_action",
                        template: function (obj) { return _this.DeleteIconTemplate(obj); },
                    },
                ],
                on: {
                    onItemClick: function (id) {
                        if (!_this.Table.getItem(id).$group && id.column != "remove") {
                            _this.Table.editRow(id);
                            if (id.column == "value")
                                _this.Table.getEditor(id.row, "resource")
                                    .getPopup()
                                    .hide();
                            _this.Table.getEditor(id.row, id.column).focus();
                        }
                    },
                    onBeforeEditStart: function (id) {
                        var item = _this.Table.getItem(id.row);
                        if (item.$group)
                            return false;
                        if (id.column == "resource") {
                            _this.Table.addCellCss(id.row, id.column, "webix_gantt_select_editor");
                            var r = id && !single ? item.resource : null;
                            _this.FilterOptions(r);
                        }
                        return true;
                    },
                    onAfterEditStart: function (id) {
                        if (id.column == "value") {
                            var item = _this.Table.getItem(id.row);
                            var node = _this.Table.getEditor(id.row, "value").getInputNode();
                            var range = _this.GetRange(item);
                            if (range)
                                _this.ApplyEditorLimits(node, range);
                            var step = _this.GetValueStep(item);
                            if (step)
                                _this.ApplyEditorStep(node, step);
                        }
                    },
                    onBeforeEditStop: function (state, editor) {
                        _this.Table.removeCellCss(editor.row, "resource", "webix_gantt_select_editor");
                        if (state.value != state.old) {
                            var obj = {};
                            obj[editor.column] = state.value;
                            if (editor.column == "value") {
                                var item = _this.Table.getItem(editor.row);
                                var range = _this.GetRange(item);
                                if (range)
                                    _this.ApplyValueRange(obj, range);
                                else if (obj.value < 0)
                                    obj.value = 0;
                                editor.getInputNode().value = obj.value;
                            }
                            _this.UpdateAssignment(editor.row, obj);
                        }
                        return true;
                    },
                    onAfterLoad: function () {
                        this.openAll();
                    },
                },
                onClick: {
                    webix_gantt_remove_icon: function (e, id) {
                        webix
                            .confirm({
                            container: _this.app.getRoot().$view,
                            title: _("Delete assignment"),
                            text: _("Are you sure to delete this assignment?"),
                        })
                            .then(function () { return _this.RemoveAssignment(id.row); });
                    },
                },
            };
            if (!single)
                table.scheme = {
                    $group: {
                        by: "category",
                    },
                };
            return {
                margin: webix.skin.$active.layoutMargin.form,
                padding: { top: webix.skin.$active.layoutMargin.form, bottom: 5 },
                rows: [table, button],
            };
        };
        ResourcesView.prototype.init = function () {
            var _this = this;
            this.State = this.getParam("state", true);
            this.Ops = this.app.getService("operations");
            this.Helpers = this.app.getService("helpers");
            this.Table = this.$$("resources");
            this.Local = this.app.getService("local");
            this.Resources = this.Local.resources();
            if (!this.app.config.resources)
                return false;
            this.on(this.State.$changes, "selected", function (id) {
                if (id)
                    _this.FillData(id);
            });
        };
        ResourcesView.prototype.FillData = function (id) {
            var _this = this;
            var item = this.Local.tasks().getItem(id);
            if (item.type != "task")
                return false;
            var loader = this.Local.getAssignments(id);
            loader.then(function (assignees) {
                if (!_this.getRoot())
                    return false;
                _this.Table.clearAll();
                _this.Table.getColumnConfig("resource").collection = _this.Resources;
                if (assignees.length) {
                    _this.Table.show();
                    _this.Table.parse(_this.GetData(assignees));
                    if (_this.IsSingle)
                        _this.$$("addBtn").disable();
                }
                else {
                    if (_this.IsSingle)
                        _this.$$("addBtn").enable();
                    _this.Table.hide();
                }
            });
        };
        ResourcesView.prototype.GetData = function (assignments) {
            assignments.sort(this.app.getService("operations").sortResources);
            return assignments;
        };
        ResourcesView.prototype.FilterOptions = function (id) {
            var tableIds = [];
            var category = id ? this.Resources.getItem(id)["category_id"] : null;
            this.Table.data.each(function (item) {
                tableIds.push(item.resource);
            });
            this.Resources.filter(function (item) {
                return ((!category || item["category_id"] == category) &&
                    (tableIds.indexOf(item.id) < 0 || (id && item.id == id)));
            });
        };
        ResourcesView.prototype.UpdateAssignment = function (id, obj) {
            var _this = this;
            var node = this.Table.$view.querySelector(".webix_gantt_select_editor");
            if (node) {
                var rInd = node.getAttribute("aria-rowindex") * 1;
                this.Table.removeCellCss(this.Table.data.getIdByIndex(rInd - 1), "resource", "webix_gantt_select_editor");
            }
            this.Ops.updateAssignment(id, obj).then(function () {
                _this.CloseEditor(id, obj);
            });
        };
        ResourcesView.prototype.GetRange = function (item) {
            var resourceItem = this.Resources.getItem(item.resource);
            return this.Helpers.getResourceValueRange(resourceItem);
        };
        ResourcesView.prototype.ApplyValueRange = function (obj, range) {
            if (obj.value < range[0])
                obj.value = range[0];
            else if (obj.value > range[1])
                obj.value = range[1];
        };
        ResourcesView.prototype.ApplyEditorLimits = function (node, range) {
            node.min = range[0];
            node.max = range[1];
        };
        ResourcesView.prototype.GetValueStep = function (item) {
            var resourceItem = this.Resources.getItem(item.resource);
            return this.Helpers.getResourceValueStep(resourceItem);
        };
        ResourcesView.prototype.ApplyEditorStep = function (node, step) {
            node.step = step;
        };
        ResourcesView.prototype.CloseEditor = function (id, obj) {
            this.Table.blockEvent();
            this.Table.editCancel();
            this.Table.unblockEvent();
            this.Table.updateItem(id, obj);
        };
        ResourcesView.prototype.RemoveAssignment = function (id) {
            var _this = this;
            this.Ops.removeAssignment(id).then(function () {
                _this.FillData(_this.State.selected);
            });
        };
        ResourcesView.prototype.AddBtnClickHandler = function () {
            var _this = this;
            this.FilterOptions();
            webix.delay(function () {
                _this.ShowPopup();
            });
        };
        ResourcesView.prototype.AddAssignment = function (obj) {
            var _this = this;
            if (this.IsSingle)
                this.$$("addBtn").disable();
            this.Ops.addAssignment({
                resource: obj.id,
                value: this.Helpers.getDefaultResourceValue(obj),
                task: this.State.selected,
            }).then(function () {
                _this.FillData(_this.State.selected);
            });
        };
        ResourcesView.prototype.ResourceTemplate = function (obj) {
            if (obj.$group)
                return "<span class=\"webix_strong\">" + obj.category + "</span>";
            else if (obj.resource) {
                var item = this.Resources.getItem(obj.resource);
                return this.EditorTemplate(item);
            }
            return "";
        };
        ResourcesView.prototype.ValueTemplate = function (obj) {
            if (obj.$group)
                return "";
            var v = obj.value;
            return ((isNaN(v) ? this.Helpers.getDefaultResourceValue(obj) : v) +
                this.GetUnitName(obj));
        };
        ResourcesView.prototype.GetUnitName = function (obj) {
            return this._(this.Helpers.getResourceUnit(obj));
        };
        ResourcesView.prototype.DeleteIconTemplate = function (obj) {
            if (obj.$group)
                return "";
            return "<span class='webix_icon wxi-trash webix_gantt_remove_icon'></span>";
        };
        ResourcesView.prototype.GetPopupConfig = function () {
            var _this = this;
            return {
                view: "suggest",
                localId: "popup",
                width: 320,
                padding: 0,
                point: 0,
                fitMaster: false,
                borderless: true,
                css: "webix_gantt_select_editor_popup",
                body: {
                    view: "list",
                    minHeight: 28,
                    type: {
                        height: Math.max(webix.skin.$active.listItemHeight, 32),
                    },
                    data: this.Resources,
                    template: function (obj) { return _this.OptionTemplate(obj); },
                    on: {
                        onItemClick: function (id) {
                            _this.AddAssignment(_this.Resources.getItem(id));
                            _this.Popup.hide();
                        },
                    },
                },
            };
        };
        ResourcesView.prototype.ShowPopup = function () {
            if (!this.Popup || !this.Popup.$view) {
                this.Popup = this.ui(this.GetPopupConfig());
                this.SetPopupPlaceholder();
            }
            this.Popup.show(this.$$("addBtn").$view, { x: 1 });
        };
        ResourcesView.prototype.SetPopupPlaceholder = function (placeholder) {
            var list = this.Popup.getBody();
            list.$view.firstChild.setAttribute("placeholder", placeholder || this._("No resources to add"));
        };
        ResourcesView.prototype.OptionTemplate = function (obj) {
            var avatar = this.Helpers.resourceAvatar(obj);
            var name = "<div class='webix_gantt_editor_avatar_name'>" + obj.name + "</div>";
            var avatarStr = "<div class=\"webix_gantt_avatar_box_inline\">" + (avatar +
                name) + "</div>";
            var dpt = "<span class='webix_gantt_resource_section'>" + obj.category + "</span>";
            return ("<div class='webix_gantt_avatar_option_box'>" + avatarStr + dpt + "</div>");
        };
        ResourcesView.prototype.EditorTemplate = function (obj) {
            var avatar = this.Helpers.resourceAvatar(obj);
            var name = "<div class='webix_gantt_editor_avatar_name'>" + obj.name + "</div>";
            var icon = "<span class='webix_icon wxi-menu-down'></span>";
            return "<div class=\"webix_gantt_avatar_box\">" + avatar + " " + name + icon + "</div>";
        };
        ResourcesView.prototype.EditorOptionTemplate = function (obj) {
            var avatar = this.Helpers.resourceAvatar(obj);
            var name = "<div class='webix_gantt_editor_avatar_name'>" + obj.name + "</div>";
            return "<div class=\"webix_gantt_avatar_box\">" + avatar + " " + name + "</div>";
        };
        return ResourcesView;
    }(JetView));

    var FormView = (function (_super) {
        __extends(FormView, _super);
        function FormView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        FormView.prototype.config = function () {
            var _this = this;
            this.Compact = this.getParam("compact", true);
            var _ = this.app.getService("locale")._;
            this.isResources = this.app.config.resources;
            this.State = this.getParam("state", true);
            var aSkin = webix.skin.$active;
            var bar = {
                view: "toolbar",
                css: "webix_subbar",
                borderless: true,
                padding: {
                    left: aSkin.layoutPadding.form - (aSkin.inputHeight - 20) / 2,
                    right: aSkin.layoutPadding.form,
                },
                elements: [
                    {
                        view: "icon",
                        icon: "wxi-close",
                        click: function () { return _this.Close(); },
                    },
                    {},
                    {
                        view: "button",
                        width: 130,
                        css: "webix_primary",
                        value: _("Done"),
                        click: function () { return _this.Done(); },
                    },
                ],
            };
            var calendar = {
                css: "webix_gantt_datepicker",
                type: "calendar",
                body: {
                    height: 270,
                    width: 250,
                    icons: true,
                    events: function (date) { return _this.app.config.isHoliday(date) && "webix_cal_event"; },
                },
            };
            var types = [
                { id: "task", value: _("Task") },
                { id: "milestone", value: _("Milestone") },
            ];
            if (!this.app.config.projects) {
                types.splice(1, 0, { id: "project", value: _("Project") });
            }
            var accItems = [];
            if (this.app.config.links)
                accItems.push({
                    header: _("Related tasks"),
                    body: TableView,
                    collapsed: true,
                });
            if (this.isResources)
                accItems.push({
                    localId: "resourcesItem",
                    header: this.isResources == "single" || this.app.config.resourceCalendars
                        ? _("Assignment")
                        : _("Assignments"),
                    body: { $subview: ResourcesView, name: "resources" },
                    collapsed: true,
                    hidden: true,
                });
            if (this.State.baseline)
                accItems.push({
                    localId: "baselineItem",
                    header: _("Planned dates"),
                    body: { $subview: BaselineView, name: "baseline" },
                    collapsed: true,
                    hidden: true,
                });
            var accordion = {
                multi: true,
                view: "accordion",
                borderless: true,
                type: "clean",
                margin: 10,
                css: "webix_gantt_accordion",
                rows: accItems,
            };
            var form = {
                view: "form",
                localId: "form",
                borderless: true,
                autoheight: false,
                scroll: true,
                elementsConfig: {
                    labelPosition: "top",
                },
                elements: [
                    { view: "text", name: "text", label: _("Title") },
                    {
                        view: "richselect",
                        localId: "types",
                        name: "type",
                        label: _("Type"),
                        options: types,
                        on: {
                            onChange: function (v) { return _this.ToggleControls(v); },
                        },
                    },
                    {
                        view: "datepicker",
                        name: "start_date",
                        label: _("Start date"),
                        suggest: webix.copy(calendar),
                    },
                    {
                        view: "datepicker",
                        name: "end_date",
                        label: _("End date"),
                        suggest: webix.copy(calendar),
                    },
                    {
                        view: "counter",
                        name: "duration",
                        css: "webix_gantt_form_counter",
                        min: 1,
                        max: 1000,
                        label: _("Duration"),
                    },
                    {
                        view: "slider",
                        name: "progress",
                        title: webix.template("#value#%"),
                        label: _("Progress"),
                    },
                    accordion,
                    {
                        view: "textarea",
                        name: "details",
                        label: _("Notes"),
                        height: 150,
                    },
                ],
                on: {
                    onChange: function (n, o, config) {
                        if (_this.Compact)
                            _this.UpdateTaskTime();
                        else {
                            if (config == "user")
                                _this.UpdateTask().then(function () {
                                    if (_this._eventSource === "type" &&
                                        config === "user" &&
                                        (n === "split" || o === "split"))
                                        _this.Tasks.data.callEvent("onStoreUpdated", []);
                                });
                        }
                    },
                },
            };
            return {
                view: "proxy",
                body: {
                    margin: 0,
                    padding: { bottom: 14 },
                    rows: [bar, form],
                },
            };
        };
        FormView.prototype.init = function () {
            var _this = this;
            this.Ops = this.app.getService("operations");
            this.Local = this.app.getService("local");
            this.Tasks = this.Local.tasks();
            this.Form = this.$$("form");
            this.on(this.State.$changes, "selected", function (id) {
                if (id) {
                    _this.FillData(id);
                }
            });
            this.on(this.Tasks.data, "onStoreUpdated", function (id, obj, mode) {
                if (mode == "update" && id == _this.State.selected)
                    _this.FillData(_this.State.selected);
            });
            this.on(this.State.$changes, "display", function (v) {
                var typeSelect = _this.$$("form").elements["type"];
                if (v == "tasks")
                    typeSelect.enable();
                else if (v == "resources")
                    typeSelect.disable();
            });
            if (this.app.config.resourceCalendars)
                this.on(this.Local.assignments().data, "onStoreUpdated", function () {
                    return _this.SetResourceHolidays();
                });
            this.on(this.State.$changes, "baseline", function (v, old) {
                if (!webix.isUndefined(old))
                    _this.SetBaselineVisibility(_this.Tasks.getItem(_this.State.selected));
            });
        };
        FormView.prototype.FillData = function (id) {
            var item = this.Tasks.getItem(id);
            var typeList = this.$$("types").getList();
            if (this.app.config.split && item.$count) {
                if (!typeList.exists("split"))
                    typeList.add({
                        id: "split",
                        value: this.app.getService("locale")._("Split task"),
                    });
            }
            else {
                if (typeList.exists("split"))
                    typeList.remove("split");
            }
            if (this.app.config.projects) {
                this.LimitTypeOptions(item);
            }
            if (this.app.config.resourceCalendars)
                this.SetResourceHolidays();
            if (this.isResources)
                this.SetResourcesVisibility(item);
            if (this.State.baseline)
                this.SetBaselineVisibility(item);
            this.Form.setValues(item);
            this.Form.focus();
        };
        FormView.prototype.SetResourcesVisibility = function (item) {
            var layout = this.$$("resourcesItem");
            if (item.type == "task") {
                if (!layout.isVisible()) {
                    var sub = this.getSubView("resources");
                    if (sub)
                        sub.FillData(item.id);
                    layout.show();
                }
            }
            else if (layout.isVisible())
                layout.hide();
        };
        FormView.prototype.SetBaselineVisibility = function (item) {
            var layout = this.$$("baselineItem");
            if (this.State.baseline &&
                (item.type == "task" || item.type == "project")) {
                if (!layout.isVisible()) {
                    var sub = this.getSubView("baseline");
                    if (sub)
                        sub.FillData(item.id);
                    layout.show();
                }
            }
            else if (layout.isVisible())
                layout.hide();
        };
        FormView.prototype.LimitTypeOptions = function (item) {
            var typeSelect = this.Form.elements.type;
            if (item.type === "project")
                typeSelect.hide();
            else
                typeSelect.show();
        };
        FormView.prototype.PrepareDates = function (vals) {
            var f = (this._eventSource = this.Form.$eventSource.config.name);
            var updateDates = true;
            if (f == "duration" || (f == "start_date" && vals.type == "project"))
                vals.end_date = null;
            else if (f == "end_date" || f == "start_date")
                vals.duration = null;
            else
                updateDates = false;
            return updateDates;
        };
        FormView.prototype.UpdateTaskTime = function () {
            var vals = this.Form.getValues();
            var updateDates = this.PrepareDates(vals);
            if (this._eventSource === "type" && vals.type !== "split")
                vals.open = vals.opened = 1;
            var textUpdated = this.RemoveTagsFromText(vals);
            if (textUpdated) {
                this.Form.blockEvent();
                this.Form.setValues(vals, true);
                this.Form.unblockEvent();
            }
            if (updateDates) {
                var mode = this._eventSource ? this._eventSource.split("_")[0] : null;
                this.Ops.updateTaskDuration(vals, mode);
                this.Form.blockEvent();
                this.Form.setValues(vals, true);
                this.Form.unblockEvent();
            }
        };
        FormView.prototype.RemoveTagsFromText = function (vals) {
            if (this._eventSource === "text" || this._eventSource === "details") {
                vals[this._eventSource] = (vals[this._eventSource] || "").replace(/(<[^>]+>|^\s+|\s+$)/gi, "");
                return true;
            }
            return false;
        };
        FormView.prototype.UpdateTask = function () {
            var _this = this;
            var id = this.State.selected;
            var vals = this.Form.getValues();
            if (!this.Compact) {
                this.PrepareDates(vals);
                this.RemoveTagsFromText(vals);
            }
            var mode = this._eventSource ? this._eventSource.split("_")[0] : null;
            if (this._eventSource === "type" && vals.type !== "split")
                vals.open = vals.opened = 1;
            this._inProgress = this.Ops.updateTask(id, vals, mode);
            this._inProgress.finally(function () { return (_this._inProgress = null); });
            return this._inProgress;
        };
        FormView.prototype.ToggleControls = function (v) {
            this.Form.elements.end_date.show();
            this.Form.elements.duration.show();
            this.Form.elements.progress.show();
            this.Form.elements.end_date.enable();
            this.Form.elements.duration.enable();
            this.Form.elements.progress.enable();
            if (v == "project" || v == "milestone") {
                var action = v == "project" ? "disable" : "hide";
                this.Form.elements.end_date[action]();
                this.Form.elements.duration[action]();
                this.Form.elements.progress[action]();
            }
        };
        FormView.prototype.Close = function () {
            var _this = this;
            if (this.Compact && this.Form.isDirty()) {
                var _ = this.app.getService("locale")._;
                webix
                    .confirm({
                    container: this.app.getRoot().$view,
                    text: _("Save changes?"),
                })
                    .then(function () { return _this.Done(true); }, function () { return _this.Back(true); });
            }
            else {
                this.Back(true);
            }
        };
        FormView.prototype.Back = function (exit) {
            if (exit)
                this.State.$batch({
                    edit: null,
                    selected: null,
                });
            else
                this.State.edit = null;
        };
        FormView.prototype.Done = function (exit) {
            var _this = this;
            if (this.Compact && this.Form.isDirty()) {
                if (this._inProgress)
                    this._inProgress.then(function () {
                        _this.Back(exit);
                    });
                else
                    this.UpdateTask().then(function () { return _this.Back(exit); });
            }
            else
                this.Back(exit);
        };
        FormView.prototype.SetResourceHolidays = function () {
            var _this = this;
            var arr = [];
            var els = this.Form.elements;
            var h = this.app.getService("helpers");
            arr.push(els["start_date"], els["end_date"]);
            var calendar = this.Local.getTaskCalendar(this.State.selected);
            arr.forEach(function (el) {
                var c = el.getPopup().getBody();
                c.config.events = function (date) {
                    return (calendar
                        ? h.isResourceHoliday(date, calendar)
                        : _this.app.config.isHoliday(date)) && "webix_cal_event";
                };
                c.refresh();
            });
        };
        return FormView;
    }(JetView));

    var TaskView = (function (_super) {
        __extends(TaskView, _super);
        function TaskView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TaskView.prototype.config = function () {
            var _this = this;
            var _ = (this._ = this.app.getService("locale")._);
            var state = (this.State = this.getParam("state", true));
            var editButton = {
                view: "button",
                width: 130,
                label: _("Edit"),
                css: "webix_primary",
                click: function () { return _this.EditTask(); },
            };
            var aSkin = webix.skin.$active;
            var bar = {
                view: "toolbar",
                css: "webix_subbar",
                borderless: true,
                padding: {
                    left: aSkin.layoutPadding.form - (aSkin.inputHeight - 20) / 2,
                    right: aSkin.layoutPadding.form,
                },
                elements: [
                    {
                        view: "icon",
                        icon: "wxi-close",
                        click: function () { return _this.Close(); },
                    },
                    {},
                    !state.readonly ? editButton : {},
                ],
            };
            var info = {
                localId: "text",
                view: "template",
                css: "webix_gantt_task_info",
                template: function (obj) { return _this.InfoTemplate(obj); },
                borderless: true,
            };
            var deleteButton = {
                view: "button",
                label: _("Delete task"),
                css: "webix_danger webix_gantt_danger",
                align: "center",
                inputWidth: 330,
                click: function () {
                    webix
                        .confirm({
                        container: _this.app.getRoot().$view,
                        title: _("Delete task"),
                        text: _("The task will be deleted permanently, are you sure?"),
                    })
                        .then(function () { return _this.DeleteTask(); });
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
                            borderless: true,
                            rows: [info, !state.readonly ? deleteButton : {}],
                        },
                    ],
                },
            };
        };
        TaskView.prototype.init = function () {
            var _this = this;
            this.Local = this.app.getService("local");
            this.Tasks = this.Local.tasks();
            this.Text = this.$$("text");
            this.isResources = this.app.config.resources;
            this.on(this.State.$changes, "selected", function (id) {
                if (id)
                    _this.FillTemplate(id);
            });
            this.on(this.Tasks.data, "onStoreUpdated", function (id, obj, mode) {
                if (mode == "update" && id == _this.State.selected) {
                    _this.FillTemplate(_this.State.selected);
                }
            });
            var links = this.Local.links();
            this.on(links.data, "onStoreUpdated", function (_id, obj) {
                if (obj) {
                    var tid = _this.State.selected;
                    if (obj.target === tid || obj.source === tid) {
                        _this.FillTemplate(tid);
                    }
                }
            });
            if (this.isResources) {
                this.on(this.Local.assignments().data, "onStoreUpdated", function (id, obj) {
                    if (obj && obj.task == _this.State.selected)
                        _this.FillTemplate(obj.task);
                });
            }
            this.on(this.State.$changes, "baseline", function (v, old) {
                if (!webix.isUndefined(old))
                    _this.FillTemplate(_this.State.selected);
            });
        };
        TaskView.prototype.FillTemplate = function (id) {
            var _this = this;
            var item = webix.copy(this.Tasks.getItem(id));
            item.sources = this.Local.getLinks(id, "source");
            item.targets = this.Local.getLinks(id, "target");
            if (this.isResources && item.type == "task") {
                this.Local.getAssignments(id).then(function (d) {
                    if (!_this.getRoot())
                        return false;
                    item.resources = d.sort(_this.app.getService("operations").sortResources);
                    _this.Text.setValues(item);
                });
            }
            else
                this.Text.setValues(item);
        };
        TaskView.prototype.EditTask = function () {
            this.State.edit = true;
        };
        TaskView.prototype.DeleteTask = function () {
            this.app.getService("operations").removeTask(this.State.selected);
            this.Close();
        };
        TaskView.prototype.Close = function () {
            this.State.$batch({
                edit: null,
                selected: null,
            });
        };
        TaskView.prototype.InfoTemplate = function (obj) {
            if (!obj.start_date)
                return "";
            var _ = this._;
            var html = "<span class=\"webix_gantt_task_title\">" + (obj.text ||
                _("(no title)")) + "</span><br><br>";
            html += this.BaseTemplate(obj);
            html += this.LinkTemplate(obj);
            if (this.State.baseline && obj.planned_start) {
                html += this.BaselineTemplateChunk(obj, _("Planned dates"));
            }
            if (obj.details) {
                html += "<br><br><div class=\"webix_gantt_task_title\">" + _("Notes") + "</div>\n\t\t\t\t<br><div class=\"webix_gantt_task_text\">" + obj.details.replace(/(?:\r\n|\r|\n)/g, "<br>") + "</div>";
            }
            return html;
        };
        TaskView.prototype.BaseTemplate = function (obj) {
            var _ = this._;
            var html = "<span class=\"webix_strong\">" + _("Start date") + "</span>: " + this.DateFormat(obj.start_date) + "<br>";
            if (obj.type !== "milestone")
                html += "<span class=\"webix_strong\">" + _("End date") + "</span>: " + this.DateFormat(obj.end_date) + "<br>\n\t\t\t<span class=\"webix_strong\">" + _("Duration") + "</span>: " + obj.duration + "<br>\n\t\t\t<span class=\"webix_strong\">" + _("Progress") + "</span>: " + obj.progress + "%\n\t\t<br>";
            return html;
        };
        TaskView.prototype.LinkTemplate = function (obj) {
            var html = "";
            var _ = this._;
            if (obj.targets.length)
                html += this.InfoTemplateChunk(obj.targets, _("Predecessors"));
            if (obj.sources.length)
                html += this.InfoTemplateChunk(obj.sources, _("Successors"));
            if (obj.resources) {
                var single = this.isResources == "single" || this.app.config.resourceCalendars;
                html += this.ResourcesTemplateChunk(obj.resources, single ? _("Assignment") : _("Assignments"));
            }
            return html;
        };
        TaskView.prototype.ResourcesTemplateChunk = function (arr, label) {
            var _this = this;
            if (!arr || !arr.length)
                return "";
            var maxWidth = 130;
            arr.forEach(function (r) {
                var s0 = webix.html.getTextSize(r.name, "webix_gantt_info_list_text");
                var s1 = webix.html.getTextSize(r.category, "webix_gantt_info_list_text webix_gantt_resource_section");
                maxWidth = Math.max(maxWidth, s0.width, s1.width);
            });
            maxWidth = Math.min(200, maxWidth);
            var list = arr
                .map(function (r) {
                var h = _this.app.getService("helpers");
                var avatar = "<div>" +
                    h.resourceAvatar(r, "webix_gantt_person_avatar_big") +
                    "</div>";
                var dpt = "<div class=' webix_gantt_info_list_text webix_gantt_resource_section' style='min-width:" +
                    maxWidth +
                    "px'>" +
                    r.category +
                    "</div>";
                var value = "<div class='webix_gantt_resource_section'>" +
                    r.value +
                    _this._(h.getResourceUnit(r)) +
                    "</div>";
                var top = "<div class='webix_gantt_info_list_text_row'><div class='webix_gantt_info_list_text' style='min-width:" +
                    maxWidth +
                    "px'>" +
                    r.name +
                    "</div>" +
                    value +
                    "</div>";
                var text = "<div  >" + top + dpt + "</div>";
                return ("<div class='webix_gantt_info_resource'>" + avatar + text + "</div>");
            })
                .join("");
            return "<br><span class=\"webix_strong\">" + label + "</span>:<br><ul class=\"webix_gantt_info_list_resources\">" + list + "</ul>";
        };
        TaskView.prototype.InfoTemplateChunk = function (arr, label) {
            var _this = this;
            var res = arr
                .map(function (s) { return "<li>" + (s.text || _this._("(no title)")) + "</li>"; })
                .join("");
            return "<br><span class=\"webix_strong\">" + label + "</span>:<br><ul>" + res + "</ul>";
        };
        TaskView.prototype.DateFormat = function (date) {
            return webix.i18n.longDateFormatStr(date);
        };
        TaskView.prototype.BaselineTemplateChunk = function (obj, label) {
            var _ = this.app.getService("locale")._;
            var html = _("Start date") + ": " + this.DateFormat(obj.planned_start) + "<br>" +
                (_("End date") + ": " + this.DateFormat(obj.planned_end) + "<br>") +
                (_("Duration") + ": " + obj.planned_duration + "<br>");
            return "<br><span class=\"webix_strong\">" + label + "</span><br><div class=\"webix_gantt_info_list_planned\">" + html + "</div>";
        };
        return TaskView;
    }(JetView));

    var TaskPopup = (function (_super) {
        __extends(TaskPopup, _super);
        function TaskPopup() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TaskPopup.prototype.config = function () {
            return this.app.getService("jet-win").updateConfig({
                view: "window",
                borderless: true,
                fullscreen: true,
                head: false,
                body: { $subview: true },
            });
        };
        return TaskPopup;
    }(JetView));

    var TreeView$1 = (function (_super) {
        __extends(TreeView, _super);
        function TreeView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TreeView.prototype.config = function () {
            var _this = this;
            var state = (this.State = this.getParam("state", true));
            this.Local = this.app.getService("local");
            this.Helpers = this.app.getService("helpers");
            var scales = this.Local.getScales();
            var _ = (this._ = this.app.getService("locale")._);
            var compact = (this.Compact = this.getParam("compact", true));
            this.isResources = this.app.config.resources;
            this.maxAvatarNumber = 3;
            var action = {
                id: "action",
                css: "webix_gantt_action",
                header: {
                    text: "<span webix_tooltip=\"" + _("Add task") + "\" class=\"webix_icon wxi-plus-circle\"></span>",
                    css: "webix_gantt_action",
                },
                template: function () {
                    return "<span webix_tooltip=\"" + _("Add task") + "\" class=\"webix_icon wxi-plus\"></span>";
                },
                width: 44,
                minWidth: 44,
            };
            var columns = [
                {
                    id: "text",
                    css: "webix_gantt_title",
                    header: _("Title"),
                    template: function (obj, common) {
                        return common.treetable(obj, common) + _this.TitleTemplate(obj);
                    },
                    fillspace: true,
                    hidden: compact,
                    batch: "full",
                    sort: sort("text"),
                    minWidth: 150,
                },
                {
                    id: "start_date",
                    header: _("Start date"),
                    format: webix.i18n.dateFormatStr,
                    hidden: compact,
                    batch: "full",
                    sort: "date",
                    minWidth: 100,
                },
            ];
            if (this.isResources) {
                columns.push({
                    id: "resources",
                    css: "webix_gantt_tree_column_resources",
                    header: _("Assigned"),
                    template: function (obj) { return _this.ResourcesTemplate(obj); },
                    minWidth: 100,
                });
            }
            if (compact) {
                action.header.text = "<span class='webix_icon gti-menu'>";
                if (state.readonly)
                    action.template = "";
                columns.unshift(action);
            }
            else if (!state.readonly)
                columns.push(action);
            columns[columns.length - 1].resize = false;
            var skin = webix.skin.$name;
            var headerCss = skin == "material" || skin == "mini" ? "webix_header_border" : "";
            var tree = {
                view: "treetable",
                css: "webix_gantt_tree " + headerCss,
                prerender: true,
                width: compact ? 44 : state.treeWidth,
                rowHeight: scales.cellHeight,
                headerRowHeight: scales.height,
                scroll: "xy",
                scrollAlignY: false,
                select: "row",
                sort: "multi",
                resizeColumn: {
                    headerOnly: true,
                    size: 10,
                },
                drag: state.readonly ? false : "order",
                columns: columns,
                tooltip: function () { return ""; },
                onClick: {
                    "wxi-plus": function (ev, id) { return _this.AddTask(id.row); },
                    "wxi-plus-circle": function () { return _this.AddTask("0"); },
                    "gti-menu": function () { return _this.ToggleColumns(); },
                },
                on: {
                    onBeforeOpen: function (id) { return _this.HandleToggle(id); },
                    onAfterOpen: function (id) {
                        _this.ToggleBranch(id, 1);
                        _this.ApplySelection();
                    },
                    onAfterClose: function (id) { return _this.ToggleBranch(id, 0); },
                    onBeforeSelect: function (id) { return _this.BeforeSelectHandler(id); },
                    onItemClick: function (id) { return _this.ItemClickHandler(id); },
                    onAfterSort: function (by, dir, as) { return _this.SortTasks(by, dir, as); },
                    onColumnResize: function (id, v, o, user) { return _this.NormalizeColumns(id, user); },
                    onBeforeDrag: function (ctx, e) { return _this.BeforeDragHandler(ctx, e); },
                    onBeforeDrop: function (ctx) { return _this.BeforeDropHandler(ctx); },
                    onViewResize: function () {
                        _this.State.treeWidth = _this.Tree.$width;
                    },
                },
            };
            tree.on["onScrollY"] = tree.on["onSyncScroll"] = tree.on["onAfterScroll"] = function () {
                state.top = this.getScrollState().y;
            };
            return tree;
        };
        TreeView.prototype.init = function (view) {
            var _this = this;
            this.Tree = view;
            this.State = this.getParam("state", true);
            this.Ops = this.app.getService("operations");
            this.Helpers = this.app.getService("helpers");
            this.Tasks = this.Local.tasks();
            this.on(this.State.$changes, "display", function (v) {
                _this.Mode = v;
                _this.State.top = 0;
                _this.SyncData();
            });
            if (this.isResources) {
                this.on(this.Assignments.data, "onStoreUpdated", function () {
                    _this.Tree.refresh();
                });
                this.on(this.Tree.data, "onStoreUpdated", function (id) {
                    if (_this.Mode == "resources" && !id) {
                        _this.ApplySelection();
                    }
                });
            }
            this.on(this.State.$changes, "top", function (y) { return _this.Tree.scrollTo(null, y); });
            this.on(this.State.$changes, "selected", function (id) {
                if (id)
                    _this.ApplySelection();
                else
                    _this.Tree.unselect();
            });
            this.on(this.app, "onScalesUpdate", function (scales) {
                var col = _this.Tree.columnId(0);
                _this.Tree.getColumnConfig(col).header[0].height = scales.height;
                _this.Tree.refreshColumns();
            });
            this.on(this.app, "task:add", function (pid, dates) {
                return _this.AddTask(pid || "0", dates);
            });
            this.on(this.State.$changes, "treeWidth", function (v) {
                if (!_this.Compact && view.$width !== v) {
                    view.define({ width: v });
                    view.resize();
                }
            });
        };
        TreeView.prototype.HandleToggle = function (id) {
            var obj = this.Tree.getItem(id);
            if (obj.type === "split" && obj.$data.length)
                return false;
        };
        TreeView.prototype.ItemClickHandler = function (id) {
            if (!this.Tree.getItem(id).$group) {
                this.State.$batch({
                    parent: null,
                    selected: id.row,
                });
            }
            else
                this.app.callEvent("edit:stop");
        };
        TreeView.prototype.BeforeSelectHandler = function (id) {
            return !this.Tree.getItem(id).$group;
        };
        TreeView.prototype.BeforeDragHandler = function (ctx, e) {
            if (this.Mode == "tasks") {
                var obj = this.Tree.getItem(ctx.start);
                if (obj.type === "split" && obj.$data.length) {
                    var html = this.Tree.$dragHTML(this.Tree.getItem(ctx.start), e, ctx);
                    ctx.html = html.replace("webix_dd_drag", "webix_dd_drag webix_gantt_tree_no_icon");
                }
                return true;
            }
            return false;
        };
        TreeView.prototype.BeforeDropHandler = function (ctx) {
            this.Ops.moveTask(ctx.start, ctx.parent, ctx.index);
            return false;
        };
        TreeView.prototype.SyncData = function () {
            var _this = this;
            this.Tree.clearAll();
            this.VisibleTasks = this.Local.getVisibleTasksCollection();
            this.resDisplayed = this.State.display === "resources";
            if (this.resDisplayed && !this.clearEvID) {
                this.clearEvID = this.on(this.VisibleTasks.data, "onClearAll", function () {
                    if (_this.resDisplayed) {
                        _this.RefreshData();
                    }
                });
            }
            this.RefreshData();
        };
        TreeView.prototype.GetLoaders = function () {
            var loaders = [this.VisibleTasks.waitData];
            if (this.isResources) {
                this.Resources = this.Local.resources();
                this.Assignments = this.Local.assignments();
                loaders.push(this.Resources.waitData, this.Assignments.waitData);
            }
            return loaders;
        };
        TreeView.prototype.RefreshData = function () {
            var _this = this;
            var loaders = this.GetLoaders();
            webix.promise.all(loaders).then(function () {
                _this.Tree.sync(_this.VisibleTasks);
                _this.ApplySelection();
                _this.ApplySorting();
            });
        };
        TreeView.prototype.ApplySelection = function () {
            var id = this.State.selected;
            if (id && this.Tree.exists(id) && this.Tree.getSelectedId() != id) {
                var selected = void 0;
                var task = this.Tree.getItem(id);
                if (this.State.display === "tasks") {
                    var parent_1 = task.parent;
                    var pdata = parent_1 != 0 ? this.Tree.getItem(parent_1) : null;
                    if (pdata && pdata.type === "split") {
                        selected = parent_1;
                    }
                    else if (this.Local._isTaskVisible(task)) {
                        selected = id;
                    }
                }
                else if (this.Local._isTaskVisible(task)) {
                    selected = id;
                }
                if (selected) {
                    this.Tree.select(selected);
                    this.Tree.showItem(selected);
                }
            }
        };
        TreeView.prototype.ApplySorting = function () {
            if (this.State.sort) {
                this.Tree.data.blockEvent();
                this.Tree.setState({ sort: this.State.sort });
                this.Tree.data.unblockEvent();
            }
        };
        TreeView.prototype.AddTask = function (pid, dates) {
            var _this = this;
            this.State.selected = null;
            var row = this.Tree.getItem(pid);
            var index = row ? 0 : -1;
            var inProgress;
            var newTask = this.GetNewTask(row, dates);
            if (this.Mode == "resources" && row) {
                inProgress = this.AddTaskWithAssignment(newTask, pid);
            }
            else {
                if (row && dates) {
                    var assigned = void 0;
                    if (this.app.config.resources) {
                        assigned = this.Assignments.find(function (a) { return a.task == row.id; });
                    }
                    if (assigned && assigned.length)
                        inProgress = this.SplitTaskWithAssignment(newTask, index, pid, row, assigned);
                    else
                        inProgress = this.Ops.splitTaskWithDnd(newTask, index, pid, row);
                }
                else
                    inProgress = this.Ops.addTask(newTask, index, row ? pid : 0);
            }
            this.app.callEvent("backend:operation", [inProgress]);
            inProgress.then(function (res) {
                if (row && _this.Mode == "tasks" && row.type !== "split") {
                    _this.Tree.open(pid);
                }
                _this.State.$batch({
                    edit: true,
                    selected: res.id,
                });
                _this.Tree.showItem(res.id);
            });
            return false;
        };
        TreeView.prototype.GetNewTask = function (row, dates) {
            var _a = this.GetDates(row, dates), start = _a.start, end = _a.end;
            return {
                start_date: new Date(start),
                end_date: end || webix.Date.add(start, 1, "day", true),
                progress: 0,
                text: "",
            };
        };
        TreeView.prototype.GetDates = function (row, dates) {
            if (dates) {
                return dates;
            }
            var start, end;
            if (row && row.type === "split") {
                var date = row.$data && row.$data.length ? row.$data[0].end_date : row.end_date;
                start = this.Helpers.addUnit("day", date, 1);
            }
            else {
                if (row) {
                    start = row.start_date;
                }
                else {
                    var scales = this.Local.getScales();
                    start = webix.Date.add(scales.start, 1, scales.minUnit);
                }
            }
            return { start: start, end: end };
        };
        TreeView.prototype.AddTaskWithAssignment = function (newTask, pid) {
            var _this = this;
            this.Tasks.data.blockEvent();
            this.Assignments.data.blockEvent();
            var targetId = "0";
            if (pid)
                targetId = this.Tree.getItem(pid).$group ? "0" : pid;
            var index = 0;
            if (this.Tasks.data.branch[targetId])
                index = this.Tasks.data.branch[targetId].length;
            return this.Ops.addTask(newTask, index, targetId)
                .then(function (obj) {
                newTask.id = obj.id;
                var waitArr = [];
                var resources = null;
                while (pid != "0" && !resources) {
                    resources = _this.Tree.getItem(pid).resources;
                    if (!resources)
                        pid = _this.Tree.getParentId(pid);
                }
                if (resources && resources.length) {
                    resources.forEach(function (rId) {
                        var resource = _this.Local.resources().getItem(rId);
                        waitArr.push(_this.Ops.addAssignment({
                            resource: rId,
                            value: _this.Helpers.getDefaultResourceValue(resource),
                            task: newTask.id,
                        }));
                    });
                }
                if (!waitArr.length)
                    return webix.promise.resolve(obj);
                return webix.promise.all(waitArr).then(function () { return obj; });
            })
                .finally(function () {
                _this.Tasks.data.unblockEvent();
                _this.Assignments.data.unblockEvent();
                _this.Tasks.data.callEvent("onStoreUpdated", [
                    newTask.id,
                    newTask,
                    "add",
                ]);
            });
        };
        TreeView.prototype.SplitTaskWithAssignment = function (newTask, index, pid, row, assignments) {
            var _this = this;
            return this.Ops.splitTaskWithDnd(newTask, index, pid, row).then(function (res) {
                if (res.sibling) {
                    var aops = [];
                    for (var i = 0; i < assignments.length; ++i)
                        aops.push(_this.Ops.updateAssignment(assignments[i].id, {
                            task: res.sibling,
                        }).then(function () { return res; }));
                    return webix.promise.all(aops).then(function () { return res; });
                }
                return res;
            });
        };
        TreeView.prototype.RefreshTasks = function () {
            this.Tasks.data.callEvent("onStoreUpdated", []);
        };
        TreeView.prototype.SortTasks = function (by, dir, as) {
            var dataSorter = webix.isArray(by) ? by : { by: by, dir: dir, as: as };
            var sortState = this.Tree.getState().sort;
            this.VisibleTasks.sort(dataSorter);
            this.State.sort = sortState;
        };
        TreeView.prototype.ToggleColumns = function () {
            var vis = this.Tree.isColumnVisible("text");
            this.Tree.showColumnBatch("full", !vis);
            this.Tree.config.width = vis ? 44 : 0;
            this.Tree.resize();
            this.app.callEvent("bars:toggle", [vis]);
        };
        TreeView.prototype.NormalizeColumns = function (id, user) {
            if (!user)
                return;
            var tree = this.Tree;
            var columns = tree.config.columns;
            var i = tree.getColumnIndex(id);
            var last = columns.length - 1;
            if (columns[last].id === "action")
                last -= 1;
            if (i === 0) {
                columns[last].fillspace = true;
                columns[last].width = 0;
            }
            else if (i === last) {
                columns[0].fillspace = true;
                columns[0].width = 0;
            }
            tree.refreshColumns();
        };
        TreeView.prototype.ToggleBranch = function (id, open) {
            if (this.State.display != "resources") {
                this.RefreshTasks();
                if (!this.State.readonly)
                    this.Ops.updateTask(id, { opened: open });
            }
            else {
                var tree = this.VisibleTasks;
                var item = tree.getItem(id);
                item.open = !!open;
                tree.data.callEvent("onStoreUpdated", [id, 0, "branch"]);
            }
        };
        TreeView.prototype.TitleTemplate = function (obj) {
            return (obj.text || (obj.$group ? this._("Unassigned") : this._("(no title)")));
        };
        TreeView.prototype.ResourcesTemplate = function (obj) {
            var _this = this;
            if (this.Assignments.count() && this.Resources.count()) {
                var assigned_1 = [];
                this.Assignments.data.each(function (a) {
                    if (a.task == obj.id)
                        assigned_1.push(_this.Resources.getItem(a.resource));
                });
                assigned_1.sort(this.Ops.sortResources);
                return this.GetAssignmentsHTML(assigned_1);
            }
            return "";
        };
        TreeView.prototype.GetAssignmentsHTML = function (assignedArr) {
            var _this = this;
            var str = "";
            if (assignedArr.length > this.maxAvatarNumber) {
                var num = assignedArr.length - this.maxAvatarNumber + 1;
                assignedArr = assignedArr.splice(0, this.maxAvatarNumber);
                var last = assignedArr.pop();
                var lastStr = this.Helpers.resourceAvatar(last);
                var numStr = "<div class='webix_gantt_cell_remain_num'>+" + num + "</div>";
                str = assignedArr
                    .map(function (r) { return "" + _this.Helpers.resourceAvatar(r, null, true); })
                    .join("");
                str +=
                    "<div class='webix_gantt_cell_assigned_last'>" +
                        lastStr +
                        numStr +
                        "</div>";
            }
            else {
                str = assignedArr
                    .map(function (r) { return "" + _this.Helpers.resourceAvatar(r, null, true); })
                    .join("");
                if (assignedArr.length == 1) {
                    var arr = assignedArr[0].name.split(" ");
                    str +=
                        "<span class='webix_gantt_cell_assigned_text'>" + arr[0] + "</span>";
                }
            }
            return "<div class='webix_gantt_avatar_box'>" + str + "</div>";
        };
        return TreeView;
    }(JetView));

    var TopView = (function (_super) {
        __extends(TopView, _super);
        function TopView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TopView.prototype.config = function () {
            var _this = this;
            initRLayout();
            this.fCompact = this.getParam("forceCompact");
            if (!webix.isUndefined(this.fCompact))
                this.setParam("compact", this.fCompact);
            this.Compact = this.getParam("compact");
            this.State = this.getParam("state", true);
            var edit = this.Compact
                ? { $subview: true, name: "edit", popup: true }
                : {
                    view: "proxy",
                    css: "webix_shadow_medium",
                    borderless: true,
                    width: 400,
                    hidden: true,
                    localId: "edit",
                    body: { $subview: true, name: "edit" },
                };
            var cols = [
                TreeView$1,
                {
                    view: this.Compact ? "spacer" : "resizer",
                    css: "webix_gantt_resizer",
                    width: this.Compact ? 1 : 4,
                },
                ChartView,
            ];
            if (this.app.config.resources) {
                cols = [
                    {
                        type: "clean",
                        rows: [
                            {
                                type: "clean",
                                cols: cols,
                                on: {
                                    onViewResize: function () {
                                        _this.app.callEvent("rdiagram:resize", []);
                                    },
                                },
                            },
                            {
                                view: "resizer",
                                css: "webix_gantt_resizer",
                                localId: "rdResizer",
                            },
                            {
                                view: "proxy",
                                localId: "rdiagram",
                                height: this.Compact ? 0 : 400,
                                body: { $subview: true, name: "rdiagram" },
                            },
                        ],
                    },
                    edit,
                ];
            }
            else {
                cols.push(edit);
            }
            var main = {
                view: "abslayout",
                css: "webix_gantt",
                cells: [
                    {
                        view: "r-layout",
                        localId: "main",
                        borderless: true,
                        relative: true,
                        type: "clean",
                        cols: cols,
                    },
                    {
                        css: "webix_gantt_absbutton",
                        view: "icon",
                        icon: "wxi-plus",
                        localId: "add",
                        hidden: !this.Compact || this.State.readonly,
                        width: 50,
                        height: 50,
                        right: 20,
                        bottom: 20,
                        click: function () {
                            _this.app.callEvent("task:add", []);
                        },
                    },
                ],
            };
            return main;
        };
        TopView.prototype.init = function (view) {
            var _this = this;
            this.$$("main").sizeTrigger(this.app, function (mode) { return _this.SetCompactMode(mode); }, !!this.Compact);
            this.on(this.State.$changes, "selected", function (id, oid) {
                if (id)
                    _this.ShowTask(_this.State.edit ? "form" : "info");
                else if (oid)
                    _this.HideTask();
            });
            this.on(this.State.$changes, "edit", function (v) {
                if (_this.State.selected)
                    _this.ShowTask(v ? "form" : "info");
            });
            webix.extend(view, webix.ProgressBar);
            this.on(this.app, "backend:operation", function (res) {
                view.showProgress({ type: "top", delay: 2000 });
                res.finally(function () {
                    view.hideProgress();
                });
            });
            if (this.app.config.resources) {
                this.on(this.State.$changes, "resourcesDiagram", function (v) {
                    if (v) {
                        _this.$$("rdiagram").show();
                        _this.$$("rdResizer").show();
                        _this.show("rdiagram", { target: "rdiagram" });
                    }
                    else {
                        _this.$$("rdiagram").hide();
                        _this.$$("rdResizer").hide();
                        _this.show("_blank", { target: "rdiagram" }).then(function () {
                            _this.app.callEvent("rdiagram:resize", []);
                        });
                    }
                });
            }
        };
        TopView.prototype.ShowTask = function (path) {
            path = "task." + path;
            if (this.Compact) {
                this.show("task.popup/" + path, {
                    target: "edit",
                });
            }
            else {
                this.$$("edit").show();
                this.show(path, {
                    target: "edit",
                });
            }
        };
        TopView.prototype.HideTask = function () {
            this.show("_blank", { target: "edit" });
            if (!this.Compact)
                this.$$("edit").hide();
        };
        TopView.prototype.SetCompactMode = function (mode) {
            var _this = this;
            webix.delay(function () {
                _this.State.$batch({ top: 0, left: 0 });
                _this.setParam("compact", mode);
                _this.refresh();
            });
        };
        return TopView;
    }(JetView));

    var views = { JetView: JetView };
    views["chart/bars"] = BarsView;
    views["chart"] = ChartView;
    views["chart/scale"] = ScalesView;
    views["rdiagram/diagram"] = DiagramView;
    views["rdiagram"] = RDiagramView;
    views["rdiagram/tree"] = TreeView;
    views["task/baseline"] = BaselineView;
    views["task/form"] = FormView;
    views["task/info"] = TaskView;
    views["task/links"] = TableView;
    views["task/popup"] = TaskPopup;
    views["task/resources"] = ResourcesView;
    views["top"] = TopView;
    views["tree"] = TreeView$1;

    var en = {
        Edit: "Edit",
        Done: "Done",
        "Delete task": "Delete task",
        "Delete link": "Delete link",
        "The task will be deleted permanently, are you sure?": "The task will be deleted permanently, are you sure?",
        "The link will be deleted permanently, are you sure?": "The link will be deleted permanently, are you sure?",
        Predecessors: "Predecessors",
        Successors: "Successors",
        Title: "Title",
        "Start date": "Start date",
        "End date": "End date",
        Duration: "Duration",
        Progress: "Progress",
        Notes: "Notes",
        Type: "Type",
        Project: "Project",
        Milestone: "Milestone",
        "Add task": "Add task",
        "Add project": "Add project",
        "(no title)": "(no title)",
        "Save changes?": "Save changes?",
        "Related tasks": "Related tasks",
        Task: "Task",
        Link: "Link",
        "End to start": "End to start",
        "Start to start": "Start to start",
        "End to end": "End to end",
        "Start to end": "Start to end",
        Lasts: "Lasts",
        day: "day",
        days: "days",
        "Add assignment": "Add assignment",
        Assignment: "Assignment",
        Assignments: "Assignments",
        Assigned: "Assigned",
        "Delete assignment": "Delete assignment",
        "Are you sure to delete this assignment?": "Are you sure to delete this assignment?",
        "No resources to add": "No resources to add",
        Unassigned: "Unassigned",
        hour: "h",
        "Hours per": "Hours per",
        "Tasks per": "Tasks per",
        Name: "Name",
        Hours: "Hours",
        Tasks: "Tasks",
        month: "month",
        week: "week",
        quarter: "quarter",
        year: "year",
        "Split task": "Split task",
        "Planned dates": "Planned dates",
        "Planned dates will be removed, are you sure?": "Planned dates will be removed, are you sure?",
        "Add dates": "Add dates",
        "Remove dates": "Remove dates",
    };

    var Local = (function () {
        function Local(app, config) {
            this.app = app;
            this.state = app.getState();
            this.Helpers = this.app.getService("helpers");
            this.resetScales(config);
            this.dateToLocalStr = webix.Date.dateToStr(webix.i18n.parseFormat);
        }
        Local.prototype.setScales = function (scaleStart, scaleEnd, precise, width, height, scales) {
            var oldScale = this._scales;
            if (width) {
                this._scaleBase = { width: width, height: height, scales: scales };
                scaleEnd = webix.Date.add(scaleEnd, 1, "day");
            }
            else {
                width = this._scaleBase.width;
                height = this._scaleBase.height;
                scales = this._scaleBase.scales;
            }
            this._scales = this.app
                .getService("helpers")
                .setScales(scaleStart, scaleEnd, precise, width, height, scales);
            this._taskHeight = this._scales.cellHeight - 12;
            var tasks = this.getVisibleTasksCollection();
            if (tasks && tasks.data.order.length) {
                if (this.state.display === "resources") {
                    this.app.getService("grouping").refreshResourceTasks();
                }
                else {
                    this.refreshTasks();
                }
                this.refreshLinks();
            }
            this.app.callEvent("onScalesUpdate", [this._scales, oldScale]);
        };
        Local.prototype.getScales = function () {
            return this._scales;
        };
        Local.prototype.resetScales = function (config) {
            config = config || this.app.config;
            var active = webix.skin.$active;
            var scaleStart = config.scaleStart || webix.Date.dayStart(new Date());
            var scaleEnd = config.scaleEnd || webix.Date.add(scaleStart, 1, "month", true);
            this.setScales(scaleStart, scaleEnd, config.preciseTimeUnit, config.scaleCellWidth || 80, active.barHeight - active.borderWidth * 2, config.scales || [{ unit: "day", step: 1, format: "%d" }]);
        };
        Local.prototype.getTaskHeight = function () {
            return this._taskHeight;
        };
        Local.prototype.adjustScale = function (obj) {
            var start = obj.start_date;
            var end = obj.end_date;
            if (this.state.baseline && obj.planned_start && obj.planned_end) {
                if (start > obj.planned_start)
                    start = obj.planned_start;
                if (end < obj.planned_end)
                    end = obj.planned_end;
            }
            var s = this.getScales();
            start = this.Helpers.addUnit(s.minUnit, start, -1);
            end = this.Helpers.addUnit(s.minUnit, end, 1);
            if ((s && s.start > start) || s.end < end) {
                this.setScales(s.start > start ? start : s.start, s.end < end ? end : s.end, s.precise);
            }
        };
        Local.prototype.tasks = function (force) {
            var _this = this;
            if (this._tasks && !force)
                return this._tasks;
            if (!this._tasks) {
                this._tasks = this.createTasks();
            }
            else {
                this._tasks.clearAll();
            }
            var waitArr = [this.app.getService("backend").tasks()];
            if (this.app.config.resourceCalendars)
                waitArr.push(this.taskCalendarMap(false, force));
            this._tasks.parse(webix.promise.all(waitArr).then(function (data) {
                return _this.app.getService("grouping").getTreeData(data[0], 0);
            }));
            return this._tasks;
        };
        Local.prototype.createTasks = function () {
            var _this = this;
            var ops = this.app.getService("operations");
            var tasks = new webix.TreeCollection({
                on: {
                    "data->onStoreLoad": function () {
                        if (!_this.app.config.scaleStart)
                            _this.updateScaleMinMax(tasks);
                        tasks.data.each(function (d) {
                            if (_this.app.config.projects && d.$count)
                                d.type = "project";
                        });
                    },
                    "data->onStoreUpdated": function (id, obj, mode) {
                        id = mode == "update" ? id : null;
                        _this.refreshTasks(id);
                        _this.refreshLinks();
                        if (!mode && _this.state.criticalPath) {
                            if (_this.app.config.links)
                                _this._links.waitData.then(function () { return _this.showCriticalPath(); });
                            else
                                _this.showCriticalPath();
                        }
                    },
                },
                scheme: {
                    $change: function (obj) {
                        obj.start_date = webix.i18n.parseFormatDate(obj.start_date);
                        obj.end_date = webix.i18n.parseFormatDate(obj.end_date);
                        obj.type = obj.type || "task";
                        if (!_this.app.config.split && obj.type === "split")
                            obj.type = "task";
                        ops.updateTaskDuration(obj);
                        if (obj.planned_start) {
                            obj.planned_start = webix.i18n.parseFormatDate(obj.planned_start);
                            obj.planned_end = webix.i18n.parseFormatDate(obj.planned_end);
                            ops.updatePlannedTaskDuration(obj);
                        }
                        if (obj.type === "split") {
                            obj.open = obj.opened = 0;
                            obj.$css = "webix_gantt_split_task";
                        }
                        else {
                            delete obj.$css;
                            obj.open = (obj.open || obj.opened) * 1 || 0;
                        }
                    },
                    $sort: {
                        by: "position",
                        dir: "asc",
                        as: "int",
                    },
                    $serialize: function (data) { return _this.taskOut(data); },
                    $export: function (data) { return _this.taskOut(data); },
                },
            });
            return tasks;
        };
        Local.prototype.refreshTasks = function (updID, i) {
            var _this = this;
            if (!updID) {
                this._tasks.data.order.forEach(function (id, i) {
                    _this.refreshTasks(id, i);
                });
            }
            else {
                var t_1 = this._tasks.getItem(updID);
                i = !webix.isUndefined(i) ? i : this._tasks.getIndexById(updID);
                if (i < 0)
                    i = this._tasks.getIndexById(t_1.parent);
                if (t_1.type === "split") {
                    t_1.$data = this._tasks
                        .find(function (k) { return k.parent == t_1.id; })
                        .sort(function (a, b) { return b.start_date - a.start_date || b.end_date - a.end_date; });
                }
                this.Helpers.updateTask(t_1, i);
                if (this.state.baseline && t_1.planned_start)
                    this.refreshBaseline(t_1, i);
            }
        };
        Local.prototype.refreshBaseline = function (task, i) {
            var t = __assign({}, task);
            t.start_date = task.planned_start;
            t.duration = task.planned_duration;
            t.end_date = task.planned_end;
            this.Helpers.updateTask(t, i, this._scales, this._taskHeight);
            task.$x0 = t.$x;
            task.$w0 = t.$w;
        };
        Local.prototype.links = function (force) {
            if (this._links && !force)
                return this._links;
            if (!this._links) {
                this._links = this.createLinks();
            }
            else {
                this._links.clearAll();
            }
            if (this.app.config.links)
                this._links.parse(this.app.getService("backend").links());
            return this._links;
        };
        Local.prototype.createLinks = function () {
            var _this = this;
            return new webix.DataCollection({
                on: {
                    "data->onStoreUpdated": function (id, v, mode) {
                        if (mode)
                            _this.refreshLinks(id);
                    },
                },
                scheme: {
                    $init: function (obj) {
                        obj.type = obj.type * 1;
                    },
                },
            });
        };
        Local.prototype.refreshLinks = function (id) {
            var _this = this;
            var tasks = this.getVisibleTasksCollection();
            if (this._links && tasks) {
                this._links.data.each(function (l) {
                    var s = tasks.getItem(l.source);
                    var e = tasks.getItem(l.target);
                    if (!s || !e || !_this._isTaskVisible(s) || !_this._isTaskVisible(e))
                        l.$p = "";
                    else
                        _this.Helpers.updateLink(l, s, e);
                });
                if (this.state.criticalPath && id) {
                    this.showCriticalPath();
                }
            }
        };
        Local.prototype.getLinks = function (id, type) {
            var found = this._links.find(function (a) { return a[type] == id; });
            var res = [];
            for (var i = 0; i < found.length; i++) {
                var a = found[i];
                var t = this._tasks.getItem(a[type == "source" ? "target" : "source"]);
                if (t)
                    res.push({
                        id: a.id,
                        type: a.type.toString(),
                        text: t.text,
                        ttype: type,
                    });
            }
            return res;
        };
        Local.prototype.taskOut = function (data) {
            data = webix.copy(data);
            var format = this.dateToLocalStr;
            if (data.start_date)
                data.start_date = format(data.start_date);
            if (data.end_date)
                data.end_date = format(data.end_date);
            for (var k in data) {
                if (k.indexOf("$") === 0)
                    delete data[k];
            }
            return data;
        };
        Local.prototype._isTaskVisible = function (x, tcollection) {
            var tasks = this.getVisibleTasksCollection(tcollection);
            var taskParent = x.$parent;
            var taskSplit = x.type === "split" && !x.open;
            if (taskSplit && !taskParent)
                return false;
            while (x.$parent) {
                x = tasks.getItem(x.$parent);
                if (!((taskParent == x.id && x.type == "split") || x.open) ||
                    (x.open && taskSplit)) {
                    return false;
                }
            }
            return true;
        };
        Local.prototype.categories = function (force) {
            if (this._categories && !force)
                return this._categories;
            if (!this._categories) {
                this._categories = new webix.DataCollection({});
            }
            else {
                this._categories.clearAll();
            }
            this._categories.parse(this.app.getService("backend").categories());
            return this._categories;
        };
        Local.prototype.resources = function (force) {
            var _this = this;
            if (this._resources && !force)
                return this._resources;
            if (!this._resources) {
                this._resources = new webix.DataCollection({});
            }
            else {
                this._resources.clearAll();
            }
            var waitArr = [
                this.app.getService("backend").resources(),
                this.categories(force).waitData,
            ];
            if (this.app.config.resourceCalendars)
                waitArr.push(this.calendars(force).waitData);
            this._resources.parse(webix.promise.all(waitArr).then(function (arr) {
                var rData = arr[0];
                rData.forEach(function (resource) {
                    if (resource["category_id"]) {
                        var ctg = _this.categories().getItem(resource["category_id"]);
                        resource.category = ctg.name;
                        if (!resource.unit && ctg.unit)
                            resource.unit = ctg.unit;
                    }
                });
                rData.sort(_this.app.getService("operations").sortResources);
                return rData;
            }));
            return this._resources;
        };
        Local.prototype.assignments = function (force) {
            if (this._assignments && !force)
                return this._assignments;
            if (!this._assignments) {
                this._assignments = new webix.DataCollection({});
            }
            else {
                this._assignments.clearAll();
            }
            this._assignments.parse(this.app.getService("backend").assignments());
            return this._assignments;
        };
        Local.prototype.getAssignments = function (id) {
            var _this = this;
            return webix.promise
                .all([this.resources().waitData, this.assignments().waitData])
                .then(function () {
                var resources = _this.resources();
                var assigned = _this.assignments().data.find(function (a) { return a.task == id; });
                return assigned.map(function (a) {
                    var aCopy = Object.assign({}, a);
                    var resource = Object.assign({}, resources.getItem(a.resource));
                    delete resource.id;
                    return Object.assign(aCopy, resource);
                });
            });
        };
        Local.prototype.calendars = function (force) {
            if (this._calendars && !force)
                return this._calendars;
            if (!this._calendars) {
                this._calendars = this.createCalendars();
            }
            else {
                this._calendars.clearAll();
            }
            this._calendars.parse(this.app.getService("backend").calendars());
            return this._calendars;
        };
        Local.prototype.createCalendars = function () {
            return new webix.DataCollection({
                scheme: {
                    $change: function (obj) {
                        if (typeof obj.weekDays == "string")
                            obj.weekDays = obj.weekDays.split(",").map(function (a) { return 1 * a; });
                        if (obj.holidays) {
                            if (typeof obj.holidays == "string")
                                obj.holidays = obj.holidays.split(",");
                            obj.holidays = obj.holidays.map(function (d) {
                                return webix.Date.datePart(new Date(d));
                            });
                        }
                    },
                },
            });
        };
        Local.prototype.showCriticalPath = function (clean) {
            var _this = this;
            if (clean) {
                this._tasks.data.order.forEach(function (id) {
                    var task = _this._tasks.getItem(id);
                    delete task.$critical;
                });
            }
            else {
                var all = this._tasks.data.getRange().sort(function (a, b) {
                    return (b.end_date - a.end_date ||
                        (a.parent == b.id ? 1 : b.parent == a.id ? -1 : 0) ||
                        b.start_date - a.start_date);
                });
                var latestDate_1 = webix.Date.copy(all[0].end_date);
                all.forEach(function (task) {
                    task.$critical = _this.isTaskCritical(task, latestDate_1);
                });
            }
            this._tasks.data.callEvent("onStoreUpdated", [null, null, "paint"]);
        };
        Local.prototype.isTaskCritical = function (task, latestDate) {
            if (latestDate && webix.Date.equal(latestDate, task.end_date)) {
                return true;
            }
            else {
                var links = this._links.find(function (l) { return l.source == task.id && l.type == 0; });
                for (var i = 0; i < links.length; ++i) {
                    var dependent = this._tasks.getItem(links[i].target);
                    if (dependent.$critical &&
                        this.isNoSlack(dependent.start_date, task.end_date, task.id))
                        return true;
                }
                if (task.parent != 0) {
                    var parent_1 = this._tasks.getItem(task.parent);
                    return parent_1.$critical && task.end_date >= parent_1.end_date;
                }
                return false;
            }
        };
        Local.prototype.isNoSlack = function (nextStart, currentEnd, taskId) {
            if (this.app.config.excludeHolidays) {
                if (currentEnd >= nextStart)
                    return true;
                for (var date = webix.Date.copy(currentEnd); date < nextStart;) {
                    if (!this.isHoliday(date, taskId))
                        return false;
                    webix.Date.add(date, 1, "day");
                }
                return true;
            }
            return currentEnd >= nextStart;
        };
        Local.prototype.isLinkCritical = function (link) {
            var critical = false;
            if (link.type == 0) {
                var tasks = this.tasks();
                var s = tasks.getItem(link.source);
                var t = tasks.getItem(link.target);
                critical = s && t && s.$critical && t.$critical;
            }
            return critical;
        };
        Local.prototype.getVisibleTasksCollection = function (tasks) {
            if (!tasks && this.state.display == "resources") {
                var g = this.app.getService("grouping");
                return g ? g.getResourceTree() : null;
            }
            return this._tasks;
        };
        Local.prototype.taskCalendarMap = function (now, force) {
            var _this = this;
            if (now)
                return this._calendarMap || null;
            if (!this._calendarMap) {
                this.assignments().data.attachEvent("onStoreUpdated", function () {
                    _this.refreshCalendarMap();
                });
                this.resources().data.attachEvent("onStoreUpdated", function () {
                    _this.refreshCalendarMap();
                });
                this.calendars().data.attachEvent("onStoreUpdated", function () {
                    _this.refreshCalendarMap();
                });
            }
            var waitArr = [
                this.assignments(force).waitData,
                this.resources(force).waitData,
            ];
            if (!force) {
                waitArr.push(this.calendars().waitData);
            }
            return webix.promise.all(waitArr).then(function () {
                if (!_this._calendarMap)
                    _this.refreshCalendarMap();
                return _this._calendarMap;
            });
        };
        Local.prototype.refreshCalendarMap = function () {
            var resources = this.resources();
            var calendars = this.calendars();
            var data = {};
            this.assignments().data.each(function (obj) {
                var resource = resources.getItem(obj.resource);
                if (resource) {
                    var id = resource.calendar_id;
                    var cal = id ? calendars.getItem(id) : null;
                    if (cal && !data[obj.task])
                        data[obj.task] = cal;
                }
            });
            return (this._calendarMap = data);
        };
        Local.prototype.getTaskCalendar = function (taskId) {
            var map = this.taskCalendarMap(true);
            return map ? map[taskId] : null;
        };
        Local.prototype.isHoliday = function (date, taskId) {
            if (taskId && this._calendarMap) {
                var calendar = this._calendarMap[taskId];
                if (calendar)
                    return this.Helpers.isResourceHoliday(date, calendar);
            }
            return this.app.config.isHoliday(date);
        };
        Local.prototype.clearAll = function () {
            var _this = this;
            var grouping = this.app.getService("grouping");
            var collections = [
                "tasks",
                "links",
                "resources",
                "categories",
                "assignments",
                "calendars",
            ];
            this.state.$batch({
                edit: null,
                selected: null,
                sort: null,
                top: 0,
                left: 0,
            });
            if (this.app.config.resourcesDiagram) {
                var rdCollection = grouping.getRDCollection();
                rdCollection.clearAll();
            }
            if (this.app.config.resources) {
                var rCollection = grouping.getResourceTree();
                rCollection.clearAll();
            }
            collections.forEach(function (name) {
                var key = "_" + name;
                if (_this[key])
                    _this[key].clearAll();
            });
            this.resetScales();
        };
        Local.prototype.reload = function () {
            var _this = this;
            this.clearAll();
            var grouping = this.app.getService("grouping");
            var collections = ["tasks", "links"];
            var waitArr = [];
            if (this.app.config.resources && !this.app.config.resourceCalendars) {
                collections.push("resources", "assignments");
            }
            collections.forEach(function (name) {
                var collection = _this[name](true);
                waitArr.push(collection.waitData);
            });
            if (this.app.config.resourcesDiagram) {
                grouping.getRDCollection(true);
            }
            webix.promise.all(waitArr).then(function () {
                _this.app.refresh();
            });
        };
        Local.prototype.updateScaleMinMax = function (tasks) {
            var _this = this;
            var min = Infinity;
            var max = -Infinity;
            tasks.data.each(function (d) {
                if (d.start_date < min)
                    min = d.start_date;
                if (d.end_date > max)
                    max = d.end_date;
                if (_this.state.baseline && d.planned_start && d.planned_end) {
                    if (d.planned_start < min)
                        min = d.planned_start;
                    if (d.planned_end > max)
                        max = d.planned_end;
                }
            });
            if (typeof min === "object") {
                var s = this.getScales();
                this.setScales(this.Helpers.addUnit(s.minUnit, min, -1), this.Helpers.addUnit(s.minUnit, max, 1), s.precise);
            }
        };
        return Local;
    }());

    var Backend = (function () {
        function Backend(app, url) {
            this.app = app;
            this._url = url;
        }
        Backend.prototype.url = function (path) {
            return this._url + path;
        };
        Backend.prototype.tasks = function () {
            return webix.ajax(this.url("tasks")).then(function (res) { return res.json(); });
        };
        Backend.prototype.links = function () {
            return webix.ajax(this.url("links")).then(function (res) { return res.json(); });
        };
        Backend.prototype.resources = function () {
            return webix.ajax(this.url("resources")).then(function (res) { return res.json(); });
        };
        Backend.prototype.categories = function () {
            return webix.ajax(this.url("categories")).then(function (res) { return res.json(); });
        };
        Backend.prototype.assignments = function () {
            return webix.ajax(this.url("assignments")).then(function (res) { return res.json(); });
        };
        Backend.prototype.calendars = function () {
            return webix.ajax(this.url("calendars")).then(function (res) { return res.json(); });
        };
        Backend.prototype.addTask = function (obj, mode, parent) {
            var inProgress = webix
                .ajax()
                .post(this.url("tasks"), __assign(__assign({}, obj), { mode: mode, parent: parent }))
                .then(function (res) { return res.json(); });
            this.app.callEvent("backend:operation", [inProgress]);
            return inProgress;
        };
        Backend.prototype.removeTask = function (id) {
            var inProgress = webix
                .ajax()
                .del(this.url("tasks/" + id))
                .then(function (res) { return res.json(); });
            this.app.callEvent("backend:operation", [inProgress]);
            return inProgress;
        };
        Backend.prototype.updateTask = function (id, obj, split) {
            var inProgress = webix
                .ajax()
                .put(this.url("tasks/" + id + (split ? "/split" : "")), obj)
                .then(function (res) { return res.json(); });
            this.app.callEvent("backend:operation", [inProgress]);
            return inProgress;
        };
        Backend.prototype.reorderTask = function (id, obj) {
            var inProgress = webix
                .ajax()
                .put(this.url("tasks/" + id + "/position"), obj)
                .then(function (res) { return res.json(); });
            this.app.callEvent("backend:operation", [inProgress]);
            return inProgress;
        };
        Backend.prototype.addLink = function (obj) {
            var inProgress = webix
                .ajax()
                .post(this.url("links"), obj)
                .then(function (res) { return res.json(); });
            this.app.callEvent("backend:operation", [inProgress]);
            return inProgress;
        };
        Backend.prototype.updateLink = function (id, obj) {
            var inProgress = webix
                .ajax()
                .put(this.url("links/" + id), obj)
                .then(function (res) { return res.json(); });
            this.app.callEvent("backend:operation", [inProgress]);
            return inProgress;
        };
        Backend.prototype.removeLink = function (id) {
            var inProgress = webix
                .ajax()
                .del(this.url("links/" + id))
                .then(function (res) { return res.json(); });
            this.app.callEvent("backend:operation", [inProgress]);
            return inProgress;
        };
        Backend.prototype.addAssignment = function (obj) {
            var inProgress = webix
                .ajax()
                .post(this.url("assignments"), obj)
                .then(function (res) { return res.json(); });
            this.app.callEvent("backend:operation", [inProgress]);
            return inProgress;
        };
        Backend.prototype.updateAssignment = function (id, obj) {
            var inProgress = webix
                .ajax()
                .put(this.url("assignments/" + id), obj)
                .then(function (res) { return res.json(); });
            this.app.callEvent("backend:operation", [inProgress]);
            return inProgress;
        };
        Backend.prototype.removeAssignment = function (id) {
            var inProgress = webix
                .ajax()
                .del(this.url("assignments/" + id))
                .then(function (res) { return res.json(); });
            this.app.callEvent("backend:operation", [inProgress]);
            return inProgress;
        };
        return Backend;
    }());

    var Operations = (function () {
        function Operations(app) {
            this.app = app;
            this._local = this.app.getService("local");
            this._helpers = this.app.getService("helpers");
            this._back = this.app.getService("backend");
            this._state = this.app.getState();
        }
        Operations.prototype.addTask = function (obj, index, parent, mode) {
            var _this = this;
            this.updateTaskDuration(obj, mode);
            if (obj.planned_start)
                this.updatePlannedTaskDuration(obj, mode);
            var addMode = index == 0 ? "first" : "last";
            return this._back
                .addTask(this.cleanData(obj), addMode, parent)
                .then(function (added) {
                _this._local.adjustScale(obj);
                var tasks = _this._local.tasks();
                tasks.add(__assign(__assign({}, obj), { id: added.id, parent: parent }), index, parent);
                return _this.completeAdd(parent, added);
            });
        };
        Operations.prototype.splitTaskWithDnd = function (obj, index, parent, row) {
            var _this = this;
            this.updateTaskDuration(obj);
            return this._back
                .updateTask(parent, __assign(__assign({}, obj), { position: index, parent: parent }), true)
                .then(function (res) {
                _this._local.adjustScale(obj);
                var tasks = _this._local.tasks();
                tasks.updateItem(parent, {
                    type: "split",
                    duration: row.duration || 1,
                    progress: row.progress || 0,
                });
                if ((res.sibling && res.sibling != 0) ||
                    !tasks.find(function (t) { return t.parent == parent; }, true)) {
                    tasks.add(__assign(__assign({}, row), { type: "task", parent: parent, id: res.sibling, duration: row.duration || 1, progress: row.progress || 0 }), 0, parent);
                    ++index;
                }
                tasks.add(__assign(__assign({}, obj), { id: res.id, parent: parent, position: index }), index, parent);
                return _this.completeAdd(parent, res, res.sibling);
            });
        };
        Operations.prototype.completeAdd = function (parent, added, sibling) {
            var _this = this;
            if (parent) {
                return this.syncProject(parent).then(function () {
                    if (_this._state.criticalPath)
                        _this._local.showCriticalPath();
                    if (sibling)
                        added.sibling = sibling;
                    return added;
                });
            }
            else
                return webix.promise.resolve(added);
        };
        Operations.prototype.updateTask = function (id, obj, mode, inner) {
            var _this = this;
            var tasks = this._local.tasks();
            var item = webix.copy(tasks.getItem(id));
            var next = __assign(__assign({}, item), obj);
            var updateDates = !(webix.Date.equal(item.start_date, next.start_date) &&
                webix.Date.equal(item.end_date, next.end_date));
            if (updateDates) {
                this.updateTaskDuration(next, mode);
            }
            var updatePlanned = next.planned_start &&
                !(webix.Date.equal(item.planned_start, next.planned_start) &&
                    webix.Date.equal(item.planned_end, next.planned_end));
            if (updatePlanned)
                this.updatePlannedTaskDuration(next, mode);
            if (!inner && next.type == "project" && item.type != "project")
                return this.syncProject(id, next);
            return this._back.updateTask(id, this.cleanData(next)).then(function () {
                var _a = _this._local.getScales(), start = _a.start, end = _a.end;
                if (start > next.start_date ||
                    end < next.end_date ||
                    (updatePlanned &&
                        (start > next.planned_start || end < next.planned_end)))
                    _this._local.adjustScale(next);
                tasks.updateItem(id, next);
                if (next.type != "task" && item.type == "task")
                    _this.removeAssignments(next);
                if (!inner &&
                    (updateDates ||
                        item.progress != next.progress ||
                        item.parent != next.parent)) {
                    var res = void 0;
                    if (item.$count && item.type == "project")
                        res = _this.syncTasks(id, item.start_date, next.start_date).then(function () {
                            return _this.syncProject(item.parent);
                        });
                    else {
                        if (item.parent != next.parent) {
                            res = webix.promise.all([
                                _this.syncProject(next.parent),
                                _this.syncProject(item.parent),
                            ]);
                        }
                        else {
                            res = _this.syncProject(next.parent);
                        }
                    }
                    res.then(function () {
                        if (_this._state.criticalPath) {
                            tasks.updateItem(id, { $critical: false });
                            _this._local.showCriticalPath();
                        }
                    });
                }
                return next;
            });
        };
        Operations.prototype.updateTaskDuration = function (task, mode) {
            var _this = this;
            if (this.app.config.excludeHolidays) {
                var dir = void 0;
                if (mode) {
                    mode = mode == "move" ? "start" : mode;
                    var old = this._local.tasks().getItem(task.id);
                    var field = mode + (mode === "start" || mode === "end" ? "_date" : "");
                    dir = old[field] > task[field] ? -1 : 1;
                    if (mode != "start")
                        mode = "end";
                }
                var scales = webix.copy(this._local.getScales());
                scales.isHoliday = function (date) {
                    return _this._local.isHoliday(date, task.id);
                };
                this._helpers.updateTaskDuration(task, scales, mode, dir);
            }
            else
                this._helpers.updateTaskDuration(task);
        };
        Operations.prototype.updatePlannedTaskDuration = function (task, mode) {
            var _this = this;
            if (this.app.config.excludeHolidays) {
                var dir = void 0;
                if (mode) {
                    var old = this._local.tasks().getItem(task.id);
                    var field = "planned_" + mode;
                    dir = old[field] > task[field] ? -1 : 1;
                }
                var scales = webix.copy(this._local.getScales());
                scales.isHoliday = function (date) {
                    return _this._local.isHoliday(date, task.id);
                };
                this._updatePlannedTaskDuration(task, scales, mode, dir);
            }
            else
                this._updatePlannedTaskDuration(task);
        };
        Operations.prototype._updatePlannedTaskDuration = function (task, scales, mode, dir) {
            var t = __assign({}, task);
            t.start_date = task.planned_start;
            t.duration = task.planned_duration;
            t.end_date = task.planned_end;
            this._helpers.updateTaskDuration(t, scales, mode, dir);
            task.planned_start = t.start_date;
            task.planned_end = t.end_date;
            task.planned_duration = t.duration;
        };
        Operations.prototype.syncTasks = function (id, old, change) {
            var _this = this;
            var diff = change - old;
            if (this.app.config.excludeHolidays)
                diff = this.getWorkDateDiff(diff, old, id);
            if (diff) {
                var p_1 = [];
                this._local.tasks().data.eachSubItem(id, function (kid) {
                    var newDate = kid.start_date.valueOf() + diff;
                    if (_this.app.config.excludeHolidays) {
                        var delta = diff - _this.getWorkDateDiff(diff, kid.start_date, kid.id);
                        if (delta)
                            newDate = newDate + delta;
                    }
                    var changedKid = __assign(__assign({}, kid), { start_date: new Date(newDate), end_date: null });
                    p_1.push(_this.updateTask(kid.id, changedKid, "move", true));
                });
                return webix.promise.all(p_1);
            }
            return webix.promise.resolve();
        };
        Operations.prototype.getWorkDateDiff = function (diff, old, taskId) {
            var dir = Math.sign(diff);
            var dayLen = 86400000;
            var ad = dir * Math.floor(diff / dayLen);
            for (var i = 0, date = old; i < ad; ++i) {
                webix.Date.add(date, dir, "day");
                if (this._local.isHoliday(date, taskId))
                    diff = diff - dir * dayLen;
            }
            return diff;
        };
        Operations.prototype.syncProject = function (id, item) {
            var _this = this;
            var tasks = this._local.tasks();
            if (!item) {
                item = tasks.getItem(id);
                if (this.app.config.projects && item && item.type != "split") {
                    item.type = item.$count ? "project" : "task";
                    this.removeAssignments(item);
                }
                else {
                    while (item && item.type != "project") {
                        id = tasks.getParentId(id);
                        item = tasks.getItem(id);
                    }
                }
            }
            if (item && item.$count) {
                item = this.setProjectData(item);
            }
            if (item) {
                return this.updateTask(id, item, "start", true).then(function () {
                    _this.syncProject(item.parent);
                    return item;
                });
            }
            else
                return webix.promise.resolve();
        };
        Operations.prototype.setProjectData = function (item, tasks, branch) {
            if (!branch)
                item = webix.copy(item);
            var min = Infinity, max = 0, progress = 0, duration = 0;
            var handler = function (kid) {
                min = kid.start_date < min ? kid.start_date : min;
                max = kid.end_date > max ? kid.end_date : max;
                if (kid.duration && !(kid.type == "project" && kid.$count)) {
                    progress += kid.duration * kid.progress;
                    duration += kid.duration * 1;
                }
            };
            if (branch)
                branch.forEach(handler);
            else {
                var collection = tasks || this._local.tasks();
                collection.data.eachSubItem(item.id, handler);
            }
            if (!webix.Date.equal(item.start_date, min)) {
                item.start_date = min;
                item.duration = null;
            }
            if (!webix.Date.equal(item.end_date, max)) {
                item.end_date = max;
                item.duration = null;
            }
            item.progress = progress ? Math.round(progress / duration) : progress;
            return item;
        };
        Operations.prototype.updateTaskTime = function (id, mode, time) {
            var tasks = this._local.tasks();
            var task = tasks.getItem(id);
            var obj = {};
            var s = this._local.getScales();
            var unit = s.precise
                ? this._helpers.getSmallerUnit(s.minUnit)
                : s.minUnit;
            if (mode === "start" || mode === "move") {
                var offsetDate = s.precise
                    ? task.start_date
                    : this._helpers.getUnitStart(unit, task.start_date);
                obj.start_date = this._helpers.addUnit(unit, offsetDate, time);
                if (mode === "start" && obj.start_date > task.end_date)
                    obj.start_date = this._helpers.addUnit(unit, task.end_date, -1);
            }
            else if (mode === "end") {
                var us = this._helpers.getUnitStart(unit, task.end_date);
                var offsetDate = s.precise || webix.Date.equal(us, task.end_date)
                    ? task.end_date
                    : this._helpers.addUnit(unit, us, 1);
                obj.end_date = this._helpers.addUnit(unit, offsetDate, time);
                if (obj.end_date < task.start_date)
                    obj.end_date = this._helpers.addUnit(unit, task.start_date, 1);
            }
            if (mode === "move")
                obj.end_date = null;
            else
                obj.duration = 0;
            return this.updateTask(id, obj, mode);
        };
        Operations.prototype.removeTask = function (id) {
            var _this = this;
            var tasks = this._local.tasks();
            var links = this._local.links();
            var toRemove = links.find(function (a) { return a.source == id || a.target == id; });
            toRemove.forEach(function (a) { return links.remove(a.id); });
            return this._back.removeTask(id).then(function (res) {
                var parent = tasks.getItem(id).parent;
                tasks.remove(id);
                if (_this.app.config.split &&
                    parent != 0 &&
                    tasks.getItem(parent).type === "split" &&
                    !tasks.find(function (k) { return k.parent == parent; }, true)) {
                    return _this.updateTask(parent, { type: "task" }).then(function () {
                        return _this.completeRemoval(res, parent);
                    });
                }
                else
                    return _this.completeRemoval(res, parent);
            });
        };
        Operations.prototype.completeRemoval = function (res, parent) {
            var _this = this;
            return this.syncProject(parent).then(function () {
                if (_this._state.criticalPath)
                    _this._local.showCriticalPath();
                return res;
            });
        };
        Operations.prototype.addLink = function (obj) {
            var _this = this;
            if (!this.linkExists(obj)) {
                return this._back.addLink(obj).then(function (added) {
                    obj.id = added.id;
                    _this._local.links().add(obj);
                    return obj;
                });
            }
            return webix.promise.reject();
        };
        Operations.prototype.linkExists = function (obj) {
            return this._local.links().find(function (l) {
                return (l.target == obj.target && l.source == obj.source && l.type == obj.type);
            }, true);
        };
        Operations.prototype.updateLink = function (id, obj) {
            var _this = this;
            return this._back.updateLink(id, obj).then(function (res) {
                var links = _this._local.links();
                var duplicate = _this.linkExists(__assign(__assign({}, links.getItem(id)), obj));
                links.updateItem(id, obj);
                if (duplicate) {
                    return _this.removeLink(duplicate.id).then(function () { return res; });
                }
                else
                    return res;
            });
        };
        Operations.prototype.removeLink = function (id) {
            var _this = this;
            return this._back.removeLink(id).then(function (res) {
                _this._local.links().remove(id);
                return res;
            });
        };
        Operations.prototype.moveTask = function (id, parent, index) {
            var _this = this;
            parent = parent || 0;
            var tasks = this._local.tasks();
            var branch = tasks.data.branch[parent];
            var oldParent = tasks.getItem(id).parent;
            var oldIndex = tasks.data.getBranchIndex(id);
            if (parent == oldParent &&
                (index === oldIndex || (index === -1 && id === branch[branch.length - 1])))
                return webix.promise.reject();
            tasks.move(id, index, null, { parent: parent });
            return this._back
                .reorderTask(id, {
                parent: parent,
                mode: index === 0 ? "first" : index === -1 ? "last" : "after",
                target: tasks.data.branch[parent][index - 1],
            })
                .then(function (res) {
                if (parent !== oldParent) {
                    tasks.updateItem(id, { parent: parent });
                    return webix.promise
                        .all([_this.syncProject(parent), _this.syncProject(oldParent)])
                        .then(function () {
                        if (_this._state.criticalPath)
                            _this._local.showCriticalPath();
                        return res;
                    });
                }
                return res;
            });
        };
        Operations.prototype.updateAssignment = function (id, obj) {
            var _this = this;
            return this._back.updateAssignment(id, obj).then(function (res) {
                _this._local.assignments().updateItem(id, obj);
                return res;
            });
        };
        Operations.prototype.addAssignment = function (obj) {
            var _this = this;
            return this._back.addAssignment(obj).then(function (added) {
                obj.id = added.id;
                _this._local.assignments().add(obj);
                return obj;
            });
        };
        Operations.prototype.removeAssignment = function (id) {
            var _this = this;
            return this._back.removeAssignment(id).then(function (res) {
                _this._local.assignments().remove(id);
                return res;
            });
        };
        Operations.prototype.sortResources = function (a, b) {
            if (a.category == b.category)
                return a.name > b.name ? 1 : -1;
            return a.category > b.category ? 1 : -1;
        };
        Operations.prototype.removeAssignments = function (task) {
            var _this = this;
            if (this.app.config.resources) {
                var collection_1 = this._local.assignments();
                var waitArr_1 = [];
                return collection_1.waitData.then(function () {
                    collection_1.data.each(function (item) {
                        if (item.task == task.id)
                            waitArr_1.push(_this.removeAssignment(item.id));
                    });
                    if (waitArr_1.length)
                        return webix.promise.all(waitArr_1);
                    return webix.promise.resolve(false);
                });
            }
            return webix.promise.resolve(false);
        };
        Operations.prototype.cleanData = function (obj) {
            var res = {};
            for (var key in obj) {
                if (key.indexOf("$") !== 0)
                    res[key] = obj[key];
            }
            return res;
        };
        Operations.prototype.updateAssignedTaskDates = function (task) {
            var obj = webix.copy(task);
            this.updateTaskDuration(obj);
            var updateDates = !(webix.Date.equal(task.start_date, obj.start_date) &&
                webix.Date.equal(task.end_date, obj.end_date));
            if (updateDates)
                this.updateTask(task.id, obj, null, true);
        };
        return Operations;
    }());

    function toInteger(dirtyNumber) {
        if (dirtyNumber === null || dirtyNumber === true || dirtyNumber === false) {
            return NaN;
        }
        var number = Number(dirtyNumber);
        if (isNaN(number)) {
            return number;
        }
        return number < 0 ? Math.ceil(number) : Math.floor(number);
    }
    function requiredArgs(required, args) {
        if (args.length < required) {
            throw new TypeError(required + ' argument' + (required > 1 ? 's' : '') + ' required, but only ' + args.length + ' present');
        }
    }
    function toDate(argument) {
        requiredArgs(1, arguments);
        var argStr = Object.prototype.toString.call(argument);
        if (argument instanceof Date || typeof argument === 'object' && argStr === '[object Date]') {
            return new Date(argument.getTime());
        }
        else if (typeof argument === 'number' || argStr === '[object Number]') {
            return new Date(argument);
        }
        else {
            if ((typeof argument === 'string' || argStr === '[object String]') && typeof console !== 'undefined') {
                console.warn("Starting with v2.0.0-beta.1 date-fns doesn't accept strings as date arguments. Please use `parseISO` to parse strings. See: https://git.io/fjule");
                console.warn(new Error().stack);
            }
            return new Date(NaN);
        }
    }
    function addDays(dirtyDate, dirtyAmount) {
        requiredArgs(2, arguments);
        var date = toDate(dirtyDate);
        var amount = toInteger(dirtyAmount);
        if (isNaN(amount)) {
            return new Date(NaN);
        }
        if (!amount) {
            return date;
        }
        date.setDate(date.getDate() + amount);
        return date;
    }
    function addMonths(dirtyDate, dirtyAmount) {
        requiredArgs(2, arguments);
        var date = toDate(dirtyDate);
        var amount = toInteger(dirtyAmount);
        if (isNaN(amount)) {
            return new Date(NaN);
        }
        if (!amount) {
            return date;
        }
        var dayOfMonth = date.getDate();
        var endOfDesiredMonth = new Date(date.getTime());
        endOfDesiredMonth.setMonth(date.getMonth() + amount + 1, 0);
        var daysInMonth = endOfDesiredMonth.getDate();
        if (dayOfMonth >= daysInMonth) {
            return endOfDesiredMonth;
        }
        else {
            date.setFullYear(endOfDesiredMonth.getFullYear(), endOfDesiredMonth.getMonth(), dayOfMonth);
            return date;
        }
    }
    function addMilliseconds(dirtyDate, dirtyAmount) {
        requiredArgs(2, arguments);
        var timestamp = toDate(dirtyDate).getTime();
        var amount = toInteger(dirtyAmount);
        return new Date(timestamp + amount);
    }
    var MILLISECONDS_IN_HOUR = 3600000;
    function addHours(dirtyDate, dirtyAmount) {
        requiredArgs(2, arguments);
        var amount = toInteger(dirtyAmount);
        return addMilliseconds(dirtyDate, amount * MILLISECONDS_IN_HOUR);
    }
    function startOfWeek(dirtyDate, dirtyOptions) {
        requiredArgs(1, arguments);
        var options = dirtyOptions || {};
        var locale = options.locale;
        var localeWeekStartsOn = locale && locale.options && locale.options.weekStartsOn;
        var defaultWeekStartsOn = localeWeekStartsOn == null ? 0 : toInteger(localeWeekStartsOn);
        var weekStartsOn = options.weekStartsOn == null ? defaultWeekStartsOn : toInteger(options.weekStartsOn);
        if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
            throw new RangeError('weekStartsOn must be between 0 and 6 inclusively');
        }
        var date = toDate(dirtyDate);
        var day = date.getDay();
        var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
        date.setDate(date.getDate() - diff);
        date.setHours(0, 0, 0, 0);
        return date;
    }
    function getTimezoneOffsetInMilliseconds(date) {
        var utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()));
        utcDate.setUTCFullYear(date.getFullYear());
        return date.getTime() - utcDate.getTime();
    }
    function startOfDay(dirtyDate) {
        requiredArgs(1, arguments);
        var date = toDate(dirtyDate);
        date.setHours(0, 0, 0, 0);
        return date;
    }
    var MILLISECONDS_IN_DAY = 86400000;
    function differenceInCalendarDays(dirtyDateLeft, dirtyDateRight) {
        requiredArgs(2, arguments);
        var startOfDayLeft = startOfDay(dirtyDateLeft);
        var startOfDayRight = startOfDay(dirtyDateRight);
        var timestampLeft = startOfDayLeft.getTime() - getTimezoneOffsetInMilliseconds(startOfDayLeft);
        var timestampRight = startOfDayRight.getTime() - getTimezoneOffsetInMilliseconds(startOfDayRight);
        return Math.round((timestampLeft - timestampRight) / MILLISECONDS_IN_DAY);
    }
    var MILLISECONDS_IN_MINUTE = 60000;
    function addMinutes(dirtyDate, dirtyAmount) {
        requiredArgs(2, arguments);
        var amount = toInteger(dirtyAmount);
        return addMilliseconds(dirtyDate, amount * MILLISECONDS_IN_MINUTE);
    }
    function addQuarters(dirtyDate, dirtyAmount) {
        requiredArgs(2, arguments);
        var amount = toInteger(dirtyAmount);
        var months = amount * 3;
        return addMonths(dirtyDate, months);
    }
    function addWeeks(dirtyDate, dirtyAmount) {
        requiredArgs(2, arguments);
        var amount = toInteger(dirtyAmount);
        var days = amount * 7;
        return addDays(dirtyDate, days);
    }
    function addYears(dirtyDate, dirtyAmount) {
        requiredArgs(2, arguments);
        var amount = toInteger(dirtyAmount);
        return addMonths(dirtyDate, amount * 12);
    }
    function compareAsc(dirtyDateLeft, dirtyDateRight) {
        requiredArgs(2, arguments);
        var dateLeft = toDate(dirtyDateLeft);
        var dateRight = toDate(dirtyDateRight);
        var diff = dateLeft.getTime() - dateRight.getTime();
        if (diff < 0) {
            return -1;
        }
        else if (diff > 0) {
            return 1;
        }
        else {
            return diff;
        }
    }
    var millisecondsInMinute = 60000;
    var millisecondsInHour = 3600000;
    function differenceInCalendarMonths(dirtyDateLeft, dirtyDateRight) {
        requiredArgs(2, arguments);
        var dateLeft = toDate(dirtyDateLeft);
        var dateRight = toDate(dirtyDateRight);
        var yearDiff = dateLeft.getFullYear() - dateRight.getFullYear();
        var monthDiff = dateLeft.getMonth() - dateRight.getMonth();
        return yearDiff * 12 + monthDiff;
    }
    var MILLISECONDS_IN_WEEK = 604800000;
    function differenceInCalendarWeeks(dirtyDateLeft, dirtyDateRight, dirtyOptions) {
        requiredArgs(2, arguments);
        var startOfWeekLeft = startOfWeek(dirtyDateLeft, dirtyOptions);
        var startOfWeekRight = startOfWeek(dirtyDateRight, dirtyOptions);
        var timestampLeft = startOfWeekLeft.getTime() - getTimezoneOffsetInMilliseconds(startOfWeekLeft);
        var timestampRight = startOfWeekRight.getTime() - getTimezoneOffsetInMilliseconds(startOfWeekRight);
        return Math.round((timestampLeft - timestampRight) / MILLISECONDS_IN_WEEK);
    }
    function differenceInCalendarYears(dirtyDateLeft, dirtyDateRight) {
        requiredArgs(2, arguments);
        var dateLeft = toDate(dirtyDateLeft);
        var dateRight = toDate(dirtyDateRight);
        return dateLeft.getFullYear() - dateRight.getFullYear();
    }
    function differenceInMilliseconds(dateLeft, dateRight) {
        requiredArgs(2, arguments);
        return toDate(dateLeft).getTime() - toDate(dateRight).getTime();
    }
    var roundingMap = {
        ceil: Math.ceil,
        round: Math.round,
        floor: Math.floor,
        trunc: function (value) {
            return value < 0 ? Math.ceil(value) : Math.floor(value);
        }
    };
    var defaultRoundingMethod = 'trunc';
    function getRoundingMethod(method) {
        return method ? roundingMap[method] : roundingMap[defaultRoundingMethod];
    }
    function differenceInHours(dateLeft, dateRight, options) {
        requiredArgs(2, arguments);
        var diff = differenceInMilliseconds(dateLeft, dateRight) / millisecondsInHour;
        return getRoundingMethod(options === null || options === void 0 ? void 0 : options.roundingMethod)(diff);
    }
    function differenceInMinutes(dateLeft, dateRight, options) {
        requiredArgs(2, arguments);
        var diff = differenceInMilliseconds(dateLeft, dateRight) / millisecondsInMinute;
        return getRoundingMethod(options === null || options === void 0 ? void 0 : options.roundingMethod)(diff);
    }
    function endOfDay(dirtyDate) {
        requiredArgs(1, arguments);
        var date = toDate(dirtyDate);
        date.setHours(23, 59, 59, 999);
        return date;
    }
    function endOfMonth(dirtyDate) {
        requiredArgs(1, arguments);
        var date = toDate(dirtyDate);
        var month = date.getMonth();
        date.setFullYear(date.getFullYear(), month + 1, 0);
        date.setHours(23, 59, 59, 999);
        return date;
    }
    function isLastDayOfMonth(dirtyDate) {
        requiredArgs(1, arguments);
        var date = toDate(dirtyDate);
        return endOfDay(date).getTime() === endOfMonth(date).getTime();
    }
    function differenceInMonths(dirtyDateLeft, dirtyDateRight) {
        requiredArgs(2, arguments);
        var dateLeft = toDate(dirtyDateLeft);
        var dateRight = toDate(dirtyDateRight);
        var sign = compareAsc(dateLeft, dateRight);
        var difference = Math.abs(differenceInCalendarMonths(dateLeft, dateRight));
        var result;
        if (difference < 1) {
            result = 0;
        }
        else {
            if (dateLeft.getMonth() === 1 && dateLeft.getDate() > 27) {
                dateLeft.setDate(30);
            }
            dateLeft.setMonth(dateLeft.getMonth() - sign * difference);
            var isLastMonthNotFull = compareAsc(dateLeft, dateRight) === -sign;
            if (isLastDayOfMonth(toDate(dirtyDateLeft)) && difference === 1 && compareAsc(dirtyDateLeft, dateRight) === 1) {
                isLastMonthNotFull = false;
            }
            result = sign * (difference - Number(isLastMonthNotFull));
        }
        return result === 0 ? 0 : result;
    }
    function differenceInQuarters(dateLeft, dateRight, options) {
        requiredArgs(2, arguments);
        var diff = differenceInMonths(dateLeft, dateRight) / 3;
        return getRoundingMethod(options === null || options === void 0 ? void 0 : options.roundingMethod)(diff);
    }
    function differenceInYears(dirtyDateLeft, dirtyDateRight) {
        requiredArgs(2, arguments);
        var dateLeft = toDate(dirtyDateLeft);
        var dateRight = toDate(dirtyDateRight);
        var sign = compareAsc(dateLeft, dateRight);
        var difference = Math.abs(differenceInCalendarYears(dateLeft, dateRight));
        dateLeft.setFullYear(1584);
        dateRight.setFullYear(1584);
        var isLastYearNotFull = compareAsc(dateLeft, dateRight) === -sign;
        var result = sign * (difference - Number(isLastYearNotFull));
        return result === 0 ? 0 : result;
    }
    function getDatePart(date, copy) {
        if (copy)
            date = new Date(date.valueOf());
        var d = new Date(date.valueOf());
        d.setHours(0);
        if (d.getDate() != date.getDate()) {
            date.setHours(1);
        }
        else {
            date.setHours(0);
        }
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return date;
    }
    function getTimePart(date, copy) {
        if (copy)
            date = new Date(date.valueOf());
        return (date.valueOf() / 1000 - date.getTimezoneOffset() * 60) % 86400;
    }
    function differenceInWeeks(a, b, startOnMonday) {
        var weekStartsOn = startOnMonday ? 1 : 0;
        return differenceInCalendarWeeks(a, b, { weekStartsOn: weekStartsOn });
    }
    function getDay(date, startOnMonday) {
        var shift = date.getDay();
        if (startOnMonday) {
            if (shift === 0)
                shift = 6;
            else
                shift--;
        }
        return shift;
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
    function countDaysInMonth(date) {
        if (!date)
            return 30;
        var m = date.getMonth();
        if (m === 1) {
            var y = date.getFullYear();
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
        minute: ["minute", 1],
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
    function innerDiff(unit, next, prev, startOnMonday, precise, wt) {
        var minUnit = unit;
        if (precise) {
            var u = smallerCount[unit][0];
            if (typeof u !== "number" && typeof u !== "function")
                minUnit = u;
        }
        var start = prev;
        var end = next;
        if (wt) {
            start = getUnitStart(minUnit, start, startOnMonday);
            end = getUnitStart(minUnit, end, startOnMonday);
            if (end < next)
                end = addUnit(minUnit)(end, 1);
        }
        if (precise) {
            var filled = diff[minUnit](end, start);
            var count = smallerCount[unit][1];
            var all = 0;
            if (typeof count === "function")
                all = count(prev);
            else if (typeof count === "number")
                all = count;
            return filled / all;
        }
        else {
            return diff[minUnit](end, start, startOnMonday);
        }
    }
    function getDiff(unit) {
        return function (next, prev, startOnMonday, precise, wt) {
            if (unit === "month" && precise) {
                return getMonthDayDiff(next, prev, wt);
            }
            else {
                return innerDiff(unit, next, prev, startOnMonday, precise, wt);
            }
        };
    }
    function getMonthDayDiff(end, start, wt) {
        if (sameMonth(start, end)) {
            return innerDiff("month", end, start, null, true, wt);
        }
        var daysOfFirstMonth = 0;
        if (start.getDate() > 1) {
            var me = new Date(start.getFullYear(), start.getMonth() + 1, 1);
            daysOfFirstMonth = innerDiff("month", me, start, null, true);
            start = me;
        }
        var months = 0;
        if (!sameMonth(start, end)) {
            months = innerDiff("month", getUnitStart("month", end), start);
            start = addUnit("month")(start, months);
        }
        return daysOfFirstMonth + months + innerDiff("month", end, start, null, true);
    }
    function sameMonth(a, b) {
        return (getUnitStart("month", a).valueOf() === getUnitStart("month", b).valueOf());
    }
    function addUnit(unit) {
        return add[unit];
    }
    function getUnitStart(unit, start, startOnMonday) {
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
                t.setDate(start.getDate() - getDay(start, startOnMonday));
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
    function resetScales(start, end, precise, width, height, scales, isHoliday, startOnMonday) {
        var minUnit = getMinUnit(scales);
        var diff = getDiff(minUnit);
        var tempEnd = getUnitStart(minUnit, end, startOnMonday);
        start = getUnitStart(minUnit, start, startOnMonday);
        end = tempEnd < end ? addUnit(minUnit)(tempEnd, 1) : tempEnd;
        var fullWidth = diff(end, start, startOnMonday) * width;
        var fullHeight = height * scales.length;
        var rows = scales.map(function (line) {
            var cells = [];
            var add = addUnit(line.unit);
            var step = line.step || 1;
            var countInWeeks = minUnit === "week" && line.unit !== "week";
            var date = getUnitStart(line.unit, start, startOnMonday);
            while (date < end) {
                var next = add(date, step);
                if (date < start)
                    date = start;
                if (next > end)
                    next = end;
                var cdate = date;
                var cnext = next;
                if (countInWeeks) {
                    if (getDay(date, startOnMonday) > 3) {
                        cdate = addUnit("week")(date, 1);
                    }
                    if (getDay(next, startOnMonday) > 3) {
                        cnext = addUnit("week")(next, 1);
                    }
                }
                var cellWidth = (diff(cnext, cdate, startOnMonday) || 1) * width;
                var css = "";
                if (line.css)
                    css += typeof line.css === "function" ? line.css(date) : line.css;
                cells.push({
                    width: cellWidth,
                    css: css,
                    date: date,
                    format: line.format,
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
            startOnMonday: startOnMonday,
        };
    }
    function grid(width, height, color) {
        var canvas = document.createElement("canvas");
        canvas.setAttribute("width", width + "");
        canvas.setAttribute("height", height + "");
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
            task.$data.forEach(function (k) { return setSizes(k, i, scales, taskHeight); });
        }
        else {
            setSizes(task, i, scales, taskHeight, y);
        }
        return task;
    }
    function setSizes(task, i, scales, taskHeight, y) {
        var start = scales.start, end = scales.end, cellWidth = scales.cellWidth, cellHeight = scales.cellHeight, diff = scales.diff, minUnit = scales.minUnit, precise = scales.precise;
        var startDate = task.start_date < start ? start : task.start_date;
        var endDate = task.end_date > end ? end : task.end_date;
        var astart = getUnitStart(minUnit, start, scales.startOnMonday);
        var ms = task.type == "milestone";
        task.$h = taskHeight;
        task.$x =
            Math.round(diff(startDate, astart, scales.startOnMonday, precise) * cellWidth) - (ms ? task.$h / 2 : 0);
        task.$w = ms
            ? task.$h
            : Math.round(diff(endDate, startDate, scales.startOnMonday, precise, true) *
                cellWidth);
        task.$y =
            typeof y === "undefined"
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
        for (var w = 0, d = 0; w < task.duration;) {
            if (!scales.isHoliday(date)) {
                ++w;
                d = 0;
            }
            else {
                if (++d === 30)
                    holidayGuard();
            }
            date = addUnit("day")(date, 1);
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
            date = addUnit("day")(date, 1);
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
            left = addUnit("day")(left, -1);
            right = addUnit("day")(right, 1);
            d++;
        }
        if (d === 30)
            holidayGuard();
        return !notRight ? right : left;
    }
    function holidayGuard() {
        alert("No work days found within 30 days, check your isHoliday function!");
        throw "Wrong isHoliday function";
    }
    function toWorkday(date, end, scales, dir) {
        var d = 0;
        while (d < 30 && scales.isHoliday(getCheckDate(date, end))) {
            date = addUnit("day")(date, dir);
            d++;
        }
        if (d === 30)
            holidayGuard();
        return date;
    }
    function getCheckDate(date, end) {
        return end && !getTimePart(date) ? addUnit("day")(date, -1) : date;
    }
    var delta = 20;
    function updateLink(link, startTask, endTask, height) {
        var dy = Math.round(height / 2);
        if (!startTask || !endTask) {
            link.$p = "";
            return link;
        }
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
        var sx = s_start ? startTask.$x : startTask.$x + startTask.$w;
        var sy = startTask.$y;
        var ex = e_start ? endTask.$x : endTask.$x + endTask.$w;
        var ey = endTask.$y;
        if (differentX(startTask, endTask, sx, ex, height) || sy !== ey) {
            var lineCoords = getLineCoords(sx, sy + dy, ex, ey + dy, s_start, e_start, 38 / 2);
            var arrowCoords = getArrowCoords(ex, ey + dy, e_start);
            link.$p = lineCoords + "," + arrowCoords;
        }
        else {
            link.$p = "";
        }
        return link;
    }
    function differentX(startTask, endTask, sx, ex, height) {
        if (startTask.type === "milestone" || endTask.type === "milestone")
            return Math.abs(sx - ex) > height / 2;
        return sx !== ex;
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
        if (!same && ((ex1 <= sx + delta - 2 && e_start) || (ex1 > sx && !e_start))) {
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

    var Helpers = (function () {
        function Helpers(app) {
            this.app = app;
            this.defaultResourceUnit = "hour";
            this.defaultResourceValues = {
                hour: 8,
            };
            this.resourceValueRanges = {
                hour: [0.5, 24],
            };
            this.resourceValueSteps = {
                hour: 0.5,
            };
            this.unitLoadNorm = {
                day: 8,
                week: 40,
                month: 170,
                quarter: 510,
                year: 2040,
            };
        }
        Helpers.prototype.initials = function (name) {
            var initials = name.match(/\b\w/g) || [];
            if (initials.length == 1)
                return name.charAt(0).toUpperCase() + name.charAt(1);
            return ((initials.shift() || "") + (initials.pop() || "")).toUpperCase();
        };
        Helpers.prototype.avatarCss = function (name) {
            return (" webix_gantt_person_avatar_" +
                ((name.charCodeAt(1) + (name.length % 10)) % 10));
        };
        Helpers.prototype.resourceAvatar = function (resource, cssClass, withTooltip) {
            var css = "webix_gantt_person_avatar";
            if (typeof cssClass == "string")
                css += " " + cssClass;
            if (resource.avatar)
                return "<img class=\"" + css + "\" src=\"" + resource.avatar + "\" webix_tooltip=\"" + (withTooltip ? resource.name : "") + "\"/>";
            var txt = resource.name;
            return "<div class='" + css + " " + (txt ? this.avatarCss(txt) : "") + "' webix_tooltip=\"" + (withTooltip ? resource.name : "") + "\">" + (txt ? this.initials(txt) : "") + "</div>";
        };
        Helpers.prototype.getDefaultResourceValue = function (obj) {
            var unit = this.getResourceUnit(obj);
            return this.defaultResourceValues[unit];
        };
        Helpers.prototype.getResourceUnit = function (obj) {
            return obj.unit || this.defaultResourceUnit;
        };
        Helpers.prototype.getResourceValueRange = function (obj) {
            var unit = this.getResourceUnit(obj);
            return this.resourceValueRanges[unit] || [1, 100];
        };
        Helpers.prototype.getResourceValueStep = function (obj) {
            var unit = this.getResourceUnit(obj);
            return this.resourceValueSteps[unit] || null;
        };
        Helpers.prototype.isResourceHoliday = function (date, cal) {
            var result = false;
            if (cal.holidays)
                result = cal.holidays.find(function (d) { return d.getTime() == date.getTime(); });
            if (cal.weekDays)
                result = result || cal.weekDays.indexOf(date.getDay()) == -1;
            return result;
        };
        Helpers.prototype.addUnit = function (unit, date, inc) {
            return addUnit(unit)(date, inc);
        };
        Helpers.prototype.getDifference = function (unit, next, prev) {
            return getDiff(unit)(next, prev, webix.Date.startOnMonday);
        };
        Helpers.prototype.getUnitStart = function (unit, date) {
            return getUnitStart(unit, date, webix.Date.startOnMonday);
        };
        Helpers.prototype.updateTask = function (task, index) {
            var local = this.app.getService("local");
            return updateTask(task, index, local.getScales(), local.getTaskHeight());
        };
        Helpers.prototype.setScales = function (start, end, precise, width, height, scales) {
            return resetScales(start, end, precise, width, height, scales, this.app.config.isHoliday, webix.Date.startOnMonday);
        };
        Helpers.prototype.updateLink = function (link, start, end) {
            var local = this.app.getService("local");
            return updateLink(link, start, end, local.getTaskHeight());
        };
        Helpers.prototype.updateTaskDuration = function (task, scales, mode, dir) {
            return updateTaskDuration(task, scales, mode, dir);
        };
        Helpers.prototype.getSmallerUnit = function (unit) {
            return smallerCount[unit][0];
        };
        Helpers.prototype.getSmallerCount = function (unit) {
            return smallerCount[unit][1];
        };
        Helpers.prototype.newLink = function (box, start, end) {
            return newLink(box, start, end);
        };
        Helpers.prototype.drawGridInner = function (width, height, color) {
            return grid(width, height, color);
        };
        return Helpers;
    }());

    var Grouping = (function () {
        function Grouping(app) {
            this.app = app;
            this.local = app.getService("local");
            this.helpers = app.getService("helpers");
            this.closedResources = null;
        }
        Grouping.prototype.getTreeData = function (data, id) {
            var _this = this;
            var tree = data.filter(function (a) { return a.parent == id; });
            tree.forEach(function (a) {
                var temp = _this.getTreeData(data, a.id);
                if (temp)
                    a.data = temp;
            });
            return tree;
        };
        Grouping.prototype.getRDCollection = function (force) {
            var _this = this;
            if (this._rdCollection && !force)
                return this._rdCollection;
            var tasks = this.local.tasks();
            var assignments = this.local.assignments();
            var resources = this.local.resources();
            if (!this._rdCollection) {
                this._rdCollection = new webix.TreeCollection({});
                webix.extend(this._rdCollection, webix.Group);
                this.syncRDWithData();
            }
            else {
                this._rdCollection.clearAll();
            }
            webix.promise
                .all([tasks.waitData, assignments.waitData, resources.waitData])
                .then(function () {
                var data = [];
                var scales = _this.local.getScales();
                assignments.data.each(function (obj) {
                    var res = _this.getDiagramItemData(obj, scales);
                    if (res)
                        data.push(res);
                });
                _this._rdCollection.parse(data);
                _this.groupResourceDiagram();
            });
            return this._rdCollection;
        };
        Grouping.prototype.syncRDWithData = function () {
            var _this = this;
            this.app.on("onScalesUpdate", function (v, o) {
                if (_this._rdCollection && _this._rdCollection.data.order.length) {
                    _this.refreshTaskDiagram();
                    if (v.minUnit !== o.minUnit) {
                        _this.updateUnitDurations();
                        _this.groupResourceDiagram();
                    }
                }
            });
            var tasks = this.local.tasks();
            tasks.data.attachEvent("onStoreUpdated", function (id, obj, mode) {
                if (mode &&
                    obj &&
                    (mode == "update" ||
                        mode == "delete" ||
                        _this.local.assignments().find(function (a) { return a.task === obj.id; }, true))) {
                    _this.updateTaskDiagram(obj, mode);
                    _this.groupResourceDiagram();
                }
            });
            var assignments = this.local.assignments();
            assignments.data.attachEvent("onStoreUpdated", function (id, obj, mode) {
                if (id) {
                    _this.refreshResourceDiagram(id, obj, mode);
                    _this.groupResourceDiagram();
                }
            });
        };
        Grouping.prototype.updateUnitDurations = function () {
            var _this = this;
            var tasks = this.local.tasks();
            var assignments = this.local.assignments();
            var scales = this.local.getScales();
            this._rdCollection.data.each(function (obj) {
                if (obj.task) {
                    var task = tasks.getItem(obj.task);
                    var assignment = assignments.getItem(obj.id);
                    if (task && assignment) {
                        obj.duration = _this.calculateUnitDuration(task, scales);
                        obj.value = _this.calculateLoad(__assign(__assign({}, task), assignment), scales.minUnit);
                    }
                }
            });
        };
        Grouping.prototype.calculateUnitDuration = function (task, scales) {
            return scales.minUnit === "day"
                ? task.duration
                : scales.diff(task.end_date, task.start_date, webix.Date.startOnMonday, false, true);
        };
        Grouping.prototype.getDiagramItemData = function (obj, scales) {
            var task = this.local.tasks().getItem(obj.task);
            if (task) {
                if (!this.local._isTaskVisible(task, true)) {
                    this.helpers.updateTask(task, 0);
                }
                var resource = this.local.resources().getItem(obj.resource);
                var res = __assign(__assign(__assign({}, task), resource), obj);
                res.duration = this.calculateUnitDuration(task, scales);
                res.value = this.calculateLoad(res, scales.minUnit);
                res.$x = this.truncateX(res.$x, scales);
                return res;
            }
            return null;
        };
        Grouping.prototype.calculateLoad = function (data, unit) {
            var num = this.getUnitLoad(data);
            if (unit === "hour")
                return [0, 0, num / 24];
            if (unit === "day")
                return [0, 0, num];
            var load = [];
            var start = webix.Date.copy(data.start_date);
            var startUnitStart = this.helpers.getUnitStart(unit, start);
            var end = webix.Date.copy(data.end_date);
            var endUnitStart = this.helpers.getUnitStart(unit, end);
            var startUnitEnd;
            if (webix.Date.datePart(start, true) > startUnitStart) {
                startUnitEnd = this.helpers.addUnit(unit, startUnitStart, 1);
                if (end > startUnitEnd) {
                    var days_1 = this.findUnitDuration(start, startUnitEnd, data);
                    load.push(days_1);
                    start = startUnitEnd;
                }
                else
                    load.push(0);
            }
            else
                load.push(0);
            if (!webix.Date.equal(startUnitStart, endUnitStart) &&
                webix.Date.datePart(end, true) >= endUnitStart) {
                var days_2 = this.findUnitDuration(endUnitStart, end, data);
                load.push(days_2);
                end = endUnitStart;
            }
            else
                load.push(0);
            var plusUnit = this.helpers.addUnit(unit, start, 1);
            var days = this.findUnitDuration(start, new Date(Math.min(plusUnit, end)), data);
            load.push(days);
            return load.map(function (l) { return l * num; });
        };
        Grouping.prototype.findUnitDuration = function (start, end, data) {
            var days = this.helpers.getDifference("day", end, start);
            if (this.app.config.excludeHolidays) {
                var i = void 0, d = webix.Date.copy(start), n = days;
                for (i = 0; i < n; i++) {
                    if (this.checkHoliday(d, data))
                        days--;
                    webix.Date.add(d, 1, "day");
                }
            }
            return days;
        };
        Grouping.prototype.checkHoliday = function (d, data) {
            if (this.app.config.resourceCalendars) {
                var calendarId = this.local.resources().getItem(data.resource)
                    .calendar_id;
                if (calendarId) {
                    var calendar = this.local.calendars().getItem(calendarId);
                    return this.helpers.isResourceHoliday(d, calendar);
                }
            }
            return this.app.config.isHoliday(d);
        };
        Grouping.prototype.getUnitLoad = function (data) {
            return data.value;
        };
        Grouping.prototype.truncateX = function (x, scales) {
            if (scales.precise !== false) {
                return Math.floor(x / scales.cellWidth) * scales.cellWidth;
            }
            return x;
        };
        Grouping.prototype.refreshResourceDiagram = function (id, obj, mode) {
            var data = this._rdCollection;
            var scales = this.local.getScales();
            switch (mode) {
                case "update":
                    if (data.exists(id)) {
                        var task = this.local.tasks().getItem(obj.task);
                        var resource = __assign({}, this.local.resources().getItem(obj.resource));
                        delete resource.id;
                        var value = this.calculateLoad(__assign(__assign({}, task), obj), scales.minUnit);
                        data.updateItem(id, __assign(__assign(__assign({}, obj), resource), { value: value }));
                    }
                    break;
                case "add":
                    data.add(this.getDiagramItemData(obj, scales));
                    break;
                case "delete":
                    if (data.exists(id))
                        data.remove(id);
                    break;
            }
        };
        Grouping.prototype.updateTaskDiagram = function (task, mode) {
            var _this = this;
            var data = this._rdCollection;
            var scales = this.local.getScales();
            if (mode === "delete") {
                this.pruneDiagram();
            }
            else if (mode === "add") {
                var rec = this.local.assignments().find(function (a) { return a.task === task.id; }, true);
                data.add(this.getDiagramItemData(rec, scales));
            }
            else if (mode === "update") {
                var assignments = data.find(function (a) { return a.task === task.id; });
                assignments.forEach(function (a) {
                    var oa = _this.local.assignments().getItem(a.id);
                    data.updateItem(a.id, {
                        start_date: task.start_date,
                        id: a.id,
                        duration: _this.calculateUnitDuration(task, scales),
                        $x: _this.truncateX(task.$x, scales),
                        value: _this.calculateLoad(__assign(__assign({}, task), oa), scales.minUnit),
                    });
                });
            }
        };
        Grouping.prototype.pruneDiagram = function () {
            var tasks = this.local.tasks();
            var toRemove = [];
            this._rdCollection.data.eachLeaf(0, function (d) {
                if (!tasks.exists(d.task))
                    toRemove.push(d.id);
            });
            if (toRemove.length)
                this._rdCollection.remove(toRemove);
        };
        Grouping.prototype.refreshTaskDiagram = function () {
            var _this = this;
            var scales = this.local.getScales();
            this._rdCollection.data.each(function (a) {
                var task = _this.local.tasks().getItem(a.task);
                if (task)
                    a.$x = _this.truncateX(task.$x, scales);
            });
        };
        Grouping.prototype.groupResourceDiagram = function () {
            var collection = this._rdCollection;
            collection.group({
                by: function (obj) { return obj.name + "-" + obj.category; },
                map: {
                    resource_id: ["resource"],
                    value: ["name"],
                    name: ["name"],
                    category: ["category"],
                    avatar: ["avatar"],
                    load: ["value", calculateLoad],
                    duration: ["duration", collect],
                    units: ["value", collect],
                    $x: ["$x", collect],
                    count: ["value", "count"],
                    start_date: ["start_date", collect],
                },
            });
            collection.group({
                by: "category",
                map: {
                    value: ["category"],
                    name: ["category"],
                    duration: ["duration", "sum"],
                    load: ["load", "sum"],
                    count: ["count", "sum"],
                },
            }, 0);
        };
        Grouping.prototype.getResourceTree = function () {
            var _this = this;
            if (this._resourcesTree)
                return this._resourcesTree;
            this._resourcesTree = new webix.TreeCollection({
                on: {
                    "data->onStoreUpdated": function (id, obj, mode) {
                        id = mode == "update" || mode == "paint" ? id : null;
                        _this.refreshResourceTasks(id);
                        _this.local.refreshLinks();
                    },
                },
                scheme: {
                    $sort: {
                        by: "start_date",
                        dir: "asc",
                        as: "int",
                    },
                },
            });
            this._resourcesTree.parse(this.resourceTaskLoader().finally(function () {
                _this.syncResourceTree();
            }));
            return this._resourcesTree;
        };
        Grouping.prototype.tasksWithResources = function () {
            var _this = this;
            return webix.promise
                .all([this.local.tasks().waitData, this.local.assignments().waitData])
                .then(function () {
                var data = [];
                _this.local.tasks().data.each(function (t) {
                    if (t.type == "task" || !t.type) {
                        var task_1 = Object.assign({}, t);
                        var result = _this.local
                            .assignments()
                            .data.find(function (a) { return a.task == task_1.id; });
                        task_1.resources = result.length
                            ? result.map(function (item) { return item.resource; })
                            : null;
                        data.push(task_1);
                    }
                }, "", true);
                return data;
            });
        };
        Grouping.prototype.resourceTaskLoader = function () {
            var _this = this;
            var Ops = this.app.getService("operations");
            return webix.promise
                .all([this.tasksWithResources(), this.local.resources().waitData])
                .then(function (d) {
                var data = _this.getResourceTaskData(d[0]);
                data.forEach(function (r) {
                    Ops.setProjectData(r, null, r.data);
                });
                return data;
            });
        };
        Grouping.prototype.refreshResourceTree = function () {
            var _this = this;
            if (this._resourcesTree.count()) {
                this.closedResources = [];
                this._resourcesTree.data.eachChild("0", function (item) {
                    if (!item.open)
                        _this.closedResources.push(item.resources);
                });
            }
            else
                this.closedResources = null;
            this.resourceTaskLoader().then(function (data) {
                _this._resourcesTree.clearAll();
                _this._resourcesTree.parse(data);
                return data;
            });
        };
        Grouping.prototype.syncResourceTree = function () {
            var _this = this;
            var tree = this._resourcesTree;
            this.local.tasks().data.attachEvent("onStoreUpdated", function (id, obj, mode) {
                if (mode == "update") {
                    var inTree = tree.exists(id) && tree.getItem(id).type == "task";
                    var becomesTask = obj.type == "task";
                    if (inTree && becomesTask) {
                        tree.updateItem(id, {
                            text: obj.text,
                            details: obj.details,
                            start_date: obj.start_date,
                            end_date: obj.end_date,
                            duration: obj.duration,
                            progress: obj.progress,
                        });
                        var pId = tree.getParentId(id);
                        var item = tree.getItem(pId);
                        if (item) {
                            item = _this.app.getService("operations").setProjectData(item, tree);
                            tree.updateItem(pId, item);
                        }
                        return true;
                    }
                    else if (inTree ^ becomesTask) {
                        _this.refreshResourceTree();
                    }
                }
                else {
                    _this.refreshResourceTree();
                }
            });
            this.local.assignments().data.attachEvent("onStoreUpdated", function () {
                _this.refreshResourceTree();
            });
        };
        Grouping.prototype.getResourceTaskData = function (tasks) {
            var _this = this;
            var data = [];
            var unassignedBranch = null;
            var Ops = this.app.getService("operations");
            tasks.forEach(function (t) {
                var resources = t.resources;
                var item;
                if (!resources)
                    item = unassignedBranch ? unassignedBranch : null;
                else
                    item = data.find(function (item) { return arrayEquals(item.resources, resources); });
                if (!item) {
                    item = {
                        id: resources ? webix.uid() : "unassigned",
                        type: "project",
                        text: "",
                        data: [],
                        $group: true,
                        open: _this.checkResourceOpen(resources),
                    };
                    item.resources = resources;
                    if (resources)
                        item.text = resources
                            .map(function (id) { return _this.local.resources().getItem(id); })
                            .sort(Ops.sortResources)
                            .map(function (item) { return item.name; })
                            .join(", ");
                    if (resources)
                        data.push(item);
                    else {
                        item.id = "unassigned";
                        unassignedBranch = item;
                    }
                }
                item.data.push(webix.copy(t));
            });
            if (unassignedBranch)
                data.push(unassignedBranch);
            return data;
        };
        Grouping.prototype.refreshResourceTasks = function (updID, i) {
            var _this = this;
            var tree = this._resourcesTree;
            if (!updID) {
                tree.data.order.forEach(function (id, i) {
                    _this.refreshResourceTasks(id, i);
                });
            }
            else {
                var t = tree.getItem(updID);
                i = !webix.isUndefined(i) ? i : tree.getIndexById(updID);
                this.helpers.updateTask(t, i);
            }
        };
        Grouping.prototype.checkResourceOpen = function (resources) {
            if (!this.closedResources)
                return true;
            if (!resources)
                return this.closedResources.indexOf(null) == -1;
            return this.closedResources.find(function (arr) { return arrayEquals(arr, resources); })
                ? false
                : true;
        };
        return Grouping;
    }());
    function collect(property, data) {
        var ws = [];
        for (var i = 0; i < data.length; i++) {
            ws.push(property(data[i]));
        }
        return ws;
    }
    function calculateLoad(property, data) {
        var sum = 0;
        for (var i = 0; i < data.length; i++) {
            var units = property(data[i]);
            var duration = parseInt(data[i].duration);
            var last = units.length - 1;
            for (var j = 0; j < units.length; ++j) {
                var num = units[j];
                if (num) {
                    sum += (j === last ? duration : 1) * num;
                    duration--;
                }
            }
        }
        return sum;
    }

    var App = (function (_super) {
        __extends(App, _super);
        function App(config) {
            var _this = this;
            var state = createState({
                top: 0,
                left: 0,
                selected: null,
                edit: null,
                readonly: config.readonly || false,
                sort: null,
                display: config.resources && config.display == "resources"
                    ? "resources"
                    : "tasks",
                criticalPath: config.criticalPath || false,
                resourcesDiagram: !!(config.resources && config.resourcesDiagram),
                treeWidth: config.treeWidth || (config.resources ? 400 : 500),
                baseline: config.baseline || false,
            });
            var isHoliday = config.isHoliday ||
                function (date) {
                    var d = date.getDay();
                    return d === 0 || d === 6;
                };
            var defaults = {
                router: EmptyRouter,
                version: "10.1.0",
                debug: true,
                start: "/top",
                compactWidth: 650,
                markers: [{ css: "webix_gantt_today_marker", now: true }],
                params: { state: state, forceCompact: config.compact },
                links: true,
                isHoliday: isHoliday,
            };
            _this = _super.call(this, __assign(__assign({}, defaults), config)) || this;
            var dynamic = function (obj) {
                return _this.config.override ? _this.config.override.get(obj) || obj : obj;
            };
            _this.setService("helpers", new (dynamic(Helpers))(_this, config));
            _this.setService("local", new (dynamic(Local))(_this, config));
            _this.setService("backend", new (dynamic(Backend))(_this, config.url));
            _this.setService("operations", new (dynamic(Operations))(_this));
            _this.setService("grouping", new (dynamic(Grouping))(_this));
            initJetWin(_this);
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
        name: "gantt",
        app: App,
        getState: function () {
            return this.$app.getState();
        },
        getService: function (name) {
            return this.$app.getService(name);
        },
        $init: function () {
            var _this = this;
            var state = this.$app.getState();
            for (var key in state) {
                link(state, this.config, key);
            }
            this.$app.attachEvent("bars:beforedrag", function (item, ctx) {
                return _this.callEvent("onBeforeDrag", [item, ctx]);
            });
            this.$app.attachEvent("bars:beforedrop", function (item, ctx) {
                return _this.callEvent("onBeforeDrop", [item, ctx]);
            });
        },
        $exportView: function (options) {
            if (options.export_mode === "png" ||
                (options.export_mode === "pdf" && options.display === "image"))
                return this.$app.getRoot();
            return this.$app.getService("local").tasks();
        },
        clearAll: function () {
            this.$app.getService("local").clearAll();
        },
        reload: function () {
            this.$app.getService("local").reload();
        },
    }, webix.ui.jetapp);
    var services = { Local: Local, Backend: Backend, Operations: Operations, Helpers: Helpers, Grouping: Grouping };
    var locales = { en: en };

    exports.App = App;
    exports.locales = locales;
    exports.services = services;
    exports.views = views;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
