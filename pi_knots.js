var express = require('express')
  , routes = require('./routes')	
  , http = require('http')
  , path = require('path')
  , _ = require('underscore');

var Knot = require('./Knot.js').Knot;
var RedisBase = require('./RedisBase.js').RedisBase;
var RedisSocketServer = require('./RedisSocketServer.js').RedisSocketServer;
var redisBase;
var redisSocketServer;
var arduinoTest;

////////////////////////////////////////////////////////////////////////////
// start server
////////////////////////////////////////////////////////////////////////////

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

//app.get('/', routes.index);

app.get('/', function(req, res){
  res.send('server says hello :)');
});

////////////////////////////////////////////////////////////////////////////
// start server
////////////////////////////////////////////////////////////////////////////

function initializeKnotsModules(){
    //console.log('create redisSocketServer');
    //redisSocketServer = new RedisSocketServer(redisBase);
    //setupSocket();

    var MAC = require('./MAC');
    MAC.get(function(mac){

        var deviceId = mac;
        // set the device id of this  pi to its mac address

        // setup continuous pinging of server
        pingKnot = new Knot(deviceId+'/ping',knots.redisBase,{type:'string'});
        pingServer();
        setInterval(pingServer,10000);

        var isPi = require('os').platform() == "linux";
        // if running on linux then consider this to be a pi

        var portName = isPi ? '/dev/ttyACM0' : '/dev/tty.usbmodemfa131'
        //serial portname for arduino differs on pi and mac

        //arduinoTest = require('./ArduinoKnotTest.js');
        //arduinoTest.setup(deviceId+'/arduino_test',portName);

        arduinoTestBencode = require('./ArduinoKnotTestBencode.js');
        arduinoTestBencode.setup(deviceId+'/arduino_test_bencode',portName);

        //arduinoBencodeDictTest = require('./ArduinoBencodeDictTest.js');
        //arduinoBencodeDictTest.setup(deviceId+'/arduino_bencode_test','/dev/tty.usbmodemfd1241',redisBase);
    });
}

knots = require('./Knot').singleton();
knots.ready(initializeKnotsModules);

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  	console.log("Express server listening on port " + app.get('port'));
});

function pingServer(){
    pingKnot.set((new Date()).toISOString());
}

////////////////////////////////////////////////////////////////////////////
// socket.io (not in use at the moment)
////////////////////////////////////////////////////////////////////////////

var io;
var sockets;

function setupSocket(){

  	console.log("setting up socket.io");
  	io = require('socket.io').listen(server);

	io.configure(function () {
		io.set('transports', [
			'websocket'
		  , 'htmlfile'
		  , 'xhr-polling'
		  , 'jsonp-polling'
		  ]);
		io.disable('log');
	});

	sockets = io.of('/knots').on('connection', function (socket) {
		redisSocketServer.connect(socket);
	});
}

/*
var f2 = new Knot('test/f2',redisBase);
f2.on('change',function(data){
	console.log('f2',data);
});
f2.on('ready',function(){
	f2.set(77);
});
var f3 = new Knot('test/f3',redisBase);
var b1 = new Knot('test/b1',redisBase);
var s1 = new Knot('test/s1',redisBase);
var l1 = new Knot('test/b1/l1',redisBase);
	
var f1 = new Knot('a/b/f1',redis,{default:1,type:'int',min:1,max:10});
f1.on("change",function(f){
	console.log('f1,changed',f);
});

var log = _.bind(f1.set, f1);
_.delay(log, 1000, 6);
_.delay(log, 3000, 7);

console.log('f1====',f1);
var f2 = new Knot('a/b/f2',{default:2,min:1,max:10});
var f3 = new Knot('f3',{min:1,max:5});
var f4 = new Knot('a/b/c/f4',{min:1,max:5});

var select = new Knot('test/select',{default:0, values[0,1,2,3], keys['mark','dave','nadine','andy']})
*/

//f1.set(4);

/*
var path = "/hello/mark";
var index = path.lastIndexOf('/');
if(index != -1){
	var parent = path.substr(0,index);
	var child = path.substr(index+1);
}
*/

/*
redis.createField('a/b/f1',JSON.stringify({type:'float', min:0, max:1}));
redis.createField('a/b/b1',JSON.stringify({type:'boolean'}));
redis.createField('a/b/c/b2',JSON.stringify({type:'boolean'}));
redis.getFields('a/b',function(res){
	console.log(res);
});
*/

/*
redis.getChildren('',function(res,err){
	console.log('getChildren *:',res);
});

redis.getChildren('a',function(res,err){
	console.log('getChildren a:',res);
});

redis.getChildren('a/b',function(res,err){
	console.log('getChildren a/b:',res);
});
*/

/*
redis.getMeta('a/b/f1',function(res,err){
	console.log(res);
});

redis.getMeta('a/b/f3',function(res,err){
	console.log(res);
});
*/
