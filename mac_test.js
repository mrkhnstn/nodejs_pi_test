var sys = require('util')
  , exec = require('child_process').exec;

function getMAC(fn){

	var MAC = "00:00:00:00:00:00";
	
	try {
		// try RPi ethernet first
		exec("ifconfig eth0", function(error, stdout, stderr){
			console.log(stderr);
			if(stderr == ""){
				var start = stdout.indexOf('HWaddr ')+6;
				MAC = stdout.substr(start,17);
				fn(MAC);
			} else {
				// try Mac
				exec("ifconfig en0", function(error, stdout, stderr){
					if(stderr == ""){
						//console.log(stdout);
						var start = stdout.indexOf('ether ')+6;
						MAC = stdout.substr(start,17);
						fn(MAC);
					}
				});
			}
		});
	} catch(e){
		fn(MAC);
	}
}

getMAC(function(mac){
	console.log('MAC: ',mac);
});
