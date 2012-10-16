var express = require('express')
    , routes = require('./routes')
    , http = require('http')
    , path = require('path')
    , _ = require('underscore');

var Log = require('log')
    , log = new Log(process.env.NODE_ENV == 'production' ? 'info' : 'debug');

knots = require('./KnotSocketClient').singleton();
knots.ready(function () {
    log.debug('ready');

    var number = knots.get('test/number');
    number
        .ready(function(){
            console.log('number ready');
            number.set(50);
        })
        .change(function(value){
           console.log('number',value);
        });

    var string = knots.get('test/string2');
    string
        .ready(function(){
           string.setMeta({type:'string',value:'hello world'});
        })
        .change(function(value){
            console.log('string',value);
        });

    knots.getChildren('test',function(children){
        console.log(children);
    });

    var list2 = knots.get('test/list2',{type:'list',list:['a','b','c'],value:2});
    /*
    var numKnot = knots.get('d/e/f/num',{
        default : 0,
        type: 'number',
        min: 0,
        max: 100
    });
    */

    /*
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
    */


    //knots.delete('a/b');

    /*
    knots.getChildren('arduino_test',function(o){
        console.log(o);
    });
    */
});