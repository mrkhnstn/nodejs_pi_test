var _ = require('underscore');
var util = require("util");
var events = require("events");

var RedisSocketClient = function(socket){
	this.socket = socket;
}

exports.RedisSocketServer = RedisSocketServer;
function RedisSocketServer(redisBase){
	events.EventEmitter.call(this);
	this.initialize(redisBase);
}

util.inherits(RedisSocketServer, events.EventEmitter);

RedisSocketServer.prototype.initialize = function(redisBase){
	this.redis = redisBase;
}

RedisSocketServer.prototype.connect = function(socket){
	
	var self = this;
	
	var listener = {
		message : function(path,message){
			console.log('msg',path,message);
			socket.emit('message',{path:path,message:message});
		}
	}
	
	socket.on("subscribe",function(data){
		self.redis.subscribe(data.path,listener);
	});
	

	socket.on("disconnect",function(data){
		//TODO: clean up subscribes
        console.log("socket disconnected")
	});

	
	socket.on("unsubscribe",function(data){
		self.redis.unsubscribe(data.path,listener);
	});
	
	socket.on("get",function(data){
		self.redis.get(data.path,function(res,err){
		 	//data.res = res;
		 	//data.err = err;
			data.value = res;
			socket.emit("get",data);
		});
	});
	
	socket.on("set",function(data){
		console.log(data);
		self.redis.set(data.path,data.value);
	});
	
	socket.on("setMeta",function(data){
		self.redis.setMeta(data.path,data.meta);
	});
	
	socket.on("getMeta",function(data){
			self.redis.getMeta(data.path,function(res,err){
			data.meta = res;
		 	//data.err = err;
			socket.emit("getMeta",data);
		});
	});
	
	socket.on("getChildren",function(data){
		self.redis.getChildren(data.path,function(res,err){
			data.children = res;
			socket.emit("getChildren",data);
		});
	});
	
	
}