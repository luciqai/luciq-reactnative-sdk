import { Platform } from 'react-native';

import { NativeLuciq } from '../native/NativeLuciq';

interface LogInfo {
  log: string;
  type: 'verbose' | 'debug' | 'warn' | 'info' | 'error';
}

interface FileAttachmentInfo {
  file: string;
  type: 'url' | 'data';
}

export default class Report {
  constructor(
    public tags: string[] = [],
    public consoleLogs: string[] = [],
    public luciqLogs: LogInfo[] = [],
    public userAttributes: Record<string, string> = {},
    public fileAttachments: FileAttachmentInfo[] = [],
  ) {}

  /**
   * Append a tag to the report to be sent.
   * @param tag
   */
  appendTag(tag: string) {
    NativeLuciq.appendTagToReport(tag);
    this.tags = [...this.tags, tag];
  }

  /**
   * Append a console log to the report to be sent.
   * @param consoleLog
   */
  appendConsoleLog(consoleLog: string) {
    NativeLuciq.appendConsoleLogToReport(consoleLog);
    this.consoleLogs = [...this.consoleLogs, consoleLog];
  }

  /**
   * Add a user attribute with key and value to the report to be sent.
   * @param key
   * @param value
   */
  setUserAttribute(key: string, value: string) {
    NativeLuciq.setUserAttributeToReport(key, value);
    this.userAttributes[key] = value;
  }

  /**
   * Attach debug log to the report to be sent.
   * @param log
   */
  logDebug(log: string) {
    NativeLuciq.logDebugToReport(log);
    this.luciqLogs = [...this.luciqLogs, { log: log, type: 'debug' }];
  }

  /**
   * Attach verbose log to the report to be sent.
   * @param log
   */
  logVerbose(log: string) {
    NativeLuciq.logVerboseToReport(log);
    this.luciqLogs = [...this.luciqLogs, { log: log, type: 'verbose' }];
  }

  /**
   * Attach warn log to the report to be sent.
   * @param log
   */
  logWarn(log: string) {
    NativeLuciq.logWarnToReport(log);
    this.luciqLogs = [...this.luciqLogs, { log: log, type: 'warn' }];
  }

  /**
   * Attach error log to the report to be sent.
   * @param log
   */
  logError(log: string) {
    NativeLuciq.logErrorToReport(log);
    this.luciqLogs = [...this.luciqLogs, { log: log, type: 'error' }];
  }

  /**
   * Attach info log to the report to be sent.
   * @param log
   */
  logInfo(log: string) {
    NativeLuciq.logInfoToReport(log);
    this.luciqLogs = [...this.luciqLogs, { log: log, type: 'info' }];
  }

  /**
   * Attach a file to the report to be sent.
   * @param url
   * @param fileName
   */
  addFileAttachmentWithUrl(url: string, fileName: string) {
    if (Platform.OS === 'ios') {
      NativeLuciq.addFileAttachmentWithURLToReport(url);
    } else {
      NativeLuciq.addFileAttachmentWithURLToReport(url, fileName);
    }
    this.fileAttachments = [...this.fileAttachments, { file: url, type: 'url' }];
  }

  /**
   * Attach a file to the report to be sent.
   * @param data
   * @param fileName
   */
  addFileAttachmentWithData(data: string, fileName: string) {
    if (Platform.OS === 'ios') {
      NativeLuciq.addFileAttachmentWithDataToReport(data);
    } else {
      NativeLuciq.addFileAttachmentWithDataToReport(data, fileName);
    }
    this.fileAttachments = [...this.fileAttachments, { file: data, type: 'data' }];
  }
}
