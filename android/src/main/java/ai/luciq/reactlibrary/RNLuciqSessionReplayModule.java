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
import ai.luciq.reactlibrary.utils.MainThreadHandler;
import android.util.Log;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;

import javax.annotation.Nonnull;

public class RNLuciqSessionReplayModule extends RNLuciqSessionReplayBaseSpec {

    public RNLuciqSessionReplayModule(ReactApplicationContext reactApplicationContext) {
        super(reactApplicationContext);
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
                try {
                    SessionReplay.setEnabled(isEnabled);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    @ReactMethod
    public void setNetworkLogsEnabled(final boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    SessionReplay.setNetworkLogsEnabled(isEnabled);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }


    @ReactMethod
    public void setLuciqLogsEnabled(final boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    SessionReplay.setLuciqLogsEnabled(isEnabled);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    @ReactMethod
    public void setUserStepsEnabled(final boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    SessionReplay.setUserStepsEnabled(isEnabled);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    @ReactMethod
    public void getSessionReplayLink(final Promise promise) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                SessionReplay.getSessionReplayLink(new OnSessionReplayLinkReady() {
                    @Override
                    public void onSessionReplayLinkReady(@Nullable String link) {

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
    public void setSyncCallback(final Promise promise) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    SessionReplay.setSyncCallback(new SessionSyncListener() {
                        @Override
                        public boolean onSessionReadyToSync(@NonNull SessionMetadata sessionMetadata) {

                            sendEvent(Constants.LCQ_SESSION_REPLAY_ON_SYNC_CALLBACK_INVOCATION,getSessionMetadataMap(sessionMetadata));

                            latch = new CountDownLatch(1);

                            try {
                                latch.await();
                            } catch (InterruptedException e) {
                                e.printStackTrace();
                                return true;
                            }

                            return shouldSync;
                        }
                    });
                }
                catch(Exception e){
                    e.printStackTrace();
                }
                promise.resolve(null);
            }
        });
    }

    @ReactMethod
    public void evaluateSync(boolean result) {
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
                try {
                    Integer capturingMode = ArgsRegistry.capturingModes.get(mode);
                    if (capturingMode != null) {
                        SessionReplay.setCapturingMode(capturingMode);
                    } else {
                        Log.w("LCQSessionReplay", "Invalid capturing mode: " + mode);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    @ReactMethod
    public void setScreenshotQuality(final String quality) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    Integer screenshotQuality = ArgsRegistry.screenshotQualities.get(quality);
                    if (screenshotQuality != null) {
                        SessionReplay.setScreenshotQuality(screenshotQuality);
                    } else {
                        Log.w("LCQSessionReplay", "Invalid screenshot quality: " + quality);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    @ReactMethod
    public void setScreenshotCaptureInterval(final double intervalMs) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    SessionReplay.setScreenshotCaptureInterval((int) intervalMs);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

}
