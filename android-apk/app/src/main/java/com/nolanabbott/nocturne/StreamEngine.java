package com.nolanabbott.nocturne;

import android.content.SharedPreferences;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class StreamEngine {
    private static final Pattern RES = Pattern.compile("(?i)\\b(2160p|4k|uhd|1080p|720p|480p|360p)\\b");
    static final class Info {
        StremioClient.Stream stream; String resolution="Unknown", quality="", codec="", audio="";
        String label() { StringBuilder s=new StringBuilder(resolution); if(!quality.isEmpty())s.append(" · ").append(quality); if(!codec.isEmpty())s.append(" · ").append(codec); if(!audio.isEmpty())s.append(" · ").append(audio); if(stream.videoSize>0)s.append(" · ").append(String.format(Locale.US,"%.1f GB",stream.videoSize/1e9)); return s.toString(); }
    }
    static List<Info> process(List<StremioClient.Stream> input, SharedPreferences p) {
        List<Info> out=new ArrayList<>(); String exclude=p.getString("excludeKeywords","").toLowerCase(Locale.US);
        String preferred=p.getString("preferredQuality","Auto"); float max=p.getFloat("maxSizeGB",50f); Set<String> seen=new HashSet<>();
        for(StremioClient.Stream s:input){ Info i=parse(s); String text=text(s).toLowerCase(Locale.US);
            boolean blocked=false; for(String word:exclude.split(","))if(!word.trim().isEmpty()&&text.contains(word.trim()))blocked=true;
            if(blocked||(s.videoSize>0&&max>0&&s.videoSize/1e9>max))continue;
            String k=s.url!=null?s.url:s.externalUrl!=null?s.externalUrl:s.infoHash!=null?s.infoHash:s.ytId;
            if(p.getBoolean("dedupe",true)&&!seen.add(k))continue; out.add(i);
        }
        Collections.sort(out, Comparator.comparingInt((Info i)->score(i,preferred)).reversed().thenComparingLong(i->-i.stream.videoSize)); return out;
    }
    static Info parse(StremioClient.Stream s){ Info i=new Info();i.stream=s;String t=text(s);Matcher m=RES.matcher(t);if(m.find()){String r=m.group(1).toLowerCase(Locale.US);i.resolution=(r.equals("4k")||r.equals("uhd"))?"2160p":r;}String u=t.toUpperCase(Locale.US);if(u.contains("REMUX"))i.quality="Remux";else if(u.contains("BLURAY")||u.contains("BLU-RAY"))i.quality="BluRay";else if(u.contains("WEB-DL")||u.contains("WEBDL"))i.quality="WEB-DL";else if(u.contains("WEBRIP"))i.quality="WEBRip";else if(u.contains("CAM"))i.quality="CAM";if(u.contains("HEVC")||u.contains("H265")||u.contains("X265"))i.codec="HEVC";else if(u.contains("AV1"))i.codec="AV1";else if(u.contains("H264")||u.contains("X264"))i.codec="H.264";if(u.contains("ATMOS"))i.audio="Atmos";else if(u.contains("TRUEHD"))i.audio="TrueHD";else if(u.contains("5.1"))i.audio="5.1";return i;}
    private static int score(Info i,String preferred){int r=i.resolution.equals("2160p")?5:i.resolution.equals("1080p")?4:i.resolution.equals("720p")?3:1;if(!"Auto".equals(preferred)&&preferred.equals(i.resolution))r+=20;if("CAM".equals(i.quality))r-=10;return r;}
    private static String text(StremioClient.Stream s){return (s.name+" "+s.title+" "+s.description+" "+s.filename).replace("null","");}
}
