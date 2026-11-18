package com.tvbroadcast.kiosk;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.http.SslError;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.os.SystemClock;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;

/**
 * TV oynatıcısını (/player) tam ekran açar ve TV'yi bu ekrana kilitler.
 * Ana ekran (HOME) uygulaması olarak kurulur: TV açılınca ve Home tuşunda yayın gelir,
 * Geri tuşu yayından çıkarmaz, başka uygulamaya geçilirse birkaç dakika sonra yayına dönülür.
 * Ayarlar: yayın sırasında Geri tuşuna art arda 5 kez basılır.
 */
public class MainActivity extends Activity {
    private static final String PREFS = "kiosk";
    private static final String KEY_SERVER = "server";
    private static final String KEY_PENDING_CODE = "pending_code";

    private static final long RETRY_MS = 15_000;
    private static final long AUTO_RETURN_MS = 3 * 60_000;

    /** Ayarlar ekranından Android Ayarları açıldığında otomatik dönüş bu zamana kadar bekler. */
    static long autoReturnPausedUntil;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private WebView web;
    private TextView message;
    private String loadedUrl;
    private boolean pageFailed;
    private int backPresses;
    private long firstBackAt;

    private final Runnable retry = () -> load(startUrl());

    private final Runnable returnToBroadcast = new Runnable() {
        @Override
        public void run() {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            if (!pm.isInteractive() || System.currentTimeMillis() < autoReturnPausedUntil) {
                handler.postDelayed(this, AUTO_RETURN_MS);
                return;
            }
            startActivity(new Intent(MainActivity.this, MainActivity.class)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        }
    };

    static String server(Context c) {
        return normalizeServer(c.getSharedPreferences(PREFS, MODE_PRIVATE)
                .getString(KEY_SERVER, c.getString(R.string.default_server)));
    }

    /** Sunucu adresini ve verildiyse TV kodunu kaydeder; boş kod mevcut eşleşmeyi korur. */
    static void saveConfig(Context c, String server, String code) {
        SharedPreferences.Editor e = c.getSharedPreferences(PREFS, MODE_PRIVATE).edit();
        if (server != null) e.putString(KEY_SERVER, normalizeServer(server));
        if (code != null && !code.trim().isEmpty()) e.putString(KEY_PENDING_CODE, code.replaceAll("\\D", ""));
        e.apply();
    }

    static String normalizeServer(String s) {
        s = s.trim();
        while (s.endsWith("/")) s = s.substring(0, s.length() - 1);
        if (s.isEmpty() || s.contains("://")) return s;
        // Şemasız girilen IP adresi yerel ağ (http), alan adı HTTPS kabul edilir
        return (Character.isDigit(s.charAt(0)) || s.startsWith("localhost") ? "http://" : "https://") + s;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        // chrome://inspect ile uzaktan inceleme; yalnızca TV'ye ADB ile bağlanan bilgisayardan yapılabilir
        WebView.setWebContentsDebuggingEnabled(true);

        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        web.setWebViewClient(new KioskClient());
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public Bitmap getDefaultVideoPoster() {
                // Video başlarken WebView'in gri "oynat" simgesi görünmesin
                return Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
            }
        });

        message = new TextView(this);
        message.setBackgroundColor(Color.BLACK);
        message.setTextColor(Color.WHITE);
        message.setTextSize(26);
        message.setGravity(Gravity.CENTER);
        message.setVisibility(View.GONE);

        FrameLayout root = new FrameLayout(this);
        root.addView(web);
        root.addView(message);
        setContentView(root);

        applyIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        applyIntent(intent);
    }

    /** ADB ile kurulum: am start -n com.tvbroadcast.kiosk/.MainActivity --es server https://… --es code 48213907 */
    private void applyIntent(Intent intent) {
        String server = intent.getStringExtra("server");
        String code = intent.getStringExtra("code");
        if (server != null || code != null) saveConfig(this, server, code);
    }

    @Override
    protected void onStart() {
        super.onStart();
        handler.removeCallbacks(returnToBroadcast);
        web.onResume();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (server(this).isEmpty()) {
            openSettings();
            return;
        }
        String url = startUrl();
        if (!url.equals(loadedUrl)) load(url);
    }

    @Override
    protected void onStop() {
        super.onStop();
        web.onPause();
        handler.postDelayed(returnToBroadcast, AUTO_RETURN_MS);
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        ((ViewGroup) web.getParent()).removeView(web);
        web.destroy();
        super.onDestroy();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    @SuppressWarnings("deprecation")
    private void hideSystemBars() {
        // TV'lerde sistem çubuğu yoktur; telefon tabanlı Android kutularda gezinme çubuğunu gizler
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION);
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        switch (event.getKeyCode()) {
            case KeyEvent.KEYCODE_BACK:
                if (event.getAction() == KeyEvent.ACTION_UP) countBackPress();
                return true;
            case KeyEvent.KEYCODE_MEDIA_PLAY:
            case KeyEvent.KEYCODE_MEDIA_PAUSE:
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
            case KeyEvent.KEYCODE_MEDIA_STOP:
                return true; // kumandadaki oynat/duraklat yayını durdurmasın
            default:
                return super.dispatchKeyEvent(event);
        }
    }

    private void countBackPress() {
        long now = SystemClock.uptimeMillis();
        if (now - firstBackAt > 3000) {
            firstBackAt = now;
            backPresses = 0;
        }
        if (++backPresses >= 5) {
            backPresses = 0;
            openSettings();
        }
    }

    private void openSettings() {
        startActivity(new Intent(this, SettingsActivity.class));
    }

    private String startUrl() {
        String code = getSharedPreferences(PREFS, MODE_PRIVATE).getString(KEY_PENDING_CODE, "");
        // Kod bir kez iletilir, oynatıcı onu kendi hafızasına yazar. Sonraki açılışlar düz /player/
        // adresiyle olur; böylece Service Worker önbelleğinden internet olmadan da açılır.
        return server(this) + "/player/" + (code.isEmpty() ? "" : "?token=" + code);
    }

    private void load(String url) {
        handler.removeCallbacks(retry);
        loadedUrl = url;
        web.loadUrl(url);
    }

    private void showError(String reason) {
        pageFailed = true;
        message.setText(getString(R.string.load_error, reason, loadedUrl));
        message.setVisibility(View.VISIBLE);
        handler.removeCallbacks(retry);
        handler.postDelayed(retry, RETRY_MS);
    }

    private class KioskClient extends WebViewClient {
        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            pageFailed = false;
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            if (pageFailed) return;
            message.setVisibility(View.GONE);
            if (url.contains("token=")) {
                // Oynatıcı kodu kaydetti; bundan sonraki açılışlar düz /player/ ile olur
                getSharedPreferences(PREFS, MODE_PRIVATE).edit().remove(KEY_PENDING_CODE).apply();
                loadedUrl = startUrl();
            }
        }

        @SuppressWarnings("deprecation")
        @Override
        public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
            // Yeni Android sürümlerinde de yalnızca ana sayfa yüklenemediğinde çağrılır
            showError(description);
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
            if (request.isForMainFrame()) showError("HTTP " + response.getStatusCode());
        }

        @Override
        public void onReceivedSslError(WebView view, SslErrorHandler sslHandler, SslError error) {
            sslHandler.cancel();
            showError(getString(R.string.ssl_error));
        }

        @Override
        public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            // Sayfa motoru çöktü ya da bellek için kapatıldı: ekranı baştan kur
            recreate();
            return true;
        }
    }
}
