package com.nolanabbott.nocturne;

import android.app.*;
import android.content.*;
import android.graphics.*;
import android.os.SystemClock;
import android.view.*;
import android.webkit.ValueCallback;
import android.webkit.WebView;
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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class NocturneTest {
    private final Instrumentation ins=InstrumentationRegistry.getInstrumentation();
    private Context context(){return ins.getTargetContext();}
    private Object field(Object object,String name)throws Exception{Field f=object.getClass().getDeclaredField(name);f.setAccessible(true);return f.get(object);}
    private void waitFor(Callable<Boolean> condition,long timeout)throws Exception{
        long end=SystemClock.uptimeMillis()+timeout;
        while(SystemClock.uptimeMillis()<end){
            final boolean[] ok={false};
            ins.runOnMainSync(()->{try{ok[0]=condition.call();}catch(Exception ignored){}});
            if(ok[0])return;
            SystemClock.sleep(100);
        }
        fail("Timed out waiting for app state");
    }
    private String js(WebView web,String script)throws Exception{
        CountDownLatch latch=new CountDownLatch(1);
        final String[] result={null};
        ins.runOnMainSync(()->web.evaluateJavascript(script,value->{result[0]=value;latch.countDown();}));
        assertTrue("JavaScript callback timed out",latch.await(8,TimeUnit.SECONDS));
        if(result[0]==null||"null".equals(result[0]))return null;
        try{return new JSONArray("["+result[0]+"]").optString(0,null);}catch(Exception e){return result[0];}
    }
    private void key(int code){
        ins.sendKeySync(new android.view.KeyEvent(android.view.KeyEvent.ACTION_DOWN,code));
        ins.sendKeySync(new android.view.KeyEvent(android.view.KeyEvent.ACTION_UP,code));
        ins.waitForIdleSync();
    }
    private void shot(String name)throws Exception{
        ins.waitForIdleSync();SystemClock.sleep(300);
        File dir=new File(context().getExternalFilesDir(null),"screenshots");dir.mkdirs();
        try(FileOutputStream out=new FileOutputStream(new File(dir,name+".png"))){
            ins.getUiAutomation().takeScreenshot().compress(Bitmap.CompressFormat.PNG,100,out);
        }
    }

    @Test public void protocolAndLibraryContracts()throws Exception{
        JSONObject m=new JSONObject("{\"id\":\"fixture\",\"name\":\"Fixture\",\"types\":[\"movie\"],\"idPrefixes\":[\"tt\"],\"resources\":[{\"name\":\"stream\",\"types\":[\"series\"],\"idPrefixes\":[\"custom:\"]}],\"catalogs\":[]}");
        StremioClient.Addon a=StremioClient.parseAddon("https://example.org/manifest.json",m);
        assertTrue(StremioClient.supports(a,"stream","series","custom:1:2"));
        assertFalse(StremioClient.supports(a,"stream","movie","tt123"));
        Map<String,String> extra=new LinkedHashMap<>();extra.put("search","A & B/é");extra.put("skip","20");
        assertEquals("https://example.org/catalog/series/test/search=A%20%26%20B%2F%C3%A9&skip=20.json",StremioClient.resourceUrl("https://example.org/","catalog","series","test",extra));
        LibraryStore store=new LibraryStore(context());store.switchProfile("default");
        StremioClient.Item item=StremioClient.Item.fromJson(new JSONObject("{\"id\":\"test\",\"type\":\"series\",\"name\":\"Test\",\"videos\":[{\"id\":\"test:1:1\",\"season\":\"1\",\"episode\":\"1\",\"title\":\"Pilot\"}]}"));
        assertEquals(1,StremioClient.Item.fromJson(item.toJson()).videos.size());
        StremioClient.Stream s1=new StremioClient.Stream(),s2=new StremioClient.Stream();
        s1.url="https://one.example/video";s2.url="https://two.example/video";s1.name=s2.name="1080p";
        assertEquals(2,StreamEngine.process(Arrays.asList(s1,s2),store.device).size());
    }

    @Test public void reactTvShellFocusAndNativePlayback()throws Exception{
        Fixture fixture=new Fixture();fixture.start();
        MainActivity activity=null;PlayerActivity playerActivity=null;
        try{
            LibraryStore store=new LibraryStore(context());
            store.device.edit().clear()
                .putString("manifests",new JSONArray().put(fixture.base+"manifest.json").toString())
                .putBoolean("binge",false).apply();
            store.profile("default").edit().clear().apply();

            Intent intent=new Intent(context(),MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity=(MainActivity)ins.startActivitySync(intent);
            final MainActivity main=activity;
            final WebView web=(WebView)field(main,"web");

            waitFor(()->{
                try{
                    String ready=js(web,"document.readyState");
                    String root=js(web,"String(!!document.querySelector('.app-shell'))");
                    return "complete".equals(ready)&&"true".equals(root);
                }catch(Exception e){return false;}
            },60000);

            waitFor(()->{
                try{
                    String focus=js(web,"window.__NOCTURNE_TV__&&window.__NOCTURNE_TV__.focus()");
                    return focus!=null&&!focus.isEmpty();
                }catch(Exception e){return false;}
            },20000);
            String initial=js(web,"window.__NOCTURNE_TV__.focus()");
            assertNotNull("React TV shell owns a focus key",initial);
            shot("01-react-tv-home");

            key(android.view.KeyEvent.KEYCODE_DPAD_DOWN);
            SystemClock.sleep(350);
            String moved=js(web,"window.__NOCTURNE_TV__.focus()");
            assertNotNull(moved);
            assertNotEquals("D-pad must move Norigin focus",initial,moved);
            shot("02-react-tv-dpad");

            Instrumentation.ActivityMonitor monitor=ins.addMonitor(PlayerActivity.class.getName(),null,false);
            String itemJson=fixture.item("fixture0","movie");
            String call="window.NocturneNative.play("+
                JSONObject.quote(fixture.base+"video.mp4")+","+
                JSONObject.quote("Fixture Movie")+","+
                JSONObject.quote("{}")+","+
                JSONObject.quote(itemJson)+","+
                JSONObject.quote("fixture0")+
                ");";
            js(web,call);
            playerActivity=(PlayerActivity)ins.waitForMonitorWithTimeout(monitor,12000);
            assertNotNull("React/native bridge opens Media3 player",playerActivity);
            final PlayerActivity playing=playerActivity;
            waitFor(()->{
                try{ExoPlayer p=(ExoPlayer)field(playing,"player");return p!=null&&p.isPlaying();}
                catch(Exception e){return false;}
            },20000);
            shot("03-native-player");
            SystemClock.sleep(2200);
            ins.runOnMainSync(playing::finish);
            waitFor(()->store.position("movie","fixture0")>0,7000);
            assertTrue("Native playback is recorded under the real media ID",store.position("movie","fixture0")>0);
        }finally{
            if(playerActivity!=null){PlayerActivity p=playerActivity;ins.runOnMainSync(p::finish);}
            if(activity!=null){MainActivity a=activity;ins.runOnMainSync(a::finish);}
            fixture.close();
        }
    }

    private class Fixture {
        ServerSocket server;String base;volatile boolean closed;byte[] video,art;
        Fixture()throws Exception{
            server=new ServerSocket(0);base="http://127.0.0.1:"+server.getLocalPort()+"/";
            try(InputStream in=ins.getContext().getAssets().open("sample.mp4")){
                ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[8192];int n;
                while((n=in.read(b))>0)out.write(b,0,n);video=out.toByteArray();
            }
            Bitmap bitmap=Bitmap.createBitmap(960,540,Bitmap.Config.ARGB_8888);
            Canvas canvas=new Canvas(bitmap);Paint paint=new Paint();
            paint.setShader(new LinearGradient(0,0,960,540,new int[]{0xFF102839,0xFF527364,0xFF131821},null,Shader.TileMode.CLAMP));
            canvas.drawRect(0,0,960,540,paint);paint.setShader(null);paint.setColor(0xFFCEDFD8);paint.setTextSize(58);canvas.drawText("NOCTURNE",470,385,paint);
            ByteArrayOutputStream out=new ByteArrayOutputStream();bitmap.compress(Bitmap.CompressFormat.PNG,100,out);art=out.toByteArray();bitmap.recycle();
        }
        String item(String id,String type){
            return "{\"id\":\""+id+"\",\"type\":\""+type+"\",\"name\":\"Fixture Movie\",\"background\":\""+base+"art.png\",\"poster\":\""+base+"art.png\",\"description\":\"A fixture movie.\",\"releaseInfo\":\"2026\",\"trailerStreams\":[{\"url\":\""+base+"video.mp4\"}],\"videos\":[]}";
        }
        void start(){
            Thread thread=new Thread(()->{while(!closed)try{Socket s=server.accept();new Thread(()->serve(s)).start();}catch(Exception ignored){}});
            thread.setDaemon(true);thread.start();
        }
        void serve(Socket socket){
            try(Socket s=socket){
                BufferedReader r=new BufferedReader(new InputStreamReader(s.getInputStream()));
                String first=r.readLine();if(first==null)return;String path=first.split(" ")[1];
                String line;int start=0;
                while((line=r.readLine())!=null&&!line.isEmpty())if(line.toLowerCase().startsWith("range: bytes="))try{start=Integer.parseInt(line.substring(13).split("-")[0]);}catch(Exception ignored){}
                byte[] bytes;String type="application/json";
                if(path.contains("video.mp4")){bytes=video;type="video/mp4";}
                else if(path.contains("art.png")){bytes=art;type="image/png";}
                else{
                    String json="{}";
                    if(path.contains("manifest.json"))json="{\"id\":\"fixture\",\"name\":\"Fixture\",\"version\":\"1.0\",\"types\":[\"movie\"],\"resources\":[\"catalog\",\"meta\",\"stream\"],\"catalogs\":[{\"type\":\"movie\",\"id\":\"popular\",\"name\":\"Popular\"}]}";
                    else if(path.contains("/catalog/")){StringBuilder list=new StringBuilder("{\"metas\":[");for(int i=0;i<30;i++){if(i>0)list.append(',');list.append(item("fixture"+i,"movie"));}json=list.append("]}").toString();}
                    else if(path.contains("/meta/")){String id=path.substring(path.lastIndexOf('/')+1).replace(".json","");json="{\"meta\":"+item(id,"movie")+"}";}
                    else if(path.contains("/stream/"))json="{\"streams\":[{\"name\":\"Fixture 1080p\",\"url\":\""+base+"video.mp4\"}]}";
                    bytes=json.getBytes("UTF-8");
                }
                start=Math.min(start,bytes.length);
                OutputStream out=s.getOutputStream();
                String head="HTTP/1.1 "+(start>0?"206 Partial Content":"200 OK")+"\r\nContent-Type: "+type+"\r\nContent-Length: "+(bytes.length-start)+"\r\nAccept-Ranges: bytes\r\nAccess-Control-Allow-Origin: *\r\n"+(start>0?"Content-Range: bytes "+start+"-"+(bytes.length-1)+"/"+bytes.length+"\r\n":"")+"Connection: close\r\n\r\n";
                out.write(head.getBytes("UTF-8"));out.write(bytes,start,bytes.length-start);out.flush();
            }catch(Exception ignored){}
        }
        void close()throws Exception{closed=true;server.close();}
    }
}
