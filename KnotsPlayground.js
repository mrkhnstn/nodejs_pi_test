/*
    playground for trying out a few different experiments / examples with the Jeenode modules (connected via pi_knots.js / Jeenodetest4.js)
 */

var knots = require('./Knot').singleton();
var log = require('./Log.js').log;
var util = require('util');

var userNames = ['Mark','Andy','David','Nadine','Bill','John','Sarah','Kirsten','Jen'];
var routerDevices = [
    {path:'b8:27:eb:cf:1c:14',name:'Raspberry Pi'},
    {path:'3c:07:54:02:98:d8',name:'Mark MacBook Pro'}
];
var users = {};
var experiments = {};
var knotsNamespace = 'playground';

// initialize users

User = new function(name){
    this.name = name;
    this.path = knotsNamespace + '/users/' + this.name;


}


