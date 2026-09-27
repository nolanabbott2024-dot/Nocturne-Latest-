package com.nolanabbott.nocturne;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.*;
import java.util.*;

/** Profile-local library state, separate from device-wide addon configuration. */
final class LibraryStore {
    private final Context context;
    final SharedPreferences device;
    LibraryStore(Context c){context=c;device=c.getSharedPreferences("nocturne_native",0);migrate();}
    private void migrate(){if(device.getBoolean("libraryV4",false))return;SharedPreferences.Editor edit=profile("default").edit();for(String key:new String[]{"watchlist","continue"}){JSONArray list=new JSONArray();for(String raw:device.getStringSet(key,new HashSet<>()))try{list.put(new JSONObject(raw));}catch(Exception ignored){}edit.putString(key,list.toString());}edit.apply();device.edit().putBoolean("libraryV4",true).apply();}
    String active(){return device.getString("activeProfile","default");}
    SharedPreferences profile(){return profile(active());}
    SharedPreferences profile(String id){return context.getSharedPreferences("profile_"+id,0);}
    LinkedHashMap<String,String> profiles(){LinkedHashMap<String,String> out=new LinkedHashMap<>();out.put("default",device.getString("defaultName","Me"));try{JSONObject o=new JSONObject(device.getString("profiles","{}"));Iterator<String> it=o.keys();while(it.hasNext()){String k=it.next();out.put(k,o.getString(k));}}catch(Exception ignored){}return out;}
    void addProfile(String name){try{JSONObject o=new JSONObject(device.getString("profiles","{}"));String id=UUID.randomUUID().toString();o.put(id,name);device.edit().putString("profiles",o.toString()).putString("activeProfile",id).apply();}catch(Exception ignored){}}
    void switchProfile(String id){if(profiles().containsKey(id))device.edit().putString("activeProfile",id).apply();}
    void renameProfile(String name){if(name.trim().isEmpty())return;if(active().equals("default")){device.edit().putString("defaultName",name.trim()).apply();return;}try{JSONObject o=new JSONObject(device.getString("profiles","{}"));o.put(active(),name.trim());device.edit().putString("profiles",o.toString()).apply();}catch(Exception ignored){}}
    void removeProfile(String id){if("default".equals(id))return;try{JSONObject o=new JSONObject(device.getString("profiles","{}"));o.remove(id);profile(id).edit().clear().apply();device.edit().putString("profiles",o.toString()).putString("activeProfile","default").apply();}catch(Exception ignored){}}
    List<StremioClient.Item> list(String key){List<StremioClient.Item> out=new ArrayList<>();try{JSONArray a=new JSONArray(profile().getString(key,"[]"));for(int i=0;i<a.length();i++)out.add(StremioClient.Item.fromJson(a.getJSONObject(i)));}catch(Exception ignored){}return out;}
    boolean contains(String list,StremioClient.Item item){for(StremioClient.Item i:list(list))if(key(i).equals(key(item)))return true;return false;}
    void put(String list,StremioClient.Item item){List<StremioClient.Item> all=list(list);all.removeIf(i->key(i).equals(key(item)));all.add(0,item);write(list,all);}
    void remove(String list,StremioClient.Item item){List<StremioClient.Item> all=list(list);all.removeIf(i->key(i).equals(key(item)));write(list,all);}
    void write(String list,List<StremioClient.Item> items){JSONArray a=new JSONArray();for(StremioClient.Item i:items)a.put(i.toJson());profile().edit().putString(list,a.toString()).apply();}
    void toggle(String list,StremioClient.Item item){if(contains(list,item))remove(list,item);else put(list,item);}
    void markWatched(StremioClient.Item item,boolean watched){if(watched){put("watched",item);remove("continue",item);}else remove("watched",item);}
    static String key(StremioClient.Item i){return i.type+":"+i.id;}
    String lastVideo(StremioClient.Item i){return profile().getString("last_"+key(i),i.id);}
    long position(String type,String id){return profile().getLong("position_"+type+":"+id,0);}
    long duration(String type,String id){return profile().getLong("duration_"+type+":"+id,0);}
    void record(StremioClient.Item item,String video,long pos,long dur){profile().edit().putLong("position_"+item.type+":"+video,pos).putLong("duration_"+item.type+":"+video,dur).putString("last_"+key(item),video).apply();if(dur>0&&pos>=dur*.95){profile().edit().putBoolean("watched_"+item.type+":"+video,true).apply();if(!"series".equals(item.type))markWatched(item,true);}else if(pos>5000)put("continue",item);}
    boolean allowed(StremioClient.Item i){if(!profile().getBoolean("familyOnly",false))return true;String r=i.contentRating==null?"":i.contentRating.toUpperCase(Locale.US);return Arrays.asList("G","PG","TV-Y","TV-Y7","TV-G","TV-PG").contains(r);}
}
