var _ = require('underscore');
var util = require("util");
var events = require("events");
var log = require('./Log.js').log;

// SINGLETON ///////////////////////////////////////////////////////////////

exports.singleton = singleton;
function singleton(){
    if(typeof _knots === 'undefined'){
        _knots = new Knots();
    }
    return _knots;
}

// KNOTS ///////////////////////////////////////////////////////////////////

function Knots(){
    events.EventEmitter.call(this);
    this.initialize();
}

util.inherits(Knots,events.EventEmitter);

Knots.prototype.initialize = function(){
    log.debug('initialize Knots')
    this.metaModes = metaModes;
    this.knots = {}; // map of all knots

    //TODO: load redis settings from configuration file
    var redisIP = '173.246.41.66'; // webbynode
    //var redisIP= '5.157.248.122'; // hamachi mac pro
    var redisPort = 6379;
    var RedisBase = require('./RedisBase.js').RedisBase;
    this.redisBase = new RedisBase(redisIP,redisPort);
    this.redisBase.on('ready', _.bind(
        function(){
            this.emit('ready');
        },
        this
    ));
}

Knots.prototype.ready = function(callback){
    this.on('ready',callback);
    return this;
}

Knots.prototype.get = function(path,meta,metaMode){
    if(!(path in knots)){
        knots[path] = new Knot(path,this.redisBase,meta,metaMode);
    }
    return knots[path];
}

Knots.prototype.delete = function(path,recursive){
    //TODO: implement
    this.redisBase.delete(path,recursive);
}

Knots.prototype.getChildren = function(path,callback){
    this.redisBase.getChildren(path,callback);
}

// KNOT ///////////////////////////////////////////////////////////////////

exports.Knot = Knot;

function Knot(path,redis,meta,metaMode){
	events.EventEmitter.call(this);
	this.initialize(path,redis,meta,metaMode);
}

// params_mode:
// undefined: if params argument exists then use merge mode otherwise use metadata from database
// merge: database params will take precedence
// overwrite: given params argument will take precedence
// replace: database params will be deleted


metaModes = {MERGE:0,OVERWRITE:1,REPLACE:2};
//TODO: implement

util.inherits(Knot, events.EventEmitter);

Knot.prototype.initialize = function(path,redis,meta,metaMode){

    this.isReady = false;
    if(_.isUndefined(metaMode))
        metaMode = metaModes.MERGE;

	var triggerReady = _.after(2,_.bind(function(){
		this.isReady = true;
        this.emit('ready');
	},this));
	
	this.path = path;
	this.redis = redis;
	
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
	this.redis.get(path,function(res,err){
		if(!(_.isNull(res))) // value is null if not set yet
			this.value = res;
		else
			this.redis.set(this.path,this.value);
			
		triggerReady();
	},this);
	
	// check database for meta data and if found than override default params
	this.redis.getMeta(this.path,function(res,err){
		if(!_.isNull(res)){ // database meta with values available
			if(_.isString(res)){ //
				res = JSON.parse(res);
                switch(metaMode){
                    case metaModes.MERGE:
                        _.extend(this.meta,res);
                        break;
                    case metaModes.OVERWRITE:
                        _.extend(res,this.meta);
                        this.meta= res;
                        break;
                    case metaModes.REPLACE:
                        //console.log('metaModes.REPLACE');
                        // leave this.meta as is
                        break;
                }
                //console.log(JSON.stringify(this.meta));
                this.redis.setMeta(this.path,this.meta);
			}
		}
        this.redis.setMeta(this.path,this.meta); // set database meta to this meta
		triggerReady();
	},this);
	
	this.redis.subscribe(this.path,this);
}
	
Knot.prototype.deinitialize = function(){
	this.redis.unsubscribe(this.path,this);
}

Knot.prototype.message = function(path,value){
	//log.debug('message',value);
	if(!(_.isNull(value))){ // value is null if not set yet
		if(value != this.value){
			this.value = value;
			this.emit("change", this.value);
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
		this.emit("change", this.value);
		//log.debug('knot set',this.path,this.value);
		this.redis.set(this.path,this.value);
	}
},

Knot.prototype.get = function(){
	return this.value;
}

Knot.prototype.ready = function(callback){
    this.on('ready',callback);
    if(this.isReady){
        callback();
    }
    //TODO: remove from event
    return this;
}

Knot.prototype.change = function(callback){
    this.on('change',callback);
    //TODO: remove from event
    return this;
}