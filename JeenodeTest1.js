/*
- This test works in conjunction with knot_serial_router.ino and JeenodeTest1.ino (both in ~/Documents/Arduino)
- The knot_serial_router should be loaded to the Jeelink (/dev/tty.usbserial-AE01BQR1). It has got the jeenode id 1
- The JeenodeTest1.ino needs to be loaded onto another Jeenode with id 2 (set in the Arduino code)
- This test sends out a JSON object converted into bencode to a remote Jeenode. The remote Jeenode toggles an led on
each successful receive and then sends back an incremented counter to nodejs. test
- If a send instance from nodejs fails then it times out and tries to send again.
*/

var log = require('./Log.js').log;

var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var sp = null;
//var portName = '/dev/ttyACM0';
var portName = '/dev/tty.usbserial-AE01BQR1' //< Jeelink

var knots = require('./Knot.js').singleton();
var Bencode = require('./Bencode.js');
var _ = require('underscore');

var ledState = {led:1};
var sendCounter = 0;
var lastTime;

exports.setup = setup;
function setup(_devicePath) {

    knotsPath = _devicePath

    // setup serial port
    sp = new SerialPort(portName, {
        parser:serialport.parsers.readline("\r\n"),
        baudrate: 57600
    });

    sp.on('open', function () {
        setTimeout(toggleLed,3000); // arduino doesn't seem to accept everything
    });

    sp.on('error', function () {
        log.error('serial error: '+ arguments);
    });

    sp.on('close', function () {
        log.error('serial close: '+ arguments);
    });

    sp.on("data", function (data) {
        try {
            //console.log(data);
            var newTime = (new Date()).getTime();
            var o = Bencode.decode(data);
            if("counter" in o){
                clearTimeout(ackTimeout)
                var deltaTime = newTime - lastTime;
                lastTime = newTime;
                toggleLed();
                console.log(sendCounter + " - " + o.counter + " => " + deltaTime + "ms");
            }
        } catch (e) {
            log.error('error receiving serial data');
        }
    });

}

function toggleLed(){
    sendCounter++;
    ledState.led = ledState.led == 1 ? 0 : 1;
    lastTime = (new Date()).getTime();
    sp.write(Bencode.encode(ledState));
    ackTimeout = setTimeout(ackFail,3000)
}

function ackFail(){
    log.error('ackFail');
    toggleLed();
}
