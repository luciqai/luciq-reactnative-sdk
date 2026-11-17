package ai.luciq.react.example;

import android.app.Activity;
import android.os.Bundle;
import android.view.Gravity;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * A plain native screen inside the React Native example, used to check `trackNativeScreens`:
 * it should be reported under its own name, with its own repro steps, user steps and APM traces.
 */
public class NativeScreenActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER_HORIZONTAL);
        int padding = (int) (24 * getResources().getDisplayMetrics().density);
        layout.setPadding(padding, padding, padding, padding);

        TextView title = new TextView(this);
        title.setText("Native screen");
        title.setTextSize(22);
        layout.addView(title);

        EditText input = new EditText(this);
        input.setHint("Native text field");
        layout.addView(input);

        Button tapMe = new Button(this);
        tapMe.setText("Native button");
        tapMe.setOnClickListener(v -> title.setText("Native button tapped"));
        layout.addView(tapMe);

        Button back = new Button(this);
        back.setText("Back to React Native");
        back.setOnClickListener(v -> finish());
        layout.addView(back);

        setContentView(layout);
    }
}
