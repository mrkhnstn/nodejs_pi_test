//////////////////////////////////////////////////////////////////////
// REDIS
//////////////////////////////////////////////////////////////////////

function Redis(socket){
				
	var self = this;
	this.socket = socket;
	
	this.getListeners = {};
	this.getMetaListeners = {};
	this.getChildrenListeners = {};
	this.subscribeListeners = {};
	
	socket.on('get',function(data){
		if(data.path in self.getListeners){
			var listener = self.getListeners[data.path];
			if(_.isUndefined(listener.scope)){
				listener.fn(data.value);
			} else {
				listener.fn.apply(listener.scope,[data.value]);
			}
			delete self.getListeners[data.path];
		}
	});
	
	socket.on('getMeta',function(data){
		if(data.path in self.getMetaListeners){
			var listener = self.getMetaListeners[data.path];
			if(_.isUndefined(listener.scope)){
				listener.fn(data.meta);
			} else {
				listener.fn.apply(listener.scope,[data.meta]);
			}
			delete self.getMetaListeners[data.path];
		}
	});
	
	socket.on('getChildren',function(data){
		if(data.path in self.getChildrenListeners){
			var listener = self.getChildrenListeners[data.path];
			if(_.isUndefined(listener.scope)){
				listener.fn(data.children);
			} else {
				listener.fn.apply(listener.scope,[data.children]);
			}
			delete self.getChildrenListeners[data.path];
		}
	});
	
	socket.on('message',function(data){
		if(data.path in self.subscribeListeners){
			var listener = self.subscribeListeners[data.path];
			listener.message(data.path,data.message);
			
		}
	});
}

Redis.prototype.set = function(path,value){
	this.socket.emit('set',{path:path,value:value});
}

Redis.prototype.get = function(path,fn,scope){
	this.getListeners[path] = {fn:fn,scope:scope};
	this.socket.emit('get',{path:path});
}

Redis.prototype.getMeta = function(path,fn,scope){
	this.getMetaListeners[path] = {fn:fn,scope:scope};
	this.socket.emit('getMeta',{path:path});
}

Redis.prototype.setMeta = function(path,meta){
	this.socket.emit('setMeta',{path:path,meta:meta});
}

Redis.prototype.getChildren = function(path,fn,scope){
	this.getChildrenListeners[path] = {fn:fn,scope:scope};
	this.socket.emit('getChildren',{path:path});
}

Redis.prototype.subscribe = function(path,listener){
	this.subscribeListeners[path] = listener;
	this.socket.emit('subscribe',{path:path});
}

Redis.prototype.unsubscribe = function(path,listener){
	this.socket.emit('unsubscribe',{path:path});
	delete this.subscribeListeners[path];
}

Redis.prototype.removeListeners = function(path){
	//TODO: implement
}

//////////////////////////////////////////////////////////////////////
// KNOT
//////////////////////////////////////////////////////////////////////

function Knot(path,redis,params){
	_.extend(this,Backbone.Events);
	this.initialize(path,redis,params);
}

Knot.prototype.initialize = function(path,redis,params){

	this.path = path;
	this.redis = redis;
	this.isReady = false;

	var triggerReady = _.after(2,_.bind(function(){
		//console.log('knot ready');
		this.isReady = true;
		this.trigger('ready');
	},this));
	
	this.value = null;
	if(_.isObject(params))
		if(_.has(params,'default')){
			this.value = params.default;
		}
	
	this.meta = {};
	if(_.isObject(params)){
		_.extend(this.meta,params);
	}
	
	// check database for value and if exist 
	this.redis.get(path,function(data){	
		if(!_.isUndefined(data) && !_.isNull(data)){	
			//console.log('has value',data);
			this.value = data;
		} else {
			//console.log('set value',this.path,this.value);
			this.redis.set(this.path,this.value);
		}
		triggerReady();
	},this);
	
	
	// check database for meta data and if found than override default params
	this.redis.getMeta(this.path,function(data){
		if(!_.isUndefined(data) && !_.isNull(data)){	
			_.extend(this.meta,data);
		} else {
			this.redis.setMeta(this.path,this.meta);
		}
		triggerReady();
	},this);
	
	
	this.redis.subscribe(this.path,this);
	
}

Knot.prototype.destroy = function(){
	this.off();
	this.redis.unsubscribe(this.path,this);
	
	//TODO: this.redis.removeListeners(this.path);
	delete this.path;
	delete this.redis;
	delete this.value;
	delete this.meta;
}

Knot.prototype.message = function(path,value){
	if(!(_.isNull(value))){ // value is null if not set yet
		if(value != this.value){
			this.value = value;
			this.trigger("change", this.value);
		}
	}
}

Knot.prototype.getMeta = function(){
	return this.meta;
}

Knot.prototype.setMeta = function(params){
	if(_.isObject(params)){
		_.extend(this.meta,params);
		this.redis.setMeta(this.path,this.meta);
	}
},

Knot.prototype.set = function(value){
	if(value != this.value){
		this.value = value;
		this.trigger("change", this.value);
		this.redis.set(this.path,this.value);
	}
},

Knot.prototype.get = function(){
	return this.value;
}

//////////////////////////////////////////////////////////////////////
// KNOT UI
//////////////////////////////////////////////////////////////////////

function KUI(path, parentPanel, redis){
	_.extend(this,Backbone.Events);
	this.initialize(path, parentPanel, redis);
}

KUI.prototype.initialize = function(path, parentPanel, redis){

	this.path = path;
	this.redis = redis;
	this.panel = $('<div></div>');
	parentPanel.append(this.panel);

	this.children = [];
	this.redis.getChildren(path,function(data){
		if(_.isObject(data)){
			for(n in data){
				this.addChild(n,data[n]);						
							
			}
		}
	},this);
}

KUI.prototype.destroy = function(){

	if(_.has(this,'children')){
		for(var i=0; i<this.children.length; i++){
			this.children[i].destroy();
		}
		this.children = [];
		delete this.children;
	}

	delete this.path;
	delete this.redis;
	if(_.has(this,'panel')){
		this.panel.remove();
	}
	delete this.panel;

}

KUI.prototype.addChild = function(child,meta){
	this.children.push(new KUIelement(this.path == '' ? child : this.path+'/'+child,meta,this.redis,this));
}

//////////////////////////////////////////////////////////////////////
// KNOT UI element
//////////////////////////////////////////////////////////////////////

function KUIelement(path,meta,redis,parent){
	
	this.path = path;
	this.meta = meta;
	this.redis = redis;
	this.parent = parent;
	this.panel = $('<div class="KUI_element_panel"></div>');
	this.parent.panel.append(this.panel);
	this.titleDiv = $('<div></div>').appendTo(this.panel);
	
	
		// children
	this.hasChildren = false;
	if(_.has(meta,'children'))
		if(meta.children == true)
			this.hasChildren = true;
	this.childrenOpen = false;
	
	if(this.hasChildren){
		this.childLink = $('<span>[+]</span>').appendTo(this.titleDiv);
		this.titleDiv.append('&nbsp;');
		this.childLink.click($.proxy(function(){
			if(this.childrenOpen){
				//try {
					this.children.destroy();
				//} catch(e){
					//console.log('error destroying children',e);
				//}
				this.childLink.html('[+]');
				this.childrenOpen = false;
			} else {
				this.children = new KUI(this.path,this.panel,this.redis);
				this.childLink.html('[-]');
				this.childrenOpen = true;
			}
		},this));
	}
	
	this.pathLabel = $('<span>'+this.path+'</span>').appendTo(this.titleDiv);
	
	// type related elements
	if(_.has(meta,'type')){
		switch(meta.type){
			case 'float':
			case 'int':
			case 'number':
				this.knot = new Knot(this.path,this.redis,this.meta);	
				this.knot.on('ready',function(){
					this.titleDiv.append(':');
					this.valueLabel = $('<span>'+this.knot.get()+'</span>').appendTo(this.titleDiv);
					this.slider = $('<div></div>').appendTo(this.panel);
					this.slider.slider({
						stop : _.bind(function(event,ui){
							this.knot.set(ui.value);
						},this),
						slide : _.bind(function(event,ui){
							this.valueLabel.html(ui.value);
						},this),
						change : _.bind(function(event,ui){
							this.valueLabel.html(ui.value);
						},this),
						value : this.knot.get()
					});
					
					if(_.has(meta,'min')){
						this.slider.slider({min:meta.min});
					}
					
					if(_.has(meta,'max')){
						this.slider.slider({max:meta.max});
					}
					
					if(_.has(meta,'step')){
						this.slider.slider({step:meta.step});
					}
					
					this.knot.on('change',function(data){
						this.slider.slider('value',data);
					},this);
					
				},this);
				break;
			case 'boolean':
				this.knot = new Knot(this.path,this.redis,this.meta);	
				this.knot.on('ready',function(){
					this.titleDiv.append(':');
					this.valueLabel = $('<span>'+this.knot.get()+'</span>').appendTo(this.titleDiv);
					this.checkbox = $('<input type="checkbox"></input>').appendTo(this.panel);
					
					// create reciprocal link between ui and knot
					this.checkbox.change(_.bind(function(){
						this.knot.set(this.checkbox.attr('checked') == 'checked' ? 1 : 0);
						this.valueLabel.html(this.knot.get());
					},this));
					
					this.knot.on('change',function(data){
						this.checkbox.attr('checked',data == '1');
						this.valueLabel.html(this.knot.get());
					},this);
					
				},this);
				break;
			case 'string':
				this.knot = new Knot(this.path,this.redis,this.meta);	
				this.knot.on('ready',function(){
					this.titleDiv.append(':');
					this.valueLabel = $('<span>'+this.knot.get()+'</span>').appendTo(this.titleDiv);
					this.textfield = $('<input type="text" maxLength="128" size="64" value="'+this.knot.get()+'"></input>').appendTo(this.panel);
					
					this.textfield.change(_.bind(function(){
						this.knot.set(this.textfield.attr('value'));
						this.valueLabel.html(this.knot.get());
					},this));
					
					this.knot.on('change',function(data){
						this.textfield.attr('value',this.knot.get());
						this.valueLabel.html(this.knot.get());
					},this);
				},this);
				break;
			case 'select':
				if(_.has(meta,'list')){
					this.knot = new Knot(this.path,this.redis,this.meta);	
					this.knot.on('ready',function(){
						this.titleDiv.append(':');
						this.valueLabel = $('<span>'+this.knot.get()+'</span>').appendTo(this.titleDiv);
						this.select = $('<select></select>').appendTo(this.panel);
						for(var i=0; i<meta.list.length; i++){
							var keyVal = meta.list[i];
							this.select.append('<option value="'+keyVal[0]+'">'+keyVal[1]+'</option>');
						}
						
						this.select.change(_.bind(function(){
							this.knot.set(this.select.val());
							this.valueLabel.html(this.knot.get());
						},this));
						
						this.knot.on('change',function(data){
							this.select.val(this.knot.get());
							this.valueLabel.html(this.knot.get());
						},this);
					},this);
				}
				break;
		}
	}
	

}

KUIelement.prototype.destroy = function(){
	if(_.has(this,'children')){
		this.children.destroy();
	}
	
	if(_.has(this,'childLink')){
		this.childLink.unbind();
		this.childLink.remove();
		delete this.childLink;
		delete this.hasChildren;
		delete this.childrenOpen;
	}
	
	if(_.has(this,'knot')){
		this.knot.destroy();
		delete this.knot;
	}
	
	if(_.has(this,'slider')){
		this.slider.unbind();
		delete this.slider;
	}
	
	if(_.has(this,'checkbox')){
		this.checkbox.unbind();
		delete this.checkbox;
	}
	
	delete this.path;
	delete this.meta;
	delete this.redis;
	delete this.parent;
	delete this.titleDiv;
	delete this.pathLabel;
	
	this.panel.remove();
	delete this.panel;
	
}