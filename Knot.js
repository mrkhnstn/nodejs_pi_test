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
    this.once('ready',callback);
    return this;
}

Knots.prototype.get = function(path,meta,metaMode){
    if(!(path in this.knots)){
        this.knots[path] = new Knot(path,this.redisBase,meta,metaMode);
    }
    return this.knots[path];
}

Knots.prototype.delete = function(path,recursive){
    //TODO: remove knot if exist
    //TODO: notify any other clients that a knot has been deleted
    this.redisBase.delete(path,recursive);
}

Knots.prototype.getChildren = function(path,callback){
    this.redisBase.getChildren(path,callback);
}

// KNOT META MODES ////////////////////////////////////////////////////////

// params_mode:
// undefined: if params argument exists then use merge mode otherwise use metadata from database
// merge: database params will take precedence
// overwrite: given params argument will take precedence
// replace: database params will be deleted
metaModes = {MERGE:0,OVERWRITE:1,REPLACE:2};

// KNOT ///////////////////////////////////////////////////////////////////

exports.Knot = Knot;

function Knot(path,redis,meta,metaMode){
	events.EventEmitter.call(this);
	this.initialize(path,redis,meta,metaMode);
}
util.inherits(Knot, events.EventEmitter);

Knot.prototype.initialize = function(path,redis,meta,metaMode){

    this.path = path;
    this.redis = redis;
    this.isReady = false;
    if(_.isUndefined(metaMode))
        metaMode = metaModes.MERGE;

    this.value = 0;
    if(_.isObject(meta))
        if(_.has(meta,'value')){
            this.value = meta.value;
        }

    this.meta = {};
    if(_.isObject(meta)){
        _.extend(this.meta,meta);
    }

	// check database for meta data and if found than override default params
	this.redis.getMeta(this.path, _.bind(function(meta,err){
        //console.log('Knot.gotMeta',meta);

		if(!_.isNull(meta)){ // database meta with values available

            //console.log('Knot.process',meta);

            switch(metaMode){
                case metaModes.MERGE:
                    _.extend(this.meta,meta);
                    //console.log('Knot.changedMeta.MERGE',this.meta);
                    break;
                case metaModes.OVERWRITE:
                    _.extend(meta,this.meta);
                    this.meta= meta;
                    //console.log('Knot.changedMeta.OVERWRITE',this.meta);
                    break;
                case metaModes.REPLACE:
                    //console.log('metaModes.REPLACE');
                    // leave this.meta as is
                    break;
            }

            if(_.has(meta,'value')){
                if(!_.isNull(meta.value))
                    this.value = meta.value;
            }

		}

        //console.log('Knot.initialize.setMeta',this.meta);
        this.redis.setMeta(this.path,this.meta); // set database meta to this meta

        this.redis.subscribe(this.path,this);

        this.isReady = true;
        this.meta.value = this.value;
        this.emit('ready',this.meta);
	},this));

}

Knot.prototype.deinitialize = function(){
    //TODO: see Knots.prototype.delete
	this.redis.unsubscribe(this.path,this);
}

Knot.prototype.message = function(path,value){
    //console.log('message',path,value);
	if(!(_.isNull(value))){ // value is null if not set yet
		if(value != this.value){
			this.value = value;
			this.emit('change', this.value);
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
    //console.log(this.path,this.value, value);
	if(value != this.value){
		this.value = value;
		this.emit('change', this.value);
		this.redis.set(this.path,this.value);
	}
}

Knot.prototype.setInt = function(value){
    var i = parseInt(value);
    this.set(i == null ? 0 : i);
}

Knot.prototype.get = function(){
	return this.value;
}

Knot.prototype.getInt = function(){
    var i = parseInt(this.get())
    return i == null ? 0 : i;
}

Knot.prototype.ready = function(callback){

    if(this.isReady){
        this.meta.value = this.value;
        callback(this.meta);
    } else {
        this.once('ready',callback);
    }
    return this;
}

Knot.prototype.change = function(callback){
    this.on('change',callback);
    return this;
}
