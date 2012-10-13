var express = require('express')
    , routes = require('./routes')
    , http = require('http')
    , path = require('path')
    , _ = require('underscore');

var Log = require('log')
    , log = new Log(process.env.NODE_ENV == 'production' ? 'info' : 'debug');

knots = require('./Knot').singleton();
knots.ready(function () {
    log.debug('redisBase ready');


    /*
    var numKnot = knots.get('d/e/f/num',{
        default : 0,
        type: 'number',
        min: 0,
        max: 100
    });
    */

    var listKnot = knots.get('a/select', {
            default:0,
            type:'list',
            list:['mark', 'dave', 'nadine', 'andy']
        })
        .ready(function () {
            console.log('list knot ready');
        })
        .change(function (data) {
            console.log('list knot changed:', data);
        });



    knots.delete('a/b');

    /*
    knots.getChildren('arduino_test',function(o){
        console.log(o);
    });
    */
});