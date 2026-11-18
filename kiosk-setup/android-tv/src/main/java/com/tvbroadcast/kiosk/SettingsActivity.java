package com.tvbroadcast.kiosk;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.provider.Settings;
import android.widget.EditText;
import android.widget.TextView;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Collections;

/** Kumandayla doldurulan ayarlar: sunucu adresi ve isteğe bağlı 8 haneli TV kodu. */
public class SettingsActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        EditText server = findViewById(R.id.server);
        EditText code = findViewById(R.id.code);
        TextView info = findViewById(R.id.info);
        server.setText(MainActivity.server(this));
        info.setText(getString(R.string.settings_info, deviceIp(), versionName()));
        (server.length() == 0 ? server : code).requestFocus();

        findViewById(R.id.save).setOnClickListener(v -> {
            if (MainActivity.normalizeServer(server.getText().toString()).isEmpty()) {
                server.setError(getString(R.string.server_required));
                return;
            }
            MainActivity.saveConfig(this, server.getText().toString(), code.getText().toString());
            finish();
        });
        findViewById(R.id.android_settings).setOnClickListener(v -> {
            MainActivity.autoReturnPausedUntil = System.currentTimeMillis() + 15 * 60_000;
            startActivity(new Intent(Settings.ACTION_SETTINGS));
        });
    }

    private String versionName() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (PackageManager.NameNotFoundException e) {
            return "?";
        }
    }

    /** Güncelleme için install-tv.sh'a verilecek IP adresi. */
    private static String deviceIp() {
        try {
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                for (InetAddress a : Collections.list(ni.getInetAddresses())) {
                    if (!a.isLoopbackAddress() && a instanceof Inet4Address) return a.getHostAddress();
                }
            }
        } catch (Exception ignored) {
        }
        return "-";
    }
}
