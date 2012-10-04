var _ = require('underscore');
var util = require("util");
var events = require("events");

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
    console.log('initialize Knots')
    events.EventEmitter.call(this);
    this.initialize();
}

util.inherits(Knots,events.EventEmitter);

Knots.prototype.initialize = function(){
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

Knots.prototype.get = function(path,options){
    return new Knot(path,this.redisBase,options);
}

// KNOT ///////////////////////////////////////////////////////////////////

exports.Knot = Knot;

function Knot(path,redis,params){
	events.EventEmitter.call(this);
	this.initialize(path,redis,params);
}

util.inherits(Knot, events.EventEmitter);

Knot.prototype.initialize = function(path,redis,params){

    this.isReady = false;

	var triggerReady = _.after(2,_.bind(function(){
		this.isReady = true;
        this.emit('ready');
	},this));
	
	this.path = path;
	this.redis = redis;
	
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
	this.redis.get(path,function(res,err){
		if(!(_.isNull(res))) // value is null if not set yet
			this.value = res;
		else
			this.redis.set(this.path,this.value);
			
		triggerReady();
	},this);
	
	// check database for meta data and if found than override default params
	this.redis.getMeta(this.path,function(res,err){
		if(_.isNull(res)){
			this.redis.setMeta(this.path,this.meta);
		} else {
			if(_.isString(res)){
				res = JSON.parse(res);
				_.extend(this.meta,res);
			}
		}
		triggerReady();
	},this);
	
	this.redis.subscribe(this.path,this);
}
	
Knot.prototype.deinitialize = function(){
	this.redis.unsubscribe(this.path,this);
}

Knot.prototype.message = function(path,value){
	console.log('message',value);
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
		console.log('knot set',this.path,this.value);
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