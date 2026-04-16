import '../mocks/mockNativeModules';

import { Logger } from '../../src/utils/logger';
import { LuciqRNConfig } from '../../src/utils/config';
import { LogLevel } from '../../src/utils/Enums';

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set to verbose so all log levels are active
    LuciqRNConfig.debugLogsLevel = LogLevel.verbose;
  });

  afterEach(() => {
    LuciqRNConfig.debugLogsLevel = LogLevel.error;
  });

  it('should call console.error when Logger.error is called', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    Logger.error('test error');
    expect(spy).toHaveBeenCalledWith('test error');
    spy.mockRestore();
  });

  it('should call console.info when Logger.info is called', () => {
    const spy = jest.spyOn(console, 'info').mockImplementation();
    Logger.info('test info');
    expect(spy).toHaveBeenCalledWith('test info');
    spy.mockRestore();
  });

  it('should call console.log when Logger.log is called', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    Logger.log('test log');
    expect(spy).toHaveBeenCalledWith('test log');
    spy.mockRestore();
  });

  it('should call console.warn when Logger.warn is called', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation();
    Logger.warn('test warn');
    expect(spy).toHaveBeenCalledWith('test warn');
    spy.mockRestore();
  });

  it('should call console.trace when Logger.trace is called', () => {
    const spy = jest.spyOn(console, 'trace').mockImplementation();
    Logger.trace('test trace');
    expect(spy).toHaveBeenCalledWith('test trace');
    spy.mockRestore();
  });

  it('should call console.debug when Logger.debug is called', () => {
    const spy = jest.spyOn(console, 'debug').mockImplementation();
    Logger.debug('test debug');
    expect(spy).toHaveBeenCalledWith('test debug');
    spy.mockRestore();
  });

  it('should not log when log level is none', () => {
    LuciqRNConfig.debugLogsLevel = LogLevel.none;

    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const infoSpy = jest.spyOn(console, 'info').mockImplementation();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    Logger.error('error');
    Logger.info('info');
    Logger.warn('warn');

    expect(errorSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
    infoSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('should only log errors when log level is error', () => {
    LuciqRNConfig.debugLogsLevel = LogLevel.error;

    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const infoSpy = jest.spyOn(console, 'info').mockImplementation();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    Logger.error('error');
    Logger.info('info');
    Logger.warn('warn');

    expect(errorSpy).toHaveBeenCalledWith('error');
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
    infoSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('should pass optional parameters to log methods', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    Logger.error('error', 'param1', 'param2');
    expect(spy).toHaveBeenCalledWith('error', 'param1', 'param2');
    spy.mockRestore();
  });
});
