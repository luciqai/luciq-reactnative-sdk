jest.mock('../../src/utils/LuciqUtils', () => {
  const actual = jest.requireActual('../../src/utils/LuciqUtils');

  return {
    ...actual,
    parseErrorStack: jest.fn(),
    captureJsErrors: jest.fn(),
    getActiveRouteName: jest.fn(),
    stringifyIfNotString: jest.fn(),
    sendCrashReport: jest.fn(),
    getStackTrace: jest.fn().mockReturnValue('javascriptStackTrace'),
    getFullRoute: jest.fn().mockImplementation(() => 'ScreenName'),
    reportNetworkLog: jest.fn(),
    isContentTypeNotAllowed: jest.fn(),
  };
});
