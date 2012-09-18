var express = require('express')
  , routes = require('./routes')	
  , http = require('http')
  , path = require('path')
  , _ = require('underscore');

/*
var Knot = require('./Knot.js').Knot;
var RedisBase = require('./RedisBase.js').RedisBase;
var RedisSocketServer = require('./RedisSocketServer.js').RedisSocketServer;

var redisBase;
var redisSocketServer;
*/
////////////////////////////////////////////////////////////////////////////
// start server
////////////////////////////////////////////////////////////////////////////

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

app.get('/', routes.index);

/*
app.get('/knots',function(req,res){
	res.render('knots',{path:''});
});

app.get('/knots/*',function(req,res){
	if(req.params.length > 0){
		res.render('knots',{path:req.params[0]});
	} else {
		res.render('knots',{path:''});
	}
});
*/

/*
app.get('/', function(req, res){
  res.render('index',
  {
  	
  });
});
*/

/*
app.post('/login', function(req, res){
	console.log('user:'+req.body.user);
	console.log('password:'+req.body.password);
   	res.send('login success');
});
*/

////////////////////////////////////////////////////////////////////////////
// start server
////////////////////////////////////////////////////////////////////////////

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  	console.log("Express server listening on port " + app.get('port'));
  	/*
	redisBase = new RedisBase();
	redisBase.on('ready',function(){
		console.log('create redisSocketServer');
		redisSocketServer = new RedisSocketServer(redisBase);
		setupSocket();
	});
	
	var f1 = new Knot('a/b/f1',redisBase,{default:1,type:'int',min:1,max:10});
	f1.on("change",function(f){
		console.log('f1,changed',f);
	});
	
	var f1_2 = new Knot('a/b/f1',redisBase);
	f1_2.on("change",function(f){
		console.log('f1_2,changed',f);
	});
	*/
});

////////////////////////////////////////////////////////////////////////////
// socket.io
////////////////////////////////////////////////////////////////////////////

/*
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

*/


