import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, LogLevel } from '../utils/logger.js';

describe('Logger', () => {
  let consoleSpy: {
    error: any;
    warn: any;
    info: any;
    debug: any;
  };

  beforeEach(() => {
    consoleSpy = {
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('error', () => {
    it('should log error messages', () => {
      const message = 'Test error message';
      logger.error(message);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining(`${LogLevel.ERROR}: ${message}`)
      );
    });

    it('should log error messages with metadata', () => {
      const message = 'Test error message';
      const meta = { userId: 123, action: 'test' };
      logger.error(message, meta);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining(
          `${LogLevel.ERROR}: ${message} ${JSON.stringify(meta)}`
        )
      );
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      const message = 'Test warning message';
      logger.warn(message);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining(`${LogLevel.WARN}: ${message}`)
      );
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      const message = 'Test info message';
      logger.info(message);

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining(`${LogLevel.INFO}: ${message}`)
      );
    });
  });

  describe('debug', () => {
    it('should log debug messages in development', () => {
      const message = 'Test debug message';
      logger.debug(message);

      // Debug logging depends on NODE_ENV, which is 'test' during testing
      // In test environment, debug messages should not be logged
      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });
  });

  describe('message formatting', () => {
    it('should include timestamp in log messages', () => {
      const message = 'Test message';
      logger.info(message);

      const loggedMessage = consoleSpy.info.mock.calls[0][0];
      expect(loggedMessage).toMatch(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/
      );
    });

    it('should format messages consistently', () => {
      const message = 'Test message';
      logger.info(message);

      const loggedMessage = consoleSpy.info.mock.calls[0][0];
      expect(loggedMessage).toMatch(/^\[.+\] INFO: Test message$/);
    });
  });
});
