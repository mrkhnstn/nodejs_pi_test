var _ = require('underscore');
var util = require("util");
var events = require("events");

var log = require('./Log.js').log;
var redis = require("redis");

exports.RedisBase = RedisBase;

function RedisBase(host,port,pw){
	events.EventEmitter.call(this);
	this.connect(host,port,pw);
}

util.inherits(RedisBase, events.EventEmitter);

RedisBase.prototype.connect = function(host,port,pw){

	this.triggerReady = _.after(2,_.bind(function(){
		log.debug('RedisBase ready');
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
	log.debug('redis host: '+this.host);
	this.subObjects = {};
	

	
    this.setupPubClient();
	this.setupSubClient();

}

RedisBase.prototype.setupPubClient = function(){
    log.debug("SETTING UP REDIS PUB CLIENT");

    if(_.isObject(this.pubClient)){
        // pub client exists already
        this.pubClient.removeAllListeners();
        this.pubClient = null;
    }

    this.pubClient = redis.createClient(this.port,this.host);

    if(this.pw !== null){
        log.debug("authenticating pubClient");
        this.pubClient.auth(this.pw, function (err) {
            if (err) {
                log.error("pubClient authentication error",err);
            } else {
                log.debug("pubClient authenticated");
            }
        });
    }

    this.pubClient.on("error", _.bind(function (err) {
        log.error("pubClient error: "+err);
        //process.exit(1);
        setTimeout(_.bind(this.setupPubClient,this),1000); // try setting up new pub client
    },this));

    this.pubClient.on("ready", _.bind(function () {
        log.debug("pubClient ready");
        this.triggerReady();
    },this));
}

RedisBase.prototype.setupSubClient = function(){
    log.debug("SETTING UP REDIS SUB CLIENT");

    if(_.isObject(this.subClient)){
        // pub client exists already
        this.subClient.removeAllListeners();
        this.subClient = null;
    }

    this.subClient = redis.createClient(this.port,this.host);

    if(this.pw != null){
        log.debug("authenticating subClient");
        this.subClient.auth(this.pw, function (err) {
            if (err) {
                log.error("subClient authentication error: "+err);
            } else {
                log.debug("subClient authenticated");
            }
        });
    }

    this.subClient.on("error", _.bind(function (err) {
        log.error("subClient error: "+err);
        //process.exit(1); // currently exits on error
        setTimeout(_.bind(this.setupSubClient,this),1000); // try setting up new sub client after a short delay
    },this));

    this.subClient.on("ready", _.bind(function(){
        log.debug("subClient ready");

        // subscribe to existing knots if subclient is reconnecting
        for(var n in this.subObjects){
            this.subClient.subscribe(n);
        }

        // hook up subscribe message callback
        this.subClient.on("message", _.bind(this.receiveSubMessage,this));

        this.triggerReady();
    },this));
}

RedisBase.prototype.receiveSubMessage = function(path, message){
    if(_.has(this.subObjects,path)){
        var listeners = this.subObjects[path];
        for(var i=0; i<listeners.length; i++){
            listeners[i].message(path,message);
        }
    }

}

// TODO: simplify (nested listener / event system not necessary as knots are already being pooled in Knot.js, meaning for each subscription there will only be one knot)
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

RedisBase.prototype.get = function(path,callback){
	this.pubClient.get(path,function(err,res){
		callback(res,err);
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
		//log.debug('addChildren:',path,name,err,res);
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

RedisBase.prototype.getMeta = function(path,callback){

	var index = path.lastIndexOf('/');
	if(index != -1){
		parentPath = '?/'+path.substr(0,index);
		childName = path.substr(index+1);		
	} else {
		parentPath = '?';
		childName = path;
	}

    var meta = {};

    var multi = this.pubClient.multi();

	multi.hget(parentPath,childName,function(err,res){
        if(_.isString(res))
            res = JSON.parse(res);
        _.extend(meta,res);
	});

    multi.get(path,function(err,res){
        meta.value = res;
    })

    multi.exec(function(data){
       //console.log('multi.getMeta',meta);
       callback(meta);
    });
}

RedisBase.prototype.getChildren = function(path,callback){

    var self = this;

	this.pubClient.hgetall(path === '' ? '?' : '?/'+path,function(err,res){
		if(_.isObject(res)){
            // console.log('getChildren',res);
			// convert object values from strings to objects
			for(var n in res){
				res[n] = JSON.parse(res[n]);
			}

            // get values using multi redis call
            var multi = self.pubClient.multi();
            for(var n in res){
                multi.get(path + '/' + n, _.bind(function(err,data){
                    if(!_.isNull(data)){
                        res[this.name].value = data;
                    }
                },{name:n}))
            }

            multi.exec(function(err,replies){
                callback(res,err);
            });
		}
	});
}

RedisBase.prototype.delete = function(path,recursive){

    if(_.isUndefined(recursive))
        recursive = true;

    var self = this;
    var a = path.split('/');
    var name = a[a.length-1];
    a.splice(a.length-1,1);
    var parentPath = a.join('/');
    var metaPath = parentPath == '' ? '?' : '?/'+parentPath;

    if(recursive){
        this.pubClient.hgetall(path === '' ? '?' : '?/'+path,function(err,res){
            if(_.isObject(res)){
                for(var n in res){
                    var childPath = path+'/'+n;
                    self.delete(childPath,true);
                }
            }
        });
    }

    var multi = this.pubClient.multi();

    multi.hdel(metaPath,name,function(err,res){
        //console.log('hdel',metaPath,name,err,res);
    });

    // delete path key
    multi.del(path,function(err,res){
        //console.log('deleted',path,err,res);
    });

    multi.exec(function(data){
        log.debug('deleted '+path);
    });

    //TODO: handle listeners connected to pathes that get deleted by throwing deleted events to knots and further

}