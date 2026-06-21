package ai.luciq.reactlibrary;


import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import ai.luciq.library.OnSessionReplayLinkReady;
import ai.luciq.library.SessionSyncListener;
import ai.luciq.library.sessionreplay.SessionReplay;
import ai.luciq.library.sessionreplay.model.SessionMetadata;
import ai.luciq.reactlibrary.utils.EventEmitterModule;
import ai.luciq.reactlibrary.utils.LuciqRNDebugTags;
import ai.luciq.reactlibrary.utils.LuciqRNLogger;
import ai.luciq.reactlibrary.utils.MainThreadHandler;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;

import javax.annotation.Nonnull;

public class RNLuciqSessionReplayModule extends EventEmitterModule {

    private static final String TAG = LuciqRNDebugTags.SESSION_REPLAY;

    public RNLuciqSessionReplayModule(ReactApplicationContext reactApplicationContext) {
        super(reactApplicationContext);
    }

    @ReactMethod
    public void addListener(String event) {
        super.addListener(event);
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        super.removeListeners(count);
    }

    @Nonnull
    @Override
    public String getName() {
        return "LCQSessionReplay";
    }

    @ReactMethod
    public void setEnabled(final boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setEnabled] called isEnabled=" + isEnabled);
                try {
                    SessionReplay.setEnabled(isEnabled);
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[setEnabled] failed", e);
                }
            }
        });
    }

    @ReactMethod
    public void setNetworkLogsEnabled(final boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setNetworkLogsEnabled] called isEnabled=" + isEnabled);
                try {
                    SessionReplay.setNetworkLogsEnabled(isEnabled);
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[setNetworkLogsEnabled] failed", e);
                }
            }
        });
    }


    @ReactMethod
    public void setLuciqLogsEnabled(final boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setLuciqLogsEnabled] called isEnabled=" + isEnabled);
                try {
                    SessionReplay.setLuciqLogsEnabled(isEnabled);
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[setLuciqLogsEnabled] failed", e);
                }
            }
        });
    }

    @ReactMethod
    public void setUserStepsEnabled(final boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setUserStepsEnabled] called isEnabled=" + isEnabled);
                try {
                    SessionReplay.setUserStepsEnabled(isEnabled);
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[setUserStepsEnabled] failed", e);
                }
            }
        });
    }

    @ReactMethod
    public void getSessionReplayLink(final Promise promise) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[getSessionReplayLink] called");
                SessionReplay.getSessionReplayLink(new OnSessionReplayLinkReady() {
                    @Override
                    public void onSessionReplayLinkReady(@Nullable String link) {
                        LuciqRNLogger.d(TAG, "[getSessionReplayLink] success link=" + LuciqRNLogger.redactUrl(link));
                        promise.resolve(link);
                    }
                });
            }
        });

    }

    public ReadableMap getSessionMetadataMap(SessionMetadata sessionMetadata){
        WritableMap params = Arguments.createMap();
        params.putString("appVersion",sessionMetadata.getAppVersion());
        params.putString("OS",sessionMetadata.getOs());
        params.putString("device",sessionMetadata.getDevice());
        params.putDouble("sessionDurationInSeconds",(double)sessionMetadata.getSessionDurationInSeconds());
        params.putBoolean("hasLinkToAppReview",sessionMetadata.getLinkedToReview());
        params.putArray("networkLogs",getNetworkLogsArray(sessionMetadata.getNetworkLogs()));

        String launchType = sessionMetadata.getLaunchType();
        Long launchDuration = sessionMetadata.getLaunchDuration();

        if (launchType != null) {
            params.putString("launchType",ArgsRegistry.launchTypeReversed.get(sessionMetadata.getLaunchType()) );
        } else {
            params.putString("launchType",ArgsRegistry.launchType.get("unknown"));
        }

        if (launchDuration != null) {
            params.putDouble("launchDuration", (double)launchDuration);
        } else {
            params.putDouble("launchDuration", 0.0);
        }

        return params;
    }

    public ReadableArray getNetworkLogsArray(List<SessionMetadata.NetworkLog> networkLogList ) {
        WritableArray networkLogs = Arguments.createArray();

        if (networkLogList != null) {
            for (SessionMetadata.NetworkLog log : networkLogList) {
                WritableMap networkLog = Arguments.createMap();
                networkLog.putString("url", log.getUrl());
                networkLog.putDouble("duration", log.getDuration());
                networkLog.putInt("statusCode", log.getStatusCode());

                networkLogs.pushMap(networkLog);
            }
        }

        return networkLogs;
    }

    private boolean shouldSync = true;
    private CountDownLatch latch;
    @ReactMethod
    public void setSyncCallback() {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setSyncCallback] called");
                try {
                    SessionReplay.setSyncCallback(new SessionSyncListener() {
                        @Override
                        public boolean onSessionReadyToSync(@NonNull SessionMetadata sessionMetadata) {
                            LuciqRNLogger.d(TAG, "[" + Constants.LCQ_SESSION_REPLAY_ON_SYNC_CALLBACK_INVOCATION + "] emitted");
                            sendEvent(Constants.LCQ_SESSION_REPLAY_ON_SYNC_CALLBACK_INVOCATION,getSessionMetadataMap(sessionMetadata));

                            latch = new CountDownLatch(1);

                            try {
                                latch.await();
                            } catch (InterruptedException e) {
                                LuciqRNLogger.e(TAG, "[setSyncCallback] latch await interrupted", e);
                                return true;
                            }

                            return shouldSync;
                        }
                    });
                }
                catch(Exception e){
                    LuciqRNLogger.e(TAG, "[setSyncCallback] failed", e);
                }

            }
        });
    }

    @ReactMethod
    public void evaluateSync(boolean result) {
        LuciqRNLogger.d(TAG, "[evaluateSync] called result=" + result);
        shouldSync = result;

        if (latch != null) {
            latch.countDown();
        }
    }

    @ReactMethod
    public void setCapturingMode(final String mode) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setCapturingMode] called mode=" + mode);
                try {
                    Integer capturingMode = ArgsRegistry.capturingModes.get(mode);
                    if (capturingMode != null) {
                        SessionReplay.setCapturingMode(capturingMode);
                    } else {
                        LuciqRNLogger.w(TAG, "[setCapturingMode] invalid capturing mode: " + mode);
                    }
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[setCapturingMode] failed", e);
                }
            }
        });
    }

    @ReactMethod
    public void setScreenshotQuality(final String quality) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setScreenshotQuality] called quality=" + quality);
                try {
                    Integer screenshotQuality = ArgsRegistry.screenshotQualities.get(quality);
                    if (screenshotQuality != null) {
                        SessionReplay.setScreenshotQuality(screenshotQuality);
                    } else {
                        LuciqRNLogger.w(TAG, "[setScreenshotQuality] invalid screenshot quality: " + quality);
                    }
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[setScreenshotQuality] failed", e);
                }
            }
        });
    }

    @ReactMethod
    public void setScreenshotCaptureInterval(final int intervalMs) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setScreenshotCaptureInterval] called intervalMs=" + intervalMs);
                try {
                    SessionReplay.setScreenshotCaptureInterval(intervalMs);
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[setScreenshotCaptureInterval] failed", e);
                }
            }
        });
    }

}
