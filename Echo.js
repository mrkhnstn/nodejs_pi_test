var socket = null;
exports.setSocket = setSocket;
function setSocket(s){
	socket = s;
}

exports.receiveMessage = receiveMessage;
function receiveMessage(data){
	console.log('receiveMessage',data);
	if(socket != null){
		var temp = data.to;
		data.to = data.from;
		data.from = temp;
		console.log('receiveMessage','emit',data);
		socket.emit('message',data);
	}
}