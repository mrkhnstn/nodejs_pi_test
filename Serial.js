var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var sp = null;

var portName = '/dev/ttyACM0';
//ar portName = '/dev/tty.usbmodemfd121'
var serialResponse = null;

var socket = null;
exports.setSocket = setSocket;
function setSocket(s){
	socket = s;
}


exports.setup = setup;
function setup(){
	//TODO: automatic detection of arduino
	sp = new SerialPort(portName, {
		parser: serialport.parsers.readline("\r\n") 
	});
	
	sp.on("data", function (data) {
		console.log("serial: "+data.toString());
		if(serialResponse != null){
			serialResponse.body = data;
			if(socket != null){
				socket.emit('message',serialResponse);
			}
			serialResponse = null;
		}
	});
}

exports.receiveMessage = receiveMessage;
function receiveMessage(data){
	sp.write(data.body+"\r\n");
	
	// cache message for response
	var temp = data.to;
	data.to = data.from;
	data.from = temp;
	serialResponse = data;
}
