//var _ = require('underscore')._;
var SerialPort = require("serialport").SerialPort;

var serialPort = new SerialPort("/dev/ttyACM0");

console.log("serialPort created");

serialPort.on("data", function (data) {
    console.log(":"+data.toString());
});

setInterval(function(){
serialPort.write("5");
console.log("serialPort write");
},1000);
