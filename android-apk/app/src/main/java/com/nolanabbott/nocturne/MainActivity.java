package com.nolanabbott.nocturne;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Android TV shell for the React/Norigin Nocturne interface.
 *
 * Navigation, focus, page state and previews live in the bundled React TV app.
 * Mature playback stays native through PlayerActivity / Media3.
 */
public class MainActivity extends Activity {
    private WebView web;
    private boolean seeded;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        immersive();

        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);

        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setAllowContentAccess(false);
        settings.setLoadsImagesAutomatically(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        if (android.os.Build.VERSION.SDK_INT >= 21) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        }

        web.addJavascriptInterface(new NativeBridge(), "NocturneNative");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                seedProvidersOnce();
                view.requestFocus();
            }
        });

        setContentView(web);
        web.loadUrl("file:///android_asset/web/index.html");
    }

    private void seedProvidersOnce() {
        if (seeded || web == null) return;
        seeded = true;
        try {
            Set<String> urls = new LinkedHashSet<>();
            urls.add(StremioClient.CINEMETA);
            urls.add(StremioClient.DEFAULT_STREAM_ADDON);

            LibraryStore store = new LibraryStore(this);
            try {
                JSONArray saved = new JSONArray(store.device.getString("manifests", "[]"));
                for (int i = 0; i < saved.length(); i++) {
                    String url = saved.optString(i, "");
                    if (!url.isEmpty()) urls.add(url);
                }
            } catch (Exception ignored) { }

            JSONArray descriptors = new JSONArray();
            for (String url : urls) {
                JSONObject d = new JSONObject();
                d.put("transportUrl", url);
                d.put("enabled", true);
                descriptors.put(d);
            }

            String json = descriptors.toString();
            String script =
                "(function(){" +
                "try{" +
                "var current=localStorage.getItem('addonDescriptors');" +
                "if(!current||current==='[]'){" +
                "localStorage.setItem('addonDescriptors'," + JSONObject.quote(json) + ");" +
                "location.reload();" +
                "}" +
                "}catch(e){}" +
                "})();";
            web.evaluateJavascript(script, null);
        } catch (Exception ignored) { }
    }

    private final class NativeBridge {
        @JavascriptInterface public void play(String url, String title, String headersJson) {
            if (url == null || url.trim().isEmpty()) return;
            runOnUiThread(() -> {
                try {
                    JSONObject item = new JSONObject();
                    item.put("id", "web:" + Integer.toHexString((title == null ? url : title).hashCode()));
                    item.put("type", "movie");
                    item.put("name", title == null || title.isEmpty() ? "Nocturne" : title);

                    Intent intent = new Intent(MainActivity.this, PlayerActivity.class);
                    intent.putExtra("url", url);
                    intent.putExtra("title", title == null ? "Nocturne" : title);
                    intent.putExtra("itemJson", item.toString());
                    intent.putExtra("videoId", item.getString("id"));
                    intent.putExtra("profile", "default");
                    intent.putExtra("headers", headersJson == null || headersJson.isEmpty() ? "{}" : headersJson);
                    startActivity(intent);
                } catch (Exception ignored) { }
            });
        }

        @JavascriptInterface public void exit() {
            runOnUiThread(MainActivity.this::finish);
        }
    }

    @Override public void onBackPressed() {
        if (web == null) {
            super.onBackPressed();
            return;
        }
        web.evaluateJavascript(
            "window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}));",
            null
        );
    }

    @Override public boolean dispatchKeyEvent(KeyEvent event) {
        if (web != null && event.getAction() == KeyEvent.ACTION_DOWN) {
            String key = null;
            switch (event.getKeyCode()) {
                case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE: key = "MediaPlayPause"; break;
                case KeyEvent.KEYCODE_MENU: key = "ContextMenu"; break;
            }
            if (key != null) {
                web.evaluateJavascript(
                    "window.dispatchEvent(new KeyboardEvent('keydown',{key:" + JSONObject.quote(key) + ",bubbles:true}));",
                    null
                );
                return true;
            }
        }
        return super.dispatchKeyEvent(event);
    }

    @Override protected void onResume() {
        super.onResume();
        immersive();
        if (web != null) web.onResume();
    }

    @Override protected void onPause() {
        if (web != null) web.onPause();
        super.onPause();
    }

    @Override protected void onDestroy() {
        if (web != null) {
            web.loadUrl("about:blank");
            web.removeJavascriptInterface("NocturneNative");
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    private void immersive() {
        getWindow().getDecorView().setSystemUiVisibility(
            5894 | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );
    }
}
