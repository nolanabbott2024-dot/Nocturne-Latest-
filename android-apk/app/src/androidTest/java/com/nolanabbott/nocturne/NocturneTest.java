package com.nolanabbott.nocturne;

import android.app.*;
import android.content.*;
import android.graphics.*;
import android.os.SystemClock;
import android.view.*;
import android.widget.*;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.media3.exoplayer.ExoPlayer;
import org.junit.*;
import org.junit.runner.RunWith;
import org.json.*;
import java.io.*;
import java.net.*;
import java.lang.reflect.*;
import java.util.*;
import java.util.concurrent.Callable;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class NocturneTest {
    private final Instrumentation ins=InstrumentationRegistry.getInstrumentation();
    private Context context(){return ins.getTargetContext();}
    private Object field(Object object,String name)throws Exception{Field f=object.getClass().getDeclaredField(name);f.setAccessible(true);return f.get(object);}
    private View find(View v,String tag){if(tag.equals(v.getTag()))return v;if(v instanceof ViewGroup)for(int i=0;i<((ViewGroup)v).getChildCount();i++){View found=find(((ViewGroup)v).getChildAt(i),tag);if(found!=null)return found;}return null;}
    private View label(View v,String text){if(text.equals(v.getContentDescription())&&v.isClickable())return v;if(v instanceof TextView&&text.equals(((TextView)v).getText().toString())&&v.isClickable())return v;if(v instanceof ViewGroup)for(int i=0;i<((ViewGroup)v).getChildCount();i++){View found=label(((ViewGroup)v).getChildAt(i),text);if(found!=null)return found;}return null;}
    private void click(Activity a,String tag){ins.runOnMainSync(()->{View v=find(a.getWindow().getDecorView(),tag);assertNotNull(tag,v);v.performClick();});ins.waitForIdleSync();}
    private void clickLabel(Activity a,String text){ins.runOnMainSync(()->{View v=label(a.getWindow().getDecorView(),text);assertNotNull(text,v);v.performClick();});ins.waitForIdleSync();}
    private void waitFor(Callable<Boolean> condition,long timeout)throws Exception{long end=SystemClock.uptimeMillis()+timeout;while(SystemClock.uptimeMillis()<end){final boolean[] ok={false};ins.runOnMainSync(()->{try{ok[0]=condition.call();}catch(Exception ignored){}});if(ok[0])return;SystemClock.sleep(100);}fail("Timed out waiting for native app state");}
    private void shot(String name)throws Exception{ins.waitForIdleSync();SystemClock.sleep(350);File dir=new File(context().getExternalFilesDir(null),"screenshots");dir.mkdirs();try(FileOutputStream out=new FileOutputStream(new File(dir,name+".png"))){ins.getUiAutomation().takeScreenshot().compress(Bitmap.CompressFormat.PNG,100,out);}}

    @Test public void protocolAndLibraryContracts()throws Exception{
        JSONObject m=new JSONObject("{\"id\":\"fixture\",\"name\":\"Fixture\",\"types\":[\"movie\"],\"idPrefixes\":[\"tt\"],\"resources\":[{\"name\":\"stream\",\"types\":[\"series\"],\"idPrefixes\":[\"custom:\"]}],\"catalogs\":[]}");
        StremioClient.Addon a=StremioClient.parseAddon("https://example.org/manifest.json",m);
        assertTrue(StremioClient.supports(a,"stream","series","custom:1:2"));assertFalse(StremioClient.supports(a,"stream","movie","tt123"));
        Map<String,String> extra=new LinkedHashMap<>();extra.put("search","A & B/é");extra.put("skip","20");assertEquals("https://example.org/catalog/series/test/search=A%20%26%20B%2F%C3%A9&skip=20.json",StremioClient.resourceUrl("https://example.org/","catalog","series","test",extra));
        LibraryStore store=new LibraryStore(context());store.switchProfile("default");StremioClient.Item item=StremioClient.Item.fromJson(new JSONObject("{\"id\":\"test\",\"type\":\"series\",\"name\":\"Test\",\"videos\":[{\"id\":\"test:1:1\",\"season\":\"1\",\"episode\":\"1\",\"title\":\"Pilot\"}]}"));assertEquals(1,StremioClient.Item.fromJson(item.toJson()).videos.size());store.put("watchlist",item);store.addProfile("Test profile");String added=store.active();assertFalse(store.contains("watchlist",item));store.switchProfile("default");assertTrue(store.contains("watchlist",item));store.remove("watchlist",item);store.removeProfile(added);
        StremioClient.Stream s1=new StremioClient.Stream(),s2=new StremioClient.Stream();s1.url="https://one.example/video";s2.url="https://two.example/video";s1.name=s2.name="1080p";assertEquals(2,StreamEngine.process(Arrays.asList(s1,s2),store.device).size());
    }

    @Test public void nativePagesPreviewAndPlayback()throws Exception{
        Fixture fixture=new Fixture();fixture.start();MainActivity activity=null;PlayerActivity playerActivity=null;
        try{
            LibraryStore store=new LibraryStore(context());store.device.edit().clear().putString("manifests",new JSONArray().put(fixture.base+"manifest.json").toString()).putBoolean("resource_"+StremioClient.CINEMETA.hashCode()+"_catalog",false).putBoolean("binge",false).apply();store.profile("default").edit().clear().apply();
            Intent intent=new Intent(context(),MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);activity=(MainActivity)ins.startActivitySync(intent);final MainActivity main=activity;
            waitFor(()->find(main.getWindow().getDecorView(),"card-fixture0")!=null,60000);shot("01-home");
            ins.runOnMainSync(()->find(main.getWindow().getDecorView(),"card-fixture0").requestFocus());waitFor(()->field(main,"preview")!=null,12000);shot("02-expanded-preview");
            ins.runOnMainSync(()->find(main.getWindow().getDecorView(),"nav-Movies").requestFocus());waitFor(()->field(main,"preview")==null,3000);
            for(String page:new String[]{"Movies","TV Shows","Sports","Channels","Library","Search","Settings"}){click(main,"nav-"+page);shot("page-"+page.replace(' ','-'));}
            for(String[] entry:new String[][]{{"Add-ons","Add-ons"},{"Catalog Rows","Catalog Rows"},{"Playback & Appearance","Playback"},{"Source Preferences","Sources Settings"},{"Profiles","Profiles"},{"About & Privacy","About"}}){click(main,"nav-Settings");clickLabel(main,entry[0]);shot("settings-"+entry[1].replace(' ','-'));}
            click(main,"nav-Home");waitFor(()->find(main.getWindow().getDecorView(),"card-fixture0")!=null,10000);click(main,"card-fixture0");waitFor(()->label(main.getWindow().getDecorView(),"▶  Play")!=null,10000);shot("03-details");clickLabel(main,"＋  Watchlist");waitFor(()->label(main.getWindow().getDecorView(),"✓  Watchlist")!=null,5000);clickLabel(main,"▶  Play");waitFor(()->label(main.getWindow().getDecorView(),"Fixture 1080p — Test source")!=null,10000);shot("04-sources");
            Instrumentation.ActivityMonitor monitor=ins.addMonitor(PlayerActivity.class.getName(),null,false);clickLabel(main,"Fixture 1080p — Test source");playerActivity=(PlayerActivity)ins.waitForMonitorWithTimeout(monitor,10000);assertNotNull("Player activity opened",playerActivity);final PlayerActivity playing=playerActivity;waitFor(()->{ExoPlayer p=(ExoPlayer)field(playing,"player");return p!=null&&p.isPlaying();},20000);shot("05-player");SystemClock.sleep(5500);ins.runOnMainSync(playing::finish);waitFor(()->store.position("movie","fixture0")>0,5000);click(main,"nav-Library");shot("06-library-progress");assertTrue(store.contains("watchlist",StremioClient.Item.fromJson(new JSONObject(fixture.item("fixture0","movie")))));
            click(main,"nav-TV Shows");waitFor(()->find(main.getWindow().getDecorView(),"card-series0")!=null,10000);click(main,"card-series0");waitFor(()->label(main.getWindow().getDecorView(),"Season 1")!=null,10000);shot("07-series-episodes");
        }finally{if(playerActivity!=null){PlayerActivity p=playerActivity;ins.runOnMainSync(p::finish);}if(activity!=null){MainActivity a=activity;ins.runOnMainSync(a::finish);}fixture.close();}
    }

    private class Fixture {
        ServerSocket server;String base;volatile boolean closed;byte[] video,art;
        Fixture()throws Exception{server=new ServerSocket(0);base="http://127.0.0.1:"+server.getLocalPort()+"/";try(InputStream in=ins.getContext().getAssets().open("sample.mp4")){ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[8192];int n;while((n=in.read(b))>0)out.write(b,0,n);video=out.toByteArray();}Bitmap bitmap=Bitmap.createBitmap(960,540,Bitmap.Config.ARGB_8888);Canvas canvas=new Canvas(bitmap);Paint paint=new Paint();paint.setShader(new LinearGradient(0,0,960,540,new int[]{0xFF102839,0xFF527364,0xFF131821},null,Shader.TileMode.CLAMP));canvas.drawRect(0,0,960,540,paint);paint.setShader(null);paint.setColor(0x8874A18A);canvas.drawCircle(740,220,190,paint);paint.setColor(0xFFCEDFD8);paint.setTextSize(58);canvas.drawText("NOCTURNE",470,385,paint);ByteArrayOutputStream out=new ByteArrayOutputStream();bitmap.compress(Bitmap.CompressFormat.PNG,100,out);art=out.toByteArray();bitmap.recycle();}
        String item(String id,String type){return "{\"id\":\""+id+"\",\"type\":\""+type+"\",\"name\":\""+(type.equals("series")?"The Last Horizon":"Nightfall "+id.replace("fixture",""))+"\",\"background\":\""+base+"art.png\",\"poster\":\""+base+"art.png\",\"description\":\"A journey beyond the familiar. Every discovery brings a new story.\",\"releaseInfo\":\"2026\",\"genres\":[\"Drama\",\"Adventure\"],\"contentRating\":\"PG\",\"trailerStreams\":[{\"url\":\""+base+"video.mp4\"}],\"cast\":[\"Alex Morgan\",\"Jamie Lee\"],\"videos\":"+(type.equals("series")?"[{\"id\":\"series0:1:1\",\"title\":\"A New Beginning\",\"season\":1,\"episode\":1,\"thumbnail\":\""+base+"art.png\"},{\"id\":\"series0:1:2\",\"title\":\"Beyond the Horizon\",\"season\":1,\"episode\":2}]":"[]")+"}";}
        void start(){Thread thread=new Thread(()->{while(!closed)try{Socket s=server.accept();new Thread(()->serve(s)).start();}catch(Exception ignored){}});thread.setDaemon(true);thread.start();}
        void serve(Socket socket){try(Socket s=socket){BufferedReader r=new BufferedReader(new InputStreamReader(s.getInputStream()));String first=r.readLine();if(first==null)return;String path=first.split(" ")[1];String line;int start=0;while((line=r.readLine())!=null&&!line.isEmpty())if(line.toLowerCase().startsWith("range: bytes="))try{start=Integer.parseInt(line.substring(13).split("-")[0]);}catch(Exception ignored){}byte[] bytes;String type="application/json";if(path.contains("video.mp4")){bytes=video;type="video/mp4";}else if(path.contains("art.png")){bytes=art;type="image/png";}else{String json="{}";if(path.contains("manifest.json"))json="{\"id\":\"fixture\",\"name\":\"Nocturne Test Catalog\",\"version\":\"1.0\",\"types\":[\"movie\",\"series\"],\"resources\":[\"catalog\",\"meta\",\"stream\"],\"catalogs\":[{\"type\":\"movie\",\"id\":\"featured\",\"name\":\"Featured\",\"extra\":[{\"name\":\"search\"},{\"name\":\"skip\"},{\"name\":\"genre\",\"options\":[\"Drama\",\"Adventure\"]}]},{\"type\":\"series\",\"id\":\"series\",\"name\":\"Popular Shows\"}]}";else if(path.contains("/catalog/")){String media=path.contains("/series/")?"series":"movie";StringBuilder list=new StringBuilder("{\"metas\":[");for(int i=0;i<12;i++){if(i>0)list.append(',');list.append(item((media.equals("series")?"series":"fixture")+i,media));}json=list.append("]}").toString();}else if(path.contains("/meta/")){String media=path.contains("/series/")?"series":"movie";String id=path.substring(path.lastIndexOf('/')+1).replace(".json","");json="{\"meta\":"+item(id,media)+"}";}else if(path.contains("/stream/"))json="{\"streams\":[{\"name\":\"Fixture 1080p\",\"title\":\"Test source\",\"url\":\""+base+"video.mp4\"}]}";bytes=json.getBytes("UTF-8");}start=Math.min(start,bytes.length);OutputStream out=s.getOutputStream();String head="HTTP/1.1 "+(start>0?"206 Partial Content":"200 OK")+"\r\nContent-Type: "+type+"\r\nContent-Length: "+(bytes.length-start)+"\r\nAccept-Ranges: bytes\r\n"+(start>0?"Content-Range: bytes "+start+"-"+(bytes.length-1)+"/"+bytes.length+"\r\n":"")+"Connection: close\r\n\r\n";out.write(head.getBytes("UTF-8"));out.write(bytes,start,bytes.length-start);out.flush();}catch(Exception ignored){}}
        void close()throws Exception{closed=true;server.close();}
    }
}
