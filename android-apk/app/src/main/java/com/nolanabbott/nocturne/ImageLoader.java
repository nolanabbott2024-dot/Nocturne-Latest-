package com.nolanabbott.nocturne;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.widget.ImageView;
import android.util.LruCache;

import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.lang.ref.WeakReference;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

final class ImageLoader {
    private final ExecutorService pool = Executors.newFixedThreadPool(4);
    private final ConcurrentHashMap<String, CopyOnWriteArrayList<Target>> waiters = new ConcurrentHashMap<>();
    private final LruCache<String, Bitmap> cache = new LruCache<String, Bitmap>((int)Math.min(40*1024*1024,Runtime.getRuntime().maxMemory()/7)) {
        @Override protected int sizeOf(String key,Bitmap bitmap){return bitmap.getByteCount();}
    };
    private static final class Target {
        final WeakReference<ImageView> view; final Runnable loaded;
        Target(ImageView v,Runnable r){view=new WeakReference<>(v);loaded=r;}
    }

    void load(String url, ImageView view) { load(url,view,null); }

    void load(String url, ImageView view,Runnable loaded) {
        view.setImageDrawable(null);
        view.setTag(url);
        if(url==null||url.isEmpty()||pool.isShutdown())return;
        Bitmap hit; synchronized(cache){hit=cache.get(url);}
        if(hit!=null){view.setImageBitmap(hit);if(loaded!=null)loaded.run();return;}

        CopyOnWriteArrayList<Target> list=waiters.computeIfAbsent(url,k->new CopyOnWriteArrayList<>());
        list.add(new Target(view,loaded));
        if(list.size()>1)return;

        pool.execute(()->{
            Bitmap bitmap=null;
            try{
                HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();
                c.setConnectTimeout(7000);c.setReadTimeout(10000);c.setInstanceFollowRedirects(true);
                c.setRequestProperty("User-Agent","NocturneTV/4.0 Android");
                InputStream in=c.getInputStream();
                ByteArrayOutputStream bytes=new ByteArrayOutputStream();
                byte[] buf=new byte[8192];int n;
                while((n=in.read(buf))>0){bytes.write(buf,0,n);if(bytes.size()>10000000)throw new IllegalStateException("Image too large");}
                in.close();c.disconnect();
                byte[] data=bytes.toByteArray();
                BitmapFactory.Options opts=new BitmapFactory.Options();opts.inJustDecodeBounds=true;
                BitmapFactory.decodeByteArray(data,0,data.length,opts);
                opts.inSampleSize=1;
                while(opts.outWidth/opts.inSampleSize>1280||opts.outHeight/opts.inSampleSize>1280)opts.inSampleSize*=2;
                opts.inJustDecodeBounds=false;
                bitmap=BitmapFactory.decodeByteArray(data,0,data.length,opts);
                if(bitmap!=null)synchronized(cache){cache.put(url,bitmap);}
            }catch(Exception ignored){}
            final Bitmap ready=bitmap;
            List<Target> targets=waiters.remove(url);
            if(targets==null)return;
            for(Target t:targets){
                ImageView v=t.view.get();if(v==null)continue;
                v.post(()->{if(url.equals(v.getTag())&&ready!=null){v.setImageBitmap(ready);if(t.loaded!=null)t.loaded.run();}});
            }
        });
    }

    void close(){pool.shutdownNow();waiters.clear();cache.evictAll();}
}
