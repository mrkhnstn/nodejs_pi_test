var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var sp = null;
//var portName = '/dev/ttyACM0';
var portName = '/dev/tty.usbmodemfa131'

var devicePath;
var inKnots = {};
var outKnots = {};

var Knot = require('./Knot.js').Knot;

exports.setup = setup;
function setup(_devicePath,_serialPort, _redis){

	devicePath = _devicePath
	portName = _serialPort;

	// setup serial port
	sp = new SerialPort(portName, {
		parser: serialport.parsers.readline("\r\n") 
	});
	
	sp.on("data", function (data) {
		//console.log('serial',data);
		try{
			var a = data.split(':');
			if(a.length == 2){
				//console.log(a);
				var key = a[0];
				var val = a[1];
				if(key in outKnots){
					outKnots[key].set(val);
				}
			}
		} catch(e) {
		}
	});
	
	// setup knots for actuators
	inKnots.led = new Knot(devicePath+'/led',_redis,{type:'boolean',default:1});
	inKnots.led.on('change',function(data){
		sp.write('led:'+data+'\r');
	});
	
	inKnots.pwm = new Knot(devicePath+'/pwm',_redis,{type:'int',default:0,min:0,max:255});
	inKnots.pwm.on('change',function(data){
		sp.write('pwm:'+data+'\r');
	});
	
	inKnots.servo = new Knot(devicePath+'/servo',_redis,{type:'int',default:0,min:0,max:180});
	inKnots.servo.on('change',function(data){
		sp.write('servo:'+data+'\r');
	});
	
	// setup knots for sensors
	outKnots.analog = new Knot(devicePath+'/analog',_redis,{type:'int',default:0,min:0,max:1024});
	outKnots.button = new Knot(devicePath+'/button',_redis,{type:'boolean',default:0});

}