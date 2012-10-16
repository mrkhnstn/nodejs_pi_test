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
var spName = '/dev/tty.usbserial-AH01A0BU'
var spIsOpen = false;
var spOpenedCount;

var maxBypassCycles = 1000;

var knots = require('./Knot.js').singleton();
var Bencode = require('./Bencode.js');
var _ = require('underscore');

var nodeIds = [5]; //< ids of jeenodes to test with
var jeenodes = [];
var jeenodesInitialized = false;


exports.setup = setup;
function setup(_knotsPath,_spName) {
    knotsPath = _knotsPath;
    spName = _spName;
    spOpenedCount = knots.get(knotsPath + '/serial_port_opened', {type:'number', value:0});
    spOpenedCount.ready(function(){
        spOpenedCount.set(0);
        setupSerialPort();
    });

}

function setupSerialPort(){

    log.debug('setup serial port '+ spName);

    // setup serial port
    sp = new SerialPort(spName, {
        parser:serialport.parsers.readline("\r\n"),
        baudrate: 57600
    });

    sp.on('open', function () {
        log.debug("serial port open");
        setTimeout(onSerialPortOpen,3000); // required after establishing connection with the Arduino
    });

    sp.on('error', function () {
        log.error('serial port error: '+ JSON.stringify(arguments));
    });

    sp.on('close', function () {
        spIsOpen = false;
        log.error('serial port closed: '+ JSON.stringify(arguments));
        sp.removeAllListeners();
        // try setting up new serial port in 3 seconds
        setTimeout(setupSerialPort,3000);
    });

    sp.on("data", function (data) {
        try {
            clearTimeout(ackTimeout);
            var o = Bencode.decode(data);
            jeenodes[currentJeenodeId].receiveData(o);
        } catch (e) {
            log.error('error receiving serial data: ' + data);
        }
        updateNextJeenode();
    });
}

function onSerialPortOpen(){
    spIsOpen = true;
    spOpenedCount.set(spOpenedCount.get() + 1);

    if(!jeenodesInitialized){ // prevent reinitialization
        //for(var i=0; i<nodeIds.length; i++)
        //    jeenodes.push(new Jeenode(nodeIds[i]));
        jeenodes.push(new BlinkPlugNode(5));
        currentJeenodeId = jeenodes.length - 1;
    }

    updateNextJeenode();
}

function updateNextJeenode(){
    if(spIsOpen){
        currentJeenodeId++;
        if(currentJeenodeId == jeenodes.length)
            currentJeenodeId = 0;
        jeenodes[currentJeenodeId].update();
    }
}

function ackFail(){
    jeenodes[currentJeenodeId].updateFailed();
    updateNextJeenode();
}

function Jeenode(id){
    this.initialize(id);
}

Jeenode.prototype.initialize = function(id){
    console.log('Jeenode initialize ' + id);

    this.id = id;
    this.failedCount = knots.get(knotsPath + '/failed_' + this.id, {type:'number', value:0});
    this.totalFailed = knots.get(knotsPath + '/total_failed_' + this.id, {type:'number', value:0});
    this.totalFailed.ready(_.bind(function(){
        this.set(0);
    },this.totalFailed));
    this.bypassCount = knots.get(knotsPath + '/bypass_' + this.id, {type:'number', value:0});
    this.ledKnot = knots.get(knotsPath + '/led_' + this.id, {type:'boolean', default:1});
    this.counterKnot = knots.get(knotsPath + '/counter_' + this.id, {type:'string', default:'0'},knots.metaModes.REPLACE);


    this.button1 = knots.get(knotsPath + '/button_1_' + this.id, {type:'number', value:0}).change(function(){console.log('button 1 pressed!')});
    this.button2 = knots.get(knotsPath + '/button_2_' + this.id, {type:'number', value:0}).change(function(){console.log('button 2 pressed!')});
    this.led1 = knots.get(knotsPath + '/led_1_' + this.id, {type:'boolean', value:0});
    this.led2 = knots.get(knotsPath + '/led_2_' + this.id, {type:'boolean', value:0});

    this.isOnline = knots.get(knotsPath + '/is_online_' + this.id, {type:'boolean', value:0});
    this.isOnline.set(0);
}

Jeenode.prototype.update = function(){
    if(this.bypassCount.get() < 1){
        var i = parseInt(this.ledKnot.get());

        var led1 = parseInt(this.led1.get());
        var led2 = parseInt(this.led2.get());

        var bc = Bencode.encode({_D:this.id,led:i,l1:led1,l2:led2});
        //log.debug(this.id + " : update " + i);
        sp.write(bc);
        ackTimeout = setTimeout(ackFail,250);
    } else {
        this.bypassCount.set(parseInt(this.bypassCount.get()) - 1);
        setTimeout(updateNextJeenode,5);
    }
}

Jeenode.prototype.updateFailed = function(){
    //log.error(this.id + ' failed update')
    this.failedCount.set(parseInt(this.failedCount.get()) + 1);
    this.totalFailed.set(parseInt(this.totalFailed.get()) + 1);
    this.isOnline.set(0);
    if(this.failedCount.get() > 1){
        if(this.failedCount.get() > maxBypassCycles)
            this.bypassCount.set(maxBypassCycles);
        else
            this.bypassCount.set(this.failedCount.get());
    }
}

Jeenode.prototype.receiveData = function(o){
    this.failedCount.set(0);
    this.isOnline.set(1);
    if('_S' in o){
        var srcId = o._S;
        if(srcId != this.id){
            log.error('src id != this.id : ' + srcId + " != " + this.id);
        }
    } else {
        log.error('no src id received for ' + this.id);
    }
    if('counter' in o){
        this.counterKnot.set(parseInt(o.counter));
        //log.debug(this.id + " : " + o.counter);
    } else {
        log.error(this.id + 'did not receive counter')
    }

    if('b1' in o){
        this.button1.set(o.b1);
    }

    if('b2' in o){
        this.button2.set(o.b2);
    }
}

var BlinkPlugNode = function(id){
    this.initialize(id);
}
util.inherits(Knot, events.EventEmitter);