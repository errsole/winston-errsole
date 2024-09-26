const Transport = require('winston-transport');
const ErrsoleWinston = require('../lib/index');
const errsole = require('errsole');
/* globals expect, jest, beforeEach, it, describe,beforeAll, afterAll, afterEach */

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
