var io_client = require( 'socket.io-client' );
var socket = io_client.connect( "http://localhost:3000" );

socket.on('news', function (data) {
	console.log(data);
	socket.emit('my other event', { my: 'data' });
});