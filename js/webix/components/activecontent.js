webix.ActiveContent = {
	$init:function(config){  
		if (config.activeContent){
			this.$ready.push(this._init_active_content_list);
			
			this._active_holders = {};
			this._active_holders_item = {};
			this._active_holders_values = {};
			this._active_references = {};
			
			for (var key in config.activeContent){
				this[key] = this._bind_active_content(key);
			}
		}
	},
	_destructActiveContent: function(){
		for(var key in this._active_references){
			var elem = this._active_references[key];
			if(elem.destructor)
				elem.destructor();
		}
	},
	_init_active_content_list:function(){
		this.attachEvent("onDestruct", webix.bind(this._destructActiveContent,this));

		webix.event(this.$view, "blur", function(ev){
			var target = ev.target || ev.srcElement;

			// for inputs only
			if(target.tagName != "BUTTON"){
				var el = webix.$$(ev);
				if (el && el !== this && el.getValue  && el.setValue){
					el.getNode(ev);

					var newvalue = el.getValue();
					if (newvalue != el.config.value)
						el.setValue(newvalue);
				}
			}
		}, {bind:this, capture: true});

		if (this.filter){
			for (var key in this.config.activeContent){
				this.type[key] = this[key];
				this[key] = this._locate_active_content_by_id(key);
			}
			//really bad!
			this.attachEvent("onBeforeRender", function(){
				this.type.masterUI = this;
			});
			this.type.masterUI = this;
		}
	},
	_locate_active_content_by_id:function(key){
		return function(id){
			var button = this._active_references[key];
			var button_id = button.config.id;
			var html = this.getItemNode(id).getElementsByTagName("DIV");
			for (var i=0; i < html.length; i++) {
				if (html[i].getAttribute(/*@attr*/"view_id") == button_id){
					button.$setNode(html[i]);
					break;
				}
			}
			return button;
		};
	},
	_get_active_node:function(el, key, master){
		return function(e){
			if (e){
				var trg=e.target||e.srcElement;
				while (trg){
					if (trg.getAttribute && trg.getAttribute(/*@attr*/"view_id")){
						master._setActiveContentView(el,trg);
						if (master.locate){
							var id = master.locate(trg.parentNode);
							var value = master._active_holders_values[key][id];
							el.config.value = value;
							el.config.$masterId = id;
						}
						return trg;
					}
					trg = trg.parentNode;
				}				
			}
			return el.$view;
		};
	},
	_set_new_active_value:function(key, master){
		return function(value){
			var data = master.data;
			if (master.filter){
				var id = master.locate(this.$view.parentNode);
				data = master.getItem(id);
				//XMLSerializer - FF "feature"
				this.refresh();
				master._active_holders_item[key][id]=this.$view.outerHTML||(new XMLSerializer().serializeToString(this.$view)); 
				master._active_holders_values[key][id] = value;
			}
			if(data)
				data[key] = value;
		};
	},
	_bind_active_content:function(key){ 
		return function(obj, common, active){
			var object = common._active_holders?common:common.masterUI;

			if (!object._active_holders[key]){
				var d = document.createElement("DIV");
				
				active = active || object.config.activeContent;
				var el = webix.ui(active[key], d);

				if (webix.env.isIE8){
					d.firstChild.setAttribute("onclick", "event.processed = true; event.srcElement.w_view = '"+el.config.id+"';");
				} else {
					d.firstChild.setAttribute("onclick", "event.processed = true; ");
				}

				el.getNode = object._get_active_node(el, key, object);

				el.attachEvent("onChange", object._set_new_active_value(key, object));
				
				object._active_references[key] = el;
				object._active_holders[key] = d.innerHTML;
				object._active_holders_item[key] = {};
				object._active_holders_values[key] = {};
				el.$activeEl = el.$view;
			}
			if (object.filter && obj[key] != object._active_holders_values[key] && !webix.isUndefined(obj[key])){
				var el = object._active_references[key];
				el.blockEvent();
				object._setActiveContentView(el,el.$activeEl);
				//in IE we can lost content of active element during parent repainting
				if (!el.$view.firstChild) el.refresh();
				el.setValue(obj[key]);
				el.refresh();
				el.unblockEvent();
				
				object._active_holders_values[key][obj.id] = obj[key];
				object._active_holders_item[key][obj.id] = el.$view.outerHTML||(new XMLSerializer().serializeToString(el.$view));
			}
			
			return object._active_holders_item[key][obj.id]||object._active_holders[key];
		};
	},
	_setActiveContentView: function(el,view){
		el.$setNode(view);
	}
};