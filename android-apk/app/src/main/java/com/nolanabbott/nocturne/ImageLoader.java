package com.nolanabbott.nocturne;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.widget.ImageView;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

final class ImageLoader {
    private final ExecutorService pool = Executors.newFixedThreadPool(5);
    private final Map<String, Bitmap> cache = new LinkedHashMap<String, Bitmap>(80, .75f, true) {
        @Override protected boolean removeEldestEntry(Map.Entry<String, Bitmap> e) { return size() > 80; }
    };

    void load(String url, ImageView view) {
        if (url == null || url.isEmpty()) return;
        view.setTag(url);
        Bitmap hit; synchronized (cache) { hit = cache.get(url); }
        if (hit != null) { view.setImageBitmap(hit); return; }
        pool.execute(() -> {
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setConnectTimeout(10000); c.setReadTimeout(15000); c.setInstanceFollowRedirects(true);
                InputStream in = c.getInputStream(); Bitmap b = BitmapFactory.decodeStream(in); in.close(); c.disconnect();
                if (b != null) {
                    synchronized (cache) { cache.put(url, b); }
                    view.post(() -> { if (url.equals(view.getTag())) view.setImageBitmap(b); });
                }
            } catch (Exception ignored) { }
        });
    }
}
