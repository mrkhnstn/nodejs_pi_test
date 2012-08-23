////////////////////////////////////////////////////////////////////////////
// modules
////////////////////////////////////////////////////////////////////////////

console.error('hello',null);

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , io_client = require('socket.io-client')
  , MAC = require('./MAC');

////////////////////////////////////////////////////////////////////////////
// setup express
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
  res.send('RPi says hello :)');
});

////////////////////////////////////////////////////////////////////////////
// startup 
////////////////////////////////////////////////////////////////////////////
var deviceId = "00:00:00:00:00:00";
var socketAddress = 'http://5.157.248.122:3333';
var socketNamespace = 'pi';
var socketId = "";
var client_socket = null;

var serial = null;
var echo = null;
var shell = null;
var gpio = null;
var messageObjects = {};
var pubSubObjects = {};

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  	console.log("Express server listening on port " + app.get('port'));
 
 	// get device id
  	MAC.get(function(mac){
		deviceId = mac;
		console.log("Device ID",deviceId);
	
		setupSocket();
	});

});

/////////////////////////////////////////////////////////////
// Socket
/////////////////////////////////////////////////////////////

function setupSocket(){
	console.log('setup socket');

	client_socket = io_client.connect( socketAddress + "/" + socketNamespace,{
		'transports' : ['websocket'],
		'connect timeout' : 5000,
		'try multiple transports' : true,
		'reconnect' : true,
		'reconnection delay' : 500,
		'max reconnection attempts' : 10000
	}); 

	client_socket.on('connect',function(){
		console.log("socket connected");
		
		// setup serial if required
		if(serial == null){
			serial = require('./Serial');
			serial.setup();
			messageObjects['serial'] = serial;
		}
		
		if(echo == null){
			echo = require('./Echo');
			messageObjects['echo'] = echo;
		}
		
		if(shell == null){
			shell = require('./Shell');
			messageObjects['shell'] = shell;
		}
		
		if(gpio == null){
			gpio = require('./GPIO');
			console.log(gpio);
			gpio.setup(deviceId,client_socket);
			pubSubObjects['gpio'] = gpio;
		}

		// register socket with objects
	
		for(var n in messageObjects){
			messageObjects[n].setSocket(client_socket);
		}
		
		for(var n in pubSubObjects){
			pubSubObjects[n].setSocket(client_socket);
		}
	});
	
	client_socket.on('connect_failed',function(){
		console.error("socket connect_failed");
	});
	
	client_socket.on('error', function() {
		console.erro("socket reported a generic error");
	});
	
	client_socket.on('reconnecting',function(reconnectionDelay,reconnectionAttempts){
		console.log("reconnecting",reconnectionDelay,reconnectionAttempts);
	});
	
	client_socket.on('socket_id',function(data){
		socketId = data;
		client_socket.emit('register_pi',deviceId);
		
		
	});
	
	client_socket.on('disconnect',function(){
		console.log("socket disconnected");
		
		// unregister socket with objects
		
		for(var n in messageObjects){
			messageObjects[n].setSocket(null);
		}
		
		for(var n in pubSubObjects){
			pubSubObjects[n].setSocket(client_socket);
		}
	});
	
	client_socket.on('message',function(data){
		console.log('message',data);
		try{
			messageObjects[data.subject].receiveMessage(data);
		}catch(e){
			console.error('client_socket on message',e);
		}
	});
	
	client_socket.on('get', function(data){
		//console.log('get: ' + data.key + ' > ' + data.value);
		var s = data.key.split('/');
		if(s[0] === deviceId){
			try{
				pubSubObjects[s[1]].get(s,2,data);
			} catch(e){
			
			}
		}
		
		/*
		if(s[0] === deviceId){
			if(s[1] === 'gpio'){
				var pinId = Number(s[2]);
				if(s[3] === 'value'){
					if(data.value == null){
						client_socket.emit('pub',[{
							key:data.key,
							value:gpios[pinId].value
						}]);
					} else {
						//console.log("got cloud value: " + pinId + " > " + data.value);
						gpios[pinId].set(Number(data.value));
					}
				} else if(s[3] === 'direction'){
					if(data.value == null){
						client_socket.emit('pub',[{
							key:data.key,
							value:gpios[pinId].direction
						}]);
					} else {
						//console.log("got cloud dir: " + pinId + " > " + data.value);
						if(data.value != gpios[pinId].direction)
							gpios[pinId].setDirection(data.value);
					}
				}
			}
		}
		*/
	});
	
	client_socket.on('msg', function(data){
		console.log('msg: ' + data.key + ' > ' + data.value);
		var s = data.key.split('/');
		if(s[0] === deviceId){
			try{
				pubSubObjects[s[1]].msg(s,2,data);
			} catch(e){
			
			}
		}
		
		/*
		var s = data.key.split('/');
		if(s[0] === deviceId){
			if(s[1] === 'gpio'){
				var pinId = Number(s[2]);
				if(s[3] === 'value'){
					gpios[pinId].set(Number(data.value));
				} else if(s[3] === 'direction'){
					if(data.value != gpios[pinId].direction)
						gpios[pinId].setDirection(data.value);
				}
			}
		}
		*/
	});
	
	client_socket.on('echo',function(data){
		client_socket.emit('echo',data);
	});

}

