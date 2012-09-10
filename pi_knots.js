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

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  	console.log("Express server listening on port " + app.get('port'));
	redisBase = new RedisBase('5.157.248.122',6379);
	redisBase.on('ready',function(){
		console.log('create redisSocketServer');
		redisSocketServer = new RedisSocketServer(redisBase);
		//setupSocket();
	});
	
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
	
	//var portName = isPi ? '/dev/ttyACM0' : '/dev/tty.usbmodemfa131'
	var portName = '/dev/tty.usbmodemfa131';
	arduinoTest = require('./ArduinoKnotTest.js');
	arduinoTest.setup("arduino_test",portName,redisBase);
});

////////////////////////////////////////////////////////////////////////////
// socket.io
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



var f1 = new Knot('a/b/f1',redis,{default:1,type:'int',min:1,max:10});
f1.on("change",function(f){
	console.log('f1,changed',f);
});

var log = _.bind(f1.set, f1);
_.delay(log, 1000, 6);
_.delay(log, 3000, 7);
*/

/*
console.log('f1====',f1);
var f2 = new Knot('a/b/f2',{default:2,min:1,max:10});
var f3 = new Knot('f3',{min:1,max:5});
var f4 = new Knot('a/b/c/f4',{min:1,max:5});
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
