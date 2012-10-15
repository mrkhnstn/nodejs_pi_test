var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var sp = null;
//var portName = '/dev/ttyACM0';
//var portName = '/dev/tty.usbmodemfa131'
var portName = '/dev/tty.usbmodemfd1241'

// setup serial port
sp = new SerialPort(portName, {
    parser: serialport.parsers.readline("\r\n")
});

//protocol
// length of value (digit 1)
// length of last response value
// cmd (3 characters, digit 3-5)
// value (max 54 characters)

sp.on("data", function (data) {
    //console.log('serial',data);
    /*
    try{
        a = bencode.decode(data);
        console.log(typeof a,a);
    } catch(e) {
    }
    */
    console.log("data:",data);
});

setInterval(function(){
    //sp.write(bencode.encode({data:134,name:'mark'}));
    //test("hello world!");
    //test(1234);
    //test(-1234);
    //test(["mark",123,023,"hannah",12341]);
    test({string:"Hello Mark!",negInt:-123,posInt:123});
},3000);


var createNormalHeader = function(destId){
    return createHeader(0,1,0,destId);
}

// create a header with acknoledgement request
var createNormalHeaderACK = function(destId){
    return createHeader(0,1,0,destId);
}

// create a header with acknoledgement request
var createACKheader = function(destId){
    return createHeader(0,1,0,destId);
}



var createHeader = function(CTL,DST,ACK,nodeId){
    var a = [CTL,DST,ACK];
    var b = 0;
    for(var i=0; i< a.length; i++){
        b = (b << 1) | a[i];
    }
    b <<= 5;
    b |=nodeId;
    return b;
}



function byteToString(byte)
{
    var tmp = "";
    for(var i = 128; i >= 1; i /= 2)
        tmp += byte&i?'1':'0';
    return tmp;
}

function byteToArray(byte){
    var tmp = [];
    var j = 0;
    for(var i = 128; i >= 1; i /= 2){
        tmp[j] =  byte&i?1:0;
        j++;
    }
    return tmp;
}

//for(var i=0; i<256; i++){
//    console.log(i+":",byteToBitArray(i));
//}

/*
 var a, b, r;
 a = [227, 142];
 [b, r] = split2Bits(a, 3);
 */
//b = ["111", "000", "111", "000", "111"];
//r = '0'; //rest of bits

///////////////////////////////////////////////////////////////////////
// BENCODE TEST

var bencode = require('./Bencode.js');

function test(o){
    console.log('// BENCODE TEST //////////////////////////////////////////////')


    var encoded = bencode.encode(o);
    var decoded = bencode.decode(encoded);

    /*
    console.log('input:',JSON.stringify(o));
    console.log('encoded:',encoded);

    if(JSON.stringify(o)==JSON.stringify(decoded)){
        console.log("SUCCESS");
    } else {
        console.log("ERROR!!!");

        console.log('output:',decoded);
    }
    */

    sp.write(encoded);
}

/*
test("hello workdsl!");
test(1234);
test(-1234);
test(["mark",123,023,"hannah",12341]);
test({string:"Hello Mark!",negInt:-123,posInt:123});
*/

// nested tests //
//test({string:"Hello Mark!",negInt:-123,posInt:123,nested:{string:"Hello Mark!",o:{a:1,b:'234'},negInt:-123,posInt:123}});
//test([1,23,'madkfj',[1,2,3,{o:1234,b:'adsf'}],{a:123,b:324}]);


