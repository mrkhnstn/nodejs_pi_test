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

Redis.prototype.deleteKnot = function(path){
    //TODO: implement
}

//////////////////////////////////////////////////////////////////////
// KNOT
//////////////////////////////////////////////////////////////////////

// path: needs to start with a wrod

// params_mode:
// undefined: if params argument exists then use merge mode otherwise use metadata from database
// merge: database params will take precedence
// overwrite: given params argument will take precedence
// replace: database params will be deleted


//TODO: implement

function Knot(path,redis,meta,metaMode){
	_.extend(this,Backbone.Events);
	this.initialize(path,redis,meta,metaMode);
}

Knot.prototype.metaModes = {MERGE:0,OVERWRITE:1,REPLACE:2};

Knot.prototype.initialize = function(path,redis,meta,metaMode){

	this.path = path;
	this.redis = redis;
	this.isReady = false;
    if(_.isUndefined(metaMode))
        metaMode = this.metaModes.MERGE;

	var triggerReady = _.after(2,_.bind(function(){
		//console.log('knot ready');
		this.isReady = true;
		this.trigger('ready');
	},this));
	
	this.value = null;
	if(_.isObject(meta))
		if(_.has(meta,'default')){
			this.value = meta.default;
		}
	
	this.meta = {};
	if(_.isObject(meta)){
		_.extend(this.meta,meta);
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
        /*
		if(!_.isUndefined(data) && !_.isNull(data)){	
			_.extend(this.meta,data);
		} else {
			this.redis.setMeta(this.path,this.meta);
		}
		triggerReady();
        */

        switch(metaMode){
            case this.metaModes.MERGE:
                _.extend(this.meta,data);
                break;
            case this.metaModes.OVERWRITE:
                _.extend(data,this.meta);
                this.meta= data;
                break;
            case this.metaModes.REPLACE:
                //console.log('metaModes.REPLACE');
                // leave this.meta as is
                break;
        }
        this.redis.setMeta(this.path,this.meta); // set database meta to this meta
        triggerReady();
	},this);

	this.redis.subscribe(this.path,this);
	
}


// call on socket reconnection
Knot.prototype.reconnect = function(){
    console.log('reconnect '+this.path);
    this.redis.subscribe(this.path,this);
    this.redis.get(this.path,function(data){
        if(!_.isUndefined(data) && !_.isNull(data)){
            this.set(data);
        }
    },this);
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
}

Knot.prototype.set = function(value){
	if(value != this.value){
		this.value = value;
		this.trigger("change", this.value);
		this.redis.set(this.path,this.value);
	}
}

Knot.prototype.get = function(){
	return this.value;
}

Knot.prototype.change = function(callback){
    this.on('change',callback);
    return this;
}

Knot.prototype.ready = function(callback){
    if(this.isReady){
        callback();
    } else {
        this.on('ready',callback);
    }
    return this;
}

//////////////////////////////////////////////////////////////////////
// SIMPLIFIED KNOTS ACCESS
/*
 // example: (also see mknots.js)
 // to initialize
 var knots = Knots.singleton();

 // then to access a knot
 var knot = knots.get('path/a/b/c',optional meta parameters)
    .ready(callback)
    .change(callback);

 knot.set(value);
 knot.get(value);

 // to get children map at a path do
 knots.getChildren(path);
 knots.delete(path); //TODO
 knots.setMeta(); //TODO
 */
//////////////////////////////////////////////////////////////////////

Knots = function(){
    _.extend(this,Backbone.Events);
    this.initialize();
}

Knots.singleton = function(){
    if(!Knots._singleton){
        Knots._singleton = new Knots();
    }
    return Knots._singleton;
}

Knots.prototype.initialize = function(){
    this.socket = io.connect('http://'+window.location.host+'/knots');
    this.redis = new Redis(this.socket);
    this.knots = {}; // map of all knots
    this.metaModes = Knot.prototype.metaModes;

    this.socket.on('connect', _.bind(function(){
        console.log('socket connected');
        for(var n in this.knots){
            this.knots[n].reconnect();
        }
    },this));

    this.socket.on('disconnect',function(){
        console.log('socket disconnected');
    });

    this.socket.on('connect_failed',function(){
        console.log('socket connect_failed');
    });

    this.socket.on('error',function(){
        console.log('socket error');
    });

    this.socket.on('reconnect',function(){
        console.log('socket reconnect');
    });

    this.socket.on('reconnect_failed',function(){
        console.log('socket reconnect_failed');
    });

    this.socket.on('reconnecting',function(){
        console.log('socket reconnecting');
    });
}

Knots.prototype.get = function(path){
    if(!(path in this.knots)){
        this.knots[path] = new Knot(path,this.redis);
    }
    return this.knots[path];
}

Knots.prototype.ready = function(callback){
    this.on('ready',callback);
    return this;
}

