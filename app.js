
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

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
			gpios[a].set(0);
			gpios[a].on("change",function(val){
				console.log("pin " + a + " changed to " + val);
				if(io)
					io.sockets.emit(getGPIO());
			});
		}
	}
	
	gpios[id] = gpio.export(id, {
		direction: 'out',	
		ready: f()
	});
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

io.set('transports', [
    'websocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
  ]);

function getGPIO(){
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

io.sockets.on('connection', function (socket) {

  	socket.emit('news', { hello: 'world' });

  	socket.on('my other event', function (data) {
    	console.log(data);
  	});

	//

	socket.emit("gpio",getGPIO());
  
  	socket.on('gpio',function(data){
  		console.log("gpio:"+data.toString());
  		//sendGPIO();
  		var pin = Number(data.pin);
		console.log(gpioPinIds);
		console.log(pin);
  		if(gpioPinIds.indexOf(pin) != -1){
  			try {
  				var g = gpios[data.pin];
  				console.log(g);
  				g.setDirection(data.dir);
  				g.set(data.val);
  				io.sockets.emit("gpio",getGPIO());
  			} catch(e) {
  				console.log(e);
  				io.sockets.emit("gpio",getGPIO());
  			}
  		}
  	});

});
