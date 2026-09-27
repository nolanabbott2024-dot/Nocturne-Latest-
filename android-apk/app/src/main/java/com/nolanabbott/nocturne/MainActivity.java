package com.nolanabbott.nocturne;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
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
    private long lastRepeatDispatchAt;
    private int lastRepeatKeyCode = -1;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        immersive();

        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
        if (android.os.Build.VERSION.SDK_INT >= 26) {
            web.setDefaultFocusHighlightEnabled(false);
        }

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

            JSONObject uiSettings = new JSONObject();
            uiSettings.put("preferredQuality", store.device.getString("preferredQuality", "Auto"));
            uiSettings.put("maxSizeGB", store.device.getFloat("maxSizeGB", 50f));
            uiSettings.put("excludeKeywords", store.device.getString("excludeKeywords", ""));
            uiSettings.put("dedupe", store.device.getBoolean("dedupe", true));
            uiSettings.put("subtitlesLanguage", store.device.getString("subtitleLanguage", "eng"));
            uiSettings.put("audioLanguage", store.device.getString("audioLanguage", "eng"));
            uiSettings.put("seekSeconds", store.device.getInt("seekSeconds", 10));
            uiSettings.put("reducedMotion", store.device.getBoolean("reducedMotion", false));
            uiSettings.put("previewAudio", store.device.getBoolean("previewAudio", true));
            uiSettings.put("previews", store.device.getBoolean("previews", true));

            String json = descriptors.toString();
            String settingsJson = uiSettings.toString();
            String script =
                "(function(){" +
                "try{" +
                "var changed=false;" +
                "var current=localStorage.getItem('addonDescriptors');" +
                "if(!current||current==='[]'){" +
                "localStorage.setItem('addonDescriptors'," + JSONObject.quote(json) + ");changed=true;" +
                "}" +
                "if(!localStorage.getItem('settings')){" +
                "localStorage.setItem('settings'," + JSONObject.quote(settingsJson) + ");changed=true;" +
                "}" +
                "if(changed)location.reload();" +
                "}catch(e){}" +
                "})();";
            web.evaluateJavascript(script, null);
        } catch (Exception ignored) { }
    }

    private final class NativeBridge {
        @JavascriptInterface public void play(String url, String title, String headersJson, String itemJson, String videoId) {
            if (url == null || url.trim().isEmpty()) return;
            runOnUiThread(() -> {
                try {
                    JSONObject item;
                    try {
                        item = itemJson == null || itemJson.isEmpty() ? new JSONObject() : new JSONObject(itemJson);
                    } catch (Exception ignored) {
                        item = new JSONObject();
                    }
                    if (!item.has("id")) item.put("id", "web:" + Integer.toHexString((title == null ? url : title).hashCode()));
                    if (!item.has("type")) item.put("type", "movie");
                    if (!item.has("name")) item.put("name", title == null || title.isEmpty() ? "Nocturne" : title);
                    String resolvedVideo = videoId == null || videoId.isEmpty() ? item.optString("id") : videoId;

                    Intent intent = new Intent(MainActivity.this, PlayerActivity.class);
                    intent.putExtra("url", url);
                    intent.putExtra("title", title == null ? item.optString("name", "Nocturne") : title);
                    intent.putExtra("itemJson", item.toString());
                    intent.putExtra("videoId", resolvedVideo);
                    intent.putExtra("profile", "default");
                    intent.putExtra("headers", headersJson == null || headersJson.isEmpty() ? "{}" : headersJson);
                    startActivity(intent);
                } catch (Exception ignored) { }
            });
        }

        @JavascriptInterface public void openExternal(String url) {
            if (url == null || url.trim().isEmpty()) return;
            runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
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
        if (web == null) return super.dispatchKeyEvent(event);

        String key = null;
        switch (event.getKeyCode()) {
            case KeyEvent.KEYCODE_DPAD_UP: key = "ArrowUp"; break;
            case KeyEvent.KEYCODE_DPAD_DOWN: key = "ArrowDown"; break;
            case KeyEvent.KEYCODE_DPAD_LEFT: key = "ArrowLeft"; break;
            case KeyEvent.KEYCODE_DPAD_RIGHT: key = "ArrowRight"; break;
            case KeyEvent.KEYCODE_DPAD_CENTER:
            case KeyEvent.KEYCODE_ENTER: key = "Enter"; break;
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE: key = "MediaPlayPause"; break;
            case KeyEvent.KEYCODE_MENU: key = "ContextMenu"; break;
            case KeyEvent.KEYCODE_BACK:
                if (event.getAction() == KeyEvent.ACTION_DOWN) onBackPressed();
                return true;
        }

        if (key != null) {
            final boolean repeat = event.getRepeatCount() > 0;
            if (event.getAction() == KeyEvent.ACTION_DOWN && repeat) {
                long now = android.os.SystemClock.uptimeMillis();
                if (lastRepeatKeyCode == event.getKeyCode() && now - lastRepeatDispatchAt < 42) return true;
                lastRepeatKeyCode = event.getKeyCode();
                lastRepeatDispatchAt = now;
            } else if (event.getAction() == KeyEvent.ACTION_DOWN) {
                lastRepeatKeyCode = -1;
            }
            final String type = event.getAction() == KeyEvent.ACTION_UP ? "keyup" : "keydown";
            final String script =
                "window.dispatchEvent(new KeyboardEvent(" + JSONObject.quote(type) + ",{" +
                "key:" + JSONObject.quote(key) + "," +
                "code:" + JSONObject.quote(key) + "," +
                "repeat:" + repeat + "," +
                "bubbles:true,cancelable:true" +
                "}));";
            web.evaluateJavascript(script, null);
            return true;
        }

        return super.dispatchKeyEvent(event);
    }


    private void syncNativeProgressToWeb() {
        if (web == null || !seeded) return;
        try {
            LibraryStore store = new LibraryStore(this);
            JSONObject merged = new JSONObject();
            for (StremioClient.Item item : store.list("continue")) {
                String videoId = store.lastVideo(item);
                long pos = store.position(item.type, videoId);
                long dur = store.duration(item.type, videoId);
                JSONObject entry = item.toJson();
                entry.put("_id", item.id);
                entry.put("id", item.id);
                entry.put("removed", false);
                entry.put("temp", true);
                JSONObject state = new JSONObject();
                state.put("timeOffset", pos);
                state.put("duration", dur);
                state.put("video_id", videoId);
                state.put("lastWatched", System.currentTimeMillis());
                entry.put("state", state);
                merged.put(item.id, entry);
            }
            String script =
                "(function(){try{" +
                "var existing={};try{existing=JSON.parse(localStorage.getItem('library')||'{}')}catch(e){};" +
                "var incoming=" + merged.toString() + ";" +
                "Object.keys(incoming).forEach(function(k){var old=existing[k]||{};existing[k]=Object.assign({},old,incoming[k],{state:Object.assign({},old.state||{},incoming[k].state||{})});});" +
                "localStorage.setItem('library',JSON.stringify(existing));" +
                "window.dispatchEvent(new CustomEvent('nocturne-library-sync'));" +
                "}catch(e){}})();";
            web.evaluateJavascript(script, null);
        } catch (Exception ignored) { }
    }

    @Override protected void onResume() {
        super.onResume();
        immersive();
        if (web != null) { web.onResume(); syncNativeProgressToWeb(); }
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
