exports.encode = encode;
function encode(val){
    switch(typeof val){
        case 'number':
            return encodeInteger(val);
            break;
        case 'string':
            return encodeString(val);
            break;
        case 'object':
            if(Array.isArray(val)){
                return encodeList(val);
            } else {
                return encodeDictionary(val);
            }
            break;
    }
    return "";
}

function encodeString(s){
    var a = [];
    a.push(s.length);
    a.push(':');
    a.push(s);
    return a.join("");
}

function encodeInteger(i){
    var a = [];
    a.push('i');
    a.push(i);
    a.push('e');
    return a.join("");
}

function encodeList(l){
    var a = [];
    a.push('l');
    for(var i=0; i<l.length; i++){
        a.push(encode(l[i]));
    }
    a.push('e');
    return a.join("");
}

function encodeDictionary(d){
    var a = [];
    a.push('d');
    for(var n in d){
        a.push(encodeString(n));
        a.push(encode(d[n]));
    }
    a.push('e');
    return a.join("");
}

// DECODING ////////////////////////////////////////////////////////////////////

exports.decode = decode;
function decode(s){
    return decodeObject({string:s,index:0}).result;
}

function decodeObject(o){
    switch(o.string.charAt(o.index)){
        case 'i': // integer
            decodeInteger(o);
            break;
        case 'l':
            decodeList(o);
            break;
        case 'd':
            decodeDictionary(o);
            break;
        default: // string
            decodeString(o);
    }
    return o;
}

// argument in object format
// {
// string:completeString,
// index:currentIndex to start parsing from
// }

// returns argument object with moved index and result added
// if parsing error then index stays the same and result will be null
function decodeInteger(o){
    //console.log("decodeInteger",o.string.substr(o.index));
    if(o.string.charAt(o.index) === 'i'){
        var start = o.index+1;
        var end = o.string.indexOf('e', o.index);
        if(end == -1){
            o.result = null; // couldn't find end 'e'
        } else {
            try {
                o.result = parseInt(o.string.substring(start,end));
                o.index = end+1;
            } catch (e) {
                o.result = null; // couldn't parse to integer
            }
        }
    } else {
        o.result = null; // no string 'i'
    }
    return o;
}

function decodeString(o){
    //console.log("decodeString", o.index,o.string.substr(o.index));
    var colonIndex = o.string.indexOf(':', o.index);
    if(colonIndex == -1){
        o.result = null; // couldn't find ':'
    } else {
        try {
            //console.log("string length:",o.string.substring(o.index,colonIndex));
            var stringLength = parseInt(o.string.substring(o.index,colonIndex));
            o.result = o.string.substr(colonIndex+1,stringLength);
            o.index = colonIndex+1+stringLength;
        } catch(e) {
            o.result = null;
        }
    }
    return o;
}

function decodeList(o){

    if(o.string.charAt(o.index)==='l'){
        o.result = [];
        o.index++;

        while(true){ //TODO: add another fail mechanism to prevent endless loop

            // create separate argument object for internal parsing
            var a = {string:o.string,index:o.index};

            decodeObject(a);
            /*
             // parse based on first character
             switch(a.string.charAt(a.index)){
             case 'i': // integer
             decodeInteger(a);
             break;
             default: // string
             decodeString(a);
             }
             */

            if(a.result == null){
                // an error occured during internal parsing
                // abort
                o.result = null;
                break; // abort
            } else {
                o.result.push(a.result);
                o.index = a.index;
            }
            if(o.string.charAt(o.index)=='e'){ // found end of list
                // finished, set index for next parsing
                o.index++;
                break; // exit while loop
            }
        }
    } else {
        o.result = null;
    }
    return o;
}

function decodeDictionary(o){
    if(o.string.charAt(o.index)==='d'){
        o.result = {};
        o.index++;
        var key = "";
        while(true){
            // create separate argument object for internal parsing
            var a = {string:o.string,index:o.index};
            decodeString(a);
            if(a.result == null){
                // error with internal parsing
                // abort
                o.result = null;
                return o;
            } else {
                key = a.result;
                o.index = a.index;
            }
            decodeObject(a);
            if(a.result == null){
                // error with internal parsing
                // abort
                o.result = null;
                return o;
            } else {
                o.result[key] = a.result;
                o.index = a.index;
            }

            if(o.string.charAt(o.index)=='e'){ // found end of list
                // finished, set index for next parsing
                o.index++;
                break; // exit while loop
            }
        }
    } else {
        o.result = null;
    }
    return o;
}