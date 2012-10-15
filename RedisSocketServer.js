var _ = require('underscore');
var util = require("util");
var events = require("events");

exports.KnotsSocketServer = KnotsSocketServer;
function KnotsSocketServer(){
	events.EventEmitter.call(this);
	this.initialize();
}

util.inherits(KnotsSocketServer, events.EventEmitter);

KnotsSocketServer.prototype.initialize = function(redisBase){
    this.knots = require('./Knot').singleton();
}

KnotsSocketServer.prototype.connect = function(socket){
	
	var self = this;
    var listeners = {};
    var unregisterListener = function(o){
        socket.removeListener('path', o.setValue);
        socket.removeListener('_/set_meta/'+ o.knot.path, o.setMeta);
        o.knot.removeListener('change',o.change);
    }

    socket.on('_/register_knot',function(path,fn){

        var o = {};
        o.knot = self.knots.get(path);
        o.socket = socket;

        o.change = _.bind(function(value){
            this.socket.emit(this.knot.path,value);
        },o);

        o.setValue = _.bind(function(value){
            //console.log('socket.setValue',value);
            this.knot.set(value);
        },o);

        o.setMeta = _.bind(function(meta){
            //console.log('socket.setMeta',meta);
            this.knot.setMeta(meta);
        },o);

        o.knot.ready(fn);
        o.knot.change(o.change);

        socket.on(path, o.setValue);
        socket.on('_/set_meta/'+path, o.setMeta);

        listeners[path] = o;

    });

    socket.on('_/unregister_knot',function(path){
        if(path in listeners){
            unregisterListener(listeners.path);
            delete listeners.path;
        }
    });

	socket.on("disconnect",function(data){
        //console.log("socket disconnected");
        for(n in listeners){
            unregisterListener(listeners[n]);
        }
        listeners = null;
	});

	socket.on("_/get_children",function(path,fn){
		self.knots.getChildren(path,function(res,err){
            fn(res);
		});
	});
	
}