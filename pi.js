////////////////////////////////////////////////////////////////////////////
// modules
////////////////////////////////////////////////////////////////////////////

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

////////////////////////////////////////////////////////////////////////////
// fields
////////////////////////////////////////////////////////////////////////////
var deviceId = "00:00:00:00:00:00";
var socketAddress = 'http://5.157.248.122:3333';
//var socketAddress = 'http://mrkhnstn.pi.jit.su:80';
var socketNamespace = 'pi';
var socketId = "";
var socket = null;

var serial = null;
var echo = null;
var shell = null;
var gpio = null;
var arduino = null;

var messageObjects = {};
var pubSubObjects = {};

var isPi = require('os').platform() == "linux";
console.log('isPi',isPi);

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

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  	console.log("Express server listening on port " + app.get('port'));
 
 	// get device id
 	var MAC = require('./MAC');
  	MAC.get(function(mac){
		deviceId = mac;
		console.log("Device ID",deviceId);
	
		setupSocket();
	});

});

/////////////////////////////////////////////////////////////
// Socket
/////////////////////////////////////////////////////////////
0
var io_client = require('socket.io-client');

function setupSocket(){

	console.log('setup socket');

	socket = io_client.connect( socketAddress + "/" + socketNamespace,{
		'transports' : ['websocket'],
		'connect timeout' : 5000,
		'try multiple transports' : true,
		'reconnect' : true,
		'reconnection delay' : 500,
		'max reconnection attempts' : 10000
	}); 

	/////////////////////////////////////////////////////////////////

	socket.on('connect',function(){
		console.log("socket connected");
		
		socket.emit('register_pi',deviceId);
		
		/////////////////////////////////////////
		// setup modular objects on first connect
		/*
		if(serial == null){
			serial = require('./Serial');
			serial.setup();
			messageObjects['serial'] = serial;
		}
		*/
		
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
			gpio.setup(deviceId,socket); //TODO: take out socket here (initialization should work without socket)
			pubSubObjects['gpio'] = gpio;
		}
		
		if(arduino == null){
			var arduinoId = 'arduino';
			var subscribeToVars = ['led','pwm','servo'];
			var portName = isPi ? '/dev/ttyACM0' : '/dev/tty.usbmodemfa131'
			
			arduino = require('./Arduino');
			arduino.setup(deviceId,arduinoId,portName,subscribeToVars);
			pubSubObjects[arduinoId] = arduino;
		}
		/////////////////////////////////////////
		// register socket with objects
		for(var n in messageObjects){
			messageObjects[n].setSocket(socket);
		}
		
		for(var n in pubSubObjects){
			pubSubObjects[n].setSocket(socket);
		}
	});
	
	/////////////////////////////////////////////////////////////////
	
	socket.on('disconnect',function(){
		console.log("socket disconnected");
		
		// unregister socket with objects
		
		for(var n in messageObjects){
			messageObjects[n].setSocket(null);
		}
		
		for(var n in pubSubObjects){
			pubSubObjects[n].setSocket(socket);
		}
	});
	
	/*
	socket.on('connect_failed',function(){
		console.error("socket connect_failed");
	});
	
	socket.on('error', function() {
		console.erro("socket reported a generic error");
	});
	
	socket.on('reconnecting',function(reconnectionDelay,reconnectionAttempts){
		console.log("reconnecting",reconnectionDelay,reconnectionAttempts);
	});
	*/
	
	socket.on('socket_id',function(data){
		socketId = data;
	});
	
	/////////////////////////////////////////////////////////////////
	// message objects routing
	socket.on('message',function(data){
		console.log('message',data);
		try{
			messageObjects[data.subject].receiveMessage(data);
		}catch(e){
			console.error('socket on message',e);
		}
	});
	
	/////////////////////////////////////////////////////////////////
	// pub sub objects routing
	socket.on('get', function(data){
		//console.log('get: ' + data.key + ' > ' + data.value);
		var s = data.key.split('/');
		if(s[0] === deviceId){
			try{
				pubSubObjects[s[1]].get(s,2,data);
			} catch(e){
			
			}
		}
	});
	
	socket.on('msg', function(data){
		console.log('msg: ' + data.key + ' > ' + data.value);
		var s = data.key.split('/');
		if(s[0] === deviceId){
			try{
				pubSubObjects[s[1]].msg(s,2,data);
			} catch(e){
			
			}
		}
	});
	
	/////////////////////////////////////////////////////////////////
	
	// simple echo
	socket.on('echo',function(data){
		client_socket.emit('echo',data);
	});

}

