package ai.luciq.reactlibrary;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import ai.luciq.library.Feature;
import ai.luciq.reactlibrary.utils.ArrayUtil;
import ai.luciq.reactlibrary.utils.EventEmitterModule;
import ai.luciq.reactlibrary.utils.LuciqRNDebugTags;
import ai.luciq.reactlibrary.utils.LuciqRNLogger;
import ai.luciq.reactlibrary.utils.LuciqUtil;
import ai.luciq.reactlibrary.utils.MainThreadHandler;
import ai.luciq.survey.callbacks.*;
import ai.luciq.survey.Surveys;
import ai.luciq.survey.Survey;

import org.json.JSONArray;

import java.util.List;

import javax.annotation.Nonnull;

public class RNLuciqSurveysModule extends EventEmitterModule {

    private static final String TAG = LuciqRNDebugTags.SURVEYS;

    public RNLuciqSurveysModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Nonnull
    @Override
    public String getName() {
        return "LCQSurveys";
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
     * Returns true if the survey with a specific token was answered before.
     * Will return false if the token does not exist or if the survey was not answered before.
     *
     * @param surveyToken          the attribute key as string
     * @param promise A promise that gets resolved with the returned value of whether
     *                             the user has responded to the survey or not.
     * @return the desired value of whether the user has responded to the survey or not.
     */
    @ReactMethod
    public void hasRespondedToSurvey(final String surveyToken, final Promise promise) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[hasRespondedToSurvey] called surveyTokenLen=" + (surveyToken == null ? 0 : surveyToken.length()) + " present=" + (surveyToken != null));
                boolean hasResponded = false;
                try {
                    hasResponded = Surveys.hasRespondToSurvey(surveyToken);
                    LuciqRNLogger.d(TAG, "[hasRespondedToSurvey] success result=" + hasResponded);
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[hasRespondedToSurvey] failed", e);
                }
                promise.resolve(hasResponded);
            }
        });
    }

    /**
     * Shows survey with a specific token.
     * Does nothing if there are no available surveys with that specific token.
     * Answered and cancelled surveys won't show up again.
     *
     * @param surveyToken A String with a survey token.
     */
    @ReactMethod
    public void showSurvey(final String surveyToken) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[showSurvey] called surveyTokenLen=" + (surveyToken == null ? 0 : surveyToken.length()) + " present=" + (surveyToken != null));
                try {
                    Surveys.showSurvey(surveyToken);
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[showSurvey] failed", e);
                }
            }
        });
    }

    /**
     * Show any valid survey if exist
     *
     * @return true if a valid survey was shown otherwise false
     */
    @ReactMethod
    public void showSurveysIfAvailable() {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[showSurveysIfAvailable] called");
                try {
                    Surveys.showSurveyIfAvailable();
                } catch (java.lang.Exception exception) {
                    LuciqRNLogger.e(TAG, "[showSurveysIfAvailable] failed", exception);
                }
            }
        });
    }

    /**
     * Show any valid survey if exist
     *
     * @return true if a valid survey was shown otherwise false
     */
    @ReactMethod
    public void setEnabled(final boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setEnabled] called isEnabled=" + isEnabled);
                try {
                    if (isEnabled) {
                        Surveys.setState(Feature.State.ENABLED);
                    } else {
                        Surveys.setState(Feature.State.DISABLED);
                    }
                } catch (java.lang.Exception exception) {
                    LuciqRNLogger.e(TAG, "[setEnabled] failed", exception);
                }
            }
        });
    }

    /**
     * Sets the runnable that gets executed just before showing any valid survey<br/>
     * WARNING: This runs on your application's main UI thread. Please do not include
     * any blocking operations to avoid ANRs.
     *
     * @param handler to run on the UI thread before showing any valid survey
     */
    @ReactMethod
    public void setOnShowHandler(final Callback handler) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setOnShowHandler] called handlerPresent=" + (handler != null));
                Surveys.setOnShowCallback(new OnShowCallback() {
                    @Override
                    public void onShow() {
                        LuciqRNLogger.d(TAG, "[" + Constants.LCQ_ON_SHOW_SURVEY_HANDLER + "] emitted");
                        sendEvent(Constants.LCQ_ON_SHOW_SURVEY_HANDLER, null);
                    }
                });
            }
        });
    }

    /**
     * Sets the runnable that gets executed just after showing any valid survey<br/>
     * WARNING: This runs on your application's main UI thread. Please do not include
     * any blocking operations to avoid ANRs.
     *
     * @param handler to run on the UI thread after showing any valid survey
     */
    @ReactMethod
    public void setOnDismissHandler(final Callback handler) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setOnDismissHandler] called handlerPresent=" + (handler != null));
                Surveys.setOnDismissCallback(new OnDismissCallback() {
                    @Override
                    public void onDismiss() {
                        LuciqRNLogger.d(TAG, "[" + Constants.LCQ_ON_DISMISS_SURVEY_HANDLER + "] emitted");
                        sendEvent(Constants.LCQ_ON_DISMISS_SURVEY_HANDLER, null);
                    }
                });
            }
        });
    }

    /**
     * Returns an array containing the available surveys.
     */
    @ReactMethod
    public void getAvailableSurveys(final Promise promise) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[getAvailableSurveys] called");
                try {
                    List<Survey> availableSurveys = Surveys.getAvailableSurveys();
                    JSONArray surveysArray = LuciqUtil.surveyObjectToJson(availableSurveys);
                    WritableArray array = ArrayUtil.convertJsonToWritableArray(surveysArray);
                    LuciqRNLogger.d(TAG, "[getAvailableSurveys] success count=" + (availableSurveys == null ? 0 : availableSurveys.size()));
                    promise.resolve(array);
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[getAvailableSurveys] failed", e);
                    promise.resolve(Arguments.createArray());
                }
            }
        });
    }

    /**
     * Set Surveys auto-showing state, default state auto-showing enabled
     *
     * @param autoShowingSurveysEnabled whether Surveys should be auto-showing or not
     */
    @ReactMethod
    public void setAutoShowingEnabled(final boolean autoShowingSurveysEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setAutoShowingEnabled] called autoShowingSurveysEnabled=" + autoShowingSurveysEnabled);
                try {
                    Surveys.setAutoShowingEnabled(autoShowingSurveysEnabled);
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[setAutoShowingEnabled] failed", e);
                }
            }
        });
    }

    /**
     * Set Surveys welcome screen enabled, default value is false
     *
     * @param shouldShow shouldShow whether should a welcome screen be shown
     *                   before taking surveys or not
     */
    @ReactMethod
    public void setShouldShowWelcomeScreen(final boolean shouldShow) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setShouldShowWelcomeScreen] called shouldShow=" + shouldShow);
                try {
                    Surveys.setShouldShowWelcomeScreen(shouldShow);
                } catch (java.lang.Exception exception) {
                    LuciqRNLogger.e(TAG, "[setShouldShowWelcomeScreen] failed", exception);
                }
            }
        });
    }
}
