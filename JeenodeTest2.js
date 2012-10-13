/*
 - This test works in conjunction with knot_serial_router.ino and JeenodeTest2.ino (both in ~/Documents/Arduino)
 - The knot_serial_router should be loaded to the Jeelink (/dev/tty.usbserial-AE01BQR1). It has got the jeenode id 1
 - The JeenodeTest2.ino needs to be loaded onto all other Jeenodes. Individual node ids have to be set in the arduino
 code before uploading to the boards.
 - TODO: the remote Jeenode ids also have to be added to an array in this script
 */

var log = require('./Log.js').log;

var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var sp = null;
//var portName = '/dev/ttyACM0';
var portName = '/dev/tty.usbserial-AE01BQR1' //< Jeelink on OSX

var knots = require('./Knot.js').singleton();
var Bencode = require('./Bencode.js');
var _ = require('underscore');

var jeenodes = [];


exports.setup = setup;
function setup(_devicePath,_port) {

    devicePath = _devicePath;
    portName = _port;
    log.debug("Serialport: "+portName)

    // setup serial port
    sp = new SerialPort(portName, {
        parser:serialport.parsers.readline("\r\n"),
        baudrate: 57600
    });

    sp.on('open', function () {
        log.debug("Serialport open")
        setTimeout(postSerialSetup,3000); // required after establishing connection with the Arduino
    });

    sp.on('error', function () {
        log.error('serial error: '+ JSON.stringify(arguments));
    });

    sp.on('close', function () {
        log.error('serial close: '+ JSON.stringify(arguments));

        // clear everything
        // restart serial port and re-register Jeenodes
    });

    sp.on("data", function (data) {
        try {
            clearTimeout(ackTimeout);
            var o = Bencode.decode(data);
            jeenodes[currentJeenodeId].receiveData(o);
        } catch (e) {
            log.error('error receiving serial data');
        }
        updateNextJeenode();
    });

}

function postSerialSetup(){

    var nodeIds = [2,3,4,5,6];
    for(var i=0; i<nodeIds.length; i++)
        jeenodes.push(new Jeenode(nodeIds[i]));
    currentJeenodeId = jeenodes.length - 1;

    updateNextJeenode();
}

function updateNextJeenode(){
    currentJeenodeId++;
    if(currentJeenodeId == jeenodes.length)
        currentJeenodeId = 0;
    jeenodes[currentJeenodeId].update();
}

function ackFail(){
    log.error('ackFail');
    jeenodes[currentJeenodeId].updateFailed();
    updateNextJeenode();
}

function Jeenode(id){
    this.id = id;
    this.ledKnot = knots.get(devicePath + '/led' + this.id, {type:'boolean', default:1});
    this.counterKnot = knots.get(devicePath + '/counter' + this.id, {type:'string', default:'0'},knots.metaModes.REPLACE);

    this.update = function(){
        var i = parseInt(this.ledKnot.get());
        var bc = Bencode.encode({_D:this.id,led:i});
        //log.debug(this.id + " : update " + i);
        sp.write(bc);
        ackTimeout = setTimeout(ackFail,500);
    }

    this.updateFailed = function(){
        log.error(this.id + 'failed update')
    }

    this.receiveData = function(o){
        if('counter' in o){
            this.counterKnot.set(parseInt(o.counter));
            //log.debug(this.id + " : " + o.counter);
        } else {
            log.error(this.id + 'did not receive counter')
        }
    }
}
