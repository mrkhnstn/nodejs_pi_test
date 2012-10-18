/*
 TODO update this description
 - This test works in conjunction with knot_serial_router.ino and JeenodeTest2.ino (both in ~/Documents/Arduino)
 - The knot_serial_router should be loaded to the Jeelink (/dev/tty.usbserial-AE01BQR1). It has got the jeenode id 1
 - The JeenodeTest2.ino needs to be loaded onto all other Jeenodes. Individual node ids have to be set in the arduino
 code before uploading to the boards.
 - TODO: the remote Jeenode ids also have to be added to an array in this script
 */

var log = require('./Log.js').log;
var util = require('util');

var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var sp = null;
//var spName = '/dev/tty.usbserial-AH01A0BU'
var spName = '/dev/tty.usbserial-AE01BQR1'
var spIsOpen = false;
var spOpenedCount;

var knots = require('./Knot.js').singleton();
var Bencode = require('./Bencode.js');
var _ = require('underscore');

var jeenodes = [];
var jeenodesInitialized = false;
var maxAckTime;

exports.setup = setup;
function setup(_knotsPath,_spName) {
    knotsPath = _knotsPath;
    spName = _spName;
    spOpenedCount = knots.get(knotsPath + '/serial_port_opened', {type:'number', value:0});
    spOpenedCount.ready(function(){
        spOpenedCount.set(0);
        setupSerialPort();
    });

    //


    maxAckTime = knots.get(knotsPath + '/max_ack_time', {type:'number', value:100, min:100,max:2000});

    serialTimeout = knots.get(knotsPath + '/serial_timeout', {type:'number',value: 20, min: 1, max: 600});
    var devicePath = knotsPath.split("/")[0];
    resetKnot = knots.get(devicePath + '/reset');

    lastReceivedDate = new Date();
    setInterval(function(){
        if((new Date()).getTime() - lastReceivedDate.getTime() > serialTimeout.getInt() * 1000){
            log.info("JeenodeTest4: no serial data received for a while. Initiating reset.");
            resetKnot.setInt(resetKnot.getInt()+1);
        }
    },1000);

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
        lastReceivedDate = new Date();
        try {
            clearTimeout(ackTimeout);
            var o = Bencode.decode(data);
            jeenodes[currentJeenodeId].receiveUpdate(o);
        } catch (e) {
            log.error('error receiving serial data: ' + data);
        }
        updateNextJeenode();
    });
}

function onSerialPortOpen(){
    spIsOpen = true;
    spOpenedCount.setInt(spOpenedCount.getInt() + 1);

    if(!jeenodesInitialized){ // prevent reinitialization
        initializeJeenodes();
        currentJeenodeId = jeenodes.length - 1;
    }

    updateNextJeenode();
}

// setup jeenodes with jeenode ids and names to appear in GUI
function initializeJeenodes(){
    jeenodes.push(new BlinkPlugNode(4,'buttons'));
    jeenodes.push(new CompassPlugNode(3,'compass'));
    jeenodes.push(new LCDplugNode(2,'lcd'));
    jeenodes.push(new GravityPlugNode(5,'gravity'));
    jeenodes.push(new DCmotorNode(6,'motor'));
}

function updateNextJeenode(){
    if(spIsOpen){
        currentJeenodeId++;
        if(currentJeenodeId == jeenodes.length)
            currentJeenodeId = 0;
        jeenodes[currentJeenodeId].update();
    }
}

function sendTo(id,msg){

    // set destination address of message
    msg._D = id;

    // encode message in bencode format
    var bc = Bencode.encode(msg);

    // send message out to serial prot
    sp.write(bc);

    // setup acknowledgement timeout
    ackTimeout = setTimeout(ackFail,maxAckTime.getInt());
}

function ackFail(){
    jeenodes[currentJeenodeId].updateFailed();
    updateNextJeenode();
}

// JEENODE BASE /////////////////////////////////////////////////

Jeenode = function(jeenodeId,name){
    this.initialize(jeenodeId,name);
}

Jeenode.prototype.initialize = function(jeenodeId,name){
    console.log('Jeenode ' + jeenodeId + ' initialized as ' + name);

    this.id = jeenodeId;
    this.name = name;
    this.path = knotsPath + '/' + this.name;
    this.statsPath = this.path + '/jeenode';
    this.totalSuccess = knots.get(this.statsPath + '/transmission_successes', {type:'number', value:0});
    this.totalFailures = knots.get(this.statsPath + '/transmission_failures', {type:'number', value:0});
    this.isOnline = knots.get(this.statsPath + '/is_online', {type:'boolean', value:0},knots.metaModes.REPLACE);
    //this.failedCount = knots.get(this.statsPath + '/failed_count', {type:'number', value:0},knots.metaModes.REPLACE);
    this.updateInterval = knots.get(this.statsPath + '/update_interval', {type:'number', value:100, min: 0, max: 10000});
    this.retryInterval = knots.get(this.statsPath + '/retry_interval', {type:'number', value:0});
    this.resetDate = knots.get(this.statsPath + '/reset_date',{type:'string'});
    this.lastUpdate = knots.get(this.statsPath + '/last_update', {type:'string'});
    this.reset = knots.get(this.statsPath + '/reset', {type:'button'});
    this.reset.change(_.bind(function(){
        console.log('reset',this.id,this.name);
        this.resetDate.set((new Date()).toString());
        this.totalSuccess.setInt(0);
        this.totalFailures.setInt(0);
        this.isOnline.setInt(0);
        this.retryInterval.setInt(500);
        this.nextUpdateTime = new Date();
    },this));
    this.enabled = knots.get(this.statsPath +'/enabled',{type:'boolean',value:1});

    // trigger reset
    this.reset.ready(
        _.bind(function(){
            this.reset.setInt(this.reset.getInt() + 1);
        },this)
    );

    this.nextUpdateTime = new Date();
}

Jeenode.prototype.update = function(){
    if(this.enabled.getInt() == 1 && new Date() > this.nextUpdateTime){
        sendTo(this.id,this.sendData());
    } else {
        setTimeout(updateNextJeenode,5);
    }
}

Jeenode.prototype.updateFailed = function(){
    //log.error(this.id + ' failed update')
    //this.failedCount.setInt(this.failedCount.getInt() + 1);
    this.totalFailures.setInt(this.totalFailures.getInt()+1);
    this.isOnline.set(0);

    // increase retry interval by factor of two as long as smaller then a minute
    var ri = this.retryInterval.getInt();
    if(ri < 60000){
        ri *= 2;
    }
    this.retryInterval.setInt(ri);
    this.nextUpdateTime.setTime((new Date()).getTime() + ri);

}

// overwrite this function
Jeenode.prototype.sendData = function(){
    return {};
}

// overwrite this function
Jeenode.prototype.receiveData = function(data){
}

Jeenode.prototype.receiveUpdate = function(o){

    //console.log('receiveData',this.id,this.name);

    this.isOnline.set(1);
    this.totalSuccess.setInt(this.totalSuccess.getInt()+1);
    this.retryInterval.setInt(500);
    this.lastUpdate.set((new Date()).toString());

    if('_S' in o){
        var srcId = o._S;
        if(srcId != this.id){
            log.error('src id != this.id : ' + srcId + " != " + this.id);
        }
    } else {
        log.error('no src id received for ' + this.id);
    }

    this.receiveData(o);
    this.nextUpdateTime.setTime((new Date()).getTime() + this.updateInterval.getInt());
}

// BLINK PLUG /////////////////////////////////////////////////
// TODO: prevent button pressed on startup

var BlinkPlugNode = function(id,name){
    Jeenode.prototype.initialize.apply(this,[id,name]);
    this.initialize();
}
util.inherits(BlinkPlugNode, Jeenode);

BlinkPlugNode.prototype.initialize = function(){
    console.log('BlinkPlugNode initialize');
    this.button1 = knots.get(this.path + '/button_1', {type:'number', value:0}).change(function(){console.log('button 1 pressed!')});
    this.button2 = knots.get(this.path + '/button_2', {type:'number', value:0}).change(function(){console.log('button 2 pressed!')});
    this.led1 = knots.get(this.path + '/led_1', {type:'boolean', value:0});
    this.led2 = knots.get(this.path + '/led_2', {type:'boolean', value:0});
}

BlinkPlugNode.prototype.receiveData = function(data){
    // parse blink plug specific data
    if('b1' in data){
        this.button1.set(data.b1);
    }
    if('b2' in data){
        this.button2.set(data.b2);
    }
}

BlinkPlugNode.prototype.sendData = function(){
    var led1 = parseInt(this.led1.get());
    var led2 = parseInt(this.led2.get());
    return {l1:led1,l2:led2};
}

// COMPASS PLUG /////////////////////////////////////////////////

var CompassPlugNode = function(id,name){
    Jeenode.prototype.initialize.apply(this,[id,name]);
    this.initialize();
}
util.inherits(CompassPlugNode, Jeenode);

CompassPlugNode.prototype.initialize = function(){
    console.log('CompassPlugNode initialize');
    this.angle = knots.get(this.path + '/angle', {type:'number', value:0});
    this.x = knots.get(this.path + '/x', {type:'number', value:0});
    this.y = knots.get(this.path + '/y', {type:'number', value:0});
    this.z = knots.get(this.path + '/z', {type:'number', value:0});
}

CompassPlugNode.prototype.receiveData = function(data){
    if('a' in data){
        this.angle.set(data.a);
    }
    if('x' in data){
        this.x.set(data.x);
    }
    if('y' in data){
        this.y.set(data.y);
    }
    if('z' in data){
        this.z.set(data.z);
    }
}

// LCD PLUG /////////////////////////////////////////////////

var LCDplugNode = function(id,name){
    Jeenode.prototype.initialize.apply(this,[id,name]);
    this.initialize();
}
util.inherits(LCDplugNode, Jeenode);

LCDplugNode.prototype.initialize = function(){
    console.log('LCDplugNode initialize');
    this.topLine = knots.get(this.path + '/topLine', {type:'string', value:''});
    this.bottomLine = knots.get(this.path + '/bottomLine', {type:'string', value:''});
    this.backlit = knots.get(this.path + '/backlit', {type:'boolean', value:0});
}

LCDplugNode.prototype.receiveData = function(data){
}

LCDplugNode.prototype.sendData = function(){
    //TODO: need to limit string length (also in gui / mknots.js)
    var tl = this.topLine.get()+"";
    var bl = this.bottomLine.get()+"";
    return {tl:tl,bl:bl,bt:this.backlit.getInt()};
}

// GRAVITY PLUG /////////////////////////////////////////////////

var GravityPlugNode = function(id,name){
    Jeenode.prototype.initialize.apply(this,[id,name]);
    this.initialize();
}
util.inherits(GravityPlugNode, Jeenode);

GravityPlugNode.prototype.initialize = function(){
    console.log('GravityPlugNode initialize');
    this.x = knots.get(this.path + '/x', {type:'number', value:0});
    this.y = knots.get(this.path + '/y', {type:'number', value:0});
    this.z = knots.get(this.path + '/z', {type:'number', value:0});
    this.side = knots.get(this.path + '/side', {type:'list', value:0, list:['top','bottom','left','right','front','rear']});
    this.sensitivity = knots.get(this.path + '/sensitivity', {type:'list',list:['low','medium','high']});
}

GravityPlugNode.prototype.receiveData = function(data){

    if('x' in data){
        this.x.set(data.x);
    }
    if('y' in data){
        this.y.set(data.y);
    }
    if('z' in data){
        this.z.set(data.z);
    }

    var maxDir = 'x';

    var dirValues = [this.x.getInt(),this.y.getInt(),this.z.getInt()];
    var maxDirValues = [];
    for(var i=0; i<dirValues.length; i++)
        maxDirValues[i] = Math.abs(dirValues[i]);

    var largest = 0;
    for(var i=1; i<maxDirValues.length; i++)
        if(maxDirValues[i] > maxDirValues[largest])
            largest = i;

    switch(largest){
        case 0: //x
            if(dirValues[0] >= 0){
                this.side.set(5);
            } else {
                this.side.set(4);
            }
            break;
        case 1: //y
            if(dirValues[1] >= 0){
                this.side.set(2);
            } else {
                this.side.set(3);
            }
            break;
        case 2: //z
            if(dirValues[2] >= 0){
                this.side.set(0);
            } else {
                this.side.set(1);
            }
            break;
    }

}

GravityPlugNode.prototype.sendData = function(){
    return {s:this.sensitivity.getInt()};
}

// DC MOTOR PLUG /////////////////////////////////////////////////

var DCmotorNode = function(id,name){
    Jeenode.prototype.initialize.apply(this,[id,name]);
    this.initialize();
}
util.inherits(DCmotorNode, Jeenode);

DCmotorNode.prototype.initialize = function(){
    console.log('DCmotorNode initialize');
    this.motor1 = knots.get(this.path + '/motor_1', {type:'list',list:['reverse','off','forward'],value:1});
    this.motor2 = knots.get(this.path + '/motor_2', {type:'list',list:['reverse','off','forward'],value:1});
}

DCmotorNode.prototype.sendData = function(){
    return {m1:this.motor1.getInt(),m2:this.motor2.getInt()};
}