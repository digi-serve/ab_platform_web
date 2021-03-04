/*
@license
Webix Gantt v.8.1.1
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
        return (Math.ceil(Math.abs(diff) - (a.getDay() <= b.getDay() ? 0 : 1)) *
            Math.sign(diff));
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
            cb = f_cache[format] = webix.Date.dateToStr(format);
        }
        return cb;
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
                t.setDate(start.getDate() - start.getDay());
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
    function resetScales(start, end, precise, width, height, scales) {
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
                    if (date.getDay() > 3) {
                        cdate = webix.Date.add(date, 1, "week", true);
                    }
                    if (next.getDay() > 3) {
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
                return DragScroll.autoScrollTo.call(this, scroll.x + sense, scroll.y, "x");
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

    function updateTask(t, i, scales, taskHeight) {
        var start = scales.start, end = scales.end, cellWidth = scales.cellWidth, cellHeight = scales.cellHeight, diff = scales.diff, minUnit = scales.minUnit, precise = scales.precise;
        var startDate = t.start_date < start ? start : t.start_date;
        var endDate = t.end_date > end ? end : t.end_date;
        var ms = t.type == "milestone";
        var astart = getUnitStart(minUnit, start);
        t.$h = taskHeight;
        t.$x =
            Math.round(diff(startDate, astart, precise) * cellWidth) -
                (ms ? t.$h / 2 : 0);
        t.$w = ms
            ? t.$h
            : Math.round(diff(endDate, startDate, precise, true) * cellWidth);
        t.$y = cellHeight * i + (cellHeight - taskHeight) / 2;
        return t;
    }
    function updateTaskDuration(t) {
        if (t.start_date &&
            t.end_date &&
            t.start_date.valueOf() >= t.end_date.valueOf()) {
            t.end_date = null;
            t.duration = 1;
        }
        if (t.type == "milestone") {
            t.end_date = t.start_date;
            t.duration = 0;
        }
        else {
            if (!t.duration) {
                var d = getDiff("day")(t.end_date, t.start_date, true);
                t.duration = d > 1 ? Math.floor(d) : parseFloat(d.toFixed(2));
            }
            if (!t.end_date) {
                if (t.duration < 1)
                    t.end_date = addUnit("hour")(t.start_date, Math.floor(24 * t.duration));
                else
                    t.end_date = addUnit("day")(t.start_date, t.duration);
            }
        }
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
        sy = s_start ? startTask.$y : startTask.$y;
        ex = e_start ? endTask.$x : endTask.$x + endTask.$w;
        ey = e_start ? endTask.$y : endTask.$y;
        if (sx !== ex || sy !== ey) {
            var lineCoords = getLineCoords(sx, sy + dy, ex, ey + dy, s_start, e_start, 38 / 2);
            var arrowCoords = getArrowCoords(ex, ey + dy, e_start);
            link.$p = lineCoords + "," + arrowCoords;
        }
        return link;
    };
    function getLineCoords(sx, sy, ex, ey, s_start, e_start, gapp) {
        var shift = delta * (s_start ? -1 : 1);
        var backshift = delta * (e_start ? -1 : 1);
        var sx1 = sx + shift;
        var ex1 = ex + backshift;
        var line = [sx, sy, sx1, sy, 0, 0, 0, 0, ex1, ey, ex, ey];
        var dx = ex1 - sx1;
        var dy = ey - sy;
        var same = e_start === s_start;
        if (!same) {
            if ((ex1 <= sx && e_start) || (ex1 > sx && !e_start)) {
                dy -= gapp;
            }
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
        $dragCreate: function (t, e) {
            if (this.master.State.readonly)
                return false;
            var id = this.locateEvent(e);
            if (id) {
                var ctx = this.getContext();
                var target = e.target;
                if (target.classList.contains("webix_gantt_link")) {
                    ctx.mode = "links";
                    return Modes[ctx.mode].$dragCreate.call(this, t, e, id);
                }
                var node = this.view.getItemNode(id);
                if (!webix.env.touch && isProgressDrag(target, node)) {
                    ctx.mode = "progress";
                    return Modes[ctx.mode].$dragCreate.call(this, t, e, id);
                }
                var scroll_1 = this.view.getScrollState();
                var evContext = this.getEventContext(e);
                var mode = getMoveMode(node, evContext.x);
                if (this.view.getItem(id).type != "task" &&
                    (mode == "start" || mode == "end"))
                    mode = "move";
                var scales = this.Local.getScales();
                var step = scales.cellWidth;
                if (scales.precise) {
                    var nsc = smallerCount[scales.minUnit][1];
                    step = Math.round(step / (typeof nsc === "number" ? nsc : nsc()));
                }
                webix.extend(ctx, {
                    id: id,
                    mode: mode,
                    node: node,
                    step: step,
                    dx: 0,
                    from: this.view,
                    x: evContext.x,
                    scroll: scroll_1,
                    t: parseInt(node.style.top),
                    l: parseInt(node.style.left),
                    w: parseInt(node.style.width),
                }, true);
                if (Modes[ctx.mode].dragScroll)
                    webix.extend(ctx, updateDragScrollConfig.call(this, Modes[ctx.mode].dragScroll));
                var html = node.cloneNode(true);
                html.className += " webix_drag_zone webix_gantt_mode_" + mode;
                node.style.visibility = "hidden";
                webix.html.addCss(t, "webix_gantt_in_action", true);
                t.style.cursor = mode == "move" ? "move" : "ew-resize";
                t.querySelector(".webix_scroll_cont").appendChild(html);
                return html;
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
            ctx["$waitUpdate"] = this.master.Action({
                action: "update-task-time",
                mode: mode,
                time: time,
                id: id,
            });
        },
        locateEvent: function (ev, context) {
            if (webix.env.touch && context) {
                ev = document.elementFromPoint(context.x, context.y);
            }
            return webix.html.locate(ev, "webix_l_id");
        },
        getEventContext: function (e) {
            if (webix.env.touch) {
                if (e.changedTouches && !(e.touches && e.touches[0])) {
                    var t = e.changedTouches[0];
                    return { x: t.pageX, y: t.pageY };
                }
                return e.time ? e : webix.env.mouse.context(e);
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
            var evContext = this.getEventContext(e);
            var id = this.locateEvent(e, evContext);
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
            var evContext = this.getEventContext(e);
            var id = this.locateEvent(e, evContext);
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
            var evContext = this.getEventContext(e);
            var target = this.locateEvent(e, evContext);
            if (!target || source == target)
                return false;
            var node = this.view.getItemNode(target);
            var rect = node.getBoundingClientRect();
            var toStart = evContext.x - rect.left < rect.width / 2;
            var type = (ctx.fromStart ? 1 : 0) + (toStart ? 0 : 2);
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
        },
    };
    var progress = {
        $dragCreate: function (t, e, id) {
            var ctx = this.getContext();
            var node = this.view.getItemNode(id);
            var prevProgress = this.view.getItem(id).progress;
            var progressNode = node.querySelector(".webix_gantt_progress");
            var evContext = this.getEventContext(e);
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
            t.style.cursor = "ew-resize";
            webix.html.addCss(t, "webix_gantt_in_action", true);
            webix.html.addCss(node, "webix_gantt_mode_progress", true);
            var html = webix.html.create("div", { visibility: "hidden" });
            document.body.appendChild(html);
            return html;
        },
        $dragPos: function (pos) {
            var ctx = this.getContext();
            var x = ctx.x, scroll = ctx.scroll, w = ctx.w;
            var nscroll = this.view.getScrollState();
            var dx = pos.x - x - scroll.x + nscroll.x;
            var progress = Math.min(Math.max(ctx.prevProgress + Math.round((dx * 100) / w), 0), 100);
            if (ctx.progress != progress) {
                ctx.progress = progress;
                Modes[ctx.mode].updateTaskTemplate.call(this, ctx, progress);
            }
        },
        $drop: function () {
            var ctx = this.getContext();
            var id = ctx.id, progress = ctx.progress, prevProgress = ctx.prevProgress;
            if (!webix.isUndefined(progress) && progress != prevProgress)
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
    var Modes = {
        links: links,
        move: move,
        progress: progress,
        start: resize,
        end: resize,
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
                css: this.State.readonly ? " webix_gantt_readonly" : "",
                borderless: true,
                cells: [
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
                            onItemClick: function (id) {
                                _this.State.$batch({
                                    parent: null,
                                    selected: id,
                                });
                            },
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
            var _a = view.getChildViews(), links = _a[0], bars = _a[1];
            this.Links = links;
            this.Bars = bars;
            var local = (this.Local = this.app.getService("local"));
            var scales = local.getScales();
            var tdata = (this.TasksData = local.tasks());
            var ldata = (this.LinksData = local.links().data);
            bars.sync(tdata);
            this.RefreshLinks(ldata);
            this.HandleScroll();
            this.HandleDrag(scales);
            this.HandleSelection(scales);
            this.InitMarkers();
            this.HandleHolidays(scales);
            this.on(ldata, "onStoreUpdated", function () { return _this.RefreshLinks(ldata); });
            this.on(this.app, "onScalesUpdate", function (scales) { return _this.Resize(scales.width); });
            this.on(tdata.data, "onStoreUpdated", function (id, data, action) {
                _this.RefreshLinks(ldata);
                if (action !== "update")
                    _this.SetSelection();
            });
            view.$view.style.backgroundImage = "url(" + grid(scales.cellWidth, scales.cellHeight, webix.skin.$name == "contrast" ? "#808080" : "#ccc") + ")";
            view.$view.style.marginTop = "0px";
            this.Resize(scales.width);
        };
        BarsView.prototype.BarsTemplate = function (obj, _) {
            var text = obj.text || _("(no title)");
            return obj.type == "milestone" ? "<span>" + text + "</span>" : text;
        };
        BarsView.prototype.BarsType = function (_) {
            var _this = this;
            return {
                template: function (obj) { return _this.BarsTemplate(obj, _); },
                templateStart: function (task) {
                    var ms = task.type == "milestone";
                    var w = task.$w, h = task.$h, diff = 0, progress = "";
                    if (ms) {
                        w = h = Math.ceil(Math.sqrt(Math.pow(task.$w, 2) / 2));
                        diff = Math.ceil((task.$w - w) / 2);
                    }
                    else {
                        var drag = task.type == "task" ? _this.DragProgressTemplate(task.progress) : "";
                        progress = "<div class=\"webix_gantt_progress\" style=\"width:" + task.progress + "%;\">" + drag + "</div>";
                    }
                    return "<div webix_l_id=\"" + task.id + "\" \n\t\t\t\t\tclass=\"webix_gantt_task_base webix_gantt_" + task.type + "\" \n\t\t\t\t\tstyle=\"left:" + (task.$x + diff) + "px;top:" + (task.$y +
                        diff) + "px;width:" + w + "px;height:" + h + "px;\" \n\t\t\t\t\tdata-id=\"" + task.id + "\">\n\t\t\t\t\t\t<div class=\"webix_gantt_link webix_gantt_link_left\"></div>\n\t\t\t\t\t\t" + progress + "\n\t\t\t\t\t\t<div class=\"webix_gantt_content\">";
                },
                templateEnd: function () {
                    return "</div><div class=\"webix_gantt_link webix_gantt_link_right\"></div></div>";
                },
            };
        };
        BarsView.prototype.DragProgressTemplate = function (progress) {
            return "<div class=\"webix_gantt_progress_drag\" style=\"left:" + progress + "%\">\n\t\t\t<span class=\"webix_gantt_progress_percent\">" + progress + "</span>\n\t\t</div>";
        };
        BarsView.prototype.HandleDrag = function () {
            var _this = this;
            initDnD.call(this, this.Bars);
            if (!webix.env.touch)
                this._mousemove_handler = webix.event(this.Bars.$view, "mousemove", function (e) {
                    return switchCursor(e, _this.Bars);
                });
        };
        BarsView.prototype.destroy = function () {
            this._mousemove_handler = webix.eventRemove(this._mousemove_handler);
            this._scroll_handler = webix.eventRemove(this._scroll_handler);
            if (this.Markers && this.Markers.length)
                for (var i = 0; i < this.Markers.length; i++) {
                    var m = this.Markers[i];
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
                _this.holidaysContainer.style.height = bars.scrollHeight + "px";
                if (_this.containerForMarkers)
                    _this.containerForMarkers.style.height = bars.scrollHeight + "px";
                _this.getRoot().$view.style.backgroundPosition = "-" + left + "px -" + top + "px";
                _this.State.$batch({ top: top, left: left });
            });
            this.on(this.State.$changes, "top", function (y) {
                _this.Bars.scrollTo(_this.State.left, y);
            });
        };
        BarsView.prototype.HandleSelection = function (scales) {
            var _this = this;
            this.selLine = webix.html.create("DIV", {
                class: "webix_gantt_bar_selection",
                style: "height:" + scales.cellHeight + "px;width:" + scales.width + "px",
            });
            this.Bars.$view.insertBefore(this.selLine, this.Bars.$view.firstChild);
            this.on(this.State.$changes, "selected", function () { return _this.SetSelection(); });
        };
        BarsView.prototype.SetSelection = function () {
            var id = this.State.selected;
            var top = id
                ? this.Bars.getIndexById(id) * this.Local.getScales().cellHeight
                : -100;
            this.selLine.style.top = top + "px";
        };
        BarsView.prototype.InitMarkers = function () {
            var _this = this;
            var markers = (this.Markers = this.app.config.markers);
            if (markers && markers.length) {
                this.containerForMarkers = webix.html.create("DIV", {
                    class: "webix_gantt_markers",
                    style: "height:" + this.Bars.$view.scrollHeight + "px",
                });
                this.Bars.$view.insertBefore(this.containerForMarkers, this.Bars.$view.firstChild);
                this.RenderMarkers(markers);
                this.on(this.app, "onScalesUpdate", function () {
                    return _this.RenderMarkers(_this.Markers);
                });
            }
        };
        BarsView.prototype.RenderMarkers = function (markers) {
            var _this = this;
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
            var astart = getUnitStart(minUnit, start);
            return date < start || date > end
                ? -100
                : Math.round(diff(date, astart, true) * cellWidth);
        };
        BarsView.prototype.LinksTemplate = function (lines, css) {
            var bars = this.Bars.$view;
            return "<svg\n\t\t\tclass=\"" + css + "\"\n\t\t\tviewBox=\"" + this.State.left + " " + this.State.top + " " + bars.scrollWidth + " " + bars.scrollHeight + "\"\n\t\t\twidth=\"" + bars.scrollWidth + "\"\n\t\t\theight=\"" + bars.scrollHeight + "\"\n\t\t>" + lines + "</svg>";
        };
        BarsView.prototype.RefreshLinks = function (ldata) {
            var lines = [];
            ldata.order.each(function (id) {
                var link = ldata.getItem(id);
                if (link.$p)
                    lines.push("<polyline data-id=\"" + id + "\" points=\"" + link.$p + "\" />");
            });
            var html = this.LinksTemplate(lines.join(""), "webix_gantt_lines") +
                this.LinksTemplate('<polyline points="" />', "webix_gantt_temp_line");
            this.Links.setHTML(html);
        };
        BarsView.prototype.RefreshTaskLinks = function (tid) {
            var _this = this;
            this.LinksData.find(function (a) { return a.source == tid || a.target == tid; }).forEach(function (obj) {
                var l = _this.Links.$view.querySelector("[data-id=\"" + obj.id + "\"]");
                if (l) {
                    var s = _this.TasksData.getItem(obj.source);
                    var e = _this.TasksData.getItem(obj.target);
                    updateLink(obj, s, e, _this.Local._taskHeight);
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
                    this.RefreshTaskLinks(obj.id);
                }
            }
            else if (obj.action === "update-task-progress") {
                if (!webix.isUndefined(obj.progress)) {
                    inProgress = ops.updateTask(obj.id, { progress: obj.progress });
                }
                else {
                    var task = this.TasksData.getItem(obj.id);
                    this.Bars.render(obj.id, task, "paint");
                }
            }
            else if (obj.action === "drag-task") {
                var task = this.TasksData.getItem(obj.id);
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
                    var _a = newLink(this.Links.$view.getBoundingClientRect(), start, end), left = _a.left, top_1 = _a.top, p = _a.p;
                    var shift_1 = [left, top_1];
                    var points = p
                        .split(",")
                        .map(function (a, i) { return a * 1 + shift_1[i % 2]; })
                        .join(",");
                    link.setAttribute("points", points);
                }
            }
            if (inProgress) {
                this.app.callEvent("backend:operation", [inProgress]);
                return inProgress;
            }
            return webix.promise.resolve();
        };
        BarsView.prototype.HandleHolidays = function (scales) {
            var _this = this;
            this.holidaysContainer = webix.html.create("DIV", {
                class: "webix_gantt_bar_holidays",
                style: "height:" + this.Bars.$view.scrollHeight + "px;",
            });
            this.Bars.$view.insertBefore(this.holidaysContainer, this.Bars.$view.firstChild);
            this.RenderHolidays(scales);
            this.on(this.app, "onScalesUpdate", function (scales) { return _this.RenderHolidays(scales); });
        };
        BarsView.prototype.RenderHolidays = function (scales) {
            if (scales.minUnit === "day" || scales.minUnit === "hour") {
                var html = "";
                var date = webix.Date.copy(scales.start);
                var end = webix.Date.dayStart(scales.end);
                if (!(scales.end - end)) {
                    end = webix.Date.add(end, -1, "day", true);
                }
                var hourOffset = scales.start.getHours();
                while (date <= end) {
                    if (this.Local.isHoliday(date)) {
                        html += this.HolidayTemplate(scales, date, hourOffset);
                    }
                    date = webix.Date.add(webix.Date.dayStart(date), 1, "day", true);
                    hourOffset = webix.Date.equal(date, end)
                        ? 24 - Math.ceil(webix.Date.timePart(scales.end) / 60 / 60)
                        : 0;
                }
                this.holidaysContainer.innerHTML = html;
            }
        };
        BarsView.prototype.HolidayTemplate = function (scales, date, hourOffset) {
            var astart = getUnitStart(scales.minUnit, scales.start);
            var x = Math.round(scales.diff(date, astart) * scales.cellWidth);
            var w = (scales.minUnit === "hour" ? 24 - hourOffset : 1) * scales.cellWidth;
            return "<div class=\"webix_gantt_holiday\" style=\"left:" + x + "px; width:" + w + "px;\"></div>";
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
            var view = this.getRoot();
            var state = this.getParam("state", true);
            this.on(state.$changes, "left", function (x) { return view.scrollTo(x, null); });
            this.Local = this.app.getService("local");
            var scales = this.Local.getScales();
            this.RenderScales(scales);
            this.on(this.app, "onScalesUpdate", function (scales) { return _this.RenderScales(scales); });
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
                (canMarkHolidays && this.Local.isHoliday(cell.date)
                    ? "webix_gantt_holiday_scale"
                    : "")) + "\" style=\"width:" + cell.width + "px;\">" + cell.format(cell.date) + "</div>";
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

    var TableView = (function (_super) {
        __extends(TableView, _super);
        function TableView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TableView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            var header = { template: _("Related tasks"), type: "section" };
            var table = {
                view: "treetable",
                css: "webix_gantt_tree webix_gantt_tree_link",
                header: false,
                borderless: true,
                localId: "links",
                autoheight: true,
                editable: true,
                scroll: false,
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
                            title: _("Delete link"),
                            text: _("The link will be deleted permanently, are you sure?"),
                        })
                            .then(function () { return _this.DeleteLink(id); });
                    },
                },
            };
            return {
                rows: [header, table],
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
        };
        TableView.prototype.FillData = function (id) {
            var local = this.app.getService("local");
            var related = local
                .getLinks(id, "target")
                .concat(local.getLinks(id, "source"));
            this.Links.clearAll();
            if (related.length) {
                this.Links.parse(related);
                this.Links.show();
            }
            else {
                this.getRoot().hide();
            }
        };
        TableView.prototype.UpdateLink = function (id, obj) {
            var _this = this;
            var inProgress = this.Ops.updateLink(id, obj);
            this.app.callEvent("backend:operation", [inProgress]);
            inProgress.then(function () {
                _this.Links.blockEvent();
                _this.Links.editCancel();
                _this.Links.unblockEvent();
                _this.Links.updateItem(id, obj);
            });
        };
        TableView.prototype.DeleteLink = function (id) {
            var _this = this;
            var inProgress = this.Ops.removeLink(id);
            this.app.callEvent("backend:operation", [inProgress]);
            inProgress.then(function () {
                _this.FillData(_this.State.selected);
            });
        };
        return TableView;
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
                        name: "type",
                        label: _("Type"),
                        options: [
                            { id: "task", value: _("Task") },
                            { id: "project", value: _("Project") },
                            { id: "milestone", value: _("Milestone") },
                        ],
                        on: {
                            onChange: function (v) { return _this.ToggleControls(v); },
                        },
                    },
                    { view: "datepicker", name: "start_date", label: _("Start date") },
                    { view: "datepicker", name: "end_date", label: _("End date") },
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
                    TableView,
                    {
                        view: "textarea",
                        name: "details",
                        label: _("Notes"),
                        height: 150,
                    },
                ],
                on: {
                    onChange: function () {
                        _this.UpdateTaskTime();
                        if (!_this.Compact)
                            _this.UpdateTask();
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
            this.State = this.getParam("state", true);
            this.Ops = this.app.getService("operations");
            this.Tasks = this.app.getService("local").tasks();
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
        };
        FormView.prototype.FillData = function (id) {
            var item = this.Tasks.getItem(id);
            this.Form.setValues(item);
            this.Form.focus();
        };
        FormView.prototype.UpdateTaskTime = function () {
            var f = this.Form.$eventSource.config.name;
            var vals = this.Form.getValues();
            if (f == "duration" || (f == "start_date" && vals.type == "project"))
                vals.end_date = null;
            else if (f == "end_date" || f == "start_date")
                vals.duration = null;
            updateTaskDuration(vals);
            this.Form.blockEvent();
            this.Form.setValues(vals, true);
            this.Form.unblockEvent();
        };
        FormView.prototype.UpdateTask = function () {
            var _this = this;
            var id = this.State.selected;
            var vals = this.Form.getValues();
            this._inProgress =
                id === "$temp"
                    ? this.Ops.saveTempTask(vals)
                    : this.Ops.updateTask(id, vals);
            this.app.callEvent("backend:operation", [this._inProgress]);
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
                    text: _("Save changes?"),
                })
                    .then(function () { return _this.Done(true); }, function () { return _this.Back(true); });
            }
            else {
                this.Back(true);
            }
        };
        FormView.prototype.Back = function (exit) {
            if (exit) {
                this.app.callEvent("edit:stop");
            }
            else {
                var path = this.Compact ? "task.popup/" : "../";
                this.show(path + "task.info", { target: "edit" });
            }
        };
        FormView.prototype.Done = function (exit) {
            var _this = this;
            if (this.State.selected === "$temp" ||
                (this.Compact && this.Form.isDirty())) {
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
        return FormView;
    }(JetView));

    var TaskView = (function (_super) {
        __extends(TaskView, _super);
        function TaskView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TaskView.prototype.config = function () {
            var _this = this;
            var _ = this.app.getService("locale")._;
            var state = this.getParam("state", true);
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
            this.State = this.getParam("state", true);
            this.Local = this.app.getService("local");
            this.Tasks = this.Local.tasks();
            this.Text = this.$$("text");
            this.on(this.State.$changes, "selected", function (id) {
                if (id)
                    _this.FillTemplate(id);
            });
            this.on(this.Tasks.data, "onStoreUpdated", function (id, obj, mode) {
                if (mode == "update" && id == _this.State.selected) {
                    _this.FillTemplate(_this.State.selected);
                }
            });
        };
        TaskView.prototype.FillTemplate = function (id) {
            var item = webix.copy(this.Tasks.getItem(id));
            item.sources = this.Local.getLinks(id, "source");
            item.targets = this.Local.getLinks(id, "target");
            this.Text.setValues(item);
        };
        TaskView.prototype.EditTask = function () {
            var compact = this.getParam("compact", true);
            var path = compact ? "task.popup/" : "../";
            this.show(path + "task.form", { target: "edit" });
        };
        TaskView.prototype.DeleteTask = function () {
            var inProgress = this.app
                .getService("operations")
                .removeTask(this.State.selected);
            this.app.callEvent("backend:operation", [inProgress]);
            this.Close();
        };
        TaskView.prototype.Close = function () {
            this.app.callEvent("edit:stop");
        };
        TaskView.prototype.InfoTemplate = function (obj) {
            if (!obj.start_date)
                return "";
            var _ = this.app.getService("locale")._;
            var empty = _("(no title)");
            var html = "\n\t\t\t<span class=\"webix_gantt_task_title\">" + (obj.text || empty) + "</span><br><br>\n\t\t\t<span class=\"webix_strong\">" + _("Start date") + "</span>: " + this.DateFormat(obj.start_date) + "<br>";
            if (obj.type !== "milestone")
                html += "<span class=\"webix_strong\">" + _("End date") + "</span>: " + this.DateFormat(obj.end_date) + "<br>\n\t\t\t<span class=\"webix_strong\">" + _("Duration") + "</span>: " + obj.duration + "<br>\n\t\t\t<span class=\"webix_strong\">" + _("Progress") + "</span>: " + obj.progress + "%\n\t\t<br>";
            if (obj.targets.length)
                html += this.InfoTemplateChunk(obj.targets, _("Predecessors"), empty);
            if (obj.sources.length)
                html += this.InfoTemplateChunk(obj.sources, _("Successors"), empty);
            if (obj.details) {
                html += "<br><br><div class=\"webix_gantt_task_title\">" + _("Notes") + "</div>\n\t\t\t\t<br><div class=\"webix_gantt_task_text\">" + obj.details.replace(/(?:\r\n|\r|\n)/g, "<br>") + "</div>";
            }
            return html;
        };
        TaskView.prototype.InfoTemplateChunk = function (arr, label, empty) {
            var res = arr.map(function (s) { return "<li>" + (s.text || empty) + "</li>"; }).join("");
            return "<br><span class=\"webix_strong\">" + label + "</span>:<br>" + res;
        };
        TaskView.prototype.DateFormat = function (date) {
            return webix.i18n.longDateFormatStr(date);
        };
        return TaskView;
    }(JetView));

    var TaskPopup = (function (_super) {
        __extends(TaskPopup, _super);
        function TaskPopup() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TaskPopup.prototype.config = function () {
            return {
                view: "window",
                fullscreen: true,
                head: false,
                body: { $subview: true },
            };
        };
        return TaskPopup;
    }(JetView));

    var TreeView = (function (_super) {
        __extends(TreeView, _super);
        function TreeView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TreeView.prototype.config = function () {
            var _this = this;
            var state = this.getParam("state");
            var scales = this.app.getService("local").getScales();
            var _ = this.app.getService("locale")._;
            var compact = this.getParam("compact", true);
            var action = {
                id: "action",
                css: "webix_gantt_action",
                header: {
                    text: "<span webix_tooltip=\"" + _("Add project") + "\" class=\"webix_icon wxi-plus-circle\"></span>",
                    css: "webix_gantt_action",
                },
                template: function (obj) {
                    if (obj.id === "$temp")
                        return "";
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
                        return common.treetable(obj, common) + (obj.text || _("(no title)"));
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
            if (compact) {
                action.header.text = "<span class='webix_icon gti-menu'>";
                if (state.readonly)
                    action.template = "";
                columns.unshift(action);
            }
            else if (!state.readonly)
                columns.push(action);
            var tree = {
                view: "treetable",
                css: "webix_gantt_tree webix_header_border",
                prerender: true,
                width: compact ? 44 : 400,
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
                drag: "order",
                columns: columns,
                tooltip: function () { return ""; },
                onClick: {
                    "wxi-plus": function (ev, id) { return _this.AddTempTask(id.row); },
                    "wxi-plus-circle": function () { return _this.AddTempTask("0"); },
                    "gti-menu": function () { return _this.ToggleColumns(); },
                },
                on: {
                    onAfterOpen: function (id) {
                        _this.RefreshTasks();
                        _this.Ops.updateTask(id, { opened: 1 });
                    },
                    onAfterClose: function (id) {
                        _this.RefreshTasks();
                        _this.Ops.updateTask(id, { opened: 0 });
                    },
                    onItemClick: function (id) {
                        state.$batch({
                            parent: null,
                            selected: id,
                        });
                    },
                    onAfterSort: function (by, dir, as) { return _this.SortTasks(by, dir, as); },
                    onColumnResize: function (id, v, o, user) { return _this.NormalizeColumns(id, user); },
                    onBeforeDrop: function (ctx) {
                        var inProgress = null;
                        if (ctx.start === "$temp") {
                            inProgress = _this.Ops.saveTempTask(_this.Tasks.getItem(ctx.start), ctx.parent || 0, ctx.index);
                        }
                        else {
                            inProgress = _this.Ops.moveTask(ctx.start, ctx.parent, ctx.index);
                        }
                        _this.app.callEvent("backend:operation", [inProgress]);
                        return false;
                    },
                },
            };
            var handler = function () {
                state.top = this.getScrollState().y;
            };
            if (webix.env.touch) {
                tree.on["onSyncScroll"] = tree.on["onAfterScroll"] = handler;
            }
            else
                tree.on["onScrollY"] = handler;
            return tree;
        };
        TreeView.prototype.init = function (view) {
            var _this = this;
            this.Tree = view;
            this.Tasks = this.app.getService("local").tasks();
            this.State = this.getParam("state", true);
            this.Ops = this.app.getService("operations");
            this.Tree.sync(this.Tasks);
            this.Tasks.waitData.then(function () {
                _this.RefreshTasks();
                if (_this.State.sort) {
                    _this.Tree.data.blockEvent();
                    _this.Tree.setState({ sort: _this.State.sort });
                    _this.Tree.data.unblockEvent();
                }
            });
            this.on(this.State.$changes, "top", function (y) { return _this.Tree.scrollTo(null, y); });
            this.on(this.State.$changes, "selected", function (id, oid) {
                if (oid === "$temp")
                    _this.ClearTempTask();
                if (id)
                    _this.Tree.select(id);
                else
                    _this.Tree.unselect();
            });
            this.on(this.Tasks.data, "onStoreUpdated", function (id, obj, mode) {
                if (mode == "add" && id !== "$temp")
                    _this.ClearTempTask();
            });
            this.on(this.app, "task:add", function () { return _this.AddTempTask("0"); });
        };
        TreeView.prototype.AddTempTask = function (pid) {
            if (this.State.parent !== pid) {
                var row = this.Tasks.getItem(pid);
                var start = row
                    ? row.start_date
                    : this.app.getService("local").getScales().start;
                this.ClearTempTask();
                this.State.selected = null;
                var id = this.Tasks.add(this.GetTempTask(start), row ? 0 : -1, row ? pid : 0);
                if (row) {
                    this.Tree.open(pid);
                }
                this.State.$batch({
                    parent: pid,
                    selected: id,
                });
                if (this.Tree.exists(pid))
                    this.Tree.showItem(id);
            }
            return false;
        };
        TreeView.prototype.GetTempTask = function (start) {
            return {
                id: "$temp",
                start_date: new Date(start),
                end_date: webix.Date.add(start, 1, "day", true),
                progress: 0,
                text: "",
            };
        };
        TreeView.prototype.ClearTempTask = function () {
            if (this.Tasks.exists("$temp"))
                this.Tasks.remove("$temp");
        };
        TreeView.prototype.RefreshTasks = function () {
            this.Tasks.data.callEvent("onStoreUpdated", []);
        };
        TreeView.prototype.SortTasks = function (by, dir, as) {
            var dataSorter = webix.isArray(by) ? by : { by: by, dir: dir, as: as };
            var sortState = this.Tree.getState().sort;
            this.Tasks.sort(dataSorter);
            this.State.sort = sortState;
            if (this.State.selected === "$temp")
                this.app.callEvent("edit:stop");
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
        return TreeView;
    }(JetView));
    function sort(by) {
        return function (a, b) {
            return a[by].localeCompare(b[by], undefined, {
                ignorePunctuation: true,
                numeric: true,
            });
        };
    }

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

    var TopView = (function (_super) {
        __extends(TopView, _super);
        function TopView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TopView.prototype.config = function () {
            var _this = this;
            this.fCompact = this.getParam("forceCompact");
            if (typeof this.fCompact !== "undefined")
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
                TreeView,
                {
                    view: this.Compact ? "spacer" : "resizer",
                    css: "webix_gantt_resizer",
                    width: 1,
                },
                ChartView,
                edit,
            ];
            var ui = {
                view: "abslayout",
                css: "webix_gantt",
                cells: [
                    {
                        view: typeof fCompact === "undefined" ? "r-layout" : "layout",
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
            return ui;
        };
        TopView.prototype.init = function (view) {
            var _this = this;
            if (!this.fCompact)
                this.$$("main").sizeTrigger(this.app.config.compactWidth, function (mode) { return _this.SetCompactMode(mode); }, !!this.Compact);
            this.on(this.State.$changes, "selected", function (id, oid) {
                if (id && id != "$temp" && !_this.State.parent)
                    _this.ShowTask("info");
                else if (oid === "$temp")
                    _this.State.parent = null;
            });
            this.on(this.State.$changes, "parent", function (id) {
                if (id)
                    _this.ShowTask("form");
            });
            this.on(this.app, "edit:stop", function () {
                _this.State.selected = null;
                _this.HideTask();
            });
            webix.extend(view, webix.ProgressBar);
            this.on(this.app, "backend:operation", function (res) {
                if (res) {
                    view.showProgress({ type: "top", delay: 2000 });
                    res.finally(function () {
                        view.hideProgress();
                    });
                }
            });
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
    views["task/form"] = FormView;
    views["task/info"] = TaskView;
    views["task/popup"] = TaskPopup;
    views["task/table"] = TableView;
    views["top"] = TopView;
    views["tree"] = TreeView;

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
        "Start to end": "Start to End",
        Lasts: "Lasts",
        day: "day",
        days: "days",
    };

    var Local = (function () {
        function Local(app, config) {
            this.app = app;
            var active = webix.skin.$active;
            var scaleStart = config.scaleStart || webix.Date.dayStart(new Date());
            var scaleEnd = config.scaleEnd || webix.Date.add(scaleStart, 1, "month", true);
            this.setScales(scaleStart, scaleEnd, config.preciseTimeUnit, config.scaleCellWidth || 200, active.barHeight - active.borderWidth * 2, config.scales || [{ unit: "day", step: 1, format: "%d" }]);
            this.dateToLocalStr = webix.Date.dateToStr(webix.i18n.parseFormat);
        }
        Local.prototype.setScales = function (scaleStart, scaleEnd, precise, width, height, scales) {
            if (width) {
                this._scaleBase = { width: width, height: height, scales: scales };
                scaleEnd = webix.Date.add(scaleEnd, 1, "day");
            }
            else {
                width = this._scaleBase.width;
                height = this._scaleBase.height;
                scales = this._scaleBase.scales;
            }
            this._scales = resetScales(scaleStart, scaleEnd, precise, width, height, scales);
            this._taskHeight = this._scales.cellHeight - 12;
            this.app.callEvent("onScalesUpdate", [this._scales]);
        };
        Local.prototype.getScales = function () {
            return this._scales;
        };
        Local.prototype.adjustScale = function (start, end) {
            var s = this.getScales();
            start = addUnit(s.minUnit)(start, -1);
            end = addUnit(s.minUnit)(end, 1);
            if ((s && s.start > start) || s.end < end) {
                this.setScales(s.start > start ? start : s.start, s.end < end ? end : s.end, s.precise);
                this.refreshTasks();
            }
        };
        Local.prototype.tasks = function () {
            var _this = this;
            if (this._tasks)
                return this._tasks;
            var tasks = (this._tasks = new webix.TreeCollection({
                on: {
                    "data->onStoreLoad": function () {
                        if (!_this.app.config.scaleStart) {
                            var min_1 = Infinity;
                            var max_1 = -Infinity;
                            tasks.data.each(function (d) {
                                if (d.start_date < min_1)
                                    min_1 = d.start_date;
                                if (d.end_date > max_1)
                                    max_1 = d.end_date;
                            });
                            if (typeof min_1 === "object") {
                                var s = _this.getScales();
                                _this.setScales(addUnit(s.minUnit)(min_1, -1), addUnit(s.minUnit)(max_1, 1), s.precise);
                            }
                        }
                    },
                    "data->onStoreUpdated": function (id, obj, mode) {
                        id = mode == "update" ? id : null;
                        _this.refreshTasks(id);
                        _this.refreshLinks();
                    },
                },
                scheme: {
                    $init: function (obj) {
                        obj.start_date = webix.i18n.parseFormatDate(obj.start_date);
                        obj.end_date = webix.i18n.parseFormatDate(obj.end_date);
                        updateTaskDuration(obj);
                        obj.type = obj.type || "task";
                        obj.open = obj.opened ? obj.opened * 1 : 0;
                    },
                    $sort: {
                        by: "position",
                        dir: "asc",
                        as: "int",
                    },
                    $serialize: function (data) { return _this.taskOut(data); },
                    $export: function (data) { return _this.taskOut(data); },
                },
            }));
            tasks.parse(this.app
                .getService("backend")
                .tasks()
                .then(function (data) { return getTree(data, 0); }));
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
                var t = this._tasks.getItem(updID);
                i = !webix.isUndefined(i) ? i : this._tasks.getIndexById(updID);
                updateTask(t, i, this._scales, this._taskHeight);
            }
        };
        Local.prototype.links = function () {
            var _this = this;
            if (this._links)
                return this._links;
            var links = (this._links = new webix.DataCollection({
                on: {
                    "data->onStoreUpdated": function (id) { return _this.refreshLinks(id); },
                },
                scheme: {
                    $init: function (obj) {
                        obj.type = obj.type * 1;
                    },
                },
            }));
            links.parse(this.app.getService("backend").links());
            return links;
        };
        Local.prototype.refreshLinks = function () {
            var _this = this;
            if (this._links)
                this._links.data.each(function (l) {
                    var s = _this._tasks.getItem(l.source);
                    var e = _this._tasks.getItem(l.target);
                    if (!s || !e || !_this._isTaskVisible(s) || !_this._isTaskVisible(e))
                        l.$p = "";
                    else
                        updateLink(l, s, e, _this._taskHeight);
                });
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
        Local.prototype.isHoliday = function (date) {
            var d = date.getDay();
            return d === 0 || d === 6;
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
        Local.prototype._isTaskVisible = function (x) {
            while (x.$parent) {
                x = this._tasks.getItem(x.$parent);
                if (!x.open)
                    return false;
            }
            return true;
        };
        return Local;
    }());
    function getTree(data, id) {
        var tree = data.filter(function (a) { return a.parent == id; });
        tree.forEach(function (a) {
            var temp = getTree(data, a.id);
            if (temp)
                a.data = temp;
        });
        return tree;
    }

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
        Backend.prototype.addTask = function (obj, position, parent) {
            return webix
                .ajax()
                .post(this.url("tasks"), __assign(__assign({}, obj), { position: position, parent: parent }))
                .then(function (res) { return res.json(); });
        };
        Backend.prototype.removeTask = function (id) {
            return webix
                .ajax()
                .del(this.url("tasks/" + id))
                .then(function (res) { return res.json(); });
        };
        Backend.prototype.updateTask = function (id, obj) {
            return webix
                .ajax()
                .put(this.url("tasks/" + id), obj)
                .then(function (res) { return res.json(); });
        };
        Backend.prototype.addLink = function (obj) {
            return webix
                .ajax()
                .post(this.url("links"), obj)
                .then(function (res) { return res.json(); });
        };
        Backend.prototype.updateLink = function (id, obj) {
            return webix
                .ajax()
                .put(this.url("links/" + id), obj)
                .then(function (res) { return res.json(); });
        };
        Backend.prototype.removeLink = function (id) {
            return webix
                .ajax()
                .del(this.url("links/" + id))
                .then(function (res) { return res.json(); });
        };
        return Backend;
    }());

    var Operations = (function () {
        function Operations(_app) {
            this._app = _app;
            this._local = this._app.getService("local");
            this._back = this._app.getService("backend");
        }
        Operations.prototype.addTask = function (obj, index, parent) {
            var _this = this;
            return this._back.addTask(obj, index, parent).then(function (added) {
                _this._local.adjustScale(obj.start_date, obj.end_date);
                var tasks = _this._local.tasks();
                tasks.add(__assign(__assign({}, obj), { id: added.id, parent: parent, position: index }), index, parent);
                if (parent) {
                    _this.syncProject(parent);
                }
                _this.updateKidPositions(parent, { start: index });
                return added;
            });
        };
        Operations.prototype.updateTask = function (id, obj, inner) {
            var _this = this;
            var tasks = this._local.tasks();
            var item = webix.copy(tasks.getItem(id));
            var next = __assign(__assign({}, item), obj);
            updateTaskDuration(next);
            if (id === "$temp")
                return this.saveTempTask(next);
            if (!inner && obj.type == "project" && item.type != "project")
                return this.syncProject(id, next);
            return this._back.updateTask(id, next).then(function () {
                if (!inner)
                    _this._local.adjustScale(next.start_date, next.end_date);
                tasks.updateItem(id, next);
                if (!inner) {
                    if (!(webix.Date.equal(item.start_date, obj.end_date) &&
                        webix.Date.equal(item.end_date, obj.end_date))) {
                        if (item.$count && item.type == "project")
                            _this.syncTasks(id, item.start_date, obj.start_date).then(function () {
                                _this.syncProject(item.parent);
                            });
                        else
                            _this.syncProject(item.parent);
                    }
                }
                return next;
            });
        };
        Operations.prototype.syncTasks = function (id, old, change) {
            var _this = this;
            var diff = change - old;
            if (diff) {
                var p_1 = [];
                this._local.tasks().data.eachSubItem(id, function (kid) {
                    var changedKid = __assign(__assign({}, kid), { start_date: new Date(kid.start_date.valueOf() + diff), end_date: null });
                    updateTaskDuration(changedKid);
                    p_1.push(_this.updateTask(kid.id, changedKid, true));
                });
                return webix.promise.all(p_1);
            }
            return webix.promise.resolve();
        };
        Operations.prototype.syncProject = function (id, item) {
            var _this = this;
            var tasks = this._local.tasks();
            if (!item) {
                item = tasks.getItem(id);
                while (item && item.type != "project") {
                    id = tasks.getParentId(id);
                    item = tasks.getItem(id);
                }
            }
            if (item && item.$count) {
                var min_1 = Infinity, max_1 = 0, progress_1 = 0, duration_1 = 0;
                item.duration = null;
                tasks.data.eachSubItem(id, function (kid) {
                    min_1 = kid.start_date < min_1 ? kid.start_date : min_1;
                    max_1 = kid.end_date > max_1 ? kid.end_date : max_1;
                    if (kid.duration && !(kid.type == "project" && kid.$count)) {
                        progress_1 += kid.duration * kid.progress;
                        duration_1 += kid.duration * 1;
                    }
                });
                if (!webix.Date.equal(item.start_date, min_1))
                    item.start_date = min_1;
                if (!webix.Date.equal(item.end_date, max_1))
                    item.end_date = max_1;
                item.progress = progress_1 ? Math.round(progress_1 / duration_1) : progress_1;
            }
            if (item)
                return this.updateTask(id, item, true).then(function () {
                    _this.syncProject(item.parent);
                    return item;
                });
        };
        Operations.prototype.updateTaskTime = function (id, mode, time) {
            var tasks = this._local.tasks();
            var task = tasks.getItem(id);
            var obj = {};
            var s = this._local.getScales();
            var unit = s.precise ? smallerCount[s.minUnit][0] : s.minUnit;
            if (mode === "start" || mode === "move") {
                var offsetDate = s.precise
                    ? task.start_date
                    : getUnitStart(unit, task.start_date);
                obj.start_date = addUnit(unit)(offsetDate, time);
                if (mode === "start" && obj.start_date > task.end_date)
                    obj.start_date = addUnit(unit)(task.end_date, -1);
            }
            if (mode === "end") {
                var offsetDate = s.precise
                    ? task.end_date
                    : getUnitStart(unit, addUnit(unit)(task.end_date, 1));
                obj.end_date = addUnit(unit)(offsetDate, time);
                if (obj.end_date < task.start_date)
                    obj.end_date = addUnit(unit)(task.start_date, 1);
            }
            if (mode === "move")
                obj.end_date = null;
            else
                obj.duration = 0;
            if (id === "$temp") {
                var ntask = __assign(__assign({}, task), obj);
                updateTaskDuration(ntask);
                return this.saveTempTask(ntask);
            }
            return this.updateTask(id, obj);
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
                _this.syncProject(parent);
                return res;
            });
        };
        Operations.prototype.saveTempTask = function (obj, pid, index) {
            var state = this._app.getState();
            if (webix.isUndefined(pid) || webix.isUndefined(index)) {
                var tasks = this._local.tasks();
                index = tasks.getBranchIndex(state.selected);
                pid = state.parent === "0" ? 0 : state.parent;
            }
            return this.addTask(obj, index, pid).then(function (res) {
                return (state.selected = res.id);
            });
        };
        Operations.prototype.addLink = function (obj) {
            var _this = this;
            return this._back.addLink(obj).then(function (added) {
                obj.id = added.id;
                _this._local.links().add(obj);
                return obj;
            });
        };
        Operations.prototype.updateLink = function (id, obj) {
            var _this = this;
            return this._back.updateLink(id, obj).then(function (res) {
                _this._local.links().updateItem(id, obj);
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
                return null;
            tasks.move(id, index, null, { parent: parent });
            return this.updateTask(id, { parent: parent }, true)
                .then(function () {
                _this.updateKidPositions(parent, {
                    start: index === -1 ? branch.length - 1 : index,
                });
            })
                .catch(function () {
                tasks.move(id, oldIndex, null, {
                    parent: oldParent,
                });
            });
        };
        Operations.prototype.updateKidPositions = function (parent, range) {
            var tasks = this._local.tasks();
            var branch = tasks.data.branch[parent];
            var start = webix.isUndefined(range.start) ? 0 : Math.max(range.start, 0);
            var end = webix.isUndefined(range.end)
                ? branch.length
                : Math.min(range.end, branch.length);
            var first = start ? tasks.getItem(branch[start - 1]).position + 1 : 0;
            for (var index = start; index < end; index++) {
                this.updateTask(branch[index], { position: first + index - start }, true);
            }
        };
        return Operations;
    }());

    var App = (function (_super) {
        __extends(App, _super);
        function App(config) {
            var _this = this;
            var state = createState({
                top: 0,
                left: 0,
                selected: null,
                parent: null,
                readonly: config.readonly || false,
                sort: null,
            });
            var defaults = {
                router: EmptyRouter,
                version: "8.1.1",
                debug: true,
                start: "/top",
                compactWidth: 650,
                markers: [{ css: "webix_gantt_today_marker", now: true }],
                params: { state: state, forceCompact: config.compact },
            };
            _this = _super.call(this, __assign(__assign({}, defaults), config)) || this;
            if (_this.config.debug) {
                webix.Promise = window.Promise;
            }
            var dynamic = function (obj) {
                return _this.config.override ? _this.config.override.get(obj) || obj : obj;
            };
            _this.setService("local", new (dynamic(Local))(_this, config));
            _this.setService("backend", new (dynamic(Backend))(_this, config.url));
            _this.setService("operations", new (dynamic(Operations))(_this));
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
            var state = this.$app.getState();
            for (var key in state) {
                link(state, this.config, key);
            }
        },
        $exportView: function () {
            return this.$app.getService("local").tasks();
        },
    }, webix.ui.jetapp);
    var services = { Local: Local, Backend: Backend, Operations: Operations };
    var locales = { en: en };

    exports.App = App;
    exports.locales = locales;
    exports.services = services;
    exports.views = views;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
