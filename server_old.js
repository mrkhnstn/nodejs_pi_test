////////////////////////////////////////////////////////////////////////////
// option
////////////////////////////////////////////////////////////////////////////

var redisHost = 'char.redistogo.com';
var redisPort = 9072;
var redisPw = '7159a9637d7891c263bab6b63697c704';

////////////////////////////////////////////////////////////////////////////
// start server
////////////////////////////////////////////////////////////////////////////

var express = require('express')
  , routes = require('./routes')	
  , http = require('http')
  , path = require('path')
  , redis = require("redis");

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3333);
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
	
	console.log("creating pubClient"); 
	pubClient = redis.createClient(redisPort,redisHost);
	
	console.log("authenticating pubClient"); 
	pubClient.auth(redisPw, function (err) {
	   	if (err) { 
	   		console.log("pubClient authentication error",err); 
		} else {
			console.log("pubClient authenticated"); 
		}
	});
	
	pubClient.on("error", function (err) {
		console.log("pubClient error",err);
	});
	
	pubClient.on("ready", function () {
		console.log("pubClient ready");
		setupSocket();
	});
	
});

////////////////////////////////////////////////////////////////////////////
// socket.io
////////////////////////////////////////////////////////////////////////////

var io;
var piMap = {}
var piList =[];
var sockets;
var pubClient;

var registerPi = function(deviceId,socketId){
	var a = {name:deviceId,socket:socketId};
	piMap[deviceId] = a;
	piList = [];
	for(n in piMap){
		piList.push(piMap[n]);
	}
	sockets.emit('pi_list',piList);
}

var unregisterPi = function(deviceId){
	delete piMap[deviceId];
	piList = []
	for(n in piMap){
		piList.push(n);
	}
	sockets.emit('pi_list',piList);
}

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

	sockets = io.of('/pi').on('connection', function (socket) {
	
		var id = null;
		var isPi = false;
		
		// let clients know their own socket id 
		// required for sending messages
		
		
		socket.on('get',function(data){
			pubClient.get(data,function(err,reply){
				socket.emit('get',{key:data,value:reply});
			});
		});
		
		socket.on('set',function(data){
			//console.log(data);
			pubClient.set(data.key,data.value);
		});
		
		socket.on('pub',function(data){
			for(var i=0; i<data.length; i++){
				pubClient.set(data[i].key,data[i].value);
				pubClient.publish(data[i].key,data[i].value);
			}
		});
		
		socket.on('register_pi',function(data){
			id = data;
			isPi = true;
			registerPi(id,socket.id);
		});
	
		socket.on('get_pi_list',function(data){
			socket.emit('pi_list',piList);
		});
	
		socket.on('disconnect',function(){
			if(isPi)
				unregisterPi(id,socket.id);
			subClient.quit();
		});
		
		socket.on('message',function(data){
			try {
				sockets.sockets[data.to].emit('message',data);
			} catch(e){
			}
		});
	
		///////////////////////////////////////////////////////////
		// redis related
		/////////////////////////////////////////////////////////
		
		console.log(socket.id,"creating subClient"); 
		var subClient = redis.createClient(redisPort,redisHost);
		
		console.log(socket.id,"subClient authenticating"); 
		subClient.auth(redisPw, function (err) {
			if (err) { 
				console.log(socket.id,"subClient authentication error",err); 
			} else {
				console.log(socket.id,"subClient authenticated"); 
			}
		});
	
		subClient.on("error", function (err) {
			console.log(socket.id,"subClient error",err);
		});
	
		subClient.on("ready", function () {
			socket.emit('socket_id',socket.id);
			console.log(socket.id,"subClient ready");
			
			socket.emit("ready",{});
			
			subClient.on("message", function (channel, message) {
				console.log('message: '+channel + " > " + message);
				socket.emit("msg",{key:channel,value:message});
			});
			
			socket.on('sub',function(data){
				for(var i=0; i<data.length; i++){
					console.log('subscribe: '+data[i]);
					subClient.subscribe(data[i]);
				}
			});
		
			socket.on('unsub',function(data){
				if(data == null){
					subClient.unsubscribe();
				} else {
					for(var i=0; i<data.length; i++){
						console.log('unsubscribe: '+data[i]);
						subClient.unsubscribe(data[i]);
					}
				}
			});
		});
	});
}


