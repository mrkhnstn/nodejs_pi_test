var socket = null;
exports.setSocket = setSocket;
function setSocket(s){
	socket = s;
	if(allReady){
		syncGPIOs();
	}
}

var gpio = require("gpio");

// available pins
var gpioPinIds = [14,15,18,23,24,25,8,7,0,1,4,17,21,22,10,9,11];
var gpios = [];
var deviceId = null;
var readyCount = 0;
var allReady = false;

exports.setup = setup;
function setup(_deviceId,_socket){
	deviceId = _deviceId;
	socket = _socket;
	
	// setup all available gpios
	for(var i=0; i<gpioPinIds.length; i++){
		var id = gpioPinIds[i];
		
		var f = function(){
			var a = id;
			return function(){
				console.log("pin " + a + " ready");
				var g = gpios[a];
				
				g._set = g.set;
				g.set = function(val){
					this.desiredValue = val;
					this._set(val);
				}
				
				//g.set(0);
				g.desiredValue = g.value;
				
				g.on("change",function(val){
					console.log("pin " + a + " changed to " + val);
					try{
						var valKey = deviceId+'/gpio/'+a+'/value'; //TODO: cache
						socket.emit('pub',[{key:valKey,value:g.value}]);
					} catch(e) {
						console.error(e);
					}
				});
				
				g.on("directionChange",function(dir){
					console.log("pin " + a + " changed direction to " + dir);
					try {
						var dirKey = deviceId+'/gpio/'+a+'/direction'; //TODO: cache
						socket.emit('pub',[{key:dirKey,value:g.direction}]);
							
						if(dir === 'out'){
							if(g.value != g.desiredValue){
								g.set(g.desiredValue);
							}
						} else {
							g._get();
							g.desiredValue = gpios[a].value;
						}
					
					} catch(e) {
						console.error(e);
					}
					
				});
				
				readyCount++;
				if(readyCount == gpioPinIds.length){
					console.log("all GPIOs ready!");
					allReady = true;
					syncGPIOs();
				}
			}
		}
		
		gpios[id] = gpio.export(id, {
			direction: 'out',	
			ready: f()
		});
	}
	
	
}

function syncGPIOs(){
	if(socket != null){
		console.log("syncGPIOs");
		for(var i=0; i<gpioPinIds.length; i++){
			var pinId = gpioPinIds[i];
			var g = gpios[pinId];
			var valKey = deviceId+'/gpio/'+pinId+'/value';
			var dirKey = deviceId+'/gpio/'+pinId+'/direction';
			socket.emit('get',valKey);
			socket.emit('get',dirKey);
			socket.emit('unsub',[valKey,dirKey]);
			socket.emit('sub',[valKey,dirKey]);
		}
	}
}

exports.get = get;
function get(s,level,data){
	var pinId = Number(s[2]);
	if(s[3] === 'value'){
		if(data.value == null){
			socket.emit('pub',[{
				key:data.key,
				value:gpios[pinId].value
			}]);
		} else {
			//console.log("got cloud value: " + pinId + " > " + data.value);
			gpios[pinId].set(Number(data.value));
		}
	} else if(s[3] === 'direction'){
		if(data.value == null){
			socket.emit('pub',[{
				key:data.key,
				value:gpios[pinId].direction
			}]);
		} else {
			//console.log("got cloud dir: " + pinId + " > " + data.value);
			if(data.value != gpios[pinId].direction)
				gpios[pinId].setDirection(data.value);
		}
	}
}

exports.msg = msg;
function msg (s,level,data){
	var pinId = Number(s[2]);
	if(s[3] === 'value'){
		gpios[pinId].set(Number(data.value));
	} else if(s[3] === 'direction'){
		if(data.value != gpios[pinId].direction)
			gpios[pinId].setDirection(data.value);
	}
}

/*
var getGPIO = function(){
	var a = [];
		for(var i=0; i<gpios.length; i++){
			var g = gpios[i];
			if(g)
				a.push({
					pin:g.headerNum,
					dir:g.direction,
					val:g.value
					});
		}
	return a;
}

var setGPIO = function(data){
	//console.log("gpio:"+data.toString());
	var pin = Number(data.pin);
	if(gpioPinIds.indexOf(pin) != -1){
		try {
			var g = gpios[data.pin];
			//console.log(g);
			if(g.direction != data.dir){
				g.setDirection(data.dir);
			}
			if(g.direction == "out"){
				g.set(data.val);
			}
		} catch(e) {
			console.error(e);
		}
	}
}
*/