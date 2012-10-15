var redis = require('redis');
 var client = redis.createClient(9072,'char.redistogo.com');
 
 console.log('hello');
 client.auth('7159a9637d7891c263bab6b63697c704', function (err) {
 	
   if (err) { throw err; }
   // You are now connected to your redis.
   
   client.get('foo',function(err,reply){
   	console.log(reply);
   });
   
 });
