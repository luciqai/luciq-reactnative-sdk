package ai.luciq.reactlibrary.utils;

import android.text.TextUtils;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.VisibleForTesting;
import com.facebook.react.views.text.ReactTextView;
import com.facebook.react.views.view.ReactViewGroup;
import ai.luciq.library.core.InstabugCore;
import ai.luciq.library.visualusersteps.TouchedView;
import ai.luciq.library.visualusersteps.TouchedViewExtractor;
import ai.luciq.library.visualusersteps.VisualUserStepsHelper;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

public class RNTouchedViewExtractor implements TouchedViewExtractor {

    private final int depthTraversalLimit = 3;

    private static final int USER_STEP_LABEL_DEPTH_LIMIT = 3;
    private static final int USER_STEP_LABEL_MAX_TEXTS = 5;

    /**
     * {@code TouchedView.setUserStepLabel}, which only native SDKs with React Native user step labels
     * have. Looked up once; {@code null} on older native SDKs, where user steps keep their native label.
     */
    @Nullable
    private static final Method SET_USER_STEP_LABEL = findUserStepLabelSetter();

    /**
     * Determines whether the native Android SDK should depend on native extraction
     * when a label is not found by the RNTouchedViewExtractor.
     *
     * <p>
     * - {@code RNTouchedViewExtractor} tries to find a label.
     * <br>
     * - If it returns a label, the view is labeled with the one returned.
     * <br>
     * - If it returns {@code null}:
     * <br>
     * - If {@code shouldDependOnNative} is {@code true}, the native Android SDK
     * will try to extract the label from the view.
     * <br>
     * - If it's {@code false}, the Android SDK will label it {@code null} as returned
     * from {@code RNTouchedViewExtractor} without trying to label it.
     * </p>
     *
     * @return {@code true} if the native Android SDK should depend on native extraction,
     * {@code false} otherwise.
     */
    @Override
    public boolean getShouldDependOnNative() {
        return true;
    }


    @Nullable
    @Override
    public TouchedView extract(@NonNull View view, @NonNull TouchedView touchedView) {
        ReactViewGroup reactViewGroup = findReactButtonViewGroup(view);
        // If no button is found return `null` to leave the extraction of the touched view to the native Android SDK.
        if (reactViewGroup == null) return null;
        TouchedView extracted = getExtractionStrategy(reactViewGroup).extract(reactViewGroup, touchedView);
        if (extracted != null && !VisualUserStepsHelper.isPrivateView(reactViewGroup)) {
            setUserStepLabel(extracted, userStepLabelOf(reactViewGroup));
        }
        return extracted;
    }

    /**
     * The plain label of a touched React Native button for the user steps log: the text it shows (up
     * to {@value #USER_STEP_LABEL_MAX_TEXTS} texts, joined), or else its accessibility label. Text comes
     * first, as in repro steps, because apps often set accessibility labels to test ids for UI tests.
     * Unlike the repro step label it is not a sentence, so "Checkout" rather than "the button "Checkout"".
     *
     * @return the label, or {@code null} when the button has neither.
     */
    @Nullable
    @VisibleForTesting
    static String userStepLabelOf(@NonNull ReactViewGroup button) {
        List<String> texts = new ArrayList<>();
        collectTexts(button, texts, 1);
        if (texts.isEmpty()) return nonBlank(button.getContentDescription());

        StringBuilder label = new StringBuilder(texts.get(0));
        for (int index = 1; index < texts.size(); index++) {
            label.append(' ').append(texts.get(index));
        }
        return label.toString();
    }

    private static void collectTexts(@NonNull ViewGroup group, @NonNull List<String> texts, int depth) {
        for (int index = 0; index < group.getChildCount() && texts.size() < USER_STEP_LABEL_MAX_TEXTS; index++) {
            View child = group.getChildAt(index);
            if (child instanceof ReactTextView) {
                ReactTextView textView = (ReactTextView) child;
                String text = nonBlank(textView.getText());
                if (text != null) texts.add(text);
            } else if (child instanceof ViewGroup && depth < USER_STEP_LABEL_DEPTH_LIMIT) {
                collectTexts((ViewGroup) child, texts, depth + 1);
            }
        }
    }

    @Nullable
    private static String nonBlank(@Nullable CharSequence text) {
        if (text == null) return null;
        String trimmed = text.toString().trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @VisibleForTesting
    static void setUserStepLabel(@NonNull TouchedView touchedView, @Nullable String label) {
        if (SET_USER_STEP_LABEL == null || label == null) return;
        try {
            SET_USER_STEP_LABEL.invoke(touchedView, label);
        } catch (Exception e) {
            LuciqRNLogger.e(LuciqRNDebugTags.CORE, "[RNTouchedViewExtractor] failed to set the user step label", e);
        }
    }

    @Nullable
    private static Method findUserStepLabelSetter() {
        try {
            return TouchedView.class.getMethod("setUserStepLabel", String.class);
        } catch (NoSuchMethodException e) {
            return null;
        }
    }

    @Nullable
    private ReactViewGroup findReactButtonViewGroup(@NonNull View startView) {
        if (isReactButtonViewGroup(startView)) return (ReactViewGroup) startView;
        ViewParent currentParent = startView.getParent();
        int depth = 1;
        do {
            if (currentParent == null || isReactButtonViewGroup(currentParent))
                return (ReactViewGroup) currentParent;
            currentParent = currentParent.getParent();
            depth++;
        } while (depth < depthTraversalLimit);
        return null;
    }

    private boolean isReactButtonViewGroup(@NonNull View view) {
        return (view instanceof ReactViewGroup) && view.isFocusable() && view.isClickable();
    }

    private boolean isReactButtonViewGroup(@NonNull ViewParent viewParent) {
        if (!(viewParent instanceof ReactViewGroup)) return false;
        ReactViewGroup group = (ReactViewGroup) viewParent;
        return group.isFocusable() && group.isClickable();
    }

    private ReactButtonExtractionStrategy getExtractionStrategy(ReactViewGroup reactButton) {
        boolean isPrivateView = VisualUserStepsHelper.isPrivateView(reactButton);
        if (isPrivateView) return new PrivateViewLabelExtractionStrategy();

        int labelsCount = 0;
        int groupsCount = 0;
        for (int index = 0; index < reactButton.getChildCount(); index++) {
            View currentView = reactButton.getChildAt(index);
            if (currentView instanceof ReactTextView) {

                labelsCount++;
                continue;
            }
            if (currentView instanceof ReactViewGroup) {
                groupsCount++;
            }
        }
        if (labelsCount > 1 || groupsCount > 0) return new MultiLabelsExtractionStrategy();
        if (labelsCount == 1) return new SingleLabelExtractionStrategy();
        return new NoLabelsExtractionStrategy();
    }

    interface ReactButtonExtractionStrategy {
        @Nullable
        TouchedView extract(ReactViewGroup reactButton, TouchedView touchedView);
    }

    class MultiLabelsExtractionStrategy implements ReactButtonExtractionStrategy {
        private final String MULTI_LABEL_BUTTON_PRE_STRING = "a button that contains \"%s\"";

        @Override
        @Nullable
        public TouchedView extract(ReactViewGroup reactButton, TouchedView touchedView) {

            touchedView.setProminentLabel(
                    InstabugCore.composeProminentLabelForViewGroup(reactButton, MULTI_LABEL_BUTTON_PRE_STRING)
            );
            return touchedView;
        }
    }

    class PrivateViewLabelExtractionStrategy implements ReactButtonExtractionStrategy {

        private final String PRIVATE_VIEW_LABEL_BUTTON_PRE_STRING = "a button";

        @Override
        public TouchedView extract(ReactViewGroup reactButton, TouchedView touchedView) {
            touchedView.setProminentLabel(PRIVATE_VIEW_LABEL_BUTTON_PRE_STRING);
            return touchedView;
        }
    }

    class SingleLabelExtractionStrategy implements ReactButtonExtractionStrategy {

        @Override
        public TouchedView extract(ReactViewGroup reactButton, TouchedView touchedView) {
            ReactTextView targetLabel = null;
            for (int index = 0; index < reactButton.getChildCount(); index++) {
                View currentView = reactButton.getChildAt(index);
                if (!(currentView instanceof ReactTextView)) continue;
                targetLabel = (ReactTextView) currentView;
                break;
            }
            if (targetLabel == null) return touchedView;

            String labelText = getLabelText(targetLabel);
            touchedView.setProminentLabel(InstabugCore.composeProminentLabelFor(labelText, false));
            return touchedView;
        }

        @Nullable
        private String getLabelText(ReactTextView textView) {
            String labelText = null;
            if (!TextUtils.isEmpty(textView.getText())) {
                labelText = textView.getText().toString();
            } else if (!TextUtils.isEmpty(textView.getContentDescription())) {
                labelText = textView.getContentDescription().toString();
            }
            return labelText;
        }
    }

    class NoLabelsExtractionStrategy implements ReactButtonExtractionStrategy {
        @Override
        public TouchedView extract(ReactViewGroup reactButton, TouchedView touchedView) {
            return touchedView;
        }
    }
}
