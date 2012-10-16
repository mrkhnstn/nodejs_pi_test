var _ = require('underscore');
var util = require("util");
var events = require("events");

// test util.inherits(a,b); /////////////////////////////////

var a = function(id){
    this.initialize(id);
}

a.prototype.initialize = function(id){
    this.id = id;
    console.log('a',id);
}

var b = function(id){
    a.apply(this,[id]);
}
util.inherits(b,a); // the position of this line is important (after function before prototypes)

b.prototype.initialize = function(id){
    this.super = b.super_.prototype; // create pseudo super
    this.super.initialize(id); // call super initialize
    console.log('b',this.id);
    //console.log(this.id);
}

new a(1);
var _b = new b(2);