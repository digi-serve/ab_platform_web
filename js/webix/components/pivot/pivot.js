/*
@license
Webix Pivot v.10.1.0
This software is covered by Webix Commercial License.
Usage without proper license is prohibited.
(c) XB Software Ltd.
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.pivot = {}));
}(this, (function (exports) { 'use strict';

  class NavigationBlocked {
  }
  class JetBase {
      constructor(webix, config) {
          this.webixJet = true;
          this.webix = webix;
          this._events = [];
          this._subs = {};
          this._data = {};
          if (config && config.params)
              webix.extend(this._data, config.params);
      }
      getRoot() {
          return this._root;
      }
      destructor() {
          this._detachEvents();
          this._destroySubs();
          this._events = this._container = this.app = this._parent = this._root = null;
      }
      setParam(id, value, url) {
          if (this._data[id] !== value) {
              this._data[id] = value;
              this._segment.update(id, value, 0);
              if (url) {
                  return this.show(null);
              }
          }
      }
      getParam(id, parent) {
          const value = this._data[id];
          if (typeof value !== "undefined" || !parent) {
              return value;
          }
          const view = this.getParentView();
          if (view) {
              return view.getParam(id, parent);
          }
      }
      getUrl() {
          return this._segment.suburl();
      }
      getUrlString() {
          return this._segment.toString();
      }
      getParentView() {
          return this._parent;
      }
      $$(id) {
          if (typeof id === "string") {
              const root = this.getRoot();
              return root.queryView((obj => (obj.config.id === id || obj.config.localId === id) &&
                  (obj.$scope === root.$scope)), "self");
          }
          else {
              return id;
          }
      }
      on(obj, name, code) {
          const id = obj.attachEvent(name, code);
          this._events.push({ obj, id });
          return id;
      }
      contains(view) {
          for (const key in this._subs) {
              const kid = this._subs[key].view;
              if (kid === view || kid.contains(view)) {
                  return true;
              }
          }
          return false;
      }
      getSubView(name) {
          const sub = this.getSubViewInfo(name);
          if (sub) {
              return sub.subview.view;
          }
      }
      getSubViewInfo(name) {
          const sub = this._subs[name || "default"];
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
      }
      _detachEvents() {
          const events = this._events;
          for (let i = events.length - 1; i >= 0; i--) {
              events[i].obj.detachEvent(events[i].id);
          }
      }
      _destroySubs() {
          for (const key in this._subs) {
              const subView = this._subs[key].view;
              if (subView) {
                  subView.destructor();
              }
          }
          this._subs = {};
      }
      _init_url_data() {
          const url = this._segment.current();
          this._data = {};
          this.webix.extend(this._data, url.params, true);
      }
      _getDefaultSub() {
          if (this._subs.default) {
              return this._subs.default;
          }
          for (const key in this._subs) {
              const sub = this._subs[key];
              if (!sub.branch && sub.view && key !== "_top") {
                  const child = sub.view._getDefaultSub();
                  if (child) {
                      return child;
                  }
              }
          }
      }
      _routed_view() {
          const parent = this.getParentView();
          if (!parent) {
              return true;
          }
          const sub = parent._getDefaultSub();
          if (!sub && sub !== this) {
              return false;
          }
          return parent._routed_view();
      }
  }
  function parse(url) {
      if (url[0] === "/") {
          url = url.substr(1);
      }
      const parts = url.split("/");
      const chunks = [];
      for (let i = 0; i < parts.length; i++) {
          const test = parts[i];
          const result = {};
          let pos = test.indexOf(":");
          if (pos === -1) {
              pos = test.indexOf("?");
          }
          if (pos !== -1) {
              const params = test.substr(pos + 1).split(/[\:\?\&]/g);
              for (const param of params) {
                  const dchunk = param.split("=");
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
      const url = [];
      for (const chunk of stack) {
          url.push("/" + chunk.page);
          const params = obj2str(chunk.params);
          if (params) {
              url.push("?" + params);
          }
      }
      return url.join("");
  }
  function obj2str(obj) {
      const str = [];
      for (const key in obj) {
          if (typeof obj[key] === "object")
              continue;
          if (str.length) {
              str.push("&");
          }
          str.push(key + "=" + encodeURIComponent(obj[key]));
      }
      return str.join("");
  }
  class Route {
      constructor(route, index) {
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
      current() {
          return this.route.url[this.index];
      }
      next() {
          return this.route.url[this.index + this._next];
      }
      suburl() {
          return this.route.url.slice(this.index);
      }
      shift(params) {
          const route = new Route(this.route, this.index + this._next);
          route.setParams(route.route.url, params, route.index);
          return route;
      }
      setParams(url, params, index) {
          if (params) {
              const old = url[index].params;
              for (var key in params)
                  old[key] = params[key];
          }
      }
      refresh() {
          const url = this.route.url;
          for (let i = this.index + 1; i < url.length; i++) {
              url[i].isNew = true;
          }
      }
      toString() {
          const str = url2str(this.suburl());
          return str ? str.substr(1) : "";
      }
      _join(path, kids) {
          let url = this.route.url;
          if (path === null) {
              return url;
          }
          const old = this.route.url;
          let reset = true;
          url = old.slice(0, this.index + (kids ? this._next : 0));
          if (path) {
              url = url.concat(parse(path));
              for (let i = 0; i < url.length; i++) {
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
      }
      append(path) {
          const url = this._join(path, true);
          this.route.path = url2str(url);
          this.route.url = url;
          return this.route.path;
      }
      show(path, view, kids) {
          const url = this._join(path.url, kids);
          this.setParams(url, path.params, this.index + (kids ? this._next : 0));
          return new Promise((res, rej) => {
              const redirect = url2str(url);
              const obj = {
                  url,
                  redirect,
                  confirm: Promise.resolve()
              };
              const app = view ? view.app : null;
              if (app) {
                  const result = app.callEvent("app:guard", [obj.redirect, view, obj]);
                  if (!result) {
                      rej(new NavigationBlocked());
                      return;
                  }
              }
              obj.confirm.catch(err => rej(err)).then(() => {
                  if (obj.redirect === null) {
                      rej(new NavigationBlocked());
                      return;
                  }
                  if (obj.redirect !== redirect) {
                      app.show(obj.redirect);
                      rej(new NavigationBlocked());
                      return;
                  }
                  this.route.path = redirect;
                  this.route.url = url;
                  res();
              });
          });
      }
      size(n) {
          this._next = n;
      }
      split() {
          const route = {
              url: this.route.url.slice(this.index + 1),
              path: ""
          };
          if (route.url.length) {
              route.path = url2str(route.url);
          }
          return new Route(route, 0);
      }
      update(name, value, index) {
          const chunk = this.route.url[this.index + (index || 0)];
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
      }
  }
  class JetView extends JetBase {
      constructor(app, config) {
          super(app.webix);
          this.app = app;
          this._children = [];
      }
      ui(ui, config) {
          config = config || {};
          const container = config.container || ui.container;
          const jetview = this.app.createView(ui);
          this._children.push(jetview);
          jetview.render(container, this._segment, this);
          if (typeof ui !== "object" || (ui instanceof JetBase)) {
              return jetview;
          }
          else {
              return jetview.getRoot();
          }
      }
      show(path, config) {
          config = config || {};
          if (typeof path === "object") {
              for (const key in path) {
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
                  const parent = this.getParentView();
                  if (parent) {
                      return parent.show(path.substr(3), config);
                  }
                  else {
                      return this.app.show("/" + path.substr(3));
                  }
              }
              const sub = this.getSubViewInfo(config.target);
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
      }
      _show(segment, path, view) {
          return segment.show(path, view, true).then(() => {
              this._init_url_data();
              return this._urlChange();
          }).then(() => {
              if (segment.route.linkRouter) {
                  this.app.getRouter().set(segment.route.path, { silent: true });
                  this.app.callEvent("app:route", [segment.route.path]);
              }
          });
      }
      init(_$view, _$) {
      }
      ready(_$view, _$url) {
      }
      config() {
          this.app.webix.message("View:Config is not implemented");
      }
      urlChange(_$view, _$url) {
      }
      destroy() {
      }
      destructor() {
          this.destroy();
          this._destroyKids();
          if (this._root) {
              this._root.destructor();
              super.destructor();
          }
      }
      use(plugin, config) {
          plugin(this.app, this, config);
      }
      refresh() {
          const url = this.getUrl();
          this.destroy();
          this._destroyKids();
          this._destroySubs();
          this._detachEvents();
          if (this._container.tagName) {
              this._root.destructor();
          }
          this._segment.refresh();
          return this._render(this._segment);
      }
      render(root, url, parent) {
          if (typeof url === "string") {
              url = new Route(url, 0);
          }
          this._segment = url;
          this._parent = parent;
          this._init_url_data();
          root = root || document.body;
          const _container = (typeof root === "string") ? this.webix.toNode(root) : root;
          if (this._container !== _container) {
              this._container = _container;
              return this._render(url);
          }
          else {
              return this._urlChange().then(() => this.getRoot());
          }
      }
      _render(url) {
          const config = this.config();
          if (config.then) {
              return config.then(cfg => this._render_final(cfg, url));
          }
          else {
              return this._render_final(config, url);
          }
      }
      _render_final(config, url) {
          let slot = null;
          let container = null;
          let show = false;
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
          let response;
          const current = this._segment.current();
          const result = { ui: {} };
          this.app.copyConfig(config, result.ui, this._subs);
          this.app.callEvent("app:render", [this, url, result]);
          result.ui.$scope = this;
          if (!slot && current.isNew && current.view) {
              current.view.destructor();
          }
          try {
              if (slot && !show) {
                  const oldui = container;
                  const parent = oldui.getParentView();
                  if (parent && parent.name === "multiview" && !result.ui.id) {
                      result.ui.id = oldui.config.id;
                  }
              }
              this._root = this.app.webix.ui(result.ui, container);
              const asWin = this._root;
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
              response = Promise.resolve(this._init(this._root, url)).then(() => {
                  return this._urlChange().then(() => {
                      this._initUrl = null;
                      return this.ready(this._root, url.suburl());
                  });
              });
          }
          catch (e) {
              response = Promise.reject(e);
          }
          return response.catch(err => this._initError(this, err));
      }
      _init(view, url) {
          return this.init(view, url.suburl());
      }
      _urlChange() {
          this.app.callEvent("app:urlchange", [this, this._segment]);
          const waits = [];
          for (const key in this._subs) {
              const frame = this._subs[key];
              const wait = this._renderFrameLock(key, frame, null);
              if (wait) {
                  waits.push(wait);
              }
          }
          return Promise.all(waits).then(() => {
              return this.urlChange(this._root, this._segment.suburl());
          });
      }
      _renderFrameLock(key, frame, path) {
          if (!frame.lock) {
              const lock = this._renderFrame(key, frame, path);
              if (lock) {
                  frame.lock = lock.then(() => frame.lock = null, () => frame.lock = null);
              }
          }
          return frame.lock;
      }
      _renderFrame(key, frame, path) {
          if (key === "default") {
              if (this._segment.next()) {
                  let params = path ? path.params : null;
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
                  return frame.route.show(path, frame.view).then(() => {
                      return this._createSubView(frame, frame.route);
                  });
              }
              if (frame.branch) {
                  return;
              }
          }
          let view = frame.view;
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
      }
      _initError(view, err) {
          if (this.app) {
              this.app.error("app:error:initview", [err, view]);
          }
          return true;
      }
      _createSubView(sub, suburl) {
          return this.app.createFromURL(suburl.current()).then(view => {
              return view.render(sub, suburl, this);
          });
      }
      _destroyKids() {
          const uis = this._children;
          for (let i = uis.length - 1; i >= 0; i--) {
              if (uis[i] && uis[i].destructor) {
                  uis[i].destructor();
              }
          }
          this._children = [];
      }
  }
  class JetViewRaw extends JetView {
      constructor(app, config) {
          super(app, config);
          this._ui = config.ui;
      }
      config() {
          return this._ui;
      }
  }
  class SubRouter {
      constructor(cb, config, app) {
          this.path = "";
          this.app = app;
      }
      set(path, config) {
          this.path = path;
          const a = this.app;
          a.app.getRouter().set(a._segment.append(this.path), { silent: true });
      }
      get() {
          return this.path;
      }
  }
  let _once = true;
  class JetAppBase extends JetBase {
      constructor(config) {
          const webix = (config || {}).webix || window.webix;
          config = webix.extend({
              name: "App",
              version: "1.0",
              start: "/home"
          }, config, true);
          super(webix, config);
          this.config = config;
          this.app = this.config.app;
          this.ready = Promise.resolve();
          this._services = {};
          this.webix.extend(this, this.webix.EventSystem);
      }
      getUrl() {
          return this._subSegment.suburl();
      }
      getUrlString() {
          return this._subSegment.toString();
      }
      getService(name) {
          let obj = this._services[name];
          if (typeof obj === "function") {
              obj = this._services[name] = obj(this);
          }
          return obj;
      }
      setService(name, handler) {
          this._services[name] = handler;
      }
      destructor() {
          this.getSubView().destructor();
          super.destructor();
      }
      copyConfig(obj, target, config) {
          if (obj instanceof JetBase ||
              (typeof obj === "function" && obj.prototype instanceof JetBase)) {
              obj = { $subview: obj };
          }
          if (typeof obj.$subview != "undefined") {
              return this.addSubView(obj, target, config);
          }
          const isArray = obj instanceof Array;
          target = target || (isArray ? [] : {});
          for (const method in obj) {
              let point = obj[method];
              if (typeof point === "function" && point.prototype instanceof JetBase) {
                  point = { $subview: point };
              }
              if (point && typeof point === "object" &&
                  !(point instanceof this.webix.DataCollection) && !(point instanceof RegExp) && !(point instanceof Map)) {
                  if (point instanceof Date) {
                      target[method] = new Date(point);
                  }
                  else {
                      const copy = this.copyConfig(point, (point instanceof Array ? [] : {}), config);
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
      }
      getRouter() {
          return this.$router;
      }
      clickHandler(e, target) {
          if (e) {
              target = target || (e.target || e.srcElement);
              if (target && target.getAttribute) {
                  const trigger = target.getAttribute("trigger");
                  if (trigger) {
                      this._forView(target, view => view.app.trigger(trigger));
                      e.cancelBubble = true;
                      return e.preventDefault();
                  }
                  const route = target.getAttribute("route");
                  if (route) {
                      this._forView(target, view => view.show(route));
                      e.cancelBubble = true;
                      return e.preventDefault();
                  }
              }
          }
          const parent = target.parentNode;
          if (parent) {
              this.clickHandler(e, parent);
          }
      }
      getRoot() {
          return this.getSubView().getRoot();
      }
      refresh() {
          if (!this._subSegment) {
              return Promise.resolve(null);
          }
          return this.getSubView().refresh().then(view => {
              this.callEvent("app:route", [this.getUrl()]);
              return view;
          });
      }
      loadView(url) {
          const views = this.config.views;
          let result = null;
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
              .then(module => module.__esModule ? module.default : module)
              .catch(err => this._loadError(url, err));
          return result;
      }
      _forView(target, handler) {
          const view = this.webix.$$(target);
          if (view) {
              handler(view.$scope);
          }
      }
      _loadViewDynamic(url) {
          return null;
      }
      createFromURL(chunk) {
          let view;
          if (chunk.isNew || !chunk.view) {
              view = this.loadView(chunk.page)
                  .then(ui => this.createView(ui, name, chunk.params));
          }
          else {
              view = Promise.resolve(chunk.view);
          }
          return view;
      }
      _override(ui) {
          const over = this.config.override;
          if (over) {
              let dv;
              while (ui) {
                  dv = ui;
                  ui = over.get(ui);
              }
              return dv;
          }
          return ui;
      }
      createView(ui, name, params) {
          ui = this._override(ui);
          let obj;
          if (typeof ui === "function") {
              if (ui.prototype instanceof JetAppBase) {
                  return new ui({ app: this, name, params, router: SubRouter });
              }
              else if (ui.prototype instanceof JetBase) {
                  return new ui(this, { name, params });
              }
              else {
                  ui = ui(this);
              }
          }
          if (ui instanceof JetBase) {
              obj = ui;
          }
          else {
              obj = new JetViewRaw(this, { name, ui });
          }
          return obj;
      }
      show(url, config) {
          if (url && this.app && url.indexOf("//") == 0)
              return this.app.show(url.substr(1), config);
          return this.render(this._container, url || this.config.start, config);
      }
      trigger(name, ...rest) {
          this.apply(name, rest);
      }
      apply(name, data) {
          this.callEvent(name, data);
      }
      action(name) {
          return this.webix.bind(function (...rest) {
              this.apply(name, rest);
          }, this);
      }
      on(name, handler) {
          this.attachEvent(name, handler);
      }
      use(plugin, config) {
          plugin(this, null, config);
      }
      error(name, er) {
          this.callEvent(name, er);
          this.callEvent("app:error", er);
          if (this.config.debug) {
              for (var i = 0; i < er.length; i++) {
                  console.error(er[i]);
                  if (er[i] instanceof Error) {
                      let text = er[i].message;
                      if (text.indexOf("Module build failed") === 0) {
                          text = text.replace(/\x1b\[[0-9;]*m/g, "");
                          document.body.innerHTML = `<pre style='font-size:16px; background-color: #ec6873; color: #000; padding:10px;'>${text}</pre>`;
                      }
                      else {
                          text += "<br><br>Check console for more details";
                          this.webix.message({ type: "error", text: text, expire: -1 });
                      }
                  }
              }
              debugger;
          }
      }
      render(root, url, config) {
          this._container = (typeof root === "string") ?
              this.webix.toNode(root) :
              (root || document.body);
          const firstInit = !this.$router;
          let path = null;
          if (firstInit) {
              if (_once && "tagName" in this._container) {
                  this.webix.event(document.body, "click", e => this.clickHandler(e));
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
          const params = config ? config.params : this.config.params || null;
          const top = this.getSubView();
          const segment = this._subSegment;
          const ready = segment
              .show({ url: path, params }, top)
              .then(() => this.createFromURL(segment.current()))
              .then(view => view.render(root, segment))
              .then(base => {
              this.$router.set(segment.route.path, { silent: true });
              this.callEvent("app:route", [this.getUrl()]);
              return base;
          });
          this.ready = this.ready.then(() => ready);
          return ready;
      }
      getSubView() {
          if (this._subSegment) {
              const view = this._subSegment.current().view;
              if (view)
                  return view;
          }
          return new JetView(this, {});
      }
      require(type, url) { return null; }
      _first_start(route) {
          this._segment = route;
          const cb = (a) => setTimeout(() => {
              this.show(a).catch(e => {
                  if (!(e instanceof NavigationBlocked))
                      throw e;
              });
          }, 1);
          this.$router = new (this.config.router)(cb, this.config, this);
          if (this._container === document.body && this.config.animation !== false) {
              const node = this._container;
              this.webix.html.addCss(node, "webixappstart");
              setTimeout(() => {
                  this.webix.html.removeCss(node, "webixappstart");
                  this.webix.html.addCss(node, "webixapp");
              }, 10);
          }
          if (!route) {
              let urlString = this.$router.get();
              if (!urlString) {
                  urlString = this.config.start;
                  this.$router.set(urlString, { silent: true });
              }
              route = new Route(urlString, 0);
          }
          else if (this.app) {
              const now = route.current().view;
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
      }
      _loadError(url, err) {
          this.error("app:error:resolve", [err, url]);
          return { template: " " };
      }
      addSubView(obj, target, config) {
          const url = obj.$subview !== true ? obj.$subview : null;
          const name = obj.name || (url ? this.webix.uid() : "default");
          target.id = obj.id || "s" + this.webix.uid();
          const view = config[name] = {
              id: target.id,
              url,
              branch: obj.branch,
              popup: obj.popup,
              params: obj.params
          };
          return view.popup ? null : target;
      }
  }
  class HashRouter {
      constructor(cb, config) {
          this.config = config || {};
          this._detectPrefix();
          this.cb = cb;
          window.onpopstate = () => this.cb(this.get());
      }
      set(path, config) {
          if (this.config.routes) {
              const compare = path.split("?", 2);
              for (const key in this.config.routes) {
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
              setTimeout(() => this.cb(path), 1);
          }
      }
      get() {
          let path = this._getRaw().replace(this.prefix, "").replace(this.sufix, "");
          path = (path !== "/" && path !== "#") ? path : "";
          if (this.config.routes) {
              const compare = path.split("?", 2);
              const key = this.config.routes[compare[0]];
              if (key) {
                  path = key + (compare.length > 1 ? "?" + compare[1] : "");
              }
          }
          return path;
      }
      _detectPrefix() {
          const sufix = this.config.routerPrefix;
          this.sufix = "#" + ((typeof sufix === "undefined") ? "!" : sufix);
          this.prefix = document.location.href.split("#", 2)[0];
      }
      _getRaw() {
          return document.location.href;
      }
  }
  let isPatched = false;
  function patch(w) {
      if (isPatched || !w) {
          return;
      }
      isPatched = true;
      const win = window;
      if (!win.Promise) {
          win.Promise = w.promise;
      }
      const version = w.version.split(".");
      if (version[0] * 10 + version[1] * 1 < 53) {
          w.ui.freeze = function (handler) {
              const res = handler();
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
      const baseAdd = w.ui.baselayout.prototype.addView;
      const baseRemove = w.ui.baselayout.prototype.removeView;
      const config = {
          addView(view, index) {
              if (this.$scope && this.$scope.webixJet && !view.queryView) {
                  const jview = this.$scope;
                  const subs = {};
                  view = jview.app.copyConfig(view, {}, subs);
                  baseAdd.apply(this, [view, index]);
                  for (const key in subs) {
                      jview._renderFrame(key, subs[key], null).then(() => {
                          jview._subs[key] = subs[key];
                      });
                  }
                  return view.id;
              }
              else {
                  return baseAdd.apply(this, arguments);
              }
          },
          removeView() {
              baseRemove.apply(this, arguments);
              if (this.$scope && this.$scope.webixJet) {
                  const subs = this.$scope._subs;
                  for (const key in subs) {
                      const test = subs[key];
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
          $init(cfg) {
              this.$app = new this.app(cfg);
              const id = w.uid().toString();
              cfg.body = { id };
              this.$ready.push(function () {
                  this.callEvent("onInit", [this.$app]);
                  this.$app.render({ id });
              });
          }
      }, w.ui.proxy, w.EventSystem);
  }
  class JetApp extends JetAppBase {
      constructor(config) {
          config.router = config.router || HashRouter;
          super(config);
          patch(this.webix);
      }
      require(type, url) {
          return require(type + "/" + url);
      }
  }
  class EmptyRouter {
      constructor(cb, _$config) {
          this.path = "";
          this.cb = cb;
      }
      set(path, config) {
          this.path = path;
          if (!config || !config.silent) {
              setTimeout(() => this.cb(path), 1);
          }
      }
      get() {
          return this.path;
      }
  }
  function UnloadGuard(app, view, config) {
      view.on(app, `app:guard`, function (_$url, point, promise) {
          if (point === view || point.contains(view)) {
              const res = config();
              if (res === false) {
                  promise.confirm = Promise.reject(new NavigationBlocked());
              }
              else {
                  promise.confirm = promise.confirm.then(() => res);
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
      const storage = config.storage;
      let lang = storage ? (storage.get("lang") || "en") : (config.lang || "en");
      function setLangData(name, data, silent) {
          if (data.__esModule) {
              data = data.default;
          }
          const pconfig = { phrases: data };
          if (config.polyglot) {
              app.webix.extend(pconfig, config.polyglot);
          }
          const poly = service.polyglot = new webixPolyglot(pconfig);
          poly.locale(name);
          service._ = app.webix.bind(poly.t, poly);
          lang = name;
          if (storage) {
              storage.put("lang", lang);
          }
          if (config.webix) {
              const locName = config.webix[name];
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
          const path = (config.path ? config.path + "/" : "") + name;
          const data = app.require("jet-locales", path);
          setLangData(name, data, silent);
      }
      const service = {
          getLang, setLang, setLangData, _: null, polyglot: null
      };
      app.setService("locale", service);
      setLang(lang, true);
  }
  function show(view, config, value) {
      if (config.urls) {
          value = config.urls[value] || value;
      }
      else if (config.param) {
          value = { [config.param]: value };
      }
      view.show(value);
  }
  function Menu(app, view, config) {
      const frame = view.getSubViewInfo().parent;
      const ui = view.$$(config.id || config);
      let silent = false;
      ui.attachEvent("onchange", function () {
          if (!silent) {
              show(frame, config, this.getValue());
          }
      });
      ui.attachEvent("onafterselect", function () {
          if (!silent) {
              let id = null;
              if (ui.setValue) {
                  id = this.getValue();
              }
              else if (ui.getSelectedId) {
                  id = ui.getSelectedId();
              }
              show(frame, config, id);
          }
      });
      view.on(app, `app:route`, function () {
          let name = "";
          if (config.param) {
              name = view.getParam(config.param, true);
          }
          else {
              const segment = frame.getUrl()[1];
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
  const baseicons = {
      good: "check",
      error: "warning",
      saving: "refresh fa-spin"
  };
  const basetext = {
      good: "Ok",
      error: "Error",
      saving: "Connecting..."
  };
  function Status(app, view, config) {
      let status = "good";
      let count = 0;
      let iserror = false;
      let expireDelay = config.expire;
      if (!expireDelay && expireDelay !== false) {
          expireDelay = 2000;
      }
      const texts = config.texts || basetext;
      const icons = config.icons || baseicons;
      if (typeof config === "string") {
          config = { target: config };
      }
      function refresh(content) {
          const area = view.$$(config.target);
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
          const dp = app.webix.dp(data);
          if (dp) {
              view.on(dp, "onAfterDataSend", start);
              view.on(dp, "onAfterSaveError", (_id, _obj, response) => fail(response));
              view.on(dp, "onAfterSave", success);
          }
      }
      app.setService("status", {
          getStatus,
          setStatus,
          track
      });
      if (config.remote) {
          view.on(app.webix, "onRemoteCall", start);
      }
      if (config.ajax) {
          view.on(app.webix, "onBeforeAjax", (_mode, _url, _data, _request, _headers, _files, promise) => {
              start(promise);
          });
      }
      if (config.data) {
          track(config.data);
      }
  }
  function Theme(app, _view, config) {
      config = config || {};
      const storage = config.storage;
      let theme = storage ?
          (storage.get("theme") || "flat-default")
          :
              (config.theme || "flat-default");
      const service = {
          getTheme() { return theme; },
          setTheme(name, silent) {
              const parts = name.split("-");
              const links = document.getElementsByTagName("link");
              for (let i = 0; i < links.length; i++) {
                  const lname = links[i].getAttribute("title");
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
      for (let i = 0; i < route.length; i++) {
          data[route[i]] = url[i + 1] ? url[i + 1].page : "";
      }
  }
  function UrlParam(app, view, config) {
      const route = config.route || config;
      const data = {};
      view.on(app, "app:urlchange", function (subview, segment) {
          if (view === subview) {
              copyParams(data, segment.suburl(), route);
              segment.size(route.length + 1);
          }
      });
      const os = view.setParam;
      const og = view.getParam;
      view.setParam = function (name, value, show) {
          const index = route.indexOf(name);
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
          const val = data[key];
          if (typeof val !== "undefined") {
              return val;
          }
          return og.call(this, key, mode);
      };
      copyParams(data, view.getUrl(), route);
  }
  function User(app, _view, config) {
      config = config || {};
      const login = config.login || "/login";
      const logout = config.logout || "/logout";
      const afterLogin = config.afterLogin || app.config.start;
      const afterLogout = config.afterLogout || "/login";
      const ping = config.ping || 5 * 60 * 1000;
      const model = config.model;
      let user = config.user;
      const service = {
          getUser() {
              return user;
          },
          getStatus(server) {
              if (!server) {
                  return user !== null;
              }
              return model.status().catch(() => null).then(data => {
                  user = data;
              });
          },
          login(name, pass) {
              return model.login(name, pass).then(data => {
                  user = data;
                  if (!data) {
                      throw new Error("Access denied");
                  }
                  app.callEvent("app:user:login", [user]);
                  app.show(afterLogin);
              });
          },
          logout() {
              user = null;
              return model.logout().then(res => {
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
      app.attachEvent(`app:guard`, function (url, _$root, obj) {
          if (config.public && config.public(url)) {
              return true;
          }
          if (typeof user === "undefined") {
              obj.confirm = service.getStatus(true).then(() => canNavigate(url, obj));
          }
          return canNavigate(url, obj);
      });
      if (ping) {
          setInterval(() => service.getStatus(true), ping);
      }
  }
  let webix$1 = window.webix;
  if (webix$1) {
      patch(webix$1);
  }
  const plugins = {
      UnloadGuard, Locale, Menu, Theme, User, Status, UrlParam
  };
  const w = window;
  if (!w.Promise) {
      w.Promise = w.webix.promise;
  }

  let once = false;
  function initRLayout() {
      if (once)
          return;
      once = true;
      webix.protoUI({
          name: "r-layout",
          sizeTrigger(app, handler, value) {
              this._compactValue = value;
              this._compactHandler = handler;
              this._app = app;
              const config = app.config;
              this._forceCompact = typeof config.params.forceCompact !== "undefined";
              this._compactWidth = config.compactWidth;
              if (!this._forceCompact)
                  this._checkTrigger(this.$view.width, value);
          },
          _checkTrigger(x, value) {
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
          $setSize(x, y) {
              if (this._forceCompact || this._checkTrigger(x, this._compactValue))
                  webix.ui.layout.prototype.$setSize.call(this, x, y);
              if (this._app)
                  this._app.callEvent("view:resize", []);
          },
      }, webix.ui.layout);
  }

  function initJetWin(app) {
      let appId;
      const service = {
          updateConfig(config) {
              const appView = app.getRoot();
              const appNode = appView.$view;
              if (!appId) {
                  if (appNode.id)
                      appId = appNode.id;
                  else
                      appNode.id = appId = "webix_" + webix.uid();
                  webix.html.addStyle(`.webix_win_inside *:not(.webix_modal_box):not(.webix_modal_cover){ z-index: 0; }`);
                  webix.html.addStyle(`#${appId}{ position: relative; }`);
                  webix.html.addStyle(`#${appId} .webix_window{ z-index:2 !important; }`);
                  webix.html.addStyle(`#${appId} .webix_disabled{ z-index:1 !important; }`);
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
              let firstShow = true;
              const defaultHandler = config.on.onShow;
              config.on.onShow = function () {
                  if (defaultHandler)
                      defaultHandler.apply(this, arguments);
                  if (firstShow) {
                      this.$setSize = (x, y) => {
                          setSize(this, appView, true);
                          webix.ui.window.prototype.$setSize.apply(this, [x, y]);
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
      const appWidth = appView.$width;
      const appHeight = appView.$height;
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
      const appView = app.getRoot();
      win.attachEvent("onHide", () => {
          if (!appView.$destructed) {
              webix.html.removeCss(appView.$view, "webix_win_inside");
              appView.enable();
          }
      });
      const resizeEv = app.attachEvent("view:resize", () => {
          setSize(win, appView);
      });
      win.attachEvent("onDestruct", () => {
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
          get: () => source[key],
          set: value => (source[key] = value),
      });
  }
  function createState(data, config) {
      config = config || {};
      const handlers = {};
      const out = {};
      const observe = function (mask, handler) {
          const key = uid();
          handlers[key] = { mask, handler };
          if (mask === "*")
              handler(out, empty, mask);
          else
              handler(out[mask], empty, mask);
          return key;
      };
      const extend = function (data, sconfig) {
          sconfig = sconfig || config;
          for (const key in data) {
              if (data.hasOwnProperty(key)) {
                  const test = data[key];
                  if (sconfig.nested && typeof test === "object" && test) {
                      out[key] = createState(test, sconfig);
                  }
                  else {
                      reactive(out, test, key, notify);
                  }
              }
          }
      };
      const observeEnd = function (id) {
          delete handlers[id];
      };
      const queue = [];
      let waitInQueue = false;
      var batch = function (code) {
          if (typeof code !== "function") {
              const values = code;
              code = () => {
                  for (const key in values)
                      out[key] = values[key];
              };
          }
          waitInQueue = true;
          code(out);
          waitInQueue = false;
          while (queue.length) {
              const obj = queue.shift();
              notify.apply(this, obj);
          }
      };
      const notify = function (key, old, value, meta) {
          if (waitInQueue) {
              queue.push([key, old, value, meta]);
              return;
          }
          const list = Object.keys(handlers);
          for (let i = 0; i < list.length; i++) {
              const obj = handlers[list[i]];
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

  class ChartView extends JetView {
      config() {
          const state = (this.State = this.getParam("state", true));
          const chart = {
              view: "chart",
              $mainView: true,
              borderless: true,
              localId: "data",
              xAxis: {},
              yAxis: {},
          };
          webix.extend(chart, webix.copy(state.chart), true);
          const type = chart.type;
          if (type == "barH" || type == "stackedBarH") {
              if (!chart.yAxis.template)
                  chart.yAxis.template = obj => obj[obj.length - 1];
          }
          else if (!chart.xAxis.template)
              chart.xAxis.template = obj => obj[obj.length - 1];
          const commonAxisSettings = {
              lines: chart.lines,
          };
          if (chart.scaleColor)
              commonAxisSettings.color = commonAxisSettings.lineColor =
                  chart.scaleColor;
          webix.extend(chart.xAxis, commonAxisSettings, true);
          webix.extend(chart.yAxis, commonAxisSettings, true);
          if (this.IsPieBased()) {
              webix.extend(chart, {
                  multilevel: true,
                  tooltip: this.ValueFormat,
                  color: "#color#",
                  type: type + (chart["3D"] ? "3D" : ""),
                  pieInnerText: chart["pieInnerText"] ? this.ValueFormat : "",
              }, true);
          }
          return chart;
      }
      init() {
          this.Local = this.app.getService("local");
          this.LoadData();
          this.on(this.State.$changes, "structure", (structure, old) => {
              if (old)
                  this.LoadData();
          });
          this.on(this.State.$changes, "chart", (val, o) => {
              if (o)
                  this.refresh();
          });
      }
      LoadData() {
          return this.Local.getData().then(data => {
              this.UpdateChart(data);
          });
      }
      UpdateChart(data) {
          this.$$("data").clearAll();
          if (!this.IsPieBased()) {
              this.$$("data").removeAllSeries();
              this.SetSeries(data.values);
          }
          this.SetLegend(data.values);
          this.$$("data").parse(data.data);
      }
      IsPieBased(type) {
          if (!type)
              type = this.State.chart.type;
          return type == "pie" || type == "donut";
      }
      SetSeries(values) {
          for (let i = 0; i < values.length; i++)
              this.$$("data").addSeries(this.GetSeriesConfig(values[i], i));
      }
      GetSeriesConfig(settings, i, type) {
          type = type || this.State.chart.type;
          return {
              type,
              value: obj => obj[i],
              alpha: type == "area" || type == "splineArea" ? 0.7 : 1,
              color: settings.color,
              tooltip: obj => this.ValueFormat({ value: obj[i] }),
              item: {
                  color: settings.color,
                  borderColor: settings.color,
              },
              line: {
                  color: settings.color,
              },
          };
      }
      SetLegend(values) {
          const _ = this.app.getService("locale")._;
          values = values.map(v => {
              const operation = v.operation;
              let text = v.text;
              if (operation == "complex")
                  text = this.Local.fixMath(text);
              else if (operation) {
                  text = text
                      .split(",")
                      .map(t => this.Local.getField(t).value)
                      .join(", ");
                  text = `${text} (${_(operation)})`;
              }
              return { color: v.color, text };
          });
          const legend = webix.extend({
              values,
              valign: "middle",
              align: "right",
              layout: "y",
          }, this.State.chart.legend || {}, true);
          this.$$("data").define({ legend });
      }
      ValueFormat(item) {
          return item.text || parseFloat(item.value || 0).toFixed(3);
      }
  }

  webix.protoUI({
      name: "pivot-portlet",
      $reorderOnly: true,
      $drag: function (object) {
          webix.html.addCss(this.$view, "portlet_in_drag");
          const ctx = webix.DragControl.getContext();
          ctx.source = ctx.from = object;
          webix.callEvent("onClick", []);
          const local = this.$scope.app.getService("local");
          const values = this.getChildViews()[0].getValues();
          let text = "";
          if (values.operation == "complex")
              text = local.fixMath(values.math);
          else {
              text = values.name ? local.getField(values.name).value : "";
              if (values.name2)
                  text += (text ? ", " : "") + local.getField(values.name2).value;
              else if (!text) {
                  const _ = this.$scope.app.getService("locale")._;
                  text = _("Field not defined");
              }
              else if (values.operation)
                  text += ` (${values.operation})`;
          }
          const askin = webix.skin.$active;
          const style = `width:${this.$width - askin.inputHeight}px;height:${this.$height}px;`;
          return `<div class="webix_pivot_portlet_drag" style="${style}">
				<span class="webix_icon ${this.config.icon}"></span>${text}
			</div>`;
      },
  }, webix.ui.portlet);

  class Property extends JetView {
      constructor(app, name, config) {
          super(app, name);
          if (!config)
              config = {};
          this.plusLabel = config.plusLabel;
          this.field = config.field;
      }
      config() {
          const askin = webix.skin.$active;
          return {
              borderless: true,
              type: "clean",
              paddingY: 8,
              rows: [
                  {
                      localId: "forms",
                      type: "clean",
                      rows: [],
                  },
                  {
                      template: `<div class="webix_pivot_handle_add_value">
						<span class="webix_icon wxi-plus-circle"></span><span>${this.plusLabel}</span>
					</div>`,
                      css: "webix_pivot_add_value",
                      height: askin.inputHeight - 2 * askin.inputPadding,
                      localId: "addValue",
                      onClick: {
                          webix_pivot_handle_add_value: () => {
                              const forms = this.$$("forms").getChildViews();
                              this.Add(null, forms.length);
                              const input = forms[forms.length - 1].queryView({ name: "name" });
                              if (input) {
                                  input.focus();
                                  webix.html.triggerEvent(input.getInputNode(), "MouseEvent", "click");
                              }
                              if (this.field != "values" &&
                                  forms.length == this.app.getState().fields.length)
                                  this.$$("addValue").hide();
                          },
                      },
                  },
              ],
          };
      }
      init() {
          this.on(webix, "onAfterPortletMove", source => {
              if (source == this.$$("forms"))
                  this.app.callEvent("property:change", [this.field, this.GetValue()]);
          });
          this.on(webix, "onPortletDrag", function (active, target) {
              if (active.$reorderOnly)
                  return active.getParentView() === target.getParentView();
          });
      }
      ListTemplate(obj) {
          const input = this._activeInput;
          const wavg = this.field == "values" &&
              input &&
              !input.$destructed &&
              input.getFormView().elements.operation.getValue() == "wavg";
          const corrections = this.getParentView().GetCorrections()[this.field];
          const value = obj.value;
          if (!wavg && corrections) {
              const includes = this.CheckCorrections(corrections, obj.id);
              let css = "webix_pivot_list_marker";
              if (includes)
                  css += " webix_pivot_list_marker_fill";
              return `<div class="${css}"> ${value}</div>`;
          }
          else
              return value;
      }
      CheckCorrections(corrections, id) {
          if (this._activeInput && id == this._activeInput.getValue())
              return true;
          const structure = this.app.getStructure();
          for (let i = 0; i < corrections.length; i++) {
              const name = corrections[i];
              const val = structure[name];
              if (val) {
                  if (typeof val == "string") {
                      if (val == id)
                          return true;
                  }
                  else {
                      for (let j = 0; j < val.length; j++) {
                          let value = val[j];
                          if (value.name)
                              value = value.name;
                          if (value == id)
                              return true;
                      }
                  }
              }
          }
          return false;
      }
      GetValue() {
          const forms = this.$$("forms").getChildViews();
          let arr = [];
          forms.forEach(form => {
              const val = form.getChildViews()[0].getValues().name;
              if (val)
                  arr.push(val);
          });
          return arr;
      }
      SetValue(val) {
          const layout = this.$$("forms");
          const forms = layout.getChildViews();
          for (let i = forms.length - 1; i >= 0; i--)
              layout.removeView(forms[i]);
          for (let i = 0; i < val.length; i++) {
              if (!val[i].external)
                  this.Add(val[i], i);
          }
      }
      Add(val, i) {
          this.$$("forms").addView({
              view: "pivot-portlet",
              mode: "replace",
              borderless: true,
              body: {
                  view: "form",
                  paddingY: 0,
                  paddingX: 2,
                  elements: [
                      {
                          margin: 2,
                          cols: this.ItemConfig(val, i),
                      },
                  ],
                  on: {
                      onChange: (val, old, config) => {
                          if (config == "user")
                              this.app.callEvent("property:change", [
                                  this.field,
                                  this.GetValue(),
                              ]);
                      },
                  },
              },
          });
      }
      ItemConfig(val) {
          return [
              { width: webix.skin.$active.inputHeight },
              {
                  view: "richselect",
                  name: "name",
                  value: this.PrepareValue(val),
                  hidden: val && val.operation == "complex",
                  options: {
                      css: "webix_pivot_suggest",
                      data: this.app.getState().fields,
                      on: {
                          onBeforeShow: function () {
                              const input = webix.$$(this.config.master);
                              const master = input.$scope;
                              const data = master.GetValue();
                              master._activeInput = input;
                              this.getList().filter(val => master.FilterSuggest(data, input.getValue(), val));
                          },
                      },
                      body: {
                          template: obj => this.ListTemplate(obj),
                      },
                  },
              },
              {
                  view: "icon",
                  icon: "wxi-close",
                  css: "webix_pivot_close_icon",
                  pivotPropertyRemove: true,
                  click: function () {
                      const master = this.$scope;
                      master.$$("addValue").show();
                      master
                          .$$("forms")
                          .removeView(this.queryView("pivot-portlet", "parent"));
                      master.app.callEvent("property:change", [
                          master.field,
                          master.GetValue(),
                      ]);
                  },
              },
          ];
      }
      PrepareValue(val) {
          if (val) {
              if (typeof val == "object")
                  val = val.name;
              if (webix.isArray(val))
                  val = val[0];
          }
          else
              val = "";
          return val;
      }
      FilterSuggest(data, activeVal, val) {
          val = val.id;
          if (val == activeVal)
              return true;
          return !data.find(item => {
              if (item.name)
                  item = item.name;
              return val == item;
          });
      }
  }

  function isSymbolAllowed(char) {
      const code = char.charCodeAt(0);
      return code <= 122 ? (code >= 48 && code <= 57) || code >= 65 : code > 191;
  }
  function getLastSymbolIndex(str, right) {
      if (right) {
          for (let i = 0; i < str.length; i++)
              if (!isSymbolAllowed(str[i]))
                  return i;
          return str.length;
      }
      else
          for (let i = str.length - 1; i >= 0; i--)
              if (!isSymbolAllowed(str[i]))
                  return i + 1;
      return 0;
  }
  function startsWith(text, start) {
      return text.toLowerCase().indexOf(start.toLowerCase()) === 0;
  }
  webix.protoUI({
      name: "suggest-math",
      $enterKey() {
          const list = this.getList();
          if (this.isVisible() && !list.getSelectedId() && list.count()) {
              list.select(list.data.order[1]);
              this._addFirst = 1;
          }
          webix.ui.suggest.prototype.$enterKey.apply(this, arguments);
          webix.delay(() => {
              delete this._addFirst;
          });
      },
      defaults: {
          filter(item, value) {
              const editor = webix.$$(this.config.master);
              const cursor = editor.getInputNode().selectionStart;
              const str = value.substring(0, cursor);
              const search = str.substring(getLastSymbolIndex(str));
              const nextSymbol = value.charAt(cursor);
              if (search && (cursor === value.length || !isSymbolAllowed(nextSymbol)))
                  value = search;
              if (item.disabled) {
                  const app = editor.$scope.app;
                  if (item.id == "$fields") {
                      const fields = app.getState().fields;
                      return !!fields.find(obj => startsWith(obj.value, value));
                  }
                  else if (item.id == "$methods") {
                      const _ = app.getService("locale")._;
                      const operations = app.getService("local").operations;
                      return !!operations.find(method => startsWith(_(method.id), value));
                  }
              }
              return startsWith(item.value, value);
          },
      },
  }, webix.ui.suggest);
  webix.protoUI({
      name: "math-editor",
      $init() {
          this.$view.className += " webix_el_text";
      },
      $onBlur() {
          const suggest = webix.$$(this.config.suggest);
          const suggestClick = suggest.$view.contains(document.activeElement);
          webix.delay(() => {
              const focus = webix.UIManager.getFocus();
              if (focus && focus.config.pivotPropertyRemove)
                  return;
              if (!suggestClick)
                  this.callEvent("onChange", [this.getValue(), null, "user"]);
          });
      },
      setValue() {
          const suggest = webix.$$(this.config.suggest);
          if (suggest.isVisible() || suggest._addFirst)
              return;
          webix.ui.text.prototype.setValue.apply(this, arguments);
      },
      $setValueHere(value) {
          this.setValueHere(value);
      },
      setValueHere(value) {
          const formula = this.getValue();
          const cursor = this.getInputNode().selectionStart;
          let str1 = formula.substring(0, cursor);
          let str2 = formula.substring(cursor);
          const lastSymbol = getLastSymbolIndex(str2, true);
          str1 += str2.substring(0, lastSymbol);
          str2 = str2.substring(lastSymbol);
          if (str1[str1.length - 1] == "(")
              str1 = str1.substring(0, str1.length - 1);
          str1 = str1.substring(0, getLastSymbolIndex(str1)) + value;
          const operations = this.$scope.app.getService("local").operations;
          const isMethod = operations.find(obj => obj.value == value);
          if (isMethod)
              str1 += str2[0] == "(" ? "" : "(";
          this.$setValue(str1 + str2);
          this.getInputNode().setSelectionRange(str1.length, str1.length);
      },
  }, webix.ui.text);

  class ValuesProperty extends Property {
      constructor(app, name, config) {
          super(app, name, config);
          this.Local = this.app.getService("local");
          this._ = this.app.getService("locale")._;
          this.typeName = "operation";
          this.plusLabel = this._("Add value");
          this.field = "values";
          this.operations = this.Local.operations;
          this.operations.map(operation => {
              operation.value = this._(operation.id);
              return operation;
          });
      }
      init() {
          super.init();
          this.State = this.app.getState();
          this.on(this.State.$changes, "mode", () => {
              this.ToggleColors();
          });
      }
      GetValue() {
          const forms = this.$$("forms").getChildViews();
          const arr = [];
          forms.forEach(form => {
              const values = form.getChildViews()[0].getValues({ hidden: false });
              if (!webix.isUndefined(values.name2)) {
                  if (values.name && values.name2) {
                      values.name = [values.name, values.name2];
                      delete values.name2;
                  }
                  else
                      values.name = "";
              }
              if (values.name == "" || values.math == "")
                  return;
              if (values.math)
                  values.math = this.OutComplexMath(values.math);
              arr.push(values);
          });
          return arr;
      }
      ItemConfig(val, i) {
          const config = super.ItemConfig(val);
          let operation;
          if (val)
              operation = val.operation;
          else {
              const def = this.app.config.defaultOperation;
              const defIndex = Math.max(this.operations.findIndex(a => a.id == def), 0);
              operation = this.operations[defIndex].id;
          }
          config.splice(2, 0, {
              view: "richselect",
              name: "operation",
              width: 110,
              value: operation,
              options: {
                  css: "webix_pivot_suggest",
                  data: this.operations.filter(obj => obj.fields <= 2 || obj.id == "complex"),
              },
              on: {
                  onChange: function (v) {
                      this.$scope.SetOperation(v, this);
                  },
              },
          });
          config.splice(2, 0, {
              view: "richselect",
              hidden: this.Local.getOperation(operation).fields != 2,
              value: val && webix.isArray(val.name) ? val.name[1] : "",
              name: "name2",
              options: {
                  css: "webix_pivot_suggest",
                  data: this.app.getState().fields,
              },
          });
          config.splice(1, 0, {
              view: "math-editor",
              name: "math",
              hidden: !val || val.operation != "complex",
              value: val && val.math ? this.Local.fixMath(val.math) : "",
              suggest: {
                  view: "suggest-math",
                  data: this.SuggestData(),
              },
          });
          const mini = webix.skin.$name == "mini" || webix.skin.$name == "compact";
          const palette = this.Local.getPalette();
          const color = (val && val.color) || this.Local.getValueColor(i);
          config.splice(1, 0, {
              view: "colorpicker",
              hidden: this.State.mode != "chart",
              name: "color",
              css: "webix_pivot_value_color",
              value: color,
              width: mini ? 30 : 38,
              suggest: {
                  type: "colorboard",
                  body: {
                      width: 150,
                      height: 150,
                      view: "colorboard",
                      palette,
                  },
              },
          });
          return config;
      }
      ToggleColors() {
          const mode = this.State.mode;
          const layout = this.$$("forms");
          const forms = layout.getChildViews();
          for (let i = 0; i < forms.length; i++) {
              const input = forms[i].getChildViews()[0].elements.color;
              if (mode == "chart")
                  input.show();
              else
                  input.hide();
          }
      }
      FilterSuggest() {
          return true;
      }
      SetOperation(val, view) {
          const form = view.getFormView();
          const elements = form.elements;
          if (val == "complex") {
              elements.name.hide();
              elements.name2.hide();
              elements.math.show();
              elements.name.setValue();
              elements.name2.setValue();
          }
          else if (this.Local.getOperation(val).fields == 2) {
              elements.name.show();
              elements.name2.show();
              elements.math.hide();
          }
          else {
              elements.name.show();
              elements.name2.hide();
              elements.math.hide();
          }
      }
      SuggestData() {
          return [
              {
                  value: this._("Fields"),
                  id: "$fields",
                  disabled: true,
                  $css: "webix_pivot_values_section",
              },
              ...this.app.getState().fields,
              {
                  value: this._("Methods"),
                  id: "$methods",
                  disabled: true,
                  $css: "webix_pivot_values_section",
              },
              ...this.operations.filter(obj => obj.id != "complex"),
          ];
      }
      OutComplexMath(math) {
          const fields = this.app.getState().fields;
          const fieldsRegex = new RegExp("(\\(|\\s|,|^)(" +
              fields
                  .map(field => field.value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"))
                  .join("|") +
              ")(\\)|\\s|,|$)", "g");
          const fieldsMatch = Array.from(math.matchAll(fieldsRegex));
          for (let i = fieldsMatch.length - 1; i >= 0; i--) {
              const match = fieldsMatch[i];
              math =
                  math.substring(0, match.index + match[1].length) +
                      fields.find(obj => obj.value == match[2]).id +
                      math.substring(match.index + match[0].length - match[3].length, math.length);
          }
          const methods = this.operations;
          const methodsRegex = new RegExp("(\\(|,|\\+|-|\\/|\\*|\\s|^)(" +
              methods
                  .map(method => method.value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"))
                  .join("|") +
              ")\\(", "g");
          const methodsMatch = Array.from(math.matchAll(methodsRegex));
          for (let i = methodsMatch.length - 1; i >= 0; i--) {
              const match = methodsMatch[i];
              math =
                  math.substring(0, match.index + match[1].length) +
                      this.operations.find(operation => operation.value == match[2]).id +
                      math.substring(match.index + match[0].length - 1, math.length);
          }
          return math;
      }
  }

  class GroupProperty extends Property {
      constructor(app, name) {
          super(app, name);
          this.field = "groupBy";
      }
      config() {
          return {
              padding: 10,
              rows: [
                  {
                      view: "richselect",
                      localId: "group",
                      options: {
                          css: "webix_pivot_suggest",
                          data: this.app.getState().fields,
                          body: {
                              template: obj => this.ListTemplate(obj),
                          },
                          on: {
                              onBeforeShow: () => {
                                  this._activeInput = this.$$("group");
                              },
                          },
                      },
                      on: {
                          onChange: (value, oldValue, source) => {
                              if (source == "user")
                                  this.app.callEvent("property:change", [this.field, value]);
                          },
                      },
                  },
              ],
          };
      }
      init() {
          this.State = this.getParam("state", true);
      }
      GetValue() {
          return this.$$("group").getValue();
      }
      SetValue(val) {
          this.$$("group").setValue(val);
      }
  }

  class ChartSettings extends JetView {
      config() {
          const _ = this.app.getService("locale")._;
          return {
              view: "form",
              complexData: true,
              padding: 10,
              elementsConfig: {
                  labelWidth: 120,
              },
              elements: [
                  {
                      name: "type",
                      view: "richselect",
                      value: "bar",
                      options: {
                          css: "webix_pivot_suggest",
                          data: [
                              { id: "bar", value: _("Bar") },
                              { id: "line", value: _("Line") },
                              { id: "radar", value: _("Radar") },
                              { id: "area", value: _("Area") },
                              { id: "spline", value: _("Spline") },
                              { id: "splineArea", value: _("Spline Area") },
                              { id: "pie", value: _("Pie") },
                              { id: "donut", value: _("Donut") },
                          ],
                      },
                  },
                  {
                      name: "xAxis.title",
                      view: "text",
                      label: _("X axis title"),
                      batch: "axis",
                  },
                  {
                      name: "yAxis.title",
                      view: "text",
                      label: _("Y axis title"),
                      batch: "axis",
                  },
                  {
                      name: "scaleColor",
                      batch: "scale",
                      view: "colorpicker",
                      editable: true,
                      label: _("Scale color"),
                      suggest: {
                          type: "colorboard",
                          body: {
                              width: 150,
                              height: 150,
                              view: "colorboard",
                              palette: this.app.getService("local").getPalette(),
                          },
                      },
                  },
                  {
                      name: "3D",
                      view: "checkbox",
                      batch: "pie",
                      labelWidth: 0,
                      labelRight: _("3D"),
                  },
                  {
                      name: "pieInnerText",
                      view: "checkbox",
                      batch: "pie",
                      labelWidth: 0,
                      labelRight: _("Show values inside"),
                  },
                  {
                      name: "stacked",
                      view: "checkbox",
                      batch: "stacked",
                      labelWidth: 0,
                      labelRight: _("Stacked"),
                  },
                  {
                      name: "horizontal",
                      view: "checkbox",
                      batch: "bar",
                      labelWidth: 0,
                      labelRight: _("Horizontal"),
                  },
                  {
                      name: "scale",
                      batch: "scale",
                      view: "checkbox",
                      checkValue: "logarithmic",
                      uncheckValue: "linear",
                      labelWidth: 0,
                      labelRight: _("Logarithmic scale"),
                  },
                  {
                      name: "yAxis.lineShape",
                      view: "checkbox",
                      batch: "radar",
                      checkValue: "arc",
                      labelWidth: 0,
                      labelRight: _("Circled lines"),
                  },
                  {
                      name: "lines",
                      batch: "scale",
                      view: "checkbox",
                      labelWidth: 0,
                      labelRight: _("Lines"),
                  },
              ],
              on: {
                  onChange: (value, oldValue, source) => {
                      if (source == "user") {
                          const out = this.OutValues(this.getRoot().getValues());
                          this.innerChange = true;
                          this.State.chart = Object.assign({}, out);
                          this.HandleVisibility();
                          delete this.innerChange;
                      }
                  },
              },
          };
      }
      init() {
          this.State = this.getParam("state", true);
          this.on(this.State.$changes, "chart", chart => {
              if (!this.innerChange) {
                  this.getRoot().setValues(this.InValues(chart));
                  this.HandleVisibility();
              }
          });
      }
      HandleVisibility() {
          const form = this.getRoot();
          const type = form.getValues().type;
          const pieBased = type == "pie" || type == "donut";
          if (pieBased)
              form.showBatch("pie");
          else {
              form.showBatch("scale");
              if (type == "radar")
                  form.showBatch("radar", true);
              else {
                  form.showBatch("axis", true);
                  const bar = type == "bar";
                  if (bar || type == "area") {
                      if (bar)
                          form.showBatch("bar", true);
                      form.showBatch("stacked", true);
                  }
              }
          }
      }
      InValues(values) {
          values = webix.copy(values);
          const type = values.type.toLowerCase();
          const stackedArea = type == "stackedarea";
          if (type.indexOf("bar") != -1 || stackedArea) {
              if (type.indexOf("stacked") != -1)
                  values.stacked = 1;
              if (type.indexOf("h") != -1)
                  values.horizontal = 1;
              values.type = stackedArea ? "area" : "bar";
          }
          return values;
      }
      OutValues(values) {
          const bar = values.type == "bar";
          if (bar || values.type == "area") {
              if (bar && values.horizontal) {
                  values.type += "H";
                  delete values.horizontal;
              }
              if (values.stacked) {
                  values.type =
                      "stacked" + values.type[0].toUpperCase() + values.type.slice(1);
                  delete values.stacked;
              }
          }
          return values;
      }
  }

  class TableSettings extends JetView {
      config() {
          const _ = this.app.getService("locale")._;
          return {
              view: "form",
              padding: 10,
              elements: [
                  {
                      name: "cleanRows",
                      localId: "cleanRows",
                      view: "checkbox",
                      labelWidth: 0,
                      labelRight: _("Clean rows"),
                  },
                  {
                      view: "label",
                      height: 20,
                      label: _("Highlight"),
                  },
                  {
                      cols: [
                          {
                              name: "minX",
                              view: "checkbox",
                              labelWidth: 0,
                              labelRight: _("Min X"),
                          },
                          {
                              name: "maxX",
                              view: "checkbox",
                              labelWidth: 0,
                              labelRight: _("Max X"),
                          },
                          {
                              name: "minY",
                              view: "checkbox",
                              labelWidth: 0,
                              labelRight: _("Min Y"),
                          },
                          {
                              name: "maxY",
                              view: "checkbox",
                              labelWidth: 0,
                              labelRight: _("Max Y"),
                          },
                      ],
                  },
                  {
                      view: "label",
                      height: 20,
                      label: _("Footer"),
                  },
                  {
                      view: "radio",
                      name: "footer",
                      options: [
                          { id: 1, value: _("Off") },
                          { id: 2, value: _("On") },
                          { id: 3, value: _("Sum Only") },
                      ],
                      value: 1,
                  },
                  {
                      view: "label",
                      height: 20,
                      label: _("Total Column"),
                  },
                  {
                      view: "radio",
                      name: "totalColumn",
                      options: [
                          { id: 1, value: _("Off") },
                          { id: 2, value: _("On") },
                          { id: 3, value: _("Sum Only") },
                      ],
                      value: 1,
                  },
              ],
              on: {
                  onChange: (value, oldValue, source) => {
                      if (source == "user") {
                          const out = this.OutValues(this.getRoot().getValues());
                          this.innerChange = true;
                          this.State.datatable = Object.assign({}, out);
                          delete this.innerChange;
                      }
                  },
              },
          };
      }
      init() {
          this.State = this.getParam("state", true);
          this.on(this.State.$changes, "datatable", datatable => {
              if (!this.innerChange)
                  this.getRoot().setValues(this.InValues(datatable));
          });
          this.on(this.State.$changes, "mode", mode => {
              if (mode == "table")
                  this.$$("cleanRows").show();
              else
                  this.$$("cleanRows").hide();
          });
      }
      InValues(values) {
          values = webix.copy(values);
          if (values.footer)
              values.footer = values.footer == "sumOnly" ? 3 : 2;
          else
              values.footer = 1;
          if (values.totalColumn)
              values.totalColumn = values.totalColumn == "sumOnly" ? 3 : 2;
          else
              values.totalColumn = 1;
          return values;
      }
      OutValues(values) {
          switch (values.footer) {
              case "1":
                  delete values.footer;
                  break;
              case "2":
                  values.footer = true;
                  break;
              case "3":
                  values.footer = "sumOnly";
                  break;
          }
          switch (values.totalColumn) {
              case "1":
                  delete values.totalColumn;
                  break;
              case "2":
                  values.totalColumn = true;
                  break;
              case "3":
                  values.totalColumn = "sumOnly";
                  break;
          }
          return values;
      }
  }

  class ConfigView extends JetView {
      config() {
          const _ = this.app.getService("locale")._;
          this.State = this.app.getState();
          this.Compact = this.getParam("compact", true);
          const toolbar = {
              type: "form",
              borderless: true,
              padding: {
                  left: 16,
                  right: 14,
                  top: 8,
                  bottom: 4,
              },
              cols: [
                  {},
                  {
                      view: "button",
                      label: _("Done"),
                      hotkey: "esc",
                      autowidth: true,
                      css: "webix_primary",
                      click: () => this.ToggleForm(),
                  },
              ],
          };
          const structure = {
              borderless: true,
              view: "scrollview",
              scroll: "y",
              body: {
                  view: "accordion",
                  css: "webix_pivot_configuration",
                  localId: "settings",
                  multi: true,
                  type: "space",
                  padding: {
                      left: 16,
                      right: 16,
                      top: 4,
                      bottom: 16,
                  },
                  margin: 20,
                  rows: [
                      this.GroupConfig(_("Rows"), "pt-rows", {
                          name: "rows",
                          $subview: new Property(this.app, "", {
                              field: "rows",
                              plusLabel: _("Add row"),
                          }),
                      }, "table"),
                      this.GroupConfig(_("Columns"), "pt-columns", {
                          name: "columns",
                          $subview: new Property(this.app, "", {
                              field: "columns",
                              plusLabel: _("Add column"),
                          }),
                      }, "table"),
                      this.GroupConfig(_("Values"), "pt-values", {
                          name: "values",
                          $subview: ValuesProperty,
                      }),
                      this.GroupConfig(_("Group By"), "pt-group", {
                          name: "groupBy",
                          $subview: GroupProperty,
                      }, "chart"),
                      this.GroupConfig(_("Filters"), "pt-filter", {
                          name: "filters",
                          $subview: new Property(this.app, "", {
                              field: "filters",
                              plusLabel: _("Add filter"),
                          }),
                      }),
                      this.GroupConfig(_("Chart"), "pt-chart", {
                          $subview: ChartSettings,
                      }, "chart"),
                      this.GroupConfig(_("Table"), "wxi-columns", {
                          $subview: TableSettings,
                      }, "table"),
                      {},
                  ],
              },
          };
          return {
              margin: 0,
              rows: [toolbar, structure],
          };
      }
      init() {
          this.on(this.State.$changes, "readonly", (_v, o) => {
              if (!webix.isUndefined(o))
                  this.ToggleForm();
          });
      }
      ready() {
          this.on(this.app, "property:change", (field, value) => {
              this.HandleFieldChange(field, value);
          });
          this.on(this.State.$changes, "structure", () => {
              if (!this.innerChange)
                  this.SetValues();
          });
          this.on(this.State.$changes, "mode", (mode, oldMode) => {
              const isChart = mode == "chart";
              this.$$("settings").showBatch(isChart ? "chart" : "table");
              if (oldMode && (isChart || oldMode == "chart"))
                  this.SetValues();
          });
      }
      ToggleForm() {
          this.State.config = !this.State.config;
      }
      SetValues() {
          const structure = this.State.structure;
          const inputs = ["rows", "columns", "values", "filters", "groupBy"];
          inputs.forEach(input => {
              const value = structure[input] || this.State[input];
              const view = this.getSubView(input);
              view.SetValue(value);
          });
      }
      HandleFieldChange(field, value) {
          const structure = webix.copy(this.State.structure);
          if (field == "filters")
              value = this.CorrectFilters(structure, value);
          else
              this.CorrectInputs(structure, field, value);
          structure[field] = value;
          this.innerChange = true;
          this.app.setStructure(structure);
          delete this.innerChange;
      }
      GroupConfig(name, icon, config, batch) {
          return {
              batch,
              header: `
				<span class="webix_icon webix_pivot_config_icon ${icon}"></span>
				<span class="webix_pivot_config_label">${name}</span>
			`,
              body: config,
              borderless: true,
          };
      }
      GetCorrections() {
          return {
              rows: ["columns", "values", "groupBy"],
              columns: ["rows", "values"],
              values: ["rows", "columns", "groupBy"],
              groupBy: ["rows", "values"],
          };
      }
      CorrectFilters(structure, value) {
          for (let i = 0; i < value.length; i++) {
              const active = structure.filters.find(filter => {
                  if (filter.name == value[i])
                      return true;
              });
              value[i] = { name: value[i] };
              if (active && !active.external)
                  value[i].value = active.value;
          }
          const external = structure.filters.filter(filter => filter.external);
          value = value.concat(external);
          return value;
      }
      CorrectInputs(structure, field, value) {
          const inputs = this.GetCorrections()[field];
          if (inputs) {
              if (typeof value == "string")
                  value = [value];
              value = value.map(v => (v.name ? v.name : v));
              inputs.forEach(input => {
                  const view = this.getSubView(input);
                  let values = view.GetValue();
                  if (typeof values == "string") {
                      if (value.find(v => v == values))
                          values = "";
                  }
                  else
                      values = values.filter(v => {
                          if (v.name)
                              v = v.name;
                          return value.indexOf(v) == -1;
                      });
                  structure[input] = values;
                  view.SetValue(values);
              });
          }
      }
  }

  class Popup extends JetView {
      config() {
          return this.app.getService("jet-win").updateConfig({
              view: "window",
              borderless: true,
              fullscreen: true,
              head: false,
              body: { $subview: true },
          });
      }
  }

  class FilterView extends JetView {
      config() {
          this.Local = this.app.getService("local");
          return {
              view: "popup",
              css: "webix_pivot_filter_popup",
              template: item => item.label,
              body: {
                  view: "filter",
                  field: "value",
                  on: {
                      onChange: config => {
                          if (config == "user") {
                              const state = this.app.getState();
                              const structure = webix.copy(state.structure);
                              let value;
                              structure.filters = structure.filters.filter(filter => {
                                  const exists = filter.name == this.field;
                                  const inner = exists && !filter.external;
                                  if (inner)
                                      value = filter.value = this.filter.getValue();
                                  return !exists || inner;
                              });
                              state.structure = structure;
                              this.app.callEvent("filter:change", [this.field, value]);
                          }
                      },
                  },
              },
          };
      }
      Show(pos, filterObj) {
          const popup = this.getRoot();
          const filter = (this.filter = popup.getBody());
          this.field = filterObj.name;
          const list = filter.getChildViews()[2];
          const field = this.Local.getField(this.field);
          this.Local.collectFieldValues(this.field).then(values => {
              list.clearAll();
              list.parse(webix.copy(values));
              filter.define({ mode: field.type });
              filter.config.value = "";
              filter.setValue(webix.copy(filterObj.value || {}));
              popup.show(pos);
          });
      }
  }

  class ModeView extends JetView {
      config() {
          const _ = this.app.getService("locale")._;
          this.Compact = this.getParam("compact");
          const askin = webix.skin.$active;
          const mini = webix.skin.$name == "mini" || webix.skin.$name == "compact";
          const config = {
              height: askin.toolbarHeight,
              cols: [
                  {
                      view: "segmented",
                      localId: "modes",
                      align: "middle",
                      inputHeight: askin.inputHeight - askin.inputPadding * (mini ? 0 : 2),
                      optionWidth: 80,
                      width: 244,
                      options: [
                          { id: "table", value: _("Table") },
                          { id: "tree", value: _("Tree") },
                          { id: "chart", value: _("Chart") },
                      ],
                      on: {
                          onChange: (v, o, c) => {
                              if (c == "user")
                                  this.SetMode(v);
                          },
                      },
                  },
                  { width: askin.dataPadding },
              ],
          };
          if (this.Compact) {
              config.css = "webix_pivot_footer";
              config.cols[1].width = 0;
              config.cols.unshift({});
          }
          return config;
      }
      init() {
          this.State = this.getParam("state");
          this.on(this.State.$changes, "mode", mode => {
              this.$$("modes").setValue(mode);
          });
      }
      SetMode(value) {
          this.State.mode = value;
      }
  }

  class ToolbarView extends JetView {
      config() {
          const _ = this.app.getService("locale")._;
          this.Compact = this.getParam("compact");
          this.State = this.getParam("state");
          let config;
          if (this.Compact) {
              config = {
                  view: "icon",
                  icon: "pt-settings",
                  inputHeight: webix.skin.$active.buttonHeight,
                  on: {
                      onItemClick: () => this.ToggleConfig(),
                  },
              };
          }
          else {
              const label = _("Configure Pivot");
              const css = "webix_template webix_pivot_measure_size";
              const width = 20 + 8 + webix.html.getTextSize(label, css).width;
              config = {
                  view: "template",
                  borderless: true,
                  width,
                  template: () => {
                      return `
						<span>${label}</span>
						<span class="pt-settings webix_pivot_toolbar_icon"></span>`;
                  },
                  onClick: {
                      webix_pivot_settings: () => this.ToggleConfig(),
                  },
              };
          }
          config.localId = "config";
          config.css = "webix_pivot_settings";
          config.tooltip = _("Click to configure");
          const scrollSize = webix.env.$customScroll ? 0 : this._GetScrollWidth();
          const height = webix.skin.$active.toolbarHeight + scrollSize;
          let css = "webix_pivot_toolbar";
          if (scrollSize) {
              webix.html.addStyle(`.webix_pivot_bar_with_scroll .webix_pivot_settings>.webix_template{ line-height: ${height}px; }`);
              css += " webix_pivot_bar_with_scroll";
          }
          const result = {
              css,
              margin: this.Compact ? 12 : 0,
              padding: {
                  left: this.Compact ? webix.skin.$active.inputPadding : 0,
              },
              height,
              cols: [config, this.GetFilters()],
          };
          if (!this.Compact)
              result.cols.push(ModeView);
          return result;
      }
      init() {
          this.filterPopup = this.ui(FilterView);
          this.on(this.State.$changes, "fields", fields => {
              if (fields.length) {
                  const filtersView = this.$$("filters").getParentView();
                  webix.ui(this.GetFilters(), filtersView);
              }
          });
          this.on(this.State.$changes, "structure", (structure, old) => {
              if (old && this.FiltersChanged(structure, old)) {
                  const filtersView = this.$$("filters").getParentView();
                  webix.ui(this.GetFilters(), filtersView);
              }
          });
          this.on(this.State.$changes, "readonly", val => {
              this.ToggleReadonly(val);
          });
      }
      FiltersChanged(structure, oldStructure) {
          if (structure.filters.length == oldStructure.filters.length) {
              for (let i = 0; i < structure.filters.length; i++) {
                  const filter = structure.filters[i];
                  const old = oldStructure.filters[i];
                  if (filter.name != old.name || filter.external != old.external)
                      return true;
                  if (JSON.stringify(filter.value) != JSON.stringify(old.value))
                      return true;
              }
          }
          else
              return true;
          return false;
      }
      ToggleConfig() {
          this.State.config = !this.State.config;
      }
      ToggleReadonly(val) {
          if (val)
              this.$$("config").hide();
          else
              this.$$("config").show();
      }
      GetFilters() {
          const structure = this.State.structure;
          const filters = [];
          if (this.State.fields.length)
              structure.filters.forEach(filter => {
                  if (!filter.external)
                      filters.push(this.FilterConfig(filter));
              });
          const askin = webix.skin.$active;
          const padding = (askin.toolbarHeight - askin.buttonHeight) / 2;
          return {
              view: "scrollview",
              borderless: true,
              scroll: "x",
              body: {
                  margin: 8,
                  padding: {
                      left: this.Compact ? 0 : 8,
                      top: padding + askin.inputPadding,
                      bottom: padding + askin.inputPadding,
                  },
                  localId: "filters",
                  cols: filters,
              },
          };
      }
      FilterConfig(filter) {
          const label = this.app.getService("local").getField(filter.name).value;
          const css = "webix_template webix_pivot_measure_size";
          const width = (this.Compact ? 0 : 20 + 8) + webix.html.getTextSize(label, css).width;
          return {
              view: "template",
              borderless: true,
              width,
              css: "webix_pivot_filter",
              template: () => {
                  const value = filter.value;
                  const activeCss = value && (value.includes || value.condition.filter)
                      ? "webix_pivot_active_filter"
                      : "";
                  const icon = !this.Compact
                      ? "<span class='pt-filter webix_pivot_toolbar_icon'></span>"
                      : "";
                  return `<div class="webix_pivot_filter_inner ${activeCss}">
					<span>${label}</span>
					${icon}
				</div>`;
              },
              onClick: {
                  webix_pivot_filter: function () {
                      this.$scope.filterPopup.Show(this.$view, filter);
                  },
              },
          };
      }
      _GetScrollWidth() {
          const outer = webix.html.create("DIV", {
              style: "visibility:hidden;overflow:scroll;",
          });
          const inner = webix.html.create("DIV");
          document.body.appendChild(outer);
          outer.appendChild(inner);
          const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
          outer.parentNode.removeChild(outer);
          return scrollbarWidth;
      }
  }

  class MainView extends JetView {
      config() {
          initRLayout();
          const fCompact = this.getParam("forceCompact");
          if (!webix.isUndefined(fCompact))
              this.setParam("compact", fCompact);
          this.Compact = this.getParam("compact");
          const rows = [
              ToolbarView,
              {
                  view: "r-layout",
                  localId: "main",
                  cols: [{ $subview: true }],
              },
          ];
          if (this.Compact) {
              rows.push(ModeView, {
                  $subview: true,
                  name: "edit",
                  popup: true,
              });
          }
          else {
              rows[1].cols.push({
                  view: "proxy",
                  maxWidth: 450,
                  localId: "edit",
                  css: "webix_pivot_config_container webix_shadow_medium",
                  borderless: true,
                  hidden: true,
                  body: { $subview: true, name: "edit" },
              });
          }
          return {
              margin: 0,
              rows,
              view: webix.isUndefined(fCompact) ? "r-layout" : "layout",
          };
      }
      init() {
          const state = this.getParam("state");
          this.$$("main").sizeTrigger(this.app, mode => this.SetCompactMode(mode), !!this.Compact);
          this.on(state.$changes, "mode", mode => {
              this.show("./" + (mode == "chart" ? "chart" : "table"));
          });
          this.on(state.$changes, "config", val => {
              if (val)
                  this.ShowConfig();
              else
                  this.HideConfig();
          });
      }
      ShowConfig() {
          if (this.Compact) {
              this.show("config.popup/config", {
                  target: "edit",
              });
          }
          else {
              this.$$("edit").show();
              this.show("config", {
                  target: "edit",
              });
          }
      }
      HideConfig() {
          this.show("_blank", { target: "edit" });
          if (!this.Compact)
              this.$$("edit").hide();
      }
      SetCompactMode(mode) {
          webix.delay(() => {
              this.setParam("compact", mode);
              if (!mode)
                  webix.fullscreen.exit();
              this.refresh();
          });
      }
  }

  class TableView extends JetView {
      config() {
          this.Local = this.app.getService("local");
          const state = (this.State = this.getParam("state", true));
          const rows = state.structure.rows.length;
          const table = {
              view: "treetable",
              $mainView: true,
              localId: "data",
              css: "webix_data_border webix_header_border",
              select: true,
              leftSplit: state.mode == "table" ? rows : rows ? 1 : 0,
              resizeColumn: true,
              borderless: true,
              columns: [],
              footer: state.datatable.footer,
          };
          webix.extend(table, state.datatable, true);
          return table;
      }
      init() {
          this.LoadData();
          this.on(this.State.$changes, "structure", (structure, old) => {
              if (old)
                  this.LoadData();
          });
          this.on(this.State.$changes, "datatable", (val, o) => {
              if (o)
                  this.refresh();
          });
          this.on(this.State.$changes, "mode", (val, o) => {
              if (o && o != "chart" && val != "chart")
                  this.refresh();
          });
      }
      LoadData() {
          return this.Local.getData().then(data => {
              this.UpdateTable(data);
          });
      }
      UpdateTable(data) {
          const state = this.State;
          const structure = state.structure;
          const freeze = this.CheckFreeze();
          let rightSplit = 0;
          const totalCols = state.datatable.totalColumn;
          let totalOps;
          if (totalCols) {
              const vals = structure.values;
              totalOps =
                  totalCols == "sumOnly" ? vals.filter(v => v.operation == "sum") : vals;
              if (freeze)
                  rightSplit = totalOps.length;
          }
          let leftSplit = 0;
          if (freeze) {
              const rows = structure.rows.length;
              leftSplit = state.mode == "table" ? rows : rows ? 1 : 0;
          }
          if (!data.$ready) {
              const total = data.totalColumn;
              let lastId;
              if (total) {
                  lastId = data.header[data.header.length - 1].id;
                  for (let i = 0; i < totalOps.length; i++) {
                      let name = totalOps[i].name;
                      if (webix.isArray(name))
                          name = name.join();
                      data.header.push({
                          header: [
                              { name: "total", colspan: rightSplit },
                              {
                                  text: name || totalOps[i].operation,
                                  operation: totalOps[i].operation,
                              },
                          ],
                          id: lastId + i + 1,
                      });
                  }
              }
              const totalIndex = { i: 0 };
              data = this.Local._store = {
                  data: data.data.map(item => this._prepareData(item, total, totalIndex, lastId)),
                  columns: this.SetColumns(data.header, data.footer, data.marks),
                  $ready: 1,
              };
          }
          const table = this.$$("data");
          table.clearAll();
          table.define({ leftSplit, rightSplit }, true);
          table.refreshColumns(data.columns);
          table.parse(data.data);
      }
      _prepareData(obj, total, index, lastId) {
          const table = this.State.mode == "table";
          let totalIndex;
          if (table || (total && !obj.data))
              totalIndex = index.i++;
          const item = new Proxy(obj, {
              get: (item, prop) => {
                  if (prop == "data")
                      return item.vals;
                  if (table && prop == "id")
                      return totalIndex + 1;
                  const id = prop * 1;
                  if (!isNaN(id)) {
                      const vals = typeof item.values == "object" ? item.values : item;
                      if (total && id > lastId && (totalIndex || totalIndex === 0)) {
                          return total[totalIndex][id - lastId - 1];
                      }
                      return vals[id - 1];
                  }
                  return item[prop];
              },
          });
          if (obj.data) {
              item.open = true;
              item.vals = obj.data.map(r => {
                  return this._prepareData(r, total, index, lastId);
              });
          }
          return item;
      }
      CheckFreeze() {
          const freezeColumns = this.app.config.freezeColumns;
          const compact = this.getParam("compact", true);
          return webix.isUndefined(freezeColumns) ? !compact : freezeColumns;
      }
      SetColumns(columns, footer, marks) {
          columns = webix.copy(columns);
          const _ = this.app.getService("locale")._;
          const rows = this.State.structure.rows.length;
          const left = this.State.mode == "table" ? rows : rows ? 1 : 0;
          for (let i = 0; i < columns.length; i++) {
              if (i < left) {
                  this.SetFirstColumn(columns[i], !i && this.State.datatable.footer, _);
              }
              else {
                  columns[i].sort = "int";
                  if (!columns[i].format)
                      columns[i].format = this.CellFormat;
                  if (marks.length)
                      columns[i].cssFormat = (v, row, rid, cid) => {
                          const col = marks[rid - 1];
                          const css = col ? col[cid - 1] : null;
                          return css ? css.join(" ") : "";
                      };
                  const header = columns[i].header;
                  for (let j = 0; j < header.length; j++) {
                      let h = header[j];
                      if (h) {
                          if (!j && h.name == "total") {
                              h.text = _("Total");
                          }
                          else if (j == header.length - 1) {
                              h.text = this.HeaderTemplate(h, _);
                          }
                      }
                  }
                  if (footer.length) {
                      columns[i].footer = this.CellFormat(footer[i]);
                  }
              }
          }
          return columns;
      }
      SetFirstColumn(column, footer, _) {
          if (this.State.mode == "tree") {
              column.header = {
                  text: this.State.structure.rows
                      .map(field => this.Local.getField(field).value)
                      .join("<span class='webix_icon wxi-angle-right'></span>"),
                  css: "webix_pivot_tree_header",
              };
              column.width = 300;
              column.template = (obj, common) => {
                  return common.treetable(obj, common) + obj[1];
              };
          }
          else {
              column.header = this.Local.getField(column.header[0].text).value;
              column.width = 200;
          }
          if (footer)
              column.footer = _("Total");
      }
      HeaderTemplate(line, _) {
          if (!line.operation || line.operation == "complex")
              return this.Local.fixMath(line.text);
          else {
              let text = line.text.split(",");
              text = text.map(t => this.Local.getField(t).value).join(", ");
              return `${text} <span class="webix_pivot_operation">${_(line.operation)}</span>`;
          }
      }
      CellFormat(value) {
          if (!value)
              value = value === 0 ? "0" : "";
          return value ? parseFloat(value).toFixed(3) : value;
      }
  }

  const views = { JetView };
  views["chart"] = ChartView;
  views["config"] = ConfigView;
  views["config/popup"] = Popup;
  views["config/properties/chart"] = ChartSettings;
  views["config/properties/group"] = GroupProperty;
  views["config/properties"] = Property;
  views["config/properties/table"] = TableSettings;
  views["config/properties/values"] = ValuesProperty;
  views["filter"] = FilterView;
  views["main"] = MainView;
  views["mode"] = ModeView;
  views["table"] = TableView;
  views["toolbar"] = ToolbarView;

  var en = {
      Done: "Done",
      Table: "Table",
      Tree: "Tree",
      Chart: "Chart",
      "Click to configure": "Click to configure",
      "Configure Pivot": "Configure Pivot",
      Total: "Total",
      Fields: "Fields",
      Methods: "Methods",
      Columns: "Columns",
      "Add column": "Add column",
      Rows: "Rows",
      "Add row": "Add row",
      "Clean rows": "Clean rows",
      Filters: "Filters",
      "Add filter": "Add filter",
      "Group By": "Group By",
      "Chart type": "Chart type",
      "Logarithmic scale": "Logarithmic scale",
      "X axis title": "X axis title",
      "Y axis title": "Y axis title",
      "Scale color": "Scale color",
      "Circled lines": "Circled lines",
      Horizontal: "Horizontal",
      Stacked: "Stacked",
      Lines: "Lines",
      Line: "Line",
      Radar: "Radar",
      Bar: "Bar",
      Area: "Area",
      Spline: "Spline",
      "Spline Area": "Spline Area",
      Pie: "Pie",
      Donut: "Donut",
      Values: "Values",
      "Add value": "Add value",
      "Field not defined": "Field not defined",
      Highlight: "Highlight",
      "Min X": "Min X",
      "Max X": "Max X",
      "Min Y": "Min Y",
      "Max Y": "Max Y",
      Footer: "Footer",
      "Total Column": "Total Column",
      Off: "Off",
      On: "On",
      "Sum Only": "Sum Only",
      "3D": "3D",
      "Show values inside": "Show values inside",
      count: "count",
      max: "max",
      min: "min",
      avg: "avg",
      wavg: "wavg",
      any: "any",
      sum: "sum",
      complex: "complex",
      "Incorrect formula in values": "Incorrect formula in values",
  };

  const asc = (a, b) => (a.key > b.key ? 1 : -1);
  const desc = (a, b) => (a.key < b.key ? 1 : -1);
  class DataDimension {
      constructor(table, getValue, label, meta, sort) {
          if (sort === "desc") {
              this._sort = desc;
          }
          else if (sort === "asc") {
              this._sort = asc;
          }
          else if (sort) {
              this._sort = (a, b) => sort(a.key, b.key);
          }
          this._label = label;
          this._meta = meta || null;
          this._table = table;
          this._getter = getValue;
          this._prepared = 0;
      }
      getIndexes() {
          return this._indexes;
      }
      getValue(i) {
          return this._values[i].key;
      }
      getSize() {
          return this._values.length;
      }
      getLabel() {
          return this._label;
      }
      getOptions() {
          this._prepareOptions();
          return this._values.map(a => a.key);
      }
      getMeta() {
          return this._meta;
      }
      reset() {
          this._prepared = 0;
      }
      prepare() {
          if (this._prepared & 1)
              return;
          this._prepared = this._prepared | 1;
          this._prepareOptions();
          const { _table, _getter, _keys } = this;
          const fSize = _table.count();
          this._values.forEach((a, i) => (a.index = i));
          const indexes = (this._indexes = new Array(fSize));
          for (let i = 0; i < fSize; i++) {
              const key = _getter(i);
              indexes[i] = _keys.get(key).index;
          }
      }
      _prepareOptions() {
          if (this._prepared & 2)
              return;
          this._prepared = this._prepared | 2;
          const { _table, _getter } = this;
          const fSize = _table.count();
          const keys = (this._keys = new Map());
          const values = (this._values = []);
          for (let i = 0; i < fSize; i++) {
              const key = _getter(i);
              const index = keys.get(key);
              if (typeof index === "undefined") {
                  keys.set(key, (values[values.length] = { key, index: 0 }));
              }
          }
          if (this._sort)
              values.sort(this._sort);
      }
  }
  class DataExport {
      constructor(pivot) {
          this._pivot = pivot;
      }
      toArray({ cleanRows, filters, ops }) {
          const out = [];
          const limit = this._pivot.getLimit();
          const maxRow = limit.rows || 0;
          this._pivot.filter(filters);
          this._pivot.operations(ops);
          this._pivot.resetCursor();
          let count = 0;
          const header = new Set();
          const rAggr = new Map();
          const rowData = [];
          while (true) {
              const cAggr = {};
              const row = this._pivot.next(header, out.length, rAggr, cAggr);
              if (!row)
                  break;
              out.push(row);
              rowData.push(cAggr);
              count++;
              if (maxRow === count)
                  break;
          }
          const [scaleWidth, width] = this._pivot.getWidth();
          if (cleanRows)
              this._cleanRows(out, scaleWidth);
          const result = {
              data: out,
              columns: Array.from(header).sort((a, b) => (a > b ? 1 : -1)),
              width: width + scaleWidth,
              scaleWidth,
              rowData,
          };
          result.columnData = this._pivot.aggregateColumns(result, rAggr);
          result.marks = this._pivot.mark(result, rAggr);
          return result;
      }
      toNested({ filters, ops }) {
          this._pivot.filter(filters);
          this._pivot.operations(ops);
          this._pivot.resetCursor();
          const rAggr = new Map();
          const result = this._pivot.nested(rAggr);
          result.columnData = this._pivot.aggregateColumns(result, rAggr);
          result.marks = this._pivot.mark(result, rAggr);
          return result;
      }
      toXHeader(data, config) {
          return this._pivot.getXHeader(data, config);
      }
      _cleanRows(data, rowsLength) {
          const count = data.length;
          const prev = new Array(rowsLength);
          for (let j = 0; j < count; j++) {
              const row = data[j];
              for (let i = 0; i < rowsLength; i++) {
                  if (prev[i] !== row[i]) {
                      for (let j = i; j < rowsLength; j++)
                          prev[j] = row[j];
                      break;
                  }
                  row[i] = "";
              }
          }
      }
  }
  function t(t, e) { let n = ""; const o = t.length; let r = 0, i = !1, s = !1, u = 0; for (; r < o;) {
      const o = t[r];
      if (r++, '"' === o)
          i ? n += t.substr(u, r - u) : u = r - 1, i = !i;
      else {
          if (i)
              continue;
          const c = "," === o || "/" === o || "*" === o || "+" === o || "-" === o || "(" === o || ")" === o, f = " " === o || "\t" === o || " \n" === o || "\r" === o;
          if (s) {
              if (!c && !f)
                  continue;
              {
                  const i = t.substr(u, r - u - 1);
                  n += "(" === o ? e.method(i) : e.property(i), s = !1;
              }
          }
          if (f)
              continue;
          if (c)
              n += o;
          else {
              "0" === o || "1" === o || "2" === o || "3" === o || "4" === o || "5" === o || "6" === o || "7" === o || "8" === o || "9" === o ? n += o : (s = !0, u = r - 1);
          }
      }
  } return s && (n += e.property(t.substr(u, r - u))), n; }
  function e(e, n) { return new Function(n.propertyName, n.methodName, n.contextName, "return " + t(e, n)); }
  function optimize(table, order, code, allMath) {
      const math = getMath(table, code);
      const ctx = {
          table,
          order,
          from: 0,
          to: 0,
          array: (i, c) => {
              const size = c.to - c.from;
              const temp = new Array(size);
              const getter = cache[i];
              for (let j = 0; j < size; j++) {
                  temp[j] = getter(c.order[j + c.from]);
              }
              return temp;
          },
      };
      return function (from, to) {
          ctx.from = from;
          ctx.to = to;
          return math(0, allMath, ctx);
      };
  }
  function optimizeRangeGroup(table, order, code, allMath) {
      const math = getMath(table, code);
      const ctx = {
          table,
          order,
          range: [],
          array: (i, c) => {
              const size = ctx.range.length;
              const temp = [];
              const getter = cache[i];
              for (let j = 0; j < size; j += 2) {
                  const from = ctx.range[j];
                  const to = ctx.range[j + 1];
                  for (let i = from; i < to; i++) {
                      temp.push(getter(c.order[i]));
                  }
              }
              return temp;
          },
      };
      return function (range) {
          ctx.range = range;
          return math(0, allMath, ctx);
      };
  }
  function optimizeGroup(code, allMath) {
      const math = getGroupMath(code);
      return function (v) {
          return math(v, allMath, null);
      };
  }
  let id = 0;
  const cache = [];
  function getMath(table, rule) {
      return e(rule, {
          propertyName: "d",
          methodName: "m",
          contextName: "c",
          property: (a) => {
              const i = id;
              cache[i] = table.getColumn(a).getter;
              id += 1;
              return `c.array("${i}", c)`;
          },
          method: (a) => {
              return `m.${a.toLowerCase()}`;
          },
      });
  }
  function getGroupMath(rule) {
      return e(rule, {
          propertyName: "d",
          methodName: "m",
          contextName: "c",
          property: () => {
              return `d`;
          },
          method: (a) => {
              return `m.${a.toLowerCase()}`;
          },
      });
  }
  const and = (a, b) => c => a(c) && b(c);
  function buildFinder(data, key, value, context) {
      const getValue = context.getter(data, key);
      if (typeof value !== "object") {
          const check = context.compare["eq"](value);
          return i => check(getValue(i));
      }
      else {
          const ops = Object.keys(value);
          let result = null;
          for (let i = 0; i < ops.length; i++) {
              const check = context.compare[ops[i].toLowerCase()](value[ops[i]]);
              const step = i => check(getValue(i));
              result = result ? and(result, step) : step;
          }
          return result;
      }
  }
  function build(table, rule, context) {
      const keys = Object.keys(rule);
      let result = null;
      for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const step = buildFinder(table, key, rule[key], context);
          result = result ? and(result, step) : step;
      }
      return result;
  }
  function filter(order, table, rule, context) {
      const filter = build(table, rule, context);
      return order.filter(n => filter(n));
  }
  class DataPivot {
      constructor(table, rows, cols, filters, config) {
          this._rows = rows;
          this._cols = cols;
          this._dims = rows.concat(cols);
          this._table = table;
          this._context = config;
          this._cursor = -1;
          this._order = this._base_order = this._sort();
          this._data = this._dims.map(a => a.getIndexes());
          this.filter(filters, true);
      }
      resetCursor() {
          this._cursor = 0;
          this._group = this._dims.map(() => null);
          if (this._order.length) {
              if (this._rows.length)
                  this._nextRow();
              if (this._cols.length)
                  this._nextColumn();
          }
      }
      next(header, index, rAggr, cAggr) {
          const { _cursor, _cols, _order, _group, _ops, _rows } = this;
          if (this._cursor >= _order.length)
              return null;
          const dimsSize = _rows.length;
          const out = new Array(dimsSize + _ops.length * _cols.length);
          for (let i = 0; i < dimsSize; i++)
              out[i] = _rows[i].getValue(_group[i]);
          const to = this._rows.length
              ? this._nextRow(_cols.length > 0)
              : _order.length;
          this._fillRow(out, index, _cursor, to, dimsSize, header, rAggr, cAggr);
          this._cursor = to;
          return out;
      }
      nested(rAggr) {
          const { _cols, _order, _rows } = this;
          const header = new Set();
          const dimSize = _rows.length;
          const dimOutSize = dimSize > 0 ? 1 : 0;
          const levels = [{ data: [], values: [] }];
          const data = [];
          let prev = [];
          let now = [];
          let from = this._cursor;
          let count = 0;
          const { _groupOps } = this;
          const _groupLength = [{}].concat(_rows.map(() => ({})));
          const rowData = [];
          const limit = this._context.limit.rows;
          const width = Math.min(this._context.limit.columns, (_cols.length ? this._sizes[0] * _cols[0].getSize() : 0) + dimOutSize);
          const closeLevels = function (j) {
              if (!levels[j])
                  return;
              for (; j < dimSize; j++) {
                  for (const [kAgr, vAgr] of rAggr) {
                      const prev = _groupLength[j][kAgr] || 0;
                      if (prev === 0 || vAgr.length > prev) {
                          for (let z = 0; z < _groupOps.length; z++) {
                              const math = _groupOps[z];
                              if (math) {
                                  levels[j].values[dimOutSize + kAgr + z] = math(vAgr.slice(prev + 1));
                                  _groupLength[j][kAgr] = vAgr.length - 1;
                              }
                          }
                      }
                  }
              }
          };
          while (this._cursor < _order.length) {
              const out = new Array(width);
              prev = now;
              now = [].concat(this._group);
              const to = this._rows.length
                  ? this._nextRow(_cols.length > 0)
                  : _order.length;
              if (_groupOps !== null) {
                  for (let level = 0; level < dimSize; level++) {
                      if (now[level] != prev[level]) {
                          closeLevels(level + 1);
                          break;
                      }
                  }
              }
              const cAggr = {};
              this._fillRow(out, data.length, from, to, dimOutSize, header, rAggr, cAggr);
              rowData.push(cAggr);
              if (dimSize > 0) {
                  for (let level = 0; level < dimSize; level++) {
                      if (now[level] != prev[level]) {
                          for (let j = level; j < dimSize; j++) {
                              const index = j + 1;
                              const last = index === dimSize;
                              const obj = (levels[index] = {
                                  id: last ? data.length + 1 : 0,
                                  data: last ? null : [],
                                  values: last ? out : [_rows[j].getValue(now[j])],
                              });
                              levels[j].data.push(obj);
                          }
                          break;
                      }
                  }
                  out[0] = _rows[dimSize - 1].getValue(now[dimSize - 1]);
                  levels[dimSize].values = out;
              }
              else {
                  levels[0].data.push({ data: null, values: out });
              }
              data.push(out);
              count++;
              if (count >= limit)
                  break;
              this._cursor = from = to;
          }
          if (_groupOps !== null) {
              closeLevels(1);
          }
          const columns = Array.from(header).sort((a, b) => (a > b ? 1 : -1));
          const result = {
              tree: levels[0].data,
              data,
              width,
              scaleWidth: dimOutSize,
              columns,
              rowData,
          };
          this._fillGroupRow(levels[0], result, rAggr, _rows.length - 1);
          return result;
      }
      getLimit() {
          return this._context.limit;
      }
      getWidth() {
          return [
              this._rows.length,
              this._cols.length && this._ops.length
                  ? this._cols[0].getSize() * this._sizes[0]
                  : 0,
              this._ops.length,
          ];
      }
      getXHeader(result, hConfig) {
          const { _cols, _rows, _ops, _opInfo } = this;
          const { nonEmpty, meta } = hConfig || {};
          const isNested = result.tree;
          const line = [];
          const rpref = result.tree ? Math.min(_rows.length, 1) : _rows.length;
          const ostep = _ops.length;
          const unitsInParent = _cols.map(a => a.getSize());
          const length = unitsInParent.reduce((prev, value) => prev * value, ostep);
          const columns = result.columns;
          const fullLength = rpref +
              Math.min(nonEmpty ? columns.length * ostep : length, this._context.limit.columns);
          let temp = length;
          const unitSizes = unitsInParent.map(a => (temp = temp / a));
          const out = [];
          this._cols.forEach(() => out.push(new Array(fullLength)));
          if (nonEmpty) {
              for (let i = 0; i < rpref; i++)
                  line.push(i);
              for (let j = 0; j < columns.length; j++) {
                  const base = rpref + columns[j];
                  for (let i = 0; i < ostep; i++)
                      line.push(base + i);
              }
              for (let j = 0; j < _cols.length; j++) {
                  const step = unitSizes[j];
                  let start = -1;
                  let end = 0;
                  let colspan = 0;
                  let text;
                  for (let i = rpref; i < line.length; i += ostep) {
                      const test = line[i];
                      if (test < end) {
                          colspan += ostep;
                      }
                      else {
                          if (colspan !== 0) {
                              out[j][start] = { colspan, text };
                          }
                          const ind = Math.floor((test - rpref) / step);
                          start = i;
                          end = (ind + 1) * step + rpref;
                          colspan = ostep;
                          text = _cols[j].getValue(ind % unitsInParent[j]);
                      }
                  }
                  if (colspan !== 0)
                      out[j][start] = { colspan, text };
              }
          }
          else {
              for (let i = 0; i < _cols.length; i++) {
                  const size = unitsInParent[i];
                  const step = unitSizes[i];
                  let ind = 0;
                  for (let j = rpref; j < fullLength; j += step) {
                      if (step === 1) {
                          out[i][j] = _cols[i].getValue(ind++);
                      }
                      else {
                          out[i][j] = { text: _cols[i].getValue(ind++), colspan: step };
                      }
                      if (ind >= size)
                          ind = 0;
                  }
              }
          }
          if (this._ops) {
              const opNames = new Array(fullLength);
              const step = _ops.length;
              for (let j = rpref; j < fullLength; j += step)
                  for (let z = 0; z < step; z++)
                      opNames[j + z] = _opInfo[z].label;
              out.push(opNames);
          }
          for (let i = 0; i < rpref; i++) {
              const rowspan = _cols.length + (this._ops ? 1 : 0);
              if (isNested) {
                  out[0][0] = { text: "", rowspan };
                  break;
              }
              const text = _rows[i].getLabel();
              out[0][i] = rowspan > 1 ? { text, rowspan } : text;
          }
          const res = { data: out };
          if (nonEmpty)
              res.nonEmpty = line;
          if (meta) {
              const metaLine = new Array(fullLength);
              for (let i = 0; i < rpref; i++)
                  metaLine[i] = _rows[i].getMeta();
              const step = _ops.length;
              for (let j = rpref; j < fullLength; j += step)
                  for (let z = 0; z < step; z++)
                      metaLine[j + z] = _opInfo[z].meta;
              res.meta = metaLine;
          }
          return res;
      }
      filter(rules, master) {
          if (!rules || Object.keys(rules).length === 0) {
              if (!master && this._masterRules)
                  rules = Object.assign(Object.assign({}, this._masterRules), rules);
              else {
                  this._order = this._base_order;
                  return;
              }
          }
          if (master)
              this._masterRules = rules;
          this._order = filter(this._base_order, this._table, rules, this._context);
      }
      operations(ops) {
          const { _table, _order, _context } = this;
          ops = ops || [];
          this._ops = ops.map(p => optimize(_table, _order, typeof p === "string" ? p : p.math, _context.math));
          this._groupResultOps = ops.map(p => p.branchMode === "result"
              ? optimizeGroup(typeof p === "string" ? p : p.branchMath || p.math, _context.math)
              : null);
          if (!this._groupResultOps.find(a => a !== null))
              this._groupResultOps = null;
          this._groupOps = ops.map(p => p.branchMode === "raw"
              ? optimizeRangeGroup(_table, _order, typeof p === "string" ? p : p.branchMath || p.math, _context.math)
              : null);
          if (!this._groupOps.find(a => a !== null))
              this._groupOps = null;
          this._opInfo = ops.map(p => {
              if (typeof p === "string") {
                  return { label: p, math: p };
              }
              else {
                  return Object.assign(Object.assign({}, p), { label: p.label || p.math });
              }
          });
          this._rowResultOps = compactOps(ops, "row", "result", (x, name) => ({
              name,
              op: optimizeGroup(x, _context.math),
          }));
          this._rowOps = compactOps(ops, "row", "raw", (x, name) => ({
              name,
              op: optimize(_table, _order, x, _context.math),
          }));
          this._colResultOps = compactOps(ops, "column", "result", (x, name) => ({
              name,
              op: optimizeGroup(x, _context.math),
          }));
          this._colOps = compactOps(ops, "column", "raw", (x, name) => ({
              name,
              op: optimizeRangeGroup(_table, _order, x, _context.math),
          }));
          this._marks = ops.map(a => a.marks || null);
          if (!this._marks.find(a => a !== null))
              this._marks = null;
          this._setSizes();
      }
      aggregateColumns(result, rAggr) {
          const { _colOps, _colResultOps } = this;
          const { columns, data, scaleWidth } = result;
          if (!_colOps && !_colResultOps)
              return [];
          const step = this._ops.length;
          const out = [];
          for (let i = 0; i < columns.length; i++) {
              const ind = columns[i];
              const dmr = rAggr.get(ind);
              if (!dmr)
                  continue;
              const keys = Array.from(dmr[0].keys());
              for (let j = 0; j < step; j++) {
                  const column = {};
                  if (_colResultOps) {
                      const op = _colResultOps[j];
                      if (op) {
                          const values = keys.map(a => data[a][ind + j + scaleWidth]);
                          op.forEach(x => (column[x.name] = x.op(values)));
                      }
                  }
                  if (_colOps) {
                      const op = _colOps[j];
                      if (op) {
                          op.forEach(x => (column[x.name] = x.op(dmr.slice(1))));
                      }
                  }
                  out[scaleWidth + ind + j] = column;
              }
          }
          return out;
      }
      _optimizeGroup(ops) {
          const config = {};
          let exit = true;
          for (const key in ops) {
              const test = ops[key];
              config[key] = optimizeGroup(test, this._context.math);
              exit = false;
          }
          return exit ? null : config;
      }
      mark(result, rAggr) {
          const out = [];
          const { _marks, _ops } = this;
          if (!_marks)
              return out;
          const opsLength = _ops.length;
          const { scaleWidth, data, columnData, rowData } = result;
          for (const [k, v] of rAggr) {
              const r = v[0];
              for (let i = 0; i < opsLength; i++) {
                  const marks = this._marks[i];
                  if (marks === null)
                      continue;
                  for (const z of r) {
                      const cid = k + i + scaleWidth;
                      const rid = z;
                      const cell = [];
                      for (let j = 0; j < marks.length; j++) {
                          if (marks[j].check(data[rid][cid], columnData[cid] || {}, rowData[rid] || {}))
                              cell.push(marks[j].name);
                      }
                      if (cell.length) {
                          let rarr = out[rid];
                          if (typeof rarr === "undefined")
                              rarr = out[rid] = [];
                          rarr[cid] = cell;
                      }
                  }
              }
          }
          return out;
      }
      __getHeaderStub() {
          return {};
      }
      _fillGroupRow(obj, result, rAggr, level) {
          const { _groupResultOps } = this;
          const { columns, scaleWidth } = result;
          if (_groupResultOps) {
              for (let i = 0; i < columns.length; i++) {
                  const ind = columns[i];
                  for (let j = 0; j < _groupResultOps.length; j++) {
                      const op = _groupResultOps[j];
                      if (!op)
                          continue;
                      if (level > 0)
                          this._fillGroupRowInner(obj, op, ind + j + scaleWidth, level);
                  }
              }
          }
      }
      _fillGroupRowInner(obj, op, ind, level) {
          const arr = [];
          if (level > 0) {
              obj.data.forEach(a => {
                  const res = this._fillGroupRowInner(a, op, ind, level - 1);
                  if (res !== null) {
                      arr.push(res);
                  }
              });
          }
          else {
              for (let i = 0; i < obj.data.length; i++) {
                  const test = obj.data[i].values[ind];
                  if (typeof test !== "undefined")
                      arr.push(test);
              }
          }
          if (arr.length)
              return (obj.values[ind] = op(arr));
          return null;
      }
      _fillRow(out, index, from, to, dimsSize, header, rAggr, cAggr) {
          const { _cols, _group, _ops, _sizes, _rows, _rowResultOps, _rowOps } = this;
          const rl = _rows.length;
          const collectRaggr = this._colResultOps !== null ||
              this._colOps !== null ||
              this._marks !== null;
          let ctemp = [];
          if (_rowResultOps !== null)
              ctemp = _rowResultOps.map(() => []);
          if (_ops.length) {
              if (_cols.length) {
                  let cfrom = from;
                  while (cfrom < to) {
                      let cind = 0;
                      for (let i = 0; i < _cols.length; i++)
                          cind += _sizes[i] * _group[rl + i];
                      const cto = this._nextColumn();
                      for (let i = 0; i < _ops.length; i++) {
                          const temp = (out[cind + dimsSize + i] = _ops[i](cfrom, cto));
                          if (_rowResultOps !== null)
                              ctemp[i].push(temp);
                      }
                      if (collectRaggr) {
                          let arr = rAggr.get(cind);
                          if (!arr)
                              rAggr.set(cind, (arr = [new Set(), cfrom, cto]));
                          else
                              arr.push(cfrom, cto);
                          arr[0].add(index);
                      }
                      header.add(cind);
                      this._cursor = cfrom = cto;
                  }
              }
              else {
                  for (let i = 0; i < _ops.length; i++) {
                      out[i + dimsSize] = _ops[i](from, to);
                  }
                  if (collectRaggr) {
                      let arr = rAggr.get(0);
                      if (!arr)
                          rAggr.set(0, (arr = [new Set(), from, to]));
                      else
                          arr.push(from, to);
                      arr[0].add(index);
                  }
                  header.add(0);
              }
          }
          if (_rowResultOps !== null) {
              _rowResultOps.forEach((opset, i) => {
                  const dataset = ctemp[i];
                  if (opset && dataset.length)
                      opset.forEach(op => {
                          cAggr[op.name] = op.op(ctemp[i]);
                      });
              });
          }
          if (_rowOps !== null) {
              _rowOps.forEach(opset => {
                  opset === null || opset === void 0 ? void 0 : opset.forEach(op => {
                      cAggr[op.name] = op.op(from, to);
                  });
              });
          }
      }
      _sort() {
          const { _table, _dims } = this;
          const size = Math.min(_table.count(), this._context.limit.raws);
          const order = new Array(size);
          for (let i = 0; i < size; i++) {
              order[i] = i;
          }
          const dimsSize = _dims.length;
          const dimsData = _dims.map(a => a.getIndexes());
          order.sort((a, b) => {
              for (let j = 0; j < dimsSize; j++) {
                  const left = dimsData[j][a];
                  const right = dimsData[j][b];
                  if (left > right)
                      return 1;
                  if (left < right)
                      return -1;
              }
              return 0;
          });
          return order;
      }
      _nextRow(silent) {
          const { _data, _order, _group, _rows } = this;
          const dimsSize = _rows.length;
          let ok = true;
          let to = this._cursor;
          while (true) {
              const ind = _order[to];
              for (let i = 0; i < dimsSize; i++) {
                  if (_data[i][ind] != _group[i]) {
                      if (!silent)
                          _group[i] = _data[i][ind];
                      ok = false;
                  }
              }
              if (!ok)
                  break;
              to++;
          }
          return to;
      }
      _nextColumn() {
          const { _data, _order, _group, _rows, _cols } = this;
          const dimsSize = _cols.length + _rows.length;
          let ok = true;
          let to = this._cursor;
          while (true) {
              const ind = _order[to];
              for (let i = 0; i < dimsSize; i++) {
                  if (_data[i][ind] != _group[i]) {
                      _group[i] = _data[i][ind];
                      ok = false;
                  }
              }
              if (!ok)
                  break;
              to++;
          }
          return to;
      }
      _setSizes() {
          const sizes = this._cols.map(a => a.getSize());
          let sum = this._ops.length || 1;
          for (let i = sizes.length - 1; i >= 0; i--) {
              const now = sum;
              sum *= sizes[i];
              sizes[i] = now;
          }
          this._sizes = sizes;
      }
  }
  function compactOps(ops, kind, mode, optimizer) {
      const result = ops.map(p => {
          const row = p[kind];
          if (!row)
              return null;
          const out = row
              .map(op => {
              const source = op.source || "raw";
              if (source === mode)
                  if (typeof op === "string")
                      return optimizer(op, getName(op));
                  else
                      return optimizer(op.math, op.as || getName(op.math));
              return null;
          })
              .filter(a => a !== null);
          if (!out.length)
              return null;
          return out;
      });
      if (!result.find(a => !!a))
          return null;
      return result;
  }
  function getName(x) {
      const end = x.indexOf("(");
      if (end === -1)
          return x.trim();
      return x.substring(0, end).trim();
  }
  class RawTable {
      constructor(config) {
          this._columns = config.fields;
          this.parse(config.data);
      }
      parse(data) {
          this._raw = data;
          this._parse_inner();
      }
      prepare() {
          if (this._prepared)
              return;
          this._prepared = true;
          const data = this._raw;
          const fields = this._columns;
          const cols = fields.filter(a => a.type === 3);
          if (!data || !cols.length)
              return;
          const dataLength = data.length;
          const columnsLength = cols.length;
          for (let i = 0; i < dataLength; i++) {
              for (let j = 0; j < columnsLength; j++) {
                  const col = cols[j];
                  const text = col.getter(i);
                  if (typeof text === "string")
                      col.setter(i, new Date(text));
              }
          }
      }
      _parse_inner() {
          this._columns.forEach(a => {
              const key = a.id;
              a.getter = i => this._raw[i][key];
              a.setter = (i, v) => (this._raw[i][key] = v);
          });
      }
      getColumn(id) {
          return this._columns.find(a => a.id === id);
      }
      count() {
          return this._raw.length;
      }
  }
  class ColumnTable extends RawTable {
      parse(data) {
          this._parse_init(data.length);
          const dataLength = data.length;
          const columnsLength = this._columns.length;
          for (let i = 0; i < dataLength; i++) {
              const obj = data[i];
              for (let j = 0; j < columnsLength; j++) {
                  const col = this._columns[j];
                  col.data[i] = obj[col.id];
              }
          }
      }
      _parse_init(n) {
          this._columns.forEach(a => {
              const data = (a.data = new Array(n));
              a.getter = i => data[i];
              a.setter = (i, v) => (data[i] = v);
          });
      }
      count() {
          return this._columns[0].data.length;
      }
  }
  const methods = {
      round: (v) => Math.round(v),
      sum: (arr) => arr.reduce((acc, a) => acc + a, 0),
      min: (arr) => arr.reduce((acc, a) => (a < acc ? a : acc), arr.length ? arr[0] : 0),
      max: (arr) => arr.reduce((acc, a) => (a > acc ? a : acc), arr.length ? arr[0] : 0),
      avg: (arr) => arr.length ? arr.reduce((acc, a) => acc + a, 0) / arr.length : 0,
      wavg: (arr, w) => {
          if (!arr.length)
              return 0;
          let count = 0;
          let summ = 0;
          for (let i = arr.length - 1; i >= 0; i--) {
              count += w[i];
              summ += arr[i] * w[i];
          }
          return summ / count;
      },
      count: (arr) => arr.length,
      any: (arr) => (arr.length ? arr[0] : null),
  };
  const filters = {
      eq: (v) => (x) => x == v,
      neq: (v) => (x) => x != v,
      gt: (v) => (x) => x > v,
      gte: (v) => (x) => x >= v,
      lt: (v) => (x) => x < v,
      lte: (v) => (x) => x <= v,
      in: (v) => (x) => v[x],
      hasPrefix: (v) => (x) => x.indexOf(v) === 0,
      contains: (v) => (x) => x.indexOf(v) !== -1,
  };
  const predicates = {
      year: (v) => v.getFullYear(),
      month: (v) => v.getMonth(),
      day: (v) => v.getDate(),
      hour: (v) => v.getHours(),
      minute: (v) => v.getMinutes(),
  };
  class Analytic {
      constructor(cfg) {
          this._tables = {};
          this._dimensions = {};
          this._preds = Object.assign({}, predicates);
          this._maths = Object.assign({}, methods);
          this._comps = Object.assign({}, filters);
          if (cfg && cfg.tables)
              cfg.tables.forEach(s => this.addTable(s));
          if (cfg && cfg.dimensions)
              cfg.dimensions.forEach(s => this.addDimension(s));
      }
      addPredicate(name, code) {
          this._preds[name.toLowerCase()] = code;
      }
      addMath(name, code) {
          this._maths[name.toLowerCase()] = code;
      }
      addComparator(name, code) {
          this._comps[name.toLowerCase()] = code;
      }
      getDimension(id) {
          return this._dimensions[id];
      }
      addDimension(s) {
          if (this._dimensions[s.id])
              return;
          const table = this._tables[s.table];
          const getter = this._predicateGetter(table, s.rule.by);
          this._dimensions[s.id] = new DataDimension(table, getter, s.label || s.id, s.meta || s, s.sort);
      }
      resetDimensions(s, preserve) {
          const prev = this._dimensions;
          this._dimensions = {};
          if (s)
              s.forEach(a => {
                  const used = prev[a.id];
                  if (preserve && used)
                      this._dimensions[a.id] = used;
                  else
                      this.addDimension(a);
              });
      }
      addTable(s) {
          const driver = (s.driver || "raw") === "raw" ? RawTable : ColumnTable;
          const t = (this._tables[s.id] = new driver(s));
          if (s.prepare)
              t.prepare();
      }
      getTable(id) {
          return this._tables[id];
      }
      compact(table, config) {
          const { rows, cols, filters, limit } = config;
          const base = this._tables[table];
          const rDims = rows ? rows.map(a => this._dimensions[a]) : [];
          const cDims = cols ? cols.map(a => this._dimensions[a]) : [];
          [...rDims, ...cDims].forEach(a => a.prepare());
          const pivot = new DataPivot(base, rDims, cDims, filters, {
              getter: this._predicateGetter.bind(this),
              math: this._maths,
              compare: this._comps,
              limit: Object.assign({ rows: 10000, columns: 5000, raws: Infinity }, (limit || {})),
          });
          return new DataExport(pivot);
      }
      _predicateGetter(table, key) {
          const find = key.indexOf("(");
          if (find !== -1) {
              const fn = this._preds[key.substr(0, find).toLowerCase()];
              key = key.substr(find + 1, key.length - find - 2);
              const getter = table.getColumn(key).getter;
              return i => fn(getter(i));
          }
          else {
              return table.getColumn(key).getter;
          }
      }
  }

  class LocalData {
      constructor(app) {
          this._app = app;
          this._store = {};
          this._filtersHash = {};
          this._state = app.getState();
          if (app.config.externalProcessing)
              this._setOperations();
          else {
              this._data = [];
              this._initRengine();
          }
      }
      _setOperations() {
          this.operations = [
              { id: "sum", fields: 1, branchMode: "result" },
              { id: "min", fields: 1, branchMode: "result" },
              { id: "max", fields: 1, branchMode: "result" },
              { id: "avg", fields: 1, branchMode: "raw" },
              { id: "wavg", fields: 2, branchMode: "raw" },
              { id: "count", fields: 1, branchMode: "raw" },
              { id: "any", fields: 1, branchMode: "result" },
              { id: "complex" },
          ];
          const config = this._app.config;
          const extraOperations = this._app.config.operations;
          if (extraOperations) {
              if (config.externalProcessing)
                  this.operations = this.operations.concat(extraOperations);
              else
                  for (let name in extraOperations) {
                      let operation = extraOperations[name];
                      let fields, branchMode, hidden;
                      if (typeof operation == "object") {
                          fields = operation.fields || operation.handler.length;
                          branchMode = operation.branchMode;
                          hidden = operation.hidden;
                          operation = operation.handler;
                      }
                      else
                          fields = operation.length;
                      this._reng.addMath(name, operation);
                      if (!hidden)
                          this.operations.push({
                              id: name,
                              fields,
                              branchMode,
                          });
                  }
          }
      }
      _setTotalOperations() {
          this.totalOperations = {};
          const totalOps = this._app.config.totalOperations;
          if (totalOps)
              for (let name in totalOps) {
                  const op = totalOps[name];
                  const all = typeof totalOps[name] == "string";
                  ["footer", "group", "column"].forEach(type => {
                      if (all || op[type]) {
                          if (!this.totalOperations[type])
                              this.totalOperations[type] = {};
                          this.totalOperations[type][name] = all ? op : op[type];
                      }
                  });
              }
      }
      _setFilters() {
          for (let type in webix.filters) {
              this._reng.addComparator(type, v => test => {
                  if (type == "date")
                      test = test.valueOf();
                  if (!v)
                      return true;
                  else if (v.includes)
                      return v.includes.indexOf(test) != -1;
                  else if (!v.condition.filter)
                      return true;
                  else
                      return webix.filters[type][v.condition.type](test, v.condition.filter);
              });
          }
      }
      _setPredicates() {
          const predicates = this._app.config.predicates;
          if (predicates)
              for (let name in predicates)
                  this._reng.addPredicate(name, predicates[name]);
      }
      getFields(firstRow) {
          let fields = this._app.config.fields;
          if (!fields) {
              fields = [];
              for (let i in firstRow) {
                  let type;
                  const dataType = typeof firstRow[i];
                  switch (dataType) {
                      case "string":
                          type = "text";
                          break;
                      case "number":
                          type = dataType;
                          break;
                      default:
                          type = "date";
                  }
                  fields.push({ id: i, value: i, type });
              }
          }
          return fields;
      }
      getData(force) {
          if (!force && this.useOldData())
              return this._dataLoad || webix.promise.resolve(this._store);
          const externalProcessing = this._app.config.externalProcessing;
          if (externalProcessing || !Object.keys(this._store).length || force) {
              return (this._dataLoad = this._app
                  .getService("backend")
                  .data()
                  .then(data => {
                  if (externalProcessing)
                      this._store = this._rengineToWebix(data.result, data.header);
                  else {
                      this._table = this.getTable(data);
                      this._reng.addTable(this._table);
                      this._store = this.getPivotData();
                  }
                  this._filtersHash = {};
                  return this._store;
              })
                  .catch(error => this.loadError(error))
                  .finally(() => delete this._dataLoad));
          }
          else {
              this._store = this.getPivotData();
              return webix.promise.resolve(this._store);
          }
      }
      useOldData() {
          const state = this._state;
          let newConfig = `${state.mode}|${JSON.stringify(state.structure)}`;
          if (state.mode == "chart") {
              const type = state.chart.type;
              newConfig += `|${type == "pie" || type == "donut"}`;
          }
          else
              newConfig += `|${JSON.stringify(state.datatable)}`;
          const refresh = this._old == newConfig;
          this._old = newConfig;
          return refresh;
      }
      _initRengine() {
          this._reng = new Analytic();
          this._setFilters();
          this._setOperations();
          this._setTotalOperations();
          this._setPredicates();
      }
      getPivotData() {
          if (!this._table)
              return {
                  data: [],
                  header: [],
                  total: [],
                  marks: [],
              };
          const structure = this._state.structure;
          const mode = this._state.mode;
          const table = this._state.datatable;
          this.setDimensions();
          const filters = {};
          for (let i = 0; i < structure.filters.length; i++) {
              const filter = structure.filters[i];
              const fields = this._state.fields;
              const field = fields.find(field => field.id == filter.name);
              filters[filter.name] = { [field.type]: filter.value };
          }
          const res = this._reng.compact(this._table.id, {
              rows: this.getRows(),
              cols: this.getColumns(),
              limit: this.getLimits(),
          });
          const ops = this.getOps();
          try {
              let result;
              if (mode == "table")
                  result = res.toArray({
                      filters,
                      ops,
                      cleanRows: table.cleanRows,
                  });
              else
                  result = res.toNested({
                      filters,
                      ops,
                  });
              let headerConfig;
              if (mode != "chart")
                  headerConfig = { meta: true, nonEmpty: true };
              return this._rengineToWebix(result, res.toXHeader(result, headerConfig));
          }
          catch (e) {
              return this.loadError();
          }
      }
      _updateTotalMath(type, math, methodsMatch) {
          for (let i = methodsMatch.length - 1; i >= 0; i--) {
              const match = methodsMatch[i];
              math =
                  math.substring(0, match.index + match[1].length) +
                      (this.totalOperations[type][match[2]] || match[2]) +
                      math.substring(match.index + match[0].length - 1, math.length);
          }
          return math;
      }
      getOps() {
          const state = this._state;
          const table = state.datatable;
          const mode = state.mode;
          const vals = state.structure.values;
          const ops = [];
          for (let i = 0; i < vals.length; i++) {
              const format = vals[i].format;
              const operation = vals[i].operation;
              const color = vals[i].color;
              const isComplex = operation == "complex";
              let name = isComplex ? vals[i].math : vals[i].name;
              name = webix.isArray(name) ? name.join(",") : name;
              const math = isComplex ? name : `${operation}(${name})`;
              let branchMode;
              if (!isComplex)
                  branchMode = this.getOperation(operation).branchMode;
              const op = {
                  math,
                  branchMode: branchMode || "raw",
                  label: name,
                  meta: { operation, format, color },
                  column: [],
                  row: [],
                  marks: [],
              };
              const total = this.totalOperations;
              let methodsMatch;
              if (Object.keys(total).length) {
                  const methodsRegex = new RegExp("(\\(|,|\\+|-|\\/|\\*|\\s|^)(" +
                      this.operations.map(method => method.id).join("|") +
                      ")\\(", "g");
                  methodsMatch = Array.from(math.matchAll(methodsRegex));
              }
              if (total.group)
                  op.branchMath = this._updateTotalMath("group", math, methodsMatch);
              if (mode != "chart") {
                  if (table.footer &&
                      ((table.footer == "sumOnly" && operation == "sum") ||
                          table.footer != "sumOnly"))
                      op.column.push({
                          math: total.footer
                              ? this._updateTotalMath("footer", math, methodsMatch)
                              : math,
                          as: "value",
                      });
                  if (table.totalColumn &&
                      ((table.totalColumn == "sumOnly" && operation == "sum") ||
                          table.totalColumn != "sumOnly"))
                      op.row.push({
                          math: total.column
                              ? this._updateTotalMath("column", math, methodsMatch)
                              : math,
                          as: "" + i,
                      });
                  if (table.minY) {
                      op.column.push({
                          as: "minY",
                          math: "min(group)",
                          source: "result",
                      });
                      op.marks.push({
                          name: "webix_min_y",
                          check: (v, column) => v == column.minY,
                      });
                  }
                  if (table.maxY) {
                      op.column.push({
                          as: "maxY",
                          math: "max(group)",
                          source: "result",
                      });
                      op.marks.push({
                          name: "webix_max_y",
                          check: (v, column) => v == column.maxY,
                      });
                  }
                  if (table.minX) {
                      op.row.push({
                          as: "minX" + math,
                          math: "min(group)",
                          source: "result",
                      });
                      op.marks.push({
                          name: "webix_min_x",
                          check: (v, column, row) => v == row["minX" + math],
                      });
                  }
                  if (table.maxX) {
                      op.row.push({
                          as: "maxX" + math,
                          math: "max(group)",
                          source: "result",
                      });
                      op.marks.push({
                          name: "webix_max_x",
                          check: (v, column, row) => v == row["maxX" + math],
                      });
                  }
              }
              ops.push(op);
          }
          return ops;
      }
      _rengineToWebix(result, header) {
          const state = this._state;
          if (state.mode == "chart")
              return this.getChartData(result, header);
          const footer = header.nonEmpty.map(i => result.columnData[i] ? result.columnData[i].value : "");
          header = this.getHeader(header);
          let column;
          if (state.datatable.totalColumn) {
              column = result.rowData.map(obj => {
                  const res = [];
                  for (let key in obj) {
                      if (key.indexOf("minX") == -1 && key.indexOf("maxX") == -1)
                          res[key] = obj[key];
                  }
                  return res.filter(v => v || v === 0);
              });
          }
          return {
              data: result.tree || result.data,
              header,
              marks: result.marks,
              footer,
              totalColumn: column,
          };
      }
      loadError() {
          webix.message({
              text: this._app.getService("locale")._("Incorrect formula in values"),
              type: "error",
          });
          return {
              data: [],
              values: [],
              header: [],
              marks: [],
              footer: [],
              totalColumn: [],
          };
      }
      _toTree(obj) {
          let item = obj.values;
          if (!webix.isArray(item)) {
              let arr = [];
              for (let name in item)
                  arr[name] = item[name];
              item = arr;
          }
          item.unshift("");
          if (obj.data) {
              item.open = true;
              item.data = obj.data.map(r => {
                  return this._toTree(r);
              });
          }
          else
              item.id = obj.id;
          return item;
      }
      getTable(data) {
          const fields = this.getFields(data[0]);
          this._state.fields = fields;
          this._data = data = this.prepareData(data, fields);
          return {
              id: "webixpivot",
              prepare: true,
              driver: "raw",
              fields: webix.copy(fields),
              data,
          };
      }
      prepareData(data, fields) {
          fields = fields.filter(field => field.prepare || field.type == "date");
          if (fields.length) {
              data = data.map(item => {
                  fields.forEach(field => {
                      item[field.id] = field.prepare
                          ? field.prepare(item[field.id])
                          : new Date(item[field.id]);
                  });
                  return item;
              });
          }
          return data;
      }
      collectFieldValues(field) {
          if (this._filtersHash[field])
              return webix.promise.resolve(this._filtersHash[field]);
          const app = this._app;
          if (app.config.externalProcessing)
              return (this._filtersHash[field] = app
                  .getService("backend")
                  .collectFieldValues(field));
          const fieldObj = this.getField(field);
          const hash = {};
          const values = [];
          for (let i = 0; i < this._data.length; i++) {
              let value = this._data[i][field];
              if (value || value === 0) {
                  let label = value;
                  if (fieldObj.type == "date")
                      value = value.valueOf();
                  if (!hash[value]) {
                      hash[value] = true;
                      if (fieldObj.predicate)
                          label = app.config.predicates[fieldObj.predicate](label);
                      values.push({ value, id: value, label });
                  }
              }
          }
          this._filtersHash[field] = values;
          return webix.promise.resolve(values);
      }
      fixMath(math) {
          const _ = this._app.getService("locale")._;
          const fields = this._state.fields;
          const fieldsRegex = new RegExp(fields.map(field => "\\b" + field.id + "\\b(?!\\()").join("|"), "g");
          const methods = this.operations;
          const methodsRegex = new RegExp(methods.map(method => "\\b" + method.id + "\\b\\(").join("|"), "g");
          return math
              .replaceAll(fieldsRegex, id => fields.find(obj => obj.id == id).value)
              .replaceAll(methodsRegex, method => _(method.substring(0, method.length - 1)) + "(");
      }
      getField(id) {
          return this._state.fields.find(obj => obj.id == id);
      }
      getOperation(id) {
          return this.operations.find(obj => obj.id == id);
      }
      getColumns() {
          const struct = this._state.structure;
          if (this._state.mode == "chart" && struct.groupBy)
              return [struct.groupBy];
          else
              return struct.columns;
      }
      getRows() {
          return this._state.mode == "chart" ? [] : this._state.structure.rows;
      }
      getLimits() {
          return {};
      }
      getHeader(hdata) {
          const header = hdata.data;
          const rows = [];
          hdata.nonEmpty.forEach((v, i) => {
              rows.push({
                  id: v + 1,
                  header: header.map(h => {
                      h =
                          h[i] && !webix.isUndefined(h[i].text) ? h[i] : { text: h[i] || "" };
                      const op = hdata.meta[i] && hdata.meta[i].operation;
                      if (op)
                          h.operation = op;
                      return h;
                  }),
                  format: hdata.meta[i] && hdata.meta[i].format,
              });
          });
          return rows;
      }
      setDimensions() {
          this._reng.resetDimensions();
          const columns = this.getColumns();
          const fields = columns.concat(this.getRows() || []);
          for (let i = 0; i < fields.length; i++) {
              const field = this.getField(fields[i]);
              this._reng.addDimension({
                  id: fields[i],
                  table: this._table.id,
                  label: fields[i],
                  rule: {
                      by: field.predicate ? `${field.predicate}(${fields[i]})` : fields[i],
                  },
              });
          }
      }
      getChartData(result, header) {
          const state = this._state;
          const ops = state.structure.values;
          let data = [];
          let values = [];
          if (result.data.length) {
              const chartType = state.chart.type;
              const groupBy = state.structure.groupBy;
              const first = webix.copy(result.data[0]);
              const axis = groupBy ? header.data[0] : first.map(() => "");
              let count = 0;
              while (first.length) {
                  let item = first.splice(0, ops.length);
                  if (item.length) {
                      let text = axis[count].text;
                      if (text === 0)
                          text = "0";
                      if (chartType == "pie" || chartType == "donut") {
                          for (let i = 0; i < item.length; i++)
                              item[i] = { value: item[i], color: ops[i].color };
                          if (groupBy)
                              data.push({
                                  text: text || axis[count],
                                  color: this.getValueColor(count / ops.length, true),
                                  data: item,
                              });
                          else
                              data = item;
                      }
                      else {
                          item.push(text || axis[count]);
                          data.push(item);
                      }
                      count += ops.length;
                  }
                  else
                      break;
              }
          }
          for (let i = 0; i < ops.length; i++) {
              const op = ops[i];
              let name = op.operation == "complex" ? op.math : op.name;
              name = Array.isArray(name) ? name.join(",") : name;
              values.push({
                  text: name || op.operation,
                  operation: op.operation,
                  color: op.color,
              });
          }
          return { data, values };
      }
      getPalette() {
          return [
              ["#e33fc7", "#a244ea", "#476cee", "#36abee", "#58dccd", "#a7ee70"],
              ["#d3ee36", "#eed236", "#ee9336", "#ee4339", "#595959", "#b85981"],
              ["#c670b8", "#9984ce", "#b9b9e2", "#b0cdfa", "#a0e4eb", "#7faf1b"],
              ["#b4d9a4", "#f2f79a", "#ffaa7d", "#d6806f", "#939393", "#d9b0d1"],
              ["#780e3b", "#684da9", "#242464", "#205793", "#5199a4", "#065c27"],
              ["#54b15a", "#ecf125", "#c65000", "#990001", "#363636", "#800f3e"],
          ];
      }
      getValueColor(i, pieGroup) {
          const palette = this.getPalette(pieGroup);
          let rowIndex = i / palette[0].length;
          rowIndex = rowIndex == palette.length ? 0 : parseInt(rowIndex, 10);
          const columnIndex = i % palette[0].length;
          return palette[rowIndex][columnIndex];
      }
      clearAll() {
          this._app.config.fields = null;
          this._state.fields = [];
          this._app.setStructure({});
          delete this._table;
          this._store = this.getPivotData();
          this._data = [];
          this._filtersHash = {};
      }
  }

  class Backend {
      constructor(app, url) {
          this.app = app;
          this._url = url;
      }
      url(path) {
          return this._url + (path || "");
      }
      data() {
          let config;
          let url = this.url();
          if (this.app.config.externalProcessing) {
              url += "/data";
              const state = this.app.getState();
              const mode = state.mode;
              config = {
                  structure: state.structure,
                  mode,
              };
              if (mode != "chart")
                  config.table = state.datatable;
          }
          return webix.ajax(url, config).then(res => res.json());
      }
      collectFieldValues(field) {
          return webix.ajax(this.url("/fields/" + field)).then(res => res.json());
      }
  }

  class App extends JetApp {
      constructor(config) {
          const mode = config.mode || "tree";
          let structure = config.structure || {};
          const chart = config.chart || {};
          webix.extend(chart, { type: "bar", scale: "linear", lines: true });
          delete chart.id;
          const datatable = config.datatable || {};
          delete datatable.id;
          const state = createState({
              mode,
              structure,
              readonly: config.readonly || false,
              fields: config.fields || [],
              datatable,
              chart,
              config: false,
          });
          const defaults = {
              router: EmptyRouter,
              version: "10.1.0",
              debug: true,
              compactWidth: 720,
              start: "main/" + (mode == "chart" ? "chart" : "table"),
              params: { state, forceCompact: config.compact },
          };
          super(Object.assign(Object.assign({}, defaults), config));
          this.setService("backend", new (this.dynamic(Backend))(this, this.config.url));
          this.setService("local", new (this.dynamic(LocalData))(this, config));
          initJetWin(this);
          structure = this.prepareStructure(structure, true);
          this.use(plugins.Locale, this.config.locale || {
              lang: "en",
              webix: {
                  en: "en-US",
              },
          });
      }
      dynamic(obj) {
          return this.config.override ? this.config.override.get(obj) || obj : obj;
      }
      require(type, name) {
          if (type === "jet-views")
              return views[name];
          else if (type === "jet-locales")
              return locales[name];
          return null;
      }
      getState() {
          return this.config.params.state;
      }
      setStructure(structure) {
          this.getState().structure = this.prepareStructure(structure);
      }
      getStructure() {
          return this.getState().structure;
      }
      prepareStructure(structure, initial) {
          const mode = this.getState().mode;
          webix.extend(structure, {
              rows: [],
              columns: [],
              values: [],
              filters: [],
          });
          if (initial) {
              if ((mode != "chart" || !structure.groupBy) && structure.columns.length)
                  structure.groupBy = structure.columns[0];
              else if (structure.groupBy)
                  structure.columns = [structure.groupBy];
          }
          else {
              if (mode != "chart")
                  structure.groupBy = structure.columns[0];
              else {
                  if (!structure.groupBy)
                      structure.columns = [];
                  else if (structure.columns[0] !== structure.groupBy)
                      structure.columns = [structure.groupBy];
              }
          }
          const values = [];
          for (let i = 0; i < structure.values.length; i++) {
              const value = structure.values[i];
              if (webix.isArray(value.operation)) {
                  value.color =
                      (webix.isArray(value.color) ? value.color : [value.color]) || [];
                  for (let i = 0; i < value.operation.length; i++) {
                      const obj = Object.assign({}, value);
                      obj.operation = value.operation[i];
                      obj.color = value.color && value.color[i];
                      values.push(obj);
                  }
              }
              else
                  values.push(value);
          }
          for (let i = 0; i < values.length; i++) {
              const local = this.getService("local");
              if (!values[i].color)
                  values[i].color = local.getValueColor(i);
              if (!values[i].name && !values[i].math) {
                  values[i].math = values[i].operation;
                  values[i].operation = "complex";
              }
              else if (local.getOperation(values[i].operation).fields > 2) {
                  const name = values[i].name;
                  values[i].math = `${values[i].operation}(${webix.isArray(name) ? name.join() : name})`;
                  values[i].operation = "complex";
              }
          }
          structure.values = values;
          return structure;
      }
  }
  webix.protoUI({
      name: "pivot",
      app: App,
      defaults: {
          borderless: false,
      },
      $init: function () {
          this.name = "pivot";
          this.$view.className += " webix_pivot";
          const state = this.$app.getState();
          for (let key in state) {
              link(state, this.config, key);
          }
          this.$app.attachEvent("filter:change", (field, value) => this.callEvent("onFilterChange", [field, value]));
      },
      $exportView: function (options) {
          const exportView = this.$app.getRoot().queryView({ $mainView: true });
          return exportView.$exportView
              ? exportView.$exportView(options)
              : exportView;
      },
      getState() {
          return this.$app.getState();
      },
      getService(name) {
          return this.$app.getService(name);
      },
      setStructure: function (structure) {
          this.$app.setStructure(structure);
      },
      getStructure: function () {
          return this.$app.getStructure();
      },
      clearAll: function () {
          this.$app.getService("local").clearAll();
      },
  }, webix.ui.jetapp);
  const services = { Backend, LocalData };
  const locales = { en };

  exports.App = App;
  exports.locales = locales;
  exports.services = services;
  exports.views = views;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
