package ai.luciq.reactlibrary;

import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import ai.luciq.bug.BugReporting;
import ai.luciq.bug.invocation.Option;
import ai.luciq.library.Feature;
import ai.luciq.library.OnSdkDismissCallback;
import ai.luciq.library.extendedbugreport.ExtendedBugReport;
import ai.luciq.library.invocation.LuciqInvocationEvent;
import ai.luciq.library.invocation.OnInvokeCallback;
import ai.luciq.library.invocation.util.LuciqFloatingButtonEdge;
import ai.luciq.library.invocation.util.LuciqVideoRecordingButtonPosition;
import ai.luciq.reactlibrary.utils.ArrayUtil;
import ai.luciq.reactlibrary.utils.EventEmitterModule;
import ai.luciq.reactlibrary.utils.LuciqRNDebugTags;
import ai.luciq.reactlibrary.utils.LuciqRNLogger;
import ai.luciq.reactlibrary.utils.MainThreadHandler;
import ai.luciq.bug.userConsent.ActionType;
import java.util.ArrayList;
import ai.luciq.bug.ProactiveReportingConfigs;


import javax.annotation.Nonnull;

public class RNLuciqBugReportingModule extends EventEmitterModule {
    public RNLuciqBugReportingModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Nonnull
    @Override
    public String getName() {
        return "LCQBugReporting";
    }

    @ReactMethod
    public void addListener(String event) {
        super.addListener(event);
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        super.removeListeners(count);
    }

    /**
     * Enable or disable all BugReporting related features.
     * @param isEnabled boolean indicating enabled or disabled.
     */
    @ReactMethod
    public void setEnabled(final boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[setEnabled] called isEnabled=" + isEnabled);
                    if (isEnabled) {
                        BugReporting.setState(Feature.State.ENABLED);
                    } else {
                        BugReporting.setState(Feature.State.DISABLED);
                    }
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.BUG_REPORTING, "[setEnabled] failed", e);
                }
            }
        });

    }


    /**
     * Enable/Disable screen recording
     *
     * @param autoScreenRecordingEnabled boolean for enable/disable
     *                                   screen recording on crash feature
     */
    @TargetApi(21)
    @ReactMethod
    public void setAutoScreenRecordingEnabled(final boolean autoScreenRecordingEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[setAutoScreenRecordingEnabled] called autoScreenRecordingEnabled=" + autoScreenRecordingEnabled);
                    BugReporting.setAutoScreenRecordingEnabled(autoScreenRecordingEnabled);
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.BUG_REPORTING, "[setAutoScreenRecordingEnabled] failed", e);
                }
            }
        });
    }

    /**
     * Sets whether the extended bug report mode should be disabled,
     * enabled with required fields,  or enabled with optional fields.
     *
     * @param extendedBugReportMode
     */
    @ReactMethod
    public void setExtendedBugReportMode(final String extendedBugReportMode) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[setExtendedBugReportMode] called extendedBugReportMode=" + extendedBugReportMode);
                    final ExtendedBugReport.State parsedState = ArgsRegistry.extendedBugReportStates.get(extendedBugReportMode);
                    if (parsedState == null) return;
                    BugReporting.setExtendedBugReportState(parsedState);
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.BUG_REPORTING, "[setExtendedBugReportMode] failed", e);
                }
            }
        });
    }

    /**
     * Enables or disables view hierarchy in the dashboard.
     * @param isEnabled boolean indicating enabled or disabled.
     */
    @ReactMethod
    public void setViewHierarchyEnabled(final boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[setViewHierarchyEnabled] called isEnabled=" + isEnabled);
                    if (isEnabled) {
                        BugReporting.setViewHierarchyState(Feature.State.ENABLED);
                    } else {
                        BugReporting.setViewHierarchyState(Feature.State.DISABLED);
                    }
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.BUG_REPORTING, "[setViewHierarchyEnabled] failed", e);
                }
            }
        });
    }

    /**
     * Sets the default corner at which the video recording floating button will be shown
     *
     * @param corner corner to stick the video recording floating button to
     */
    @ReactMethod
    public void setVideoRecordingFloatingButtonPosition(final String corner) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[setVideoRecordingFloatingButtonPosition] called corner=" + corner);
                    final LuciqVideoRecordingButtonPosition parsedPosition = ArgsRegistry.recordButtonPositions.get(corner);
                    if (parsedPosition == null) return;
                    BugReporting.setVideoRecordingFloatingButtonPosition(parsedPosition);
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.BUG_REPORTING, "[setVideoRecordingFloatingButtonPosition] failed", e);
                }
            }
        });
    }

    /**
     * Sets whether attachments in bug reporting and in-app messaging are enabled or not.
     *
     * @param  screenshot A boolean to enable or disable screenshot attachments.
     * @param {boolean} extraScreenShot A boolean to enable or disable extra screenshot attachments.
     * @param {boolean} galleryImage A boolean to enable or disable gallery image attachments.
     * @param {boolean} screenRecording A boolean to enable or disable screen recording attachments.
     */
    @ReactMethod
    public void setEnabledAttachmentTypes(final boolean screenshot, final boolean extraScreenshot, final boolean
            galleryImage, final boolean screenRecording) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[setEnabledAttachmentTypes] called screenshot=" + screenshot + " extraScreenshot=" + extraScreenshot + " galleryImage=" + galleryImage + " screenRecording=" + screenRecording);
                    BugReporting.setAttachmentTypesEnabled(screenshot, extraScreenshot, galleryImage,
                            screenRecording);
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.BUG_REPORTING, "[setEnabledAttachmentTypes] failed", e);
                }
            }
        });
    }

    /**
     * Sets the event used to invoke Luciq SDK
     *
     * @param invocationEventValues the invocation event value
     * @see LuciqInvocationEvent
     */
    @ReactMethod
    public void setInvocationEvents(final ReadableArray invocationEventValues) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[setInvocationEvents] called present=" + (invocationEventValues != null));
                    final ArrayList<String> keys = ArrayUtil.parseReadableArrayOfStrings(invocationEventValues);
                    final ArrayList<LuciqInvocationEvent> parsedInvocationEvents = ArgsRegistry.invocationEvents.getAll(keys);
                    BugReporting.setInvocationEvents(parsedInvocationEvents.toArray(new LuciqInvocationEvent[0]));
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.BUG_REPORTING, "[setInvocationEvents] failed", e);
                }
            }
        });
    }

    /**
     * Sets the options for the features in the SDK
     *
     * @param optionValues the invocation option value
     */
    @ReactMethod
    public void setOptions(final ReadableArray optionValues) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @SuppressLint("WrongConstant")
            @Override
            public void run() {
                try {
                    LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[setOptions] called present=" + (optionValues != null));
                    final ArrayList<String> keys = ArrayUtil.parseReadableArrayOfStrings(optionValues);
                    final ArrayList<Integer> options = ArgsRegistry.invocationOptions.getAll(keys);

                    for (int i = 0; i < options.size(); i++) {
                        BugReporting.setOptions(options.get(i));
                    }

                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.BUG_REPORTING, "[setOptions] failed", e);
                }
            }
        });
    }

    /**
     * Sets a block of code to be executed just before the SDK's UI is presented.
     * This block is executed on the UI thread. Could be used for performing any
     * UI changes before the SDK's UI is shown.
     *
     * @param onInvokeHandler - A callback that gets executed before
     *                             invoking the SDK
     */
    @ReactMethod
    public void setOnInvokeHandler(final Callback onInvokeHandler) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[setOnInvokeHandler] called");
                    BugReporting.setOnInvokeCallback(new OnInvokeCallback() {
                        @Override
                        public void onInvoke() {
                            LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[" + Constants.LCQ_PRE_INVOCATION_HANDLER + "] emitted");
                            sendEvent(Constants.LCQ_PRE_INVOCATION_HANDLER, null);
                        }
                    });
                } catch (java.lang.Exception exception) {
                    LuciqRNLogger.e(LuciqRNDebugTags.BUG_REPORTING, "[setOnInvokeHandler] failed", exception);
                }
            }
        });
    }

    /**
     * Sets the position of the Luciq floating button on the screen.
     * @param floatingButtonEdge left or right edge of the screen.
     * @param floatingButtonOffset integer offset from the left or right edge of the screen.
     */
    @ReactMethod
    public void setFloatingButtonEdge(final String floatingButtonEdge, final int floatingButtonOffset) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[setFloatingButtonEdge] called floatingButtonEdge=" + floatingButtonEdge + " floatingButtonOffset=" + floatingButtonOffset);
                final LuciqFloatingButtonEdge parsedEdge = ArgsRegistry.floatingButtonEdges
                        .getOrDefault(floatingButtonEdge, LuciqFloatingButtonEdge.RIGHT);
                BugReporting.setFloatingButtonOffset(floatingButtonOffset);
                BugReporting.setFloatingButtonEdge(parsedEdge);
            }
        });
    }

    /**
     * Sets a block of code to be executed right after the SDK's UI is dismissed.
     * This block is executed on the UI thread. Could be used for performing any
     * UI changes after the SDK's UI is dismissed.
     *
     * @param handler - A callback to get executed after
     *                              dismissing the SDK.
     */
    @ReactMethod
    public void setOnSDKDismissedHandler(final Callback handler) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                try {
                    LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[setOnSDKDismissedHandler] called");
                    BugReporting.setOnDismissCallback(new OnSdkDismissCallback() {
                        @Override
                        public void call(DismissType dismissType, ReportType reportType) {
                            LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[" + Constants.LCQ_POST_INVOCATION_HANDLER + "] emitted");
                            WritableMap params = Arguments.createMap();
                            params.putString("dismissType", dismissType.toString());
                            params.putString("reportType", reportType.toString());
                            sendEvent(Constants.LCQ_POST_INVOCATION_HANDLER, params);
                        }
                    });
                } catch (java.lang.Exception exception) {
                    LuciqRNLogger.e(LuciqRNDebugTags.BUG_REPORTING, "[setOnSDKDismissedHandler] failed", exception);
                }
            }
        });
    }

    /**
     * Sets the threshold value of the shake gesture for android devices.
     * Default for android is an integer value equals 350.
     * you could increase the shaking difficulty level by
     * increasing the `350` value and vice versa.
     *
     * @param androidThreshold Threshold for android devices.
     */
    @ReactMethod
    public void setShakingThresholdForAndroid(final int androidThreshold) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[setShakingThresholdForAndroid] called androidThreshold=" + androidThreshold);
                try {
                    BugReporting.setShakingThreshold(androidThreshold);
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.BUG_REPORTING, "[setShakingThresholdForAndroid] failed", e);
                }
            }
        });
    }

    /**
     * Sets the enabled report types to be shown in the prompt. Bug or Feedback or both.
     * @param types
     * @see BugReporting.ReportType
     */
    @ReactMethod
    public void setReportTypes(final ReadableArray types) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @SuppressLint("WrongConstant")
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[setReportTypes] called typesCount=" + (types == null ? 0 : types.size()));
                try {
                    final ArrayList<String> keys = ArrayUtil.parseReadableArrayOfStrings(types);
                    final ArrayList<Integer> types = ArgsRegistry.reportTypes.getAll(keys);

                    final int[] typesInts = new int[types.size()];
                    for (int i = 0; i < types.size(); i++) {
                        typesInts[i] = types.get(i);
                    }

                    BugReporting.setReportTypes(typesInts);
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.BUG_REPORTING, "[setReportTypes] failed", e);
                }
            }
        });
    }

    /**
     * Shows a bug or feedback report with optional options.
     * @param reportType Bug or Feedback.
     * @param options array of options
     * @see BugReporting.ReportType
     * @see Option
     */
    @ReactMethod
    public void show(final String reportType, final ReadableArray options) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[show] called reportType=" + reportType + " optionsCount=" + (options == null ? 0 : options.size()));
                final Integer parsedReportType = ArgsRegistry.reportTypes.get(reportType);
                if (parsedReportType == null) return;
                BugReporting.show(parsedReportType);
                setOptions(options);
            }
        });
    }

    /**
    * Adds a disclaimer text within the bug reporting form, which can include hyperlinked text.
    * @param text String text.
    */
    @ReactMethod
    public void setDisclaimerText(final String text){
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[setDisclaimerText] called textLen=" + (text == null ? 0 : text.length()) + " present=" + (text != null));
                BugReporting.setDisclaimerText(text);
            }
        });
    }
    /**
    * Sets a minimum number of characters as a requirement for the comments field in the different report types.
    * @param limit int number of characters.
    * @param reportTypes (Optional) Array of reportType. If it's not passed, the limit will apply to all report types.
    */
    @ReactMethod
    public void setCommentMinimumCharacterCount(final int limit, final ReadableArray reportTypes){
        MainThreadHandler.runOnMainThread(new Runnable() {
            @SuppressLint("WrongConstant")
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[setCommentMinimumCharacterCount] called limit=" + limit + " reportTypesCount=" + (reportTypes == null ? 0 : reportTypes.size()));
                try {
                    final ArrayList<String> keys = ArrayUtil.parseReadableArrayOfStrings(reportTypes);
                    final ArrayList<Integer> types = ArgsRegistry.reportTypes.getAll(keys);

                    final int[] typesInts = new int[types.size()];
                    for (int i = 0; i < types.size(); i++) {
                        typesInts[i] = types.get(i);
                    }

                    BugReporting.setCommentMinimumCharacterCountForBugReportType(limit, typesInts);                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.BUG_REPORTING, "[setCommentMinimumCharacterCount] failed", e);
                }
            }
        });
    }

    /**
    * Adds a user consent item to the bug reporting
    * @param key A unique identifier string for the consent item.
    * @param description The text shown to the user describing the consent item.
    * @param mandatory Whether the user must agree to this item before submitting a report.
    * @param checked Whether the consent checkbox is pre-selected.
    * @param actionType A string representing the action type to map to SDK behavior.
    */
    @ReactMethod
    public void addUserConsent(String key, String description, boolean mandatory, boolean checked, @Nullable String actionType) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[addUserConsent] called keyLen=" + (key == null ? 0 : key.length()) + " descLen=" + (description == null ? 0 : description.length()) + " mandatory=" + mandatory + " checked=" + checked + " actionType=" + actionType);
                try {
                    String mappedActionType = ArgsRegistry.userConsentActionType.get(actionType);
                    BugReporting.addUserConsent(key, description, mandatory, checked, mappedActionType);
                } catch (Exception e) {
                    LuciqRNLogger.e(LuciqRNDebugTags.BUG_REPORTING, "[addUserConsent] failed", e);
                }
            }
    });

    }
 /**
     * prompts end users to submit their feedback after our SDK automatically detects a frustrating experience.
     *
     * @param enabled                  controls the state of the feature
     * @param modalDelayAfterDetection controls the time gap between detecting a frustrating experience
     * @param gapBetweenModals         controls the time gap between showing 2 proactive reporting dialogs in seconds
     */
    @ReactMethod
    public void setProactiveReportingConfigurations(final boolean enabled, final int gapBetweenModals, final int modalDelayAfterDetection) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(LuciqRNDebugTags.BUG_REPORTING, "[setProactiveReportingConfigurations] called enabled=" + enabled + " gapBetweenModals=" + gapBetweenModals + " modalDelayAfterDetection=" + modalDelayAfterDetection);
                ProactiveReportingConfigs configs = new ProactiveReportingConfigs.Builder()
                        .setGapBetweenModals(gapBetweenModals) // Time in seconds
                        .setModalDelayAfterDetection(modalDelayAfterDetection) // Time in seconds
                        .isEnabled(enabled) //Enable/disable
                        .build();
                BugReporting.setProactiveReportingConfigurations(configs);


            }
        });
    }
}
