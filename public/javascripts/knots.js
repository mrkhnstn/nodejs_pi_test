
function Knot(path,socket,meta,metaMode){
	_.extend(this,Backbone.Events);
	this.initialize(path,socket,meta,metaMode);
}

Knot.prototype.metaModes = {MERGE:0,OVERWRITE:1,REPLACE:2};

Knot.prototype.initialize = function(path,socket,meta,metaMode){

    //console.log('knot initialize',path);

	this.path = path;
	this.socket = socket;
	this.isReady = false;
    if(_.isUndefined(metaMode))
        metaMode = this.metaModes.MERGE;

    // initialize meta object
    if(_.isObject(meta))
        this.meta = meta;
    else
        this.meta = {};

    // initialize knot value
    this.value = null;

    this.metaReceived = _.bind(function(meta){

        //console.log('metaReceived',this.path,meta);
        if(!_.isUndefined(meta) && _.isObject(meta)){

            // try to update knot value with value retrieved from server
            if(_.has(meta,'value'))
                this.value = meta.value;
            //TODO: reimplement meta modes

            // try to extend knot meta with meta retrieved from server
            _.extend(this.meta,meta);

        }
        this.isReady = true;
        this.trigger('ready');

    },this);
    this.socket.emit('_/register_knot',this.path,this.metaReceived);

    this.serverValueChanged = _.bind(function(value){
        if(!(_.isNull(value))){ // value is null if not set yet
            if(value != this.value){
                this.value = value;
                this.trigger('change', this.value);
            }
        }
    },this);
    this.socket.on(this.path,this.serverValueChanged);

}

// called on socket reconnection
// could also be called to refresh
Knot.prototype.reconnect = function(){
    this.socket.emit('_/register_knot',this.path,this.metaReceived);
}

Knot.prototype.destroy = function(){
	this.off();
    this.socket.emit('_/unregister_knot',path);
	delete this.path;
	delete this.socket;
	delete this.value;
	delete this.meta;
}

Knot.prototype.getMeta = function(){
	return this.meta;
}

Knot.prototype.setMeta = function(params){
	if(_.isObject(params)){
		_.extend(this.meta,params);
		this.socket.emit('_/set_meta/'+this.path,this.meta);
		//this.redis.setMeta(this.path,this.meta);
	}
}

Knot.prototype.set = function(value){
	if(value != this.value){
		this.value = value;
		this.trigger('change', this.value);
        this.socket.emit(this.path,this.value);
		//this.redis.set(this.path,this.value);
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
        this.meta.value = this.value;
        callback(this.meta);
    } else {
        this.on('ready',callback);
    }
    return this;
}

Knot.prototype.getChildren = function(callback){
    this.socket.emit('_/get_children',this.path,callback);
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
    //this.redis = new Redis(this.socket);
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
        this.knots[path] = new Knot(path,this.socket);
    }
    return this.knots[path];
}

Knots.prototype.ready = function(callback){
    this.on('ready',callback);
    return this;
}

Knots.prototype.getChildren = function(path,callback){
    this.socket.emit('_/get_children',path,callback);
}

