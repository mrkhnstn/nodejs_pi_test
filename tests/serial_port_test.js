
var serialport = require("serialport");
var SerialPort = serialport.SerialPort;

//var sp = new SerialPort("/dev/ttyACM0", {
var sp = new SerialPort("/dev/tty.usbmodemfd121", {
	parser: serialport.parsers.readline("\r\n") 
});

sp.on("data", function (data) {
    console.log("serial: "+data.toString());
});

console.log("serialPort created");

setInterval(function(){
	//sp.write("Hello Mark!\r\n");
	//console.log("serialPort write");
},1000);
