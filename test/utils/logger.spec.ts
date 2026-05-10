import { Logger } from '../../src/utils/logger';
import { LuciqRNConfig } from '../../src/utils/config';
import { LogLevel } from '../../src/utils/Enums';

describe('Logger', () => {
  const originalLevel = LuciqRNConfig.debugLogsLevel;
  let errorSpy: jest.SpyInstance;
  let infoSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let traceSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
    infoSpy = jest.spyOn(console, 'info').mockImplementation();
    logSpy = jest.spyOn(console, 'log').mockImplementation();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    traceSpy = jest.spyOn(console, 'trace').mockImplementation();
    debugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    errorSpy.mockRestore();
    infoSpy.mockRestore();
    logSpy.mockRestore();
    warnSpy.mockRestore();
    traceSpy.mockRestore();
    debugSpy.mockRestore();
    LuciqRNConfig.debugLogsLevel = originalLevel;
  });

  describe('at LogLevel.verbose', () => {
    beforeEach(() => {
      LuciqRNConfig.debugLogsLevel = LogLevel.verbose;
    });

    it('Logger.error forwards to console.error', () => {
      Logger.error('boom', 1);
      expect(errorSpy).toHaveBeenCalledWith('boom', 1);
    });

    it('Logger.info forwards to console.info', () => {
      Logger.info('hello');
      expect(infoSpy).toHaveBeenCalledWith('hello');
    });

    it('Logger.log forwards to console.log', () => {
      Logger.log('msg');
      expect(logSpy).toHaveBeenCalledWith('msg');
    });

    it('Logger.warn forwards to console.warn', () => {
      Logger.warn('warn');
      expect(warnSpy).toHaveBeenCalledWith('warn');
    });

    it('Logger.trace forwards to console.trace', () => {
      Logger.trace('trace');
      expect(traceSpy).toHaveBeenCalledWith('trace');
    });

    it('Logger.debug forwards to console.debug', () => {
      Logger.debug('dbg');
      expect(debugSpy).toHaveBeenCalledWith('dbg');
    });
  });

  describe('at LogLevel.debug', () => {
    beforeEach(() => {
      LuciqRNConfig.debugLogsLevel = LogLevel.debug;
    });

    it('Logger.warn/trace/debug forward to their console methods', () => {
      Logger.warn('w');
      Logger.trace('t');
      Logger.debug('d');
      expect(warnSpy).toHaveBeenCalledWith('w');
      expect(traceSpy).toHaveBeenCalledWith('t');
      expect(debugSpy).toHaveBeenCalledWith('d');
    });

    it('Logger.info is suppressed at debug level (verbose only)', () => {
      Logger.info('hidden');
      expect(infoSpy).not.toHaveBeenCalled();
    });

    it('Logger.error still passes through', () => {
      Logger.error('e');
      expect(errorSpy).toHaveBeenCalledWith('e');
    });
  });

  describe('at LogLevel.error', () => {
    beforeEach(() => {
      LuciqRNConfig.debugLogsLevel = LogLevel.error;
    });

    it('only Logger.error is emitted', () => {
      Logger.error('e');
      Logger.warn('w');
      Logger.info('i');
      Logger.log('l');
      Logger.trace('t');
      Logger.debug('d');

      expect(errorSpy).toHaveBeenCalledWith('e');
      expect(warnSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
      expect(traceSpy).not.toHaveBeenCalled();
      expect(debugSpy).not.toHaveBeenCalled();
    });
  });

  describe('at LogLevel.none', () => {
    beforeEach(() => {
      LuciqRNConfig.debugLogsLevel = LogLevel.none;
    });

    it('suppresses every level including error', () => {
      Logger.error('e');
      Logger.warn('w');
      Logger.info('i');
      Logger.log('l');
      Logger.trace('t');
      Logger.debug('d');

      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
      expect(traceSpy).not.toHaveBeenCalled();
      expect(debugSpy).not.toHaveBeenCalled();
    });
  });

  it('passes optional params through to the underlying console method', () => {
    LuciqRNConfig.debugLogsLevel = LogLevel.verbose;
    const obj = { a: 1 };
    Logger.error('msg', obj, 42);
    expect(errorSpy).toHaveBeenCalledWith('msg', obj, 42);
  });
});
