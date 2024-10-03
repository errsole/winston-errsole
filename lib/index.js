const Transport = require('winston-transport');
const errsole = require('errsole');

class WinstonErrsole extends Transport {
  constructor (options = {}) {
    super(options);

    // Mapping Winston logging levels to corresponding Errsole logging levels
    this.logLevelMapping = {
      error: 'error',
      warn: 'warn',
      info: 'info',
      http: 'info',
      verbose: 'info',
      debug: 'debug',
      silly: 'debug'
    };
  }

  /**
   * Core logging method exposed to Winston.
   * {level, msg, [meta]} = logInfo
   * @level {string} Level at which to log the message.
   * @msg {string} Message to log
   * @meta {Object} **Optional** Additional metadata to attach
   * @param {Function} callback
   */
  log (logInfo, callback) {
    setImmediate(() => {
      this.emit('logged', logInfo);
    });

    if (!callback) {
      callback = () => {};
    }

    const { level, message, ...winstonMeta } = logInfo;
    const log = {};
    log.meta = winstonMeta;
    log.level = level;
    log.message = message;
    const errsoleLogLevel = this.logLevelMapping[log.level] || 'info';

    try {
      if (typeof errsole[errsoleLogLevel] === 'function') {
        if (log.meta && Object.keys(log.meta).length > 0) {
          errsole.meta(log.meta)[errsoleLogLevel](log.message);
        } else {
          errsole[errsoleLogLevel](log.message);
        }
      }
    } catch (err) {
      this.emit('error', err);
    }
    if (callback) {
      callback();
    }
  }
}

module.exports = WinstonErrsole;
module.exports.default = WinstonErrsole;
