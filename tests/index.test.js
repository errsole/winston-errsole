// tests/index.test.js

const Transport = require('winston-transport');
const WinstonErrsole = require('../lib/index');
const errsole = require('errsole');

/* globals expect, jest, beforeEach, it, describe, afterEach */

jest.mock('errsole', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  meta: jest.fn(() => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }))
}));

describe('WinstonErrsole Transport', () => {
  let transport;
  let originalConsoleError;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(global, 'setTimeout');
    jest.spyOn(global, 'clearTimeout');

    // Suppress console errors
    originalConsoleError = console.error;
    console.error = jest.fn();

    // Initialize transport
    transport = new WinstonErrsole();
  });

  afterEach(() => {
    process.removeAllListeners();

    jest.clearAllTimers();
    console.error = originalConsoleError;
  });

  it('should extend winston-transport', () => {
    expect(transport).toBeInstanceOf(Transport);
  });

  it('should initialize with default levelMapping', () => {
    expect(transport.levelMapping).toEqual({
      error: 'error',
      warn: 'warn',
      info: 'info',
      http: 'info',
      verbose: 'info',
      debug: 'debug',
      silly: 'debug'
    });
  });
});

describe('WinstonErrsole Transport - log function', () => {
  let transport;
  let emitMock;
  let originalConsoleError;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(global, 'setTimeout');
    jest.spyOn(global, 'clearTimeout');

    // Suppress console errors
    originalConsoleError = console.error;
    console.error = jest.fn();

    // Initialize transport
    transport = new WinstonErrsole();
    emitMock = jest.spyOn(transport, 'emit');
  });

  afterEach(() => {
    process.removeAllListeners();
    jest.clearAllTimers(); // Clear timers
    console.error = originalConsoleError; // Restore console.error
  });

  it('should emit "logged" after log is processed', () => {
    const logInfo = {
      level: 'info',
      message: 'Test info message',
      meta: { some: 'meta' } // Include meta
    };
    transport.log(logInfo);
    jest.advanceTimersByTime(0);
    expect(emitMock).toHaveBeenCalledWith('logged', logInfo);
  });

  it('should call the callback if provided', (done) => {
    const logInfo = {
      level: 'info',
      message: 'Test info message',
      meta: {} // Include meta
    };
    const callback = jest.fn(() => {
      expect(callback).toHaveBeenCalled();
      done();
    });
    transport.log(logInfo, callback);
    jest.advanceTimersByTime(0);
  });

  it('should call the default callback if none is provided', () => {
    const logInfo = {
      level: 'info',
      message: 'Test info message',
      meta: {} // Include meta
    };
    transport.log(logInfo);
    jest.advanceTimersByTime(0);
    expect(emitMock).toHaveBeenCalledWith('logged', logInfo);
  });

  it('should not call errsole.meta or errsole[errsoleLogLevel] when errsole[errsoleLogLevel] is not a function', () => {
    const logInfo = {
      level: 'custom',
      message: 'Test custom message',
      meta: {} // Include meta to maintain consistency
    };
    transport.levelMapping.custom = 'nonFunction';
    errsole.nonFunction = 'I am not a function';
    transport.log(logInfo);
    jest.advanceTimersByTime(0);
    expect(errsole.meta).not.toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith('logged', logInfo);
  });

  it('should call the provided callback after logging', (done) => {
    const logInfo = {
      level: 'info',
      message: 'Test info message with callback',
      meta: {} // Include meta
    };
    const callback = jest.fn(() => {
      expect(callback).toHaveBeenCalled();
      done();
    });
    transport.log(logInfo, callback);
    jest.advanceTimersByTime(0);
    expect(callback).toHaveBeenCalled();
  });

  it('should use the default callback when none is provided', () => {
    const logInfo = {
      level: 'info',
      message: 'Test info message without callback',
      meta: {} // Include meta
    };
    transport.log(logInfo);
    jest.advanceTimersByTime(0);
    expect(emitMock).toHaveBeenCalledWith('logged', logInfo);
  });

  it('should emit "error" event if errsole.meta()[errsoleLogLevel] throws an error', () => {
    const logInfo = {
      level: 'info',
      message: 'Test message that causes errsole.meta().info to throw',
      meta: { userId: 1 } // Include meta
    };
    // Create a mock error
    const mockError = new Error('Errsole meta failure');
    const mockedMeta = {
      info: jest.fn(() => { throw mockError; }),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
    errsole.meta.mockReturnValueOnce(mockedMeta);
    const errorSpy = jest.fn();
    transport.on('error', errorSpy);
    transport.log(logInfo);
    jest.advanceTimersByTime(0);
    expect(emitMock).toHaveBeenCalledWith('logged', logInfo);
    expect(errorSpy).toHaveBeenCalledWith(mockError);
  });

  it('should call errsole[errsoleLogLevel] directly when meta is not provided', () => {
    const logInfo = {
      level: 'info',
      message: 'Test info message without meta'
      // No meta field
    };
    transport.log(logInfo);
    jest.advanceTimersByTime(0);
    expect(errsole.meta).not.toHaveBeenCalled();
    expect(errsole.info).toHaveBeenCalledWith('Test info message without meta');
    expect(emitMock).toHaveBeenCalledWith('logged', logInfo);
  });
});
