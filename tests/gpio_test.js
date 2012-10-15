var gpio = require("gpio");
var gpio22, gpio4, intervalTimer;

// Flashing lights if LED connected to GPIO22
gpio22 = gpio.export(0, {
   ready: function() {
      inervalTimer = setInterval(function() {
         gpio22.set();
         setTimeout(function() { gpio22.reset(); }, 500);
      }, 1000);
   }
});

// Lets assume a different LED is hooked up to pin 4, the following code 
// will make that LED blink inversely with LED from pin 22 
gpio4 = gpio.export(4, {
   ready: function() {
      // bind to gpio22's change event
      gpio22.on("change", function(val) {
         gpio4.set(1 - val); // set gpio4 to the opposite value
      });
   }
});

// reset the headers and unexport after 10 seconds
setTimeout(function() {
   clearInterval(intervalTimer);          // stops the voltage cycling
   gpio22.removeAllListeners('change');   // unbinds change event
   gpio22.reset();                        // sets header to low
   gpio22.unexport();                     // unexport the header

   gpio4.reset();
   gpio4.unexport(function() {
      // unexport takes a callback which gets fired as soon as unexporting is done
      process.exit(); // exits your node program
   });
}, 10000)
