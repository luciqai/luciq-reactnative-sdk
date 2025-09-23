import { Platform } from 'react-native';

import Report from '../../src/models/Report';
import { NativeLuciq } from '../../src/native/NativeLuciq';

describe('Report Model', () => {
  let report: Report;

  beforeEach(() => {
    const reportData = {
      tags: ['tag1', 'tag2'],
      consoleLogs: ['consoleLog'],
      luciqLogs: [{ log: 'message', type: 'debug' as const }],
      userAttributes: { age: '24' },
      fileAttachments: [{ file: 'path', type: 'url' as const }],
    };
    const { tags, consoleLogs, luciqLogs, userAttributes, fileAttachments } = reportData;
    report = new Report(tags, consoleLogs, luciqLogs, userAttributes, fileAttachments);
  });

  it('should call the native method appendTagToReport', () => {
    const tagsBefore = report.tags;
    const tag = 'tag3';
    report.appendTag(tag);

    expect(report.tags).toEqual([...tagsBefore, tag]);
    expect(NativeLuciq.appendTagToReport).toBeCalledTimes(1);
    expect(NativeLuciq.appendTagToReport).toBeCalledWith(tag);
  });

  it('should call the native method appendConsoleLogToReport', () => {
    const logsBefore = report.consoleLogs;
    const log = 'consoleLog2';
    report.appendConsoleLog(log);

    expect(report.consoleLogs).toEqual([...logsBefore, log]);
    expect(NativeLuciq.appendConsoleLogToReport).toBeCalledTimes(1);
    expect(NativeLuciq.appendConsoleLogToReport).toBeCalledWith(log);
  });

  it('should call the native method setUserAttributeToReport', () => {
    const key = 'company';
    const value = 'luciq';
    report.setUserAttribute(key, value);

    expect(report.userAttributes).toHaveProperty(key);
    expect(report.userAttributes[key]).toEqual(value);
    expect(NativeLuciq.setUserAttributeToReport).toBeCalledTimes(1);
    expect(NativeLuciq.setUserAttributeToReport).toBeCalledWith(key, value);
  });

  it('should call the native method logDebugToReport', () => {
    const logsBefore = report.luciqLogs;
    const message = 'this is a debug log';
    report.logDebug(message);

    expect(report.luciqLogs).toEqual([...logsBefore, { log: message, type: 'debug' }]);
    expect(NativeLuciq.logDebugToReport).toBeCalledTimes(1);
    expect(NativeLuciq.logDebugToReport).toBeCalledWith(message);
  });

  it('should call the native method logVerboseToReport', () => {
    const logsBefore = report.luciqLogs;
    const message = 'this is a verbose log';
    report.logVerbose(message);

    expect(report.luciqLogs).toEqual([...logsBefore, { log: message, type: 'verbose' }]);
    expect(NativeLuciq.logVerboseToReport).toBeCalledTimes(1);
    expect(NativeLuciq.logVerboseToReport).toBeCalledWith(message);
  });

  it('should call the native method logWarnToReport', () => {
    const logsBefore = report.luciqLogs;
    const message = 'this is a warn log';
    report.logWarn(message);

    expect(report.luciqLogs).toEqual([...logsBefore, { log: message, type: 'warn' }]);
    expect(NativeLuciq.logWarnToReport).toBeCalledTimes(1);
    expect(NativeLuciq.logWarnToReport).toBeCalledWith(message);
  });

  it('should call the native method logErrorToReport', () => {
    const logsBefore = report.luciqLogs;
    const message = 'this is a error log';
    report.logError(message);

    expect(report.luciqLogs).toEqual([...logsBefore, { log: message, type: 'error' }]);
    expect(NativeLuciq.logErrorToReport).toBeCalledTimes(1);
    expect(NativeLuciq.logErrorToReport).toBeCalledWith(message);
  });

  it('should call the native method logInfoToReport', () => {
    const logsBefore = report.luciqLogs;
    const message = 'this is a info log';
    report.logInfo(message);

    expect(report.luciqLogs).toEqual([...logsBefore, { log: message, type: 'info' }]);
    expect(NativeLuciq.logInfoToReport).toBeCalledTimes(1);
    expect(NativeLuciq.logInfoToReport).toBeCalledWith(message);
  });

  it('should call the native method addFileAttachmentWithURLToReport when platform is ios', () => {
    Platform.OS = 'ios';
    const filesBefore = report.fileAttachments;
    const file = 'path/to/file';
    const fileName = 'fileName';
    report.addFileAttachmentWithUrl(file, fileName);

    expect(report.fileAttachments).toEqual([...filesBefore, { file: file, type: 'url' }]);
    expect(NativeLuciq.addFileAttachmentWithURLToReport).toBeCalledTimes(1);
    expect(NativeLuciq.addFileAttachmentWithURLToReport).toBeCalledWith(file);
  });

  it('should call the native method addFileAttachmentWithURLToReport when platform is android', () => {
    Platform.OS = 'android';
    const filesBefore = report.fileAttachments;
    const file = 'path/to/file';
    const fileName = 'fileName';
    report.addFileAttachmentWithUrl(file, fileName);

    expect(report.fileAttachments).toEqual([...filesBefore, { file: file, type: 'url' }]);
    expect(NativeLuciq.addFileAttachmentWithURLToReport).toBeCalledTimes(1);
    expect(NativeLuciq.addFileAttachmentWithURLToReport).toBeCalledWith(file, fileName);
  });

  it('should call the native method addFileAttachmentWithDataToReport when platform is ios', () => {
    Platform.OS = 'ios';
    const filesBefore = report.fileAttachments;
    const file = 'fileData';
    const fileName = 'fileName';
    report.addFileAttachmentWithData(file, fileName);

    expect(report.fileAttachments).toEqual([...filesBefore, { file: file, type: 'data' }]);
    expect(NativeLuciq.addFileAttachmentWithDataToReport).toBeCalledTimes(1);
    expect(NativeLuciq.addFileAttachmentWithDataToReport).toBeCalledWith(file);
  });

  it('should call the native method addFileAttachmentWithDataToReport when platform is android', () => {
    Platform.OS = 'android';
    const filesBefore = report.fileAttachments;
    const file = 'fileData';
    const fileName = 'fileName';
    report.addFileAttachmentWithData(file, fileName);

    expect(report.fileAttachments).toEqual([...filesBefore, { file: file, type: 'data' }]);
    expect(NativeLuciq.addFileAttachmentWithDataToReport).toBeCalledTimes(1);
    expect(NativeLuciq.addFileAttachmentWithDataToReport).toBeCalledWith(file, fileName);
  });
});
