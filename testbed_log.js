var Log = require('log')
  , log = new Log(process.env.NODE_ENV == 'production' ? 'info' : 'debug');

log.debug('debug bla bla bla');
log.info('info bla bla bla');
log.error('error bla bla bla');