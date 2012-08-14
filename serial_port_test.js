var SerialPort = require("serialport").SerialPort;
var serialPort = new SerialPort("/dev/tty.usbserial-A900abDE");

console.log("serialPort created");

serialPort.on("data", function (data) {
    console.log(":"+data.toString());
});

setInterval(function(){
serialPort.write("Hello Mark!");
console.log("serialPort write");
},1000);