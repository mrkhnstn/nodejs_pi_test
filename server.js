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
});

////////////////////////////////////////////////////////////////////////////
// socket.io
////////////////////////////////////////////////////////////////////////////

var io = require('socket.io').listen(server);

io.configure(function () {
	io.set('transports', [
		'websocket'
	  , 'htmlfile'
	  , 'xhr-polling'
	  , 'jsonp-polling'
	  ]);
	io.disable('log');
});

var piMap = {}
var piList =[];

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

var sockets = io.of('/pi').on('connection', function (socket) {

	var id = null;
	var isPi = false;
	
	// let clients know their own socket id 
	// required for sending messages
	socket.emit('socket_id',socket.id);
	
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
		pubClient.quit();
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
	var pubClient = redis.createClient(redisPort,redisHost);
	var subClient = redis.createClient(redisPort,redisHost);

	pubClient.auth(redisPw, function (err) {
	   	if (err) { 
	   		console.error("ERROR connecting to db",err); 
		}
	});
	
	subClient.auth(redisPw, function (err) {
	   	if (err) { 
	   		console.error("ERROR connecting to db",err); 
		}
	});

	pubClient.on("error", function (err) {
		console.error("Error " + err);
	});

	subClient.on("error", function (err) {
		console.error("Error " + err);
	});

	//subClient.subscribe("myDate");

	subClient.on("message", function (channel, message) {
		console.log('message: '+channel + " > " + message);
		socket.emit("msg",{key:channel,value:message});
	});

	socket.on('get',function(data){
  		pubClient.get(data,function(err,reply){
  			socket.emit('get',{key:data,value:reply});
  		});
  	});
  	
  	socket.on('set',function(data){
  		console.log(data);
  		pubClient.set(data.key,data.value);
  	});
  	
  	socket.on('sub',function(data){
  		//TODO: type checking
  		for(var i=0; i<data.length; i++){
  			console.log('subscribe: '+data[i]);
  			subClient.subscribe(data[i]);
  		}
  	});
  	
  	socket.on('unsub',function(data){
  		if(data == null){
  			ubClient.unsubscribe();
  		} else {
			//TODO: type checking
			for(var i=0; i<data.length; i++){
				console.log('unsubscribe: '+data[i]);
				subClient.unsubscribe(data[i]);
			}
  		}
  	});
  	
  	socket.on('pub',function(data){
  		//TODO: type checking
  		for(var i=0; i<data.length; i++){
  			pubClient.set(data[i].key,data[i].value);
			pubClient.publish(data[i].key,data[i].value);
  		}
  	});

});

