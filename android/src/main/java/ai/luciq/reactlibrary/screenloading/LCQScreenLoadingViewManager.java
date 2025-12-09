package ai.luciq.reactlibrary.screenloading;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

public class LCQScreenLoadingViewManager extends SimpleViewManager<LCQScreenLoadingView> {

    public static final String REACT_CLASS = "LCQScreenLoadingView";

    @NonNull
    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @NonNull
    @Override
    protected LCQScreenLoadingView createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new LCQScreenLoadingView(reactContext);
    }

    @ReactProp(name = "displayType")
    public void setDisplayType(LCQScreenLoadingView view, String displayType) {
        view.setDisplayType(displayType);
    }

    @ReactProp(name = "record")
    public void setRecord(LCQScreenLoadingView view, boolean record) {
        view.setRecord(record);
    }

    @ReactProp(name = "screenName")
    public void setScreenName(LCQScreenLoadingView view, String screenName) {
        view.setScreenName(screenName);
    }

    @Nullable
    @Override
    public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.<String, Object>builder()
            .put("onDisplay", MapBuilder.of("registrationName", "onDisplay"))
            .build();
    }
}