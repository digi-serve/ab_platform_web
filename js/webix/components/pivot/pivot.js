/**
 * @license
 * Webix Pivot v.8.1.1
 * This software is covered by Webix Commercial License.
 * Usage without proper license is prohibited.
 * (c) XB Software Ltd.
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

	webix.i18n.pivot = webix.extend(webix.i18n.pivot || {}, {
	  apply: "Apply",
	  bar: "Bar",
	  cancel: "Cancel",
	  chart: "Chart",
	  chartType: "Chart type",
	  columns: "Columns",
	  count: "count",
	  date: "date",
	  datepicker: "datepicker",
	  fields: "Fields",
	  filters: "Filters",
	  groupBy: "Group By",
	  line: "Line",
	  logScale: "Logarithmic scale",
	  max: "max",
	  min: "min",
	  multicombo: "multi-select",
	  operationNotDefined: "Operation is not defined",
	  layoutIncorrect: "pivotLayout should be an Array instance",
	  pivotMessage: "Click to configure",
	  popupHeader: "Pivot Settings",
	  radar: "Radar",
	  radarArea: "Area Radar",
	  rows: "Rows",
	  select: "select",
	  settings: "Settings",
	  stackedBar: "Stacked Bar",
	  sum: "sum",
	  text: "text",
	  total: "Total",
	  values: "Values",
	  valuesNotDefined: "Values or Group field are not defined",
	  windowTitle: "Pivot Configuration",
	  windowMessage: "move fields here"
	});

	webix.protoUI({
	  name: "webix_pivot_popup",
	  _selected: null,
	  defaults: {
	    autoheight: true,
	    padding: 0
	  },
	  $init: function (config) {
	    webix.extend(config, this._get_ui(config));
	    this.$ready.push(this._after_init);
	  },
	  _get_ui: function (config) {
	    return {
	      body: {
	        id: "list",
	        view: "list",
	        borderless: true,
	        autoheight: true,
	        template: "#title#",
	        data: config.data
	      }
	    };
	  },
	  _after_init: function () {
	    this.attachEvent("onItemClick", function (id) {
	      this._selected = this.$eventSource.getItem(id);
	      this.hide();
	    });
	  },
	  getSelected: function () {
	    return this._selected;
	  }
	}, webix.ui.popup, webix.IdSpace);

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

	function _classCallCheck(instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	}

	function _defineProperties(target, props) {
	  for (var i = 0; i < props.length; i++) {
	    var descriptor = props[i];
	    descriptor.enumerable = descriptor.enumerable || false;
	    descriptor.configurable = true;
	    if ("value" in descriptor) descriptor.writable = true;
	    Object.defineProperty(target, descriptor.key, descriptor);
	  }
	}

	function _createClass(Constructor, protoProps, staticProps) {
	  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
	  if (staticProps) _defineProperties(Constructor, staticProps);
	  return Constructor;
	}

	function formatFilterValues(filters) {
	  filters = filters || [];

	  for (var i = 0; i < filters.length; i++) {
	    filters[i].fvalue = getFormattedValue(filters[i].value);
	  }
	}

	function getFormattedValue(value) {
	  value = value || "";

	  if (webix.isDate(value)) {
	    value = value.valueOf().toString();
	  } else if (typeof value == "string") {
	    if (value.trim) value = value.trim();
	  }

	  return value;
	}

	function processFilters(view) {
	  var i,
	      f,
	      config = view.config,
	      filters = config.structure.filters || [],
	      item,
	      items = [],
	      indexes = {};

	  for (i = 0; i < filters.length; i++) {
	    f = filters[i];
	    if (webix.isUndefined(indexes[f.type])) indexes[f.type] = [];
	    indexes[f.type].push(i);
	    var type = f.type === "multiselect" ? "multicombo" : f.type === "select" ? "richselect" : f.type;
	    item = {
	      value: webix.isUndefined(f.value) ? "" : f.value,
	      point: false,
	      field: f.name,
	      view: type,
	      minWidth: config.filterMinWidth,
	      maxWidth: config.filterWidth
	    }; //placeholder API

	    if (config.filterPlaceholder) {
	      if (typeof config.filterPlaceholder === "boolean") {
	        item.placeholder = item.label;
	        item.label = "";
	      } else item.placeholder = config.filterPlaceholder;
	    }

	    if (f.type == "multicombo") item.tagMode = false;

	    if (view.filters.isSelect(f.type)) {
	      item.options = {};
	      item.options.data = distinctValues(view, f.name, f.type.indexOf("multi") == -1);
	      item.options.point = false;
	      if (type == "richselect") item.options.css = "webix_pivot_richselect_suggest";
	      if (type == "multicombo") item.options.css = "webix_pivot_multicombo_suggest";
	    }

	    if (!config.separateLabel) {
	      item.label = view._applyMap(f.name);
	      item.labelAlign = config.filterLabelAlign;
	      item.labelWidth = config.filterLabelWidth;
	    }

	    if (view.callEvent("onFilterCreate", [f, item])) {
	      if (config.separateLabel) {
	        var label = view._applyMap(f.name);

	        items.push({
	          cols: [{
	            view: "label",
	            autowidth: true,
	            label: label
	          }, {
	            width: 10
	          }, item, {
	            width: 18
	          }]
	        });
	      } else {
	        items.push(item);
	      }
	    }
	  }

	  return items;
	}

	function distinctValues(view, field, empty) {
	  var value,
	      values = [],
	      data = view.data.pull,
	      hash = {};
	  if (empty) values.push({
	    value: "",
	    id: "",
	    $empty: true
	  });
	  if (view._pivotOptions && view._pivotOptions[field]) return values.concat(view._pivotOptions[field]);

	  for (var obj in data) {
	    value = data[obj][field];

	    if (!webix.isUndefined(value)) {
	      if ((value || value === 0) && !hash[value]) {
	        values.push({
	          value: value.toString(),
	          id: value.toString()
	        });
	        hash[value] = true;
	      }
	    }
	  }

	  var isNumeric = function (n) {
	    return !isNaN(parseFloat(n));
	  };

	  values.sort(function (a, b) {
	    var val1 = a.value;
	    var val2 = b.value;
	    if (!val2) return 1;
	    if (!val1) return -1;

	    if (!isNumeric(val1) || !isNumeric(val2)) {
	      val1 = val1.toString().toLowerCase();
	      val2 = val2.toString().toLowerCase();
	    }

	    return val1 > val2 ? 1 : val1 < val2 ? -1 : 0;
	  });
	  return values;
	}

	function showFilters(view, filters) {
	  setEvents(view, filters);
	  var config = {
	    elements: filters
	  };
	  view.callEvent("onViewInit", ["filters", config]);

	  if (config.elements && view.getFilterView()) {
	    if (filters.length > 0) {
	      view.getFilterView().show();
	      webix.ui(filters, view.getFilterView());
	    } else {
	      view.getFilterView().hide();
	    }
	  }
	}

	function setEvents(view, filters) {
	  for (var i = 0; i < filters.length; i++) {
	    var event = void 0,
	        filter = filters[i];
	    if (filter.cols) filter = filter.cols[2];
	    event = filter.view == "text" ? "onTimedKeyPress" : "onChange";
	    filter.on = {};

	    filter.on[event] = function () {
	      var value = this.getValue();
	      if (value && this.config.separator && !this.format_setter) value = value.split(this.config.separator);
	      changeFilterValue(view, this.config.field, value);
	    };
	  }
	}

	function changeFilterValue(view, field, value) {
	  var filters = view.config.structure.filters;

	  for (var i = 0; i < filters.length; i++) {
	    if (filters[i].name == field) {
	      filters[i].value = value;
	      view.callEvent("onFilterChange", [field, value]);
	      return true;
	    }
	  }

	  return false;
	}

	var clickHandlers = {
	  "add": function (e, id) {
	    var pivot = webix.$$(this.config.pivot);
	    var item = this.$$("values").getItem(id);
	    item.operation.push(pivot.config.defaultOperation);
	    this.$$("values").updateItem(id);
	    webix.delay(function () {
	      var index = item.operation.length - 1;
	      var els = this.$$("values").getItemNode(id).childNodes;
	      var el = null;

	      for (var i = 0; i < els.length; i++) {
	        el = els[i];
	        if (!el.getAttribute) continue;
	        var op = el.getAttribute("webix_operation");
	        if (!webix.isUndefined(op) && op == index) break;
	      }

	      if (el !== null) clickHandlers.selector.call(this, el, id, el);
	    }, this);
	  },
	  "filter-selector": function (e, id, el) {
	    var popup,
	        pivot = webix.$$(this.config.pivot),
	        selector = {
	      view: "webix_pivot_popup",
	      css: "webix_pivot_popup",
	      autofit: true,
	      autoheight: true,
	      width: 150,
	      data: getFilterOptions(pivot.filters.get(), pivot._applyLocale)
	    };
	    popup = webix.ui(selector);
	    popup.show(el);
	    popup.attachEvent("onHide", webix.bind(function () {
	      var sel = popup.getSelected();

	      if (sel !== null) {
	        var item = this.$$("filters").getItem(id);
	        item.type = sel.name;
	        item.value = "";
	        this.$$("filters").updateItem(id);
	      }

	      popup.close();
	    }, this));
	  },
	  "chart-selector": function (e, id, el) {
	    var popup,
	        pivot = webix.$$(this.config.pivot),
	        selector = {
	      view: "webix_pivot_popup",
	      css: "webix_pivot_popup",
	      autofit: true,
	      autoheight: true,
	      width: 150,
	      data: getFilterOptions(pivot.filters.get(), pivot._applyLocale)
	    };
	    popup = webix.ui(selector);
	    popup.show(el);
	    popup.attachEvent("onHide", webix.bind(function () {
	      var sel = popup.getSelected();

	      if (sel !== null) {
	        var item = this.$$("filters").getItem(id);
	        item.type = sel.name;
	        item.value = "";
	        this.$$("filters").updateItem(id);
	      }

	      popup.close();
	    }, this));
	  },
	  "selector": function (e, id, el) {
	    var func_selector = {
	      view: "webix_pivot_popup",
	      css: "webix_pivot_popup",
	      autofit: true,
	      width: 150,
	      data: this.config.operations || []
	    };
	    var p = webix.ui(func_selector);
	    p.show(el);
	    p.attachEvent("onHide", webix.bind(function () {
	      var index = webix.html.locate(e, "webix_operation");
	      var sel = p.getSelected();

	      if (sel !== null) {
	        this.$$("values").getItem(id).operation[index] = sel.name;
	        this.$$("values").updateItem(id);
	      }

	      p.close();
	    }, this));
	  },
	  "remove": function (e, id) {
	    var list = webix.$$(e);
	    var listId = this.innerId(list.config.id);
	    var item = this.$$(listId).getItem(id);

	    if (listId == "values") {
	      var index = webix.html.locate(e, "webix_operation");

	      if (item.operation.length > 1) {
	        item.operation.splice(index, 1);
	        this.$$("values").updateItem(id);
	      } else {
	        this._removeListField("values", item);
	      }
	    } else {
	      this._removeListField(listId, item);
	    }

	    return false;
	  }
	};

	function getFilterOptions(filters, process) {
	  var i,
	      name,
	      items = [];

	  for (i = 0; i < filters.length; i++) {
	    name = filters[i];
	    items.push({
	      name: name,
	      title: process(name)
	    });
	  }

	  return items;
	}

	function setStructure(view, baseName, structure, config) {
	  var uiArrays = ["rows", "cols"],
	      uiViews = ["head", "body"],
	      popup = view,
	      eventH = config.on ? config.on.onViewInit : null;

	  var checkStructure = function (id, obj) {
	    var i, j, name;

	    for (i = 0; i < uiViews.length; i++) {
	      name = null;

	      if (obj[uiViews[i]]) {
	        if (typeof obj[uiViews[i]] == "string") {
	          name = obj[uiViews[i]];
	          obj[uiViews[i]] = structure[name];
	        }

	        checkStructure(name, obj[uiViews[i]]);
	      }
	    }

	    for (i = 0; i < uiArrays.length; i++) {
	      if (obj[uiArrays[i]]) {
	        var elements = obj[uiArrays[i]];

	        for (j = 0; j < elements.length; j++) {
	          name = null;

	          if (typeof elements[j] == "string") {
	            name = elements[j];
	            obj[uiArrays[i]][j] = structure[name];
	          }

	          checkStructure(name, obj[uiArrays[i]][j]);
	        }
	      }
	    }

	    if (id && id != baseName && !obj.id) obj.id = id;

	    if (id) {
	      if (eventH) eventH.apply(popup, [id, obj]);
	    }
	  };

	  checkStructure(baseName, structure[baseName]);
	  return structure[baseName];
	}

	var popupTemplates = {
	  header: function (obj) {
	    return webix.i18n.pivot[obj.value];
	  },
	  iconHeader: function (obj) {
	    if (obj.icon) return "<span class='webix_pivot_header_icon webix_pivot_icon pt-" + obj.icon + "'></span>" + webix.i18n.pivot[obj.value];else return "<span class='webix_pivot_header_icon'>" + obj.iconContent + "</span>" + webix.i18n.pivot[obj.value];
	  },
	  tableValues: function (obj) {
	    var pivot = webix.$$(this.config.pivot);
	    obj.operation = obj.operation || [pivot.config.defaultOperation];
	    if (!webix.isArray(obj.operation)) obj.operation = [obj.operation];
	    var ops = [];
	    var locale = pivot._applyLocale;

	    for (var i = 0; i < obj.operation.length; i++) {
	      var op = "<div class='webix_pivot_link' webix_operation='" + i + "'>";
	      op += "<span>" + obj.text + "</span>";
	      op += "<span class='webix_link_selection'>" + locale(obj.operation[i]) + "</span>";
	      op += "<span class='webix_pivot_minus webix_icon webix_pivot_close'>&#10005;</span>";
	      op += "</div>";
	      ops.push(op);
	    }

	    return ops.join(" ");
	  },
	  chartValues: function (obj) {
	    var pivot = webix.$$(this.config.pivot);
	    obj.operation = obj.operation || [pivot.config.defaultOperation];
	    obj.color = obj.color || [];
	    if (!webix.isArray(obj.operation)) obj.operation = [obj.operation];
	    var ops = [];
	    var locale = pivot._applyLocale;

	    for (var i = 0; i < obj.operation.length; i++) {
	      if (!obj.color || !obj.color[i]) {
	        obj.color[i] = pivot._getColor(this._valueLength);
	        this._valueLength++;
	      }

	      var op = "<div class='webix_pivot_link' webix_operation='" + i + "'>";
	      op += "<div class='webix_color_selection'><div style='background-color:" + locale(obj.color[i]) + "'></div></div>";
	      op += "<div class='webix_link_title'>" + obj.text + "</div>";
	      op += "<div class='webix_link_selection'>" + locale(obj.operation[i]) + "</div>";
	      op += "<span class='webix_pivot_minus webix_icon webix_pivot_close'>&#10005;</span>";
	      op += "</div>";
	      ops.push(op);
	    }

	    return ops.join(" ");
	  },
	  filters: function (obj) {
	    var pivot = webix.$$(this.config.pivot);
	    obj.type = obj.type || pivot.filters.getDefault();
	    var html = "<a class='webix_pivot_link'>" + obj.text;
	    html += "<span class='webix_link_selection'>" + pivot._applyLocale(obj.type) + "</span>";
	    html += "</a> ";
	    html += "<span class='webix_pivot_minus webix_icon webix_pivot_close'>&#10005;</span>";
	    return html;
	  },
	  rows: function (obj) {
	    var html = "<a class='webix_pivot_link'>" + obj.text;
	    html += "</a> ";
	    html += "<span class='webix_pivot_minus webix_icon webix_pivot_close'>&#10005;</span>";
	    return html;
	  },
	  columns: function (obj) {
	    var html = "<a class='webix_pivot_link'>" + obj.text;
	    html += "</a> ";
	    html += "<span class='webix_pivot_minus webix_icon webix_pivot_close'>&#10005;</span>";
	    return html;
	  },
	  groupBy: function (obj) {
	    var html = "<a class='webix_pivot_link'>" + obj.text;
	    html += "</a> ";
	    html += "<span class='webix_pivot_minus webix_icon webix_pivot_close'>&#10005;</span>";
	    return html;
	  },
	  listDrag: function (obj) {
	    return "<a class='webix_pivot_link'>" + obj.text + "</a> ";
	  }
	};

	webix.protoUI({
	  name: "webix_pivot_config_common",
	  $init: function (config) {
	    webix.extend(config, this.defaults);
	    webix.extend(config, this._getUI(config), true);
	    this.$ready.push(this._afterInit);
	  },
	  defaults: {
	    padding: 8,
	    height: 500,
	    width: 700,
	    cancelButtonWidth: 100,
	    applyButtonWidth: 85,
	    head: false,
	    modal: true,
	    move: true
	  },
	  _getUI: function () {
	    return {};
	  },
	  _afterInit: function () {},
	  setStructure: function (config) {
	    this.define("structure", config);
	    this.render();
	  },
	  getStructure: function () {
	    return {};
	  },
	  _lists: [],
	  _dndCorrection: {},
	  data_setter: function (value) {
	    value = webix.copy(value);
	    var data,
	        i,
	        fields = value.fields,
	        lists = this._lists;
	    fields.forEach(function (field) {
	      lists.forEach(function (listName) {
	        data = value[listName];
	        data.forEach(function (item) {
	          if (item.name == field.name) field.$css = " webix_pivot_field_selected";
	        });
	      });
	    });
	    this.$$("fields").clearAll();
	    this.$$("fields").parse(fields);

	    for (i = 0; i < lists.length; i++) {
	      this.$$(lists[i]).clearAll();
	      this.$$(lists[i]).parse(value[lists[i]]);
	    }
	  },
	  _dropField: function (ctx) {
	    var item,
	        from = ctx.from,
	        to = ctx.to;

	    if (to && to != from) {
	      item = webix.copy(from.getItem(ctx.start));
	      if (to == this.$$("fields")) this._removeListField(this.innerId(from.config.id), item);else this._addListField(this.innerId(to.config.id), item, ctx.index);
	      return false;
	    }
	  },
	  _addListField: function (list, item, index) {
	    this._handlers[list].call(this, list, item, index);
	  },
	  _removeListField: function (list, item) {
	    this.$$(list).remove(item.id);
	    var lists = this._lists;
	    var found = false;

	    for (var i = 0; !found && i < lists.length; i++) {
	      this.$$(lists[i]).data.each(function (field) {
	        if (field.name == item.name) found = field;
	      });
	    }

	    if (!found) this._setPivotFieldCss(item.name, "");
	  },
	  _setPivotFieldCss: function (name, css) {
	    this.$$("fields").data.each(function (item) {
	      if (item.name == name) {
	        item.$css = " " + css;
	        this.refresh(item.id);
	      }
	    });
	  },
	  _handlers: {
	    "filters": function (listName, item) {
	      var found = false,
	          name = item.name,
	          list = this.$$(listName);
	      list.data.each(function (field) {
	        if (field.name == name) {
	          found = true;
	        }
	      });

	      if (!found) {
	        delete item.id;
	        list.add(item);

	        this._setPivotFieldCss(name, "webix_pivot_field_selected");

	        this._correctLists(name, listName);
	      }
	    },
	    "rows": function (listName, item) {
	      var found = false,
	          name = item.name,
	          list = this.$$(listName);
	      list.data.each(function (field) {
	        if (field.name == name) {
	          found = true;
	        }
	      });

	      if (!found) {
	        delete item.id;
	        list.add(item);

	        this._setPivotFieldCss(name, "webix_pivot_field_selected");

	        this._correctLists(name, listName);
	      }
	    },
	    "columns": function (listName, item) {
	      this._handlers.rows.call(this, listName, item);
	    },
	    "values": function (listName, item, index) {
	      var targetItem = null,
	          list = this.$$(listName);
	      list.data.each(function (field) {
	        if (field.name == item.name) {
	          targetItem = field;
	        }
	      });

	      if (targetItem) {
	        clickHandlers.add.call(this, {}, targetItem.id);
	      } else {
	        this._setPivotFieldCss(item.name, "webix_pivot_field_selected");

	        list.add(webix.copy(item), index);
	      }

	      this._correctLists(item.name, listName);
	    },
	    "groupBy": function (listName, item) {
	      if (this.$$(listName).data.order.length) {
	        var id = this.$$(listName).getFirstId();

	        this._removeListField(listName, this.$$("groupBy").getItem(id));
	      }

	      this._setPivotFieldCss(item.name, "webix_pivot_field_selected");

	      delete item.id;
	      this.$$(listName).add(item);

	      this._correctLists(item.name, listName);
	    }
	  },
	  _correctLists: function (name, listName) {
	    var i,
	        res,
	        lists = this._dndCorrection[listName];

	    for (i = 0; lists && i < lists.length; i++) {
	      res = null;
	      this.$$(lists[i]).data.each(function (item) {
	        if (item.name == name) res = item;
	      });
	      if (res) this.$$(lists[i]).remove(res.id);
	    }
	  },
	  _setStructure: function (structure, config) {
	    return setStructure(this, "popup", structure, config);
	  },
	  _listDragHTML: function (context) {
	    if (context.start) {
	      var item = this.getItem(context.start);
	      context.html = this.type.templateStart(item, this.type) + popupTemplates.listDrag(item) + this.type.templateEnd(item, this.type);
	    }
	  },
	  _getListEvents: function () {
	    return {
	      onBeforeDrop: webix.bind(this._dropField, this),
	      onBeforeDrag: this._listDragHTML,
	      onBeforeDragIn: function () {
	        webix.html.addCss(webix.DragControl.getNode(), "webix_pivot_drag_zone", true);
	      }
	    };
	  }
	}, webix.ui.window, webix.IdSpace);

	function getStructureMap(view, config) {
	  return {
	    "popup": {
	      width: config.popupWidth,
	      head: "toolbar",
	      body: "body"
	    },
	    "toolbar": {
	      view: "toolbar",
	      borderless: true,
	      padding: 10,
	      cols: ["configTitle", {
	        margin: 6,
	        cols: ["cancel", "apply"]
	      }]
	    },
	    "configTitle": {
	      id: "configTitle",
	      view: "label",
	      label: webix.i18n.pivot.windowTitle || ""
	    },
	    "cancel": {
	      view: "button",
	      id: "cancel",
	      label: webix.i18n.pivot.cancel,
	      width: config.cancelButtonWidth
	    },
	    "apply": {
	      view: "button",
	      id: "apply",
	      type: "form",
	      label: webix.i18n.pivot.apply,
	      width: config.applyButtonWidth
	    },
	    "body": {
	      type: "wide",
	      rows: [{
	        css: "webix_pivot_fields_layout",
	        type: "space",
	        cols: ["fieldsLayout", {
	          type: "wide",
	          rows: [{
	            type: "wide",
	            css: "webix_pivot_configuration",
	            rows: [{
	              type: "wide",
	              cols: ["filtersLayout", "columnsLayout"]
	            }, {
	              type: "wide",
	              cols: ["rowsLayout", "valuesLayout"]
	            }]
	          }]
	        }]
	      }]
	    },
	    "fieldsLayout": {
	      width: config.fieldsColumnWidth,
	      rows: ["fieldsHeader", "fields"]
	    },
	    "filtersLayout": {
	      rows: ["filtersHeader", "filters"]
	    },
	    "columnsLayout": {
	      rows: ["columnsHeader", "columns"]
	    },
	    "rowsLayout": {
	      rows: ["rowsHeader", "rows"]
	    },
	    "valuesLayout": {
	      rows: ["valuesHeader", "values"]
	    },
	    "fieldsHeader": {
	      id: "fieldsHeader",
	      data: {
	        value: "fields"
	      },
	      css: "webix_pivot_header_fields",
	      template: popupTemplates.header,
	      height: 40
	    },
	    "fields": {
	      id: "fields",
	      css: "webix_pivot_fields",
	      view: "list",
	      scroll: "auto",
	      type: {
	        height: "auto"
	      },
	      drag: true,
	      template: "<span class='webix_pivot_list_marker'></span>#text#<span class='webix_pivot_icon pt-list-drag'></span>",
	      on: view._getListEvents()
	    },
	    "filtersHeader": {
	      id: "filtersHeader",
	      data: {
	        value: "filters",
	        icon: "filter"
	      },
	      template: popupTemplates.iconHeader,
	      css: "webix_pivot_popup_title",
	      height: 40
	    },
	    "filters": {
	      id: "filters",
	      view: "list",
	      drag: true,
	      scroll: "auto",
	      template: webix.bind(popupTemplates.filters, view),
	      type: {
	        height: "auto"
	      },
	      onClick: {
	        "webix_link_selection": webix.bind(clickHandlers["filter-selector"], view),
	        "webix_pivot_minus": webix.bind(clickHandlers.remove, view)
	      },
	      on: view._getListEvents()
	    },
	    "columnsHeader": {
	      id: "columnsHeader",
	      data: {
	        value: "columns",
	        icon: "columns"
	      },
	      template: popupTemplates.iconHeader,
	      css: "webix_pivot_popup_title",
	      height: 40
	    },
	    "columns": {
	      id: "columns",
	      view: "list",
	      drag: true,
	      scroll: "auto",
	      type: {
	        height: "auto"
	      },
	      template: webix.bind(popupTemplates.columns, view),
	      on: view._getListEvents(),
	      onClick: {
	        "webix_pivot_minus": webix.bind(clickHandlers.remove, view)
	      }
	    },
	    "rowsHeader": {
	      id: "rowsHeader",
	      data: {
	        value: "rows",
	        icon: "list"
	      },
	      template: popupTemplates.iconHeader,
	      css: "webix_pivot_popup_title",
	      height: 40
	    },
	    "rows": {
	      id: "rows",
	      view: "list",
	      drag: true,
	      scroll: "auto",
	      template: webix.bind(popupTemplates.rows, view),
	      type: {
	        height: "auto"
	      },
	      on: view._getListEvents(),
	      onClick: {
	        "webix_pivot_minus": webix.bind(clickHandlers.remove, view)
	      }
	    },
	    "valuesHeader": {
	      id: "valuesHeader",
	      data: {
	        value: "values",
	        icon: "values"
	      },
	      template: popupTemplates.iconHeader,
	      css: "webix_pivot_popup_title",
	      height: 40
	    },
	    "values": {
	      id: "values",
	      view: "list",
	      scroll: "auto",
	      drag: true,
	      css: "webix_pivot_values",
	      type: {
	        height: "auto"
	      },
	      template: webix.bind(popupTemplates.tableValues, view),
	      onClick: {
	        "webix_link_selection": webix.bind(clickHandlers.selector, view),
	        "webix_pivot_plus": webix.bind(clickHandlers.add, view),
	        "webix_pivot_minus": webix.bind(clickHandlers.remove, view)
	      },
	      on: view._getListEvents()
	    }
	  };
	}

	webix.protoUI({
	  name: "webix_pivot_config",
	  defaults: {
	    fieldsColumnWidth: 230,
	    popupWidth: 890
	  },
	  $init: function () {
	    this.$view.className += " webix_popup webix_pivot";
	  },
	  _getUI: function (config) {
	    var structure = webix.copy(getStructureMap(this, config));
	    return this._setStructure(structure, config);
	  },
	  _lists: ["filters", "columns", "rows", "values"],
	  _dndCorrection: {
	    "rows": ["columns", "values"],
	    "columns": ["rows"],
	    "values": ["rows"]
	  },
	  _afterInit: function () {
	    this.attachEvent("onItemClick", function (id) {
	      var innerId = this.innerId(id);

	      if (innerId == "cancel" || innerId == "apply") {
	        //transform button clicks to events
	        var structure = this.getStructure();

	        if (webix.$$(this.config.pivot).callEvent("onBefore" + innerId, [structure])) {
	          this.callEvent("on" + innerId, [structure]);
	          this.hide();
	        }
	      }
	    });
	    var popupBlocks = this.$view.querySelectorAll(".webix_pivot_configuration .webix_list");

	    for (var i = 0; i < popupBlocks.length; i++) {
	      popupBlocks[i].setAttribute("window-message", webix.i18n.pivot.windowMessage);
	    }
	  },
	  getStructure: function () {
	    var structure = {
	      rows: [],
	      columns: [],
	      values: [],
	      filters: []
	    };
	    var rows = this.$$("rows");
	    rows.data.each(function (obj) {
	      structure.rows.push(obj.name);
	    });
	    var columns = this.$$("columns");
	    columns.data.each(function (obj) {
	      structure.columns.push(obj.name);
	    });
	    var values = this.$$("values");
	    values.data.each(function (obj) {
	      structure.values.push(obj);
	    });
	    var filters = this.$$("filters");
	    filters.data.each(function (obj) {
	      structure.filters.push(obj);
	    });
	    var pivot = webix.$$(this.config.pivot);
	    if (pivot.config.structure.columnSort) structure.columnSort = pivot.config.structure.columnSort;
	    return structure;
	  }
	}, webix.ui.webix_pivot_config_common);

	function freezeTotals(view) {
	  if (view.config.freezeTotal) {
	    var i,
	        columns = view.$$("data").config.columns;
	    var width = getWidth(columns);
	    var totalCount = getTotalCount(columns);

	    for (i = 0; i < view.$$("data").config.leftSplit; i++) {
	      width -= columns[i].width;
	    }

	    for (i = columns.length - 1; i > columns.length - totalCount; i--) {
	      width -= columns[i].width;
	    }

	    if (width > 100) {
	      view.$$("data").config.rightSplit = totalCount;
	      view.$$("data").refreshColumns();
	    }
	  }
	}

	function getTotalCount(columns) {
	  var count = 0;

	  for (var i = columns.length - 1; !count && i >= 0; i--) {
	    if (columns[i].header[0] && columns[i].header[0].name == "total") count = columns.length - i;
	  }

	  return count;
	}

	function getWidth(columns) {
	  var i,
	      width = 0;

	  for (i = 0; i < columns.length; i++) {
	    width += columns[i].width;
	  }

	  return width;
	}

	function isArray(obj) {
	  return Array.isArray ? Array.isArray(obj) : Object.prototype.toString.call(obj) === "[object Array]";
	}
	function isUndefined(a) {
	  return typeof a == "undefined";
	}
	function extend(base, source, force) {
	  //copy methods, overwrite existing ones in case of conflict
	  for (var method in source) {
	    if (!base[method] || force) base[method] = source[method];
	  }

	  return base;
	}
	var seed;
	function uid() {
	  if (!seed) seed = new Date().valueOf();
	  seed++;
	  return seed;
	}

	function getTotalColumnId(master, name) {
	  return "$webixtotal" + master.$divider + name;
	}

	function getValues(item, ids) {
	  var i,
	      value,
	      values = [];

	  for (i = 0; i < ids.length; i++) {
	    value = item[ids[i]];
	    if (!isNaN(parseFloat(value))) values.push(value);
	  }

	  return values;
	}

	function addTotalColumns(master, header) {
	  var groups,
	      groupData,
	      groupName,
	      h,
	      i,
	      hRowCount,
	      parts,
	      totalCols = [];
	  hRowCount = header[0].header.length; // if no selected columns

	  if (hRowCount < 2) return header;
	  groupData = getTotalGroups(master, header);
	  groups = groupData.groups;
	  master._pivotColumnGroups = groups;

	  for (groupName in groups) {
	    // column config
	    h = {
	      id: getTotalColumnId(master, groupName),
	      header: [],
	      sort: "int",
	      width: master.config.columnWidth,
	      format: master.config.format
	    }; // set top headers

	    for (i = 0; i < hRowCount - 1; i++) {
	      if (!i && !totalCols.length) {
	        h.header.push({
	          name: "total",
	          rowspan: hRowCount - 1,
	          colspan: groupData.count
	        });
	      } else h.header.push("");
	    } // set bottom header


	    parts = groupName.split(master.$divider);
	    h.header.push({
	      name: groupName,
	      operation: parts[0],
	      text: parts[1]
	    });
	    totalCols.push(h);
	  }

	  return header.concat(totalCols);
	}

	function getTotalGroups(master, header) {
	  var groupName,
	      i,
	      name,
	      operation,
	      parts,
	      groups = {},
	      groupCount = 0;

	  for (i = 0; i < header.length; i++) {
	    parts = header[i].id.split(master.$divider);
	    name = parts.pop();
	    operation = parts.pop();

	    if (operation == "sum" || master.config.totalColumn != "sumOnly") {
	      groupName = operation + master.$divider + name;

	      if (!groups[groupName]) {
	        groupCount++;
	        groups[groupName] = {
	          operation: operation,
	          ids: [],
	          format: header.format
	        };
	      }

	      groups[groupName].ids.push(header[i].id);
	    }
	  }

	  return {
	    groups: groups,
	    count: groupCount
	  };
	}

	function addTotalData(master, items) {
	  var groups = master._pivotColumnGroups;

	  if (groups) {
	    var group, i, ids, name;

	    for (name in groups) {
	      group = groups[name];
	      ids = group.ids;

	      for (i = 0; i < items.length; i++) {
	        var operation = void 0,
	            columnId = getTotalColumnId(master, name),
	            result = "",
	            values = getValues(items[i], ids);

	        if (values.length) {
	          if (operation = master._pivotOperations.getTotal(name.split(master.$divider)[0])) result = operation.call(master, values, columnId, items[i]);
	        }

	        items[i][columnId] = result;
	        if (items[i].data) items[i].data = addTotalData(master, items[i].data);
	      }
	    }
	  }

	  return items;
	}

	var sortConfig = {
	  dir: 1,
	  as: function (a, b) {
	    if (isNum(a) && isNum(b)) return sorting.int(a, b);
	    return sorting.string(a, b);
	  }
	};
	var sorting = {
	  "date": function (a, b) {
	    a = a - 0;
	    b = b - 0;
	    return a > b ? 1 : a < b ? -1 : 0;
	  },
	  "int": function (a, b) {
	    a = a * 1;
	    b = b * 1;
	    return a > b ? 1 : a < b ? -1 : 0;
	  },
	  "string": function (a, b) {
	    if (!b) return 1;
	    if (!a) return -1;
	    a = a.toString().toLowerCase();
	    b = b.toString().toLowerCase();
	    return a > b ? 1 : a < b ? -1 : 0;
	  }
	};
	function processHeader(master, header) {
	  var i,
	      j,
	      p,
	      text0,
	      vConfig,
	      valuesConfig = master.config.structure.values;
	  header = sortHeader(master.config.structure, header);
	  header = getHeader(master, header);

	  for (i = 0; i < header.length; i++) {
	    var parts = [];

	    for (j = 0; j < header[i].length; j++) {
	      parts.push(header[i][j].name);
	    } // find value configuration


	    vConfig = null;
	    var tmp = parts[parts.length - 1].split(master.$divider);

	    for (j = 0; j < valuesConfig.length && !vConfig; j++) {
	      if (valuesConfig[j].operation) for (p = 0; p < valuesConfig[j].operation.length; p++) {
	        if (valuesConfig[j].name == tmp[1] && valuesConfig[j].operation[p] == tmp[0]) {
	          vConfig = valuesConfig[j];
	        }
	      }
	    }

	    header[i] = {
	      id: parts.join(master.$divider),
	      header: header[i]
	    };
	    header[i].format = vConfig && vConfig.format ? vConfig.format : tmp[0] != "count" ? master.config.format : null;
	  }

	  if (header.length && master.view && master.view.callEvent) master.view.callEvent("onHeaderInit", [header]);
	  if (master.config.totalColumn && header.length) header = addTotalColumns(master, header);
	  header.splice(0, 0, {
	    id: "name",
	    template: "{common.treetable()} #name#",
	    header: {
	      text: text0
	    }
	  });
	  return header;
	}

	function isNum(value) {
	  return !isNaN(value * 1);
	}
	/*
	* get sort properties for a column
	* */


	function setSortConfig(config, column) {
	  var sorting = sortConfig;

	  if (config) {
	    // for a specific columns
	    if (config[column]) sorting = config[column]; // for any other column
	    else if (config.$default) sorting = config.$default;
	    if (sorting.dir) sorting._dir = sorting.dir == "desc" ? -1 : 1;
	    extend(sorting, sortConfig);
	  }

	  return sorting;
	}

	function sortHeader(config, header, cIndex) {
	  var column,
	      i,
	      key,
	      keys,
	      sorting,
	      sorted = [];

	  if (Object.keys && config.columnSort !== false) {
	    cIndex = cIndex || 0;
	    column = config.columns[cIndex];
	    sorting = setSortConfig(config.columnSort, column);
	    keys = Object.keys(header);
	    if (cIndex < config.columns.length) keys = keys.sort(function (a, b) {
	      return sorting.as(a, b) * sorting._dir;
	    });
	    cIndex++;

	    for (i = 0; i < keys.length; i++) {
	      key = keys[i];
	      sorted.push({
	        key: key,
	        data: sortHeader(config, header[key], cIndex)
	      });
	    }
	  } else {
	    for (key in header) {
	      sorted.push({
	        key: key,
	        data: sortHeader(config, header[key])
	      });
	    }
	  }

	  return sorted;
	}

	function getHeader(view, data) {
	  var first,
	      i,
	      item,
	      j,
	      h,
	      header = [];

	  for (i = 0; i < data.length; i++) {
	    item = data[i];

	    if (item.data.length) {
	      var result = getHeader(view, item.data);
	      first = false;

	      for (j = 0; j < result.length; j++) {
	        h = result[j];
	        h.splice(0, 0, {
	          name: item.key
	        });

	        if (!first) {
	          h[0].colspan = result.length;
	          first = true;
	        }

	        header.push(h);
	      }
	    } else {
	      var keys = data[i].key.split(view.$divider);
	      header.push([{
	        name: data[i].key,
	        operation: keys[0],
	        text: keys[1]
	      }]);
	    }
	  }

	  return header;
	}

	function addFooter(master, columns, items) {
	  var config, i, names, operation;

	  for (i = 1; i < columns.length; i++) {
	    config = null;
	    names = columns[i].id.split(master.$divider);
	    operation = names[names.length - 2];

	    if (master.config.footer == "sumOnly") {
	      if (operation != "sum") config = " ";
	    }

	    var totalMethod = master._pivotOperations.getTotal(operation);

	    if (!config && totalMethod) {
	      var options = master._pivotOperations.getTotalOptions(operation);

	      var result = calculateColumn(items, columns[i].id, totalMethod, options && options.leavesOnly);
	      config = {
	        $pivotValue: result,
	        $pivotOperation: operation
	      };
	    } else config = " ";

	    columns[i].footer = config;

	    if (_typeof(master.config.footer) == "object") {
	      extend(columns[i].footer, master.config.footer, true);
	    }
	  }
	}

	function calculateColumn(items, columnId, totalMethod, leaves) {
	  var i,
	      fItems = [],
	      value,
	      values = []; // filter items

	  items = filterItems(items, leaves); // get column values

	  for (i = 0; i < items.length; i++) {
	    value = items[i][columnId];

	    if (!isNaN(parseFloat(value))) {
	      values.push(value * 1);
	      fItems.push(items[i]);
	    }
	  }

	  return totalMethod(values, columnId, fItems);
	}

	function filterItems(items, leaves, selectedItems) {
	  if (!selectedItems) selectedItems = [];

	  for (var i = 0; i < items.length; i++) {
	    if (leaves && items[i].data) filterItems(items[i].data, leaves, selectedItems);else selectedItems.push(items[i]);
	  }

	  return selectedItems;
	}

	function calculateItem(item, config, master) {
	  var i,
	      isIds,
	      key,
	      leaves,
	      operation,
	      tmp,
	      values,
	      header = config.header;

	  for (i = 0; i < header.length; i++) {
	    key = header[i];
	    tmp = key.split(config.divider);
	    operation = tmp[tmp.length - 2];
	    values = item[key];
	    leaves = config.operations.getOption(operation, "leavesOnly");
	    isIds = config.operations.getOption(operation, "ids");

	    if (leaves && item.data) {
	      values = [];
	      getKeyLeaves(item.data, key, values);
	    }

	    if (values) {
	      var data = [];
	      var ids = [];

	      for (var j = 0; j < values.length; j++) {
	        var value = values[j];
	        var id = null;

	        if (_typeof(value) == "object") {
	          value = value.value;
	          id = values[j].id;
	        }

	        if (value || value == "0") {
	          data.push(value);
	          if (id) ids.push(id);
	        }
	      }

	      if (data.length) item[key] = config.operations.get(operation)(data, key, item, isIds ? ids : null);else item[key] = "";
	    } else item[key] = ""; //watchdog


	    master.count++;
	  }

	  return item;
	}

	function getKeyLeaves(data, key, result) {
	  var i;

	  for (i = 0; i < data.length; i++) {
	    if (data[i].data) getKeyLeaves(data[i].data, key, result);else result.push(data[i][key]);
	  }
	}

	function setMinMax(item, config) {
	  var i,
	      j,
	      key,
	      maxArr,
	      maxValue,
	      minArr,
	      minValue,
	      value,
	      header = config.header,
	      max = config.max,
	      min = config.min,
	      values = config.values; // nothing to do

	  if (!min && !max) return item; //values = structure.values;

	  if (!item.$cellCss) item.$cellCss = {}; // calculating for each value

	  for (i = 0; i < values.length; i++) {
	    value = values[i];
	    maxArr = [];
	    maxValue = -99999999;
	    minArr = [];
	    minValue = 99999999;

	    for (j = 0; j < header.length; j++) {
	      key = header[j];
	      if (isNaN(item[key])) continue; // it's a another value

	      if (key.indexOf(value.name) === -1) continue;

	      if (max && item[key] > maxValue) {
	        maxArr = [key];
	        maxValue = item[key];
	      } else if (item[key] == maxValue) {
	        maxArr.push(key);
	      }

	      if (min && item[key] < minValue) {
	        minArr = [key];
	        minValue = item[key];
	      } else if (item[key] == minValue) {
	        minArr.push(key);
	      }
	    }

	    for (j = 0; j < minArr.length; j++) {
	      item.$cellCss[minArr[j]] = "webix_min";
	    }

	    for (j = 0; j < maxArr.length; j++) {
	      item.$cellCss[maxArr[j]] = "webix_max";
	    }
	  }

	  return item;
	}

	function numHelper(fvalue, value, func) {
	  if (_typeof(fvalue) == "object") {
	    for (var i = 0; i < fvalue.length; i++) {
	      fvalue[i] = parseFloat(fvalue[i]);
	      if (isNaN(fvalue[i])) return true;
	    }
	  } else {
	    fvalue = parseFloat(fvalue); // if filter value is not a number then ignore such filter

	    if (isNaN(fvalue)) return true;
	  } // if row value is not a number then don't show this row


	  if (isNaN(value)) return false;
	  return func(fvalue, value);
	}

	var rules = {
	  contains: function (fvalue, value) {
	    return value.toLowerCase().indexOf(fvalue.toString().toLowerCase()) >= 0;
	  },
	  equal: function (fvalue, value) {
	    return numHelper(fvalue, value, function (fvalue, value) {
	      return fvalue == value;
	    });
	  },
	  not_equal: function (fvalue, value) {
	    return numHelper(fvalue, value, function (fvalue, value) {
	      return fvalue != value;
	    });
	  },
	  less: function (fvalue, value) {
	    return numHelper(fvalue, value, function (fvalue, value) {
	      return value < fvalue;
	    });
	  },
	  less_equal: function (fvalue, value) {
	    return numHelper(fvalue, value, function (fvalue, value) {
	      return value <= fvalue;
	    });
	  },
	  more: function (fvalue, value) {
	    return numHelper(fvalue, value, function (fvalue, value) {
	      return value > fvalue;
	    });
	  },
	  more_equal: function (fvalue, value) {
	    return numHelper(fvalue, value, function (fvalue, value) {
	      return value >= fvalue;
	    });
	  },
	  multi: function (fvalues, value) {
	    if (typeof fvalues === "string") fvalues = fvalues.split(",");

	    for (var i = 0; i < fvalues.length; i++) {
	      if (value == fvalues[i]) return true;
	    }

	    return false;
	  },
	  range: function (fvalue, value) {
	    return numHelper(fvalue, value, function (fvalue, value) {
	      return value < fvalue[1] && value >= fvalue[0];
	    });
	  },
	  range_inc: function (fvalue, value) {
	    return numHelper(fvalue, value, function (fvalue, value) {
	      return value <= fvalue[1] && value >= fvalue[0];
	    });
	  }
	};
	function setFilterValues(filters) {
	  filters = filters || [];

	  for (var i = 0; i < filters.length; i++) {
	    var f = filters[i],
	        fvalue = f.fvalue;

	    if (typeof fvalue == "function") {
	      f.func = fvalue;
	    } else if (f.type == "select" || f.type == "richselect") {
	      f.func = function (fvalue, value) {
	        return fvalue == value;
	      };

	      fvalue = fvalue || "";
	    } else if (f.type.indexOf("multi") > -1) {
	      f.func = rules.multi;
	    } else if (_typeof(fvalue) === "object") {
	      f.func = rules.range;
	    } else if (fvalue.substr(0, 1) == "=") {
	      f.func = rules.equal;
	      fvalue = fvalue.substr(1);
	    } else if (fvalue.substr(0, 2) == "<>") {
	      f.func = rules.not_equal;
	      fvalue = fvalue.substr(2);
	    } else if (fvalue.substr(0, 2) == ">=") {
	      f.func = rules.more_equal;
	      fvalue = fvalue.substr(2);
	    } else if (fvalue.substr(0, 1) == ">") {
	      f.func = rules.more;
	      fvalue = fvalue.substr(1);
	    } else if (fvalue.substr(0, 2) == "<=") {
	      f.func = rules.less_equal;
	      fvalue = fvalue.substr(2);
	    } else if (fvalue.substr(0, 1) == "<") {
	      f.func = rules.less;
	      fvalue = fvalue.substr(1);
	    } else if (fvalue.indexOf("...") > 0) {
	      f.func = rules.range;
	      fvalue = fvalue.split("...");
	    } else if (fvalue.indexOf("..") > 0) {
	      f.func = rules.range_inc;
	      fvalue = fvalue.split("..");
	    } else if (f.type == "datepicker") {
	      f.func = function (fvalue, value) {
	        return fvalue == value;
	      };
	    } else f.func = rules.contains;

	    f.fvalue = fvalue;
	  }
	}
	function formatFilterValues$1(filters) {
	  var i, fvalue;
	  filters = filters || [];

	  for (i = 0; i < filters.length; i++) {
	    fvalue = filters[i].fvalue || filters[i].value || "";

	    if (typeof fvalue == "string") {
	      if (fvalue.trim) fvalue = fvalue.trim();
	    }

	    filters[i].fvalue = fvalue;
	  }
	}
	function filterItem(filters, item, map) {
	  if (filters) {
	    var i, f;

	    for (i = 0; i < filters.length; i++) {
	      f = filters[i];

	      if (f.fvalue) {
	        var field = map && map[f.name] ? map[f.name] : f.name;
	        if (isUndefined(item[field])) return false;
	        var raw = item[field];
	        if (!raw !== 0 && !raw) return false;
	        var value = raw.toString();
	        var result = f.func(f.fvalue, value);
	        if (!result) return false;
	      }
	    }
	  }

	  return true;
	}

	var Data =
	/*#__PURE__*/
	function () {
	  function Data(master, config) {
	    _classCallCheck(this, Data);

	    this.master = master;
	    this.config = config;
	    this.count = 0;
	  }

	  _createClass(Data, [{
	    key: "process",
	    value: function process(data, order) {
	      this.watch = new Date();
	      var columns, fields, header, i, items;
	      var structure = this.structure;
	      structure._header = [];
	      structure._header_hash = {};
	      formatFilterValues$1(structure.filters);
	      setFilterValues(structure.filters);

	      for (i = 0; i < structure.values.length; i++) {
	        structure.values[i].operation = structure.values[i].operation || [this.config.defaultOperation];
	        if (!isArray(structure.values[i].operation)) structure.values[i].operation = [structure.values[i].operation];
	      }

	      columns = [];

	      for (i = 0; i < structure.columns.length; i++) {
	        columns[i] = _typeof(structure.columns[i]) == "object" ? structure.columns[i].id || i : structure.columns[i];
	      }

	      fields = structure.rows.concat(columns);
	      items = this.group(data, order, fields);
	      header = {};
	      if (structure.rows.length > 0) items = this.processRows(items, structure.rows, structure, header, "");else {
	        // there are no rows in structure, only columns and values
	        this.processColumns(items, columns, structure, header);
	        items = [];
	      }
	      header = processHeader(this.master, header);
	      items = addTotalData(this.master, items);
	      if (this.config.footer) addFooter(this.master, header, items);
	      delete structure._header;
	      delete structure._header_hash;
	      return {
	        header: header,
	        data: items
	      };
	    }
	  }, {
	    key: "processColumns",
	    value: function processColumns(data, columns, structure, header, item, name) {
	      var vname;
	      item = item || {
	        $source: []
	      };

	      if (columns.length > 0) {
	        name = name || "";

	        for (var i in data) {
	          if (!header[i]) header[i] = {};
	          data[i] = this.processColumns(data[i], columns.slice(1), structure, header[i], item, (name.length > 0 ? name + this.divider : "") + i);
	        }
	      } else {
	        var values = structure.values;

	        for (var id in data) {
	          item.$source.push(id);

	          for (var _i = 0; _i < values.length; _i++) {
	            for (var j = 0; j < values[_i].operation.length; j++) {
	              if (typeof name !== "undefined") vname = name + this.divider + values[_i].operation[j] + this.divider + values[_i].name;else // if no columns
	                vname = values[_i].operation[j] + this.divider + values[_i].name;

	              if (!structure._header_hash[vname]) {
	                structure._header.push(vname);

	                structure._header_hash[vname] = true;
	              }

	              if (isUndefined(item[vname])) {
	                item[vname] = [];
	                header[values[_i].operation[j] + this.divider + values[_i].name] = {};
	              }

	              item[vname].push({
	                value: data[id][values[_i].name],
	                id: id
	              });
	            }
	          }
	        }
	      }

	      return item;
	    }
	  }, {
	    key: "processRows",
	    value: function processRows(data, rows, structure, header, prefix) {
	      var i,
	          item,
	          j,
	          k,
	          value,
	          items = [];

	      if (rows.length > 1) {
	        for (i in data) {
	          data[i] = this.processRows(data[i], rows.slice(1), structure, header, prefix + "_" + i);
	        }

	        var values = structure._header;

	        for (i in data) {
	          item = {
	            data: data[i]
	          };

	          for (j = 0; j < item.data.length; j++) {
	            for (k = 0; k < values.length; k++) {
	              value = values[k];
	              if (isUndefined(item[value])) item[value] = [];
	              item[value].push(item.data[j][value]);
	            }
	          }

	          this.setItemValues(item);
	          if (this.master.config.stableRowId) item.id = prefix + "_" + i;
	          item.name = i;
	          item.open = true;
	          items.push(item);
	        }
	      } else {
	        for (i in data) {
	          item = this.processColumns(data[i], structure.columns, structure, header);
	          item.name = i;
	          if (this.master.config.stableRowId) item.id = prefix + "_" + i;
	          this.setItemValues(item);
	          items.push(item);
	        }
	      }

	      return items;
	    }
	  }, {
	    key: "setItemValues",
	    value: function setItemValues(item) {
	      item = calculateItem(item, {
	        header: this.structure._header,
	        divider: this.divider,
	        operations: this.operations
	      }, this);
	      item = setMinMax(item, {
	        header: this.structure._header,
	        max: this.config.max,
	        min: this.config.min,
	        values: this.structure.values
	      }); //watchdog

	      if (this.count > 50000) {
	        this.count = 0;
	        if (this.config.ping) this.config.ping.call(this, this.watch);
	      }

	      return item;
	    }
	  }, {
	    key: "group",
	    value: function group(data, order, fields) {
	      var i,
	          id,
	          item,
	          hash = {};

	      for (i = 0; i < order.length; i++) {
	        id = order[i];
	        item = data[id];

	        if (item && filterItem(this.structure.filters, item, this.config.filterMap)) {
	          this.groupItem(hash, item, fields);
	        }
	      }

	      return hash;
	    }
	  }, {
	    key: "groupItem",
	    value: function groupItem(hash, item, fields) {
	      if (fields.length) {
	        var value = item[fields[0]];
	        if (typeof value === "undefined") return null;
	        if (isUndefined(hash[value])) hash[value] = {};
	        this.groupItem(hash[value], item, fields.slice(1));
	      } else hash[item.id] = item;
	    }
	  }, {
	    key: "filterItem",
	    value: function filterItem$$1(item) {
	      var filters = this.structure.filters || [];

	      for (var i = 0; i < filters.length; i++) {
	        var f = filters[i];

	        if (f.fvalue) {
	          if (isUndefined(item[f.name])) return false;
	          var value = item[f.name].toString().toLowerCase();
	          var result = f.func(f.fvalue, value);
	          if (!result) return false;
	        }
	      }

	      return true;
	    }
	  }, {
	    key: "operations",
	    get: function () {
	      return this.master._pivotOperations;
	    }
	  }, {
	    key: "divider",
	    get: function () {
	      return this.master.$divider;
	    }
	  }, {
	    key: "structure",
	    get: function () {
	      return this.config.structure;
	    }
	  }]);

	  return Data;
	}();

	var operations = {
	  sum: function (values) {
	    var sum = 0;

	    for (var i = 0; i < values.length; i++) {
	      var value = values[i];
	      value = parseFloat(value, 10);
	      if (!isNaN(value)) sum += value;
	    }

	    return sum;
	  },
	  count: function (data, key, item) {
	    var count = 0;
	    if (!item.data) count = data.length;else {
	      for (var i = 0; i < item.data.length; i++) {
	        count += item.data[i][key] || 0;
	      }
	    }
	    return count;
	  },
	  max: function (args) {
	    if (args.length == 1) return args[0];
	    return Math.max.apply(this, args);
	  },
	  min: function (args) {
	    if (args.length == 1) return args[0];
	    return Math.min.apply(this, args);
	  }
	};
	var totalOperations = {
	  "sum": function (values) {
	    var i,
	        sum = 0;

	    for (i = 0; i < values.length; i++) {
	      sum += values[i];
	    }

	    return sum;
	  },
	  "min": function (values) {
	    if (values.length == 1) return values[0];
	    return Math.min.apply(null, values);
	  },
	  "max": function (values) {
	    if (values.length == 1) return values[0];
	    return Math.max.apply(null, values);
	  },
	  "count": function (values) {
	    var value = totalOperations.sum.call(this, values);
	    return value ? parseInt(value, 10) : "";
	  }
	};
	var Operations =
	/*#__PURE__*/
	function () {
	  function Operations() {
	    _classCallCheck(this, Operations);

	    this.pull = extend({}, operations);
	    this.options = {};
	    this.pullTotal = extend({}, totalOperations);
	    this.totalOptions = {};
	  }

	  _createClass(Operations, [{
	    key: "serialize",
	    value: function serialize() {
	      var str = {};

	      for (var key in this.pull) {
	        str[key] = this.pull[key].toString();
	      }

	      return str;
	    }
	  }, {
	    key: "parse",
	    value: function parse(str) {
	      for (var key in str) {
	        eval("this.temp = " + str[key]);
	        this.pull[key] = this.temp;
	      }
	    }
	  }, {
	    key: "add",
	    value: function add(name, method, options) {
	      this.pull[name] = method;
	      if (options) this.options[name] = options;
	    }
	  }, {
	    key: "addTotal",
	    value: function addTotal(name, method, options) {
	      this.pullTotal[name] = method;
	      if (options) this.totalOptions[name] = options;
	    }
	  }, {
	    key: "get",
	    value: function get(name) {
	      return this.pull[name] || null;
	    }
	  }, {
	    key: "getOptions",
	    value: function getOptions(name) {
	      return this.options[name] || null;
	    }
	  }, {
	    key: "getOption",
	    value: function getOption(name, option) {
	      return this.options[name] ? this.options[name][option] : null;
	    }
	  }, {
	    key: "getTotal",
	    value: function getTotal(name) {
	      return this.pullTotal[name] || this.pull[name] || null;
	    }
	  }, {
	    key: "getTotalOptions",
	    value: function getTotalOptions(name) {
	      return this.pullTotal[name] ? this.totalOptions[name] || null : this.options[name] || null;
	    }
	  }, {
	    key: "getTotalOption",
	    value: function getTotalOption(name, option) {
	      var options = this.getTotalOptions(name);
	      return options ? options[name][option] : null;
	    }
	  }]);

	  return Operations;
	}();

	var divider = "_'_";
	function _Pivot(config, master) {
	  this.$divider = divider;

	  this._initOperations();

	  this.config = config;
	  this.view = master;

	  if (config.webWorker && !(typeof Worker === "undefined" ? "undefined" : _typeof(Worker)) !== "undefined" && master) {
	    this._initWorker(config, master);
	  } else this._pivotData = new Data(this, this.config);

	  if (!this.config.structure) this.config.structure = {};
	  extend(this.config.structure, {
	    rows: [],
	    columns: [],
	    values: [],
	    filters: []
	  });
	}
	_Pivot.prototype = {
	  _initWorker: function (config, master) {
	    this._result = null;
	    this._pivotWorker = new Worker(config.webWorker);

	    this._pivotWorker.onmessage = function (e) {
	      if (e.data.type === "ping") {
	        master._runPing(e.data.watch, master);
	      } else if (master._result && !master.$destructed) {
	        master.callEvent("onWebWorkerEnd", []);

	        if (!e.data.id || e.data.id === master._result_id) {
	          master._result(e.data.data);

	          master._result = null;
	        }
	      }
	    };
	  },
	  _runPing: function (watch, master) {
	    try {
	      this.config.ping(watch);
	    } catch (e) {
	      this._pivotWorker.terminate();

	      this._initWorker(this.config, master);

	      master.callEvent("onWebWorkerEnd", []);
	    }
	  },
	  _getPivotData: function (pull, order, next) {
	    if (this._pivotWorker) {
	      var id = this._result_id = webix.uid();
	      this._result = next;
	      var data = [];
	      var structure = this.config.structure;
	      var footer = this.config.footer;

	      var operations = this._pivotOperations.serialize();

	      if (structure && (structure.rows.length || structure.columns.length)) for (var i = order.length - 1; i >= 0; i--) {
	        data[i] = pull[order[i]];
	      }
	      this.callEvent("onWebWorkerStart", []);
	      var format = this.config.format;

	      if (typeof format === "function") {
	        var t = "x" + webix.uid();
	        webix.i18n[t] = format;
	        format = t;
	      }

	      var ping = !!this.config.ping;

	      this._pivotWorker.postMessage({
	        footer: footer,
	        structure: structure,
	        data: data,
	        id: id,
	        operations: operations,
	        ping: ping,
	        format: format
	      });
	    } else {
	      var result = this._pivotData.process(pull, order);

	      if (next) next(result);
	      return result;
	    }
	  },
	  _initOperations: function () {
	    var operations = this._pivotOperations = new Operations();
	    this.operations = operations.pull;
	  },
	  addOperation: function (name, method, options) {
	    this._pivotOperations.add(name, method, options);
	  },
	  addTotalOperation: function (name, method, options) {
	    this._pivotOperations.addTotal(name, method, options);
	  }
	};
	function WebixPivot(config, master) {
	  _Pivot.call(this, config, master);
	}
	WebixPivot.prototype = extend({
	  getData: function (data) {
	    var i,
	        id,
	        option,
	        field,
	        fields = [],
	        fieldsHash = {},
	        filters = this.config.structure.filters,
	        pull = {},
	        options = {},
	        optionsHash = {},
	        operations = this.operations,
	        order = [],
	        result = {};

	    for (i = 0; i < filters.length; i++) {
	      if (filters[i].type.indexOf("select") != -1) {
	        options[filters[i].name] = [];
	        optionsHash[filters[i].name] = {};
	      }
	    }

	    for (i = 0; i < data.length; i++) {
	      id = data[i].id = data[i].id || uid();
	      pull[id] = data[i];
	      order.push(id);
	      if (i < 5) for (field in data[i]) {
	        if (!fieldsHash[field]) {
	          fields.push(field);
	          fieldsHash[field] = uid();
	        }
	      }

	      for (option in options) {
	        var value = data[i][option];

	        if (!isUndefined(value)) {
	          if (!optionsHash[option][value]) {
	            optionsHash[option][value] = 1;
	            options[option].push(value);
	          }
	        }
	      }
	    }

	    result.options = options;
	    result.fields = fields;
	    result.data = this._getPivotData(pull, order);
	    result.operations = [];

	    for (id in operations) {
	      result.operations.push(id);
	    }

	    return result;
	  }
	}, _Pivot.prototype);

	var defaults = {
	  fieldMap: {},
	  yScaleWidth: 300,
	  columnWidth: 150,
	  defaultOperation: "sum",
	  filterLabelAlign: "right",
	  filterPlaceholder: false,
	  filterWidth: 200,
	  filterMinWidth: 150,
	  filterLabelWidth: 100,
	  separateLabel: true,
	  headerTemplate: function (config) {
	    return this._applyMap(config.text || config.name) + "<span class='webix_pivot_operation'> " + this._applyLocale(config.operation) + "</span>";
	  },
	  format: function (value) {
	    return value && value != "0" ? parseFloat(value).toFixed(3) : value;
	  }
	};

	function setColumns(master, columns) {
	  var format = master.config.format;

	  for (var i = 0; i < columns.length; i++) {
	    if (!i) {
	      setFirstColumn(master, columns[i]);
	    } else {
	      webix.extend(columns[i], {
	        format: format,
	        sort: "int",
	        width: master.config.columnWidth
	      });
	      var header = columns[i].header;

	      for (var j = 0; j < header.length; j++) {
	        var h = header[j];

	        if (h) {
	          if (!j && h.name == "total") h.text = master._applyLocale("total");else if (j == header.length - 1) {
	            h.text = master.config.headerTemplate.call(master, h);
	          } else h.text = h.name;
	        }
	      }

	      var footer = columns[i].footer;
	      var footer_format = columns[i].format;

	      if (footer) {
	        if (typeof footer === "string") footer = {
	          text: footer
	        };
	        if (typeof footer_format == "string") //web worker
	          footer_format = webix.i18n[footer_format] || window[footer_format];
	        var text = !webix.isUndefined(footer.$pivotValue) ? footer.$pivotValue : footer.text; //format footer only when column specific format was defined

	        footer.text = footer_format && (footer.$pivotOperation != "count" || footer_format != format) ? footer_format(text) : text;
	      }
	    }
	  }
	}

	function setFirstColumn(master, column) {
	  var text = "";
	  if (master.config.readonly) text = master.config.readonlyTitle || "";else text = "<div class='webix_pivot_config_msg'><div class='webix_pivot_icon pt-settings'></div>" + webix.i18n.pivot.pivotMessage + "</div>";
	  column.header = text;
	  column.width = master.config.yScaleWidth;
	  column.exportAsTree = true;
	  if (master.config.footer) column.footer = master._applyLocale("total");
	}

	function init(view) {
	  webix.extend(view, extRender, true); // filtering

	  view.attachEvent("onFilterChange", function () {
	    formatFilterValues(this.config.structure.filters);

	    this._loadResults(true);
	  });
	}
	var extRender = {
	  render: function (data) {
	    this.data.silent(function () {
	      var url = this.url;
	      this.clearAll();
	      this.url = url;
	    });
	    formatFilterValues(this.config.structure.filters);
	    if (!data) this._loadResults();else this._setData(data);
	  },
	  $onLoad: function (data) {
	    if (data.fields) this._pivotFields = data.fields;
	    if (data.options) this._pivotOptions = data.options;
	    if (data.structure) this.config.structure = data.structure;

	    if (data.operations) {
	      this.operations = {};

	      for (var i = 0; i < data.operations.length; i++) {
	        this.operations[data.operations[i]] = 1;
	      }
	    }

	    if (data.data.columns) data.data.header = data.data.columns;
	    if (data.data) this.render(data.data);
	  },
	  url_setter: function (value) {
	    var str = this.config.structure;

	    if (str && (str.rows.length || str.columns.length)) {
	      this.data.url = value;

	      this._loadResults();
	    } else return webix.AtomDataLoader.url_setter.call(this, value);
	  },
	  _loadResults: function () {
	    var structure = this.config.structure,
	        url = this.data.url;

	    if (url) {
	      if (url.load) url.load(this, {
	        success: function (data) {
	          this.parse(JSON.parse(data));
	        }
	      }, {
	        structure: structure
	      });else if (typeof url == "string") this.load("post->" + url, "json", {
	        structure: structure
	      });
	    }
	  }
	};

	var Filters =
	/*#__PURE__*/
	function () {
	  function Filters() {
	    _classCallCheck(this, Filters);

	    this._filters = ["multicombo", "select", "text", "datepicker"];
	    this._selects = {
	      "multicombo": 1,
	      "multiselect": 1,
	      "select": 1,
	      "richselect": 1
	    };
	  }

	  _createClass(Filters, [{
	    key: "add",
	    value: function add(name, isSelect) {
	      this._filters.push(name);

	      if (!webix.isUndefined(isSelect)) this._selects[name] = isSelect;
	    }
	  }, {
	    key: "isSelect",
	    value: function isSelect(name) {
	      return this._selects[name];
	    }
	  }, {
	    key: "clear",
	    value: function clear() {
	      this._filters = [];
	    }
	  }, {
	    key: "remove",
	    value: function remove(name) {
	      var i = this.getIndex(name);
	      if (i >= 0) this._filters.splice(i, 1);
	    }
	  }, {
	    key: "getIndex",
	    value: function getIndex(name) {
	      for (var i = 0; i < this._filters.length; i++) {
	        if (this._filters[i] == name) return i;
	      }

	      return -1;
	    }
	  }, {
	    key: "getDefault",
	    value: function getDefault() {
	      if (this.getIndex("select") != -1) return "select";
	      return this._filters[0];
	    }
	  }, {
	    key: "get",
	    value: function get() {
	      return this._filters;
	    }
	  }]);

	  return Filters;
	}();

	webix.protoUI({
	  name: "pivot",
	  version: "{{version}}",
	  defaults: defaults,
	  $init: function (config) {
	    if (config.separateLabel === false) {
	      config.filterWidth = config.filterWidth || 300;
	    }

	    this.$view.className += " webix_pivot"; // add DataStore API

	    this.data.provideApi(this, true); // add configuration properties

	    this._setConfig(config); // event event handlers


	    this._initDataStore(config); // alias for $separator


	    this.$separator = this.$divider;
	    this.filters = new Filters();
	  },
	  $divider: "_'_",
	  _initDataStore: function (config) {
	    if (config.externalProcessing) init(this, config);else {
	      // render on data update
	      this.data.attachEvent("onStoreUpdated", webix.bind(function () {
	        // call render if pivot is initialized
	        if (this.$$("data")) this.render();
	      }, this)); // filtering

	      this.attachEvent("onFilterChange", function () {
	        this.render(true);
	      }); // initial rendering

	      this.$ready.push(this.render);
	    }
	  },
	  _setConfig: function (config) {
	    if (!config.structure) config.structure = {};
	    webix.extend(config.structure, {
	      rows: [],
	      columns: [],
	      values: [],
	      filters: []
	    });
	    webix.extend(config, this._getUI(config));
	  },
	  _getUI: function (config) {
	    var filters = {
	      id: "filters",
	      view: "toolbar",
	      css: "webix_pivot_configure_toolbar",
	      borderless: true,
	      hidden: true,
	      padding: 10,
	      cols: [{}]
	    };
	    var active = webix.skin.$active;
	    var table = {
	      view: "treetable",
	      id: "data",
	      css: "webix_data_border",
	      select: "row",
	      navigation: true,
	      leftSplit: 1,
	      resizeColumn: true,
	      rowHeight: active.rowHeight + 8,
	      rowLineHeight: active.rowHeight + 8,
	      headerRowHeight: active.barHeight + 4,
	      on: {
	        "onHeaderClick": function (id) {
	          var pivot = this.getTopParentView();
	          if (this.getColumnIndex(id.column) === 0 && !pivot.config.readonly) pivot.configure();
	        }
	      },
	      columns: []
	    };

	    if (config.datatable && _typeof(config.datatable) == "object") {
	      delete config.datatable.id;
	      webix.extend(table, config.datatable, true);
	    }

	    return {
	      rows: [filters, table]
	    };
	  },

	  /*
	  * Shows configuration popup
	  * */
	  configure: function () {
	    if (!this._configPopup) this._createPopup();
	    var functions = [];

	    for (var i in this.operations) {
	      functions.push({
	        name: i,
	        title: this._applyLocale(i)
	      });
	    }

	    this._configPopup.define("operations", functions);

	    var pos = webix.html.offset(this.$$("data").getNode());

	    this._configPopup.setPosition(pos.x + 10, pos.y + 10);

	    this._configPopup.define("data", this.getFields());

	    this._configPopup.show();
	  },
	  _createPopup: function () {
	    var config = {
	      view: "webix_pivot_config",
	      operations: [],
	      pivot: this.config.id
	    };
	    webix.extend(config, this.config.popup || {});
	    this._configPopup = webix.ui(config);
	    this.callEvent("onPopup", [this._configPopup]);

	    this._configPopup.attachEvent("onApply", webix.bind(this.setStructure, this));
	  },
	  destructor: function () {
	    if (this._configPopup) {
	      this._configPopup.destructor();

	      this._configPopup = null;
	    }

	    webix.Destruction.destructor.call(this);
	  },
	  getFilterView: function () {
	    return this.$$("filters");
	  },

	  /*
	   * Renders Pivot
	   * 
	   */
	  render: function (skipFilters) {
	    var _this = this;

	    if (webix.debug_pivot) window.console.time("pivot:full-processing");

	    if (!this._getPivotData) {
	      var base = new _Pivot(this.config, this);
	      webix.extend(this, base);
	    }

	    formatFilterValues(this.config.structure.filters);

	    this._getPivotData(this.data.pull, this.data.order, function (result) {
	      _this._setData(result, skipFilters);

	      if (webix.debug_pivot) webix.delay(function () {
	        window.console.timeEnd("pivot:full-processing");
	        window.console.timeEnd("pivot:rendering");
	      });
	    });
	  },
	  _setData: function (data, skipFilters) {
	    setColumns(this, data.header);
	    if (!skipFilters) data.filters = processFilters(this);
	    this.callEvent("onBeforeRender", [data]);
	    if (data.filters) showFilters(this, data.filters);
	    if (this.config.readonly) this.$$("data").$view.className += " webix_pivot_readonly";
	    if (this.config.totalColumn) this.$$("data").define("math", true);
	    if (this.config.footer) this.$$("data").define("footer", true);
	    if (webix.debug_pivot) window.console.time("pivot:rendering");
	    this.$$("data").clearAll();
	    this.$$("data").config.rightSplit = 0;
	    this.$$("data").refreshColumns(data.header);
	    this.$$("data").parse(data.data);
	    freezeTotals(this);
	  },
	  $exportView: function (options) {
	    if (options.flatTree) {
	      if (_typeof(options.flatTree) !== "object") options.flatTree = {};
	      var flat = options.flatTree;
	      flat.id = this.$$("data").config.columns[0].id;

	      if (!flat.columns) {
	        var rows = this.config.structure.rows;
	        flat.columns = [];

	        for (var i = 0; i < rows.length; i++) {
	          flat.columns.push({
	            header: this._applyMap(rows[i])
	          });
	        }
	      }
	    }

	    return this.$$("data").$exportView(options);
	  },
	  _applyLocale: function (value) {
	    return webix.i18n.pivot[value] || value;
	  },
	  _applyMap: function (value) {
	    return this.config.fieldMap[value] || value;
	  },
	  getFields: function () {
	    var i,
	        field,
	        item,
	        text,
	        fields = [],
	        fieldsHash = {},
	        rowsHash = {},
	        str = this.config.structure,
	        result = {
	      fields: [],
	      rows: [],
	      columns: [],
	      values: [],
	      filters: []
	    },
	        valuesHash = {};

	    if (!this._pivotFields) {
	      for (i = 0; i < Math.min(this.data.count() || 5); i++) {
	        item = this.data.getItem(this.data.getIdByIndex(i));

	        for (field in item) {
	          if (field !== "id" && field.indexOf("$") !== 0 && !fieldsHash[field]) {
	            fields.push(field);
	            fieldsHash[field] = webix.uid();
	          }
	        }
	      }
	    } else {
	      fields = this._pivotFields;

	      for (i = 0; i < fields.length; i++) {
	        fieldsHash[fields[i]] = webix.uid();
	      }
	    }

	    for (i = 0; i < (str.filters || []).length; i++) {
	      field = str.filters[i];

	      if (!webix.isUndefined(fieldsHash[field.name])) {
	        text = this._applyMap(field.name);
	        result.filters.push({
	          name: field.name,
	          text: text,
	          type: field.type,
	          value: field.value,
	          id: fieldsHash[field.name]
	        });
	      }
	    }

	    for (i = 0; i < str.rows.length; i++) {
	      field = str.rows[i];

	      if (!webix.isUndefined(fieldsHash[field])) {
	        result.rows.push({
	          name: field,
	          text: this._applyMap(field),
	          id: fieldsHash[field]
	        });
	        rowsHash[field] = true;
	      }
	    }

	    for (i = 0; i < str.columns.length; i++) {
	      field = _typeof(str.columns[i]) == "object" ? str.columns[i].id || i : str.columns[i];

	      if (!webix.isUndefined(fieldsHash[field]) && webix.isUndefined(rowsHash[field])) {
	        result.columns.push({
	          name: field,
	          text: this._applyMap(field),
	          id: fieldsHash[field]
	        });
	      }
	    }

	    for (i = 0; i < str.values.length; i++) {
	      field = str.values[i];

	      if (!webix.isUndefined(fieldsHash[field.name])) {
	        if (webix.isUndefined(valuesHash[field.name])) {
	          valuesHash[field.name] = i;
	          text = this._applyMap(field.name);
	          var value = {
	            name: field.name,
	            text: text,
	            id: fieldsHash[field.name],
	            operation: webix.isArray(field.operation) ? field.operation : [field.operation]
	          };
	          result.values.push(value);
	        } else {
	          var index = valuesHash[field.name];
	          result.values[index].operation.push(field.operation);
	        }
	      }
	    }

	    fields.sort();

	    for (i = 0; i < fields.length; i++) {
	      field = fields[i];
	      if (!webix.isUndefined(fieldsHash[field])) result.fields.push({
	        name: field,
	        text: this._applyMap(field),
	        id: fieldsHash[field]
	      });
	    }

	    return result;
	  },
	  setStructure: function (config) {
	    this.define("structure", config);
	    this.render();
	  },
	  getStructure: function () {
	    return this.config.structure;
	  },
	  getConfigWindow: function () {
	    return this._configPopup;
	  },
	  profile_setter: function (value) {
	    var c = window.console;

	    if (value) {
	      this.attachEvent("onBeforeLoad", function () {
	        c.time("data loading");
	      });
	      this.data.attachEvent("onParse", function () {
	        c.timeEnd("data loading");
	        c.time("data parsing");
	      });
	      this.data.attachEvent("onStoreLoad", function () {
	        c.timeEnd("data parsing");
	        c.time("data processing");
	      });
	      this.$ready.push(function () {
	        this.$$("data").attachEvent("onBeforeRender", function () {
	          if (this.count()) {
	            c.timeEnd("data processing");
	            c.time("data rendering");
	          }
	        });
	        this.$$("data").attachEvent("onAfterRender", function () {
	          if (this.count()) webix.delay(function () {
	            c.timeEnd("data rendering");
	          });
	        });
	      });
	    }
	  }
	}, webix.IdSpace, webix.ui.layout, webix.DataLoader, webix.EventSystem, webix.Settings);

	var clickHandlers$1 = webix.extend({
	  "color": function (e, id, el) {
	    var colorboard = {
	      view: "colorboard",
	      borderless: true
	    };

	    if (webix.$$(this.config.pivot).config.colorboard) {
	      webix.extend(colorboard, webix.$$(this.config.pivot).config.colorboard);
	    } else {
	      webix.extend(colorboard, {
	        width: 150,
	        height: 150,
	        palette: webix.$$(this.config.pivot).config.palette
	      });
	    }

	    var p = webix.ui({
	      view: "popup",
	      id: "colorsPopup",
	      body: colorboard
	    });
	    p.show(el);
	    p.getBody().attachEvent("onSelect", function () {
	      p.hide();
	    });
	    p.attachEvent("onHide", webix.bind(function () {
	      var index = webix.html.locate(e, "webix_operation");
	      var value = p.getBody().getValue();

	      if (value) {
	        this.$$("values").getItem(id).color[index] = value;
	        this.$$("values").updateItem(id);
	      }

	      p.close();
	    }, this));
	    return false;
	  }
	}, clickHandlers);
	function getStructureMap$1(view, config) {
	  var chartTypes = [];
	  var pivot = webix.$$(config.pivot);
	  var types = pivot.chartMap;

	  for (var type in types) {
	    chartTypes.push({
	      id: type,
	      title: pivot._applyLocale(type).toLowerCase()
	    });
	  }

	  var chartType = pivot.config.chartType;
	  return {
	    "popup": {
	      width: config.popupWidth,
	      head: "toolbar",
	      body: "body"
	    },
	    "toolbar": {
	      view: "toolbar",
	      borderless: true,
	      padding: 10,
	      cols: ["configTitle", {
	        margin: 6,
	        cols: ["cancel", "apply"]
	      }]
	    },
	    "configTitle": {
	      id: "configTitle",
	      view: "label",
	      label: webix.i18n.pivot.windowTitle || ""
	    },
	    "cancel": {
	      view: "button",
	      id: "cancel",
	      label: pivot._applyLocale("cancel"),
	      width: config.cancelButtonWidth
	    },
	    "apply": {
	      view: "button",
	      id: "apply",
	      type: "form",
	      css: "webix_pivot_apply",
	      label: pivot._applyLocale("apply"),
	      width: config.applyButtonWidth
	    },
	    "body": {
	      type: "wide",
	      rows: [{
	        css: "webix_pivot_fields_layout",
	        type: "space",
	        cols: ["fieldsLayout", {
	          type: "wide",
	          rows: [{
	            type: "wide",
	            css: "webix_pivot_configuration",
	            rows: [{
	              type: "wide",
	              cols: ["filtersLayout", "groupLayout"]
	            }, {
	              type: "wide",
	              cols: ["valuesLayout", "chartLayout"]
	            }]
	          }]
	        }]
	      }]
	    },
	    "fieldsLayout": {
	      width: config.fieldsColumnWidth,
	      rows: ["fieldsHeader", "fields"]
	    },
	    "fieldsHeader": {
	      id: "fieldsHeader",
	      data: {
	        value: "fields"
	      },
	      css: "webix_pivot_header_fields",
	      template: popupTemplates.header,
	      height: 40
	    },
	    "fields": {
	      view: "list",
	      type: {
	        height: "auto"
	      },
	      css: "webix_pivot_fields",
	      drag: true,
	      template: "<span class='webix_pivot_list_marker'></span>#text#<span class='webix_pivot_icon pt-list-drag'></span>",
	      on: view._getListEvents()
	    },
	    "filtersLayout": {
	      rows: ["filtersHeader", "filters"]
	    },
	    "filtersHeader": {
	      data: {
	        value: "filters",
	        icon: "filter"
	      },
	      template: popupTemplates.iconHeader,
	      css: "webix_pivot_popup_title",
	      height: 40
	    },
	    "filters": {
	      view: "list",
	      scroll: "auto",
	      type: {
	        height: "auto"
	      },
	      drag: true,
	      template: webix.bind(popupTemplates.filters, view),
	      onClick: {
	        "webix_link_selection": webix.bind(clickHandlers$1["filter-selector"], view),
	        "webix_pivot_minus": webix.bind(clickHandlers.remove, view)
	      },
	      on: view._getListEvents()
	    },
	    "valuesLayout": {
	      rows: ["valuesHeader", "values"]
	    },
	    "valuesHeader": {
	      id: "valuesHeader",
	      data: {
	        value: "values",
	        icon: "values-chart"
	      },
	      template: popupTemplates.iconHeader,
	      css: "webix_pivot_popup_title",
	      height: 40
	    },
	    "values": {
	      view: "list",
	      scroll: "auto",
	      drag: true,
	      css: "webix_pivot_chart_values",
	      type: {
	        height: "auto"
	      },
	      template: webix.bind(popupTemplates.chartValues, view),
	      onClick: {
	        "webix_link_title": webix.bind(clickHandlers$1.selector, view),
	        "webix_link_selection": webix.bind(clickHandlers$1.selector, view),
	        "webix_color_selection": webix.bind(clickHandlers$1.color, view),
	        "webix_pivot_minus": webix.bind(clickHandlers$1.remove, view)
	      },
	      on: view._getListEvents()
	    },
	    "groupLayout": {
	      rows: ["groupHeader", "groupBy"]
	    },
	    "groupHeader": {
	      data: {
	        value: "groupBy",
	        icon: "group"
	      },
	      template: popupTemplates.iconHeader,
	      css: "webix_pivot_popup_title",
	      height: 40
	    },
	    "groupBy": {
	      view: "list",
	      scroll: false,
	      drag: true,
	      type: {
	        height: "auto"
	      },
	      template: webix.bind(popupTemplates.groupBy, view),
	      on: view._getListEvents(),
	      onClick: {
	        "webix_pivot_minus": webix.bind(clickHandlers.remove, view)
	      }
	    },
	    "chartLayout": {
	      css: "webix_pivot_popup_chart",
	      rows: ["chartHeader", "chartBody"]
	    },
	    "chartHeader": {
	      data: {
	        value: "chart",
	        icon: "chart"
	      },
	      template: popupTemplates.iconHeader,
	      css: "webix_pivot_popup_title",
	      height: 40
	    },
	    "chartBody": {
	      view: "list",
	      scroll: false,
	      drag: false,
	      type: {
	        height: "auto",
	        markCheckbox: function (obj) {
	          if (typeof obj.markCheckbox === "undefined") {
	            //check for first init
	            pivot.config.chart.scale && pivot.config.chart.scale == "logarithmic" ? obj.markCheckbox = 1 : obj.markCheckbox = 0;
	          }

	          return "<span class='webix_icon wxi-checkbox-" + (obj.markCheckbox ? "marked" : "blank") + "'></span>";
	        },
	        getType: function (obj) {
	          return obj.chartType = chartType;
	        }
	      },
	      onClick: {
	        "webix_link_selection": function (e, id, el) {
	          var popup,
	              selector = {
	            view: "webix_pivot_popup",
	            css: "webix_pivot_popup",
	            autofit: true,
	            autoheight: true,
	            width: 150,
	            data: chartTypes
	          };
	          popup = webix.ui(selector);
	          popup.show(el);
	          popup.attachEvent("onHide", webix.bind(function () {
	            var sel = popup.getSelected();

	            if (sel !== null) {
	              chartType = sel.id;
	              this.refresh();
	            }

	            popup.close();
	          }, this));
	        },
	        "webix_chart_checkbox": function (e, id) {
	          var item = this.getItem(id);
	          item.markCheckbox = item.markCheckbox ? 0 : 1;
	          this.updateItem(id, item);
	        }
	      },
	      template: function (obj, common) {
	        if (obj.id === "logScale") {
	          return "<div class='webix_chart_checkbox'>" + common.markCheckbox(obj, common) + "<span>" + obj.title.toLowerCase() + "</span></div>";
	        } else {
	          return "<span class='webix_pivot_icon pt-bar-chart'></span><span>" + webix.i18n.pivot.chartType.toLowerCase() + "</span><span class='webix_link_selection'>" + webix.i18n.pivot[common.getType(obj, common)] + "</span>";
	        }
	      },
	      data: [{
	        title: webix.i18n.pivot.logScale,
	        id: "logScale"
	      }, {
	        title: webix.i18n.pivot.chartType,
	        id: "chartType",
	        chartType: chartType
	      }]
	    }
	  };
	}

	webix.protoUI({
	  name: "webix_pivot_chart_config",
	  $init: function () {
	    this.$view.className += " webix_pivot_chart_popup webix_pivot";
	  },
	  defaults: {
	    chartTypeLabelWidth: 100,
	    chartTypeWidth: 302,
	    logScaleLabelWidth: 125,
	    fieldsColumnWidth: 240,
	    popupWidth: 890
	  },
	  _getUI: function (config) {
	    var structure = webix.copy(getStructureMap$1(this, config));
	    return this._setStructure(structure, config);
	  },
	  _lists: ["filters", "values", "groupBy"],
	  _dndCorrection: {
	    "values": ["groupBy"],
	    "groupBy": ["values"]
	  },
	  _hidePopups: function () {
	    webix.callEvent("onClick", []);
	  },
	  _afterInit: function () {
	    this.attachEvent("onItemClick", function (id) {
	      if (this.$eventSource.name == "button") {
	        //transform button clicks to events
	        var innerId = this.innerId(id),
	            structure = this.getStructure();

	        if (innerId == "apply" && (!structure.values.length || !structure.groupBy)) {
	          webix.alert(webix.i18n.pivot.valuesNotDefined);
	        } else {
	          if (webix.$$(this.config.pivot).callEvent("onBefore" + innerId, [structure])) {
	            this.callEvent("on" + innerId, [structure]);
	            this.hide();
	          }
	        }
	      }
	    });
	    var popupBlocks = this.$view.querySelectorAll(".webix_pivot_configuration .webix_list");

	    for (var i = 0; i < popupBlocks.length; i++) {
	      popupBlocks[i].setAttribute("window-message", webix.i18n.pivot.windowMessage);
	    }
	  },
	  getStructure: function () {
	    var structure = {
	      groupBy: "",
	      values: [],
	      filters: []
	    };
	    var groupBy = this.$$("groupBy");
	    if (groupBy.count()) structure.groupBy = groupBy.getItem(groupBy.getFirstId()).name;
	    var values = this.$$("values");
	    var temp;
	    values.data.each(webix.bind(function (obj) {
	      for (var j = 0; j < obj.operation.length; j++) {
	        temp = webix.copy(obj);
	        webix.extend(temp, {
	          operation: obj.operation[j],
	          color: obj.color[j] || webix.$$(this.config.pivot).config.color
	        }, true);
	        structure.values.push(temp);
	      }
	    }, this));
	    var filters = this.$$("filters");
	    filters.data.each(function (obj) {
	      structure.filters.push(obj);
	    });
	    return structure;
	  }
	}, webix.ui.webix_pivot_config_common);

	var defaults$1 = {
	  fieldMap: {},
	  rows: [],
	  defaultOperation: "sum",
	  filterLabelAlign: "right",
	  filterWidth: 200,
	  filterMinWidth: 180,
	  editButtonWidth: 110,
	  filterLabelWidth: 100,
	  filterPlaceholder: false,
	  separateLabel: true,
	  chartType: "bar",
	  color: "#36abee",
	  chart: {},
	  singleLegendItem: 1,
	  palette: [["#e33fc7", "#a244ea", "#476cee", "#36abee", "#58dccd", "#a7ee70"], ["#d3ee36", "#eed236", "#ee9336", "#ee4339", "#595959", "#b85981"], ["#c670b8", "#9984ce", "#b9b9e2", "#b0cdfa", "#a0e4eb", "#7faf1b"], ["#b4d9a4", "#f2f79a", "#ffaa7d", "#d6806f", "#939393", "#d9b0d1"], ["#780e3b", "#684da9", "#242464", "#205793", "#5199a4", "#065c27"], ["#54b15a", "#ecf125", "#c65000", "#990001", "#363636", "#800f3e"]]
	};

	webix.protoUI({
	  name: "pivot-chart",
	  version: "{{version}}",
	  defaults: defaults$1,
	  templates: {
	    groupNameToStr: function (name, operation) {
	      return name + "_" + operation;
	    },
	    groupNameToObject: function (name) {
	      var arr = name.split("_");
	      return {
	        name: arr[0],
	        operation: arr[1]
	      };
	    },
	    seriesTitle: function (data, i) {
	      var name = this.config.fieldMap[data.name] || this._capitalize(data.name);

	      var operation = webix.isArray(data.operation) ? data.operation[i] : data.operation;
	      return name + " ( " + (webix.i18n.pivot[operation] || operation) + ")";
	    }
	  },
	  templates_setter: function (obj) {
	    if (_typeof(obj) == "object") webix.extend(this.templates, obj);
	  },
	  chartMap: {
	    bar: function (color) {
	      return {
	        border: 0,
	        alpha: 1,
	        radius: 0,
	        color: color
	      };
	    },
	    line: function (color) {
	      return {
	        alpha: 1,
	        item: {
	          borderColor: color,
	          color: color
	        },
	        line: {
	          color: color,
	          width: 2
	        }
	      };
	    },
	    radar: function (color) {
	      return {
	        alpha: 1,
	        fill: false,
	        disableItems: true,
	        item: {
	          borderColor: color,
	          color: color
	        },
	        line: {
	          color: color,
	          width: 2
	        }
	      };
	    }
	  },
	  chartMap_setter: function (obj) {
	    if (_typeof(obj) == "object") webix.extend(this.chartMap, obj, true);
	  },
	  $init: function (config) {
	    if (config.separateLabel === false) {
	      config.filterWidth = config.filterWidth || 300;
	    }

	    this.data.provideApi(this, true);
	    if (!config.structure) config.structure = {};
	    webix.extend(config.structure, {
	      groupBy: "",
	      values: [],
	      filters: []
	    });
	    this.$view.className += " webix_pivot webix_pivot_chart";
	    webix.extend(config, {
	      editButtonWidth: this.defaults.editButtonWidth
	    });
	    webix.extend(config, this.getUI(config));
	    this.$ready.push(webix.bind(function () {
	      webix.delay(this.render, this); // delay needed for correct legend rendering
	    }, this));
	    this.data.attachEvent("onStoreUpdated", webix.bind(function () {
	      // call render if pivot is initialized
	      if (this.$$("chart")) this.render();
	    }, this));
	    this.attachEvent("onFilterChange", function () {
	      this.render(true);
	    });
	    this.filters = new Filters();
	  },
	  getUI: function () {
	    var filters = {
	      view: "toolbar",
	      id: "filters",
	      hidden: true,
	      paddingY: 10,
	      paddingX: 5,
	      borderless: true,
	      margin: 10,
	      cols: []
	    };
	    var chart = {
	      id: "bodyLayout",
	      type: "line",
	      margin: 10,
	      cols: [{
	        id: "chart",
	        view: "chart"
	      }]
	    };
	    return {
	      rows: [filters, chart]
	    };
	  },
	  configure: function () {
	    if (!this._pivotPopup) {
	      var config = {
	        view: "webix_pivot_chart_config",
	        operations: [],
	        pivot: this.config.id
	      };
	      webix.extend(config, this.config.popup || {});
	      this._pivotPopup = webix.ui(config);
	      this.callEvent("onPopup", [this._pivotPopup]);

	      this._pivotPopup.attachEvent("onApply", webix.bind(function (structure) {
	        this.config.chartType = this._pivotPopup.$$("chartBody") ? this._pivotPopup.$$("chartBody").getItem("chartType").chartType : "bar";
	        this.config.chart.scale = this._pivotPopup.$$("chartBody").getItem("logScale").markCheckbox ? "logarithmic" : "linear";
	        webix.extend(this.config.structure, structure, true);
	        this.render();
	      }, this));
	    }

	    var functions = [];

	    for (var i in this.operations) {
	      functions.push({
	        name: i,
	        title: this._applyLocale(i)
	      });
	    }

	    this._pivotPopup._valueLength = this._valueLength || 0;

	    this._pivotPopup.define("operations", functions);

	    var pos = webix.html.offset(this.$$("chart").getNode());

	    this._pivotPopup.setPosition(pos.x + 10, pos.y + 10);

	    this._pivotPopup.define("data", this.getFields());

	    this._pivotPopup.show();
	  },
	  destructor: function () {
	    if (this._pivotPopup) {
	      if (this._eventId) {
	        webix.eventRemove(this._eventId);
	      }

	      this._pivotPopup.destructor();

	      this._pivotPopup = null;
	    }

	    webix.Destruction.destructor.call(this);
	  },
	  render: function (withoutFilters) {
	    if (!withoutFilters) {
	      // render filters
	      var filters = processFilters(this);
	      showFilters(this, filters);
	    }

	    this._valueLength = 0;
	    var struct = this.config.structure;

	    if (struct && struct.groupBy && struct.values && struct.values.length) {
	      this._setChartConfig();

	      this._loadFilteredData();
	    } else {
	      this.config.structure = {
	        values: []
	      };

	      this._setChartConfig();
	    }
	  },
	  _setChartConfig: function () {
	    var config = this.config;
	    var values = config.structure.values;

	    for (var i = 0; i < values.length; i++) {
	      values[i].operation = values[i].operation || [config.defaultOperation];
	      if (!webix.isArray(values[i].operation)) values[i].operation = [values[i].operation];
	    }

	    var chartType = config.chartType || "bar";
	    var mapConfig = this.chartMap[chartType];
	    var chart = {
	      "type": mapConfig && mapConfig("").type ? mapConfig("").type : chartType,
	      "xAxis": webix.extend({
	        template: "#id#"
	      }, config.chart.xAxis || {}, true),
	      "yAxis": webix.extend({}, config.chart.yAxis || {})
	    };
	    webix.extend(chart, config.chart);

	    if (!chart.padding) {
	      chart.padding = {
	        top: 17
	      };
	    }

	    var result = this._getSeries();

	    chart.series = result.series;
	    chart.legend = false;

	    if (config.singleLegendItem || this._valueLength > 1) {
	      chart.legend = result.legend;
	    }

	    chart.scheme = {
	      $group: this._pivot_group,
	      $sort: {
	        by: "id"
	      }
	    };
	    this.$$("chart").removeAllSeries();

	    for (var c in chart) {
	      this.$$("chart").define(c, chart[c]);
	    }

	    if (this.$$("chart") && !config.readonly) {
	      var el = document.createElement("div");
	      el.className = "webix_pivot_configure";
	      el.title = this._applyLocale("settings");
	      el.style.width = chart.legend.width + "px";
	      el.style.top = chart.padding.top + "px";
	      el.innerHTML = "<span class='webix_pivot_icon pt-settings'></span><span class='webix_pivot_configure_label'>" + webix.i18n.pivot.pivotMessage + "</span>";
	      this.$$("chart").$view.insertBefore(el, this.$$("chart").$view.querySelector("canvas"));
	      this._eventId = webix.event(this.$$("chart").$view.querySelector(".webix_pivot_configure"), "click", function () {
	        this.configure();
	      }.bind(this));
	    }
	  },
	  _applyLocale: function (value) {
	    return webix.i18n.pivot[value] || value;
	  },
	  _capitalize: function (value) {
	    return value.charAt(0).toUpperCase() + value.slice(1);
	  },
	  _applyMap: function (value, capitalize) {
	    return this.config.fieldMap[value] || (capitalize ? this._capitalize(value) : value);
	  },
	  _loadFilteredData: function () {
	    var filters = this.config.structure.filters;
	    formatFilterValues(filters);
	    setFilterValues(filters);
	    this.data.silent(function () {
	      var _this = this;

	      this.data.filter(function (item) {
	        return filterItem(filters, item, _this.config.filterMap);
	      });
	    }, this);
	    this.$$("chart").data.silent(function () {
	      this.$$("chart").clearAll();
	    }, this);
	    this.$$("chart").parse(this.data.getRange()); // reset filtering

	    this.data.silent(function () {
	      this.data.filter("");
	    }, this);
	  },
	  groupNameToStr: function (obj) {
	    return obj.name + "_" + obj.operation;
	  },
	  groupNameToObject: function (name) {
	    var arr = name.split("_");
	    return {
	      name: arr[0],
	      operation: arr[1]
	    };
	  },
	  _getSeries: function () {
	    var i,
	        j,
	        legend,
	        map = {},
	        name,
	        legendTitle,
	        series = [],
	        values = this.config.structure.values; // legend definition

	    legend = {
	      valign: "middle",
	      align: "right",
	      width: 220,
	      layout: "y"
	    };
	    webix.extend(legend, this.config.chart.legend || {}, true);
	    legend.values = [];
	    if (!legend.marker) legend.marker = {};
	    legend.marker.type = this.config.chartType == "line" ? "item" : "s";
	    this.series_names = [];
	    this._valueLength = 0;

	    for (i = 0; i < values.length; i++) {
	      if (!webix.isArray(values[i].operation)) {
	        values[i].operation = [values[i].operation];
	      }

	      if (!webix.isArray(values[i].color)) {
	        values[i].color = [values[i].color || this._getColor(this._valueLength)];
	      }

	      for (j = 0; j < values[i].operation.length; j++) {
	        name = this.templates.groupNameToStr(values[i].name, values[i].operation[j]);
	        this.series_names.push(name);
	        if (!values[i].color[j]) values[i].color[j] = this._getColor(this._valueLength);
	        var color = values[i].color[j];
	        var sConfig = this.chartMap[this.config.chartType](color) || {};
	        sConfig.value = "#" + name + "#";
	        sConfig.tooltip = {
	          template: webix.bind(function (obj) {
	            return obj[this].toFixed(3);
	          }, name)
	        };
	        series.push(sConfig);
	        legendTitle = this.templates.seriesTitle.call(this, values[i], j);
	        legend.values.push({
	          text: legendTitle,
	          color: color
	        });
	        map[name] = [values[i].name, values[i].operation[j]];
	        this._valueLength++;
	      }
	    }

	    this._pivot_group = {};
	    if (values.length) this._pivot_group = webix.copy({
	      by: this.config.structure.groupBy,
	      map: map
	    });
	    return {
	      series: series,
	      legend: legend
	    };
	  },
	  _getColor: function (i) {
	    var palette = this.config.palette;
	    var rowIndex = i / palette[0].length;
	    rowIndex = rowIndex > palette.length ? 0 : parseInt(rowIndex, 10);
	    var columnIndex = i % palette[0].length;
	    return palette[rowIndex][columnIndex];
	  },
	  operations: {
	    sum: 1,
	    count: 1,
	    max: 1,
	    min: 1
	  },
	  addGroupMethod: function (name, method) {
	    this.operations[name] = 1;
	    if (method) webix.GroupMethods[name] = method;
	  },
	  removeGroupMethod: function (name) {
	    delete this.operations[name];
	  },
	  groupMethods_setter: function (obj) {
	    for (var a in obj) {
	      if (obj.hasOwnProperty(a)) this.addGroupMethod(a, obj[a]);
	    }
	  },
	  // fields for edit popup
	  getFields: function () {
	    var i,
	        fields = [],
	        fields_hash = {};

	    for (i = 0; i < Math.min(this.data.count() || 5); i++) {
	      var item = this.data.getItem(this.data.getIdByIndex(i));

	      for (var f in item) {
	        if (!fields_hash[f]) {
	          fields.push(f);
	          fields_hash[f] = webix.uid();
	        }
	      }
	    }

	    var str = this.config.structure;
	    var result = {
	      fields: [],
	      groupBy: [],
	      values: [],
	      filters: []
	    };
	    var field = _typeof(str.groupBy) == "object" ? str.groupBy[0] : str.groupBy;

	    if (!webix.isUndefined(fields_hash[field])) {
	      result.groupBy.push({
	        name: field,
	        text: this._applyMap(field),
	        id: fields_hash[field]
	      });
	    }

	    var valueNameHash = {};
	    var text;

	    for (i = 0; i < str.values.length; i++) {
	      field = str.values[i];

	      if (!webix.isUndefined(fields_hash[field.name])) {
	        text = this._applyMap(field.name);

	        if (webix.isUndefined(valueNameHash[field.name])) {
	          valueNameHash[field.name] = result.values.length;
	          result.values.push({
	            name: field.name,
	            text: text,
	            operation: field.operation,
	            color: field.color || [this._getColor(i)],
	            id: fields_hash[field.name]
	          });
	        } else {
	          var value = result.values[valueNameHash[field.name]];
	          value.operation = value.operation.concat(field.operation);
	          value.color = value.color.concat(field.color || [this._getColor(i)]);
	        }
	      }
	    }

	    for (i = 0; i < (str.filters || []).length; i++) {
	      field = str.filters[i];

	      if (!webix.isUndefined(fields_hash[field.name])) {
	        text = this._applyMap(field.name);
	        result.filters.push({
	          name: field.name,
	          text: text,
	          type: field.type,
	          value: field.value,
	          id: fields_hash[field]
	        });
	      }
	    }

	    fields.sort();

	    for (i = 0; i < fields.length; i++) {
	      field = fields[i];
	      if (!webix.isUndefined(fields_hash[field])) result.fields.push({
	        name: field,
	        text: this._applyMap(field),
	        id: fields_hash[field]
	      });
	    }

	    return result;
	  },
	  setStructure: function (config) {
	    this.define("structure", config);
	    this.render();
	  },
	  getStructure: function () {
	    return this.config.structure;
	  },
	  getConfigWindow: function () {
	    return this._pivotPopup;
	  },
	  getFilterView: function () {
	    return this.$$("filters");
	  },
	  $exportView: function (options) {
	    webix.extend(options, {
	      ignore: {
	        $group: true,
	        $row: true
	      }
	    });
	    return this.$$("chart");
	  }
	}, webix.IdSpace, webix.ui.layout, webix.DataLoader, webix.EventSystem, webix.Settings);

})));
