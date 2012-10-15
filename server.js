var express = require('express')
  , routes = require('./routes')	
  , http = require('http')
  , path = require('path')
  , _ = require('underscore');

var Knot = require('./Knot.js').Knot;
var KnotsSocketServer = require('./RedisSocketServer.js').KnotsSocketServer;
var knotsSocketServer;

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

app.get('/test',function(req,res){
	res.render('test');
});

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

/*
app.get('/', function(req, res){
  res.render('index',
  {
  	
  });
});
*/

app.post('/login', function(req, res){
	console.log('user:'+req.body.user);
	console.log('password:'+req.body.password);
   	res.send('login success');
});

knots = require('./Knot').singleton();
knots.ready(function(){
    knotsSocketServer = new KnotsSocketServer();
    //knots.get('test/number',{type:'number',value:50,min:0,max:100});
    //knots.get('test/string',{type:'string',value:'hello'});
    //knots.get('test/boolean',{type:'boolean',value:1});
    knots.get('test/labelTest',{type:'boolean', value:1, label:'this is a label'});
    var buttonKnot = knots.get('test/button',{type:'button',value:0});
    buttonKnot.change(function(){
        console.log('button triggered');
    })
    //knots.get('test/list',{type:'list',value:0,list:['mark','hannah','ken','mizuki']});

    setupExpressServer();
});

////////////////////////////////////////////////////////////////////////////
// express server
////////////////////////////////////////////////////////////////////////////

var server;

function setupExpressServer(){
    server = http.createServer(app);
    server.listen(app.get('port'), function(){
        console.log("Express server listening on port " + app.get('port'));
        setupSocket();
    });
}

////////////////////////////////////////////////////////////////////////////
// socket.io
////////////////////////////////////////////////////////////////////////////

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
		knotsSocketServer.connect(socket);
	});
}