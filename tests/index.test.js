const Transport = require('winston-transport');
const ErrsoleWinston = require('../lib/index');
const errsole = require('errsole');
/* globals expect, jest, beforeEach, it, describe,  afterEach */

// Mock the entire errsole module to prevent any internal async operations
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

describe('ErrsoleWinston Transport', () => {
  let transport;
  let emitMock;
  let originalConsoleError;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // Mock timers globally
    jest.spyOn(global, 'setTimeout'); // Spy on setTimeout
    jest.spyOn(global, 'clearTimeout'); // Spy on clearTimeout

    // Suppress console errors
    originalConsoleError = console.error;
    console.error = jest.fn();

    // Initialize transport
    transport = new ErrsoleWinston();
    emitMock = jest.spyOn(transport, 'emit');
  });

  afterEach(() => {
    // Remove all event listeners to prevent open handles
    process.removeAllListeners();

    // Clear timers and restore console.error
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

describe('ErrsoleWinston Transport - log function', () => {
  let transport;
  let emitMock;
  let originalConsoleError;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // Use modern fake timers
    jest.spyOn(global, 'setTimeout'); // Spy on setTimeout
    jest.spyOn(global, 'clearTimeout'); // Spy on clearTimeout

    // Suppress console errors
    originalConsoleError = console.error;
    console.error = jest.fn();

    // Initialize transport
    transport = new ErrsoleWinston();
    emitMock = jest.spyOn(transport, 'emit');
  });

  afterEach(() => {
    process.removeAllListeners(); // Remove all event listeners
    jest.clearAllTimers(); // Clear timers
    console.error = originalConsoleError; // Restore console.error
  });

  it('should emit "logged" after log is processed', () => {
    const logInfo = {
      level: 'info',
      message: 'Test info message',
      meta: { some: 'meta' }
    };

    transport.log(logInfo);

    jest.advanceTimersByTime(0); // Advance timers to trigger setImmediate

    expect(emitMock).toHaveBeenCalledWith('logged', logInfo);
  });

  it('should call the callback if provided', (done) => {
    const logInfo = {
      level: 'info',
      message: 'Test info message'
    };

    const callback = jest.fn(() => {
      expect(callback).toHaveBeenCalled();
      done();
    });

    transport.log(logInfo, callback);

    jest.advanceTimersByTime(0); // Advance timers to execute setImmediate
  });

  it('should call the default callback if none is provided', () => {
    const logInfo = {
      level: 'info',
      message: 'Test info message'
    };

    transport.log(logInfo);

    jest.advanceTimersByTime(0); // Advance timers to execute setImmediate

    expect(emitMock).toHaveBeenCalledWith('logged', logInfo);
  });

  // **Test Case 1: Correct Assignment of errsoleLogLevel for Valid Log Levels**
  it.each([
    ['error', 'error'],
    ['warn', 'warn'],
    ['info', 'info'],
    ['http', 'info'],
    ['verbose', 'info'],
    ['debug', 'debug'],
    ['silly', 'debug']
  ])('should assign errsoleLogLevel correctly for log level "%s"', (logLevel, expectedErrsoleLevel) => {
    const logInfo = {
      level: logLevel,
      message: `Test message for level ${logLevel}`
    };

    transport.log(logInfo);

    jest.advanceTimersByTime(0); // Trigger setImmediate

    // Since log.meta is truthy ('{}'), errsole.meta is called
    expect(errsole.meta).toHaveBeenCalledWith('{}');

    // Retrieve the mocked meta object
    const mockedMeta = errsole.meta.mock.results[0].value;

    // Assert that the correct errsole method was called with the message
    expect(mockedMeta[expectedErrsoleLevel]).toHaveBeenCalledWith(`Test message for level ${logLevel}`);
  });

  // **Test Case 2: Default errsoleLogLevel to 'info' for Undefined Log Levels**
  it('should default errsoleLogLevel to "info" for undefined log levels', () => {
    const logInfo = {
      level: 'unknown',
      message: 'Test message for undefined log level'
    };

    transport.log(logInfo);

    jest.advanceTimersByTime(0); // Trigger setImmediate

    // errsoleLogLevel should default to 'info'
    expect(errsole.meta).toHaveBeenCalledWith('{}');

    // Retrieve the mocked meta object
    const mockedMeta = errsole.meta.mock.results[0].value;

    // Assert that errsole.info was called with the message
    expect(mockedMeta.info).toHaveBeenCalledWith('Test message for undefined log level');
  });

  // **Test Case 3: Type Check for errsole[errsoleLogLevel] - Function Exists**
  it('should call errsole[errsoleLogLevel](log.message) when it is a function', () => {
    const logInfo = {
      level: 'debug',
      message: 'Test debug message'
    };

    transport.log(logInfo);

    jest.advanceTimersByTime(0); // Trigger setImmediate

    // Since 'debug' maps to 'debug', and errsole.debug is a mock function
    expect(errsole.meta).toHaveBeenCalledWith('{}');
    const mockedMeta = errsole.meta.mock.results[0].value;
    expect(mockedMeta.debug).toHaveBeenCalledWith('Test debug message');
  });

  // **Test Case 4: Type Check for errsole[errsoleLogLevel] - Function Does Not Exist**
  it('should not call errsole.meta or errsole[errsoleLogLevel] when errsole[errsoleLogLevel] is not a function', () => {
    const logInfo = {
      level: 'custom', // 'custom' is not defined in levelMapping
      message: 'Test custom message'
    };

    // Extend levelMapping for this test case to include 'custom' mapping to 'nonFunction'
    transport.levelMapping.custom = 'nonFunction';

    // Mock errsole.nonFunction to be a non-function (e.g., a string)
    errsole.nonFunction = 'I am not a function';

    transport.log(logInfo);

    jest.advanceTimersByTime(0); // Trigger setImmediate

    // Assert that errsole.meta was NOT called since errsoleLogLevel is not a function
    expect(errsole.meta).not.toHaveBeenCalled();

    // Assert that the 'logged' event was emitted
    expect(emitMock).toHaveBeenCalledWith('logged', logInfo);
  });

  // **Test Case 5: Callback Handling - When Callback is Provided**
  it('should call the provided callback after logging', (done) => {
    const logInfo = {
      level: 'info',
      message: 'Test info message with callback'
    };

    const callback = jest.fn(() => {
      expect(callback).toHaveBeenCalled();
      done();
    });

    transport.log(logInfo, callback);

    jest.advanceTimersByTime(0); // Trigger setImmediate

    // Ensure that the callback is called
    expect(callback).toHaveBeenCalled();
  });

  // **Test Case 6: Callback Handling - When No Callback is Provided**
  it('should use the default callback when none is provided', () => {
    const logInfo = {
      level: 'info',
      message: 'Test info message without callback'
    };

    transport.log(logInfo);

    jest.advanceTimersByTime(0); // Trigger setImmediate

    // Since no callback is provided, default callback is a no-op
    // The main assertion is that 'logged' event was emitted
    expect(emitMock).toHaveBeenCalledWith('logged', logInfo);
  });

  // **Test Case 7: Direct Invocation of errsole[errsoleLogLevel](log.message) When log.meta is Falsy**
  it('should call errsole[errsoleLogLevel] directly when log.meta is falsy', () => {
    // Save the original JSON.stringify
    const originalJSONStringify = JSON.stringify;

    // Mock JSON.stringify to return an empty string when called with an empty object
    const stringifyMock = jest.spyOn(JSON, 'stringify').mockImplementation((obj) => {
      if (Object.keys(obj).length === 0) return ''; // Falsy value
      return originalJSONStringify(obj);
    });

    const logInfo = {
      level: 'info',
      message: 'Test info message without meta'
    };

    transport.log(logInfo);

    // Advance timers to trigger setImmediate
    jest.advanceTimersByTime(0);

    // Assert that errsole.meta was NOT called since log.meta is falsy
    expect(errsole.meta).not.toHaveBeenCalled();

    // Assert that errsole.info was called directly with the message
    expect(errsole.info).toHaveBeenCalledWith('Test info message without meta');

    // Restore the original JSON.stringify
    stringifyMock.mockRestore();
  });

  // **Test Case 8: Direct Invocation for Multiple Log Levels When log.meta is Falsy**
  it.each([
    ['error', 'error'],
    ['warn', 'warn'],
    ['info', 'info'],
    ['http', 'info'],
    ['verbose', 'info'],
    ['debug', 'debug'],
    ['silly', 'debug']
  ])('should call errsole["%s"] directly when log.meta is falsy', (logLevel, errsoleMethod) => {
    // Save the original JSON.stringify
    const originalJSONStringify = JSON.stringify;

    // Mock JSON.stringify to return an empty string when called with an empty object
    const stringifyMock = jest.spyOn(JSON, 'stringify').mockImplementation((obj) => {
      if (Object.keys(obj).length === 0) return ''; // Falsy value
      return originalJSONStringify(obj);
    });

    const logInfo = {
      level: logLevel,
      message: `Test message for level ${logLevel}`
    };

    transport.log(logInfo);

    // Advance timers to trigger setImmediate
    jest.advanceTimersByTime(0);

    // Assert that errsole.meta was NOT called since log.meta is falsy
    expect(errsole.meta).not.toHaveBeenCalled();

    // Assert that the correct errsole method was called with the message
    expect(errsole[errsoleMethod]).toHaveBeenCalledWith(`Test message for level ${logLevel}`);

    // Restore the original JSON.stringify
    stringifyMock.mockRestore();
  });

  // **Test Case 10: Error Handling When errsole.meta()[errsoleLogLevel] Throws an Error**
  it('should emit "error" event if errsole.meta()[errsoleLogLevel] throws an error', () => {
    const logInfo = {
      level: 'info',
      message: 'Test message that causes errsole.meta().info to throw',
      meta: { userId: 1 }
    };

    // Create a mock error
    const mockError = new Error('Errsole meta failure');

    // Mock errsole.meta to return an object where 'info' throws an error
    const mockedMeta = {
      info: jest.fn(() => { throw mockError; }),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
    errsole.meta.mockReturnValueOnce(mockedMeta);

    // Set up a spy for the 'error' event
    const errorSpy = jest.fn();
    transport.on('error', errorSpy);

    transport.log(logInfo);

    jest.advanceTimersByTime(0); // Trigger setImmediate

    // Assert that 'logged' event was emitted
    expect(emitMock).toHaveBeenCalledWith('logged', logInfo);

    // Assert that 'error' event was emitted with the mock error
    expect(errorSpy).toHaveBeenCalledWith(mockError);
  });
});
