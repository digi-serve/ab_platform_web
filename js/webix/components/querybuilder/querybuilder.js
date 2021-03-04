/**
 * @license
 * Webix QueryBuilder v.7.4.6
 * This software is covered by Webix Commercial License.
 * Usage without proper license is prohibited.
 * (c) XB Software Ltd.
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

	var locale = {
	  or: "або",
	  and: "і",
	  delete_rule: "Выдаліць правіла",
	  add_rule: "Дадаць правіла",
	  add_group: "Дадаць групу",
	  less: "менш",
	  less_or_equal: "менш або роўна",
	  greater: "больш",
	  greater_or_equal: "больш або роўна",
	  between: "паміж",
	  not_between: "не паміж",
	  begins_with: "пачынаецца з",
	  not_begins_with: "не пачынаецца з",
	  contains: "змяшчае",
	  not_contains: "не змяшчае",
	  ends_with: "заканчваецца",
	  not_ends_with: "не сканчаецца",
	  is_empty: "пуста",
	  is_not_empty: "не пуста",
	  equal: "роўныя",
	  not_equal: "не роўныя",
	  is_null: "роўная нуля",
	  is_not_null: "не роўная нуля",
	  default_option: "---",
	  cancel: "адмяніць",
	  filter: "фільтраваць",
	  sort: "сартаваць"
	};

	/*German (Germany) locale*/
	var locale$1 = {
	  or: "oder",
	  and: "und",
	  delete_rule: "Regel löschen",
	  add_rule: "Regel hinzufügen",
	  add_group: "Gruppe hinzufügen",
	  less: "weniger",
	  less_or_equal: "weniger oder gleich",
	  greater: "mehr",
	  greater_or_equal: "größer oder gleich",
	  between: "zwischen",
	  not_between: "nicht zwischen",
	  begins_with: "beginnt mit",
	  not_begins_with: "nicht beginnt mit",
	  contains: "enthält",
	  not_contains: "nicht enthält",
	  ends_with: "endet mit",
	  not_ends_with: "nicht endet mit",
	  is_empty: "ist leer",
	  is_not_empty: "es ist nicht leer",
	  equal: "gleich",
	  not_equal: "ungleich",
	  is_null: "ist null",
	  is_not_null: "es ist nicht null",
	  default_option: "---",
	  cancel: "Stornieren",
	  filter: "Filter",
	  sort: "Sortieren"
	};

	var locale$2 = {
	  or: "Or",
	  and: "And",
	  delete_rule: "Delete rule",
	  add_rule: "Add rule",
	  add_group: "Add group",
	  less: "less",
	  less_or_equal: "less or equal",
	  greater: "greater",
	  greater_or_equal: "greater or equal",
	  between: "between",
	  not_between: "not between",
	  begins_with: "begins with",
	  not_begins_with: "not begins with",
	  contains: "contains",
	  not_contains: "not contains",
	  ends_with: "ends with",
	  not_ends_with: "not ends with",
	  is_empty: "is empty",
	  is_not_empty: "is not empty",
	  equal: "equal",
	  not_equal: "not equal",
	  is_null: "is null",
	  is_not_null: "is not null",
	  default_option: "---",
	  cancel: "Cancel",
	  filter: "Filter",
	  sort: "Sort",
	  sortby: "Sort by",
	  asc: "asc",
	  desc: "desc"
	};

	var locale$3 = {
	  or: "o",
	  and: "y",
	  delete_rule: "Borrar regla",
	  add_rule: "Añadir regla",
	  add_group: "Añadir grupo",
	  less: "menos",
	  less_or_equal: "menor o igual",
	  greater: "mayor",
	  greater_or_equal: "mayor o igual",
	  between: "entre",
	  not_between: "no entre",
	  begins_with: "comienza con",
	  not_begins_with: "no comienza con",
	  contains: "contiene",
	  not_contains: "not contiene",
	  ends_with: "termina con",
	  not_ends_with: "no termina con",
	  is_empty: "está vacía",
	  is_not_empty: "no está vacía",
	  equal: "igual",
	  not_equal: "no es igual",
	  is_null: "es nulo",
	  is_not_null: "no es nulo",
	  default_option: "---",
	  cancel: "Cancelar",
	  filter: "Filtrar",
	  sort: "Ordenar"
	};

	var locale$4 = {
	  or: "ou",
	  and: "et",
	  delete_rule: "Supprimer la règle",
	  add_rule: "Ajouter une règle",
	  add_group: "Ajouter un groupe",
	  less: "moins",
	  less_or_equal: "inférieur ou égal",
	  greater: "plus grand",
	  greater_or_equal: "supérieur ou égal",
	  between: "entre",
	  not_between: "pas entre",
	  begins_with: "commence par",
	  not_begins_with: "ne commence par",
	  contains: "contient",
	  not_contains: "ne contient",
	  ends_with: "se termine par",
	  not_ends_with: "pas se termine par",
	  is_empty: "est vide",
	  is_not_empty: "Il n'est pas vide",
	  equal: "égal",
	  not_equal: "pas égal",
	  is_null: "est nulle",
	  is_not_null: "Il est non nul",
	  default_option: "---",
	  cancel: "Annuler",
	  filter: "Filtre",
	  sort: "Trier"
	};

	var locale$5 = {
	  or: "o",
	  and: "e",
	  delete_rule: "Elimina la regola",
	  add_rule: "Aggiungi regola",
	  add_group: "Aggiungere gruppo",
	  less: "meno",
	  less_or_equal: "minore o uguale",
	  greater: "maggiore",
	  greater_or_equal: "maggiore o uguale",
	  between: "tra",
	  not_between: "non tra",
	  begins_with: "inizia con",
	  not_begins_with: "non inizia con",
	  contains: "contiene",
	  not_contains: "non contiene",
	  ends_with: "finisce con",
	  not_ends_with: "non termina con",
	  is_empty: "è vuoto",
	  is_not_empty: "non è vuota",
	  equal: "uguale",
	  not_equal: "non uguale",
	  is_null: "è nullo",
	  is_not_null: "non è nullo",
	  default_option: "---",
	  cancel: "Annulla",
	  filter: "Filtro",
	  sort: "Ordinare"
	};

	var locale$6 = {
	  or: "または",
	  and: "そして",
	  delete_rule: "ルールを削除する",
	  add_rule: "ルールを追加",
	  add_group: "グループを追加",
	  less: "レス",
	  less_or_equal: "以下",
	  greater: "大きいです",
	  greater_or_equal: "以上",
	  between: "間に",
	  not_between: "いない間",
	  begins_with: "で始まります",
	  not_begins_with: "ないで始まります",
	  contains: "含まれています",
	  not_contains: "含まれていません",
	  ends_with: "で終わります",
	  not_ends_with: "で終わりではありません",
	  is_empty: "空であります",
	  is_not_empty: "それは空でありません",
	  equal: "等しいです",
	  not_equal: "等しくありません",
	  is_null: "ブランクである",
	  is_not_null: "ブランクではない",
	  default_option: "---",
	  cancel: "キャンセル",
	  filter: "フィルタ",
	  sort: "ソート"
	};

	var locale$7 = {
	  or: "ou",
	  and: "e",
	  delete_rule: "Excluir regra",
	  add_rule: "Adicionar regra",
	  add_group: "Adicionar grupo",
	  less: "menos",
	  less_or_equal: "menor ou igual",
	  greater: "maior",
	  greater_or_equal: "maior ou igual",
	  between: "entre",
	  not_between: "não entre",
	  begins_with: "começa com",
	  not_begins_with: "não começa com",
	  contains: "contém",
	  not_contains: "não contém",
	  ends_with: "termina com",
	  not_ends_with: "não termina com",
	  is_empty: "está vazia",
	  is_not_empty: "não é vazia",
	  equal: "igual",
	  not_equal: "não é igual",
	  is_null: "é nulo",
	  is_not_null: "não é nula",
	  default_option: "---",
	  cancel: "Cancelar",
	  filter: "Filtro",
	  sort: "Ordenar"
	};

	var locale$8 = {
	  or: "или",
	  and: "и",
	  delete_rule: "Удалить правило",
	  add_rule: "Добавить правило",
	  add_group: "Добавить группу",
	  less: "меньше",
	  less_or_equal: "меньше или равно",
	  greater: "больше",
	  greater_or_equal: "больше или равно",
	  between: "между",
	  not_between: "не между",
	  begins_with: "начинается с",
	  not_begins_with: "не начинается с",
	  contains: "содержит",
	  not_contains: "не содержит",
	  ends_with: "заканчиватся",
	  not_ends_with: "не заканчиватся",
	  is_empty: "пусто",
	  is_not_empty: "не пусто",
	  equal: "равно",
	  not_equal: "не равно",
	  is_null: "равно нулю",
	  is_not_null: "не равно нулю",
	  default_option: "---",
	  cancel: "Отменить",
	  filter: "Фильтровать",
	  sort: "Сортировать"
	};

	var locale$9 = {
	  or: "要么",
	  and: "和",
	  delete_rule: "删除规则",
	  add_rule: "添加规则",
	  add_group: "添加组",
	  less: "减",
	  less_or_equal: "少于或等于",
	  greater: "更大",
	  greater_or_equal: "大于或等于",
	  between: "之间",
	  not_between: "不在之间",
	  begins_with: "开始于",
	  not_begins_with: "不开始",
	  contains: "包含",
	  not_contains: "不包含",
	  ends_with: "结束",
	  not_ends_with: "不是以",
	  is_empty: "是空的",
	  is_not_empty: "不是空的",
	  equal: "等于",
	  not_equal: "不平等",
	  is_null: "为空",
	  is_not_null: "不为空",
	  default_option: "---",
	  cancel: "取消",
	  filter: "过滤",
	  sort: "分类"
	};

	function setLocale(locale$$1, name) {
	  var lang = webix.i18n.locales[name];
	  if (lang) lang.querybuilder = locale$$1;
	}

	setLocale(locale, "be-BY");
	setLocale(locale$1, "de-DE");
	setLocale(locale$2, "en-US");
	setLocale(locale$3, "es-ES");
	setLocale(locale$4, "fr-FR");
	setLocale(locale$5, "it-IT");
	setLocale(locale$6, "ja-JP");
	setLocale(locale$7, "pt-BR");
	setLocale(locale$8, "ru-RU");
	setLocale(locale$9, "zh-CN");
	webix.i18n.querybuilder = locale$2;

	function _toConsumableArray(arr) {
	  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
	}

	function _arrayWithoutHoles(arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

	    return arr2;
	  }
	}

	function _iterableToArray(iter) {
	  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
	}

	function _nonIterableSpread() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance");
	}

	webix.protoUI({
	  name: "querybuilderline",
	  defaults: {
	    padding: 0,
	    margin: 10,
	    borderless: true
	  },
	  $init: function (config) {
	    var _this = this;

	    var locale = webix.i18n.querybuilder;
	    this.config.value = {};
	    this.$view.className += " webix_qb_line";

	    var keyoptions = _toConsumableArray(config.fields);

	    var elements = [this._selectConfig(config, "webix_qb_value_select", "key", keyoptions), this._selectConfig(config, "webix_qb_rule_select", "rule", {
	      body: {
	        data: [],
	        template: "#name#"
	      }
	    }, true), {
	      view: "button",
	      type: "htmlbutton",
	      css: "webix_qb_close",
	      width: 26,
	      inputWidth: 26,
	      name: "close",
	      label: "<span class=\"webix_icon wxi-trash\" title=\"".concat(locale.delete_rule, "\"></span>"),
	      click: function () {
	        _this._getParentQuery()._deleteRow(_this);
	      }
	    }];

	    if (config.columnMode) {
	      config.css = (config.css || "") + " webix_column_qb";
	      config.margin = config.margin || 0;
	      config.rows = elements;
	    } else {
	      elements.push({
	        gravity: 0.001
	      });
	      config.cols = elements;
	    }
	  },
	  _selectConfig: function (config, css, name, options, hidden) {
	    var _this2 = this;

	    var select = {
	      view: "richselect",
	      minWidth: 100,
	      maxWidth: config.inputMaxWidth,
	      inputPadding: 0,
	      options: options,
	      hidden: hidden,
	      css: css,
	      name: name,
	      on: {
	        onChange: function () {
	          return _this2._onChange(name);
	        }
	      }
	    };
	    return select;
	  },
	  _inputConfig: function (config, type, value, field) {
	    var _this3 = this;

	    var input;

	    if (typeof type === "string") {
	      input = {
	        view: type
	      };
	    } else {
	      input = webix.copy(type);
	    }

	    input.name = "value";
	    input.maxWidth = config.inputMaxWidth;
	    input.value = value;
	    input.on = {
	      onChange: function () {
	        return _this3._onChange("value");
	      }
	    };
	    if (field.validate) input.validate = field.validate;

	    if (type === "rangeslider") {
	      input.min = 0;
	      input.max = 100;
	      input.value = [0, 100];
	      input.moveTitle = false;

	      input.title = function (obj) {
	        var v = obj.value;
	        return v[0] === v[1] ? v[0] : v[0] + " - " + v[1];
	      };
	    }

	    return input;
	  },
	  getValue: function () {
	    var state = this.config.value;
	    if (state.rule && (state.value !== "" || state.rule === "equal" || state.rule === "not_equal" || !this.elements.value)) return this.config.value;
	    return null;
	  },
	  setValue: function (value) {
	    this.config.value = value;
	    this._silent = true;

	    if (value && value.key) {
	      this.elements.key.setValue(value.key);

	      if (value.rule) {
	        this.elements.rule.setValue(value.rule);
	        if (value.value) this.elements.value.setValue(value.value);
	      }
	    }

	    this._silent = false;
	  },
	  _onChange: function (key) {
	    var select = this.elements[key];
	    var value = this.config.value;
	    value[key] = select.getValue();

	    this._adjustVisible(key, value);

	    if (!this._silent) {
	      this._getTopQuery().callEvent("onChange", [this]);

	      this._getTopQuery().callEvent("onKeySelect", [this]);
	    }
	  },
	  _adjustVisible: function (type, data) {
	    var field = this.elements.key.getList().getItem(data.key);
	    var rule = this.elements.rule;
	    var value = this.elements.value;

	    if (type === "key") {
	      this._updateRuleField(data, field, rule, value);
	    } else if (type === "rule") {
	      this._updateValueField(data, field, rule, value);
	    }
	  },
	  _fillRules: function (field, rule) {
	    var filters = this.config.filters;
	    filters.filter(function (a) {
	      return a.type[field.type] || a.type["any"];
	    });
	    rule.getList().data.importData(filters.data);
	  },
	  _updateRuleField: function (data, field, rule, value) {
	    var oldrule = rule.getValue();
	    var filter = oldrule ? rule.getList().getItem(oldrule).type : "";
	    if (!this._silent && !filter[field.type]) data.rule = data.value = "";

	    if (data.key) {
	      rule.show();

	      this._fillRules(field, rule);

	      rule.setValue(data.rule);

	      this._updateValueField(data, field, rule, this.elements.value);
	    } else {
	      rule.hide();
	      if (value) value.hide();
	    }
	  },
	  _updateValueField: function (data, field, rule, value) {
	    if (data.rule) {
	      var filter = rule.getList().getItem(data.rule);
	      var editor = filter.type[field.type] || filter.type["any"];

	      if (value && editor === value.name) {
	        value.show();
	        value.setValue(data.value);
	      } else {
	        if (!this._silent) data.value = "";
	        if (value) this.removeView(value);

	        if (editor !== "none") {
	          this.addView(this._inputConfig(this.config, editor, data.value, field), 2);
	        }
	      }
	    } else {
	      if (!this._silent) data.value = "";
	      if (value) value.hide();
	    }
	  },
	  _getParentQuery: function () {
	    return this.queryView({
	      view: "querybuilder"
	    }, "parent");
	  },
	  _getTopQuery: function () {
	    return this._getParentQuery()._getTopQuery();
	  },
	  getFilterHelper: function () {
	    var data = this.config.value;
	    if (!this.getValue()) return null;
	    var filter = this.elements.rule.getList().getItem(data.rule);
	    return function (obj) {
	      return filter.fn(obj[data.key], data.value);
	    };
	  }
	}, webix.ui.form, webix.EventSystem);

	var sort = {
	  _init_sorting: function () {
	    var _this = this;

	    var locale = webix.i18n.querybuilder;
	    return [{
	      view: "multiselect",
	      $id: "by",
	      label: locale.sortby,
	      suggest: {
	        body: {
	          data: this.config.fields
	        }
	      },
	      align: "right",
	      width: 300,
	      labelWidth: 57,
	      on: {
	        onChange: function () {
	          _this._callChangeMethod();
	        }
	      }
	    }, {
	      view: "richselect",
	      $id: "order",
	      options: [{
	        id: "asc",
	        value: locale.asc
	      }, {
	        id: "desc",
	        value: locale.desc
	      }],
	      value: "asc",
	      width: 80,
	      on: {
	        onChange: function () {
	          if (_this._getSortingValues().sortBy) {
	            _this._callChangeMethod();
	          }
	        }
	      }
	    }, {}];
	  },
	  _getSortingValues: function () {
	    var els = this.getSortingElements();
	    return {
	      sortBy: els[0].getValue(),
	      sortAs: els[1].getValue()
	    };
	  },
	  _setSortingValues: function (value) {
	    var els = this.getSortingElements();

	    if (value.fields) {
	      var list = els[0].getList();
	      list.clearAll();
	      list.parse(value.fields);
	    }

	    els[0].setValue(value.sortBy);
	    els[1].setValue(value.sortAs);
	  },
	  getSortingElements: function () {
	    return [this.queryView({
	      $id: "by"
	    }), this.queryView({
	      $id: "order"
	    })];
	  },
	  getSortingHelper: function () {
	    var els = this.getSortingElements();
	    var by = els[0].getValue();
	    var sortAs = els[1].getValue();
	    if (!by) return null;
	    var values = by.split(",").map(function (id) {
	      var item = els[0].getList().getItem(id);
	      var type = item.type;
	      if (type === "number") type = "int";
	      return {
	        by: function (obj) {
	          return obj[id];
	        },
	        as: webix.DataStore.prototype.sorting.as[type]
	      };
	    });
	    return function (obj1, obj2) {
	      var order;

	      for (var i = 0; i < values.length; i++) {
	        var sorter = values[i];
	        var a = sorter.by(obj1);
	        var b = sorter.by(obj2);
	        order = sorter.as(a, b);
	        if (order !== 0) break;
	      }

	      return order * (sortAs === "asc" ? 1 : -1);
	    };
	  }
	};

	var text = {
	  "any": "text",
	  "number": "text",
	  "date": "datepicker"
	};
	var range = {
	  "number": "rangeslider",
	  "date": "daterangepicker"
	};
	var str = {
	  "string": "text"
	};

	function filters() {
	  var locale = webix.i18n.querybuilder;

	  var prepare = function (v) {
	    return typeof v == "number" ? v.toString() : v;
	  };

	  return [{
	    id: "less",
	    name: locale.less,
	    fn: function (a, b) {
	      return a < b;
	    },
	    type: text
	  }, {
	    id: "less_or_equal",
	    name: locale.less_or_equal,
	    fn: function (a, b) {
	      return a <= b;
	    },
	    type: text
	  }, {
	    id: "greater",
	    name: locale.greater,
	    fn: function (a, b) {
	      return a > b;
	    },
	    type: text
	  }, {
	    id: "greater_or_equal",
	    name: locale.greater_or_equal,
	    fn: function (a, b) {
	      return a >= b;
	    },
	    type: text
	  }, {
	    id: "between",
	    name: locale.between,
	    fn: function (a, b, c) {
	      return (!b || a > b) && (!c || a < c);
	    },
	    type: range
	  }, {
	    id: "not_between",
	    name: locale.not_between,
	    fn: function (a, b, c) {
	      return !b || a <= b || !c || a >= c;
	    },
	    type: range
	  }, {
	    id: "begins_with",
	    name: locale.begins_with,
	    fn: function (a, b) {
	      return a.lastIndexOf(b, 0) === 0;
	    },
	    type: str
	  }, {
	    id: "not_begins_with",
	    name: locale.not_begins_with,
	    fn: function (a, b) {
	      return a.lastIndexOf(b, 0) !== 0;
	    },
	    type: str
	  }, {
	    id: "contains",
	    name: locale.contains,
	    fn: function (a, b) {
	      return a.indexOf(b) !== -1;
	    },
	    type: str
	  }, {
	    id: "not_contains",
	    name: locale.not_contains,
	    fn: function (a, b) {
	      return a.indexOf(b) === -1;
	    },
	    type: str
	  }, {
	    id: "ends_with",
	    name: locale.ends_with,
	    fn: function (a, b) {
	      return a.indexOf(b, a.length - b.length) !== -1;
	    },
	    type: str
	  }, {
	    id: "not_ends_with",
	    name: locale.not_ends_with,
	    fn: function (a, b) {
	      return a.indexOf(b, a.length - b.length) === -1;
	    },
	    type: str
	  }, {
	    id: "is_empty",
	    name: locale.is_empty,
	    fn: function (a) {
	      return a.length === 0;
	    },
	    type: {
	      "string": "none"
	    }
	  }, {
	    id: "is_not_empty",
	    name: locale.is_not_empty,
	    fn: function (a) {
	      return a.length > 0;
	    },
	    type: {
	      "string": "none"
	    }
	  }, {
	    id: "equal",
	    name: locale.equal,
	    fn: function (a, b) {
	      return prepare(a) == prepare(b);
	    },
	    type: {
	      any: "text",
	      "date": "datepicker"
	    }
	  }, {
	    id: "not_equal",
	    name: locale.not_equal,
	    fn: function (a, b) {
	      return prepare(a) != prepare(b);
	    },
	    type: {
	      any: "text",
	      "date": "datepicker"
	    }
	  }, {
	    id: "is_null",
	    name: locale.is_null,
	    fn: function (a) {
	      return a === null;
	    },
	    type: {
	      "any": "none"
	    }
	  }, {
	    id: "is_not_null",
	    name: locale.is_not_null,
	    fn: function (a) {
	      return a !== null;
	    },
	    type: {
	      "any": "none"
	    }
	  }];
	}

	var sql = {
	  $init: function () {
	    this.config.sqlDateFormat = this.config.sqlDateFormat || webix.Date.dateToStr("%Y-%m-%d %H:%i:%s", false);
	  },
	  sqlOperators: {
	    equal: {
	      op: "= ?"
	    },
	    not_equal: {
	      op: "!= ?"
	    },
	    less: {
	      op: "< ?"
	    },
	    less_or_equal: {
	      op: "<= ?"
	    },
	    greater: {
	      op: "> ?"
	    },
	    greater_or_equal: {
	      op: ">= ?"
	    },
	    between: {
	      op: "BETWEEN ?",
	      sep: " AND "
	    },
	    not_between: {
	      op: "NOT BETWEEN ?",
	      sep: " AND "
	    },
	    begins_with: {
	      op: "LIKE(?)",
	      mod: "{0}%"
	    },
	    not_begins_with: {
	      op: "NOT LIKE(?)",
	      mod: "{0}%"
	    },
	    contains: {
	      op: "LIKE(?)",
	      mod: "%{0}%"
	    },
	    not_contains: {
	      op: "NOT LIKE(?)",
	      mod: "%{0}%"
	    },
	    ends_with: {
	      op: "LIKE(?)",
	      mod: "%{0}"
	    },
	    not_ends_with: {
	      op: "NOT LIKE(?)",
	      mod: "%{0}"
	    },
	    is_empty: {
	      op: "= \"\"",
	      no_val: true
	    },
	    is_not_empty: {
	      op: "!= \"\"",
	      no_val: true
	    },
	    is_null: {
	      op: "IS NULL",
	      no_val: true
	    },
	    is_not_null: {
	      op: "IS NOT NULL",
	      no_val: true
	    }
	  },
	  toSQL: function (config) {
	    config = config || this.getValue();
	    var values = [];

	    var code = this._getSqlString(config, values, false);

	    var sql = this._placeValues(code, values);

	    return {
	      code: code,
	      sql: sql,
	      values: values
	    };
	  },
	  _placeValues: function (code, values) {
	    var index = 0;
	    return code.replace(/\?/g, function () {
	      var value = values[index++];
	      if (typeof value === "string") return "\"".concat(value, "\"");else return value;
	    });
	  },
	  _getSqlString: function (config, values, nested) {
	    var _this = this;

	    if (!config) {
	      return "";
	    }

	    if (config.rules && config.rules.length) {
	      var _sql = config.rules.map(function (a) {
	        return _this._getSqlString(a, values, true);
	      }).join(" " + config.glue.toUpperCase() + " ");

	      if (nested) {
	        _sql = "( ".concat(_sql, " )");
	      }

	      return _sql;
	    }

	    return this._convertValueToSql(config, values);
	  },
	  _convertValueToSql: function (el, values) {
	    var format = this.config.sqlDateFormat;
	    var value = el.value;
	    var match = this.sqlOperators[el.rule];

	    if (match) {
	      var operator = this.sqlOperators[el.rule];

	      if (!operator.no_val) {
	        if (operator.mod) {
	          values.push(operator.mod.replace("{0}", "".concat(value)));
	        } else {
	          if (Array.isArray(value)) {
	            values.push(value[0]);
	            values.push(value[1]);
	          } else if (value.start || value.end) {
	            values.push(format(value.start));
	            values.push(format(value.end));
	          } else if (value instanceof Date) {
	            values.push(format(value));
	          } else values.push(value);
	        }
	      }

	      var glue = operator.op;
	      if (operator.sep) glue = glue.replace("?", "?".concat(operator.sep, "?"));
	      return "".concat(el.key, " ").concat(glue, " ");
	    }

	    return "";
	  }
	};

	var qb = {
	  name: "querybuilder",
	  defaults: {
	    type: "space",
	    borderless: true,
	    fields: [],
	    sorting: false,
	    filtering: true,
	    glue: "and",
	    columnMode: false,
	    maxLevel: 999,
	    inputMaxWidth: 210
	  },
	  $init: function (config) {
	    config.filters = config.filters || filters();
	    if (config.filters && !config.filters.add) config.filters = new webix.DataCollection({
	      data: config.filters
	    });
	    this.$view.className += " webix_qb_wrap";
	    this.$ready.unshift(this._setLayout);
	  },
	  _setLayout: function () {
	    var _this = this;

	    var levelIndicator = this.config.maxLevel > 1 ? true : false;
	    var locale = webix.i18n.querybuilder;
	    var cols = [{
	      $id: "buttons",
	      borderless: true,
	      template: function () {
	        var and = _this.config.glue === "and";
	        return "\n<div class=\"webix_qb_buttons\">\n<button class=\"webix_qb_and".concat(and ? " webix_active" : "", "\">").concat(locale.and, "</button>\n<button class=\"webix_qb_or ").concat(!and ? " webix_active" : "", "\">").concat(locale.or, "</button>\n</div>");
	      },
	      onClick: {
	        webix_qb_and: function () {
	          return _this._updateGlue("and");
	        },
	        webix_qb_or: function () {
	          return _this._updateGlue("or");
	        }
	      },
	      minHeight: 35,
	      width: 87
	    }, {
	      $id: "rows",
	      rows: [{
	        borderless: true,
	        template: "\n<div class=\"webix_qb_add\">\n".concat(levelIndicator ? "<button class=\"webix_qb_add_group\">+ ".concat(locale.add_group, "</button>") : "", "\n<button class=\"webix_qb_add_rule\">+ ").concat(locale.add_rule, "</button>\n</div>"),
	        onClick: {
	          webix_qb_add_rule: function () {
	            return _this._addRule();
	          },
	          webix_qb_add_group: function () {
	            return _this._addGroup(true);
	          }
	        },
	        height: 22,
	        minWidth: 220
	      }],
	      margin: 5
	    }];

	    if (this.config.filtering === false) {
	      var ui = this.config.sorting ? this._init_sorting() : [{
	        height: 1
	      }];
	      this.cols_setter(ui);
	    } else {
	      // fit width in column's mode
	      if (this.config.columnMode) cols[1].rows[0].width = cols[1].rows[0].minWidth;

	      if (this.config.sorting) {
	        if (this.config.columnMode) {
	          this.rows_setter([{
	            cols: cols
	          }, {
	            cols: this._init_sorting()
	          }]);
	        } else {
	          var _sort = this._init_sorting();

	          _sort.pop();

	          cols.push({
	            rows: [{
	              cols: _sort
	            }, {
	              gravity: 0.000001
	            }]
	          });
	          this.cols_setter(cols);
	        }
	      } else this.cols_setter(cols);
	    }
	  },
	  _updateGlue: function (mode) {
	    this.config.glue = mode;
	    this.queryView({
	      $id: "buttons"
	    }).refresh();

	    this._callChangeMethod();
	  },
	  _addRow: function (ui) {
	    var layout = this.queryView({
	      $id: "rows"
	    });
	    var kids = layout.getChildViews();
	    return webix.$$(layout.addView(ui, kids.length - 1));
	  },
	  _deleteRow: function (el) {
	    var layout = this.queryView({
	      $id: "rows"
	    });
	    layout.removeView(el);

	    this._callChangeMethod();

	    if (layout.getChildViews().length <= 1) {
	      var parent = this._getParentQuery();

	      if (parent) {
	        parent._deleteRow(this.config.id);
	      }
	    }
	  },
	  _addRule: function () {
	    var line = this._addRow({
	      view: "querybuilderline",
	      inputMaxWidth: this.config.inputMaxWidth,
	      fields: this.config.fields,
	      filters: this.config.filters,
	      columnMode: this.config.columnMode
	    });

	    return line;
	  },
	  _addGroup: function (withRow) {
	    var newView = this._addRow({
	      view: "querybuilder",
	      inputMaxWidth: this.config.inputMaxWidth,
	      fields: this.config.fields,
	      filters: this.config.filters,
	      columnMode: this.config.columnMode,
	      maxLevel: this.config.maxLevel - 1
	    });

	    if (withRow) {
	      newView._addRule();
	    }

	    return newView;
	  },
	  _getParentQuery: function () {
	    return this.queryView({
	      view: this.config.view
	    }, "parent");
	  },
	  _getTopQuery: function () {
	    var parent,
	        now = this;

	    while (parent = now._getParentQuery()) {
	      now = parent;
	    }

	    return now;
	  },
	  _callChangeMethod: function () {
	    this._getTopQuery().callEvent("onChange", []);
	  },
	  _setRules: function (rules) {
	    var _this2 = this;

	    if (rules) {
	      rules.forEach(function (el) {
	        var rule;

	        if (!el.glue) {
	          rule = _this2._addRule();
	        } else {
	          rule = _this2._addGroup();
	        }

	        webix.$$(rule).setValue(el);
	      });
	    }
	  },
	  eachLine: function (cb) {
	    var rows = this.queryView({
	      $id: "rows"
	    }).getChildViews();

	    for (var i = 0; i < rows.length; i++) {
	      if (rows[i].getFilterHelper) cb(rows[i]);
	    }
	  },
	  validate: function () {
	    var result = true;
	    this.eachLine(function (line) {
	      result = result && line.validate();
	    });
	    return result;
	  },
	  getValue: function () {
	    var rules = [];
	    this.eachLine(function (a) {
	      var line = a.getValue();
	      if (line) rules.push(line);
	    });

	    if (rules.length) {
	      return {
	        glue: this.config.glue,
	        rules: rules
	      };
	    } else {
	      return null;
	    }
	  },
	  setValue: function (value) {
	    if (value.fields) {
	      this.config.fields = value.fields;
	    }

	    if (value.query) {
	      value = value.query;
	    }

	    if (value.glue) {
	      this.config.glue = value.glue;
	    }

	    this.reconstruct();

	    if (value.rules) {
	      this._setRules(value.rules);
	    }

	    this.queryView({
	      $id: "buttons"
	    }).refresh();

	    if (this.config.sorting) {
	      this._setSortingValues(value);
	    }

	    this._callChangeMethod();
	  },
	  focus: function () {
	    var line = this.queryView({
	      view: "querybuilderline"
	    });
	    if (line) line.focus();
	  },
	  getFilterHelper: function () {
	    var childsArr = [];
	    var glue = this.config.glue;
	    this.eachLine(function (a) {
	      var sub = a.getFilterHelper();
	      if (sub) childsArr.push(sub);
	    });
	    if (!childsArr.length) return function () {
	      return true;
	    };
	    return function (obj) {
	      var result;

	      if (glue === "and") {
	        result = true;
	        childsArr.forEach(function (item) {
	          if (!item(obj)) {
	            result = false;
	          }
	        });
	      } else {
	        result = false;
	        childsArr.forEach(function (item) {
	          if (item(obj)) {
	            result = true;
	          }
	        });
	      }

	      return result;
	    };
	  }
	};
	webix.protoUI(qb, sort, sql, webix.ui.layout, webix.EventSystem);

	function _buttonCreate(label, click, type) {
	  return {
	    view: "button",
	    value: label,
	    align: "right",
	    width: 120,
	    type: type,
	    click: click
	  };
	}

	webix.ui.datafilter.queryBuilder = webix.extend({
	  getInputNode: function (node) {
	    return webix.$$(node._comp_id) || null;
	  },
	  getValue: function (node) {
	    var master = webix.$$(node._comp_id);
	    return master.getValue();
	  },
	  setValue: function (node, value) {
	    var master = webix.$$(node._comp_id);
	    master.setValue(value || {});
	  },
	  refresh: function (master, node, config) {
	    var _this = this;

	    master.registerFilter(node, config, this);
	    node._comp_id = master._qb.config.id;
	    var qb = webix.$$(node._comp_id).getParentView();
	    this.setValue(node, config.value);
	    webix.event(node, "click", function () {
	      return _this._filterShow(node, qb);
	    });
	  },
	  render: function (master, config) {
	    var html = "<div class=\"webix_qb_filter\"><i class=\"webix_qb_filter_icon\" aria-hidden=\"true\"></i></div>" + (config.label || "");
	    if (config.rendered) return html;
	    var locale = webix.i18n.querybuilder;
	    config.css = "webix_ss_filter";
	    var filter;

	    config.prepare = function () {
	      filter = master._qb.getFilterHelper();
	    };

	    config.compare = function (v, i, o) {
	      return filter(o);
	    };

	    var qb = {
	      view: "querybuilder",
	      fields: config.fields
	    };
	    if (config.queryConfig) webix.extend(qb, config.queryConfig);
	    var popupView;

	    var buttonSave = _buttonCreate(locale.filter, function () {
	      if (master._qb) {
	        var cfg = master._qb.config;

	        if (cfg.sorting) {
	          var sortconfig = master._qb.getSortingHelper();

	          if (sortconfig) master.sort(sortconfig);
	        }

	        if (cfg.filtering) master.filterByAll();
	        popupView.hide();
	      }
	    }, "form");

	    var buttonCancel = _buttonCreate(locale.cancel, function () {
	      popupView.hide();
	    });

	    var body = {
	      margin: 5,
	      rows: [qb, {
	        cols: [buttonSave, buttonCancel, {}]
	      }]
	    };
	    var popup = {
	      view: "popup",
	      minWidth: 810,
	      body: body
	    };

	    if (config.popupConfig) {
	      webix.extend(popup, config.popupConfig, true);
	    }

	    popupView = webix.ui(popup);
	    master._qb = popupView.getBody().getChildViews()[0];
	    config.rendered = true;
	    master.attachEvent("onDestruct", function () {
	      popupView.destructor();
	    });
	    return html;
	  },
	  _filterShow: function (node, qb) {
	    qb.show(node.querySelector(".webix_qb_filter"));
	  }
	}, webix.EventSystem);

})));
