var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var sp = null;
//var portName = '/dev/ttyACM0';
var portName = '/dev/tty.usbmodemfa131'
var deviceId = null;
var arduinoId = null;

var subVars = ['led','pwm','servo'];
//var pubVars = [''];

var socket = null;
exports.setSocket = setSocket;
function setSocket(s){
	socket = s;
	
	// create list of variables that can be updated via the redis database
	var a = [];
	for(var i=0; i<subVars.length; i++)
		a.push(deviceId+'/'+arduinoId+'/'+subVars[i]);

	// get variables from db to initialise on arduino
	for(var i=0; i<a.length; i++){
		socket.emit('get',a[i]);
	}
	
	// subscribe to variables on db
	socket.emit('sub',a);
}

exports.setup = setup;
function setup(_deviceId,_arduinoId){
	deviceId = _deviceId;
	arduinoId = _arduinoId;
	
	//TODO: automatic detection of arduino
	sp = new SerialPort(portName, {
		parser: serialport.parsers.readline("\r\n") 
	});
	
	/*
	var ledState = 0;
	var pwm = 0;
	setInterval(function(){
		sp.write("led:"+ledState+'\r');
		sp.write("pwm:"+pwm+'\r');
		ledState = ledState == 0 ? 1 : 0;
		pwm += 10;
		if(pwm > 255)
			pwm = 0;
	},1000);
	*/
	
	sp.on("data", function (data) {
		
		console.log('serial',data);
		try{
			
			var a = data.split(':');
			
			if(a.length == 2){
				//console.log(a);
				var key = deviceId+'/'+arduinoId+'/'+a[0];
				var val = a[1];
				if(socket != null){
					//console.log("serial key/val",key,val);
					socket.emit('pub',[{
						key: key,
						value: val
					}]);
				}
			}
			
		} catch(e) {
		}
	});
}

exports.get = get;
function get (s,level,data){
	console.log('get');
	msg(s,level,data);
}

exports.msg = msg;
function msg (s,level,data){
	try {
		var key = s[level];
		var val = data.value;	
		console.log('ArduinoModuleTest','msg',key,':',val);
		sp.write(key+':'+val+'\r');
	} catch(e){
	
	}
}
