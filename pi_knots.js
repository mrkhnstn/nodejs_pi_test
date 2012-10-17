var express = require('express')
    , routes = require('./routes')
    , http = require('http')
    , path = require('path')
    , _ = require('underscore')
    ,log = require('./Log.js').log;


////////////////////////////////////////////////////////////////////////////
// start express server
////////////////////////////////////////////////////////////////////////////

var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

app.get('/', function(req, res){
    res.send('server says hello :)');
});

var server = http.createServer(app);
server.listen(app.get('port'), function(){
    log.debug("Express server listening on port " + app.get('port'));
});

////////////////////////////////////////////////////////////////////////////
// start server
////////////////////////////////////////////////////////////////////////////

function initializeKnotsModules(){

    var MAC = require('./MAC');
    MAC.get(function(mac){

        var deviceId = mac;
        // set the device id of this  pi to its mac address

        // setup continuous pinging of server
        pingKnot = knots.get(deviceId+'/ping',{type:'string'});
        pingKnot.ready(function(){
            pingServer();
            setInterval(pingServer,10000);
        })

        startNumKnot = knots.get(deviceId+'/start_num',{type:'number',default:0});
        startNumKnot.ready(function(){
            startNumKnot.set(parseInt(startNumKnot.get())+1);
        });

        startKnot = knots.get(deviceId+'/started',{type:'string'});
        startKnot.ready(function(){
            startKnot.set((new Date()).toISOString());
        });

        var isPi = require('os').platform() == "linux";
        // if running on linux then consider this to be a pi

        var portName = isPi ? '/dev/ttyACM0' : '/dev/tty.usbmodemfd121'
        //serial portname for arduino differs on pi and mac

        //arduinoTest = require('./ArduinoKnotTest.js');
        //arduinoTest.setup(deviceId+'/arduino_test',portName);

        //arduinoTestBencode = require('./ArduinoKnotTestBencode.js');
        //arduinoTestBencode.setup(deviceId+'/arduino_test_bencode',portName);

        //jeenodeTest1 = require('./JeenodeTest1.js');
        //jeenodeTest1.setup(deviceId+'/jeenode_test_1');

        //jeenodeTest2 = require('./JeenodeTest2.js');
        //jeenodeTest2.setup(deviceId+'/jeenode_test_2',isPi ? '/dev/ttyUSB0' : '/dev/tty.usbserial-AE01BQR1');

        //jeenodeTest3 = require('./JeenodeTest3.js');
        //jeenodeTest3.setup(deviceId+'/jeenode_test_3',isPi ? '/dev/ttyUSB0' : '/dev/tty.usbserial-AE01BQR1');

        jeenodeTest4 = require('./JeenodeTest4.js');
        jeenodeTest4.setup(deviceId+'/jeenode_test_4_2',isPi ? '/dev/ttyUSB0' : '/dev/tty.usbserial-AE01BQR1'); //< currently setup to run from one of the USB BUB on OS X

        //arduinoBencodeDictTest = require('./ArduinoBencodeDictTest.js');
        //arduinoBencodeDictTest.setup(deviceId+'/arduino_bencode_test','/dev/tty.usbmodemfd1241',redisBase);
    });
}

knots = require('./KnotSocketClient.js').singleton();
knots.ready(initializeKnotsModules);

function pingServer(){
    pingKnot.set((new Date()).toISOString());
}
