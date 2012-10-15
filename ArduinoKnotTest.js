var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var sp = null;
//var portName = '/dev/ttyACM0';
var portName = '/dev/tty.usbmodemfa131'

var devicePath;
var inKnots = {};
var outKnots = {};

var knots = require('./Knot.js').singleton();

exports.setup = setup;
function setup(_devicePath, _serialPort) {

    knotsPath = _devicePath
    portName = _serialPort;

    // setup serial port
    sp = new SerialPort(portName, {
        parser:serialport.parsers.readline("\r\n")
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
        //console.log('serial',data);
        try {
            var a = data.split(':');
            if (a.length == 2) {
                //console.log(a);
                var key = a[0];
                var val = a[1];
                if (key in outKnots) {
                    outKnots[key].set(val);
                }
            }
        } catch (e) {
        }
    });

    function setupKnots() {

        // setup knots for actuators
        inKnots.led = knots.get(knotsPath + '/led', {type:'boolean', default:1});
        var ledKnotChanged = function () {
            console.log('ledKnotChanged',inKnots.led.get());
            sp.write('led:' + inKnots.led.get() + '\r');
        }
        inKnots.led
            .ready(ledKnotChanged)
            .change(ledKnotChanged);

        inKnots.pwm = knots.get(knotsPath + '/pwm', {type:'int', default:0, min:0, max:255});
        var pwmKnotChanged = function () {
            console.log('pwmKnotChanged');
            sp.write('pwm:' + inKnots.pwm.get() + '\r');
        };
        inKnots.pwm
            .ready(pwmKnotChanged)
            .change(pwmKnotChanged);

        inKnots.servo = knots.get(knotsPath + '/servo', {type:'int', default:0, min:0, max:180});
        var servoKnotChanged = function () {
            sp.write('servo:' + inKnots.servo.get() + '\r');
        };
        inKnots.servo
            .ready(servoKnotChanged)
            .change(servoKnotChanged);

        // setup knots for sensors
        outKnots.analog = knots.get(knotsPath + '/analog', {type:'int', default:0, min:0, max:1024});
        outKnots.button = knots.get(knotsPath + '/button', {type:'boolean', default:0});

    }
}