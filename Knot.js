var _ = require('underscore');
var util = require("util");
var events = require("events");

exports.Knot = Knot;

function Knot(path,redis,params){
	events.EventEmitter.call(this);
	this.initialize(path,redis,params);
}

util.inherits(Knot, events.EventEmitter);

Knot.prototype.initialize = function(path,redis,params){
	
	var triggerReady = _.after(2,_.bind(function(){
		console.log('knot ready');
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