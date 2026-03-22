package social.coracle.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "NavComMainActivity";
    private static final int MAX_INTENT_DATA_LENGTH = 4096;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Intent intent = getIntent();
        if (intent != null) {
            sanitizeIntent(intent);
        }
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        if (intent != null) {
            sanitizeIntent(intent);
        }
        super.onNewIntent(intent);
    }

    /**
     * Validate and sanitize incoming intent data to prevent injection
     * through malformed deep links or oversized payloads.
     */
    private void sanitizeIntent(Intent intent) {
        // Validate intent data URI if present
        Uri data = intent.getData();
        if (data != null) {
            String dataString = data.toString();
            if (dataString.length() > MAX_INTENT_DATA_LENGTH) {
                Log.w(TAG, "Rejected oversized intent data: " + dataString.length() + " bytes");
                intent.setData(null);
            }
        }

        // Strip string extras that contain control characters
        Bundle extras = intent.getExtras();
        if (extras != null) {
            for (String key : extras.keySet()) {
                Object value = extras.get(key);
                if (value instanceof String) {
                    String sanitized = stripControlChars((String) value);
                    if (sanitized.length() > MAX_INTENT_DATA_LENGTH) {
                        Log.w(TAG, "Rejected oversized intent extra: " + key);
                        intent.removeExtra(key);
                    } else if (!sanitized.equals(value)) {
                        intent.putExtra(key, sanitized);
                    }
                }
            }
        }
    }

    /** Remove ASCII control characters (0x00-0x1F, 0x7F) except tab/newline. */
    private static String stripControlChars(String input) {
        if (input == null) return null;
        StringBuilder sb = new StringBuilder(input.length());
        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            if (c == '\t' || c == '\n' || c == '\r' || c >= 0x20 && c != 0x7F) {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
