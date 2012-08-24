var gpio = require("gpio");

// creates pin instance with direction "in"
var gpio4 = gpio.export(4, {
   direction: "in",
   ready: function() {
      console.log("ready");
      // bind to the "change" event
      // see nodejs's EventEmitter 
      gpio4.on("change", function(val) {
         // value will report either 1 or 0 (number) when the value changes
         console.log(val)
      });

      setInterval(function(){
     		 gpio4._get(function(val){console.log("gpio4:"+val);});
	},1000);
      
   }
});
