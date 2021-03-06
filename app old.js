
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , sys = require('util')
  , exec = require('child_process').exec;

////////////////////////////////////////////////////////////////////////////
// detect deviceID using ethernet MAC address
////////////////////////////////////////////////////////////////////////////
var deviceId = "myDevice";

var MAC = require('./MAC');
MAC.get(function(adr){
	deviceId = adr;
	console.log("Device ID",deviceId);
	// any other initialization should happen after here
});

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
// Serial
////////////////////////////////////////////////////////////////////////////

var serialport = require("serialport");
var SerialPort = serialport.SerialPort;

//TODO: automatic detection of arduino
var sp = new SerialPort("/dev/ttyACM0", {
//var sp = new SerialPort("/dev/tty.usbmodemfd121", {
	parser: serialport.parsers.readline("\r\n") 
});

var serialResponse = null;

sp.on("data", function (data) {
    console.log("serial: "+data.toString());
    if(serialResponse != null){
    	serialResponse.msg.content = data;
    	client_socket.emit('message',serialResponse);
    	serialResponse = null;
    }
});

////////////////////////////////////////////////////////////////////////////
// GPIO
////////////////////////////////////////////////////////////////////////////

var gpio = require("gpio");

// available pins
var gpioPinIds = [14,15,18,23,24,25,8,7,0,1,4,17,21,22,10,9,11];
//var gpioPinIds = [0];
var gpios = [];

// setup all available gpios
for(var i=0; i<gpioPinIds.length; i++){
	var id = gpioPinIds[i];
	
	var f = function(){
		var a = id;
		return function(){
			console.log("pin " + a + " ready");
			var g = gpios[a];
			
			
			g._set = g.set;
			g.set = function(val){
				this.desiredValue = val;
				this._set(val);
			}
			
			//g.set(0);
			g.desiredValue = g.value;
			
			g.on("change",function(val){
				console.log("pin " + a + " changed to " + val);
				try{
					io.sockets.emit('gpio',getGPIO());
					client_socket.emit('gpio',getGPIO());
					
					var valKey = deviceId+':gpio:'+a+':value'; //TODO: cache
					client_socket.emit('pub',[{key:valKey,value:g.value}]);

				} catch(e) {
					console.error(e);
				}
			});
			
			g.on("directionChange",function(dir){
				console.log("pin " + a + " changed direction to " + dir);
				
				try {
				
					io.sockets.emit('gpio',getGPIO());
					client_socket.emit('gpio',getGPIO());
					
					var dirKey = deviceId+':gpio:'+a+':direction'; //TODO: cache
					client_socket.emit('pub',[{key:dirKey,value:g.direction}]);
						
					if(dir === 'out'){
						if(g.value != g.desiredValue){
							g.set(g.desiredValue);
						}
					} else {
						g._get();
						g.desiredValue = gpios[a].value;
					}
				
				} catch(e) {
					console.error(e);
				}
				
			});
		}
	}
	
	gpios[id] = gpio.export(id, {
		direction: 'out',	
		ready: f()
	});
}

var getGPIO = function(){
	var a = [];
		for(var i=0; i<gpios.length; i++){
			var g = gpios[i];
			if(g)
				a.push({
					pin:g.headerNum,
					dir:g.direction,
					val:g.value
					});
		}
	return a;
}

var setGPIO = function(data){
	//console.log("gpio:"+data.toString());
	var pin = Number(data.pin);
	if(gpioPinIds.indexOf(pin) != -1){
		try {
			var g = gpios[data.pin];
			//console.log(g);
			if(g.direction != data.dir){
				g.setDirection(data.dir);
			}
			if(g.direction == "out"){
				g.set(data.val);
			}
		} catch(e) {
			console.error(e);
		}
	}
}

// output all gpios including directions and values
app.get('/gpio', function(req,res){
	var a = [];
	for(var i=0; i<gpios.length; i++){
		var g = gpios[i];
		if(g)
			a.push([g.headerNum,g.direction,g.value]);
	}
	res.send(a);
});

// get value of gpio pin
app.get('/gpio/:pin', function(req, res){
  //res.send('return value for pin ' + req.params.pin);
	var pin = Number(req.params.pin);
	if(gpioPinIds.indexOf(pin) == -1){
		res.send('Error: pin' + req.params.pin + ' does not exist.');
		return;
	} else {
		res.send(gpios[pin].value+'');
	}
});

// set value of gpio pin
app.get('/gpio/:pin/:value', function(req, res){
	var pin = Number(req.params.pin);

	if(gpioPinIds.indexOf(pin) == -1){
		res.send('Error: pin' + req.params.pin + ' does not exist.');
		return;
	} else {
		var g = gpios[pin];
		switch(req.params.value){
			case "1":
				g.set(1);
				res.json([g.headerNum,g.direction,g.value]);
				break;
			case "0":
				g.set(0);
				res.json([g.headerNum,g.direction,g.value]);
				break;
			case "in":
				g.setDirection('in');
				res.json([g.headerNum,g.direction,g.value]);
				break;
			case "out":
				g.setDirection('out');
				res.json([g.headerNum,g.direction,g.value]);
				break;
			default:
				res.send('Error: value has to be 1,0,in or out');
		}
  	}
});

////////////////////////////////////////////////////////////////////////////
//
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


// redundant?!
io.of('/browser').on('connection', function (socket) {

  	socket.emit('news', { hello: 'world' });

  	socket.on('my other event', function (data) {
    	console.log(data);
  	});

	/////////////////////////////////////////////////////////////
	// GPIO socket.io experiment

	socket.emit("gpio",getGPIO());
  
  	socket.on('gpio',setGPIO);  	
  	//	
  	/////////////////////////////////////////////////////////////

});

/////////////////////////////////////////////////////////////
// pi to server communication
/////////////////////////////////////////////////////////////

var io_client = require( 'socket.io-client' );


var socketAddress = 'http://5.157.248.122:3333';
var socketNamespace = 'pi';
var socketId = "";

var client_socket;

setupClientSocket();

function setupClientSocket(){
	console.log('setupClientSocket');

	client_socket = io_client.connect( socketAddress + "/" + socketNamespace,{
		'transports' : ['websocket'],
		'connect timeout' : 5000,
		'try multiple transports' : true,
		'reconnect' : true,
		'reconnection delay' : 500,
		'max reconnection attempts' : 10000
	}); 
	//note the pi namescape
	
	setTimeout(function(){
		if(!client_socket.socket.connected){
			setupClientSocket();
		}
	},5000);

	client_socket.on('connect',function(){
		console.log("client_socket connected!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
		client_socket.isConnected = true;
	});
	
	client_socket.on('connect_failed',function(){
		console.log("client_socket connect_failed");
	});
	
	client_socket.on('error', function() {
		console.log("client_socket reported a generic error");
	});
	
	client_socket.on('reconnecting',function(reconnectionDelay,reconnectionAttempts){
		console.log("reconnecting",reconnectionDelay,reconnectionAttempts);
	});
	
	
	client_socket.on('socket_id',function(data){
		socketId = data;
		client_socket.emit('register_pi',deviceId);
		
		for(var i=0; i<gpioPinIds.length; i++){
			var pinId = gpioPinIds[i];
			var g = gpios[pinId];
			var valKey = deviceId+':gpio:'+pinId+':value';
			var dirKey = deviceId+':gpio:'+pinId+':direction';
			client_socket.emit('get',valKey);
			client_socket.emit('get',dirKey);
			client_socket.emit('sub',[valKey,dirKey]);
		}
	});
	
	client_socket.on('disconnect',function(){
		console.log("client_socket disconnected");
		client_socket.isConnected = false;
	});
	
	client_socket.on('message',function(data){
		console.log('message',data);
		try{
			if(data.msg.cmd == 'echo'){
				data.to = data.from;
				data.from = socketId;
				client_socket.emit('message',data);
			} else if(data.msg.cmd == 'shell'){
				data.to = data.from;
				data.from = socketId;
				
				var child = exec(data.msg.shellCmd, function(error, stdout, stderr){
					console.log('stdout',stdout);
					console.log('stderr',stderr);
					console.log('error',error);
					
					data.msg.stdout = stdout;
					data.msg.stderr = stderr;
					
					if(error !== null){
						data.msg.error = error;
					}
					
					client_socket.emit('message',data);
				});
			} else if(data.msg.cmd == 'serial'){
				sp.write(data.msg.content+"\r\n");
				data.to = data.from;
				data.from = socketId;
				serialResponse = data;
			}
		}catch(e){
		}
		
		//sockets.socket(data.from).emit('message',data);
	});
	
	client_socket.on('get', function(data){
		//console.log('get: ' + data.key + ' > ' + data.value);
		var s = data.key.split(':');
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
	});
	
	client_socket.on('msg', function(data){
		console.log('msg: ' + data.key + ' > ' + data.value);
		var s = data.key.split(':');
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
	});
	
	client_socket.on('get_gpio', function (data) {
		client_socket.emit('gpio',getGPIO());
	});
	
	client_socket.on('gpio',setGPIO);
	
	client_socket.on('echo',function(data){
		client_socket.emit('echo',data);
	});

}

