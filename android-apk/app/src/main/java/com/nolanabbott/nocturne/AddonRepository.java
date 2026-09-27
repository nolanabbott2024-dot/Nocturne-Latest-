package com.nolanabbott.nocturne;

import android.os.*;
import org.json.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/** Stremio-style resource layer: transport/model/effects are kept outside the views. */
final class AddonRepository {
    interface Result<T>{void done(T value,String error);}
    final List<StremioClient.Addon> addons=new CopyOnWriteArrayList<>();
    final List<String> failures=new CopyOnWriteArrayList<>();
    final ExecutorService io=Executors.newFixedThreadPool(6);
    private volatile boolean closed;
    private final Handler ui=new Handler(Looper.getMainLooper());
    final LibraryStore store;
    private final Map<String,StremioClient.Item> metadata=new ConcurrentHashMap<>();
    private final Map<String,List<StremioClient.Item>> cache=new ConcurrentHashMap<>();
    private final Map<String,Long> timestamps=new ConcurrentHashMap<>();
    AddonRepository(LibraryStore store){this.store=store;}
    List<String> urls(){List<String> out=new ArrayList<>();try{JSONArray a=new JSONArray(store.device.getString("manifests","[]"));for(int i=0;i<a.length();i++)if(!out.contains(a.getString(i)))out.add(a.getString(i));}catch(Exception ignored){}if(!out.contains(StremioClient.CINEMETA))out.add(0,StremioClient.CINEMETA);return out;}
    void saveUrls(List<String> urls){store.device.edit().putString("manifests",new JSONArray(urls).toString()).apply();}
    void refresh(Result<List<StremioClient.Addon>> cb){addons.clear();failures.clear();cache.clear();List<String> urls=urls();AtomicInteger count=new AtomicInteger(urls.size());for(String url:urls)io.execute(()->{try{JSONObject manifest=StremioClient.getJson(url);StremioClient.Addon a=StremioClient.parseAddon(url,manifest);addons.add(a);store.device.edit().putString("manifestCache_"+url.hashCode(),manifest.toString()).apply();}catch(Exception e){try{addons.add(StremioClient.parseAddon(url,new JSONObject(store.device.getString("manifestCache_"+url.hashCode(),"{}"))));}catch(Exception ignored){}failures.add(android.net.Uri.parse(url).getHost()+": "+e.getMessage());}if(count.decrementAndGet()==0){List<StremioClient.Addon> ordered=new ArrayList<>(addons);ordered.sort(Comparator.comparingInt(a->urls.indexOf(a.manifestUrl)));addons.clear();addons.addAll(ordered);deliver(()->cb.done(new ArrayList<>(addons),failures.isEmpty()?null:String.join("\n",failures)));}});}
    boolean enabled(StremioClient.Addon a,String resource){return store.device.getBoolean("resource_"+a.manifestUrl.hashCode()+"_"+resource,true);}
    void enable(StremioClient.Addon a,String r,boolean enabled){store.device.edit().putBoolean("resource_"+a.manifestUrl.hashCode()+"_"+r,enabled).apply();}
    List<StremioClient.Catalog> catalogs(){List<StremioClient.Catalog> out=new ArrayList<>();for(StremioClient.Addon a:addons)if(enabled(a,"catalog"))out.addAll(a.catalogs);List<String>order=new ArrayList<>();try{JSONArray a=new JSONArray(store.device.getString("catalogOrder","[]"));for(int i=0;i<a.length();i++)order.add(a.getString(i));}catch(Exception ignored){}out.sort(Comparator.comparingInt(c->{int n=order.indexOf(catalogKey(c));return n<0?999:n;}));return out;}
    static String catalogKey(StremioClient.Catalog c){return c.baseUrl+"|"+c.type+"|"+c.id;}
    boolean hidden(StremioClient.Catalog c){return store.device.getStringSet("hiddenCatalogs",Collections.emptySet()).contains(catalogKey(c));}
    String name(StremioClient.Catalog c){try{return new JSONObject(store.device.getString("catalogNames","{}")).optString(catalogKey(c),c.name);}catch(Exception e){return c.name;}}
    void catalog(StremioClient.Catalog c,Map<String,String> extras,Result<List<StremioClient.Item>> cb){String k=catalogKey(c)+extras.toString();if(cache.containsKey(k)&&System.currentTimeMillis()-timestamps.getOrDefault(k,0L)<300000){cb.done(cache.get(k),null);return;}io.execute(()->{try{List<StremioClient.Item> items=StremioClient.loadCatalog(c,extras);if(cache.size()>100){cache.clear();timestamps.clear();}cache.put(k,items);timestamps.put(k,System.currentTimeMillis());deliver(()->cb.done(items,null));}catch(Exception e){deliver(()->cb.done(Collections.emptyList(),e.getMessage()));}});}
    void meta(StremioClient.Item seed,Result<StremioClient.Item> cb){StremioClient.Item cached=metadata.get(LibraryStore.key(seed));if(cached!=null){cb.done(cached,null);return;}io.execute(()->{List<StremioClient.Addon> sources=new ArrayList<>(addons);sources.sort(Comparator.comparingInt(a->a.baseUrl.equals(seed.sourceBase)?0:1));for(StremioClient.Addon a:sources)if(enabled(a,"meta")&&StremioClient.supports(a,"meta",seed.type,seed.id))try{StremioClient.Item full=StremioClient.loadMeta(a,seed.type,seed.id);if(full.background==null)full.background=seed.background;if(full.logo==null)full.logo=seed.logo;if(full.poster==null)full.poster=seed.poster;metadata.put(LibraryStore.key(full),full);deliver(()->cb.done(full,null));return;}catch(Exception ignored){}deliver(()->cb.done(seed,"Full metadata is unavailable from your addons."));});}
    void streams(StremioClient.Item item,String id,Result<List<StremioClient.Stream>> cb){List<StremioClient.Addon> sources=new ArrayList<>();for(StremioClient.Addon a:addons)if(enabled(a,"stream")&&StremioClient.supports(a,"stream",item.type,id))sources.add(a);if(sources.isEmpty()){cb.done(Collections.emptyList(),"Install a stream addon in Settings to watch this title.");return;}List<StremioClient.Stream> out=new CopyOnWriteArrayList<>();List<String> errors=new CopyOnWriteArrayList<>();AtomicInteger remaining=new AtomicInteger(sources.size());for(StremioClient.Addon a:sources)io.execute(()->{try{out.addAll(StremioClient.loadStreams(a,item.type,id));}catch(Exception e){errors.add(a.name+": "+e.getMessage());}if(remaining.decrementAndGet()==0)deliver(()->cb.done(out,errors.isEmpty()?null:String.join("\n",errors)));});}
    void subtitles(StremioClient.Item item,String id,Result<List<StremioClient.Subtitle>> cb){io.execute(()->{List<StremioClient.Subtitle> out=new ArrayList<>();for(StremioClient.Addon a:addons)if(enabled(a,"subtitles")&&StremioClient.supports(a,"subtitles",item.type,id))try{out.addAll(StremioClient.loadSubtitles(a,item.type,id));}catch(Exception ignored){}deliver(()->cb.done(out,null));});}
    private void deliver(Runnable callback){ui.post(()->{if(!closed)callback.run();});}
    void close(){closed=true;io.shutdownNow();ui.removeCallbacksAndMessages(null);}
}
