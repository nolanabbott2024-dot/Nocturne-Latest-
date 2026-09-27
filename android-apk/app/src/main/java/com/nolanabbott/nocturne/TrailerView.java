package com.nolanabbott.nocturne;

import android.content.Context;
import android.net.Uri;
import android.webkit.*;
import android.widget.*;
import android.view.*;
import androidx.media3.common.*;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.ui.PlayerView;

/** A trailer surface only; the app's pages, state and playback remain native. */
final class TrailerView extends FrameLayout {
    private WebView youtube; private ExoPlayer player;
    TrailerView(Context context,StremioClient.Item item,boolean muted,Runnable failed){super(context);setBackgroundColor(0xFF000000);setFocusable(false);
        if(item.trailerUrl!=null&&!item.trailerUrl.contains("youtube.com")&&!item.trailerUrl.contains("youtu.be")){
            PlayerView surface=new PlayerView(context);surface.setUseController(false);surface.setFocusable(false);addView(surface,new LayoutParams(-1,-1));player=new ExoPlayer.Builder(context).build();surface.setPlayer(player);player.setVolume(muted?0:1);player.setRepeatMode(Player.REPEAT_MODE_ONE);player.addListener(new Player.Listener(){@Override public void onPlayerError(PlaybackException e){failed.run();}});player.setMediaItem(MediaItem.fromUri(item.trailerUrl));player.prepare();player.play();
        }else{
            String id=item.trailerYtId;if(id==null&&item.trailerUrl!=null){Uri u=Uri.parse(item.trailerUrl);id=u.getHost()!=null&&u.getHost().contains("youtu.be")?u.getLastPathSegment():u.getQueryParameter("v");}
            if(id==null||!id.matches("[A-Za-z0-9_-]{11}")){post(failed);return;}
            youtube=new WebView(context);youtube.setBackgroundColor(0xFF000000);youtube.setFocusable(false);youtube.setFocusableInTouchMode(false);youtube.getSettings().setJavaScriptEnabled(true);youtube.getSettings().setMediaPlaybackRequiresUserGesture(false);youtube.getSettings().setDomStorageEnabled(true);youtube.getSettings().setAllowFileAccess(false);youtube.getSettings().setAllowContentAccess(false);youtube.setWebViewClient(new WebViewClient());youtube.setWebChromeClient(new WebChromeClient(){@Override public boolean onConsoleMessage(ConsoleMessage message){if(message.message().startsWith("NOCTURNE_TRAILER_ERROR"))post(failed);return true;}});addView(youtube,new LayoutParams(-1,-1));
            String origin="https://com.nolanabbott.nocturne";
            String html="<!doctype html><meta name='viewport' content='width=device-width,initial-scale=1'><style>html,body,#p{margin:0;width:100%;height:100%;background:black;overflow:hidden}</style><div id='p'></div><script src='https://www.youtube.com/iframe_api'></script><script>function onYouTubeIframeAPIReady(){new YT.Player('p',{width:'100%',height:'100%',videoId:'"+id+"',playerVars:{autoplay:1,playsinline:1,controls:1,rel:0,origin:'"+origin+"'},events:{onReady:function(e){"+(muted?"e.target.mute();":"e.target.unMute();")+"e.target.playVideo()},onError:function(e){console.log('NOCTURNE_TRAILER_ERROR '+e.data)}}})}</script>";
            youtube.loadDataWithBaseURL(origin,html,"text/html","UTF-8",null);
        }
    }
    void release(){if(player!=null){player.release();player=null;}if(youtube!=null){youtube.stopLoading();youtube.loadUrl("about:blank");removeView(youtube);youtube.destroy();youtube=null;}}
    @Override protected void onDetachedFromWindow(){release();super.onDetachedFromWindow();}
}
