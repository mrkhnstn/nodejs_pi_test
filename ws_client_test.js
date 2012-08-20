var WebSocket = require('ws')
  , ws = new WebSocket('ws://5.157.248.122:80');
ws.on('open', function() {
    ws.send('something');
});
ws.on('message', function(message) {
    console.log('received: %s', message);
});