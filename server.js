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

var sockets = io.of('/pi').on('connection', function (socket) {

	var id = 0;
	socket.on('id',function(data){
		id=data;
	});

	socket.on('disconnect',function(){
		pubClient.quit();
		subClient.quit();
	});

	///////////////////////////////////////////////////////////
	// redis related
	var pubClient = redis.createClient();
	var subClient = redis.createClient();

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
  	
  	socket.on('pub',function(data){
  		//TODO: type checking
  		for(var i=0; i<data.length; i++){
  			pubClient.set(data[i].key,data[i].value);
			pubClient.publish(data[i].key,data[i].value);
  		}
  	});

	///////////////////////////////////////////////////////////

	// request gpio list from pi
  	socket.emit('get_gpio',{}); 

	// route pi gpio object to browsers
  	socket.on('gpio',function(data){
  		console.log("gpio:"+data.toString());
  		browserSockets.emit('gpio',data);
  	});
  	
  	/*
  	socket.on('echo',function(data){
  		browserSockets.emit('echo',data);
  	});
	*/
});

