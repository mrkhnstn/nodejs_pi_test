var express = require('express')
  , routes = require('./routes')	
  , http = require('http')
  , path = require('path')
  , _ = require('underscore');
  
var Log = require('log')
, log = new Log(process.env.NODE_ENV == 'production' ? 'info' : 'debug');


var Knot = require('./Knot.js').Knot;
var RedisBase = require('./RedisBase.js').RedisBase;
//var RedisSocketServer = require('./RedisSocketServer.js').RedisSocketServer;
var redisBase;
//var redisSocketServer;
//var arduinoTest;

////////////////////////////////////////////////////////////////////////////
// start server
////////////////////////////////////////////////////////////////////////////

var webbynodeIP = '173.246.41.66';
var hamachiMacProIP = '5.157.248.122';
var redisPort = 6379;
redisBase = new RedisBase(webbynodeIP,redisPort);

redisBase.on('ready',function(){
	log.debug('redisBase ready');
	
	var listKnot = new Knot('test/select',redisBase,{
		default:0, 
		type:'list', 
		list: ['mark','dave','nadine','andy']
	});
	
	listKnot.on('change',_.bind(
		function(data){
			log.debug('list knot changed:',data);
		}, listKnot
	));
	
	listKnot.on('ready',function(){
		log.debug('list knot ready');
		/*
		listKnot.set(2);
		listKnot.set(3);
		listKnot.set(1);
		*/
	});
	
	/*
	var MAC = require('./MAC');
	MAC.get(function(mac){

		var deviceId = mac;
		// set the device id of this  pi to its mac address
		
		var isPi = require('os').platform() == "linux"; 
		// if running on linux then consider this to be a pi
		
		var portName = isPi ? '/dev/ttyACM0' : '/dev/tty.usbmodemfa131'
		//serial portname for arduino differs on pi and mac
		 
		arduinoTest = require('./ArduinoKnotTest.js');
		arduinoTest.setup(deviceId+'/arduino_test',portName,redisBase);
	});
	*/
});


/*
var f2 = new Knot('test/f2',redisBase);
f2.on('change',function(data){
	log.debug('f2',data);
});
f2.on('ready',function(){
	f2.set(77);
});
var f3 = new Knot('test/f3',redisBase);
var b1 = new Knot('test/b1',redisBase);
var s1 = new Knot('test/s1',redisBase);
var l1 = new Knot('test/b1/l1',redisBase);
	
var f1 = new Knot('a/b/f1',redis,{default:1,type:'int',min:1,max:10});
f1.on("change",function(f){
	log.debug('f1,changed',f);
});

var log = _.bind(f1.set, f1);
_.delay(log, 1000, 6);
_.delay(log, 3000, 7);

log.debug('f1====',f1);
var f2 = new Knot('a/b/f2',{default:2,min:1,max:10});
var f3 = new Knot('f3',{min:1,max:5});
var f4 = new Knot('a/b/c/f4',{min:1,max:5});


*/

//f1.set(4);

/*
var path = "/hello/mark";
var index = path.lastIndexOf('/');
if(index != -1){
	var parent = path.substr(0,index);
	var child = path.substr(index+1);
}
*/

/*
redis.createField('a/b/f1',JSON.stringify({type:'float', min:0, max:1}));
redis.createField('a/b/b1',JSON.stringify({type:'boolean'}));
redis.createField('a/b/c/b2',JSON.stringify({type:'boolean'}));
redis.getFields('a/b',function(res){
	log.debug(res);
});
*/

/*
redis.getChildren('',function(res,err){
	log.debug('getChildren *:',res);
});

redis.getChildren('a',function(res,err){
	log.debug('getChildren a:',res);
});

redis.getChildren('a/b',function(res,err){
	log.debug('getChildren a/b:',res);
});
*/

/*
redis.getMeta('a/b/f1',function(res,err){
	log.debug(res);
});

redis.getMeta('a/b/f3',function(res,err){
	log.debug(res);
});
*/
