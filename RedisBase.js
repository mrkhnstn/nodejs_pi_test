var _ = require('underscore');
var util = require("util");
var events = require("events");

exports.RedisBase = RedisBase;

function RedisBase(host,port,pw){
	events.EventEmitter.call(this);
	this.connect(host,port,pw);
}

util.inherits(RedisBase, events.EventEmitter);

RedisBase.prototype.connect = function(host,port,pw){

	var triggerReady = _.after(2,_.bind(function(){
		console.log('RedisBase ready');
		this.emit('ready');
	},this));
	
	/*
	this.host = 'char.redistogo.com';
	this.port = 9072;
	this.pw = '7159a9637d7891c263bab6b63697c704';
	*/
	this.host = host || '127.0.0.1' ;
	this.port = port || 6379;
	this.pw = pw || null;
	console.log('redis host:',this.host);
	this.subObjects = {};
	
	var redis = require("redis");
	
	console.log("creating pubClient"); 
	this.pubClient = redis.createClient(this.port,this.host);
	
	if(this.pw !== null){
		console.log("authenticating pubClient"); 
		this.pubClient.auth(this.pw, function (err) {
			if (err) { 
				console.log("pubClient authentication error",err); 
			} else {
				console.log("pubClient authenticated"); 
			}
		});
	}
	
	this.pubClient.on("error", function (err) {
		console.log("pubClient error",err);
	});
	
	this.pubClient.on("ready", function () {
		console.log("pubClient ready");
		
		triggerReady();
	});
	
	console.log("creating subClient"); 
	this.subClient = redis.createClient(this.port,this.host);
	
	if(this.pw != null){
		console.log("authenticating subClient"); 
		this.subClient.auth(this.pw, function (err) {
			if (err) { 
				console.log("subClient authentication error",err); 
			} else {
				console.log("subClient authenticated"); 
			}
		});
	}
	
	this.subClient.on("error", function (err) {
		console.log("subClient error",err);
	});
	
	var self = this;
	
	this.subClient.on("ready", function(){
		console.log("subClient ready");
		self.subClient.on("message", function(path, message){
			
			if(_.has(self.subObjects,path)){
				var listeners = self.subObjects[path];
				
				for(var i=0; i<listeners.length; i++){
					listeners[i].message(path,message);
				}
			}
		});
		triggerReady();
	});
}

RedisBase.prototype.subscribe = function(path,subscriber){

	if(_.has(this.subObjects,path)){
		// listener exists
		this.subObjects[path].push(subscriber);
	} else {
		this.subObjects[path] = [subscriber];
		this.subClient.subscribe(path);
	}

}

RedisBase.prototype.unsubscribe = function(path,subscriber){

	if(_.has(this.subObjects,path)){
		//listener exists
		
		if(_.isUndefined(subscriber)){
			// delete all listeners linked to path
			delete this.subObjects[path];
			this.subClient.unsubscribe(path);
		} else {
			// just unsubscribe particular listener
			this.subObjects = _.without(this.subObjects,subscriber); //removes subscriber using === check
			
			// if no more listeners linked to path available then completely remove subscription
			if(this.subObjects.length == 0){
				delete this.subObjects[path];
				this.subClient.unsubscribe(path);
			}
		}
	}

}

RedisBase.prototype.get = function(path,fn,scope){
	this.pubClient.get(path,function(err,res){
		if(_.isFunction(fn)){
			if(_.isUndefined(scope)){
				fn(res,err);
			} else {
				fn.apply(scope,[res,err]);
			}
		}
	});
}

RedisBase.prototype.set = function(path,value){
	this.pubClient.set(path,value);
	this.pubClient.publish(path,value);
}

RedisBase.prototype.setMeta = function(path,meta){
	// create path segments
	var s = path.split('/');
	
	// update path tree
	// path tree starts with *
	var parentPath = '?';
	var childName = "";
	for(var i=0; i<s.length; i++){
		childName = s[i];
		//this.pubClient.sadd(parentPath,childName);
		if(i < s.length-1){ // add child flag to parent objects
			this.addChildren(parentPath,childName);
			parentPath += '/' + childName;
		} else {
			this.pubClient.hset(parentPath,childName,JSON.stringify(meta));
		}
	}
	
}

RedisBase.prototype.addChildren = function(path,name){
	var self = this;
	this.pubClient.hget(path,name,function(err,res){
		console.log('addChildren:',path,name,err,res);
		if(_.isNull(res) || _.isUndefined(res)){
			// meta data does not exist
			self.pubClient.hset(path,name,JSON.stringify({children:true}));
		} else {
			res = JSON.parse(res);
			res.children = true;
			self.pubClient.hset(path,name,JSON.stringify(res));	
		}
	});
}

RedisBase.prototype.getMeta = function(path,fn,scope){

	var index = path.lastIndexOf('/');
	if(index != -1){
		parentPath = '?/'+path.substr(0,index);
		childName = path.substr(index+1);		
	} else {
		parentPath = '?';
		childName = path;
	}
	
	this.pubClient.hget(parentPath,childName,function(err,res){
		if(_.isFunction(fn)){
			if(_.isUndefined(scope)){
				if(_.isString(res))
					res = JSON.parse(res);
				fn(res,err);
			} else {
				fn.apply(scope,[res,err]);
			}
		}
	});
}

RedisBase.prototype.getChildren = function(path,fn,scope){

	this.pubClient.hgetall(path === '' ? '?' : '?/'+path,function(err,res){
		if(_.isObject(res)){
			// convert object values from strings to objects
			for(var n in res){
				res[n] = JSON.parse(res[n]);
			}
		}
		if(_.isFunction(fn)){
			if(_.isUndefined(scope)){
				fn(res,err);
			} else {
				fn.apply(scope,[res,err]);
			}
		}
	});
	
	//var self = this;
	//this.pubClient.smembers('*/'+path,function(err,res){
	
	/*	console.log(res);
		var fieldMembers = res;
		self.pubClient.hgetall('?/'+path,function(err,res){
			// convert object values from strings to objects
			for(var n in res){
				res[n] = JSON.parse(res[n]);
			}
			// add missing fields as containers
			for(var i=0; i<fieldMembers.length; i++){
				var n = fieldMembers[i];
				if(!(n in res)){
					res[n] = {type:'container'};
				}
			}
			// trigger callback
			//if(typeof scope === 'undefined'){
			if(_.isFunction(fn)){
				if(_.isUndefined(scope)){
					fn([res]);
				} else {
					fn.apply(scope,[res]);
				}
			}
		});
	});
	*/
}