import * as SessionReplay from '../../src/modules/SessionReplay';
import { NativeSessionReplay, emitter, NativeEvents } from '../../src/native/NativeSessionReplay';
import { CapturingMode, ScreenshotQuality } from '../../src/utils/Enums';

describe('Session Replay Module', () => {
  it('should call the native method setEnabled', () => {
    SessionReplay.setEnabled(true);

    expect(NativeSessionReplay.setEnabled).toBeCalledTimes(1);
    expect(NativeSessionReplay.setEnabled).toBeCalledWith(true);
  });

  it('should call the native method setNetworkLogsEnabled', () => {
    SessionReplay.setNetworkLogsEnabled(true);

    expect(NativeSessionReplay.setNetworkLogsEnabled).toBeCalledTimes(1);
    expect(NativeSessionReplay.setNetworkLogsEnabled).toBeCalledWith(true);
  });

  it('should call the native method setLuciqLogsEnabled', () => {
    SessionReplay.setLuciqLogsEnabled(true);

    expect(NativeSessionReplay.setLuciqLogsEnabled).toBeCalledTimes(1);
    expect(NativeSessionReplay.setLuciqLogsEnabled).toBeCalledWith(true);
  });

  it('should call the native method setUserStepsEnabled', () => {
    SessionReplay.setUserStepsEnabled(true);

    expect(NativeSessionReplay.setUserStepsEnabled).toBeCalledTimes(1);
    expect(NativeSessionReplay.setUserStepsEnabled).toBeCalledWith(true);
  });

  it('should call the native method getSessionReplayLink', () => {
    SessionReplay.getSessionReplayLink();

    expect(NativeSessionReplay.getSessionReplayLink).toBeCalledTimes(1);
    expect(NativeSessionReplay.getSessionReplayLink).toReturnWith('link');
  });

  it('should call the native method setSyncCallback', () => {
    const shouldSync = true;
    const callback = jest.fn().mockReturnValue(shouldSync);

    SessionReplay.setSyncCallback(callback);
    emitter.emit(NativeEvents.SESSION_REPLAY_ON_SYNC_CALLBACK_INVOCATION);

    expect(NativeSessionReplay.setSyncCallback).toBeCalledTimes(1);
    expect(emitter.listenerCount(NativeEvents.SESSION_REPLAY_ON_SYNC_CALLBACK_INVOCATION)).toBe(1);
    expect(NativeSessionReplay.evaluateSync).toBeCalledTimes(1);
    expect(NativeSessionReplay.evaluateSync).toBeCalledWith(shouldSync);
  });

  it('should call the native method setCapturingMode with navigation', () => {
    SessionReplay.setCapturingMode(CapturingMode.navigation);

    expect(NativeSessionReplay.setCapturingMode).toBeCalledTimes(1);
    expect(NativeSessionReplay.setCapturingMode).toBeCalledWith(CapturingMode.navigation);
  });

  it('should call the native method setCapturingMode with interactions', () => {
    SessionReplay.setCapturingMode(CapturingMode.interactions);

    expect(NativeSessionReplay.setCapturingMode).toBeCalledTimes(1);
    expect(NativeSessionReplay.setCapturingMode).toBeCalledWith(CapturingMode.interactions);
  });

  it('should call the native method setCapturingMode with frequency', () => {
    SessionReplay.setCapturingMode(CapturingMode.frequency);

    expect(NativeSessionReplay.setCapturingMode).toBeCalledTimes(1);
    expect(NativeSessionReplay.setCapturingMode).toBeCalledWith(CapturingMode.frequency);
  });

  it('should call the native method setScreenshotQuality with high', () => {
    SessionReplay.setScreenshotQuality(ScreenshotQuality.high);

    expect(NativeSessionReplay.setScreenshotQuality).toBeCalledTimes(1);
    expect(NativeSessionReplay.setScreenshotQuality).toBeCalledWith(ScreenshotQuality.high);
  });

  it('should call the native method setScreenshotQuality with normal', () => {
    SessionReplay.setScreenshotQuality(ScreenshotQuality.normal);

    expect(NativeSessionReplay.setScreenshotQuality).toBeCalledTimes(1);
    expect(NativeSessionReplay.setScreenshotQuality).toBeCalledWith(ScreenshotQuality.normal);
  });

  it('should call the native method setScreenshotQuality with greyscale', () => {
    SessionReplay.setScreenshotQuality(ScreenshotQuality.greyscale);

    expect(NativeSessionReplay.setScreenshotQuality).toBeCalledTimes(1);
    expect(NativeSessionReplay.setScreenshotQuality).toBeCalledWith(ScreenshotQuality.greyscale);
  });

  it('should call the native method setScreenshotCaptureInterval', () => {
    SessionReplay.setScreenshotCaptureInterval(1000);

    expect(NativeSessionReplay.setScreenshotCaptureInterval).toBeCalledTimes(1);
    expect(NativeSessionReplay.setScreenshotCaptureInterval).toBeCalledWith(1000);
  });

  it('should call the native method setScreenshotCaptureInterval with minimum value', () => {
    SessionReplay.setScreenshotCaptureInterval(500);

    expect(NativeSessionReplay.setScreenshotCaptureInterval).toBeCalledTimes(1);
    expect(NativeSessionReplay.setScreenshotCaptureInterval).toBeCalledWith(500);
  });
});
