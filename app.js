
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

////////////////////////////////////////////////////////////////////////////
// GPIO
////////////////////////////////////////////////////////////////////////////

var gpio = require("gpio");

// available pins
var gpioPinIds = [14,15,18,23,24,25,8,7,0,1,4,17,21,22,10,9,11];
var gpios = [];

// setup all available gpios
for(var i=0; i<gpioPinIds.length; i++){
	var id = gpioPinIds[i];
	gpios[id] = gpio.export(id, {
		direction: 'out',	
		ready: function(){
			console.log("pin ready: " + id); 
		}
	});
}

app.get('/', function(req, res){
  res.send('RPi says hello :)');
});

// set gpio pin to input
app.get('/gpio/in/:pin', function(req,res){
	res.send('ok');
});

// set gpio pin to output
app.get('/gpio/out/:pin', function(req,res){
	res.send('ok');
});

// get value of gpio pint
app.get('/gpio/:pin', function(req, res){
  res.send('return value for pin ' + req.params.pin);
});

var booleanStrings = ["0","1"];
app.get('/gpio/:pin/:value', function(req, res){
	var pin = Number(req.params.pin);
	var val = req.params.value;
	if(gpioPinIds.indexOf(pin) == -1){
		res.send('Error: pin' + req.params.pin + ' does not exist.');
		return;
	} else if(booleanStrings.indexOf(val) == -1){
		res.send('Error: value has to be 1 or 0');
		return;
  	} else {
  		if(val == "1")
  			gpios[pin].set(1);
  		else
  			gpios[pin].set(0);
  		res.send('OK');
  	}
});

////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
