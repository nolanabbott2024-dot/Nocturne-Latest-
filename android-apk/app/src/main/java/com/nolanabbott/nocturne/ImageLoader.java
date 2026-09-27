package com.nolanabbott.nocturne;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.widget.ImageView;

import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import android.util.LruCache;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

final class ImageLoader {
    private final ExecutorService pool = Executors.newFixedThreadPool(5);
    private final LruCache<String, Bitmap> cache = new LruCache<String, Bitmap>((int)Math.min(32*1024*1024,Runtime.getRuntime().maxMemory()/8)) {
        @Override protected int sizeOf(String key,Bitmap bitmap){return bitmap.getByteCount();}
    };

    void load(String url, ImageView view) {
        load(url,view,null);
    }
    void load(String url, ImageView view,Runnable loaded) {
        view.setImageDrawable(null);view.setTag(url);if (url == null || url.isEmpty()||pool.isShutdown()) return;
        view.setTag(url);
        Bitmap hit; synchronized (cache) { hit = cache.get(url); }
        if (hit != null) { view.setImageBitmap(hit);if(loaded!=null)loaded.run(); return; }
        pool.execute(() -> {
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setConnectTimeout(10000); c.setReadTimeout(15000); c.setInstanceFollowRedirects(true);
                InputStream in = c.getInputStream();ByteArrayOutputStream bytes=new ByteArrayOutputStream();byte[] buf=new byte[8192];int n;while((n=in.read(buf))>0){bytes.write(buf,0,n);if(bytes.size()>12000000)throw new IllegalStateException("Image too large");}in.close();c.disconnect();byte[] data=bytes.toByteArray();BitmapFactory.Options opts=new BitmapFactory.Options();opts.inJustDecodeBounds=true;BitmapFactory.decodeByteArray(data,0,data.length,opts);opts.inSampleSize=1;while(opts.outWidth/opts.inSampleSize>1600||opts.outHeight/opts.inSampleSize>1600)opts.inSampleSize*=2;opts.inJustDecodeBounds=false;Bitmap b=BitmapFactory.decodeByteArray(data,0,data.length,opts);
                if (b != null) {
                    synchronized (cache) { cache.put(url, b); }
                    view.post(() -> { if (url.equals(view.getTag())) {view.setImageBitmap(b);if(loaded!=null)loaded.run();} });
                }
            } catch (Exception ignored) { }
        });
    }
    void close(){pool.shutdownNow();cache.evictAll();}
}
