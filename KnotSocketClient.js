var _ = require('underscore');
var util = require('util');
var events = require('events');
var log = require('./Log.js').log;
var io_client = require('socket.io-client');
var socketAddress = 'http://localhost:3333';
var socketNamespace = 'knots';

// KNOT META MODES ////////////////////////////////////////////////////////

// params_mode:
// undefined: if params argument exists then use merge mode otherwise use metadata from database
// merge: database params will take precedence
// overwrite: given params argument will take precedence
// replace: database params will be deleted
var metaModes = {MERGE:0,OVERWRITE:1,REPLACE:2};

// KNOT ///////////////////////////////////////////////////////////////////

function Knot(path,socket,meta,metaMode){
    events.EventEmitter.call(this);
    this.initialize(path,socket,meta,metaMode);
}
util.inherits(Knot,events.EventEmitter);

Knot.prototype.metaModes = metaModes;

Knot.prototype.initialize = function(path,socket,meta,metaMode){

    //console.log('knot initialize',path);

    this.path = path;
    this.socket = socket;
    this.isReady = false;
    if(_.isUndefined(metaMode))
        this.metaMode = this.metaModes.MERGE;
    else
        this.metaMode = metaMode;

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

            switch(this.metaMode){
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
                    console.log('metaModes.REPLACE',this.path,this.meta.value);
                    // leave this.meta as is
                    if(_.has(this.meta,'value')){
                        this.set(this.meta.value);
                    }
                    break;
            }

        }

        this.setMeta(this.meta);
        this.isReady = true;
        this.emit('ready');

    },this);

    this.socket.emit('_/register_knot',this.path,this.metaReceived);

    this.serverValueChanged = _.bind(function(value){
        if(!(_.isNull(value))){ // value is null if not set yet
            if(value != this.value){
                this.value = value;
                this.emit('change', this.value);
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
    this.removeAllListeners();
    this.socket.emit('_/unregister_knot',path);
    delete this.path;
    delete this.socket;
    delete this.value;
    delete this.meta;
}

Knot.prototype.getMeta = function(){
    return this.meta;
}

Knot.prototype.setMeta = function(meta){
    if(_.isObject(meta)){
        _.extend(this.meta,meta);
        this.socket.emit('_/set_meta/'+this.path,this.meta);
        //this.redis.setMeta(this.path,this.meta);
    }
}

Knot.prototype.set = function(value){
    if(value != this.value){
        this.value = value;
        this.emit('change', this.value);
        this.socket.emit(this.path,this.value);
        //this.redis.set(this.path,this.value);
    }
}

Knot.prototype.setInt = function(value){
    var i = parseInt(value)
    this.set(i == null ? 0 : i);
}

Knot.prototype.get = function(){
    return this.value;
}

Knot.prototype.getInt = function(){
    var i = parseInt(this.get())
    return i == null ? 0 : i;
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
        this.once('ready',callback);
    }
    return this;
}

Knot.prototype.getChildren = function(callback){
    this.socket.emit('_/get_children',this.path,callback);
}

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
    log.debug('initialize Knots (Socket Client)');
    this.metaModes = metaModes;
    this.knots = {}; // map of all knots


    this.socket = io_client.connect( socketAddress + "/" + socketNamespace,{
        'transports' : ['websocket'],
        'connect timeout' : 5000,
        'try multiple transports' : true,
        'reconnect' : true,
        'reconnection delay' : 500,
        'max reconnection attempts' : 10000
    });

    this.socket.on('connect', _.bind(function(){
        this.emit('ready');

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

Knots.prototype.ready = function(callback){
    this.once('ready',callback);
    return this;
}

Knots.prototype.get = function(path,meta,metaMode){
//    if(!(path in this.knots)){
//        this.knots[path] = new Knot(path,this.redisBase,meta,metaMode);
//    }
    if(!(path in this.knots)){
        this.knots[path] = new Knot(path,this.socket,meta,metaMode);
    }
    return this.knots[path];
}

Knots.prototype.delete = function(path,recursive){
    //TODO implement socket version
}

Knots.prototype.getChildren = function(path,callback){
    //this.redisBase.getChildren(path,callback);
    this.socket.emit('_/get_children',path,callback);
}

