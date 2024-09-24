const Transport = require('winston-transport');
const Errsole = require('errsole');

class ErrsoleWinston extends Transport {
  /**
   * Constructor for the transport.
   * @param {Object} [options={}] - Configuration options.
   * @param {string} [options.level='silly'] - Minimum level to log.
   * @param {boolean} [options.handleExceptions=false] - Handle uncaught exceptions.
   * @param {boolean} [options.handleRejections=false] - Handle unhandled promise rejections.
   */
  constructor (options = {}) {
    super(options);
    this.level = options.level || 'silly';
    this.handleExceptions = options.handleExceptions || false;
    this.handleRejections = options.handleRejections || false;

    // Define Winston to Errsole level mapping
    this.levelMapping = {
      error: 'error',
      warn: 'warn',
      info: 'info',
      debug: 'debug',
      silly: 'debug',
      verbose: 'info',
      http: 'info'
    };
  }

  /**
   * Core logging method exposed to Winston.
   * @param {Object} info - Log information.
   * @param {Function} callback - Callback function.
   */
  log (info, callback) {
    const { level, message, ...metadata } = info;
    const mappedLevel = this.levelMapping[level] || 'info';
    const hasMeta = Object.keys(metadata).length > 0;

    try {
      // Ensure metadata is an object. If not, wrap it inside an object.
      const meta =
        hasMeta && typeof metadata === 'object' && !Array.isArray(metadata)
          ? metadata
          : hasMeta
            ? { meta: metadata }
            : {};

      // Attach metadata if available
      const logger = Object.keys(meta).length > 0 ? Errsole.meta(meta) : Errsole;

      // Forward the log to Errsole using the mapped level
      if (typeof logger[mappedLevel] === 'function') {
        logger[mappedLevel](message);
      } else {
        // Fallback to info level if the mapped level doesn't exist
        logger.info(`[${mappedLevel.toUpperCase()}] ${message}`);
      }
    } catch (error) {
      this.emit('error', error);
    }
    this.emit('logged', info);
    if (callback) {
      callback();
    }
  }
}

module.exports = ErrsoleWinston;
