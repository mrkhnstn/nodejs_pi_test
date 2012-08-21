
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

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

/*
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
*/

var browserSockets = io.of('/browser').on('connection', function (socket) {
  
  	socket.on('gpio',function(data){
  		console.log("browser_gpio:"+data.toString());
  		piSockets.emit('gpio',data);
  	});
});

var piSockets = io.of('/pi').on('connection', function (socket) {

  	socket.emit('get_gpio',{}); // request gpio list

  	socket.on('gpio',function(data){
  		console.log("gpio:"+data.toString());
  		browserSockets.emit('gpio',data);
  	});

	/*
	socket.emit("gpio",getGPIO());
  
  	socket.on('gpio',function(data){
  		console.log("gpio:"+data.toString());
  	}
  		//sendGPIO();
  		var pin = Number(data.pin);
		console.log(gpioPinIds);
		console.log(pin);
  		if(gpioPinIds.indexOf(pin) != -1){
  			try {
  				var g = gpios[data.pin];
  				console.log(g);
  				if(g.direction != data.dir){
  					g.setDirection(data.dir);
  				}
  				if(g.direction == "out"){
  					g.set(data.val);
  				}
  				//io.sockets.emit("gpio",getGPIO());
  			} catch(e) {
  				console.error(e);
  				//io.sockets.emit("gpio",getGPIO());
  			}
  		}
  	});
	*/
	
});
