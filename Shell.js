var exec = require('child_process').exec;

var socket = null;
exports.setSocket = setSocket;
function setSocket(s){
	socket = s;
}

exports.receiveMessage = receiveMessage;
function receiveMessage(data){
	if(socket != null){
		var temp = data.to;
		data.to = data.from;
		data.from = temp;
		
		var child = exec(data.body, function(error, stdout, stderr){
			console.log('stdout',stdout);
			console.log('stderr',stderr);
			//console.log('error',error);
			
			var a = {
				cmd : data.body,
				stdout : stdout,
				stderr : stderr
			}
			data.body = a;
			
			socket.emit('message',data);
		});
	}
}