const Transport = require('winston-transport');
const Errsole = require('errsole'); // Import the errsole.js module

module.exports = class ErrsoleWinston extends Transport {
  constructor (options = {}) {
    super(options);
  }

  log (info, callback) {
    // Destructure level, message, and metadata from the info object
    const { level, message, ...winstonMeta } = info;
    let parsedMessage;
    try {
      // If message is a stringified JSON, we parse it and extract the actual message
      parsedMessage = JSON.parse(message).message || message;
    } catch (e) {
      // If it's not JSON, use the message directly
      parsedMessage = message;
    }

    const hasMeta = Object.keys(winstonMeta).length > 0;

    switch (level) {
      case 'error':
        if (hasMeta) {
          Errsole.meta(winstonMeta).error(parsedMessage);
        } else {
          Errsole.error(parsedMessage);
        }
        break;
      case 'warn':
        if (hasMeta) {
          Errsole.meta(winstonMeta).warn(parsedMessage);
        } else {
          Errsole.warn(parsedMessage);
        }
        break;
      case 'info':
        if (hasMeta) {
          Errsole.meta(winstonMeta).info(parsedMessage);
        } else {
          Errsole.info(parsedMessage);
        }
        break;
      case 'debug':
        if (hasMeta) {
          Errsole.meta(winstonMeta).debug(parsedMessage);
        } else {
          Errsole.debug(parsedMessage);
        }
        break;
      default:
        if (hasMeta) {
          Errsole.meta(winstonMeta).info(`[${level.toUpperCase()}] ${parsedMessage}`);
        } else {
          Errsole.info(`[${level.toUpperCase()}] ${parsedMessage}`);
        }
        break;
    }

    this.emit('logged', info);

    if (callback) {
      callback(null, true);
    }
  }
};
