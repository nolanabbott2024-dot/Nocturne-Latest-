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

final class StremioClient {
    static final String CINEMETA = "https://v3-cinemeta.strem.io/manifest.json";

    static final class Addon {
        String name, manifestUrl, baseUrl;
        final List<Catalog> catalogs = new ArrayList<>();
        final List<String> resources = new ArrayList<>();
    }

    static final class Catalog {
        String type, id, name, addonName, baseUrl;
        boolean searchable;
    }

    static final class Item {
        String id, type, name, poster, background, logo, description, releaseInfo, genres, imdbRating;
        final List<Video> videos = new ArrayList<>();

        JSONObject toJson() {
            JSONObject o = new JSONObject();
            try {
                o.put("id", id); o.put("type", type); o.put("name", name);
                o.put("poster", poster); o.put("background", background); o.put("logo", logo);
                o.put("description", description); o.put("releaseInfo", releaseInfo);
                o.put("genres", genres); o.put("imdbRating", imdbRating);
            } catch (Exception ignored) { }
            return o;
        }

        static Item fromJson(JSONObject o) {
            Item i = new Item();
            i.id = o.optString("id"); i.type = o.optString("type"); i.name = o.optString("name");
            i.poster = nullable(o.optString("poster")); i.background = nullable(o.optString("background"));
            i.logo = nullable(o.optString("logo")); i.description = nullable(o.optString("description"));
            i.releaseInfo = nullable(o.optString("releaseInfo")); i.genres = nullable(o.optString("genres"));
            i.imdbRating = nullable(o.optString("imdbRating"));
            return i;
        }
    }

    static final class Video {
        String id, title, season, episode, released, thumbnail;
    }

    static final class Stream {
        String name, title, url, externalUrl, ytId;
        String label() {
            String a = name == null || name.isEmpty() ? "Stream" : name;
            return title == null || title.isEmpty() ? a : a + " — " + title;
        }
    }

    static Addon loadAddon(String manifestUrl) throws Exception {
        JSONObject manifest = getJson(manifestUrl);
        Addon a = new Addon();
        a.name = manifest.optString("name", "Stremio addon");
        a.manifestUrl = manifestUrl;
        int slash = manifestUrl.lastIndexOf('/');
        a.baseUrl = slash >= 0 ? manifestUrl.substring(0, slash + 1) : manifestUrl;
        JSONArray resources = manifest.optJSONArray("resources");
        if (resources != null) for (int x = 0; x < resources.length(); x++) {
            Object r = resources.opt(x);
            if (r instanceof String) a.resources.add((String) r);
            else if (r instanceof JSONObject) a.resources.add(((JSONObject) r).optString("name"));
        }
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
                if (e instanceof String && "search".equals(e)) cat.searchable = true;
                if (e instanceof JSONObject && "search".equals(((JSONObject) e).optString("name"))) cat.searchable = true;
            }
            if (!cat.type.isEmpty() && !cat.id.isEmpty()) a.catalogs.add(cat);
        }
        return a;
    }

    static List<Item> loadCatalog(Catalog c, int skip, String search) throws Exception {
        StringBuilder path = new StringBuilder(c.baseUrl).append("catalog/")
                .append(seg(c.type)).append('/').append(seg(c.id));
        if (search != null && !search.trim().isEmpty()) {
            path.append("/search=").append(seg(search.trim()));
        } else if (skip > 0) path.append("/skip=").append(skip);
        path.append(".json");
        JSONObject o = getJson(path.toString());
        JSONArray metas = o.optJSONArray("metas");
        List<Item> out = new ArrayList<>();
        if (metas != null) for (int i = 0; i < metas.length(); i++) {
            JSONObject m = metas.optJSONObject(i);
            if (m != null) out.add(parseItem(m, c.type));
        }
        return out;
    }

    static Item loadMeta(Addon addon, String type, String id) throws Exception {
        JSONObject o = getJson(addon.baseUrl + "meta/" + seg(type) + "/" + seg(id) + ".json");
        return parseItem(o.optJSONObject("meta"), type);
    }

    static List<Stream> loadStreams(Addon addon, String type, String id) throws Exception {
        JSONObject o = getJson(addon.baseUrl + "stream/" + seg(type) + "/" + seg(id) + ".json");
        JSONArray arr = o.optJSONArray("streams");
        List<Stream> out = new ArrayList<>();
        if (arr != null) for (int i = 0; i < arr.length(); i++) {
            JSONObject s = arr.optJSONObject(i); if (s == null) continue;
            Stream stream = new Stream();
            stream.name = s.optString("name"); stream.title = s.optString("title");
            stream.url = nullable(s.optString("url")); stream.externalUrl = nullable(s.optString("externalUrl"));
            stream.ytId = nullable(s.optString("ytId"));
            if (stream.url != null || stream.externalUrl != null || stream.ytId != null) out.add(stream);
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

    private static JSONObject getJson(String address) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(address).openConnection();
        c.setConnectTimeout(12000); c.setReadTimeout(18000); c.setInstanceFollowRedirects(true);
        c.setRequestProperty("Accept", "application/json");
        c.setRequestProperty("User-Agent", "NocturneTV/2.0 Android");
        int status = c.getResponseCode();
        InputStream in = status >= 200 && status < 300 ? c.getInputStream() : c.getErrorStream();
        BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
        StringBuilder body = new StringBuilder(); String line;
        while ((line = reader.readLine()) != null) body.append(line);
        reader.close(); c.disconnect();
        if (status < 200 || status >= 300) throw new IllegalStateException("HTTP " + status);
        return new JSONObject(body.toString());
    }

    private static String seg(String value) { return Uri.encode(value == null ? "" : value, ""); }
    private static String nullable(String s) { return s == null || s.isEmpty() || "null".equals(s) ? null : s; }
}
