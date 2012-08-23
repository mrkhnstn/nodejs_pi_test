var sys = require('util')
  , exec = require('child_process').exec;
  
var MAC = null;

var child = exec("ifconfig en0", function(error, stdout, stderr){
  	if(stderr != null){
  		console.log(stdout);
  		var start = stdout.indexOf('ether ')+6;
  		MAC = stdout.substr(start,17);
  	}
});