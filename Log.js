var Log = require('log');

var log = new Log(process.env.NODE_ENV == 'production' ? 'info' : 'debug');
exports.log = log;

// HOW TO ///////////////////////////////////
// put following line at the top of your code
// var log = require('./Log.js').log;
// then do log.debug('asdf') or log.error('asdf')

//TODO change logger to winston