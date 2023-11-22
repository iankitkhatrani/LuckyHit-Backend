const log4js = require('log4js');
const path = require('path');

log4js.configure({
  appenders: {
    development: {
      type: 'file',
      filename: path.join(__dirname, 'logs/log-'),
      pattern: 'yyyy-MM-dd.log',
      compress: true,
      alwaysIncludePattern: true,
    },
  },
  categories: {
    default: {
      appenders: ['development'],
      level: 'all',
    },
  },
});

module.exports = log4js.getLogger('development');
