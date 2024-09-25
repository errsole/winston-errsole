const Transport = require('winston-transport');
const errsole = require('errsole');

class ErrsoleWinston extends Transport {
  /**
   * Constructor for the transport.
   * @param {Object} [options={}] - Configuration options.
   */
  constructor (options = {}) {
    super(options);

    // Define Winston to Errsole level mapping
    this.levelMapping = {
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
   * @param {Object} logInfo - Log information.
   * @param {Function} callback - Callback function.
   */
  log (logInfo, callback) {
    // protect
    if (!callback) {
      callback = () => {};
    }

    // set log object
    const { level, message, ...winstonMeta } = logInfo;
    const log = {};
    log.meta = JSON.stringify(winstonMeta);
    log.level = level;
    log.message = message;
    const errsoleLogLevel = this.levelMapping[log.level] || 'info';

    try {
      if (typeof errsole[errsoleLogLevel] === 'function') {
        if (log.meta) {
          errsole.meta(log.meta)[errsoleLogLevel](log.message);
        } else {
          errsole[errsoleLogLevel](log.message);
        }
      }
    } catch (error) {
      this.emit('error', error);
    }
    setImmediate(() => {
      this.emit('logged', logInfo);
    });
    if (callback) {
      callback();
    }
  }
}

module.exports = ErrsoleWinston;
