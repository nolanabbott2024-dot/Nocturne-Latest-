package com.nolanabbott.nocturne;

import android.net.Uri;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

final class StremioClient {
    static final String CINEMETA = "https://v3-cinemeta.strem.io/manifest.json";
    static final String DEFAULT_STREAM_ADDON = "https://aiostreams.elfhosted.com/stremio/d498bee7-8f2a-4f0d-8d63-b648a5855650/eyJpIjoiRnhPQ0o0akJoK2xsUnR0S1ZNSE1qQT09IiwiZSI6IkZheDVIQXdvVXA2cEtkOHR3NWMyT2VnYjhoMkhJUVpLSG40Vmk4cDJhOFU9IiwidCI6ImEifQ/manifest.json";

    static final class Addon {
        String id, name, version, logo, description, manifestUrl, baseUrl;
        final List<Catalog> catalogs = new ArrayList<>();
        final List<String> resources = new ArrayList<>();
        final List<String> types = new ArrayList<>();
        final List<String> idPrefixes = new ArrayList<>();
        final Map<String, JSONObject> resourceRules = new LinkedHashMap<>();
    }

    static final class Catalog {
        String type, id, name, addonName, baseUrl;
        boolean searchable, requiresExtra, pageable;
        final List<String> genres = new ArrayList<>();
        final List<String> required = new ArrayList<>();
    }

    static final class Item {
        String id, type, name, poster, background, logo, description, releaseInfo, genres, imdbRating, sourceBase;
        String runtime, contentRating, cast, directors, trailerUrl, trailerYtId;
        final List<Video> videos = new ArrayList<>();

        JSONObject toJson() {
            JSONObject o = new JSONObject();
            try {
                o.put("id", id); o.put("type", type); o.put("name", name);
                o.put("poster", poster); o.put("background", background); o.put("logo", logo);
                o.put("description", description); o.put("releaseInfo", releaseInfo);
                o.put("genres", genres); o.put("imdbRating", imdbRating); o.put("sourceBase", sourceBase);
                o.put("runtime", runtime); o.put("contentRating", contentRating); o.put("cast", cast);
                o.put("directors", directors); o.put("trailerUrl", trailerUrl); o.put("trailerYtId", trailerYtId);
                JSONArray episodes=new JSONArray(); for(Video v:videos){JSONObject e=new JSONObject();e.put("id",v.id);e.put("title",v.title);e.put("season",v.season);e.put("episode",v.episode);e.put("released",v.released);e.put("thumbnail",v.thumbnail);episodes.put(e);}o.put("videos",episodes);
            } catch (Exception ignored) { }
            return o;
        }

        static Item fromJson(JSONObject o) {
            Item i = new Item();
            i.id = o.optString("id"); i.type = o.optString("type"); i.name = o.optString("name");
            i.poster = nullable(o.optString("poster")); i.background = nullable(o.optString("background"));
            i.logo = nullable(o.optString("logo")); i.description = nullable(o.optString("description"));
            i.releaseInfo = nullable(o.optString("releaseInfo")); i.genres = nullable(o.optString("genres"));
            i.imdbRating = nullable(o.optString("imdbRating")); i.sourceBase = nullable(o.optString("sourceBase"));
            i.runtime = nullable(o.optString("runtime")); i.contentRating = nullable(o.optString("contentRating"));
            i.cast = nullable(o.optString("cast")); i.directors = nullable(o.optString("directors"));
            i.trailerUrl = nullable(o.optString("trailerUrl")); i.trailerYtId = nullable(o.optString("trailerYtId"));
            JSONArray videos=o.optJSONArray("videos");if(videos!=null)for(int n=0;n<videos.length();n++){JSONObject e=videos.optJSONObject(n);if(e==null)continue;Video v=new Video();v.id=e.optString("id");v.title=e.optString("title");v.season=e.optString("season");v.episode=e.optString("episode");v.released=nullable(e.optString("released"));v.thumbnail=nullable(e.optString("thumbnail"));i.videos.add(v);}
            return i;
        }
    }

    static final class Video {
        String id, title, season, episode, released, thumbnail;
    }

    static final class Stream {
        String name, title, description, url, externalUrl, ytId, infoHash, filename;
        long videoSize;
        final Map<String,String> headers = new LinkedHashMap<>();
        String label() {
            String a = name == null || name.isEmpty() ? "Stream" : name;
            return title == null || title.isEmpty() ? a : a + " — " + title;
        }
    }

    static final class Subtitle { String id, url, lang; }

    static Addon loadAddon(String manifestUrl) throws Exception {
        JSONObject manifest = getJson(manifestUrl);
        return parseAddon(manifestUrl,manifest);
    }

    static Addon loadAddonFlexible(String enteredUrl) throws Exception {
        String normalized = enteredUrl == null ? "" : enteredUrl.trim().replaceFirst("^stremio://", "https://");
        while (normalized.endsWith("/")) normalized = normalized.substring(0, normalized.length() - 1);
        List<String> candidates = new ArrayList<>();
        if (normalized.endsWith("/manifest.json")) {
            candidates.add(normalized);
        } else {
            candidates.add(normalized);
            candidates.add(normalized + "/manifest.json");
        }
        Exception last = null;
        for (String candidate : candidates) {
            try {
                JSONObject manifest = getJson(candidate);
                if (!manifest.has("id") || !manifest.has("name")) {
                    throw new IllegalArgumentException("Response is not a Stremio manifest");
                }
                return parseAddon(candidate, manifest);
            } catch (Exception e) {
                last = e;
            }
        }
        throw last != null ? last : new IllegalStateException("Unable to load addon manifest");
    }

    static Addon parseAddon(String manifestUrl, JSONObject manifest) throws Exception {
        if(!manifestUrl.endsWith("/manifest.json")) throw new IllegalArgumentException("The addon URL must end in /manifest.json");
        if(!manifest.has("id")||!manifest.has("name"))throw new IllegalArgumentException("This is not a Stremio manifest");
        Addon a = new Addon();
        a.id = manifest.optString("id", manifestUrl);
        a.name = manifest.optString("name", "Stremio addon");
        a.version = manifest.optString("version", ""); a.logo = nullable(manifest.optString("logo"));
        a.description = nullable(manifest.optString("description"));
        a.manifestUrl = manifestUrl;
        int slash = manifestUrl.lastIndexOf('/');
        a.baseUrl = slash >= 0 ? manifestUrl.substring(0, slash + 1) : manifestUrl;
        JSONArray resources = manifest.optJSONArray("resources");
        if (resources != null) for (int x = 0; x < resources.length(); x++) {
            Object r = resources.opt(x);
            if (r instanceof String) a.resources.add((String) r);
            else if (r instanceof JSONObject) {JSONObject rule=(JSONObject)r;String name=rule.optString("name");a.resources.add(name);a.resourceRules.put(name,rule);}
        }
        JSONArray types = manifest.optJSONArray("types");
        if (types != null) for (int i = 0; i < types.length(); i++) a.types.add(types.optString(i));
        JSONArray prefixes = manifest.optJSONArray("idPrefixes");
        if (prefixes != null) for (int i = 0; i < prefixes.length(); i++) a.idPrefixes.add(prefixes.optString(i));
        JSONArray catalogs = manifest.optJSONArray("catalogs");
        if (catalogs != null) for (int x = 0; x < catalogs.length(); x++) {
            JSONObject c = catalogs.optJSONObject(x);
            if (c == null) continue;
            Catalog cat = new Catalog();
            cat.type = c.optString("type"); cat.id = c.optString("id");
            cat.name = c.optString("name", cat.id); cat.addonName = a.name; cat.baseUrl = a.baseUrl;
            JSONArray extra = c.optJSONArray("extra");
            if (extra != null) for (int y = 0; y < extra.length(); y++) {
                Object e = extra.opt(y);
                String name=e instanceof String?(String)e:((JSONObject)e).optString("name");
                if("search".equals(name))cat.searchable=true;if("skip".equals(name))cat.pageable=true;
                if(e instanceof JSONObject){JSONObject eo=(JSONObject)e;if(eo.optBoolean("isRequired",false)){cat.requiresExtra=true;cat.required.add(name);}if("genre".equals(name)){JSONArray values=eo.optJSONArray("options");if(values!=null)for(int z=0;z<values.length();z++)cat.genres.add(values.optString(z));}}
            }
            if (!cat.type.isEmpty() && !cat.id.isEmpty()) a.catalogs.add(cat);
        }
        return a;
    }

    static List<Item> loadCatalog(Catalog c, int skip, String search) throws Exception {
        Map<String,String> extra=new LinkedHashMap<>();if(search!=null&&!search.trim().isEmpty())extra.put("search",search.trim());if(skip>0&&c.pageable)extra.put("skip",String.valueOf(skip));return loadCatalog(c,extra);
    }

    static String resourceUrl(String base,String resource,String type,String id,Map<String,String> extras){
        StringBuilder p=new StringBuilder(base).append(seg(resource)).append('/').append(seg(type)).append('/').append(seg(id));
        if(extras!=null&&!extras.isEmpty()){p.append('/');boolean first=true;for(Map.Entry<String,String> e:extras.entrySet()){if(!first)p.append('&');first=false;p.append(seg(e.getKey())).append('=').append(seg(e.getValue()));}}return p.append(".json").toString();
    }

    static List<Item> loadCatalog(Catalog c,Map<String,String> extra) throws Exception {
        for(String required:c.required)if(!extra.containsKey(required))throw new IllegalArgumentException("Choose "+required+" for this catalog");
        JSONObject o = getJson(resourceUrl(c.baseUrl,"catalog",c.type,c.id,extra));
        JSONArray metas = o.optJSONArray("metas");
        List<Item> out = new ArrayList<>();
        if (metas != null) for (int i = 0; i < metas.length(); i++) {
            JSONObject m = metas.optJSONObject(i);
            if (m != null) { Item item = parseItem(m, c.type); item.sourceBase = c.baseUrl; out.add(item); }
        }
        return out;
    }

    static Item loadMeta(Addon addon, String type, String id) throws Exception {
        JSONObject o = getJson(addon.baseUrl + "meta/" + seg(type) + "/" + seg(id) + ".json");
        if(o.optJSONObject("meta")==null)throw new IllegalStateException("Metadata unavailable");Item item = parseItem(o.optJSONObject("meta"), type); item.sourceBase = addon.baseUrl; return item;
    }

    static List<Stream> loadStreams(Addon addon, String type, String id) throws Exception {
        JSONObject o = getJson(addon.baseUrl + "stream/" + seg(type) + "/" + seg(id) + ".json");
        JSONArray arr = o.optJSONArray("streams");
        List<Stream> out = new ArrayList<>();
        if (arr != null) for (int i = 0; i < arr.length(); i++) {
            JSONObject s = arr.optJSONObject(i); if (s == null) continue;
            Stream stream = new Stream();
            stream.name = s.optString("name"); stream.title = s.optString("title"); stream.description = s.optString("description");
            stream.url = nullable(s.optString("url")); stream.externalUrl = nullable(s.optString("externalUrl"));
            stream.ytId = nullable(s.optString("ytId")); stream.infoHash = nullable(s.optString("infoHash"));
            JSONObject hints = s.optJSONObject("behaviorHints");
            if (hints != null) { stream.filename = nullable(hints.optString("filename")); stream.videoSize = hints.optLong("videoSize", 0);JSONObject proxy=hints.optJSONObject("proxyHeaders");if(proxy!=null){JSONObject request=proxy.optJSONObject("request");if(request!=null){java.util.Iterator<String>keys=request.keys();while(keys.hasNext()){String k=keys.next();stream.headers.put(k,request.optString(k));}}} }
            if (stream.url != null || stream.externalUrl != null || stream.ytId != null || stream.infoHash != null) out.add(stream);
        }
        return out;
    }

    static boolean supports(Addon a,String resource,String type,String id){if(!a.resources.contains(resource))return false;JSONObject rule=a.resourceRules.get(resource);List<String> types=rule!=null&&rule.has("types")?strings(rule.optJSONArray("types")):a.types;List<String> prefixes=rule!=null&&rule.has("idPrefixes")?strings(rule.optJSONArray("idPrefixes")):a.idPrefixes;if(!types.isEmpty()&&!types.contains(type))return false;if(!prefixes.isEmpty()){for(String p:prefixes)if(id!=null&&id.startsWith(p))return true;return false;}return true;}
    private static List<String> strings(JSONArray a){List<String>o=new ArrayList<>();if(a!=null)for(int i=0;i<a.length();i++)o.add(a.optString(i));return o;}

    static List<Subtitle> loadSubtitles(Addon addon, String type, String id) throws Exception {
        JSONObject o = getJson(addon.baseUrl + "subtitles/" + seg(type) + "/" + seg(id) + ".json");
        JSONArray arr = o.optJSONArray("subtitles"); List<Subtitle> out = new ArrayList<>();
        if (arr != null) for (int i = 0; i < arr.length(); i++) {
            JSONObject s = arr.optJSONObject(i); if (s == null) continue; Subtitle sub = new Subtitle();
            sub.id = s.optString("id"); sub.url = nullable(s.optString("url")); sub.lang = s.optString("lang", "und");
            if (sub.url != null) out.add(sub);
        }
        return out;
    }

    private static Item parseItem(JSONObject m, String fallbackType) {
        Item item = new Item(); if (m == null) return item;
        item.id = m.optString("id"); item.type = m.optString("type", fallbackType);
        item.name = m.optString("name", "Untitled"); item.poster = nullable(m.optString("poster"));
        item.background = nullable(m.optString("background")); item.logo = nullable(m.optString("logo"));
        item.description = nullable(m.optString("description")); item.releaseInfo = nullable(m.optString("releaseInfo"));
        item.imdbRating = nullable(m.optString("imdbRating"));
        item.runtime = nullable(m.optString("runtime")); item.contentRating = nullable(m.optString("contentRating"));
        item.cast = join(m.optJSONArray("cast"), 6); item.directors = join(m.optJSONArray("director"), 3);
        if (item.directors == null) item.directors = join(m.optJSONArray("directors"), 3);
        if(item.directors==null)item.directors=nullable(m.optString("director"));
        JSONArray trailers = m.optJSONArray("trailerStreams"); if (trailers == null) trailers = m.optJSONArray("trailers");
        if (trailers != null && trailers.length() > 0) {
            JSONObject t = trailers.optJSONObject(0); if (t != null) { item.trailerUrl = nullable(t.optString("url")); item.trailerYtId = nullable(t.optString("ytId")); if(item.trailerYtId==null)item.trailerYtId=nullable(t.optString("source")); }
        }
        JSONArray genres = m.optJSONArray("genres");
        if (genres != null) {
            StringBuilder g = new StringBuilder();
            for (int i = 0; i < Math.min(3, genres.length()); i++) {
                if (i > 0) g.append(" · "); g.append(genres.optString(i));
            }
            item.genres = g.toString();
        }
        JSONArray videos = m.optJSONArray("videos");
        if (videos != null) for (int x = 0; x < videos.length(); x++) {
            JSONObject v = videos.optJSONObject(x); if (v == null) continue;
            Video video = new Video(); video.id = v.optString("id");
            video.title = v.optString("title", v.optString("name", "Episode " + (x + 1)));
            video.season = String.valueOf(v.optInt("season", 0)); video.episode = String.valueOf(v.optInt("episode", 0));
            video.released = nullable(v.optString("released")); video.thumbnail = nullable(v.optString("thumbnail"));
            if (!video.id.isEmpty()) item.videos.add(video);
        }
        return item;
    }

    static JSONObject getJson(String address) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(address).openConnection();
        c.setConnectTimeout(12000); c.setReadTimeout(18000); c.setInstanceFollowRedirects(true);
        c.setRequestProperty("Accept", "application/json");
        c.setRequestProperty("User-Agent", "NocturneTV/4.0 Android");
        int status = c.getResponseCode();
        InputStream in = status >= 200 && status < 300 ? c.getInputStream() : c.getErrorStream();
        if(in==null){c.disconnect();throw new IllegalStateException("HTTP "+status);}BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
        StringBuilder body = new StringBuilder(); String line;
        while ((line = reader.readLine()) != null) body.append(line);
        reader.close(); c.disconnect();
        if (status < 200 || status >= 300) {
            String detail = body.toString().replaceAll("\\s+", " ").trim();
            if (detail.length() > 180) detail = detail.substring(0, 180) + "…";
            throw new IllegalStateException("HTTP " + status + (detail.isEmpty() ? "" : " · " + detail));
        }
        return new JSONObject(body.toString());
    }

    private static String seg(String value) { return Uri.encode(value == null ? "" : value, ""); }
    private static String join(JSONArray a, int max) { if (a == null || a.length() == 0) return null; StringBuilder s = new StringBuilder(); for (int i = 0; i < Math.min(max, a.length()); i++) { if (i > 0) s.append(", "); s.append(a.optString(i)); } return s.toString(); }
    private static String nullable(String s) { return s == null || s.isEmpty() || "null".equals(s) ? null : s; }
}
