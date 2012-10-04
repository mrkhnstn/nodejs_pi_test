var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var sp = null;
//var portName = '/dev/ttyACM0';
var portName = '/dev/tty.usbmodemfa131'

var devicePath;
var inKnots = {};
var outKnots = {};
var lastUpdateKnot;

var knots = require('./Knot.js').singleton();
var Bencode = require('./Bencode.js');
var _ = require('underscore');

exports.setup = setup;
function setup(_devicePath, _serialPort) {

    devicePath = _devicePath
    portName = _serialPort;

    // setup serial port
    sp = new SerialPort(portName, {
        parser:serialport.parsers.readline("\r\n"),
        baudrate: 57600
    });

    sp.on('open', function () {
        setTimeout(setupKnots,1000); // arduino doesn't seem to accept everything
    });

    sp.on('error', function () {
        console.log('serial error', arguments);
    });

    sp.on('close', function () {
        console.log('serial close', arguments);
    });

    sp.on("data", function (data) {
        try {
            var o = Bencode.decode(data);
            for(var n in o){
                if(n in outKnots){
                    outKnots[n].set(o[n]);
                }
            }
            lastUpdateKnot.set((new Date()).toISOString());
        } catch (e) {
            console.log('error parsing bencode data');
        }
    });

    function setupKnots() {

        var intToArduino = function(){
            var o = {};
            o[this.name] = parseInt(this.knot.get());
            sp.write(Bencode.encode(o));
        }

        // setup knots for actuators
        inKnots.led = knots.get(devicePath + '/led', {type:'boolean', default:1});
        var ledKnotChanged = _.bind(intToArduino,{name:'led',knot:inKnots.led});
        inKnots.led
            .ready(ledKnotChanged)
            .change(ledKnotChanged);

        inKnots.pwm = knots.get(devicePath + '/pwm', {type:'int', default:0, min:0, max:255});
        var pwmKnotChanged = _.bind(intToArduino,{name:'pwm',knot:inKnots.pwm});
        inKnots.pwm
            .ready(pwmKnotChanged)
            .change(pwmKnotChanged);

        inKnots.servo = knots.get(devicePath + '/servo', {type:'int', default:0, min:0, max:180});
        var servoKnotChanged = _.bind(intToArduino,{name:'servo',knot:inKnots.servo});
        inKnots.servo
            .ready(servoKnotChanged)
            .change(servoKnotChanged);

        // setup knots for sensors
        outKnots.analog = knots.get(devicePath + '/analog', {type:'int', default:0, min:0, max:1024});
        outKnots.button = knots.get(devicePath + '/button', {type:'boolean', default:0});

        lastUpdateKnot = knots.get(devicePath + '/last_update', {type:'string'});
    }
}