/*
@license
Webix Query v.8.1.1
This software is covered by Webix Commercial License.
Usage without proper license is prohibited.
(c) XB Software Ltd.
*/
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.query = {}));
}(this, (function (exports) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
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
                inputs: [
                    { view:"text", batch:"string" },
                    { view:"rangeslider", max:100, min:0, step:1, moveTitle:false, batch:"rangeslider"},
                    { template:"some average value e.g. 50", batch:"template", borderless:true, css:{"line-height":"28px"} },
                ],
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