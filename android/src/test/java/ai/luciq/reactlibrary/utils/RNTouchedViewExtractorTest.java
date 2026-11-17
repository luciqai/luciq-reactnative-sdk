package ai.luciq.reactlibrary.utils;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import android.view.View;

import com.facebook.react.views.text.ReactTextView;
import com.facebook.react.views.view.ReactViewGroup;

import ai.luciq.library.visualusersteps.TouchedView;

import org.junit.Test;

public class RNTouchedViewExtractorTest {

    @Test
    public void userStepLabelOfButtonWithTextAndAnAccessibilityLabelIsTheText() {
        // Accessibility labels are often test ids (Appium's accessibility id), so visible text wins.
        ReactViewGroup button = buttonWith(text("Buy"));
        when(button.getContentDescription()).thenReturn("id_buy_button");

        assertEquals("Buy", RNTouchedViewExtractor.userStepLabelOf(button));
    }

    @Test
    public void userStepLabelOfButtonWithoutTextIsItsAccessibilityLabel() {
        ReactViewGroup button = buttonWith(mock(View.class));
        when(button.getContentDescription()).thenReturn("  Close  ");

        assertEquals("Close", RNTouchedViewExtractor.userStepLabelOf(button));
    }

    @Test
    public void userStepLabelOfButtonWithOneTextIsThatText() {
        ReactViewGroup button = buttonWith(text("Crash Reporting"));

        assertEquals("Crash Reporting", RNTouchedViewExtractor.userStepLabelOf(button));
    }

    @Test
    public void userStepLabelOfButtonWithNestedTextsJoinsThemInOrder() {
        ReactViewGroup row = buttonWith(text("Crash Reporting State"), text("Enabled"));
        ReactViewGroup button = buttonWith(row);

        assertEquals("Crash Reporting State Enabled", RNTouchedViewExtractor.userStepLabelOf(button));
    }

    @Test
    public void userStepLabelKeepsAtMostFiveTexts() {
        ReactViewGroup button = buttonWith(text("1"), text("2"), text("3"), text("4"), text("5"), text("6"));

        assertEquals("1 2 3 4 5", RNTouchedViewExtractor.userStepLabelOf(button));
    }

    @Test
    public void userStepLabelOfButtonWithoutTextOrAccessibilityLabelIsNull() {
        ReactViewGroup button = buttonWith(text("   "), mock(View.class));

        assertNull(RNTouchedViewExtractor.userStepLabelOf(button));
    }

    @Test
    public void userStepLabelIgnoresTextsDeeperThanTheLimit() {
        ReactViewGroup level3 = buttonWith(buttonWith(text("too deep")));
        ReactViewGroup button = buttonWith(buttonWith(level3));

        assertNull(RNTouchedViewExtractor.userStepLabelOf(button));
    }

    @Test
    public void settingTheUserStepLabelOnAnOlderNativeSdkLeavesTheTouchedViewUnchanged() {
        // The pinned native SDK predates TouchedView.setUserStepLabel: the call must be a safe no-op.
        TouchedView touchedView = new TouchedView();
        touchedView.setProminentLabel("the button \"Checkout\"");

        RNTouchedViewExtractor.setUserStepLabel(touchedView, "Checkout");

        assertEquals("the button \"Checkout\"", touchedView.getProminentLabel());
    }

    private static ReactViewGroup buttonWith(View... children) {
        ReactViewGroup group = mock(ReactViewGroup.class);
        when(group.getChildCount()).thenReturn(children.length);
        for (int index = 0; index < children.length; index++) {
            when(group.getChildAt(index)).thenReturn(children[index]);
        }
        return group;
    }

    private static ReactTextView text(String text) {
        ReactTextView textView = mock(ReactTextView.class);
        when(textView.getText()).thenReturn(text);
        return textView;
    }
}
