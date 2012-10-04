/**
 * Created with JetBrains WebStorm.
 * User: markhauenstein
 * Date: 01/10/2012
 * Time: 16:41
 * To change this template use File | Settings | File Templates.
 */

var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var sp = null;
var Knot = require('./Knot.js').Knot;
var Bencode = require('./Bencode.js');

var devicePath;
var portName = '/dev/tty.usbmodemfa131'

var myObject = {
    counter : 0,
    number: 23,
    name : "mark"
}

var sendTime, receiveTime;

exports.setup = setup;
function setup(_devicePath,_serialPort, _redis){
    devicePath = _devicePath
    portName = _serialPort;



    var sendFunction = function(){
        sendTime = (new Date()).getMilliseconds();

        myObject.counter = (myObject.counter + 1) % 32000;
        myObject.name = myObject.name == "mark" ? "hannah" : "mark";
        sp.write(Bencode.encode(myObject));
    }

    // setup serial port
    sp = new SerialPort(portName, {
        parser: serialport.parsers.readline("\r\n"),
        baudrate: 57600
    });

    sp.on("data", function (data) {
        receiveTime = (new Date()).getMilliseconds();
        var elapsedTime = receiveTime - sendTime;
        console.log(elapsedTime+'ms : ',data);
        /*
        try{
            console.log(Bencode.decode(data));
        } catch(e) {
        }
        */

        //if(data.indexOf("complete") == 0)
            sendFunction();
            //setTimeout(sendFunction,1000);
    });

    setTimeout(sendFunction,3000);
}